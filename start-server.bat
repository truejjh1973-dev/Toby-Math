@echo off
cd /d "%~dp0"
setlocal

rem --- Try to use a real Python first (skips the Microsoft Store stub) ---
set "PYFOUND="
for /f "usebackq tokens=*" %%a in (`python --version 2^>^&1`) do (
  echo %%a | findstr /i /c:"Python 3" >nul && set "PYFOUND=1"
)
if defined PYFOUND (
  echo Starting Toby Math with Python...
  start "" "http://localhost:8000/"
  python -m http.server 8000
  echo Server stopped.
  pause
  exit /b 0
)

rem --- Fallback: pure PowerShell server (no dependencies) ---
echo Python not found - using the built-in PowerShell server instead.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause