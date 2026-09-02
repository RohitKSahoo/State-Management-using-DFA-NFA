#!/usr/bin/env bash

echo "==================================================="
echo "  STATELINT - AUTOMATA ENGINE & STATE MANAGEMENT   "
echo "==================================================="
echo ""
echo "[1/3] Building core packages..."
npm run build

echo ""
echo "[2/3] Seeding demo database workflows..."
npm run seed || echo "[WARNING] Database seed encountered an issue, continuing..."

echo ""
echo "[3/3] Launching Express API (Port 3001) & Vite Web Frontend (Port 5173)..."
echo "Open your browser at: http://localhost:5173"
echo ""
npm run dev
