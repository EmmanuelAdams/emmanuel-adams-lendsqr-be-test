#!/bin/sh
set -e

echo "Running database migrations..."
npm run migrate:docker

echo "Starting application..."
exec node dist/server.js
