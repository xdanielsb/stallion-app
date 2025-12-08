# Camera App

This is an Angular application that provides camera functionality for image capture. The app displays a live camera feed and allows users to capture images that can be sent to a backend for inference via gRPC.

The project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.1.

## Features

- **Live Camera Feed**: Displays a real-time video feed from the user's camera
- **Image Capture**: Allows users to capture images from the video stream
- **Error Handling**: Comprehensive error handling for camera permissions and access issues
- **Responsive Design**: Modern UI that works on both desktop and mobile devices
- **gRPC Integration Ready**: Infrastructure in place to send captured images to a backend via gRPC

## Development server

To start a local development server, run:

```bash
ng serve
```

If port 4200 is already in use, you can specify a different port:

```bash
ng serve --port 4201
```

Once the server is running, open your browser and navigate to the appropriate URL (e.g., `http://localhost:4201/`). The application will automatically reload whenever you modify any of the source files.
