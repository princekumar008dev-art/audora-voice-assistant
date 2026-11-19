@echo off
echo ========================================================
echo Deploying Echo Voice Assistant to Vercel...
echo ========================================================
set PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%

echo.
echo Step 1: Checking login status...
echo Agar browser open ho, toh 'GitHub' ya 'Email' select karke login complete karein.
call vercel login

echo.
echo Step 2: Deploying to Vercel Production...
cd /d "%~dp0"
call vercel --prod

echo.
echo ========================================================
echo Deployment process complete!
echo ========================================================
pause
