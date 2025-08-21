import os
from .settings import *

# PostgreSQL Database Configuration for Development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'allaweeplus_dev',
        'USER': 'allaweeplus_user',
        'PASSWORD': 'dev_password_123',
        'HOST': 'localhost',
        'PORT': '5432',
        'OPTIONS': {
            'connect_timeout': 10,
        },
        'CONN_MAX_AGE': 300,  # Connection pooling
    }
}

# Enable debug logging for development
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
    },
    'loggers': {
        'django.db.backends': {
            'level': 'DEBUG',
            'handlers': ['console'],
        },
    },
}

print("✅ Using PostgreSQL configuration for development")
