# Pathway RAG Pipeline for Incident Intelligence

**REQUIRES WSL2/Linux** - Pathway does not run on Windows natively.

## Setup (WSL2 Ubuntu)

```bash
# 1. Open Ubuntu terminal
wsl

# 2. Activate virtual environment
source ~/pathway-env/bin/activate

# 3. Navigate to project
cd /mnt/c/Users/shubh/Downloads/shubh/pathway

# 4. Install dependencies
pip install -r requirements.txt
```

## Run

```bash
# Make sure Ollama is running (in Windows or WSL2)
# In another terminal: ollama serve && ollama pull mistral

# Start the pipeline
python app.py
```

## Endpoints
- `POST http://localhost:8081/v2/answer` - Ask questions about incidents

## Test
```bash
curl -X POST http://localhost:8081/v2/answer \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What critical incidents are open?"}'
```

