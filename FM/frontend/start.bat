@echo off
cd /d "%~dp0"
echo Starting FloorManager...
docker compose up -d
echo.
echo App is running at http://localhost:3000
echo.
pause
