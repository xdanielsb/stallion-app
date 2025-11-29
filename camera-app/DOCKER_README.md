# Camera App - Docker Setup

This Angular camera app has been containerized with Docker for easy deployment and development.

## Camera Access Requirements

Modern browsers require secure HTTPS connections to access the camera for security reasons. This Docker setup includes SSL certificates to enable camera access.

## Build and Run Production (with HTTPS)

### Using Docker Compose (Recommended)

```bash
# Build and run with HTTPS
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

The app will be available at:
- **HTTPS**: https://localhost (recommended for camera access)
- **HTTP**: http://localhost (redirects to HTTPS)

Note: You'll need to accept the self-signed certificate warning in your browser.

### Using Docker directly

```bash
# Build the image
docker build -t camera-app .

# Run with HTTPS
docker run -p 80:80 -p 443:443 camera-app
```

## Camera Troubleshooting

### Browser doesn't allow camera access?
1. Use **https://localhost** instead of http://
2. Accept the self-signed certificate warning
3. Allow camera permissions when prompted

### Self-signed certificate warning
- The app uses a self-signed certificate for development
- Click "Advanced" → "Proceed to localhost" to continue
- This is normal for local development with HTTPS

## Development Mode

For development with hot reloading:

```bash
# Run the development container
docker-compose --profile dev up camera-app-dev
```

## Quick Start Script

Use the provided script for easy deployment:

```bash
./run-camera-app.sh
```

## Docker Files

- `Dockerfile` - Multi-stage build with SSL for production
- `Dockerfile.dev` - Development image with hot reload
- `docker-compose.yml` - Contains both production and dev services
- `nginx.conf` - Nginx configuration with SSL and Angular routing
- `run-camera-app.sh` - Interactive script for easy deployment

## Notes

- The production image uses nginx with HTTPS to serve the Angular app
- HTTPS is required for camera access in modern browsers
- Self-signed certificates are automatically generated during build
- The development image runs the Angular CLI dev server with live reload