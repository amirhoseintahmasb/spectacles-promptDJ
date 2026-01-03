#!/bin/bash
# Music AI Service - Start Script
# ================================

cd "$(dirname "$0")"

# Activate virtual environment
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
else
    echo "❌ Virtual environment not found. Run setup.sh first."
    exit 1
fi

echo "🎵 Starting Music AI Service..."
echo "   API Docs: http://172.20.10.4:8123/docs"
echo "   Press Ctrl+C to stop"
echo ""

uvicorn app:app --reload --host 0.0.0.0 --port 8123

