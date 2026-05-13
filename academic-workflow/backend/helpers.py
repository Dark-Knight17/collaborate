from fastapi import WebSocket
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone
import asyncio
import models

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

def create_notification_for_others(project: models.Project, exclude_user: models.User, title: str, description: str, n_type: str, db: Session, task_id: Optional[str] = None):
    for member in project.members:
        if member.id != exclude_user.id:
            notif = models.Notification(
                user_id=member.id,
                title=title,
                description=description,
                type=n_type,
                timestamp=datetime.now(timezone.utc),
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
                "timestamp": notif.timestamp.isoformat() if notif.timestamp else None,
                "isRead": notif.is_read,
                "link": notif.link,
                "projectId": notif.project_id,
                "taskId": notif.task_id
            }, member.id))

def log_activity(db: Session, project_id: str, actor: str, action: str, target: str, activity_type: str = "task"):
    """Insert a project activity record."""
    entry = models.ProjectActivity(
        project_id=project_id,
        actor=actor,
        action=action,
        target=target,
        activity_type=activity_type,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(entry)
    db.commit()

def recalculate_project_progress(project_id: str, db: Session):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        return
    if not proj.tasks:
        proj.progress = 0
        db.commit()
        return
    total = len(proj.tasks)
    score = 0
    for t in proj.tasks:
        if t.status == 'in_progress':
            score += 33
        elif t.status == 'review':
            score += 66
        elif t.status == 'completed':
            score += 100
    proj.progress = int(score / total)
    db.commit()
