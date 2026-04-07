#!/bin/bash

# SSL Certificate Initialization Script
# This script obtains Let's Encrypt SSL certificates for your domain

set -e

echo "======================================"
echo "SSL Certificate Initialization"
echo "======================================"

# Extract domain from nginx config
DOMAIN=$(grep "server_name" nginx/conf.d/default.conf | head -1 | awk '{print $2}' | sed 's/;//')

if [ "$DOMAIN" = "your-subdomain.duckdns.org" ]; then
    echo "❌ Error: Please configure your DuckDNS subdomain in nginx/conf.d/default.conf first"
    exit 1
fi

echo "Domain: $DOMAIN"
echo ""

# Check if certificate already exists
if [ -d "certbot/conf/live/$DOMAIN" ]; then
    echo "⚠️  Certificate already exists for $DOMAIN"
    read -p "Do you want to renew it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
    RENEW_FLAG="--force-renewal"
else
    RENEW_FLAG=""
fi

# Create directories
mkdir -p certbot/conf
mkdir -p certbot/www

# Temporary nginx config for initial certificate
echo "📝 Creating temporary nginx config for certificate challenge..."
cat > nginx/conf.d/default.conf.temp << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Waiting for SSL certificate...';
        add_header Content-Type text/plain;
    }
}
EOF

# Backup original config
cp nginx/conf.d/default.conf nginx/conf.d/default.conf.backup

# Use temporary config
mv nginx/conf.d/default.conf.temp nginx/conf.d/default.conf

# Restart nginx with temporary config
echo "🔄 Restarting nginx with temporary config..."
docker-compose restart nginx

# Wait for nginx to be ready
sleep 5

# Request certificate
echo "🔐 Requesting SSL certificate from Let's Encrypt..."
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@$DOMAIN \
    --agree-tos \
    --no-eff-email \
    $RENEW_FLAG \
    -d $DOMAIN

# Restore original config
echo "📝 Restoring nginx config..."
mv nginx/conf.d/default.conf.backup nginx/conf.d/default.conf

# Restart nginx with SSL
echo "🔄 Restarting nginx with SSL enabled..."
docker-compose restart nginx

echo ""
echo "✅ SSL certificate obtained successfully!"
echo ""
echo "Your site is now available at: https://$DOMAIN"
echo ""
echo "📝 Certificate will auto-renew via certbot container"
echo ""
