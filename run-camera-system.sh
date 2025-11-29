#!/bin/bash

echo "Camera System Docker Launcher"
echo "============================"
echo ""
echo "System Architecture:"
echo "Frontend (Angular) --HTTPS--> Gateway (Node.js) --gRPC--> Backend (Rust)"
echo ""
echo "Select mode:"
echo "1. Run Production (Frontend + Gateway + Backend)"
echo "2. Run Development (Frontend Dev + Gateway + Backend)"
echo "3. Run Backend Only"
echo "4. Run Gateway Only"
echo "5. Stop All Services"
echo ""

read -p "Select option (1-5): " choice

case $choice in
  1)
    echo "Starting Production Environment..."
    docker compose up
    ;;
  2)
    echo "Starting Development Environment..."
    docker compose --profile dev up
    ;;
  3)
    echo "Starting Backend Only..."
    docker compose up backend
    ;;
  4)
    echo "Starting Gateway Only..."
    docker compose up gateway
    ;;
  5)
    echo "Stopping All Services..."
    docker compose down
    echo "Services stopped successfully."
    ;;
  *)
    echo "Invalid option"
    ;;
esac