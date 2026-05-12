from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

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
    dueDate: Optional[datetime] = None
    aiTrackingEnabled: Optional[bool] = None
    minGrade: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[datetime] = None
    assignees: Optional[List[str]] = None

class DescriptionReq(BaseModel):
    description: str

class TaskGenerateReq(BaseModel):
    topic: str
    context: Optional[str] = ""

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
    uploaded_at: Any # Changed from str to Any since we changed to DateTime in models

class ForgotPasswordReq(BaseModel):
    email: str

class ResetPasswordReq(BaseModel):
    token: str
    new_password: str
