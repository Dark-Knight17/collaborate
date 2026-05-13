from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, cast, Any
from datetime import datetime, timedelta

from database import get_db
import models, auth, llm_service
from schemas import TaskUpdate, DescriptionReq, TaskGenerateReq
from helpers import log_activity, create_notification_for_others, recalculate_project_progress

router = APIRouter(prefix="/api", tags=["tasks"])

@router.get("/tasks")
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
                "deadline": t.deadline.isoformat() if t.deadline else None,
                "hasSubmittedFile": t.has_submitted_file,
                "submittedFileName": t.submitted_file_name,
                "assignees": [u.name for u in t.assignees]
            })
            
    return {"tasks": tasks_out}

@router.post("/project/{project_id}/generate-tasks")
def generate_project_tasks(project_id: str, req: TaskGenerateReq, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    
    start_date = datetime.now()
    proj_deadline = proj.due_date
    
    project_duration_days = None
    if proj_deadline:
        duration_delta = (proj_deadline.replace(tzinfo=None) - start_date).days
        if duration_delta > 0:
            project_duration_days = duration_delta

    new_tasks = llm_service.generate_academic_tasks(req.topic, req.context or "", project_duration_days or 14)

    out_tasks = []
    for t in new_tasks:
        deadline = start_date + timedelta(days=t.get("days_offset", 7))
        if proj_deadline and deadline > proj_deadline.replace(tzinfo=None):
            deadline = proj_deadline.replace(tzinfo=None)

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
            "deadline": db_task.deadline.isoformat() if db_task.deadline else None,
            "assignees": []
        })
    create_notification_for_others(proj, current_user, f"{current_user.name} generated AI Tasks", f"{len(new_tasks)} new tasks were generated for '{proj.title}'.", "new_message", db)
    recalculate_project_progress(project_id, db)
    log_activity(db, project_id, cast(str, current_user.name), "regenerated", f"{len(new_tasks)} AI tasks", "project")
    return {"tasks": out_tasks}

@router.post("/tasks/{task_id}/claim")
def claim_task(task_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status == "completed":
        raise HTTPException(status_code=400, detail="Cannot claim a completed task")

    if current_user not in task.assignees:
        task.assignees.append(current_user)

    if task.status == "todo":
        task.status = cast(Any, "in_progress")

    db.commit()
    db.refresh(task)
    create_notification_for_others(task.project, current_user, f"{current_user.name} claimed a task", f"'{task.title}' is now being worked on.", "status_change", db)
    recalculate_project_progress(cast(str, task.project_id), db)
    log_activity(db, cast(str, task.project_id), cast(str, current_user.name), "claimed", cast(str, task.title), "task")
    return {"id": task.id, "status": task.status, "assignees": [u.name for u in task.assignees]}

@router.post("/tasks/{task_id}/drop")
def drop_task(task_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user in task.assignees:
        task.assignees.remove(current_user)

    if len(task.assignees) == 0 and task.status == "in_progress":
        task.status = cast(Any, "todo")

    db.commit()
    db.refresh(task)
    recalculate_project_progress(cast(str, task.project_id), db)
    log_activity(db, cast(str, task.project_id), cast(str, current_user.name), "dropped", cast(str, task.title), "task")
    return {"id": task.id, "status": task.status, "assignees": [u.name for u in task.assignees]}

@router.delete("/tasks/{task_id}")
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

@router.delete("/project/{project_id}/tasks")
def delete_all_project_tasks(project_id: str, db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    count = len(proj.tasks)
    for t in proj.tasks:
        db.delete(t)
    log_activity(db, project_id, "System", "reset", "Project tasks cleared for re-generation", "project")
    db.commit()
    recalculate_project_progress(project_id, db)
    return {"success": True, "deleted": count}

@router.patch("/tasks/{task_id}")
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

@router.post("/tasks/{task_id}/submit")
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

@router.post("/tasks/{task_id}/breakdown")
def breakdown_task(task_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    start_date = datetime.now()
    proj = task.project
    task_deadline = task.deadline or proj.due_date
    
    task_duration_days = None
    if task_deadline:
        duration_delta = (task_deadline.replace(tzinfo=None) - start_date).days
        if duration_delta > 0:
            task_duration_days = duration_delta

    new_tasks_data = llm_service.break_down_task(cast(str, task.title), cast(str, task.description), task_duration_days or 7)
    
    out_tasks = []
    for t in new_tasks_data:
        deadline = start_date + timedelta(days=t.get("days_offset", 7))
        if task_deadline and deadline > task_deadline.replace(tzinfo=None):
            deadline = task_deadline.replace(tzinfo=None)
            
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
            "deadline": db_task.deadline.isoformat() if db_task.deadline else None,
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

@router.post("/project/{project_id}/tasks")
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
        deadline=req.deadline
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
