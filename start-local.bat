@echo off
echo Starting Echo Voice Assistant locally...
set PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%
cd /d "%~dp0"
call npm run dev
pause
