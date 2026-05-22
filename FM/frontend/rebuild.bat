@echo off
cd /d "%~dp0"
echo Rebuilding FloorManager (this takes a few minutes)...
docker compose down
docker compose build --no-cache
docker compose up -d
echo.
echo Done. App is running at http://localhost:3000
echo.
pause
