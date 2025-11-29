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

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## gRPC Integration

The application is designed to send captured images to a backend service via gRPC for inference. Currently, when an image is captured, it is logged to the console as a base64 data URL. In the next phase of development, this will be replaced with actual gRPC calls to the backend service.

## Future Enhancements

- Implement gRPC client for backend communication
- Add image preview before sending to backend
- Display inference results from the backend
- Add camera controls (zoom, flash, focus)
- Support for multiple cameras
- Image filters and effects

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
