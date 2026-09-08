@echo off
echo Starting KhanDrishti Frontend Client on http://localhost:5173 ...
cd /d "%~dp0frontend"
npm run dev -- --host
pause
