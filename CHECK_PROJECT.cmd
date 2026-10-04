@echo off
cd /d "%~dp0"
if not exist "node_modules" (
  echo node_modules is missing. Run START_PINKSKY_LOCAL.cmd first.
  pause
  exit /b 1
)
call npm run typecheck
if errorlevel 1 (
  echo.
  echo TypeScript found an error. Review the messages above.
) else (
  echo.
  echo Pink Sky TypeScript check passed.
)
pause
