# Deployment Guide - Nezha KYC Orchestrator

This guide covers deploying the Nezha KYC Orchestrator to production environments.

## Pre-Deployment Checklist

Before deploying to production, ensure you have:

- [ ] Changed all default passwords and secrets
- [ ] Configured SSL certificates for HTTPS
- [ ] Set up database backups
- [ ] Configured proper CORS settings
- [ ] Set up monitoring and logging
- [ ] Reviewed security settings
- [ ] Tested the application thoroughly
- [ ] Prepared rollback plan

## Deployment Options

### Option 1: Docker Compose Deployment (Recommended)

This is the simplest deployment method for small to medium installations.

#### Prerequisites
- Ubuntu 20.04+ or similar Linux distribution
- Docker and Docker Compose installed
- Domain name pointed to your server
- SSL certificate (Let's Encrypt recommended)

#### Steps

1. **Clone repository on server**

```bash
git clone https://github.com/your-org/hk-kyc-platform.git
cd hk-kyc-platform
```

2. **Configure environment variables**

```bash
# Backend
cp backend/.env.example backend/.env
nano backend/.env
```

Update these critical values:
```env
NODE_ENV=production
DATABASE_URL=postgresql://kyc_user:STRONG_PASSWORD@postgres:5432/kyc_db
JWT_SECRET=GENERATE_STRONG_SECRET_HERE
N8N_API_KEY=GENERATE_STRONG_API_KEY
FRONTEND_URL=https://yourdomain.com
```

3. **Update docker-compose.yml for production**

```yaml
# Add SSL certificates volume mount
volumes:
  - ./ssl:/etc/ssl/certs
```

4. **Start services**

```bash
docker-compose up -d
```

5. **Initialize database**

```bash
docker exec -it kyc-backend npx prisma migrate deploy
```

6. **Pull Ollama model**

```bash
docker exec -it kyc-ollama ollama pull llama2
```

7. **Set up Nginx reverse proxy** (see below)

### Option 2: Manual Production Deployment

For more control and scalability.

#### Backend Deployment

1. **Set up Node.js environment**

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

2. **Deploy backend**

```bash
cd backend
npm ci --production
npx prisma generate
npx prisma migrate deploy

# Start with PM2
pm2 start src/server.js --name kyc-backend
pm2 save
pm2 startup
```

#### Frontend Deployment

1. **Build frontend**

```bash
cd frontend
npm ci
npm run build
```

2. **Serve with Nginx** (see Nginx configuration below)

## Nginx Configuration

### With SSL (Production)

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        root /var/www/kyc-platform/frontend/dist;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase upload size
        client_max_body_size 10M;
    }

    # n8n (optional - keep internal if possible)
    location /n8n/ {
        proxy_pass http://localhost:5678/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Restrict access to internal network only
        allow 10.0.0.0/8;
        allow 172.16.0.0/12;
        allow 192.168.0.0/16;
        deny all;
    }
}
```

### Setting Up Let's Encrypt SSL

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Database Backup

### Automated Backup Script

Create `/etc/cron.daily/backup-kyc-db`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/kyc-platform"
RETENTION_DAYS=30
DB_NAME="kyc_db"
DB_USER="kyc_user"
DB_PASS="your_password"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/kyc_db_$TIMESTAMP.sql.gz

# Backup uploaded files
tar -czf $BACKUP_DIR/uploads_$TIMESTAMP.tar.gz /path/to/uploads

# Delete old backups
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete

# Upload to S3 (optional)
# aws s3 cp $BACKUP_DIR/kyc_db_$TIMESTAMP.sql.gz s3://your-bucket/backups/
```

Make it executable:
```bash
sudo chmod +x /etc/cron.daily/backup-kyc-db
```

## Monitoring

### PM2 Monitoring

```bash
# View logs
pm2 logs kyc-backend

# Monitor processes
pm2 monit

# Restart on failure
pm2 restart kyc-backend
```

### Docker Monitoring

```bash
# View logs
docker-compose logs -f

# Check resource usage
docker stats

# Restart services
docker-compose restart [service-name]
```

### Application Monitoring (Optional)

Consider integrating:
- **Prometheus + Grafana** for metrics
- **ELK Stack** for log aggregation
- **Sentry** for error tracking
- **UptimeRobot** for uptime monitoring

## Security Hardening

### Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Database Security

```bash
# PostgreSQL configuration in postgresql.conf
listen_addresses = 'localhost'
ssl = on

# Update pg_hba.conf
hostssl all all 0.0.0.0/0 md5
```

### Environment Security

- Store secrets in environment variables, not in code
- Use Docker secrets for sensitive data
- Rotate JWT secrets periodically
- Enable database connection SSL
- Use strong passwords (minimum 16 characters)

### File Upload Security

- Configure antivirus scanning (ClamAV)
- Set strict file type validation
- Limit upload sizes
- Store uploads outside web root

## Performance Optimization

### Backend

1. **Enable Node.js clustering** (PM2):
```bash
pm2 start server.js -i max
```

2. **Use Redis for session storage** (future enhancement)

3. **Enable Nginx caching** for API responses

### Frontend

1. **Enable Gzip compression** (already in Nginx config)
2. **Use CDN** for static assets
3. **Enable browser caching**

### Database

1. **Add indexes** for frequently queried fields
2. **Enable connection pooling**
3. **Regular VACUUM** operations

```sql
-- Optimize database
VACUUM ANALYZE;

-- Check index usage
SELECT * FROM pg_stat_user_indexes;
```

## Scaling

### Horizontal Scaling

1. **Load Balancer**: Use Nginx or HAProxy
2. **Multiple Backend Instances**: Scale with PM2 cluster mode
3. **Database Read Replicas**: For read-heavy workloads
4. **Shared File Storage**: Use NFS or S3 for uploads

### Vertical Scaling

Recommended minimum resources:
- **Development**: 2 vCPU, 4GB RAM
- **Production (small)**: 4 vCPU, 8GB RAM
- **Production (medium)**: 8 vCPU, 16GB RAM

## Troubleshooting Production Issues

### Service Won't Start

```bash
# Check logs
docker-compose logs [service]
pm2 logs

# Check disk space
df -h

# Check memory
free -m
```

### High Memory Usage

```bash
# Restart services
pm2 restart all
docker-compose restart

# Check processes
htop
docker stats
```

### Database Connection Issues

```bash
# Test connection
psql -U kyc_user -d kyc_db -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

## Rollback Procedure

If deployment fails:

1. **Stop new services**
```bash
docker-compose down
# or
pm2 stop all
```

2. **Restore database backup**
```bash
gunzip < backup.sql.gz | psql -U kyc_user kyc_db
```

3. **Revert to previous version**
```bash
git checkout <previous-commit>
docker-compose up -d
```

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/hk-kyc-platform
            git pull
            docker-compose up -d --build
```

## Support and Maintenance

- Schedule regular updates for dependencies
- Monitor security advisories
- Keep backups tested and verified
- Document any custom configurations
- Maintain runbook for common issues

For questions or issues:
- GitHub Issues: https://github.com/your-org/hk-kyc-platform/issues
- Email: support@nezha-kyc.com
