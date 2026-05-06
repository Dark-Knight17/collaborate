import os
import io
import zipfile
import re
import tempfile
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
import json
import logging

_ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=_ENV_PATH, override=True)

class TaskItem(BaseModel):
    title: str = Field(description="The title of the task milestone.")
    description: str = Field(description="A brief description of what this task entails.")
    status: str = Field(pattern="^(todo|in_progress|review|completed)$", description="Always 'todo'")
    priority: str = Field(pattern="^(high|medium|low)$", description="The priority of this task.")
    days_offset: int = Field(description="Number of days from the start this should be due.")

class TaskResponse(BaseModel):
    tasks: list[TaskItem]

class SubmissionAnalysis(BaseModel):
    reasoning: str = Field(description="Step-by-step audit: (1) exact deliverables the task requires, (2) what the submission actually contains, (3) which requirements are met vs missing, (4) justification for each score. Must be completed before scores are assigned.")
    ai_percentage: int = Field(description="Estimated percentage of AI-generated content (0–100). Base this on your reasoning above.")
    coherency_score: int = Field(description="How logically structured and internally consistent the document is (0–100). Base this on your reasoning above.")
    relevance_score: int = Field(description="How well the submission fulfils the SPECIFIC task requirements (0–100). Must be consistent with the gaps identified in your reasoning. If key deliverables are missing, this CANNOT be above 50.")
    recommendation: str = Field(pattern="^(approve|reject|manual_review)$", description="Derived strictly from the scores: reject if relevance<60 or ai>50 or coherency<40; manual_review if relevance 60-74 or ai 20-50; approve only if relevance>=75 and ai<=20 and coherency>=60.")
    feedback: str = Field(description="2-3 sentence academic feedback referencing specific task requirements and what was/wasn't addressed.")

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """Extract plain text from PDF, DOCX, or text files."""
    ext = filename.lower().split('.')[-1]
    try:
        if ext == "pdf":
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(file_bytes))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        elif ext == "docx":
            # DOCX is a ZIP file; extract word/document.xml for text
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
                xml = z.read("word/document.xml").decode("utf-8")
            return re.sub(r'<[^>]+>', ' ', xml).strip()
        else:
            # Treat .py, .txt, etc. as plain text
            return file_bytes.decode("utf-8", errors="ignore")
    except Exception as e:
        logging.warning(f"Text extraction failed for {filename}: {e}")
        return ""

# MIME type map for Gemini file uploads
MIME_TYPES = {
    "pdf":  "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "doc":  "application/msword",
    "png":  "image/png",
    "jpg":  "image/jpeg",
    "jpeg": "image/jpeg",
    "txt":  "text/plain",
    "py":   "text/plain",
}

def analyze_submission(file_bytes: bytes, filename: str, task_title: str, task_description: str) -> dict:
    """Use Gemini multimodal API to analyse a student submission.
    
    The file is uploaded directly to Gemini so that visual content such as
    ERD diagrams, charts, and drawings embedded inside PDFs or DOCX files
    are fully visible to the model — not just the extracted text layer.
    """
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        logging.warning("GEMINI_API_KEY missing. Cannot perform real scan.")
        return {
            "ai_percentage": -1,
            "coherency_score": -1,
            "relevance_score": -1,
            "recommendation": "manual_review",
            "feedback": "Scanning service offline: no GEMINI_API_KEY configured. Manual review required."
        }

    ext = filename.lower().rsplit('.', 1)[-1]
    mime_type = MIME_TYPES.get(ext, "application/octet-stream")
    has_description = bool(task_description and task_description.strip())
    task_context_block = (
        f'- Task Description: "{task_description}"'
        if has_description
        else "- Task Description: (not provided — assess relevance against the task title only)"
    )

    prompt = f"""You are a strict academic integrity assessor. The student's submission is provided above.
Gemini Vision: You MUST visually inspect the provided file. It may contain text, tables, images, and diagrams (like ERDs, flowcharts, or architecture diagrams). Your analysis MUST account for both text AND visual content.

=== TASK REQUIREMENTS ===
- Task Title: "{task_title}"
{task_context_block}

=== MANDATORY 4-STEP AUDIT (complete ALL steps in the `reasoning` field before assigning scores) ===

STEP 1 — TASK DECONSTRUCTION
List every specific requirement and deliverable the task demands. Be explicit.
Example: "Task requires: (a) an ERD diagram; (b) entity list; (c) cardinality explanations."

STEP 2 — SUBMISSION INVENTORY
List what the submission ACTUALLY contains.
Example: "Submission contains: 3 pages of text; 1 embedded PNG image of a database schema; 2 tables."
If you see an image but cannot determine its content, describe its appearance.

STEP 3 — GAP ANALYSIS
Compare Step 1 vs Step 2. State EXPLICITLY: PRESENT / PARTIAL / MISSING for each requirement.
NOTE: If a task requires a diagram (like an ERD) and there is an image in the submission that depicts a diagram related to the topic, mark it as PRESENT even if it has minimal text.

STEP 4 — SCORE JUSTIFICATION
Derive scores DIRECTLY from Step 3:
- relevance_score: (number of PRESENT items / total requirements) × 100.
- coherency_score: rate structure and clarity.
- ai_percentage: estimate AI authorship from text patterns. (Note: Hand-drawn or unique diagrams often lower this score).

=== SCORING RULES ===

relevance_score:
- ≥ 75 → All or almost all task requirements are PRESENT (including diagrams)
- 60–74 → Most requirements present but notable gaps
- 40–59 → Significant gaps; key deliverables (like a required diagram) are missing
- < 40 → Submission does not address the task

CRITICAL: If the task title contains "ERD" or "Diagram" and the submission contains a relevant image/diagram, the relevance_score MUST be at least 60 even if the text is brief.

recommendation:
- "reject" if: relevance_score < 60 OR ai_percentage > 50 OR coherency_score < 40
- "manual_review" if: relevance_score 60–74 OR ai_percentage 20–50
- "approve" ONLY if: relevance_score ≥ 75 AND ai_percentage ≤ 20 AND coherency_score ≥ 60

feedback: 2-3 sentences. If a diagram was found, explicitly mention it (e.g., "The ERD diagram was correctly identified and addresses the requirements").

Return your full audit as a JSON object (reasoning field first, then scores)."""

    try:
        client = genai.Client(api_key=api_key)

        # Upload the raw file so Gemini can see all visual content
        suffix = f".{ext}"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            uploaded = client.files.upload(
                file=tmp_path,
                config=types.UploadFileConfig(mime_type=mime_type, display_name=filename)
            )
        finally:
            os.unlink(tmp_path)

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[uploaded, prompt],
            config={
                'response_mime_type': 'application/json',
                'response_schema': SubmissionAnalysis,
                'temperature': 0.05
            }
        )

        # Clean up uploaded file from Gemini servers
        try:
            client.files.delete(name=uploaded.name)
        except Exception:
            pass

        data = json.loads(response.text)
        return data

    except Exception as e:
        logging.error(f"Submission analysis failed: {e}")
        # Fallback: try text-only analysis so something is returned
        try:
            text = extract_text_from_file(file_bytes, filename)
            truncated = text[:6000]
            word_count = len(text.split())
            fallback_prompt = prompt + f"\n\n=== SUBMISSION TEXT (visual content unavailable) ===\n---\n{truncated}\n---"
            client2 = genai.Client(api_key=api_key)
            resp2 = client2.models.generate_content(
                model='gemini-2.5-flash',
                contents=fallback_prompt,
                config={
                    'response_mime_type': 'application/json',
                    'response_schema': SubmissionAnalysis,
                    'temperature': 0.05
                }
            )
            return json.loads(resp2.text)
        except Exception as e2:
            logging.error(f"Fallback text analysis also failed: {e2}")
            return {
                "ai_percentage": -1,
                "coherency_score": -1,
                "relevance_score": -1,
                "recommendation": "manual_review",
                "feedback": "Scan could not be completed due to a service error. Manual review recommended."
            }

def generate_academic_tasks(topic: str, context: str, project_duration_days: int = None) -> list:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logging.warning("GEMINI_API_KEY is missing. Falling back to mock data.")
        return get_mock_tasks(topic)
        
    try:
        client = genai.Client(api_key=api_key)
        
        duration_clause = (
            f"The total project duration is {project_duration_days} days. Assign an ascending chronological days_offset for each task that realistically distributes the workload across this entire {project_duration_days}-day period."
        ) if project_duration_days and project_duration_days > 0 else (
            "Determine an appropriate priority relative to the scope of each task and assign an chronological ascending days_offset for the schedule (e.g. 2, 5, 10...)."
        )
        
        prompt = f"""
        Act as an expert academic research advisor. An academic project is being created.
        Topic: "{topic}"
        Additional Context / Deliverables: "{context}"

        Please break down this academic project into exactly 5 to 7 distinct, sequential tasks aligned with standard academic research.
        Use common structural milestones (e.g. Introduction/Background, Literature Review, Methodology, Analysis, Conclusion, APA Formatting).
        {duration_clause}
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': TaskResponse,
                'temperature': 0.2
            },
        )
        
        data = json.loads(response.text)
        return data.get("tasks", [])
    except Exception as e:
        logging.error(f"LLM Task Generation failed: {e}")
        return get_mock_tasks(topic)


def get_mock_tasks(topic: str):
    return [
        {"title": "⚠️ AI DEGRADED: Missing API Key", "description": "The backend LLM service is offline or missing a valid GEMINI_API_KEY in the .env file. Please add your key and restart the uvicorn server.", "status": "todo", "priority": "high", "days_offset": 0},
        {"title": f"Fallback: Literature Review for {topic}", "description": "System fell back to generic static subtasks.", "status": "todo", "priority": "medium", "days_offset": 2}
    ]

def generate_academic_description(context: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "A rigorous academic investigation analyzing the provided context through structured frameworks. The ultimate objective is to synthesize emerging correlations into insights."
        
    try:
        client = genai.Client(api_key=api_key)
        
        prompt = f"""
        Act as an expert academic research advisor. Extract and summarize the core thesis of the following project details.
        Output exactly one succinct, 2-to-3 sentence analytical paragraph. Do not use any line breaks, markdown, or bullet points. It must fit in a dense description block.
        
        Details:
        {context}
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={'temperature': 0.3}
        )
        
        return response.text.replace('\n', ' ').strip()
    except Exception as e:
        logging.error(f"LLM Description failed: {e}")
        return "An intelligent academic investigation focused on analyzing complex correlations to deliver actionable insights."

def break_down_task(title: str, description: str, task_duration_days: int = None) -> list:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logging.warning("GEMINI_API_KEY missing, using mock breakdown.")
        return [
            {"title": f"[Subtask] {title} - Part 1", "description": "Auto-generated mock subtask.", "status": "todo", "priority": "medium", "days_offset": 1},
            {"title": f"[Subtask] {title} - Part 2", "description": "Auto-generated mock subtask.", "status": "todo", "priority": "medium", "days_offset": 2}
        ]
        
    try:
        client = genai.Client(api_key=api_key)
        
        duration_clause = (
            f"The available time to complete this task is {task_duration_days} days. Assign an ascending chronological days_offset for each subtask that realistically distributes the workload across this {task_duration_days}-day period."
        ) if task_duration_days and task_duration_days > 0 else (
            "Provide appropriate priority and assign chronological ascending days_offset (e.g. 1, 3, 5)."
        )
        
        prompt = f"""
        Act as an expert academic research advisor and project manager.
        You have been asked to break down the following broad individual task into exactly 2 to 5 highly specific, actionable subtasks.
        Original Task Title: "{title}"
        Original Task Description: "{description}"

        Break this down into manageable subtasks. {duration_clause}
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': TaskResponse,
                'temperature': 0.2
            },
        )
        
        data = json.loads(response.text)
        return data.get("tasks", [])
    except Exception as e:
        logging.error(f"LLM Task Breakdown failed: {e}")
        return [
            {"title": f"[Fallback] {title} - Part 1", "description": "Fallback subtask generation.", "status": "todo", "priority": "medium", "days_offset": 1},
            {"title": f"[Fallback] {title} - Part 2", "description": "Fallback subtask generation.", "status": "todo", "priority": "medium", "days_offset": 2}
        ]
