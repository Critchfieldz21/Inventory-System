#!/bin/bash
# Cross-platform startup for macOS and Linux
# This script automatically handles virtual environment and dependencies

set -e

PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$PROJECT_ROOT"

echo "=================================================="
echo "Inventory Tracker - Starting Application"
echo "=================================================="
echo ""

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
    echo "Virtual environment created"
fi

# Activate virtual environment
source .venv/bin/activate

# Install/upgrade Python dependencies
echo "Installing Python dependencies..."
pip install -q --upgrade pip
pip install -q django djangorestframework django-cors-headers python-dotenv

# Run migrations
echo "Running database migrations..."
cd inventory-tracker/src/Backend
python manage.py migrate --noinput > /dev/null 2>&1 || true
cd "$PROJECT_ROOT/inventory-tracker"

echo ""
echo "Setup complete!"
echo "=================================================="
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "=================================================="
echo ""

# Start the application
npm run dev
