@echo off
cd /d "%~dp0"
echo Stopping FloorManager...
docker compose down
echo Done.
pause
