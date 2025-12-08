# Stallion - Camera System

## Features

- **Real-time camera capture** from browser with automatic image processing
- **Image analysis** including dimensions, format, file size, and aspect ratio
- **Color detection** with dominant color extraction and grayscale detection
- **Performance metrics** tracking response times and processing statistics
- **HTTPS support** for secure camera access in modern browsers
- **gRPC communication** between Angular frontend and Rust backend
- **Auto-capture mode** with configurable intervals for continuous image processing

# Architecture

```
[Browser] --(HTTPS)--> [Angular App] --(HTTP for now)--> [Rust gRPC Server]
```

## Quick Start

### Option 1: Run Production (Frontend + Backend)

```bash
./run-camera-system.sh
# Select option 1
```

## Manual Docker Commands

### Run Production Environment

```bash
docker-compose -f docker-compose.yml up --build
```

## Accessing the Application

- **Production**: https://localhost (accept the self-signed certificate)
- **Development**: http://localhost:4201 (hot reload enabled)
- **Backend gRPC**: localhost:50051 (direct gRPC calls)


## System Components

### Frontend (Angular App)

- **Location**: `/camera-app/`
- **Tech Stack**: Angular 21, TypeScript, gRPC-Web (simulated)
- **Features**: 
  - Camera access via getUserMedia API
  - Image capture and processing
  - HTTPS support for camera permissions
  - Communication with backend

### Backend (Rust gRPC Server)

- **Location**: `/backend/`
- **Tech Stack**: Rust, Tonic gRPC, Image processing
- **Features**:
  - gRPC server on port 50051
  - Image analysis (dimensions, colors, format)
  - Image processing using the `image` crate
