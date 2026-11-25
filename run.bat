@echo off
TITLE SelfHire.ai — Autonomous Career Automation Platform
COLOR 06

echo ===============================================================================
echo            SelfHire.ai - Privacy-First Autonomous Career OS
echo        Maison Salome Serif ^| Warm Espresso ^& Terracotta Luxury Palette
echo ===============================================================================
echo.
echo [SelfHire.ai] Launching all services in parallel (zero-selection mode)...
echo.

:: 1. Database check & automatic initialization
if not exist "data\selfhire.db" (
    echo [1/4] Initializing local database and seeding portals/recruiters...
    python scripts\seed_database.py
) else (
    echo [1/4] SQLite database verified.
)

:: 2. Launch FastAPI Backend in separate window
echo [2/4] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "SelfHire.ai Backend (FastAPI)" cmd /k "TITLE SelfHire.ai Backend && color 0B && python -m uvicorn services.api.main:app --host 127.0.0.1 --port 8000 --reload"

:: 3. Launch Next.js Web Dashboard in separate window
echo [3/4] Starting Next.js Web Dashboard on http://localhost:3000 ...
start "SelfHire.ai Web Dashboard (Next.js)" cmd /k "TITLE SelfHire.ai Web && color 0A && cd apps\web && npm run dev"

:: 4. Launch Background Task Worker in separate window
echo [4/4] Starting Background Task Worker Runner ...
start "SelfHire.ai Background Worker" cmd /k "TITLE SelfHire.ai Worker && color 0D && python -m services.worker.runner"

:: Wait 3 seconds for initial bindings
timeout /t 3 /nobreak > nul

echo.
echo ===============================================================================
echo   Platform is running! All services launched successfully:
echo   - Web Dashboard:     http://localhost:3000
echo   - Backend API Docs:  http://127.0.0.1:8000/docs
echo   - Worker Queue:      Running in background window
echo ===============================================================================
echo.
echo Opening Web Dashboard in your browser...
start http://localhost:3000
