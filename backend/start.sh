#!/bin/bash
# Startup script for Code Connect Live Backend

cd "$(dirname "$0")"

echo "Starting Code Connect Live Backend..."
echo "Installing dependencies..."
uv sync

echo ""
echo "Starting server on http://0.0.0.0:3000"
echo "API Documentation: http://localhost:3000/docs"
echo ""

uv run python main.py
