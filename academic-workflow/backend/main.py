from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

from database import engine, Base
from routers import auth, courses, projects, tasks, misc

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Academic Workflow API - Modular")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# File upload directory (relative to backend/)
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(os.path.join(UPLOADS_DIR, "avatars"), exist_ok=True)
os.makedirs(os.path.join(UPLOADS_DIR, "announcements"), exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(misc.router)

@app.get("/")
def read_root():
    return {"message": "Academic Workflow API is running"}
