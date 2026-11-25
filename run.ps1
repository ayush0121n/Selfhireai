# SelfHire.ai PowerShell Platform Launcher
# Automatically launches all services in parallel without prompting.
param (
    [string]$Mode = 'all'
)

$ErrorActionPreference = 'Continue'

function Show-Banner {
    Write-Host '===============================================================================' -ForegroundColor Yellow
    Write-Host '            SelfHire.ai - Privacy-First Autonomous Career OS' -ForegroundColor White
    Write-Host '        Maison Salome Serif | Warm Espresso and Terracotta Palette' -ForegroundColor DarkYellow
    Write-Host '===============================================================================' -ForegroundColor Yellow
    Write-Host ''
}

Show-Banner

if ($Mode -eq 'all' -or -not $Mode) {
    Write-Host '[SelfHire.ai] Launching all platform services (zero-selection mode)...' -ForegroundColor Cyan
    Write-Host ''

    # 1. Database check
    if (-not (Test-Path 'data\selfhire.db')) {
        Write-Host '[1/4] Initializing local database and seeding portals/recruiters...' -ForegroundColor Magenta
        python scripts\seed_database.py
    } else {
        Write-Host '[1/4] SQLite database verified.' -ForegroundColor DarkGreen
    }

    # 2. Launch FastAPI Backend
    Write-Host '[2/4] Starting FastAPI Backend on http://127.0.0.1:8000...' -ForegroundColor Cyan
    Start-Process powershell -ArgumentList '-NoExit', '-Command', '$host.UI.RawUI.WindowTitle = "SelfHire.ai Backend (FastAPI)"; python -m uvicorn services.api.main:app --host 127.0.0.1 --port 8000 --reload'

    Start-Sleep -Seconds 2

    # 3. Launch Next.js Web Dashboard
    Write-Host '[3/4] Starting Next.js Web Dashboard on http://localhost:3000...' -ForegroundColor Green
    Start-Process powershell -ArgumentList '-NoExit', '-Command', '$host.UI.RawUI.WindowTitle = "SelfHire.ai Web Dashboard"; cd apps\web; npm run dev'

    # 4. Launch Background Task Worker
    Write-Host '[4/4] Starting Background Task Worker Runner...' -ForegroundColor Magenta
    Start-Process powershell -ArgumentList '-NoExit', '-Command', '$host.UI.RawUI.WindowTitle = "SelfHire.ai Background Worker"; python -m services.worker.runner'

    Start-Sleep -Seconds 2

    Write-Host ''
    Write-Host '===============================================================================' -ForegroundColor Yellow
    Write-Host '  Platform is running! All services launched successfully:' -ForegroundColor Green
    Write-Host '  - Web Dashboard:     http://localhost:3000' -ForegroundColor Green
    Write-Host '  - Backend API:       http://127.0.0.1:8000/docs' -ForegroundColor Cyan
    Write-Host '  - Background Worker: Running in dedicated window' -ForegroundColor Magenta
    Write-Host '===============================================================================' -ForegroundColor Yellow
    Write-Host ''
    Write-Host 'Opening Web Dashboard in your browser...' -ForegroundColor White
    Start-Process 'http://localhost:3000'
    exit
}
elseif ($Mode -eq 'api') {
    python -m uvicorn services.api.main:app --host 127.0.0.1 --port 8000 --reload
}
elseif ($Mode -eq 'web') {
    Set-Location apps\web
    npm run dev
}
elseif ($Mode -eq 'worker') {
    python -m services.worker.runner
}
elseif ($Mode -eq 'test') {
    python -m pytest tests/unit/ -v
}
elseif ($Mode -eq 'docker') {
    docker-compose up --build
}
elseif ($Mode -eq 'seed') {
    python scripts\seed_database.py
}
