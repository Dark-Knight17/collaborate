from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from typing import List, Optional, cast, Any
from datetime import timedelta, datetime, timezone
import asyncio
import random
import json
import os
import shutil
import time

from database import engine, Base, get_db
import models
import auth
import llm_service
from pydantic import BaseModel

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Academic Workflow API - DB Backed")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# File upload directory (relative to backend/)
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

# --- Schemas ---
class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: Optional[str] = "student"  # "student" | "lecturer"

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    avatarUrl: str
    role: str
    class Config:
        orm_mode = True

class ProjectCreate(BaseModel):
    topic: str
    course_id: Optional[str] = None
    group_number: Optional[int] = None

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    courseCode: Optional[str] = None
    dueDate: Optional[str] = None
    aiTrackingEnabled: Optional[bool] = None
    minGrade: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[str] = None
    assignees: Optional[List[str]] = None

class DescriptionReq(BaseModel):
    description: str

class TaskGenerateReq(BaseModel):
    topic: str
    context: Optional[str] = ""

# --- Course Schemas ---
class CourseCreate(BaseModel):
    title: str
    course_code: str
    description: Optional[str] = ""

class CourseGroupCreate(BaseModel):
    group_number: int
    member_names: List[str]

class AnnouncementCreate(BaseModel):
    title: str
    body: str
    has_group_assignment: Optional[bool] = False
    groups: Optional[List[dict]] = []  # [{group_number, member_names}]

class AnnouncementFileResponse(BaseModel):
    id: str
    filename: str
    original_name: str
    file_type: str
    file_size: int
    uploaded_at: str

class ForgotPasswordReq(BaseModel):
    email: str

class ResetPasswordReq(BaseModel):
    token: str
    new_password: str

# --- Authentication Endpoints ---
@app.post("/api/register", response_model=UserResponse)
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

@app.post("/api/login")
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

@app.post("/api/forgot-password")
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
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat() + "Z"

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

@app.post("/api/reset-password")
def reset_password(req: ResetPasswordReq, db: Session = Depends(get_db)):
    record = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == req.token
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    # Check expiry
    expiry = datetime.fromisoformat(record.expires_at.replace("Z", ""))
    if datetime.now(timezone.utc) > expiry:
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

@app.get("/api/me")
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "avatarUrl": current_user.avatar_url,
        "role": current_user.role
    }

@app.patch("/api/me")
def update_me(req: dict, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if "name" in req:
        current_user.name = req["name"]
    if "email" in req:
        current_user.email = req["email"]
    db.commit()
    db.refresh(current_user)
    return {"success": True}

@app.post("/api/me/avatar")
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
    # Assuming static files are served at /uploads
    current_user.avatar_url = cast(Any, f"http://localhost:8000/uploads/avatars/{filename}")
    db.commit()
    db.refresh(current_user)
    
    return {"avatarUrl": current_user.avatar_url}

# --- WebSockets ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(message)

manager = ConnectionManager()

# --- Notifications Helper ---
def create_notification_for_others(project: models.Project, exclude_user: models.User, title: str, description: str, n_type: str, db: Session, task_id: Optional[str] = None):
    for member in project.members:
        if member.id != exclude_user.id:
            notif = models.Notification(
                user_id=member.id,
                title=title,
                description=description,
                type=n_type,
                timestamp=datetime.now(timezone.utc).isoformat() + "Z",
                project_id=project.id,
                task_id=task_id
            )
            db.add(notif)
            db.commit()
            db.refresh(notif)
            asyncio.create_task(manager.send_personal_message({
                "id": notif.id,
                "type": notif.type,
                "title": notif.title,
                "description": notif.description,
                "timestamp": notif.timestamp,
                "isRead": notif.is_read,
                "link": notif.link,
                "projectId": notif.project_id,
                "taskId": notif.task_id
            }, member.id))

# --- Progress Helper ---
def recalculate_project_progress(project_id: str, db: Session):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        return
    if not proj.tasks:
        proj.progress = cast(Any, 0)
        db.commit()
        return
    total = len(cast(list, proj.tasks))
    score = 0
    for t in proj.tasks:
        if t.status == 'in_progress':
            score += 33
        elif t.status == 'review':
            score += 66
        elif t.status == 'completed':
            score += 100
    proj.progress = cast(Any, int(score / total))
    db.commit()

# ============================================================
# --- COURSE ENDPOINTS ---
# ============================================================

def _serialize_course(c: models.Course):
    # Groups from CourseGroup mapping
    extracted_groups = {g.group_number for g in c.groups if g.group_number is not None}
    
    # Groups implicitly created from Student Projects
    project_groups = {p.group_number for p in c.projects if p.group_number is not None}
    
    total_groups = len(extracted_groups.union(project_groups))

    return {
        "id": c.id,
        "title": c.title,
        "courseCode": c.course_code,
        "description": c.description,
        "lecturerId": c.lecturer_id,
        "lecturerName": c.lecturer.name if c.lecturer else "",
        "joinCode": c.join_code,
        "studentCount": len(cast(list, c.students)),
        "students": [{"id": s.id, "name": s.name, "email": s.email} for s in c.students],
        "groupCount": total_groups,
    }

@app.post("/api/lecturer/courses")
def create_course(req: CourseCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "lecturer":
        raise HTTPException(status_code=403, detail="Only lecturers can create courses")
    join_code = "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", k=8))
    course = models.Course(
        title=req.title,
        course_code=req.course_code,
        description=req.description,
        lecturer_id=current_user.id,
        join_code=join_code
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return {"course": _serialize_course(course)}

@app.get("/api/lecturer/courses")
def get_lecturer_courses(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "lecturer":
        raise HTTPException(status_code=403, detail="Only lecturers can access this")
    courses = db.query(models.Course).filter(models.Course.lecturer_id == current_user.id).all()

    # Retroactively ensure lecturer is member+admin of every project under their courses
    for course in courses:
        for proj in course.projects:
            changed = False
            if current_user not in proj.members:
                proj.members.append(current_user)
                changed = True
            if current_user not in proj.admins:
                proj.admins.append(current_user)
                changed = True
            if changed:
                db.commit()

    return {"courses": [_serialize_course(c) for c in courses]}

@app.get("/api/courses")
def get_student_courses(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """Courses the current student is enrolled in."""
    return {"courses": [_serialize_course(c) for c in current_user.courses_enrolled]}

@app.get("/api/courses/{course_id}")
def get_course(course_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"course": _serialize_course(course)}

@app.post("/api/courses/join/{join_code}")
def join_course_by_code(join_code: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.join_code == join_code.upper()).first()
    if not course:
        raise HTTPException(status_code=404, detail="No course found with that code.")
    if current_user not in course.students:
        course.students.append(current_user)
        db.commit()
    return {"success": True, "course": _serialize_course(course)}

@app.patch("/api/lecturer/courses/{course_id}")
def update_course(course_id: str, req: CourseCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.lecturer_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    course.title = cast(Any, req.title)
    course.course_code = cast(Any, req.course_code)
    course.description = cast(Any, req.description)
    db.commit()
    return {"course": _serialize_course(course)}

@app.delete("/api/lecturer/courses/{course_id}")
def delete_course(course_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.lecturer_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"success": True}

# ============================================================
# --- COURSE GROUP ENDPOINTS ---
# ============================================================

@app.post("/api/courses/{course_id}/groups")
def create_course_group(course_id: str, req: CourseGroupCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Uniqueness check
    existing = db.query(models.CourseGroup).filter(
        models.CourseGroup.course_id == course_id,
        models.CourseGroup.group_number == req.group_number
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Group {req.group_number} already exists in this course.")
    
    group = models.CourseGroup(
        course_id=course_id,
        group_number=req.group_number,
        member_names=json.dumps(req.member_names),
        created_by=current_user.id
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return {
        "group": {
            "id": group.id,
            "courseId": group.course_id,
            "groupNumber": group.group_number,
            "memberNames": json.loads(cast(str, group.member_names)),
            "createdBy": group.created_by
        }
    }

@app.get("/api/courses/{course_id}/groups")
def get_course_groups(course_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    db_groups = db.query(models.CourseGroup).filter(models.CourseGroup.course_id == course_id).all()
    projects = db.query(models.Project).filter(models.Project.course_id == course_id).all()

    group_map = {}
    for g in db_groups:
        if g.group_number is not None:
            group_map[g.group_number] = {
                "id": g.id,
                "courseId": g.course_id,
                "groupNumber": g.group_number,
                "memberNames": set(json.loads(cast(str, g.member_names))) if g.member_names else set(),
                "createdBy": g.created_by
            }
            
    lecturer_id = course.lecturer_id
            
    for p in projects:
        if p.group_number is not None:
            p_members = [m.name for m in p.members if m.id != lecturer_id]
            if p.group_number not in group_map:
                group_map[p.group_number] = {
                    "id": p.id,
                    "courseId": p.course_id,
                    "groupNumber": p.group_number,
                    "memberNames": set(),
                    "createdBy": p.admins[0].id if p.admins else None
                }
            
            group_map[p.group_number]["memberNames"].update(p_members)
            # Inject project data
            group_map[p.group_number]["projectId"] = p.id
            group_map[p.group_number]["progress"] = p.progress
            group_map[p.group_number]["dueDate"] = p.due_date
            group_map[p.group_number]["memberCount"] = len(cast(list, p.members))
                
    out_groups = []
    for g_num in sorted(group_map.keys()):
        g = group_map[g_num]
        out_groups.append({
            "id": g["id"],
            "courseId": g["courseId"],
            "groupNumber": g["groupNumber"],
            "memberNames": list(g.get("memberNames", [])),
            "createdBy": g.get("createdBy"),
            "projectId": g.get("projectId"),
            "progress": g.get("progress"),
            "dueDate": g.get("dueDate"),
            "memberCount": g.get("memberCount")
        })
        
    return {"groups": out_groups}

@app.get("/api/courses/{course_id}/groups/{group_number}/project")
def get_project_for_group(course_id: str, group_number: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """Resolve a course group number to its associated project ID (used by lecturers for navigation)."""
    proj = db.query(models.Project).filter(
        models.Project.course_id == course_id,
        models.Project.group_number == group_number
    ).first()
    if not proj:
        raise HTTPException(status_code=404, detail="No project found for this group.")
    # Ensure the calling lecturer is a member so they can view the project
    if current_user not in proj.members:
        proj.members.append(current_user)
        db.commit()
    return {"projectId": proj.id}

@app.delete("/api/courses/{course_id}/groups/{group_id}")
def delete_course_group(course_id: str, group_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    group = db.query(models.CourseGroup).filter(models.CourseGroup.id == group_id, models.CourseGroup.course_id == course_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    db.delete(group)
    db.commit()
    return {"success": True}

# ============================================================
# --- ANNOUNCEMENT ENDPOINTS ---
# ============================================================

def _serialize_announcement(a: models.Announcement, db: Session):
    # Fetch groups for this course, ordered by group_number
    db_groups = db.query(models.CourseGroup).filter(
        models.CourseGroup.course_id == a.course_id
    ).all()
    # Also fetch projects for this course to know which groups have projects
    projects = db.query(models.Project).filter(models.Project.course_id == a.course_id).all()
    project_by_group = {p.group_number: p for p in projects if p.group_number is not None}

    groups_data = []
    if a.has_group_assignment:
        for g in sorted(db_groups, key=lambda x: x.group_number or 0):
            proj = project_by_group.get(g.group_number)
            member_names = json.loads(cast(str, g.member_names)) if g.member_names else []
            groups_data.append({
                "id": g.id,
                "groupNumber": g.group_number,
                "memberNames": member_names,
                "memberCount": len(member_names),
                "hasProject": proj is not None,
                "projectId": proj.id if proj else None,
            })

    return {
        "id": a.id,
        "courseId": a.course_id,
        "lecturerId": a.lecturer_id,
        "title": a.title,
        "body": a.body,
        "timestamp": a.timestamp,
        "hasGroupAssignment": a.has_group_assignment,
        "groups": groups_data,
        "files": [{
            "id": f.id,
            "filename": f.filename,
            "originalName": f.original_name,
            "fileType": f.file_type,
            "fileSize": f.file_size,
            "uploadedAt": f.uploaded_at
        } for f in a.files]
    }

@app.put("/api/courses/{course_id}/groups/{group_id}/join")
def join_course_group(course_id: str, group_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """Student joins a group by adding their name to member_names."""
    # Check if user is already in ANY group in this course
    all_course_groups = db.query(models.CourseGroup).filter(models.CourseGroup.course_id == course_id).all()
    for g in all_course_groups:
        members = json.loads(cast(str, g.member_names)) if g.member_names else []
        if current_user.name in members:
            raise HTTPException(status_code=400, detail="You are already a member of another group in this course")

    group = db.query(models.CourseGroup).filter(
        models.CourseGroup.id == group_id,
        models.CourseGroup.course_id == course_id
    ).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    member_names = json.loads(cast(str, group.member_names)) if group.member_names else []
    if current_user.name not in member_names:
        member_names.append(current_user.name)
        group.member_names = cast(Any, json.dumps(member_names))
        db.commit()
        db.refresh(group)
    return {
        "group": {
            "id": group.id,
            "courseId": group.course_id,
            "groupNumber": group.group_number,
            "memberNames": json.loads(cast(str, group.member_names)),
        }
    }

@app.post("/api/courses/{course_id}/announcements")
def create_announcement(course_id: str, req: AnnouncementCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "lecturer":
        raise HTTPException(status_code=403, detail="Only lecturers can post announcements")
    
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    ann = models.Announcement(
        course_id=course_id,
        lecturer_id=current_user.id,
        title=req.title,
        body=req.body,
        timestamp=datetime.now().isoformat(),
        has_group_assignment=req.has_group_assignment
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    
    # If group assignments included, create CourseGroups
    errors = []
    if req.has_group_assignment and req.groups:
        for g_data in req.groups:
            g_num = g_data.get("group_number")
            g_members = g_data.get("member_names", [])
            if g_num is None:
                continue
            existing = db.query(models.CourseGroup).filter(
                models.CourseGroup.course_id == course_id,
                models.CourseGroup.group_number == g_num
            ).first()
            if existing:
                # Update members instead of failing
                existing.member_names = cast(Any, json.dumps(g_members))
                db.commit()
            else:
                group = models.CourseGroup(
                    course_id=course_id,
                    group_number=g_num,
                    member_names=json.dumps(g_members),
                    created_by=current_user.id
                )
                db.add(group)
                db.commit()
    
    return {
        "announcement": _serialize_announcement(ann, db),
        "errors": errors
    }

@app.get("/api/courses/{course_id}/announcements")
def get_course_announcements(course_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    announcements = db.query(models.Announcement).filter(
        models.Announcement.course_id == course_id
    ).order_by(models.Announcement.timestamp.desc()).all()
    return {
        "announcements": [_serialize_announcement(a, db) for a in announcements]
    }

@app.post("/api/courses/{course_id}/announcements/{ann_id}/files")
async def upload_announcement_file(
    course_id: str,
    ann_id: str,
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    ann = db.query(models.Announcement).filter(models.Announcement.id == ann_id, models.Announcement.course_id == course_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    # Ensure directory exists
    upload_dir = "uploads/announcements"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
        
    _fname = file.filename or "upload"
    ext = _fname.split(".")[-1] if "." in _fname else ""
    safe_name = f"{ann_id}_{random.randint(1000, 9999)}_{file.filename}"
    file_path = os.path.join(upload_dir, safe_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_file = models.AnnouncementFile(
        announcement_id=ann_id,
        filename=safe_name,
        original_name=file.filename,
        file_type=ext,
        file_size=0, # shutil.copyfileobj doesn't return size, would need to stat
        uploaded_at=datetime.now().isoformat()
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    return {"id": db_file.id, "filename": db_file.filename}

@app.delete("/api/courses/{course_id}/announcements/{ann_id}")
def delete_announcement(course_id: str, ann_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    ann = db.query(models.Announcement).filter(models.Announcement.id == ann_id, models.Announcement.course_id == course_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    db.delete(ann)
    db.commit()
    return {"success": True}

# ============================================================
# --- PROJECT ENDPOINTS ---
# ============================================================
@app.get("/api/projects")
def get_all_projects(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    all_projects = db.query(models.Project).all()

    # For lecturers: also include all projects under their courses
    lecturer_course_ids = set()
    if current_user.role == "lecturer":
        taught = db.query(models.Course).filter(models.Course.lecturer_id == current_user.id).all()
        lecturer_course_ids = {c.id for c in taught}

    user_projects = []
    for p in all_projects:
        is_member = current_user in p.members or current_user in p.admins
        is_course_owner = p.course_id and p.course_id in lecturer_course_ids
        if is_member or is_course_owner:
            # Retroactively add lecturer as member+admin if missing
            if is_course_owner and current_user not in p.members:
                p.members.append(current_user)
                p.admins.append(current_user)
                db.commit()
            user_projects.append(p)

    out = []
    for p in user_projects:
        lec_names: list[str] = []
        if p.course_id:
            _c = db.query(models.Course).filter(models.Course.id == p.course_id).first()
            if _c and _c.lecturer:
                lec_names = [_c.lecturer.name]
        out.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "courseCode": p.course_code,
            "dueDate": p.due_date,
            "progress": p.progress,
            "aiTrackingEnabled": p.ai_tracking_enabled,
            "minGrade": p.min_grade,
            "members": [m.name for m in p.members],
            "admins": [a.name for a in p.admins if a.role != "lecturer"],
            "lecturerNames": lec_names,
            "joinCode": p.join_code,
            "courseId": p.course_id,
            "groupNumber": p.group_number,
        })
    return {"projects": out}

@app.post("/api/project")
def create_project(req: ProjectCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Group uniqueness enforcement
    if req.course_id and req.group_number is not None:
        existing_group_proj = db.query(models.Project).filter(
            models.Project.course_id == req.course_id,
            models.Project.group_number == req.group_number
        ).first()
        if existing_group_proj:
            raise HTTPException(
                status_code=409,
                detail=f"Group {req.group_number} already has a project in this course. Choose a different group number."
            )
    
    db_proj = models.Project(
        title=req.topic,
        join_code="".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", k=8)),
        course_id=req.course_id,
        group_number=req.group_number
    )
    db_proj.members.append(current_user)
    db_proj.admins.append(current_user)

    # Auto-add the course lecturer as a viewer (member only, never admin)
    if req.course_id:
        course = db.query(models.Course).filter(models.Course.id == req.course_id).first()
        if course and course.lecturer and course.lecturer != current_user:
            db_proj.members.append(course.lecturer)

    db.add(db_proj)
    db.commit()
    db.refresh(db_proj)
    return {
        "project_id": db_proj.id,
        "topic": db_proj.title,
        "courseId": db_proj.course_id,
        "groupNumber": db_proj.group_number
    }

@app.get("/api/tasks")
def get_tasks(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    all_projects = db.query(models.Project).all()
    user_projects = [p for p in all_projects if current_user in p.members or current_user in p.admins]
    
    tasks_out = []
    for p in user_projects:
        for t in p.tasks:
            tasks_out.append({
                "id": t.id,
                "projectId": t.project_id,
                "title": t.title,
                "description": t.description,
                "status": t.status,
                "priority": t.priority,
                "deadline": t.deadline,
                "hasSubmittedFile": t.has_submitted_file,
                "submittedFileName": t.submitted_file_name,
                "assignees": [u.name for u in t.assignees]
            })
            
    return {"tasks": tasks_out}

@app.get("/api/project/{project_id}")
def get_project(project_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    # If the caller is a lecturer who owns the course this project belongs to,
    # add them as member+admin right now so the frontend sees them as a member.
    if current_user.role == "lecturer" and proj.course_id:
        course = db.query(models.Course).filter(
            models.Course.id == proj.course_id,
            models.Course.lecturer_id == current_user.id
        ).first()
        if course:
            changed = False
            if current_user not in proj.members:
                proj.members.append(current_user)
                changed = True
            # Ensure lecturer is NOT in admins — viewer only
            if current_user in proj.admins:
                proj.admins.remove(current_user)
                changed = True
            if changed:
                db.commit()
                db.refresh(proj)

    tasks_out = []
    for t in proj.tasks:
        tasks_out.append({
            "id": t.id,
            "projectId": t.project_id,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "priority": t.priority,
            "deadline": t.deadline,
            "hasSubmittedFile": t.has_submitted_file,
            "submittedFileName": t.submitted_file_name,
            "assignees": [u.name for u in t.assignees]
        })

    # Collect lecturer names for this project so the frontend can protect them
    lecturer_names: list[str] = []
    if proj.course_id:
        _course = db.query(models.Course).filter(models.Course.id == proj.course_id).first()
        if _course and _course.lecturer:
            lecturer_names = [_course.lecturer.name]

    return {
        "project": {
            "id": proj.id,
            "title": proj.title,
            "description": proj.description,
            "courseCode": proj.course_code,
            "dueDate": proj.due_date,
            "progress": proj.progress,
            "members": [m.name for m in proj.members],
            "admins": [a.name for a in proj.admins if a.role != "lecturer"],
            "lecturerNames": lecturer_names,
            "courseId": proj.course_id,
            "groupNumber": proj.group_number,
        },
        "tasks": tasks_out
    }

@app.post("/api/project/{project_id}/join")
def join_project(project_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user not in proj.members:
        proj.members.append(current_user)
        db.commit()
        log_activity(db, project_id, cast(str, current_user.name), "joined", cast(str, proj.title), "member")
    return {"success": True}

@app.post("/api/join/{join_code}")
def join_project_by_code(join_code: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.join_code == join_code.upper()).first()
    if not proj:
        raise HTTPException(status_code=404, detail="No project found with that code.")
    
    if current_user not in proj.members:
        proj.members.append(current_user)
        db.commit()
    return {"success": True, "project_id": proj.id, "title": proj.title}

@app.delete("/api/project/{project_id}/leave")
def leave_project(project_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user in proj.admins and len(cast(list, proj.admins)) == 1 and len(cast(list, proj.members)) > 1:
        # If there are other members, you must transfer admin rights
        raise HTTPException(status_code=400, detail="You are the only admin. Transfer admin rights before leaving.")

    # Remove from Project
    if current_user in proj.members:
        proj.members.remove(current_user)
    if current_user in proj.admins:
        proj.admins.remove(current_user)

    # Sync with CourseGroup if linked
    if proj.course_id and proj.group_number:
        group = db.query(models.CourseGroup).filter(
            models.CourseGroup.course_id == proj.course_id,
            models.CourseGroup.group_number == proj.group_number
        ).first()
        if group:
            members = json.loads(cast(str, group.member_names)) if group.member_names else []
            if current_user.name in members:
                members.remove(current_user.name)
                group.member_names = cast(Any, json.dumps(members))
                
                # Fetch lecturer name to exclude from student count
                course = db.query(models.Course).filter(models.Course.id == proj.course_id).first()
                lecturer_name = course.lecturer.name if course and course.lecturer else "Lecturer"
                
                # If no more STUDENTS left, reset the group status
                students_left = [m for m in members if m != lecturer_name]
                if len(students_left) == 0:
                    # Reset the group project status by deleting the project
                    db.delete(proj)
                    pass

    db.commit()
    # Note: If we deleted 'proj', we can't log activity for it using its id
    # So we log it before if we are about to delete
    return {"success": True}

# ============================================================
# --- FILE LIBRARY ENDPOINTS ---
# ============================================================

def log_activity(db: Session, project_id: str, actor: str, action: str, target: str, activity_type: str = "task"):
    """Insert a project activity record."""
    entry = models.ProjectActivity(
        project_id=project_id,
        actor=actor,
        action=action,
        target=target,
        activity_type=activity_type,
        timestamp=datetime.now(timezone.utc).isoformat() + "Z"  # Z = UTC, prevents browser timezone shift
    )
    db.add(entry)
    db.commit()

@app.post("/api/project/{project_id}/files")
async def upload_project_file(
    project_id: str,
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    if current_user not in proj.members and current_user not in proj.admins:
        raise HTTPException(status_code=403, detail="Not a project member")

    contents = await file.read()
    original_name = file.filename or "upload"
    ext = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else ""
    from models import gen_id
    stored_name = f"{gen_id()}_{original_name}"

    proj_dir = os.path.join(UPLOADS_DIR, project_id)
    os.makedirs(proj_dir, exist_ok=True)
    db_file = models.ProjectFile(
        project_id=project_id,
        filename=stored_name,
        original_name=original_name,
        file_type=ext,
        file_size=len(contents),
        uploaded_by=current_user.name,
        uploaded_at=datetime.now(timezone.utc).isoformat()
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    dest = os.path.join(proj_dir, stored_name)
    with open(dest, "wb") as f:
        f.write(contents)

    log_activity(db, project_id, cast(str, current_user.name), "uploaded", cast(str, original_name), "file")

    return {
        "id": db_file.id,
        "originalName": db_file.original_name,
        "fileType": db_file.file_type,
        "fileSize": db_file.file_size,
        "uploadedBy": db_file.uploaded_by,
        "uploadedAt": db_file.uploaded_at,
    }

@app.get("/api/project/{project_id}/files")
def list_project_files(
    project_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    files = db.query(models.ProjectFile).filter(models.ProjectFile.project_id == project_id).all()
    return {"files": [
        {
            "id": f.id,
            "originalName": f.original_name,
            "fileType": f.file_type,
            "fileSize": f.file_size,
            "uploadedBy": f.uploaded_by,
            "uploadedAt": f.uploaded_at,
        } for f in files
    ]}

@app.get("/api/project/{project_id}/files/{file_id}/download")
def download_project_file(
    project_id: str,
    file_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db_file = db.query(models.ProjectFile).filter(
        models.ProjectFile.id == file_id,
        models.ProjectFile.project_id == project_id
    ).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    path = os.path.join(UPLOADS_DIR, project_id, cast(str, db_file.filename))
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File missing from storage")
    return FileResponse(path, filename=cast(str, db_file.original_name), media_type="application/octet-stream")

@app.delete("/api/project/{project_id}/files/{file_id}")
def delete_project_file(
    project_id: str,
    file_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db_file = db.query(models.ProjectFile).filter(
        models.ProjectFile.id == file_id,
        models.ProjectFile.project_id == project_id
    ).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    path = os.path.join(UPLOADS_DIR, project_id, cast(str, db_file.filename))
    if os.path.exists(path):
        os.remove(path)
    name = db_file.original_name
    db.delete(db_file)
    db.commit()
    log_activity(db, project_id, cast(str, current_user.name), "deleted", cast(str, name), "file")
    return {"success": True}

@app.get("/api/project/{project_id}/activity")
def get_project_activity(
    project_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    entries = (
        db.query(models.ProjectActivity)
        .filter(models.ProjectActivity.project_id == project_id)
        .order_by(models.ProjectActivity.timestamp.desc())
        .limit(50)
        .all()
    )
    return {"activity": [
        {
            "id": e.id,
            "actor": e.actor,
            "action": e.action,
            "target": e.target,
            "activityType": e.activity_type,
            "timestamp": e.timestamp,
        } for e in entries
    ]}

@app.get("/api/activity")
def get_global_activity(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    all_projects = db.query(models.Project).all()
    
    lecturer_course_ids = set()
    if current_user.role == "lecturer":
        taught = db.query(models.Course).filter(models.Course.lecturer_id == current_user.id).all()
        lecturer_course_ids = {c.id for c in taught}

    user_project_ids = []
    for p in all_projects:
        is_member = current_user in p.members or current_user in p.admins
        is_course_owner = p.course_id and p.course_id in lecturer_course_ids
        if is_member or is_course_owner:
            user_project_ids.append(p.id)

    if not user_project_ids:
        return {"activity": []}

    entries = (
        db.query(models.ProjectActivity)
        .filter(models.ProjectActivity.project_id.in_(user_project_ids))
        .order_by(models.ProjectActivity.timestamp.desc())
        .limit(50)
        .all()
    )
    
    out = []
    for e in entries:
        out.append({
            "id": e.id,
            "projectId": e.project_id,
            "projectTitle": e.project.title if e.project else "Unknown Project",
            "actor": e.actor,
            "action": e.action,
            "target": e.target,
            "activityType": e.activity_type,
            "timestamp": e.timestamp,
        })
    return {"activity": out}

@app.patch("/api/project/{project_id}")
def update_project(project_id: str, req: ProjectUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if req.title is not None: proj.title = cast(Any, req.title)
    if req.description is not None: proj.description = cast(Any, req.description)
    if req.courseCode is not None: proj.course_code = cast(Any, req.courseCode)
    if req.dueDate is not None: proj.due_date = cast(Any, req.dueDate)
    if req.aiTrackingEnabled is not None: proj.ai_tracking_enabled = cast(Any, req.aiTrackingEnabled)
    if req.minGrade is not None: proj.min_grade = cast(Any, req.minGrade)
        
    db.commit()
    create_notification_for_others(proj, current_user, f"{current_user.name} updated project details", f"Project '{proj.title}' was updated.", "project_update", db)
    return {"success": True}

@app.delete("/api/project/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(proj)
    db.commit()
    return {"success": True}

@app.post("/api/project/{project_id}/generate-tasks")
async def generate_tasks(project_id: str, req: TaskGenerateReq, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    
    start_date = datetime.now()
    proj_deadline = proj.due_date.strip() if proj and proj.due_date else None
    
    project_duration_days = None
    if proj_deadline:
        try:
            deadline_date = datetime.strptime(proj_deadline, "%Y-%m-%d")
            duration_delta = (deadline_date - start_date).days
            if duration_delta > 0:
                project_duration_days = duration_delta
        except ValueError:
            pass

    new_tasks = llm_service.generate_academic_tasks(req.topic, req.context or "", project_duration_days or 14)
    
    out_tasks = []
    for t in new_tasks:
        deadline = (start_date + timedelta(days=t.get("days_offset", 7))).strftime("%Y-%m-%d")
        if proj_deadline and deadline > proj_deadline:
            deadline = proj_deadline
            
        db_task = models.Task(
            project_id=project_id,
            title=t.get("title", "Task"),
            description=t.get("description", ""),
            status=t.get("status", "todo"),
            priority=t.get("priority", "medium"),
            deadline=deadline,
            assignees=[]
        )
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        
        out_tasks.append({
            "id": db_task.id,
            "projectId": project_id,
            "title": db_task.title,
            "description": db_task.description,
            "status": db_task.status,
            "priority": db_task.priority,
            "deadline": db_task.deadline,
            "assignees": []
        })
    create_notification_for_others(proj, current_user, f"{current_user.name} generated AI Tasks", f"{len(new_tasks)} new tasks were generated for '{proj.title}'.", "new_message", db)
    recalculate_project_progress(project_id, db)
    log_activity(db, project_id, cast(str, current_user.name), "regenerated", f"{len(new_tasks)} AI tasks", "project")
    return {"tasks": out_tasks}

# --- Descriptions & Tasks ---
@app.post("/api/generate-description")
async def generate_description(req: DescriptionReq):
    text = req.description.strip()
    refined = llm_service.generate_academic_description(text)
    return {"description": refined}

@app.post("/api/tasks/{task_id}/claim")
def claim_task(task_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status == "completed":
        raise HTTPException(status_code=400, detail="Cannot claim a completed task")

    # Add user as assignee if not already there
    if current_user not in task.assignees:
        task.assignees.append(current_user)

    # Move to in_progress if it's still in todo
    if task.status == "todo":
        task.status = cast(Any, "in_progress")

    db.commit()
    db.refresh(task)
    create_notification_for_others(task.project, current_user, f"{current_user.name} claimed a task", f"'{task.title}' is now being worked on.", "status_change", db)
    recalculate_project_progress(cast(str, task.project_id), db)
    log_activity(db, cast(str, task.project_id), cast(str, current_user.name), "claimed", cast(str, task.title), "task")
    return {"id": task.id, "status": task.status, "assignees": [u.name for u in task.assignees]}

@app.post("/api/tasks/{task_id}/drop")
def drop_task(task_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user in task.assignees:
        task.assignees.remove(current_user)

    # Reset to todo only when nobody is left assigned
    if len(cast(list, task.assignees)) == 0 and task.status == "in_progress":
        task.status = cast(Any, "todo")

    db.commit()
    db.refresh(task)
    recalculate_project_progress(cast(str, task.project_id), db)
    log_activity(db, cast(str, task.project_id), cast(str, current_user.name), "dropped", cast(str, task.title), "task")
    return {"id": task.id, "status": task.status, "assignees": [u.name for u in task.assignees]}

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    project_id = task.project_id
    task_title = task.title
    db.delete(task)
    db.commit()
    recalculate_project_progress(cast(str, project_id), db)
    log_activity(db, cast(str, project_id), "System", "deleted", cast(str, task_title), "task")
    return {"success": True}

@app.delete("/api/project/{project_id}/tasks")
def delete_all_project_tasks(project_id: str, db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    for t in proj.tasks:
        db.delete(t)
    log_activity(db, project_id, "System", "reset", "Project tasks cleared for re-generation", "project")
    db.commit()
    recalculate_project_progress(project_id, db)
    return {"success": True, "deleted": len(cast(list, proj.tasks))}

@app.patch("/api/tasks/{task_id}")
def update_task(task_id: str, req: TaskUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    action_str = "updated a task"
    detail_str = f"Task '{task.title}' was updated."

    is_status_change = req.status is not None and req.status != task.status
    is_assignee_change = req.assignees is not None 
    
    if is_status_change:
        if req.status == "in_progress":
            action_str = "started working on a task"
            detail_str = f"Task '{task.title}' is now in progress."
        elif req.status == "review":
            action_str = "sent a task for review"
            detail_str = f"Task '{task.title}' is ready for review."
        elif req.status == "completed":
            action_str = "completed a task"
            detail_str = f"Task '{task.title}' was completed."
        else:
            action_str = f"changed a task status to {req.status}"
            detail_str = f"Task '{task.title}' status was updated."
    elif is_assignee_change:
        action_str = "updated task assignees"
        detail_str = f"Assignees for '{task.title}' were modified."

    if req.title is not None: task.title = cast(Any, req.title)
    if req.description is not None: task.description = cast(Any, req.description)
    if req.status is not None: task.status = cast(Any, req.status)
    if req.priority is not None: task.priority = cast(Any, req.priority)
    if req.deadline is not None: task.deadline = cast(Any, req.deadline)
    if req.assignees is not None:
        db_users = db.query(models.User).filter(models.User.name.in_(req.assignees)).all()
        task.assignees = db_users
        
    db.commit()
    create_notification_for_others(task.project, current_user, f"{current_user.name} {action_str}", detail_str, "status_change", db)
    recalculate_project_progress(cast(str, task.project_id), db)
    log_activity(db, cast(str, task.project_id), cast(str, current_user.name), action_str.split(" ")[0] if is_status_change else "updated", cast(str, task.title), "task")
    return {"success": True}

@app.post("/api/tasks/{task_id}/submit")
async def submit_task(task_id: str, file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    file_bytes = await file.read()
    
    scan_result = llm_service.analyze_submission(
        file_bytes=file_bytes,
        filename=file.filename or "submission",
        task_title=cast(str, task.title),
        task_description=cast(str, task.description) or ""
    )
    
    ai_pct = scan_result.get("ai_percentage", -1)
    coherency = scan_result.get("coherency_score", -1)
    relevance = scan_result.get("relevance_score", -1)
    recommendation = scan_result.get("recommendation", "manual_review")
    feedback = scan_result.get("feedback", "")
    
    # Rejection logic: Only factor in ai_pct if ai_tracking_enabled is True for the project.
    # We ignore the LLM's raw 'recommendation' and re-calculate it based on scores to ensure project settings are honored.
    is_hard_reject = (
        (relevance >= 0 and relevance < 60) or
        (ai_pct >= 0 and ai_pct > 50 and task.project.ai_tracking_enabled) or
        (coherency >= 0 and coherency < 40)
    )
    
    if not is_hard_reject:
        task.status = cast(Any, "review")
        task.has_submitted_file = cast(Any, True)
        task.submitted_file_name = cast(Any, file.filename)
        if relevance >= 0 and relevance < 75:
            recommendation = "manual_review"
    else:
        recommendation = "reject"
        if relevance >= 0 and relevance < 60 and "relevance" not in feedback.lower():
            feedback = f"Relevance score of {relevance}% is below the minimum threshold. " + feedback

    db.commit()
    
    notif_msg = f"File '{file.filename}' uploaded to '{task.title}'."
    if recommendation == "reject":
        notif_msg += " ⚠️ Rejected by AI integrity scan."
    create_notification_for_others(task.project, current_user, f"{current_user.name} submitted a file for review", notif_msg, "status_change", db)
    recalculate_project_progress(cast(str, task.project_id), db)
    log_activity(db, cast(str, task.project_id), cast(str, current_user.name), "submitted", cast(str, task.title), "task")
    
    return {
        "success": True,
        "recommendation": recommendation,
        "ai_percentage": ai_pct,
        "coherency_score": coherency,
        "relevance_score": relevance,
        "feedback": feedback
    }

@app.post("/api/tasks/{task_id}/breakdown")
def breakdown_task(task_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    start_date = datetime.now()
    proj = task.project
    proj_deadline = proj.due_date.strip() if proj and proj.due_date else None
    task_deadline = task.deadline.strip() if task.deadline else proj_deadline
    
    task_duration_days = None
    if task_deadline:
        try:
            deadline_date = datetime.strptime(task_deadline, "%Y-%m-%d")
            duration_delta = (deadline_date - start_date).days
            if duration_delta > 0:
                task_duration_days = duration_delta
        except ValueError:
            pass

    new_tasks_data = llm_service.break_down_task(cast(str, task.title), cast(str, task.description), task_duration_days or 7)
    
    out_tasks = []
    for t in new_tasks_data:
        deadline = (start_date + timedelta(days=t.get("days_offset", 7))).strftime("%Y-%m-%d")
        if task_deadline and deadline > task_deadline:
            deadline = task_deadline
            
        db_task = models.Task(
            project_id=task.project_id,
            title=t.get("title", "Task"),
            description=t.get("description", ""),
            status=t.get("status", "todo"),
            priority=t.get("priority", "medium"),
            deadline=deadline
        )
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        out_tasks.append({
            "id": db_task.id,
            "projectId": task.project_id,
            "title": db_task.title,
            "description": db_task.description,
            "status": db_task.status,
            "priority": db_task.priority,
            "deadline": db_task.deadline,
            "hasSubmittedFile": False,
            "submittedFileName": "",
            "assignees": []
        })
        
    db.delete(task)
    db.commit()
    
    create_notification_for_others(proj, current_user, f"{current_user.name} broke down a task", f"Task '{task.title}' was broken down into {len(new_tasks_data)} subtasks.", "new_message", db)
    recalculate_project_progress(proj.id, db)
    log_activity(db, cast(str, task.project_id), cast(str, current_user.name), "broke down", cast(str, task.title), "task")
    return {"tasks": out_tasks}

@app.post("/api/project/{project_id}/tasks")
def create_task(project_id: str, req: TaskUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
        
    db_task = models.Task(
        project_id=project_id,
        title=req.title or "New Task",
        description=req.description or "",
        status=req.status or "todo",
        priority=req.priority or "medium",
        deadline=req.deadline or ""
    )
    if req.assignees:
        db_users = db.query(models.User).filter(models.User.name.in_(req.assignees)).all()
        db_task.assignees = db_users

    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    create_notification_for_others(proj, current_user, f"{current_user.name} created a task", f"New task '{db_task.title}' was added.", "status_change", db)
    recalculate_project_progress(cast(str, db_task.project_id), db)
    log_activity(db, cast(str, db_task.project_id), cast(str, current_user.name), "created", cast(str, db_task.title), "task")
    return {"success": True, "id": db_task.id}

# --- Notifications ---
@app.get("/api/notifications")
def get_notifications(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    notifs = db.query(models.Notification).filter(models.Notification.user_id == current_user.id).order_by(models.Notification.timestamp.desc()).all()
    out = []
    for n in notifs:
        out.append({
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "description": n.description,
            "timestamp": n.timestamp,
            "isRead": n.is_read,
            "link": n.link,
            "projectId": n.project_id,
            "taskId": n.task_id
        })
    return {"notifications": out}

@app.post("/api/notifications/mark-read")
def mark_notifications_read(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    notifs = db.query(models.Notification).filter(models.Notification.user_id == current_user.id, models.Notification.is_read == False).all()
    for n in notifs:
        n.is_read = cast(Any, True)
    db.commit()
    return {"success": True}

@app.websocket("/api/ws/notifications/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
