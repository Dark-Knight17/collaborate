from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, cast, Any
import random
import json
import os
from datetime import datetime, timezone

from database import get_db
import models, auth
from schemas import ProjectCreate, ProjectUpdate
from helpers import log_activity, create_notification_for_others

router = APIRouter(prefix="/api", tags=["projects"])

# Use the absolute path for uploads directory
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")

@router.get("/projects")
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
            "dueDate": p.due_date.isoformat() if p.due_date else None,
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

@router.post("/project")
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

@router.get("/project/{project_id}")
def get_project(project_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

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
            "deadline": t.deadline.isoformat() if t.deadline else None,
            "hasSubmittedFile": t.has_submitted_file,
            "submittedFileName": t.submitted_file_name,
            "assignees": [u.name for u in t.assignees]
        })

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
            "dueDate": proj.due_date.isoformat() if proj.due_date else None,
            "progress": proj.progress,
            "members": [m.name for m in proj.members],
            "admins": [a.name for a in proj.admins if a.role != "lecturer"],
            "lecturerNames": lecturer_names,
            "courseId": proj.course_id,
            "groupNumber": proj.group_number,
        },
        "tasks": tasks_out
    }

@router.post("/project/{project_id}/join")
def join_project(project_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user not in proj.members:
        proj.members.append(current_user)
        db.commit()
        log_activity(db, project_id, cast(str, current_user.name), "joined", cast(str, proj.title), "member")
    return {"success": True}

@router.post("/join/{join_code}")
def join_project_by_code(join_code: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.join_code == join_code.upper()).first()
    if not proj:
        raise HTTPException(status_code=404, detail="No project found with that code.")
    
    if current_user not in proj.members:
        proj.members.append(current_user)
        db.commit()
    return {"success": True, "project_id": proj.id, "title": proj.title}

@router.delete("/project/{project_id}/leave")
def leave_project(project_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user in proj.admins and len(proj.admins) == 1 and len(proj.members) > 1:
        raise HTTPException(status_code=400, detail="You are the only admin. Transfer admin rights before leaving.")

    if current_user in proj.members:
        proj.members.remove(current_user)
    if current_user in proj.admins:
        proj.admins.remove(current_user)

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
                
                course = db.query(models.Course).filter(models.Course.id == proj.course_id).first()
                lecturer_name = course.lecturer.name if course and course.lecturer else "Lecturer"
                
                students_left = [m for m in members if m != lecturer_name]
                if len(students_left) == 0:
                    db.delete(proj)

    db.commit()
    return {"success": True}

@router.post("/project/{project_id}/files")
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
        uploaded_at=datetime.now(timezone.utc)
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
        "uploadedAt": db_file.uploaded_at.isoformat() if db_file.uploaded_at else None,
    }

@router.get("/project/{project_id}/files")
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
            "uploadedAt": f.uploaded_at.isoformat() if f.uploaded_at else None,
        } for f in files
    ]}

@router.get("/project/{project_id}/files/{file_id}/download")
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

@router.delete("/project/{project_id}/files/{file_id}")
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

@router.get("/project/{project_id}/activity")
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
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
        } for e in entries
    ]}

@router.patch("/project/{project_id}")
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

@router.delete("/project/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(proj)
    db.commit()
    return {"success": True}
