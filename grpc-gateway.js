const express = require('express');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const cors = require('cors');

// Load protobuf
const PROTO_PATH = './backend/proto/image_service.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const imageService = grpc.loadPackageDefinition(packageDefinition).image_service;

// Create gRPC client
const client = new imageService.ImageProcessor(
  'localhost:50051', // Use Docker service name instead of localhost
  grpc.credentials.createInsecure()
);

// Express app
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Image processing endpoint
app.post('/api/process-image', async (req, res) => {
  try {
    const { image_data, image_format } = req.body;
    
    if (!image_data) {
      return res.status(400).json({
        success: false,
        message: 'Missing image_data field'
      });
    }

    // Convert base64 to bytes
    const imageBytes = Buffer.from(image_data, 'base64');

    // Create gRPC request
    const request = {
      image_data: imageBytes,
      image_format: image_format || 'jpeg'
    };

    // Call gRPC service
    client.processImage(request, (error, response) => {
      if (error) {
        console.error('gRPC error:', error);
        return res.status(500).json({
          success: false,
          message: `gRPC error: ${error.message}`
        });
      }

      // Convert response to plain JSON
      const result = {
        success: response.success,
        message: response.message,
        image_info: response.image_info ? {
          width: response.image_info.width,
          height: response.image_info.height,
          format: response.image_info.format,
          size_bytes: response.image_info.size_bytes,
          aspect_ratio: response.image_info.aspect_ratio
        } : null,
        color_info: response.color_info ? {
          dominant_color: response.color_info.dominant_color,
          is_grayscale: response.color_info.is_grayscale,
          has_transparency: response.color_info.has_transparency
        } : null,
        bounding_boxes: response.bounding_boxes ? response.bounding_boxes.map(box => ({
          x1: box.x1,
          y1: box.y1,
          x2: box.x2,
          y2: box.y2,
          label: box.label,
          confidence: box.confidence
        })) : []
      };

      res.json(result);
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`gRPC Gateway running on port ${PORT}`);
  console.log(`Connected to gRPC server at backend:50051`);
});