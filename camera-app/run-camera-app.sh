#!/bin/bash

echo "Camera App Docker Options"
echo "========================"
echo ""
echo "1. Run with HTTPS (required for camera access)"
echo "2. Run with HTTP (development mode - may not work in all browsers)"
echo "3. Stop all camera-app containers"
echo ""

read -p "Select option (1-3): " choice

case $choice in
  1)
    echo "Starting with HTTPS on port 443..."
    docker run -d -p 80:80 -p 443:443 --name camera-app-https camera-app
    echo "App running at: https://localhost"
    echo "Note: You'll need to accept the self-signed certificate warning"
    ;;
  2)
    echo "Starting with HTTP only on port 8080..."
    docker run -d -p 8080:80 --name camera-app-http nginx:alpine
    docker cp $(docker create camera-app):/usr/share/nginx/html /tmp/camera-app-html/
    docker cp /tmp/camera-app-html/. camera-app-http:/usr/share/nginx/html/
    echo "App running at: http://localhost:8080"
    echo "Note: Camera may not work due to browser security restrictions"
    ;;
  3)
    echo "Stopping camera-app containers..."
    docker stop camera-app-https camera-app-http 2>/dev/null
    docker rm camera-app-https camera-app-http 2>/dev/null
    echo "Containers stopped and removed"
    ;;
  *)
    echo "Invalid option"
    ;;
esac