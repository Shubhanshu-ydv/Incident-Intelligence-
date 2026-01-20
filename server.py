"""
Incident Intelligence - FastAPI Backend Server
===============================================
API layer with Supabase CRUD + Pathway RAG proxy.

ARCHITECTURE:
  UI → FastAPI (CRUD/Search) → Supabase (writes)
  UI → FastAPI → Pathway (RAG reads)

NOTE: Pathway remains READ-ONLY. All writes go to Supabase via this server.
"""

import os
import logging
from datetime import datetime
from typing import List, Optional
from dotenv import load_dotenv

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configuration
PATHWAY_URL = "http://localhost:8081/v2/answer"
PATHWAY_INCIDENTS_URL = "http://localhost:8082/incidents"
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")

# Default IDs until auth is implemented (Priority 4)
# Using existing UUIDs from Supabase to pass RLS
DEFAULT_ORG_ID = "24bae8af-2d39-4a91-ab94-59be032a8e23"
DEFAULT_USER_ID = "a3204998-c81b-487b-9763-bcf58e80da4d"

# Initialize FastAPI
app = FastAPI(
    title="Incident Intelligence API",
    description="CRUD + RAG Proxy for Incident Management",
    version="4.0.0"
)

# Enable CORS for React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Supabase REST API Helper
# ============================================================

def supabase_headers():
    """Get headers for Supabase REST API calls."""
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }


def supabase_request(method: str, endpoint: str, data: dict = None, params: dict = None):
    """Make a request to Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    response = requests.request(
        method=method,
        url=url,
        headers=supabase_headers(),
        json=data,
        params=params,
        timeout=10
    )
    if not response.ok:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json() if response.text else None


# ============================================================
# Request/Response Models
# ============================================================

class ChatMessage(BaseModel):
    sender: str
    message: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    response: str
    timestamp: str
    mode: Optional[str] = "reasoning"  # reasoning, keyword, crud
    dataSource: Optional[str] = "Supabase"
    contextSize: Optional[int] = None  # Number of incidents used as context
    incidentRefs: Optional[List[str]] = None  # Incident IDs referenced


class CreateIncidentRequest(BaseModel):
    title: str
    description: str
    severity: str  # critical, high, medium, low
    status: str    # open, investigating, resolved
    location: str


class UpdateIncidentRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    assignee_id: Optional[str] = None


class IncidentResponse(BaseModel):
    id: str
    title: str
    description: str
    severity: str
    status: str
    location: str
    createdAt: str
    updatedAt: str
    timeline: List[dict] = []
    aiInsights: List[str] = []


# ============================================================
# Helper Functions
# ============================================================

def transform_incident(inc: dict) -> dict:
    """Transform Supabase incident to frontend format."""
    return {
        "id": inc.get("incident_id", inc.get("id", "unknown")),
        "title": inc.get("title", "Untitled"),
        "description": inc.get("description", ""),
        "severity": inc.get("severity", "medium"),
        "status": inc.get("status", "open"),
        "location": inc.get("location", "Unknown"),
        "createdAt": inc.get("created_at", inc.get("timestamp", datetime.now().isoformat())),
        "updatedAt": inc.get("updated_at", inc.get("timestamp", datetime.now().isoformat())),
        "timeline": [],
        "aiInsights": []
    }


# ============================================================
# WebSocket Connection Manager
# ============================================================

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients."""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                disconnected.append(connection)
        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


# ============================================================
# Root & Health Endpoints
# ============================================================

@app.get("/")
async def root():
    return {
        "message": "Incident Intelligence API v4.0",
        "architecture": "UI → FastAPI (CRUD) → Supabase | UI → FastAPI → Pathway (RAG)",
        "endpoints": {
            "crud": "/api/incidents",
            "search": "/api/incidents/search",
            "chat": "/api/chat",
            "websocket": "/ws/incidents"
        }
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    pathway_status = "unknown"
    supabase_status = "unknown"
    
    # Check Pathway
    try:
        resp = requests.get("http://localhost:8081/", timeout=2)
        pathway_status = "running" if resp.ok else "error"
    except:
        pathway_status = "unreachable"
    
    # Check Supabase
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/",
            headers={"apikey": SUPABASE_KEY},
            timeout=2
        )
        supabase_status = "connected" if resp.ok else "error"
    except:
        supabase_status = "unreachable"
    
    return {
        "status": "healthy",
        "service": "Incident Intelligence API",
        "pathway": pathway_status,
        "supabase": supabase_status
    }


# ============================================================
# PRIORITY 1: CRUD Operations
# ============================================================

@app.get("/api/incidents")
async def get_incidents():
    """
    Get all active incidents.
    Fetches from Pathway cache for consistency with RAG.
    """
    try:
        response = requests.get(PATHWAY_INCIDENTS_URL, timeout=10)
        response.raise_for_status()
        incidents = response.json()
        return [transform_incident(inc) for inc in incidents]
    except requests.exceptions.ConnectionError:
        # Pathway not running - fall back to direct Supabase query
        try:
            result = supabase_request(
                "GET", "incidents",
                params={"deleted_at": "is.null", "order": "created_at.desc"}
            )
            return [transform_incident(inc) for inc in result]
        except:
            return []
    except Exception:
        return []


@app.get("/api/live-updates")
async def get_live_updates():
    """
    Get recent incident updates/changes for the Live Updates section.
    Returns the most recently updated incidents as update events.
    """
    try:
        # Fetch incidents ordered by updated_at descending
        result = supabase_request(
            "GET", "incidents",
            params={
                "deleted_at": "is.null",
                "order": "updated_at.desc",
                "limit": "10"
            }
        )
        
        updates = []
        for inc in result:
            # Determine update type based on status
            status = inc.get("status", "open")
            if status == "resolved":
                update_type = "resolved"
            elif status == "investigating":
                update_type = "status_change"
            elif inc.get("created_at") == inc.get("updated_at"):
                update_type = "new_incident"
            else:
                update_type = "status_change"
            
            updates.append({
                "id": f"update-{inc.get('incident_id', inc.get('id'))}",
                "type": update_type,
                "incidentId": inc.get("incident_id", inc.get("id")),
                "message": f"{inc.get('title', 'Incident')} - {status}",
                "timestamp": inc.get("updated_at", inc.get("created_at"))
            })
        
        return updates
    except Exception as e:
        print(f"Error fetching live updates: {e}")
        return []


@app.post("/api/incidents", response_model=IncidentResponse)
async def create_incident(request: CreateIncidentRequest):
    """
    Create a new incident in Supabase.
    Pathway will pick it up on next polling cycle.
    """
    # Generate incident ID: INC-YYYYMMDD-HHMMSS
    timestamp = datetime.now()
    incident_id = f"INC-{timestamp.strftime('%Y%m%d')}-{timestamp.strftime('%H%M%S')}"
    
    data = {
        "incident_id": incident_id,
        "title": request.title,
        "description": request.description,
        "severity": request.severity,
        "status": request.status,
        "location": request.location,
        "organization_id": DEFAULT_ORG_ID,
        "reporter_id": DEFAULT_USER_ID,
        "timestamp": timestamp.isoformat(),
        "created_at": timestamp.isoformat(),
        "updated_at": timestamp.isoformat()
    }
    
    result = supabase_request("POST", "incidents", data=data)
    incident = result[0] if isinstance(result, list) else result
    
    # Broadcast to WebSocket clients
    await manager.broadcast({
        "type": "incident_created",
        "incident_id": incident_id,
        "timestamp": timestamp.isoformat()
    })
    
    return transform_incident(incident)


@app.patch("/api/incidents/{incident_id}", response_model=IncidentResponse)
async def update_incident(incident_id: str, request: UpdateIncidentRequest):
    """
    Update an existing incident in Supabase.
    """
    # Build update data (only include non-None fields)
    data = {}
    if request.title is not None:
        data["title"] = request.title
    if request.description is not None:
        data["description"] = request.description
    if request.severity is not None:
        data["severity"] = request.severity
    if request.status is not None:
        data["status"] = request.status
        # Set resolved_at if status is resolved
        if request.status == "resolved":
            data["resolved_at"] = datetime.now().isoformat()
    if request.location is not None:
        data["location"] = request.location
    if request.assignee_id is not None:
        data["assignee_id"] = request.assignee_id
    
    # Always update updated_at
    data["updated_at"] = datetime.now().isoformat()
    
    # Update in Supabase
    result = supabase_request(
        "PATCH", f"incidents?incident_id=eq.{incident_id}",
        data=data
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    incident = result[0] if isinstance(result, list) else result
    
    # Broadcast to WebSocket clients
    await manager.broadcast({
        "type": "incident_updated",
        "incident_id": incident_id,
        "changes": list(data.keys()),
        "timestamp": datetime.now().isoformat()
    })
    
    return transform_incident(incident)


@app.post("/api/incidents/{incident_id}/soft-delete")
async def soft_delete_incident(incident_id: str):
    """
    Soft delete an incident by setting deleted_at.
    """
    data = {
        "deleted_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    result = supabase_request(
        "PATCH", f"incidents?incident_id=eq.{incident_id}",
        data=data
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Broadcast to WebSocket clients
    await manager.broadcast({
        "type": "incident_deleted",
        "incident_id": incident_id,
        "timestamp": datetime.now().isoformat()
    })
    
    return {"success": True, "incident_id": incident_id}


# Keep backward compatibility with existing UI DELETE method
@app.delete("/api/incidents/{incident_id}")
async def delete_incident(incident_id: str):
    """Alias for soft-delete to maintain UI compatibility."""
    return await soft_delete_incident(incident_id)


# ============================================================
# PRIORITY 2: Keyword Search
# ============================================================

@app.get("/api/incidents/search")
async def search_incidents(q: str = Query(..., min_length=1)):
    """
    Search incidents using Supabase full-text search on search_vector.
    """
    if not q.strip():
        return []
    
    # Use Supabase text search
    # Format: column=fts.query (full-text search)
    try:
        result = supabase_request(
            "GET", "incidents",
            params={
                "deleted_at": "is.null",
                "or": f"(title.ilike.*{q}*,description.ilike.*{q}*,location.ilike.*{q}*)",
                "order": "created_at.desc",
                "limit": "50"
            }
        )
        return [transform_incident(inc) for inc in result]
    except Exception as e:
        # Fallback: simple ILIKE search if full-text fails
        try:
            result = supabase_request(
                "GET", "incidents",
                params={
                    "deleted_at": "is.null",
                    "title": f"ilike.*{q}*",
                    "order": "created_at.desc"
                }
            )
            return [transform_incident(inc) for inc in result]
        except:
            return []


# RAG Chat Endpoint (Pathway Proxy)
# ============================================================

# Greeting patterns for intent detection
GREETING_PATTERNS = [
    # Simple greetings
    r'^(hi|hello|hey|hii+|helo+)[\s!.,?]*$',
    r'^(good\s*)?(morning|afternoon|evening|night)[\s!.,?]*$',
    r'^(howdy|hiya|yo|sup)[\s!.,?]*$',
    # How are you variants
    r'^how\s*(are|r)\s*(you|u|ya)[\s!.,?]*$',
    r"^what'?s\s*up[\s!.,?]*$",
    r'^how\s*(is\s*it\s*)?going[\s!.,?]*$',
    # Identity questions
    r'^(who|what)\s*(are|r)\s*(you|u)[\s!.,?]*$',
    r'^what\s*(can|do)\s*(you|u)\s*do[\s!.,?]*$',
    r'^(help|help me)[\s!.,?]*$',
    # Thanks
    r'^(thanks?|thank\s*you|ty)[\s!.,?]*$',
    r'^(ok|okay|cool|great|nice)[\s!.,?]*$',
    # Bye
    r'^(bye|goodbye|see\s*you?|later)[\s!.,?]*$',
]

# Friendly responses for greetings
GREETING_RESPONSES = [
    "Hi! I'm your Incident Intelligence assistant. I can help you track, search, and analyze incidents. Try asking about active incidents, severity levels, or specific locations!",
    "Hello! I can help you with incident queries. Ask me things like 'show critical incidents' or 'what happened in Server Room'.",
    "Hey there! I'm here to help you understand your incident data. What would you like to know?",
]

IDENTITY_RESPONSES = [
    "I'm the Incident Intelligence AI assistant. I help you search, analyze, and understand incident records. Try asking about active incidents, their status, or trends!",
    "I'm your AI-powered incident analyst. I can answer questions about incidents, their severity, locations, and status. How can I help?",
]

HELP_RESPONSES = [
    "I can help you with:\n• Listing active incidents\n• Finding incidents by location or severity\n• Checking incident status\n• Analyzing incident patterns\n\nTry asking: 'Show all critical incidents' or 'What incidents are open?'",
]

THANKS_RESPONSES = [
    "You're welcome! Let me know if you need anything else about your incidents.",
    "Happy to help! Feel free to ask more questions about incidents.",
]

BYE_RESPONSES = [
    "Goodbye! Come back anytime you need help with incidents.",
    "See you! I'll be here if you need incident intel.",
]

import re
import random

def detect_greeting_intent(message: str) -> str | None:
    """
    Detect if message is a greeting/small-talk.
    Returns a friendly response if greeting, None if incident query.
    """
    msg = message.strip().lower()
    
    # Check greeting patterns
    for pattern in GREETING_PATTERNS:
        if re.match(pattern, msg, re.IGNORECASE):
            # Determine response type
            if re.match(r'.*(who|what).*(are|r).*(you|u).*', msg) or re.match(r'.*what.*(can|do).*do.*', msg):
                return random.choice(IDENTITY_RESPONSES)
            elif re.match(r'.*(help).*', msg):
                return random.choice(HELP_RESPONSES)
            elif re.match(r'.*(thank|ty).*', msg):
                return random.choice(THANKS_RESPONSES)
            elif re.match(r'.*(bye|goodbye|see\s*you|later).*', msg):
                return random.choice(BYE_RESPONSES)
            else:
                return random.choice(GREETING_RESPONSES)
    
    return None

def enhance_query(user_query: str) -> str:
    """
    Deterministic query enhancement for better RAG retrieval.
    Maps common user phrases to field-specific queries.
    """
    query_lower = user_query.lower()
    
    # Rule-based query expansions (deterministic, explainable)
    expansions = {
        "medium risk incidents": "incidents with medium severity level, status open or investigating",
        "medium severity": "incidents with severity level medium",
        "high risk incidents": "incidents with high severity level",
        "critical issues": "incidents with critical severity level",
        "critical incidents": "incidents with critical severity level",
        "network problems": "network connectivity incidents, outages, connection timeouts, or network-related issues",
        "network issues": "network connectivity incidents, outages, connection timeouts, or network-related issues",
        "network connectivity": "network connectivity incidents, outages, connection timeouts, or network-related issues",
        "database problems": "database connectivity, timeout, or database-related incidents",
        "security alerts": "security incidents, unauthorized access, or security-related issues",
    }
    
    # Apply expansions
    for pattern, expansion in expansions.items():
        if pattern in query_lower:
            return expansion
    
    # Return original if no match
    return user_query


def detect_query_mode(user_query: str) -> str:
    """
    Detect if query is a simple search (keyword-based) or complex reasoning.
    Returns: "search" or "reasoning"
    
    NOTE: This must match the logic in AIFlowPanel.tsx for consistency.
    """
    query_lower = user_query.lower()
    
    # Keywords that indicate reasoning/analytical queries (check FIRST - higher priority)
    # Matches REASONING_PATTERNS in AIFlowPanel.tsx
    reasoning_keywords = [
        "why", "how", "explain", "analyze", "analysis", "reason", "cause", "root cause",
        "pattern", "trend", "insight", "summary", "summarize", "overview",
        "recommend", "suggest", "should", "could", "prevent", "avoid",
        "compare", "correlation", "related", "similar",
        "what happened", "tell me about", "describe",  # Added to match UI
    ]
    
    # Check for reasoning keywords FIRST (higher priority)
    for keyword in reasoning_keywords:
        if keyword in query_lower:
            return "reasoning"
    
    # Keywords that indicate simple search/filter queries
    search_keywords = [
        "list", "show", "get", "find", "what are", "which",
        "open incident", "resolved incident", "investigating",
        "incidents in", "incidents at", "incidents from",
        "all incidents", "active incidents",
    ]
    
    # Check for search keywords
    for keyword in search_keywords:
        if keyword in query_lower:
            return "search"
    
    # Default to reasoning for complex/unknown queries
    return "reasoning"


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with Pathway RAG."""
    
    # Check for greeting
    greeting_response = detect_greeting_intent(request.message)
    if greeting_response:
        return ChatResponse(
            response=greeting_response,
            timestamp=datetime.now().isoformat()
        )
    
    # Not a greeting - forward to Pathway RAG with enhanced prompt
    try:
    # Phase 1: Deterministic query enhancement
        enhanced_user_query = enhance_query(request.message)
        
        # Build conversation history string
        history_context = ""
        if request.history:
            # Use last 6 messages (3 turns)
            for msg in request.history[-6:]:
                role = "User" if msg.sender.lower() == "user" else "AI"
                history_context += f"{role}: {msg.message}\n"
        
        # Phase 1: Improved prompt with field semantics explanation
        enhanced_prompt = f"""Context: You have access to incident records with these fields:
- incident_id: Unique ID in format INC-YYYYMMDD-HHMMSS (always cite this)
- title: Short description of the incident
- status: Current state (open, investigating, resolved, closed)
- severity: Impact level (low, medium, high, critical)
- location: Physical/logical location (e.g., Block A, Block B, Data Center)
- description: Detailed incident information
- timestamp: When incident occurred
- timeline/updates: Recent changes to the incident

CONVERSATION HISTORY:
{history_context}

IMPORTANT QUERY INTERPRETATION:
- "incidents" means all incidents regardless of severity
- "medium/high/critical/low" refers to the severity field
- "network/database/security" keywords appear in title or description
- "Block A/B/C" or location terms refer to the location field
- "open/investigating/resolved" refers to the status field

ACCURACY REQUIREMENTS:
- When reporting status, severity, or location, try to use the EXACT value from the record
- You MAY infer categories (e.g., "connection timeout" implies "network/database issue")
- If a record says "status: resolved", report it as RESOLVED
- NEVER mention file paths, cache directories, or technical implementation details
- Refer to data as "incident records" not "files" or "cache"
- CRITICAL: When asked to "list all" or "summarize", CHECK EVERY SINGLE RECORD provided in the context. Do not stop after the first match.

MULTI-PART QUERIES:
- If the user asks about multiple severity levels (e.g., "critical AND high"), answer BOTH
- List ALL matching incidents for EACH requested category

When you mention specific incidents, ALWAYS include their exact incident ID from the records.
Example: "Incident INC-20260108-092438 (status: resolved) describes..."

NEVER use legacy ID formats like INC-101, INC-102, or INC-1102.

User query: {enhanced_user_query}

Please provide an accurate, complete answer citing incident IDs and exact field values."""
        
        pathway_response = requests.post(
            PATHWAY_URL,
            json={"prompt": enhanced_prompt},
            timeout=120  # Increased for Groq cloud latency
        )
        pathway_response.raise_for_status()
        data = pathway_response.json()
        
        # Extract incident references from response
        response_text = data.get("response", "No response from RAG")
        incident_refs = []
        context_size = None
        
        # Transitional regex: Support both formats but LOG legacy detections
        import re
        
        # Check for canonical IDs (preferred)
        canonical_pattern = r'INC-\d{8}-\d{6}'
        canonical_matches = re.findall(canonical_pattern, response_text)
        
        # Check for legacy IDs (should not exist)
        legacy_pattern = r'INC-\d{1,4}(?!\d)'  # INC-101, INC-1102, etc.
        legacy_matches = re.findall(legacy_pattern, response_text)
        
        if legacy_matches:
            # LOG WARNING: Legacy IDs detected in AI response
            logger.warning(f"⚠️  LEGACY IDS IN AI RESPONSE: {legacy_matches}")
            logger.warning(f"   Query was: {request.message}")
            logger.warning(f"   This indicates stale Pathway cache or database inconsistency!")
        
        if canonical_matches:
            incident_refs = list(set(canonical_matches))
            context_size = len(incident_refs)
        
        # Fallback 1: Check if Pathway returns metadata
        if context_size is None and 'sources' in data:
            context_size = len(data.get('sources', []))
        
        # Fallback 2: Estimate from response content using heuristics
        if context_size is None:
            incident_keywords = ['incident', 'severity:', 'status:', 'location:']
            keyword_count = sum(response_text.lower().count(kw) for kw in incident_keywords)
            if keyword_count > 10:
                context_size = max(1, keyword_count // 4)
        
        # Detect query mode (search vs reasoning)
        query_mode = detect_query_mode(request.message)
        
        return ChatResponse(
            response=response_text,
            timestamp=datetime.now().isoformat(),
            mode=query_mode,  # Dynamic: "search" or "reasoning"
            dataSource="Supabase",
            contextSize=context_size,
            incidentRefs=incident_refs if incident_refs else None
        )
    except requests.exceptions.ConnectionError:
        return ChatResponse(
            response="Error: Cannot connect to Pathway RAG. Is it running on port 8081?",
            timestamp=datetime.now().isoformat(),
            mode=None,
            dataSource=None
        )
    except Exception as e:
        return ChatResponse(
            response=f"Error: {str(e)}",
            timestamp=datetime.now().isoformat(),
            mode=None,
            dataSource=None
        )


@app.get("/api/live-updates")
async def get_live_updates():
    """Get recent live updates (placeholder)."""
    return []


# ============================================================
# PRIORITY 3: WebSocket for Real-time Updates
# ============================================================

@app.websocket("/ws/incidents")
async def websocket_incidents(websocket: WebSocket):
    """
    WebSocket endpoint for real-time incident updates.
    Clients receive notifications when incidents are created/updated/deleted.
    """
    await manager.connect(websocket)
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to incident updates",
            "timestamp": datetime.now().isoformat()
        })
        
        while True:
            # Keep connection alive and handle any client messages
            data = await websocket.receive_text()
            # Echo back acknowledgment
            await websocket.send_json({
                "type": "ack",
                "message": data,
                "timestamp": datetime.now().isoformat()
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


# Keep backward compatibility with existing WebSocket endpoint
@app.websocket("/ws/updates")
async def websocket_updates(websocket: WebSocket):
    """Legacy WebSocket endpoint - redirects to /ws/incidents."""
    await websocket_incidents(websocket)


# ============================================================
# Main Entry Point
# ============================================================

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "=" * 60)
    print("🚀 Incident Intelligence API Server v4.0")
    print("=" * 60)
    print("Architecture:")
    print("  • CRUD:   UI → FastAPI → Supabase")
    print("  • Search: UI → FastAPI → Supabase (search_vector)")
    print("  • RAG:    UI → FastAPI → Pathway (read-only)")
    print("-" * 60)
    print(f"API Docs:     http://localhost:8000/docs")
    print(f"React UI:     http://localhost:5173")
    print(f"Pathway RAG:  {PATHWAY_URL}")
    print(f"Supabase:     {SUPABASE_URL[:40]}..." if SUPABASE_URL else "Supabase: Not configured")
    print("=" * 60)
    print("\n⚠️  Make sure Pathway is running in WSL2 for AI chat!\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
