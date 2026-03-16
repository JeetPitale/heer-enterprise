#!/bin/bash

# Navigate to the directory where the script is located
cd "$(dirname "$0")"

clear
echo "=========================================================="
echo "    HEER ENTERPRISE - ML SERVICE (macOS)"
echo "=========================================================="
echo "Starting date: $(date)"
echo ""

if [ ! -d "ml" ]; then
    echo "❌ ERROR: 'ml' directory not found!"
    read -p "Press Enter to exit..."
    exit 1
fi

cd ml

if [ -d "venv" ]; then
    echo "🚀 Launching AI Model Service..."
    ./venv/bin/python3 app.py
else
    echo "❌ ERROR: Virtual environment not found."
    python3 app.py
fi
