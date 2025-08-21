"""
Celery configuration for AllaweePlus - Background task processing for high-scale operations
"""

import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings_production')

app = Celery('allaweeplus')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Celery Beat Schedule for periodic tasks
app.conf.beat_schedule = {
    'update-overdue-payments': {
        'task': 'accounts.tasks.update_overdue_payments',
        'schedule': 3600.0,  # Run every hour
    },
    'send-payment-reminders': {
        'task': 'accounts.tasks.send_payment_reminders',
        'schedule': 86400.0,  # Run daily
    },
    'cleanup-old-sessions': {
        'task': 'accounts.tasks.cleanup_old_sessions',
        'schedule': 86400.0,  # Run daily
    },
    'generate-daily-reports': {
        'task': 'accounts.tasks.generate_daily_reports',
        'schedule': 86400.0,  # Run daily
    },
}

app.conf.timezone = 'UTC'

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
