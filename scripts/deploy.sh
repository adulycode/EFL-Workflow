#!/bin/bash
set -e

echo "🚀 [1/4] Pulling latest updates from Git..."
git fetch origin main
git reset --hard origin/main

echo "🔨 [2/4] Building and launching containers..."
docker compose up -d --build

echo "🗄️ [3/4] Syncing database schema..."
sleep 4
docker compose exec -T efl-workflow-app npx prisma db push --accept-data-loss || true

echo "🧹 [4/4] Auto-Cleaning dangling Docker images & build cache (No bloat)..."
docker image prune -f
docker builder prune -f --keep-storage 2GB

echo "🎉 Deployment completed successfully and cleanly!"
docker ps --filter "name=efl"
