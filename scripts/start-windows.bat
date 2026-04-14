@echo off
REM Cross-platform startup for Windows
REM This script automatically handles virtual environment and dependencies

setlocal enabledelayedexpansion

echo ==================================================
echo Inventory Tracker - Starting Application
echo ==================================================
echo.

REM Get project root directory
set PROJECT_ROOT=%~dp0..

cd /d "%PROJECT_ROOT%"

REM Create virtual environment if it doesn't exist
if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
    echo Virtual environment created
)

REM Activate virtual environment
call .venv\Scripts\activate.bat

REM Install/upgrade Python dependencies
echo Installing Python dependencies...
python -m pip install -q --upgrade pip
pip install -q django djangorestframework django-cors-headers python-dotenv openpyxl

REM Run migrations
echo Running database migrations...
cd inventory-tracker\src\Backend
python manage.py migrate --noinput > nul 2>&1
cd "%PROJECT_ROOT%\inventory-tracker"

echo.
echo Setup complete!
echo ==================================================
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo ==================================================
echo.

REM Start the application
npm run dev

pause
