# Camera System - Docker Setup

This system consists of:
- **Frontend**: Angular camera app with HTTPS support
- **Backend**: Rust gRPC image processing server

## Architecture

```
[Browser] --(HTTPS)--> [Angular App] --(HTTP for now)--> [Rust gRPC Server]
```

## Quick Start

### Option 1: Run Production (Frontend + Backend)

```bash
./run-camera-system.sh
# Select option 1
```

### Option 2: Run Development Mode

```bash
./run-camera-system.sh
# Select option 2
```

### Option 3: Run Backend Only

```bash
./run-camera-system.sh
# Select option 3
```

### Option 4: Stop All Services

```bash
./run-camera-system.sh
# Select option 4
```

## Manual Docker Commands

### Run Production Environment

```bash
docker-compose -f docker-compose.yml up --build
```

### Run Development Environment

```bash
docker-compose -f docker-compose.yml --profile dev up --build
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

## gRPC Communication

The backend provides an `ImageProcessor` service with a `ProcessImage` RPC:

```protobuf
service ImageProcessor {
  rpc ProcessImage (ImageRequest) returns (ImageResponse);
}
```

The frontend captures images and sends them to the backend for processing. Currently, the frontend simulates the gRPC connection, but the infrastructure is in place to implement proper gRPC-web with a proxy (like Envoy).

## For Production Use

To properly implement gRPC-web in production:

1. Set up Envoy or another gRPC-web proxy
2. Generate TypeScript client code from `.proto` files
3. Replace the simulated service with real gRPC-web client code

## Camera Access

- Modern browsers require HTTPS for camera access
- The frontend uses self-signed SSL certificates
- Accept the certificate warning when prompted
- Grant camera permissions when requested