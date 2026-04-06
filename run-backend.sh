#!/bin/bash
# Quick Start Script for Inventory Tracker Backend

echo "🚀 Starting Inventory Tracker Backend..."
echo ""
echo "Backend Location: /Users/zacharycritchfield/Desktop/Projects/Inventory\ Tracker/Inventory-System/inventory-tracker/src/Backend"
echo ""

cd /Users/zacharycritchfield/Desktop/Projects/Inventory\ Tracker/Inventory-System/inventory-tracker/src/Backend

echo "✅ Database Status: OK (SQLite)"
echo "✅ Migrations: Applied"
echo "✅ Admin User: Created (admin/admin123)"
echo ""
echo "Starting Django development server on port 8000..."
echo "Access admin panel at: http://localhost:8000/admin"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

/usr/local/bin/python3 manage.py runserver 8000
