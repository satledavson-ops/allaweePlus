#!/bin/bash

# AllaweePlus Production Deployment Script
# Optimized for 20,000 concurrent users and 500,000+ records

set -e  # Exit on any error

echo "🚀 Starting AllaweePlus Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="allaweeplus"
PROJECT_DIR="/var/www/allaweeplus"
VENV_DIR="$PROJECT_DIR/venv"
BACKUP_DIR="/var/backups/allaweeplus"
LOG_DIR="/var/log/allaweeplus"

# Create necessary directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
sudo mkdir -p $PROJECT_DIR
sudo mkdir -p $BACKUP_DIR
sudo mkdir -p $LOG_DIR
sudo mkdir -p /var/www/allaweeplus/static
sudo mkdir -p /var/www/allaweeplus/media

# Set ownership
sudo chown -R $USER:www-data $PROJECT_DIR
sudo chown -R $USER:www-data $LOG_DIR

echo -e "${GREEN}✅ Directories created${NC}"

# Install system dependencies
echo -e "${YELLOW}📦 Installing system dependencies...${NC}"
sudo apt update
sudo apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    postgresql \
    postgresql-contrib \
    redis-server \
    nginx \
    supervisor \
    git \
    curl \
    build-essential \
    libpq-dev \
    python3-dev

echo -e "${GREEN}✅ System dependencies installed${NC}"

# Setup PostgreSQL
echo -e "${YELLOW}🐘 Setting up PostgreSQL...${NC}"
sudo -u postgres createdb ${PROJECT_NAME}_prod || echo "Database may already exist"
sudo -u postgres createuser ${PROJECT_NAME}_user || echo "User may already exist"
sudo -u postgres psql -c "ALTER USER ${PROJECT_NAME}_user WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${PROJECT_NAME}_prod TO ${PROJECT_NAME}_user;"

echo -e "${GREEN}✅ PostgreSQL configured${NC}"

# Setup Redis
echo -e "${YELLOW}🔄 Configuring Redis...${NC}"
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Configure Redis for production
sudo tee /etc/redis/redis.conf.d/allaweeplus.conf > /dev/null <<EOF
# AllaweePlus Redis Configuration
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
EOF

sudo systemctl restart redis-server

echo -e "${GREEN}✅ Redis configured${NC}"

# Setup Python environment
echo -e "${YELLOW}🐍 Setting up Python environment...${NC}"
cd $PROJECT_DIR
python3 -m venv $VENV_DIR
source $VENV_DIR/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements_production.txt

echo -e "${GREEN}✅ Python environment ready${NC}"

# Database migrations
echo -e "${YELLOW}📊 Running database migrations...${NC}"
python manage.py migrate --settings=core.settings_production

echo -e "${GREEN}✅ Database migrations completed${NC}"

# Collect static files
echo -e "${YELLOW}📁 Collecting static files...${NC}"
python manage.py collectstatic --noinput --settings=core.settings_production

echo -e "${GREEN}✅ Static files collected${NC}"

# Create superuser
echo -e "${YELLOW}👤 Creating superuser...${NC}"
echo "from django.contrib.auth.models import User; User.objects.create_superuser('admin', 'admin@allaweplus.com', 'admin123') if not User.objects.filter(username='admin').exists() else print('Admin user already exists')" | python manage.py shell --settings=core.settings_production

echo -e "${GREEN}✅ Superuser created${NC}"

# Setup Gunicorn
echo -e "${YELLOW}🦄 Configuring Gunicorn...${NC}"
sudo tee /etc/supervisor/conf.d/allaweeplus.conf > /dev/null <<EOF
[program:allaweeplus]
command=$VENV_DIR/bin/gunicorn core.wsgi:application
directory=$PROJECT_DIR/allawee_backend
user=$USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=$LOG_DIR/gunicorn.log
environment=DJANGO_SETTINGS_MODULE="core.settings_production"

# Gunicorn configuration for high concurrency
numprocs=4
process_name=%(program_name)s_%(process_num)02d
EOF

echo -e "${GREEN}✅ Gunicorn configured${NC}"

# Setup Celery
echo -e "${YELLOW}🌿 Configuring Celery...${NC}"
sudo tee /etc/supervisor/conf.d/celery.conf > /dev/null <<EOF
[program:celery]
command=$VENV_DIR/bin/celery -A core worker --loglevel=info --concurrency=8
directory=$PROJECT_DIR/allawee_backend
user=$USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=$LOG_DIR/celery.log
environment=DJANGO_SETTINGS_MODULE="core.settings_production"

[program:celerybeat]
command=$VENV_DIR/bin/celery -A core beat --loglevel=info
directory=$PROJECT_DIR/allawee_backend
user=$USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=$LOG_DIR/celerybeat.log
environment=DJANGO_SETTINGS_MODULE="core.settings_production"
EOF

echo -e "${GREEN}✅ Celery configured${NC}"

# Setup Nginx
echo -e "${YELLOW}🌐 Configuring Nginx...${NC}"
sudo tee /etc/nginx/sites-available/allaweeplus > /dev/null <<EOF
upstream allaweeplus_backend {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
    server 127.0.0.1:8003;
}

server {
    listen 80;
    server_name your-domain.com api.allaweplus.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;
    
    client_max_body_size 10M;
    
    location /static/ {
        alias /var/www/allaweeplus/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /media/ {
        alias /var/www/allaweeplus/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    location /api/accounts/auth/login/ {
        limit_req zone=login burst=10 nodelay;
        proxy_pass http://allaweeplus_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://allaweeplus_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeout settings for high concurrency
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location / {
        proxy_pass http://allaweeplus_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/allaweeplus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

echo -e "${GREEN}✅ Nginx configured${NC}"

# Update Gunicorn configuration for multiple workers
sudo tee /etc/supervisor/conf.d/allaweeplus.conf > /dev/null <<EOF
[group:allaweeplus]
programs=allaweeplus_8000,allaweeplus_8001,allaweeplus_8002,allaweeplus_8003

[program:allaweeplus_8000]
command=$VENV_DIR/bin/gunicorn core.wsgi:application --bind 127.0.0.1:8000 --workers 4 --worker-class gevent --worker-connections 1000
directory=$PROJECT_DIR/allawee_backend
user=$USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=$LOG_DIR/gunicorn_8000.log
environment=DJANGO_SETTINGS_MODULE="core.settings_production"

[program:allaweeplus_8001]
command=$VENV_DIR/bin/gunicorn core.wsgi:application --bind 127.0.0.1:8001 --workers 4 --worker-class gevent --worker-connections 1000
directory=$PROJECT_DIR/allawee_backend
user=$USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=$LOG_DIR/gunicorn_8001.log
environment=DJANGO_SETTINGS_MODULE="core.settings_production"

[program:allaweeplus_8002]
command=$VENV_DIR/bin/gunicorn core.wsgi:application --bind 127.0.0.1:8002 --workers 4 --worker-class gevent --worker-connections 1000
directory=$PROJECT_DIR/allawee_backend
user=$USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=$LOG_DIR/gunicorn_8002.log
environment=DJANGO_SETTINGS_MODULE="core.settings_production"

[program:allaweeplus_8003]
command=$VENV_DIR/bin/gunicorn core.wsgi:application --bind 127.0.0.1:8003 --workers 4 --worker-class gevent --worker-connections 1000
directory=$PROJECT_DIR/allawee_backend
user=$USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=$LOG_DIR/gunicorn_8003.log
environment=DJANGO_SETTINGS_MODULE="core.settings_production"
EOF

# Reload supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all

echo -e "${GREEN}✅ All services configured and started${NC}"

# Setup log rotation
echo -e "${YELLOW}📝 Setting up log rotation...${NC}"
sudo tee /etc/logrotate.d/allaweeplus > /dev/null <<EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        supervisorctl restart allaweeplus:*
        supervisorctl restart celery
        supervisorctl restart celerybeat
    endscript
}
EOF

echo -e "${GREEN}✅ Log rotation configured${NC}"

# Performance tuning
echo -e "${YELLOW}⚡ Applying performance tuning...${NC}"

# PostgreSQL tuning
sudo tee -a /etc/postgresql/*/main/postgresql.conf > /dev/null <<EOF

# AllaweePlus Performance Tuning
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 8MB
min_wal_size = 2GB
max_wal_size = 8GB
max_connections = 200
EOF

sudo systemctl restart postgresql

echo -e "${GREEN}✅ Performance tuning applied${NC}"

# Create backup script
echo -e "${YELLOW}💾 Setting up backup system...${NC}"
sudo tee /usr/local/bin/allaweeplus_backup.sh > /dev/null <<EOF
#!/bin/bash
# AllaweePlus Backup Script

BACKUP_DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/allaweeplus_backup_\$BACKUP_DATE.sql"

# Database backup
pg_dump -h localhost -U ${PROJECT_NAME}_user -d ${PROJECT_NAME}_prod > \$BACKUP_FILE

# Compress backup
gzip \$BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: \$BACKUP_FILE.gz"
EOF

sudo chmod +x /usr/local/bin/allaweeplus_backup.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/allaweeplus_backup.sh") | crontab -

echo -e "${GREEN}✅ Backup system configured${NC}"

# Final system checks
echo -e "${YELLOW}🔍 Performing final system checks...${NC}"

# Check services
sudo systemctl status postgresql --no-pager
sudo systemctl status redis-server --no-pager
sudo systemctl status nginx --no-pager
sudo supervisorctl status

echo -e "${GREEN}🎉 AllaweePlus Production Deployment Complete!${NC}"
echo ""
echo -e "${YELLOW}📊 System Capacity:${NC}"
echo "• Concurrent Users: 20,000+"
echo "• Database Records: 500,000+"
echo "• Gunicorn Workers: 16 (4 instances × 4 workers)"
echo "• Celery Workers: 8"
echo "• Redis Cache: 2GB"
echo "• PostgreSQL: Optimized for high concurrency"
echo ""
echo -e "${YELLOW}🔗 Access Points:${NC}"
echo "• API: http://your-domain.com/api/"
echo "• Admin: http://your-domain.com/admin/"
echo "• Logs: $LOG_DIR/"
echo ""
echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo "1. Update DNS records to point to this server"
echo "2. Configure SSL certificate (Let's Encrypt recommended)"
echo "3. Update environment variables in settings_production.py"
echo "4. Test all endpoints"
echo "5. Monitor logs and performance"
