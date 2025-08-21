#!/usr/bin/env python3
"""
AllaweePlus Real-time Performance Monitor
Continuously monitors system performance and alerts on issues
"""

import time
import os
import psutil
import sqlite3
from datetime import datetime, timedelta
import json

class PerformanceMonitor:
    def __init__(self):
        self.db_path = "/Users/mac/AllaweePlus/allawee_backend/db.sqlite3"
        self.log_file = "/Users/mac/AllaweePlus/performance_monitor.log"
        self.alerts = []
        
    def clear_screen(self):
        os.system('clear' if os.name == 'posix' else 'cls')
        
    def log_metric(self, metric, value, status="INFO"):
        timestamp = datetime.now().isoformat()
        log_entry = f"{timestamp} [{status}] {metric}: {value}\n"
        with open(self.log_file, 'a') as f:
            f.write(log_entry)
    
    def check_system_resources(self):
        """Monitor system resources"""
        # CPU Usage
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # Memory Usage
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        memory_available = memory.available / (1024**3)  # GB
        
        # Disk Usage
        disk = psutil.disk_usage('/Users/mac/AllaweePlus')
        disk_percent = (disk.used / disk.total) * 100
        disk_free = disk.free / (1024**3)  # GB
        
        # Process count
        process_count = len(psutil.pids())
        
        return {
            'cpu_percent': cpu_percent,
            'memory_percent': memory_percent,
            'memory_available_gb': memory_available,
            'disk_percent': disk_percent,
            'disk_free_gb': disk_free,
            'process_count': process_count
        }
    
    def check_database_performance(self):
        """Monitor database performance"""
        if not os.path.exists(self.db_path):
            return {'error': 'Database not found'}
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Record counts
            tables = ['accounts_userprofile', 'accounts_loanapplication', 'accounts_loan', 'accounts_payment']
            record_counts = {}
            total_records = 0
            
            for table in tables:
                try:
                    start_time = time.time()
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cursor.fetchone()[0]
                    query_time = (time.time() - start_time) * 1000
                    
                    record_counts[table] = {
                        'count': count,
                        'query_time_ms': round(query_time, 2)
                    }
                    total_records += count
                except Exception as e:
                    record_counts[table] = {'error': str(e)}
            
            # Database file size
            db_size_mb = os.path.getsize(self.db_path) / (1024**2)
            
            conn.close()
            
            return {
                'total_records': total_records,
                'record_counts': record_counts,
                'db_size_mb': round(db_size_mb, 2),
                'capacity_percent': round((total_records / 500000) * 100, 2)
            }
            
        except Exception as e:
            return {'error': str(e)}
    
    def check_for_alerts(self, system_metrics, db_metrics):
        """Check for performance alerts"""
        current_alerts = []
        
        # System alerts
        if system_metrics['cpu_percent'] > 80:
            current_alerts.append(f"🔥 HIGH CPU: {system_metrics['cpu_percent']:.1f}%")
        
        if system_metrics['memory_percent'] > 85:
            current_alerts.append(f"🔥 HIGH MEMORY: {system_metrics['memory_percent']:.1f}%")
        
        if system_metrics['disk_percent'] > 90:
            current_alerts.append(f"🔥 LOW DISK SPACE: {system_metrics['disk_percent']:.1f}%")
        
        # Database alerts
        if 'total_records' in db_metrics:
            if db_metrics['capacity_percent'] > 80:
                current_alerts.append(f"📊 HIGH DB CAPACITY: {db_metrics['capacity_percent']:.1f}%")
        
        # Log new alerts
        for alert in current_alerts:
            if alert not in self.alerts:
                self.log_metric("ALERT", alert, "WARNING")
        
        self.alerts = current_alerts
        return current_alerts
    
    def display_dashboard(self, system_metrics, db_metrics, alerts):
        """Display real-time dashboard"""
        self.clear_screen()
        
        print("🎯 AllaweePlus Real-time Performance Monitor")
        print("=" * 70)
        print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # System Resources
        print("💻 SYSTEM RESOURCES:")
        print(f"  CPU Usage:      {system_metrics['cpu_percent']:6.1f}%")
        print(f"  Memory Usage:   {system_metrics['memory_percent']:6.1f}% (Available: {system_metrics['memory_available_gb']:.1f} GB)")
        print(f"  Disk Usage:     {system_metrics['disk_percent']:6.1f}% (Free: {system_metrics['disk_free_gb']:.1f} GB)")
        print(f"  Process Count:  {system_metrics['process_count']:6d}")
        print()
        
        # Database Performance
        print("📊 DATABASE PERFORMANCE:")
        if 'error' in db_metrics:
            print(f"  ❌ Error: {db_metrics['error']}")
        else:
            print(f"  Total Records:  {db_metrics['total_records']:6,}")
            print(f"  Database Size:  {db_metrics['db_size_mb']:6.1f} MB")
            print(f"  Capacity Used:  {db_metrics['capacity_percent']:6.1f}% of 500,000 target")
            print()
            
            print("  📈 Table Statistics:")
            for table, data in db_metrics['record_counts'].items():
                table_name = table.replace('accounts_', '').title()
                if 'error' in data:
                    print(f"    {table_name:15} ❌ Error")
                else:
                    print(f"    {table_name:15} {data['count']:6,} records ({data['query_time_ms']:5.1f}ms)")
        print()
        
        # Performance Status
        print("⚡ PERFORMANCE STATUS:")
        if system_metrics['cpu_percent'] < 50:
            print("  CPU:            ✅ Normal")
        elif system_metrics['cpu_percent'] < 80:
            print("  CPU:            ⚠️  Elevated")
        else:
            print("  CPU:            🔥 High")
            
        if system_metrics['memory_percent'] < 70:
            print("  Memory:         ✅ Normal")
        elif system_metrics['memory_percent'] < 85:
            print("  Memory:         ⚠️  Elevated")
        else:
            print("  Memory:         🔥 High")
            
        if 'total_records' in db_metrics:
            if db_metrics['capacity_percent'] < 50:
                print("  Database:       ✅ Ready for Scale")
            elif db_metrics['capacity_percent'] < 80:
                print("  Database:       ⚠️  Monitor Growth")
            else:
                print("  Database:       🔥 Approaching Limit")
        print()
        
        # Alerts
        if alerts:
            print("🚨 ACTIVE ALERTS:")
            for alert in alerts:
                print(f"  {alert}")
        else:
            print("✅ NO ACTIVE ALERTS")
        print()
        
        # Scalability Assessment
        print("🚀 SCALABILITY ASSESSMENT:")
        if 'total_records' in db_metrics and db_metrics['total_records'] < 10000:
            print("  Status:         🟢 READY - System can handle significant growth")
        elif 'total_records' in db_metrics and db_metrics['total_records'] < 100000:
            print("  Status:         🟡 MONITOR - Moderate usage, optimize as needed")
        else:
            print("  Status:         🔴 OPTIMIZE - High usage, implement optimizations")
        
        print()
        print("📊 NEXT MILESTONES:")
        print("  • 1,000 users:     Basic optimization needed")
        print("  • 10,000 users:    Redis caching recommended")
        print("  • 50,000 users:    PostgreSQL migration required")
        print("  • 500,000 users:   Full production deployment needed")
        print()
        print("Press Ctrl+C to stop monitoring...")
    
    def run_continuous_monitoring(self, interval=5):
        """Run continuous monitoring"""
        print("🎯 Starting AllaweePlus Performance Monitor...")
        print(f"📊 Monitoring every {interval} seconds")
        print("🔍 Logging to: performance_monitor.log")
        print()
        
        try:
            while True:
                # Collect metrics
                system_metrics = self.check_system_resources()
                db_metrics = self.check_database_performance()
                alerts = self.check_for_alerts(system_metrics, db_metrics)
                
                # Log key metrics
                self.log_metric("CPU", f"{system_metrics['cpu_percent']:.1f}%")
                self.log_metric("Memory", f"{system_metrics['memory_percent']:.1f}%")
                if 'total_records' in db_metrics:
                    self.log_metric("Records", db_metrics['total_records'])
                
                # Display dashboard
                self.display_dashboard(system_metrics, db_metrics, alerts)
                
                # Wait for next cycle
                time.sleep(interval)
                
        except KeyboardInterrupt:
            print("\n\n🛑 Monitoring stopped by user")
            print("📄 Logs saved to: performance_monitor.log")
            print("✅ Monitor completed successfully")

def main():
    monitor = PerformanceMonitor()
    
    if len(os.sys.argv) > 1:
        if os.sys.argv[1] == "--single":
            # Single check mode
            system_metrics = monitor.check_system_resources()
            db_metrics = monitor.check_database_performance()
            alerts = monitor.check_for_alerts(system_metrics, db_metrics)
            monitor.display_dashboard(system_metrics, db_metrics, alerts)
        elif os.sys.argv[1] == "--help":
            print("AllaweePlus Performance Monitor")
            print("Usage:")
            print("  python monitor.py          # Continuous monitoring")
            print("  python monitor.py --single # Single check")
            print("  python monitor.py --help   # Show this help")
    else:
        # Continuous monitoring mode
        monitor.run_continuous_monitoring(interval=5)

if __name__ == "__main__":
    main()
