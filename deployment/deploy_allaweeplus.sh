#!/bin/bash
# Deployment script for allaweeplus.com
# Production deployment for Django + React Native + Admin Dashboard

echo "🚀 Deploying AllaweePlus to allaweeplus.com"
echo "=================================="

# Set production environment
export DJANGO_SETTINGS_MODULE=core.settings_production

# Backend deployment
echo "📦 Deploying Django Backend..."
cd /path/to/production/allawee_backend

# Install dependencies
pip install -r requirements_production.txt

# Database migrations
python manage.py migrate --settings=core.settings_production

# Collect static files
python manage.py collectstatic --noinput --settings=core.settings_production

# Restart services
sudo systemctl restart allaweeplus-django
sudo systemctl restart nginx

# Admin Dashboard deployment
echo "🌐 Deploying Admin Dashboard..."
cd /path/to/production/admin-dashboard
npm install
npm run build

# Copy build to nginx
sudo cp -r build/* /var/www/allaweeplus.com/

# Mobile App preparation
echo "📱 Preparing Mobile Apps..."
cd /path/to/production/AllaweePlus

# Build production APK for Android
echo "🤖 Building Android APK..."
cd android
./gradlew clean
./gradlew assembleRelease

# Build iOS for App Store
echo "📱 Building iOS for App Store..."
cd ../ios
xcodebuild clean -workspace AllaweePlus.xcworkspace -scheme AllaweePlus
xcodebuild archive -workspace AllaweePlus.xcworkspace -scheme AllaweePlus -archivePath build/AllaweePlus.xcarchive

echo "✅ Deployment completed!"
echo "🌐 API: https://api.allaweeplus.com"
echo "🖥️  Dashboard: https://allaweeplus.com"
echo "📱 Mobile apps ready for store submission"
