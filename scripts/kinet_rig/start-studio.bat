@echo off
title KinetRig Studio Bridge
cd /d "%~dp0"
echo Starting KinetRig Studio Bridge on http://127.0.0.1:4004 ...
start "" http://127.0.0.1:4004/preview.html
node scripts/server.mjs
if errorlevel 1 (
  echo.
  echo Node.js not found or server failed. Install Node.js from https://nodejs.org
  pause
)
