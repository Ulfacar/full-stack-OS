#!/bin/bash

# Asystem Platform - Update Deployment Script
# This script updates the running application with new code

set -e

echo "==================================="
echo "Asystem Platform - Update"
echo "==================================="

# Pull latest code from git (if using git)
if [ -d .git ]; then
    echo "📥 Pulling latest code..."
    git pull
else
    echo "⚠️  Not a git repository, skipping pull"
fi

# Rebuild images
echo "🔨 Rebuilding images..."
docker-compose build

# Restart services with zero-downtime
echo "🔄 Restarting services..."

# Update backend
echo "  - Updating backend..."
docker-compose up -d --no-deps --build backend

# Run migrations
echo "  - Running database migrations..."
docker-compose exec backend alembic upgrade head || true

# Update frontend
echo "  - Updating frontend..."
docker-compose up -d --no-deps --build frontend

# Restart nginx (quick, no downtime)
echo "  - Reloading nginx..."
docker-compose exec nginx nginx -s reload || docker-compose restart nginx

echo ""
echo "✅ Update complete!"
echo ""
echo "🔍 Check logs for any issues:"
echo "  docker-compose logs -f backend"
echo "  docker-compose logs -f frontend"
echo ""
