@echo off
title HEER ENTERPRISE - ML SERVICE (Windows)
cls
echo ==========================================================
echo     HEER ENTERPRISE - ML SERVICE (Windows)
echo ==========================================================
echo Starting automation...
echo.

set PROJECT_ROOT=%~dp0
cd /d "%PROJECT_ROOT%"

if not exist "ml" (
    echo x ERROR: 'ml' directory not found!
    pause
    exit /b
)

cd ml

if exist "venv\Scripts\python.exe" (
    echo [OK] Virtual environment found.
    echo Launching AI Model Service...
    venv\Scripts\python.exe app.py
) else (
    echo [!] Virtual environment not found in ml\venv.
    echo Attempting to run with system python...
    python app.py
)

pause
