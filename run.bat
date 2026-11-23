@echo off
TITLE SelfHire.ai — Autonomous Career Automation Platform
COLOR 06

echo ===============================================================================
echo            SelfHire.ai - Privacy-First Autonomous Career OS
echo        Maison Salome Serif ^| Warm Espresso ^& Terracotta Luxury Palette
echo ===============================================================================
echo.

:MENU
echo Choose an option to launch:
echo   [1] Start Full Platform (FastAPI Backend + Next.js Web Dashboard)
echo   [2] Start FastAPI REST ^& WebSocket Backend (http://127.0.0.1:8000)
echo   [3] Start Next.js Web Dashboard (http://localhost:3000)
echo   [4] Start Background Task Worker Runner
echo   [5] Start Complete Platform via Docker Compose (docker-compose up)
echo   [6] Run All Automated Verification Tests (43 tests)
echo   [7] Re-Seed SQLite/Supabase Database (106 Portals + 1,838 Recruiters)
echo   [8] Exit
echo.
set /p M=Select choice [1-8]: 

if "%M%"=="1" goto START_ALL
if "%M%"=="2" goto START_API
if "%M%"=="3" goto START_WEB
if "%M%"=="4" goto START_WORKER
if "%M%"=="5" goto START_DOCKER
if "%M%"=="6" goto RUN_TESTS
if "%M%"=="7" goto SEED_DB
if "%M%"=="8" goto EOF
goto MENU

:START_DOCKER
echo Launching SelfHire.ai with Docker Compose...
docker-compose up --build
goto MENU

:START_ALL
echo Starting FastAPI Backend in separate window...
start "SelfHire.ai Backend (FastAPI)" cmd /k "python -m uvicorn services.api.main:app --port 8000 --reload"
timeout /t 2 /nobreak > nul
echo Starting Next.js Web Dashboard in separate window...
start "SelfHire.ai Web Dashboard (Next.js)" cmd /k "cd apps\web && npm run dev"
echo.
echo ===============================================================================
echo   Platform is running!
echo   - Backend API:       http://127.0.0.1:8000/docs
echo   - Web Dashboard:     http://localhost:3000
echo ===============================================================================
echo.
pause
goto MENU

:START_API
echo Starting FastAPI REST Backend on http://127.0.0.1:8000...
python -m uvicorn services.api.main:app --port 8000 --reload
goto MENU

:START_WEB
echo Starting Next.js Web Dashboard on http://localhost:3000...
cd apps\web
npm run dev
goto MENU

:START_WORKER
echo Starting Background Task Worker Runner...
python -c "from services.worker.runner import TaskRunner; runner = TaskRunner(); print('[SelfHire.ai Worker Online] Polling background queue...'); import time; while True: res = runner.run_once(); time.sleep(2)"
goto MENU

:RUN_TESTS
echo Running full test suite...
python -m pytest tests/ -v
echo.
pause
goto MENU

:SEED_DB
echo Seeding 106 portals, 1,838 recruiter contacts, and profile...
python scripts/seed_database.py
echo.
pause
goto MENU

:EOF
exit
