# Asystem Platform - VPS Deployment Guide

Complete guide for deploying Asystem Platform on your own VPS with DuckDNS domain and free SSL certificate.

## Prerequisites

### 1. VPS Requirements
- **OS**: Ubuntu 22.04 LTS (recommended) or any Linux with Docker support
- **RAM**: Minimum 2GB, recommended 4GB+
- **Storage**: Minimum 20GB
- **CPU**: 2+ cores recommended
- **Provider**: Any VPS provider (DigitalOcean, Hetzner, Linode, OVH, etc.)

### 2. Software Requirements
Your VPS needs:
- Docker (version 20.10+)
- Docker Compose (version 2.0+)
- Git

### 3. Accounts & Keys
- DuckDNS account (free): https://www.duckdns.org/
- OpenRouter API key — get one at https://openrouter.ai/keys (NEVER paste a real key into this file or any *.md — only into the server's `.env`)

---

## Step 1: DuckDNS Setup

1. **Go to DuckDNS**: https://www.duckdns.org/
2. **Sign in** with any social account
3. **Create subdomain**:
   - Choose a name (e.g., `myhotel`, `asystem-demo`)
   - Your domain will be: `myhotel.duckdns.org`
   - Enter your VPS IP address
   - Click "Add domain"

4. **Save your token** - you'll see it on the main page (optional, for auto-updates)

---

## Step 2: VPS Preparation

### Connect to your VPS
```bash
ssh root@YOUR_VPS_IP
```

### Install Docker
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### Install Git
```bash
apt install git -y
```

---

## Step 3: Deploy Application

### 1. Clone or upload your project
```bash
# If using Git:
git clone YOUR_REPOSITORY_URL
cd asystem-platform

# Or upload via SCP from your local machine:
# scp -r "C:\Users\user\Desktop\ии ассистенты" root@YOUR_VPS_IP:/root/asystem-platform
```

### 2. Configure environment variables
```bash
# Copy production template
cp .env.production .env

# Edit with your values
nano .env
```

Update these values in `.env`:
```env
# Strong password for PostgreSQL
POSTGRES_PASSWORD=your-super-strong-password-here

# Secret key for JWT (generate random 32+ chars)
SECRET_KEY=your-super-secret-key-min-32-characters-random-string

# Your OpenRouter API key (paste real key only into the server's .env, never into *.md)
OPENROUTER_API_KEY=sk-or-v1-...

# Your DuckDNS domain
WEBHOOK_BASE_URL=https://myhotel.duckdns.org

# CORS (same as webhook URL)
BACKEND_CORS_ORIGINS=https://myhotel.duckdns.org

# Frontend API URL
NEXT_PUBLIC_API_URL=https://myhotel.duckdns.org/api
```

**💡 Tip**: Generate secure SECRET_KEY:
```bash
openssl rand -hex 32
```

### 3. Configure Nginx domain
```bash
# Edit nginx config
nano nginx/conf.d/default.conf
```

Replace ALL occurrences of `your-subdomain.duckdns.org` with your actual DuckDNS domain (e.g., `myhotel.duckdns.org`).

There are 3 places to replace:
- Line 5: `server_name`
- Line 21: `server_name`
- Line 24-25: SSL certificate paths

### 4. Make scripts executable
```bash
chmod +x deploy.sh init-ssl.sh update.sh
```

### 5. Run initial deployment
```bash
./deploy.sh
```

This script will:
- Stop any existing containers
- Build Docker images
- Start PostgreSQL
- Run database migrations
- Start all services (backend, frontend, nginx)

**⏱️ This will take 5-10 minutes** - Docker needs to build images.

### 6. Initialize SSL certificate
```bash
./init-ssl.sh
```

This script will:
- Temporarily configure Nginx for HTTP
- Request Let's Encrypt certificate for your domain
- Update Nginx to use HTTPS
- Restart Nginx with SSL enabled

**📝 Note**: Your domain must point to your VPS IP for this to work!

---

## Step 4: Verify Deployment

### Check services are running
```bash
docker-compose ps
```

All services should show "Up" status:
- `asystem-postgres` - Database
- `asystem-backend` - FastAPI API
- `asystem-frontend` - Next.js frontend
- `asystem-nginx` - Reverse proxy
- `asystem-certbot` - SSL renewal

### Check logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Exit logs: Ctrl+C
```

### Test application
1. **Open browser**: `https://myhotel.duckdns.org` (your domain)
2. **Check SSL**: Should show green padlock
3. **Login page**: Should load correctly
4. **Quick Login**: Click "Быстрый вход" button
5. **Dashboard**: Should redirect to dashboard

### Test API
```bash
# From your local machine or VPS:
curl https://myhotel.duckdns.org/api/health

# Should return: {"status":"healthy"}
```

---

## Step 5: Create Your First Hotel

### 1. Get Telegram Bot Token
1. Open Telegram
2. Search for `@BotFather`
3. Send `/newbot`
4. Follow instructions to create bot
5. Copy the token (looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Create hotel via API
```bash
curl -X POST "https://myhotel.duckdns.org/api/hotels/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "My Hotel",
    "slug": "my-hotel",
    "description": "5-star luxury hotel",
    "telegram_bot_token": "YOUR_TELEGRAM_BOT_TOKEN"
  }'
```

**To get JWT token**: Use Quick Login in the web interface, open DevTools (F12), go to Application → Local Storage → token

### 3. Test Telegram Bot
1. Open your bot in Telegram (link from BotFather)
2. Send `/start`
3. Ask a question about the hotel
4. Bot should respond with AI-generated answer!

---

## Maintenance & Updates

### Update application with new code
```bash
cd /root/asystem-platform
./update.sh
```

### View logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Restart services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Stop application
```bash
docker-compose down
```

### Start application
```bash
docker-compose up -d
```

### Database backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres asystem > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose exec -T postgres psql -U postgres asystem < backup_20240101_120000.sql
```

### SSL certificate renewal
Certificate auto-renews via certbot container. Manual renewal:
```bash
docker-compose run --rm certbot renew
docker-compose restart nginx
```

---

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Remove all containers and start fresh
docker-compose down -v
./deploy.sh
```

### Database connection errors
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Nginx 502 Bad Gateway
```bash
# Check backend is running
docker-compose ps backend

# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### SSL certificate issues
```bash
# Check certbot logs
docker-compose logs certbot

# Remove old certificates and reinit
rm -rf certbot/conf/live
./init-ssl.sh
```

### Frontend not loading
```bash
# Check frontend logs
docker-compose logs frontend

# Check if built correctly
docker-compose exec frontend ls -la .next

# Rebuild frontend
docker-compose up -d --no-deps --build frontend
```

### Telegram webhook not working
```bash
# Check webhook is registered
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"

# Check backend logs for webhook requests
docker-compose logs backend | grep webhook

# Check WEBHOOK_BASE_URL is correct in .env
cat .env | grep WEBHOOK_BASE_URL
```

---

## Security Recommendations

### 1. Firewall Configuration
```bash
# Install UFW
apt install ufw -y

# Allow SSH
ufw allow 22/tcp

# Allow HTTP & HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable
```

### 2. Change Default PostgreSQL Port
In `docker-compose.yml`, change:
```yaml
ports:
  - "127.0.0.1:5432:5432"  # Only accessible from localhost
```

### 3. Regular Backups
Set up cron job for daily backups:
```bash
crontab -e
```

Add:
```cron
0 2 * * * cd /root/asystem-platform && docker-compose exec postgres pg_dump -U postgres asystem > /root/backups/backup_$(date +\%Y\%m\%d).sql
```

### 4. Update System Regularly
```bash
apt update && apt upgrade -y
```

### 5. Monitor Logs
```bash
# Check for errors daily
docker-compose logs --since=24h | grep -i error
```

---

## Cost Estimation

### VPS Providers (Monthly)
- **Hetzner**: €4.51 ($5) - 2 vCPU, 4GB RAM, 40GB SSD
- **DigitalOcean**: $6 - 1 vCPU, 1GB RAM, 25GB SSD
- **Linode**: $5 - 1 vCPU, 1GB RAM, 25GB SSD
- **OVH**: €3.50 ($4) - 1 vCPU, 2GB RAM, 20GB SSD

### Other Costs
- **DuckDNS**: Free ✅
- **Let's Encrypt SSL**: Free ✅
- **OpenRouter API**: Pay-per-use (~$0.001 per request)

**Total**: $4-6/month + API usage

---

## Architecture Overview

```
                 Internet
                    ↓
          [DuckDNS + SSL Certificate]
                    ↓
              [Nginx :80/:443]
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
   [Frontend :3000]      [Backend :8000]
   Next.js App           FastAPI API
        ↓                       ↓
        └───────────┬───────────┘
                    ↓
             [PostgreSQL :5432]
                Database
```

### Components:
- **Nginx**: Reverse proxy, SSL termination, static file serving
- **Frontend**: Next.js server-side rendering
- **Backend**: FastAPI REST API
- **PostgreSQL**: Database for hotels, users, conversations
- **Certbot**: Automatic SSL certificate renewal

---

## Next Steps

1. ✅ Deploy to VPS following this guide
2. 📱 Create Telegram bots for your hotels
3. 🏨 Add hotel information (rooms, amenities, rules)
4. 🤖 Customize AI assistant behavior
5. 📊 Monitor usage via logs
6. 🚀 Scale by upgrading VPS or adding load balancer

---

## Support

### Useful Commands
```bash
# Check all Docker containers
docker ps -a

# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU usage
top

# System resource usage by containers
docker stats

# Remove unused Docker images
docker system prune -a
```

### OpenRouter API Issues
- Check API key is correct in `.env`
- Monitor usage: https://openrouter.ai/activity
- Check rate limits: https://openrouter.ai/docs

### DuckDNS Issues
- Verify domain points to correct IP: `nslookup your-domain.duckdns.org`
- Update IP if changed: https://www.duckdns.org/update?domains=YOUR_DOMAIN&token=YOUR_TOKEN&ip=NEW_IP

---

**🎉 Congratulations!** Your Asystem Platform is now running on your VPS with HTTPS!
