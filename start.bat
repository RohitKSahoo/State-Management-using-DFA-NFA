@echo off
echo ===================================================
echo   STATELINT - AUTOMATA ENGINE & STATE MANAGEMENT
echo ===================================================
echo.
echo [1/3] Building core packages...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Seeding demo database workflows...
call npm run seed
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Database seed encountered an issue, continuing...
)

echo.
echo [3/3] Launching Express API (Port 3001) & Vite Web Frontend (Port 5173)...
echo Open your browser at: http://localhost:5173
echo.
call npm run dev
