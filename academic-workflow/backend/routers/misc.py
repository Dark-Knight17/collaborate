from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import cast
from datetime import datetime, timezone

from database import get_db
import models, auth, llm_service
from schemas import DescriptionReq
from helpers import manager

router = APIRouter(prefix="/api", tags=["misc"])

@router.post("/generate-description")
async def generate_description(req: DescriptionReq):
    text = req.description.strip()
    refined = llm_service.generate_academic_description(text)
    return {"description": refined}

@router.get("/notifications")
def get_notifications(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    notifs = db.query(models.Notification).filter(models.Notification.user_id == current_user.id).order_by(models.Notification.timestamp.desc()).all()
    out = []
    for n in notifs:
        out.append({
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "description": n.description,
            "timestamp": n.timestamp.isoformat() if n.timestamp else None,
            "isRead": n.is_read,
            "link": n.link,
            "projectId": n.project_id,
            "taskId": n.task_id
        })
    return {"notifications": out}

@router.post("/notifications/mark-read")
def mark_notifications_read(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    notifs = db.query(models.Notification).filter(models.Notification.user_id == current_user.id, models.Notification.is_read == False).all()
    for n in notifs:
        n.is_read = cast(Any, True)
    db.commit()
    return {"success": True}

@router.websocket("/ws/notifications/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

@router.get("/activity")
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
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
        })
    return {"activity": out}
