from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta, datetime, timezone
import os
import time

from database import get_db
import models, auth
from schemas import UserCreate, UserResponse, ForgotPasswordReq, ResetPasswordReq
from helpers import manager

router = APIRouter(prefix="/api", tags=["authentication"])

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    allowed_roles = ["student", "lecturer"]
    role = user.role if user.role in allowed_roles else "student"
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        avatar_url=f"https://i.pravatar.cc/150?u={user.email}",
        role=role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {
        "id": db_user.id,
        "email": db_user.email,
        "name": db_user.name,
        "avatarUrl": db_user.avatar_url,
        "role": db_user.role
    }

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "avatarUrl": user.avatar_url,
            "role": user.role
        }
    }

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordReq, db: Session = Depends(get_db)):
    import uuid as _uuid
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        # Return success anyway to prevent email enumeration
        return {"message": "If that email exists, a reset token has been generated.", "reset_token": None, "found": False}

    # Invalidate any existing tokens for this user
    db.query(models.PasswordResetToken).filter(models.PasswordResetToken.user_id == user.id).delete()
    db.commit()

    # Generate a new 32-char hex token
    raw_token = _uuid.uuid4().hex + _uuid.uuid4().hex[:8]  # 40-char hex
    expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=30)

    reset_record = models.PasswordResetToken(
        user_id=user.id,
        token=raw_token,
        expires_at=expires_at
    )
    db.add(reset_record)
    db.commit()

    return {
        "message": "Reset token generated. Copy this token and use it to reset your password.",
        "reset_token": raw_token,
        "expires_in_minutes": 30,
        "found": True
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordReq, db: Session = Depends(get_db)):
    record = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == req.token
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    # Check expiry
    # SQLite might return the timestamp as a string; ensure it's a datetime object
    expires_at = record.expires_at
    if isinstance(expires_at, str):
        try:
            # Common format: '2026-05-13 17:24:40.303719'
            expires_at = datetime.fromisoformat(expires_at)
        except ValueError:
            # Fallback for other formats if necessary
            pass

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    
    if expires_at and now > expires_at:
        db.delete(record)
        db.commit()
        raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    # Update the user's password
    user = db.query(models.User).filter(models.User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.hashed_password = auth.get_password_hash(req.new_password)
    db.delete(record)  # Consume the token (one-time use)
    db.commit()

    return {"success": True, "message": "Password has been reset successfully. Please sign in."}

@router.get("/me")
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "avatarUrl": current_user.avatar_url,
        "role": current_user.role
    }

@router.patch("/me")
def update_me(req: dict, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if "name" in req:
        current_user.name = req["name"]
    if "email" in req:
        current_user.email = req["email"]
    db.commit()
    db.refresh(current_user)
    return {"success": True}

@router.post("/me/avatar")
async def upload_avatar(file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Create directory if not exists
    avatar_dir = os.path.join("uploads", "avatars")
    if not os.path.exists(avatar_dir):
        os.makedirs(avatar_dir)
    
    # Generate unique filename
    _fname = file.filename or "avatar.png"
    ext = _fname.split(".")[-1] if "." in _fname else "png"
    filename = f"{current_user.id}_{int(time.time())}.{ext}"
    filepath = os.path.join(avatar_dir, filename)
    
    with open(filepath, "wb") as f:
        f.write(await file.read())
    
    # Update user avatar URL
    current_user.avatar_url = f"/uploads/avatars/{filename}"
    db.commit()
    return {"avatarUrl": current_user.avatar_url}
