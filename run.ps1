# SelfHire.ai PowerShell Platform Launcher
# Usage: .\run.ps1 [-Mode all|api|web|test|seed]

param (
    [string]$Mode = 'menu'
)

function Show-Banner {
    Write-Host '===============================================================================' -ForegroundColor Yellow
    Write-Host '            SelfHire.ai - Privacy-First Autonomous Career OS' -ForegroundColor White
    Write-Host '        Maison Salome Serif | Warm Espresso and Terracotta Palette' -ForegroundColor DarkYellow
    Write-Host '===============================================================================' -ForegroundColor Yellow
    Write-Host ''
}

function Start-ApiServer {
    Write-Host '[SelfHire.ai] Starting FastAPI Server on http://127.0.0.1:8000...' -ForegroundColor Cyan
    Start-Process -FilePath 'python' -ArgumentList '-m uvicorn services.api.main:app --port 8000 --reload'
}

function Start-WebDashboard {
    Write-Host '[SelfHire.ai] Starting Next.js Web Dashboard on http://localhost:3000...' -ForegroundColor Green
    Start-Process -FilePath 'cmd' -ArgumentList '/c cd apps\web && npm run dev'
}

function Run-VerificationTests {
    Write-Host '[SelfHire.ai] Running Pytest Suite (All 43 Tests)...' -ForegroundColor Yellow
    python -m pytest tests/ -v
}

function Seed-Database {
    Write-Host '[SelfHire.ai] Seeding 106 Portals and 1838 Recruiter Contacts...' -ForegroundColor Magenta
    python scripts/seed_database.py
}

Show-Banner

if ($Mode -eq 'all') {
    Start-Process powershell -ArgumentList '-NoExit', '-Command', 'python -m uvicorn services.api.main:app --port 8000 --reload'
    Start-Sleep -Seconds 2
    Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd apps\web; npm run dev'
    Write-Host '[SUCCESS] SelfHire.ai started in parallel terminal windows.' -ForegroundColor Green
    Write-Host '  API:       http://127.0.0.1:8000/docs' -ForegroundColor Cyan
    Write-Host '  Dashboard: http://localhost:3000' -ForegroundColor Green
    exit
}
elseif ($Mode -eq 'api') {
    python -m uvicorn services.api.main:app --port 8000 --reload
    exit
}
elseif ($Mode -eq 'web') {
    Set-Location apps\web
    npm run dev
    exit
}
elseif ($Mode -eq 'test') {
    Run-VerificationTests
    exit
}
elseif ($Mode -eq 'docker') {
    docker-compose up --build
    exit
}
elseif ($Mode -eq 'seed') {
    Seed-Database
    exit
}

# Interactive Menu
Write-Host 'Please select an execution target:' -ForegroundColor White
Write-Host '  [1] Start All (API Server and Web Dashboard in separate windows)' -ForegroundColor Cyan
Write-Host '  [2] Start FastAPI Backend (http://127.0.0.1:8000)' -ForegroundColor Cyan
Write-Host '  [3] Start Next.js Web Dashboard (http://localhost:3000)' -ForegroundColor Green
Write-Host '  [4] Start with Docker Compose (docker-compose up)' -ForegroundColor Blue
Write-Host '  [5] Run Pytest Automated Verification (43 Tests)' -ForegroundColor Yellow
Write-Host '  [6] Seed Database (106 Portals and 1838 Recruiters)' -ForegroundColor Magenta
Write-Host '  [7] Exit' -ForegroundColor Gray
Write-Host ''

$choice = Read-Host 'Enter option [1-7]'

switch ($choice) {
    '1' {
        Start-Process powershell -ArgumentList '-NoExit', '-Command', 'python -m uvicorn services.api.main:app --port 8000 --reload'
        Start-Sleep -Seconds 2
        Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd apps\web; npm run dev'
        Write-Host 'Launched API and Web Dashboard!' -ForegroundColor Green
    }
    '2' { python -m uvicorn services.api.main:app --port 8000 --reload }
    '3' { Set-Location apps\web; npm run dev }
    '4' { docker-compose up --build }
    '5' { Run-VerificationTests }
    '6' { Seed-Database }
    default { Write-Host 'Exited.' }
}
