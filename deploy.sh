#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Updating EFL-Workflow on Production VPS"
echo "=========================================="

echo "📥 1. Pulling latest commits from GitHub..."
git fetch origin main
git reset --hard origin/main

echo "🐳 2. Rebuilding and starting Docker containers..."
docker compose down || true
docker compose up -d --build

echo "🔄 3. Synchronizing Database Schema..."
sleep 4
docker compose exec -T efl-workflow-app npx prisma db push

echo "=========================================="
echo "✅ EFL-Workflow is successfully updated!"
echo "🌐 URL: http://localhost:3010 (or your VPS IP/Domain)"
echo "=========================================="
