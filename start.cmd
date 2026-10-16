@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 or later is required. Node.js 24 LTS is recommended.
  pause
  exit /b 1
)
node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 22 ? 0 : 1)"
if errorlevel 1 (
  echo Node.js 22 or later is required. Node.js 24 LTS is recommended.
  pause
  exit /b 1
)
if not exist "node_modules\music-metadata\package.json" (
  echo Installing music tag reader. Internet is needed for the first setup.
  call npm install --omit=dev
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
node server.mjs --open
pause
