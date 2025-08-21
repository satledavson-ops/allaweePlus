#!/bin/bash

# AllaweePlus Performance Monitoring Script
# Monitor system performance for 20,000 concurrent users

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

LOG_DIR="/var/log/allaweeplus"
METRICS_FILE="$LOG_DIR/performance_metrics.log"

echo -e "${BLUE}🔍 AllaweePlus Performance Monitor${NC}"
echo "=================================================="

# Function to log metrics
log_metric() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $METRICS_FILE
}

# Check system resources
echo -e "${YELLOW}💻 System Resources:${NC}"
echo "CPU Usage:"
cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}')
echo "  Current: $cpu_usage"
log_metric "CPU_USAGE:$cpu_usage"

echo "Memory Usage:"
memory_usage=$(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}')
memory_available=$(free -h | grep Mem | awk '{print $7}')
echo "  Used: $memory_usage"
echo "  Available: $memory_available"
log_metric "MEMORY_USAGE:$memory_usage"

echo "Disk Usage:"
disk_usage=$(df -h / | awk 'NR==2{printf "%s", $5}')
echo "  Root: $disk_usage"
log_metric "DISK_USAGE:$disk_usage"

echo ""

# Check PostgreSQL performance
echo -e "${YELLOW}🐘 PostgreSQL Status:${NC}"
pg_connections=$(sudo -u postgres psql -d allaweeplus_prod -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null || echo "N/A")
pg_active=$(sudo -u postgres psql -d allaweeplus_prod -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null || echo "N/A")
echo "  Total Connections: $pg_connections"
echo "  Active Connections: $pg_active"
log_metric "PG_CONNECTIONS:$pg_connections"
log_metric "PG_ACTIVE:$pg_active"

# Check top queries
echo "  Top Queries by Duration:"
sudo -u postgres psql -d allaweeplus_prod -c "
    SELECT query, mean_exec_time, calls 
    FROM pg_stat_statements 
    ORDER BY mean_exec_time DESC 
    LIMIT 3;" 2>/dev/null || echo "  pg_stat_statements not available"

echo ""

# Check Redis performance
echo -e "${YELLOW}🔄 Redis Status:${NC}"
redis_info=$(redis-cli info stats 2>/dev/null || echo "Redis not available")
if [[ "$redis_info" != "Redis not available" ]]; then
    redis_memory=$(redis-cli info memory | grep used_memory_human | cut -d: -f2)
    redis_connections=$(redis-cli info clients | grep connected_clients | cut -d: -f2)
    redis_ops=$(redis-cli info stats | grep instantaneous_ops_per_sec | cut -d: -f2)
    echo "  Memory Used: $redis_memory"
    echo "  Connections: $redis_connections"
    echo "  Ops/sec: $redis_ops"
    log_metric "REDIS_MEMORY:$redis_memory"
    log_metric "REDIS_CONNECTIONS:$redis_connections"
    log_metric "REDIS_OPS:$redis_ops"
else
    echo "  Redis not available"
fi

echo ""

# Check Gunicorn processes
echo -e "${YELLOW}🦄 Gunicorn Status:${NC}"
gunicorn_processes=$(pgrep -f gunicorn | wc -l)
echo "  Active Processes: $gunicorn_processes"
log_metric "GUNICORN_PROCESSES:$gunicorn_processes"

# Check Gunicorn memory usage
if [ $gunicorn_processes -gt 0 ]; then
    gunicorn_memory=$(ps aux | grep '[g]unicorn' | awk '{sum+=$6} END {printf "%.1f MB", sum/1024}')
    echo "  Total Memory: $gunicorn_memory"
    log_metric "GUNICORN_MEMORY:$gunicorn_memory"
fi

echo ""

# Check Celery workers
echo -e "${YELLOW}🌿 Celery Status:${NC}"
celery_workers=$(pgrep -f "celery.*worker" | wc -l)
celery_beat=$(pgrep -f "celery.*beat" | wc -l)
echo "  Worker Processes: $celery_workers"
echo "  Beat Process: $celery_beat"
log_metric "CELERY_WORKERS:$celery_workers"
log_metric "CELERY_BEAT:$celery_beat"

echo ""

# Check Nginx status
echo -e "${YELLOW}🌐 Nginx Status:${NC}"
nginx_status=$(systemctl is-active nginx)
echo "  Service Status: $nginx_status"
log_metric "NGINX_STATUS:$nginx_status"

# Check Nginx connections
nginx_connections=$(ss -tuln | grep :80 | wc -l)
echo "  Active Connections: $nginx_connections"
log_metric "NGINX_CONNECTIONS:$nginx_connections"

echo ""

# Application-specific metrics
echo -e "${YELLOW}📊 Application Metrics:${NC}"

# Database record counts
echo "Database Record Counts:"
user_count=$(sudo -u postgres psql -d allaweeplus_prod -t -c "SELECT count(*) FROM accounts_userprofile;" 2>/dev/null | tr -d ' ' || echo "N/A")
loan_count=$(sudo -u postgres psql -d allaweeplus_prod -t -c "SELECT count(*) FROM accounts_loan;" 2>/dev/null | tr -d ' ' || echo "N/A")
payment_count=$(sudo -u postgres psql -d allaweeplus_prod -t -c "SELECT count(*) FROM accounts_payment;" 2>/dev/null | tr -d ' ' || echo "N/A")

echo "  Users: $user_count"
echo "  Loans: $loan_count"
echo "  Payments: $payment_count"
log_metric "USER_COUNT:$user_count"
log_metric "LOAN_COUNT:$loan_count"
log_metric "PAYMENT_COUNT:$payment_count"

# Recent activity (last 24 hours)
echo "Recent Activity (24h):"
new_users=$(sudo -u postgres psql -d allaweeplus_prod -t -c "SELECT count(*) FROM accounts_userprofile WHERE created_at >= NOW() - INTERVAL '24 hours';" 2>/dev/null | tr -d ' ' || echo "N/A")
new_loans=$(sudo -u postgres psql -d allaweeplus_prod -t -c "SELECT count(*) FROM accounts_loan WHERE created_at >= NOW() - INTERVAL '24 hours';" 2>/dev/null | tr -d ' ' || echo "N/A")
new_payments=$(sudo -u postgres psql -d allaweeplus_prod -t -c "SELECT count(*) FROM accounts_payment WHERE created_at >= NOW() - INTERVAL '24 hours';" 2>/dev/null | tr -d ' ' || echo "N/A")

echo "  New Users: $new_users"
echo "  New Loans: $new_loans"
echo "  New Payments: $new_payments"
log_metric "NEW_USERS_24H:$new_users"
log_metric "NEW_LOANS_24H:$new_loans"
log_metric "NEW_PAYMENTS_24H:$new_payments"

echo ""

# Performance alerts
echo -e "${YELLOW}⚠️  Performance Alerts:${NC}"

# High CPU usage
cpu_num=$(echo $cpu_usage | sed 's/%//')
if (( $(echo "$cpu_num > 80" | bc -l) )); then
    echo -e "  ${RED}HIGH CPU USAGE: $cpu_usage${NC}"
fi

# High memory usage
memory_num=$(echo $memory_usage | sed 's/%//')
if (( $(echo "$memory_num > 85" | bc -l) )); then
    echo -e "  ${RED}HIGH MEMORY USAGE: $memory_usage${NC}"
fi

# Too many database connections
if [ "$pg_connections" != "N/A" ] && [ "$pg_connections" -gt 150 ]; then
    echo -e "  ${RED}HIGH DB CONNECTIONS: $pg_connections${NC}"
fi

# Low disk space
disk_num=$(echo $disk_usage | sed 's/%//')
if [ "$disk_num" -gt 85 ]; then
    echo -e "  ${RED}LOW DISK SPACE: $disk_usage${NC}"
fi

# Check for errors in logs
echo ""
echo -e "${YELLOW}📝 Recent Errors:${NC}"
echo "Django Errors (last 10):"
tail -10 $LOG_DIR/gunicorn*.log 2>/dev/null | grep -i error || echo "  No recent errors"

echo ""
echo "Celery Errors (last 5):"
tail -5 $LOG_DIR/celery.log 2>/dev/null | grep -i error || echo "  No recent errors"

echo ""

# Performance recommendations
echo -e "${YELLOW}💡 Performance Recommendations:${NC}"

# Based on current metrics, provide recommendations
if [ "$user_count" != "N/A" ] && [ "$user_count" -gt 100000 ]; then
    echo "  • Consider database partitioning for user tables"
fi

if [ "$pg_connections" != "N/A" ] && [ "$pg_connections" -gt 100 ]; then
    echo "  • Consider implementing connection pooling"
fi

if [ "$gunicorn_processes" -lt 12 ]; then
    echo "  • Consider increasing Gunicorn worker processes"
fi

if [ "$celery_workers" -lt 6 ]; then
    echo "  • Consider increasing Celery worker processes"
fi

echo ""

# Load test simulation command
echo -e "${YELLOW}🧪 Load Testing Commands:${NC}"
echo "  • Apache Bench: ab -n 10000 -c 100 http://your-domain.com/api/accounts/loan-products/"
echo "  • Wrk: wrk -t12 -c400 -d30s http://your-domain.com/api/accounts/loan-applications/"
echo "  • Locust: locust -f load_test.py --host=http://your-domain.com"

echo ""
echo -e "${GREEN}✅ Performance monitoring complete${NC}"
echo "Metrics logged to: $METRICS_FILE"

# Generate performance report
echo ""
echo -e "${BLUE}📈 Generating Performance Report...${NC}"

report_file="$LOG_DIR/performance_report_$(date +%Y%m%d_%H%M%S).txt"
cat > $report_file << EOF
AllaweePlus Performance Report
Generated: $(date)

SYSTEM CAPACITY ASSESSMENT:
Current Scale: $user_count users, $loan_count loans, $payment_count payments
Target Scale: 500,000+ users, unlimited loans/payments

RESOURCE UTILIZATION:
CPU: $cpu_usage
Memory: $memory_usage (Available: $memory_available)
Disk: $disk_usage
Database Connections: $pg_connections/$200
Redis Memory: $redis_memory

APPLICATION PERFORMANCE:
Gunicorn Processes: $gunicorn_processes
Celery Workers: $celery_workers
Nginx Status: $nginx_status
Active Connections: $nginx_connections

RECENT ACTIVITY (24h):
New Users: $new_users
New Loans: $new_loans
New Payments: $new_payments

SCALABILITY STATUS:
$(if [ "$user_count" != "N/A" ] && [ "$user_count" -lt 100000 ]; then
    echo "✅ READY - System can handle significant growth"
else
    echo "⚠️  MONITOR - Approaching scale limits"
fi)

RECOMMENDATIONS:
- Monitor database query performance
- Implement automated scaling if needed
- Consider read replicas for database
- Set up comprehensive monitoring alerts
- Plan for CDN implementation for static files
EOF

echo "Report saved to: $report_file"
echo ""
echo -e "${GREEN}🎉 Monitoring complete!${NC}"
