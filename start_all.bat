@echo off
title KhanDrishti Launcher
echo ========================================================
echo   KhanDrishti: Coal Mine Smart Governance Platform
echo   Launching Backend (Port 8000) & Frontend (Port 5173)...
echo ========================================================
start "KhanDrishti Backend" cmd /k "cd /d %~dp0backend && .\venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000"
timeout /t 3 /nobreak >nul
start "KhanDrishti Frontend" cmd /k "cd /d %~dp0frontend && npm run dev -- --host"
echo.
echo ========================================================
echo   Local Deployment Active:
echo   - Web Command Center : http://localhost:5173
echo   - FastAPI Backend API: http://127.0.0.1:8000
echo   - Swagger API Docs   : http://127.0.0.1:8000/docs
echo ========================================================
echo.
pause
