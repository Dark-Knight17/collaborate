from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, cast, Any
import random
import json
import os
import shutil
from datetime import datetime

from database import get_db
import models, auth
from schemas import CourseCreate, CourseGroupCreate, AnnouncementCreate

router = APIRouter(prefix="/api", tags=["courses"])

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
        "studentCount": len(c.students),
        "students": [{"id": s.id, "name": s.name, "email": s.email} for s in c.students],
        "groupCount": total_groups,
    }

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
        "timestamp": a.timestamp.isoformat() if a.timestamp else None,
        "hasGroupAssignment": a.has_group_assignment,
        "groups": groups_data,
        "files": [{
            "id": f.id,
            "filename": f.filename,
            "originalName": f.original_name,
            "fileType": f.file_type,
            "fileSize": f.file_size,
            "uploadedAt": f.uploaded_at.isoformat() if f.uploaded_at else None
        } for f in a.files]
    }

@router.post("/lecturer/courses")
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

@router.get("/lecturer/courses")
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

@router.get("/courses")
def get_student_courses(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """Courses the current student is enrolled in."""
    return {"courses": [_serialize_course(c) for c in current_user.courses_enrolled]}

@router.get("/courses/{course_id}")
def get_course(course_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"course": _serialize_course(course)}

@router.post("/courses/join/{join_code}")
def join_course_by_code(join_code: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.join_code == join_code.upper()).first()
    if not course:
        raise HTTPException(status_code=404, detail="No course found with that code.")
    if current_user not in course.students:
        course.students.append(current_user)
        db.commit()
    return {"success": True, "course": _serialize_course(course)}

@router.patch("/lecturer/courses/{course_id}")
def update_course(course_id: str, req: CourseCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.lecturer_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    course.title = cast(Any, req.title)
    course.course_code = cast(Any, req.course_code)
    course.description = cast(Any, req.description)
    db.commit()
    return {"course": _serialize_course(course)}

@router.delete("/lecturer/courses/{course_id}")
def delete_course(course_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.lecturer_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"success": True}

@router.post("/courses/{course_id}/groups")
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

@router.get("/courses/{course_id}/groups")
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
            group_map[p.group_number]["dueDate"] = p.due_date.isoformat() if p.due_date else None
            group_map[p.group_number]["memberCount"] = len(p.members)
                
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

@router.get("/courses/{course_id}/groups/{group_number}/project")
def get_project_for_group(course_id: str, group_number: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
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

@router.delete("/courses/{course_id}/groups/{group_id}")
def delete_course_group(course_id: str, group_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    group = db.query(models.CourseGroup).filter(models.CourseGroup.id == group_id, models.CourseGroup.course_id == course_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    db.delete(group)
    db.commit()
    return {"success": True}

@router.put("/courses/{course_id}/groups/{group_id}/join")
def join_course_group(course_id: str, group_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
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

@router.post("/courses/{course_id}/announcements")
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
        timestamp=datetime.now(),
        has_group_assignment=req.has_group_assignment
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    
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
        "errors": []
    }

@router.get("/courses/{course_id}/announcements")
def get_course_announcements(course_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    announcements = db.query(models.Announcement).filter(
        models.Announcement.course_id == course_id
    ).order_by(models.Announcement.timestamp.desc()).all()
    return {
        "announcements": [_serialize_announcement(a, db) for a in announcements]
    }

@router.post("/courses/{course_id}/announcements/{ann_id}/files")
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
        file_size=0,
        uploaded_at=datetime.now()
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    return {"id": db_file.id, "filename": db_file.filename}

@router.delete("/courses/{course_id}/announcements/{ann_id}")
def delete_announcement(course_id: str, ann_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    ann = db.query(models.Announcement).filter(models.Announcement.id == ann_id, models.Announcement.course_id == course_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    db.delete(ann)
    db.commit()
    return {"success": True}
