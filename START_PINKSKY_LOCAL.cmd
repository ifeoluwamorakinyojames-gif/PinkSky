@echo off
setlocal
cd /d "%~dp0"

if not exist ".env" (
  echo.
  echo [Pink Sky] .env is missing.
  echo Copying .env.example to .env and opening it for configuration.
  copy /Y ".env.example" ".env" >nul
  notepad ".env"
  echo.
  echo Save .env, then run START_PINKSKY_LOCAL.cmd again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo.
  echo [Pink Sky] node_modules is missing. Running npm install once...
  call npm install
  if errorlevel 1 (
    echo npm install failed. Check your internet connection and Node.js installation.
    pause
    exit /b 1
  )
)

echo Starting Pink Sky backend and frontend...
start "Pink Sky API" cmd /k "cd /d "%~dp0" && npm run dev:api"
start "Pink Sky Web" cmd /k "cd /d "%~dp0" && npm run dev:web"

echo.
echo Pink Sky is starting in two CMD windows.
echo Website: http://localhost:5173/
echo Admin:   http://localhost:5173/#/admin
echo If Vite chooses another port, use the URL shown in the Web CMD window.
pause
