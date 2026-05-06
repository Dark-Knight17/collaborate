from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, Table, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
import uuid
import random

def gen_id():
    chars = "0123456789abcdef"
    return "".join(random.choices(chars, k=8))

# --- Association Tables ---
project_member_association = Table(
    'project_members',
    Base.metadata,
    Column('user_id', String, ForeignKey('users.id')),
    Column('project_id', String, ForeignKey('projects.id'))
)

project_admin_association = Table(
    'project_admins',
    Base.metadata,
    Column('user_id', String, ForeignKey('users.id')),
    Column('project_id', String, ForeignKey('projects.id'))
)

task_assignee_association = Table(
    'task_assignees',
    Base.metadata,
    Column('user_id', String, ForeignKey('users.id')),
    Column('task_id', String, ForeignKey('tasks.id'))
)

course_enrollment_association = Table(
    'course_enrollments',
    Base.metadata,
    Column('user_id', String, ForeignKey('users.id')),
    Column('course_id', String, ForeignKey('courses.id'))
)

# --- Models ---
class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_id)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    avatar_url = Column(String, default="https://i.pravatar.cc/150")
    role = Column(String, default="student")  # "student" | "lecturer"
    
    projects = relationship("Project", secondary=project_member_association, back_populates="members")
    admin_of = relationship("Project", secondary=project_admin_association, back_populates="admins")
    tasks = relationship("Task", secondary=task_assignee_association, back_populates="assignees")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    
    # Lecturer relations
    courses_taught = relationship("Course", back_populates="lecturer")
    courses_enrolled = relationship("Course", secondary=course_enrollment_association, back_populates="students")

class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, default=gen_id)
    title = Column(String)
    description = Column(String, default="")
    course_code = Column(String, default="")
    due_date = Column(String, default="")
    progress = Column(Integer, default=0)
    ai_tracking_enabled = Column(Boolean, default=False)
    min_grade = Column(Integer, default=65)
    join_code = Column(String, default="")
    # Group tracking
    course_id = Column(String, ForeignKey("courses.id"), nullable=True)
    group_number = Column(Integer, nullable=True)
    
    members = relationship("User", secondary=project_member_association, back_populates="projects")
    admins = relationship("User", secondary=project_admin_association, back_populates="admin_of")
    tasks = relationship("Task", back_populates="project")
    course = relationship("Course", back_populates="projects")
    files = relationship("ProjectFile", back_populates="project", cascade="all, delete-orphan")
    activity = relationship("ProjectActivity", back_populates="project", cascade="all, delete-orphan", order_by="ProjectActivity.timestamp.desc()")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(String, primary_key=True, default=gen_id)
    project_id = Column(String, ForeignKey("projects.id"))
    title = Column(String)
    description = Column(String, default="")
    status = Column(String, default="todo")  # todo, in_progress, review, completed
    priority = Column(String, default="medium")
    deadline = Column(String, default="")
    has_submitted_file = Column(Boolean, default=False)
    submitted_file_name = Column(String, default="")
    
    project = relationship("Project", back_populates="tasks")
    assignees = relationship("User", secondary=task_assignee_association, back_populates="tasks")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"))
    type = Column(String, default="status_change")
    title = Column(String)
    description = Column(String, default="")
    timestamp = Column(String, default="")
    is_read = Column(Boolean, default=False)
    link = Column(String, default="")
    project_id = Column(String, nullable=True)
    task_id = Column(String, nullable=True)
    
    user = relationship("User", back_populates="notifications")

class Course(Base):
    __tablename__ = "courses"
    id = Column(String, primary_key=True, default=gen_id)
    title = Column(String)
    course_code = Column(String)
    description = Column(String, default="")
    lecturer_id = Column(String, ForeignKey("users.id"))
    join_code = Column(String, default="")
    
    lecturer = relationship("User", back_populates="courses_taught")
    students = relationship("User", secondary=course_enrollment_association, back_populates="courses_enrolled")
    groups = relationship("CourseGroup", back_populates="course", cascade="all, delete-orphan")
    announcements = relationship("Announcement", back_populates="course", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="course")

class CourseGroup(Base):
    __tablename__ = "course_groups"
    id = Column(String, primary_key=True, default=gen_id)
    course_id = Column(String, ForeignKey("courses.id"))
    group_number = Column(Integer)
    member_names = Column(Text, default="")  # JSON array of names
    created_by = Column(String, ForeignKey("users.id"))
    
    course = relationship("Course", back_populates="groups")
    
    __table_args__ = (
        UniqueConstraint('course_id', 'group_number', name='uq_course_group'),
    )

class Announcement(Base):
    __tablename__ = "announcements"
    id = Column(String, primary_key=True, default=gen_id)
    course_id = Column(String, ForeignKey("courses.id"))
    lecturer_id = Column(String, ForeignKey("users.id"))
    title = Column(String)
    body = Column(Text, default="")
    timestamp = Column(String, default="")
    has_group_assignment = Column(Boolean, default=False)
    
    files = relationship("AnnouncementFile", back_populates="announcement", cascade="all, delete-orphan")
    course = relationship("Course", back_populates="announcements")

class AnnouncementFile(Base):
    __tablename__ = "announcement_files"
    id = Column(String, primary_key=True, default=gen_id)
    announcement_id = Column(String, ForeignKey("announcements.id"))
    filename = Column(String)
    original_name = Column(String)
    file_type = Column(String, default="")   # extension e.g. "pdf"
    file_size = Column(Integer, default=0)   # bytes
    uploaded_at = Column(String, default="") # ISO timestamp

    announcement = relationship("Announcement", back_populates="files")

class ProjectFile(Base):
    __tablename__ = "project_files"
    id = Column(String, primary_key=True, default=gen_id)
    project_id = Column(String, ForeignKey("projects.id"))
    filename = Column(String)
    original_name = Column(String)
    file_type = Column(String, default="")   # extension e.g. "pdf"
    file_size = Column(Integer, default=0)   # bytes
    uploaded_by = Column(String, default="") # user name
    uploaded_at = Column(String, default="") # ISO timestamp

    project = relationship("Project", back_populates="files")

class ProjectActivity(Base):
    __tablename__ = "project_activity"
    id = Column(String, primary_key=True, default=gen_id)
    project_id = Column(String, ForeignKey("projects.id"))
    actor = Column(String, default="")       # user name
    action = Column(String, default="")      # e.g. "completed", "uploaded"
    target = Column(String, default="")      # e.g. task title or file name
    activity_type = Column(String, default="task") # "task" | "file" | "member"
    timestamp = Column(String, default="")

    project = relationship("Project", back_populates="activity")
