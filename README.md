# Incident Intelligence System

A real-time incident management platform powered by streaming RAG (Retrieval-Augmented Generation) using Pathway, enabling AI-assisted incident analysis with live data synchronization.

**Submitted to DataQuest 2026, IIT Kharagpur**

---

## Problem Statement

Organizations managing infrastructure, IT systems, or physical facilities face a critical challenge: incidents occur continuously, but traditional monitoring dashboards require manual analysis to identify patterns, root causes, and correlations.

**Key Pain Points:**
- Incident data is scattered across logs, tickets, and alerts
- Manual correlation of related incidents is time-consuming
- Historical context is lost when analyzing new incidents
- Batch processing introduces delays in critical situations

**Why Real-Time AI Matters:**
When a new incident occurs, responders need immediate context: similar past incidents, affected systems, resolution patterns. Batch-processed AI becomes stale within minutes. Real-time streaming ensures the AI always has current knowledge.

---

## Solution Overview

Incident Intelligence is a web application that:

1. **Ingests incidents in real-time** from a central database
2. **Maintains a live searchable knowledge base** using Pathway streaming
3. **Answers natural language questions** about incidents using RAG
4. **Provides full CRUD operations** for incident management
5. **Shows AI reasoning transparency** including data sources and context size

The system demonstrates how streaming data pipelines can power intelligent applications without the latency of traditional batch processing.

---

## System Architecture

```
                         +------------------+
                         |    Web Browser   |
                         |  (React + Vite)  |
                         +--------+---------+
                                  |
                                  | HTTP/WebSocket
                                  v
                         +------------------+
                         |     FastAPI      |
                         | (Orchestration)  |
                         +--------+---------+
                                  |
              +-------------------+-------------------+
              |                                       |
              v                                       v
    +------------------+                    +------------------+
    |     Supabase     |                    |     Pathway      |
    | (Source of Truth)|<-------------------|  (Streaming RAG) |
    |  PostgreSQL DB   |   Polls every 5s   |  Real-time Index |
    |  (ONLY Storage)  |                    | (In-Memory Only) |
    +------------------+                    +--------+---------+
                                                     |
                                                     v
                                            +------------------+
                                            |    Groq Cloud    |
                                            | Llama 3.3 70B    |
                                            +------------------+
```

**Component Responsibilities:**

| Component | Role |
|-----------|------|
| **React UI** | User interface for incident management and AI chat |
| **FastAPI** | API gateway, CRUD operations, query routing |
| **Supabase** | Persistent storage, single source of truth |
| **Pathway** | Real-time streaming, vector indexing, RAG retrieval |
| **Groq LLM** | Natural language understanding and response generation |

**Data Flow Principles:**
- Supabase is the authoritative data store for all incidents
- Pathway continuously polls Supabase and maintains a synchronized vector index
- FastAPI routes AI queries to Pathway, CRUD operations to Supabase
- The UI never communicates directly with Supabase or Pathway

---

## Real-Time and Streaming Features

This system is **streaming-first**, not batch-processed. Here is how:

### Continuous Data Ingestion

Pathway runs a polling loop that fetches incidents from Supabase every 5 seconds:

```
Supabase (data changes) --> Pathway Poll --> Vector Index Update --> Ready for RAG
```

When an incident is created, updated, or deleted:
1. FastAPI writes to Supabase immediately
2. WebSocket broadcasts the change to connected clients
3. Pathway detects the change on its next poll cycle
4. The RAG index is updated without restart

### Why This Is Real-Time

- **No manual reindexing**: Changes propagate automatically
- **No server restart**: Pathway updates its index in-memory
- **Low latency**: 5-second polling ensures near-real-time sync
- **Consistent state**: Deleted incidents are excluded from AI responses

### Streaming vs Batch Comparison

| Aspect | Batch Processing | Streaming (This System) |
|--------|------------------|------------------------|
| Index update | Manual/scheduled | Automatic, continuous |
| Data freshness | Minutes to hours | Seconds |
| Restart required | Yes | No |
| Scale with data | Rebuilds entire index | Incremental updates |

---

## AI Reasoning and RAG Pipeline

### What is RAG?

Retrieval-Augmented Generation (RAG) combines search with language models:

1. **Retrieval**: Find relevant documents matching the user query
2. **Augmentation**: Inject retrieved context into the LLM prompt
3. **Generation**: LLM produces an answer grounded in real data

This prevents hallucination by anchoring responses to actual incident records.

### How Pathway Retrieves Incidents

```
User Query: "What critical incidents happened this week?"
                          |
                          v
              +------------------------+
              |  Pathway Vector Search |
              |  (Semantic Similarity) |
              +------------------------+
                          |
                          v
              +------------------------+
              | Retrieved Incidents:   |
              | - INC-20260119-091245  |
              | - INC-20260118-142033  |
              | - INC-20260117-083521  |
              +------------------------+
                          |
                          v
              +------------------------+
              |  Context + Query sent  |
              |  to Groq LLM           |
              +------------------------+
                          |
                          v
              +------------------------+
              |  Grounded AI Response  |
              +------------------------+
```

### Context Size Explained

The UI displays "Incidents Referenced: N" after each AI query. This indicates:
- How many incident documents were retrieved as context
- Higher numbers mean more comprehensive answers
- The system retrieves up to 15 relevant documents per query

### AI Transparency

Every AI response shows:
- **Mode**: Search (keyword filtering) or Reasoning (semantic analysis)
- **Data Source**: Always Supabase (via Pathway)
- **Incidents Referenced**: Number of documents used as context

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | Single-page application |
| **Styling** | TailwindCSS | Responsive UI design |
| **Build Tool** | Vite | Fast development server |
| **Backend** | FastAPI (Python) | REST API and WebSocket |
| **Streaming Engine** | Pathway | Real-time RAG pipeline |
| **Database** | Supabase (PostgreSQL) | Persistent storage |
| **Vector Search** | Pathway + SentenceTransformers | Semantic retrieval |
| **LLM Provider** | Groq Cloud | Fast inference |
| **LLM Model** | Llama 3.3 70B Versatile | Natural language understanding |

---

## LLM Provider: Groq

### Why Groq?

Groq provides extremely fast LLM inference through custom hardware:

- **Speed**: 500+ tokens per second
- **Free tier**: 14,400 requests per day
- **Quality**: Access to Llama 3.3 70B (state-of-the-art open model)
- **No local GPU required**: Runs entirely in cloud

### Model Used

```
Model: llama-3.3-70b-versatile
Provider: Groq Cloud
Parameters: 70 billion
Context Window: 128K tokens
```

### API Key Requirement

A valid Groq API key is **required** for AI features:

1. Create free account at https://console.groq.com
2. Generate API key (starts with `gsk_`)
3. Add to environment or startup script

### Fallback Behavior

If Groq API is unavailable or key is missing:
- CRUD operations continue to work
- Search functionality remains available
- AI chat returns an error message
- System does not crash

---

## Setup and Execution

### Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Python | 3.10+ | Backend and Pathway |
| Node.js | 18+ | Frontend build |
| WSL2 (Windows) | Ubuntu | Pathway runtime |
| Groq API Key | - | LLM inference |
| Supabase Account | - | Database |

### Step-by-Step Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/Shubhanshu-ydv/Incident-Intelligence-.git
cd Incident-Intelligence-
```

#### 2. Get Your API Keys

**Groq API Key** (Required for AI features)
1. Go to https://console.groq.com
2. Sign up/login
3. Navigate to "API Keys"
4. Create a new key
5. Copy the key (starts with `gsk_`)

**Supabase Credentials** (Required for database)
1. Go to https://supabase.com
2. Create a new project
3. Go to Project Settings → API
4. Copy your `Project URL` and `anon/public` key

#### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# Groq API Key (Required for AI)
GROQ_API_KEY=gsk_your_groq_api_key_here
```

**Windows Users**: Also set as system environment variable (recommended):
1. Search "Environment Variables" in Windows
2. Add new User Variable: `GROQ_API_KEY` = `your_key_here`
3. Restart your terminal

#### 4. Install Python Dependencies (Windows)

```bash
# Create virtual environment
python -m venv .venv

# Activate it
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### 5. Install Frontend Dependencies

```bash
cd ui
npm install
cd ..
```

#### 6. Setup Pathway in WSL2

```bash
# Install WSL2 if not already installed
wsl --install

# Enter WSL Ubuntu
wsl -d Ubuntu

# Create and activate Python virtual environment
python3 -m venv ~/pathway-env
source ~/pathway-env/bin/activate

# Install Pathway dependencies
pip install -r pathway/requirements.txt

# Exit WSL
exit
```

#### 7. Run the Application

**Option A: Using the startup script (Recommended)**
```bash
# Make sure GROQ_API_KEY is set as environment variable
# Then run:
start.bat
```

**Option B: Manual start (3 terminals)**

**Terminal 1 - Pathway (WSL):**
```bash
wsl -d Ubuntu
source ~/pathway-env/bin/activate
export GROQ_API_KEY=your_key_here
cd pathway
python app.py
```

**Terminal 2 - FastAPI (Windows):**
```bash
.venv\Scripts\activate
python server.py
```

**Terminal 3 - React (Windows):**
```bash
cd ui
npm run dev
```

### Verification

Open http://localhost:5173 and verify:
- ✅ Dashboard loads with incident list
- ✅ Live Updates section shows recent changes
- ✅ AI Chat responds to queries
- ✅ You can create/edit/delete incidents

### Services Running

| Service | Port | URL |
|---------|------|-----|
| React Frontend | 5173 | http://localhost:5173 |
| FastAPI Backend | 8000 | http://localhost:8000/docs |
| Pathway RAG | 8081 | http://localhost:8081 |

### Troubleshooting

**Issue**: "WSL2 not found"
- Run `wsl --install` and restart your computer

**Issue**: "GROQ_API_KEY not set"
- Make sure you set it as environment variable or in `.env`
- For start.bat: `$env:GROQ_API_KEY="your_key"` before running

**Issue**: "Module not found" errors
- Ensure all dependencies are installed (Steps 4, 5, 6)
- Check you're in the correct virtual environment

**Issue**: "Cannot connect to Supabase"
- Verify your `.env` file has correct credentials
- Check your Supabase project is active

---

## Demonstration Guide

### What Judges Should Observe

**Real-Time Synchronization:**
1. Create a new incident in the dashboard
2. Within 5-10 seconds, ask the AI about it
3. The AI should reference the newly created incident

**AI Context Transparency:**
1. Ask: "What are the critical incidents?"
2. Observe the AI Context panel showing:
   - Mode: Reasoning or Search
   - Data Source: Supabase
   - Incidents Referenced: (count)

**Streaming Behavior:**
1. Delete an incident
2. Ask the AI about that incident
3. The AI should not reference the deleted incident

### Example Questions to Ask

| Query | Expected Behavior |
|-------|-------------------|
| "What critical incidents are currently open?" | Lists critical severity incidents with IDs |
| "Summarize all network-related issues" | Semantic search for network keywords |
| "Which location has the most incidents?" | Aggregation across location field |
| "Tell me about incident INC-XXXXXXXX-XXXXXX" | Direct lookup by ID |

### Proof Points for Real-Time

- Create incident → AI knows about it immediately
- Update status → AI reflects new status
- Delete incident → AI no longer references it
- No server restart required for any of the above

---

## Limitations and Trade-offs

### API Key Dependency

- Groq API key is mandatory for AI features
- Free tier has rate limits (30 requests/minute)
- Without key, AI chat is non-functional

### Polling Interval

- Pathway polls Supabase every 5 seconds
- Not true event-driven streaming (push-based)
- Acceptable for incident management use case

### Local Embedding Model

- SentenceTransformers runs locally (CPU)
- First query may have cold-start delay
- No GPU acceleration in default configuration

### Single LLM Provider

- Currently only Groq is supported
- Fallback to local Ollama requires configuration change
- No automatic provider failover

---

## Future Improvements

**Authentication and Authorization**
- User login with role-based access
- Team-based incident visibility
- Audit logging for compliance

**Scalability**
- Horizontal scaling for Pathway workers
- Connection pooling for Supabase
- CDN for static frontend assets

**Advanced RAG Features**
- Hybrid search (semantic + keyword)
- Query rewriting for better retrieval
- Multi-hop reasoning for complex questions

**Operational**
- Health monitoring dashboard
- Alerting for system issues
- Backup and recovery procedures

---

## Team

**Project:** Incident Intelligence System  
**Event:** DataQuest 2026, IIT Kharagpur  
**Category:** Real-Time AI / Streaming Data

---

## Acknowledgements

- **Pathway** for the streaming RAG framework
- **Groq** for fast and free LLM inference
- **Supabase** for managed PostgreSQL and real-time subscriptions
- **FastAPI** for the high-performance Python web framework
- **IIT Kharagpur** for organizing DataQuest 2026

---

## License

This project is submitted for DataQuest 2026 evaluation purposes.
