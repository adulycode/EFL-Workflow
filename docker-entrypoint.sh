#!/bin/sh
set -e

echo "Waiting for PostgreSQL database to be ready..."
until nc -z efl-workflow-db 5432; do
  echo "Waiting for database connection..."
  sleep 2
done

echo "Database is ready! Running Prisma DB push safely (data loss blocked)..."
# In production, NEVER use --accept-data-loss or --force-reset
npx prisma db push

echo "Starting EFL-Workflow server on port 3010..."
exec npm run server
