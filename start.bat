@echo off
title Incident Intelligence - Full Stack Launcher
color 0A

echo ============================================================
echo   🚨 Incident Intelligence - Starting All Services
echo ============================================================
echo.

REM Check if WSL is available
wsl --status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ WSL2 is not installed or not running!
    echo Please install WSL2 first: wsl --install
    pause
    exit /b 1
)

echo ✓ WSL2 detected
echo.

echo [1/3] Starting Pathway RAG Pipeline (WSL2 Ubuntu - Port 8081)...
REM Read GROQ_API_KEY from .env file
for /f "tokens=2 delims==" %%a in ('findstr "GROQ_API_KEY" .env') do set GROQ_API_KEY=%%a
start "Pathway RAG Pipeline" wsl -d Ubuntu -- bash -c "export GROQ_API_KEY=%GROQ_API_KEY% && source ~/pathway-env/bin/activate && cd /mnt/c/Users/shubh/Downloads/shubh/pathway && python app.py"

REM Wait for Pathway to initialize
timeout /t 5 /nobreak >nul

echo [2/3] Starting FastAPI Backend (Port 8000)...
start "FastAPI Backend" cmd /k "cd /d %~dp0 && call .venv\Scripts\activate && python server.py"

REM Wait for FastAPI to start
timeout /t 3 /nobreak >nul

echo [3/3] Starting React Frontend (Port 5173)...
start "React Frontend" cmd /k "cd /d %~dp0ui && npm run dev"

echo.
echo ============================================================
echo   ✅ All Services Started!
echo ============================================================
echo.
echo   📍 Frontend:    http://localhost:5173
echo   📍 FastAPI:     http://localhost:8000
echo   📍 Pathway RAG: http://localhost:8081/v2/answer
echo.
echo   🤖 Using Groq Llama 3.3 70B for AI responses
echo.
echo ============================================================
echo   Press any key to open the frontend in your browser...
echo ============================================================
pause >nul

start http://localhost:5173
