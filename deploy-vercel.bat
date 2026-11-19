@echo off
echo ========================================================
echo Deploying Echo Voice Assistant to Vercel...
echo ========================================================
set PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%

echo Step 1: Checking Vercel CLI...
call vercel --version
if errorlevel 1 (
    echo Installing Vercel CLI...
    call npm install -g vercel
)

echo.
echo Step 2: Deploying to Vercel...
echo If this is your first time, Vercel will ask you to login in your browser.
call vercel --prod

echo.
echo Deployment finished!
pause
