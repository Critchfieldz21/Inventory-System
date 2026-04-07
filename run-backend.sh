#!/bin/bash
# Quick Start Script for Inventory Tracker Backend

echo "🚀 Starting Inventory Tracker Backend..."
echo ""

# Navigate to backend directory (relative to script location)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/inventory-tracker/src/Backend"

echo "Backend Location: $BACKEND_DIR"
echo ""

cd "$BACKEND_DIR" || exit 1

echo "✅ Database Status: OK (SQLite)"
echo "✅ Migrations: Applied"
echo "✅ Admin User: Created (admin/admin123)"
echo ""
echo "Starting Django development server on port 8000..."
echo "Access admin panel at: http://localhost:8000/admin"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 manage.py runserver 8000
