from typing import List, Dict, Any

SYSTEM_INSTRUCTION = """
You are an Academic Research Architect. Your goal is to decompose a complex research topic 
into a series of actionable, high-integrity tasks. Each task must include:
1. Title (Concise)
2. Priority (High/Medium/Low)
3. Domain (e.g., Data, Ethics, Literature, Implementation)
"""

TEMPLATES = {
    "STEM": [
        {"title": "Gather background research and examples for {topic}", "priority": "high"},
        {"title": "Find and organize the data we need for {topic}", "priority": "high"},
        {"title": "Set up the testing environment and plan our experiments", "priority": "medium"},
        {"title": "Build and tweak the main model or prototype", "priority": "medium"},
        {"title": "Create charts and write up the final {deliverable}", "priority": "low"},
    ],
    "HUMANITIES": [
        {"title": "Find and read primary sources and background info for {topic}", "priority": "high"},
        {"title": "Organize and highlight the most important quotes or themes", "priority": "high"},
        {"title": "Outline our main argument and perspective on {topic}", "priority": "medium"},
        {"title": "Write the first complete draft of the {deliverable}", "priority": "medium"},
        {"title": "Proofread, check citations, and finalize the {deliverable}", "priority": "low"},
    ],
    "SOCIAL_SCIENCES": [
        {"title": "Define our research question and get approval if needed for {topic}", "priority": "high"},
        {"title": "Create and test our survey or interview questions", "priority": "high"},
        {"title": "Collect responses and analyze the survey data for {topic}", "priority": "medium"},
        {"title": "Discuss what our findings mean in the real world", "priority": "medium"},
        {"title": "Draft the final {deliverable} with our recommendations", "priority": "low"},
    ]
}

def get_blueprint_tasks(topic: str, context: str = "") -> List[Dict[str, Any]]:
    # Simple logic to choose a template based on keywords
    topic_lower = topic.lower() + context.lower()
    
    if any(k in topic_lower for k in ["data", "model", "science", "math", "physics", "finance", "quantum", "tech", "code"]):
        base = TEMPLATES["STEM"]
    elif any(k in topic_lower for k in ["ethics", "society", "policy", "survey", "human", "psychology", "business"]):
        base = TEMPLATES["SOCIAL_SCIENCES"]
    else:
        base = TEMPLATES["HUMANITIES"]
        
    # Extract "deliverable" from context string naive parsing
    deliverable = ""
    if "deliverable:" in context.lower():
        parts = context.lower().split("deliverable:")
        if len(parts) > 1:
            deliverable = parts[1].split(".")[0].strip()
            
    # Clean topic for insertion
    display_topic = topic.strip()
    if not display_topic:
        display_topic = "this project"
        
    display_deliverable = deliverable if deliverable else "project"

    tasks = []
    for t in base:
        title = t["title"].replace("{topic}", display_topic).replace("{deliverable}", display_deliverable)
        
        tasks.append({
            "title": title,
            "priority": t["priority"],
            "status": "todo",
            "assignee": None
        })
        
    return tasks
