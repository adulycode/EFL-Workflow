#!/bin/sh
set -e

echo "Waiting for PostgreSQL database to be ready..."
until nc -z efl-workflow-db 5432; do
  echo "Waiting for database connection..."
  sleep 2
done

echo "Database is ready! Running Prisma DB push & seeding..."
npx prisma db push --accept-data-loss
npm run prisma:seed || true

echo "Starting EFL-Workflow server on port 3010..."
exec npm run server
