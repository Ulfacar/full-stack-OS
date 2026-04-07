#!/bin/bash

# Asystem Platform - VPS Deployment Script
# This script deploys the entire stack on a VPS

set -e  # Exit on error

echo "==================================="
echo "Asystem Platform - VPS Deployment"
echo "==================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.production to .env and fill in your values:"
    echo "  cp .env.production .env"
    echo "  nano .env"
    exit 1
fi

# Check if DuckDNS subdomain is configured
if grep -q "your-subdomain.duckdns.org" nginx/conf.d/default.conf; then
    echo "❌ Error: Please configure your DuckDNS subdomain in nginx/conf.d/default.conf"
    echo "Replace 'your-subdomain.duckdns.org' with your actual subdomain"
    exit 1
fi

echo "✅ Configuration files found"
echo ""

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Pull latest images
echo "📦 Pulling latest base images..."
docker-compose pull postgres nginx certbot

# Build application images
echo "🔨 Building application images..."
docker-compose build --no-cache

# Start database first
echo "🗄️  Starting PostgreSQL..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Run database migrations
echo "🔄 Running database migrations..."
docker-compose run --rm backend alembic upgrade head || true

# Start all services
echo "🚀 Starting all services..."
docker-compose up -d

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Initialize SSL certificate: ./init-ssl.sh"
echo "2. Check logs: docker-compose logs -f"
echo "3. Access your application at: https://$(grep WEBHOOK_BASE_URL .env | cut -d '=' -f2 | sed 's/https:\/\///')"
echo ""
echo "🔍 Useful commands:"
echo "  - View logs: docker-compose logs -f [service]"
echo "  - Restart service: docker-compose restart [service]"
echo "  - Stop all: docker-compose down"
echo "  - Update: ./update.sh"
echo ""
