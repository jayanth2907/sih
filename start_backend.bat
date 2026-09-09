@echo off
echo Starting TRINETRA Backend Server on http://127.0.0.1:8000 ...
cd /d "%~dp0backend"
.\venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000
pause
