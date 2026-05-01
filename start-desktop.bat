@echo off
REM One-click local desktop startup for FM app (Windows)
REM Run this from: c:\Users\Toni\Desktop\Jag1910\CD carpet\FM\

echo Killing any existing processes on ports 3000 and 5000...
npx kill-port 3000 5000 >nul 2>&1

echo Starting Floor Manager backend and frontend...

cd /d "%~dp0frontend\Backened"
start "FM Backend" cmd /k "echo Starting backend... && npm run dev"

timeout /t 2 /nobreak >nul

cd /d "%~dp0frontend\frontend"
start "FM Frontend" cmd /k "echo Starting frontend... && npm run dev"

timeout /t 6 /nobreak >nul

cd /d "%~dp0"
start "FM Desktop UI" cmd /k "echo Starting Electron desktop app... && npm run electron:run"

echo
echo Backend should run at http://localhost:5000 (or your configured port)
echo Frontend should run at http://localhost:3000
echo Electron UI should open shortly
echo
echo Done. Close this window to keep servers running in launched terminals.
pause