#!/bin/bash
# Music AI Service - Setup Script
# ================================

set -e

echo "🎵 Music AI Service Setup"
echo "========================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.9+ first."
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
echo "✅ Found Python $PYTHON_VERSION"

# Create virtual environment
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
else
    echo "✅ Virtual environment exists"
fi

# Activate
echo "🔄 Activating virtual environment..."
source .venv/bin/activate

# Upgrade pip
echo "📦 Upgrading pip..."
python -m pip install --upgrade pip -q

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt -q

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the service:"
echo "  1. source .venv/bin/activate"
echo "  2. uvicorn app:app --reload --port 8123"
echo ""
echo "Then open: http://127.0.0.1:8123/docs"
echo ""

