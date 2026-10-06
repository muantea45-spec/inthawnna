@echo off
title Starting Inthawnna File Transfer...
cd /d "%~dp0"
echo ===================================================
echo          Launching Inthawnna File Transfer
echo    Wireless Phone-to-PC File Share (Zero App)
echo ===================================================
echo.
npm start
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [ERROR] Failed to start Inthawnna.
  pause
)
