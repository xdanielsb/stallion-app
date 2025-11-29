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

## API Protocol

The server uses a simple TCP protocol with JSON messages:

### Request Format
```json
{
  "image_data": [base64-encoded-image-bytes],
  "image_format": "jpeg"  // or "png", "webp", etc.
}
```

### Response Format
```json
{
  "success": true,
  "message": "Image processed successfully",
  "metadata": {
    "width": 1920,
    "height": 1080,
    "format": "jpeg",
    "size_bytes": 245760,
    "aspect_ratio": 1.7777778
  },
  "analysis": {
    "dominant_color": {
      "r": 120,
      "g": 140,
      "b": 160,
      "hex": "#788CA0",
      "percentage": 23.5
    },
    "color_palette": [
      // Top 5 colors with percentages
    ],
    "brightness": 0.65,
    "contrast": 0.5,
    "is_grayscale": false,
    "has_transparency": false
  }
}
```

## Future Enhancements

- **gRPC Integration**: Replace TCP/JSON with gRPC for better performance
- **Object Detection**: Add ML-based object detection
- **Advanced Image Analysis**: Face detection, text recognition, etc.
- **Performance Optimization**: Better sampling algorithms, parallel processing
- **REST API**: HTTP endpoint for web integration