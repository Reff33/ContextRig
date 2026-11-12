@echo off
title KinetRig Studio Bridge
cd /d "%~dp0"
set "KINET_HOST=127.0.0.1"
set "KINET_PORT=4004"
for /f "tokens=1,2 delims=|" %%a in ('node -e "try{const c=require('./kinet.config.json');const h=(c.host==='0.0.0.0'||!c.host)?'127.0.0.1':c.host;console.log(h+'|'+(c.port||4004));}catch{console.log('127.0.0.1|4004');}" 2^>nul') do (
  set "KINET_HOST=%%a"
  set "KINET_PORT=%%b"
)
echo Starting KinetRig Studio Bridge on http://%KINET_HOST%:%KINET_PORT% ...
start "" http://%KINET_HOST%:%KINET_PORT%/preview.html
node scripts/server.mjs
if errorlevel 1 (
  echo.
  echo Node.js not found or server failed. Install Node.js from https://nodejs.org
  pause
)
