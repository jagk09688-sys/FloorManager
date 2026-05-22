@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo  FloorManager — Deploy
echo ========================================

:: 1. Build the Next.js frontend
echo [1/4] Building frontend...
cd frontend
call npm run build
if errorlevel 1 ( echo BUILD FAILED & pause & exit /b 1 )
cd ..

:: 2. Seed admin user (safe to run multiple times — uses upsert)
echo [2/4] Seeding admin user...
cd Backened
node scripts/seedAdmin.js
cd ..

:: 3. Stop any running PM2 processes then start fresh
echo [3/4] Starting services with PM2...
call pm2 delete fm-backend  2>nul
call pm2 delete fm-frontend 2>nul
call pm2 start ecosystem.config.js

:: 4. Save process list so PM2 restores it on reboot
echo [4/4] Saving PM2 process list...
call pm2 save

echo.
echo ========================================
echo  Done!  App is running at:
echo    http://localhost:3000
echo ========================================
echo.
echo  To start on Windows boot, run once:
echo    pm2 startup
echo  then copy+run the printed command.
echo.
pause
