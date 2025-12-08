import { Component, signal, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CameraService } from './camera.service';
import { ImageInfo, ColorInfo, BoundingBoxInfo } from './grpc-client.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('Camera App');
  
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  
  stream: MediaStream | null = null;
  isCameraActive = signal(false);
  isCapturing = signal(false);
  errorMessage = signal('');
  
  // Response display signals
  processingStatus = signal<{ success: boolean; message: string } | null>(null);
  imageInfo = signal<ImageInfo | null>(null);
  colorInfo = signal<ColorInfo | null>(null);
  boundingBoxes = signal<BoundingBoxInfo[]>([]);
  
  // Auto-capture properties
  isAutoCapturing = signal(true);
  captureInterval: any = null;
  lastCaptureTime = 0;
  
  // Statistics tracking
  processedCount = signal(0);
  totalResponseTime = signal(0);
  lastResponseTime = signal(0);
  averageResponseTime = signal(0);
  
  constructor(private cameraService: CameraService) {}
  
  ngOnInit(): void {
    // Use setTimeout to ensure the DOM is fully rendered
    setTimeout(() => {
      this.initializeCamera();
    }, 100);
  }
  
  ngOnDestroy(): void {
    this.stopCamera();
  }
  
  initializeCamera(): void {
    this.isCapturing.set(true);
    this.errorMessage.set('');
    this.clearResults();
    this.resetStatistics(); // Reset stats when starting camera
    
    this.cameraService.getCameraStream().subscribe({
      next: (stream) => {
        console.log('Camera stream received:', stream);
        this.stream = stream;
        this.isCameraActive.set(true);
        this.isCapturing.set(false);
        
        // Set a timeout to ensure DOM is ready
        setTimeout(() => {
          if (this.videoElement) {
            console.log('Setting video srcObject');
            this.videoElement.nativeElement.srcObject = stream;
            this.videoElement.nativeElement.play().catch(e => {
              console.error('Video play error:', e);
            });
            
            // Start auto-capture after video is playing
            setTimeout(() => {
              this.startAutoCapture();
            }, 1000);
          } else {
            console.error('Video element not available');
          }
        }, 50);
      },
      error: (error) => {
        console.error('Camera access error:', error);
        this.errorMessage.set(this.getErrorMessage(error));
        this.isCapturing.set(false);
      }
    });
  }
  
  stopCamera(): void {
    this.stopAutoCapture();
    this.cameraService.stopCamera();
    this.stream = null;
    this.isCameraActive.set(false);
    
    if (this.videoElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
  }
  
  startAutoCapture(): void {
    if (!this.isAutoCapturing()) {
      return;
    }
    
    console.log('Starting auto-capture...');
    this.isAutoCapturing.set(true);
    
    // Capture first image immediately
    this.autoCapture();
    
    // Then capture every 2 seconds
    this.captureInterval = setInterval(() => {
      this.autoCapture();
    }, 2000);
  }
  
  stopAutoCapture(): void {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    this.isAutoCapturing.set(false);
  }
  
  resetStatistics(): void {
    this.processedCount.set(0);
    this.totalResponseTime.set(0);
    this.lastResponseTime.set(0);
    this.averageResponseTime.set(0);
  }
  
  autoCapture(): void {
    if (!this.stream || !this.videoElement || !this.canvasElement) {
      return;
    }
    
    const now = Date.now();
    // Prevent too frequent captures (minimum 500ms between captures)
    if (now - this.lastCaptureTime < 500) {
      return;
    }
    this.lastCaptureTime = now;
    
    const startTime = Date.now();
    
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');
    
    if (!context) {
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8); // Slightly lower quality for faster transmission
    
    // Send image to backend via gRPC
    this.cameraService.sendImageToBackend(
      imageData, 
      canvas.width, 
      canvas.height
    ).subscribe({
      next: (response) => {
        // Calculate response time
        const responseTime = Date.now() - startTime;
        
        // Update statistics
        this.processedCount.set(this.processedCount() + 1);
        this.lastResponseTime.set(responseTime);
        this.totalResponseTime.set(this.totalResponseTime() + responseTime);
        this.averageResponseTime.set(Math.round(this.totalResponseTime() / this.processedCount()));
        
        // Update result signals without showing loading state
        this.processingStatus.set({
          success: response.success,
          message: response.message
        });
        
        this.imageInfo.set(response.image_info || null);
        this.colorInfo.set(response.color_info || null);
        this.boundingBoxes.set(response.bounding_boxes || []);
      },
      error: (error) => {
        // Still update statistics for error
        const responseTime = Date.now() - startTime;
        this.processedCount.set(this.processedCount() + 1);
        this.lastResponseTime.set(responseTime);
        this.totalResponseTime.set(this.totalResponseTime() + responseTime);
        this.averageResponseTime.set(Math.round(this.totalResponseTime() / this.processedCount()));
        
        console.error('Error processing image on backend:', error);
        this.processingStatus.set({
          success: false,
          message: 'Backend processing error'
        });
      }
    });
  }
  
  clearResults(): void {
    this.processingStatus.set(null);
    this.imageInfo.set(null);
    this.colorInfo.set(null);
    this.boundingBoxes.set([]);
  }

  // Helper method for template
  formatFileSize(bytes: number): string {
    return Math.round(bytes / 1024).toString();
  }
  
  // Toggle auto-capture
  toggleAutoCapture(): void {
    if (this.isAutoCapturing()) {
      this.stopAutoCapture();
    } else {
      this.startAutoCapture();
    }
  }
  
  getErrorMessage(error: any): string {
    if (error.name === 'NotAllowedError') {
      return 'Camera access was denied. Please allow camera access to use this feature.';
    } else if (error.name === 'NotFoundError') {
      return 'No camera device found. Please connect a camera and try again.';
    } else if (error.name === 'NotReadableError') {
      return 'Camera is already in use by another application.';
    } else {
      return 'Failed to access camera: ' + (error.message || 'Unknown error');
    }
  }
}