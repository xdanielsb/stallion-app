# Image Inference Server

A Rust-based image processing server that receives images from a client and returns analysis information about them.

## Features

- **Image Processing**: Extracts metadata and analyzes image properties
- **Color Analysis**: Identifies dominant colors and creates color palettes
- **Brightness Calculation**: Computes image brightness
- **Grayscale Detection**: Detects if image is grayscale
- **JSON Protocol**: Uses TCP with JSON for communication
- **Async Processing**: Handles multiple clients concurrently with Tokio

## How to Run

1. Install Rust (if not already installed)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. Build and run the server:
   ```bash
   cd backend
   cargo build
   cargo run
   ```

3. The server will start listening on `127.0.0.1:50051`
