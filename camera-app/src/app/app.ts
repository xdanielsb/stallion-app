import { Component, signal, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CameraService } from './camera.service';
import { ImageInfo, ColorInfo } from './grpc-client.service';

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
    this.cameraService.stopCamera();
    this.stream = null;
    this.isCameraActive.set(false);
    
    if (this.videoElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
  }
  
  captureImage(): void {
    if (!this.stream || !this.videoElement || !this.canvasElement) {
      return;
    }
    
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');
    
    if (!context) {
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    console.log('Image captured:', imageData.substring(0, 50) + '...');
    
    // Send image to backend via gRPC
    this.isCapturing.set(true);
    this.clearResults();
    
    this.cameraService.sendImageToBackend(
      imageData, 
      canvas.width, 
      canvas.height
    ).subscribe({
      next: (response) => {
        console.log('Image processed by backend:', response);
        this.isCapturing.set(false);
        
        // Update result signals
        this.processingStatus.set({
          success: response.success,
          message: response.message
        });
        
        this.imageInfo.set(response.image_info || null);
        this.colorInfo.set(response.color_info || null);
      },
      error: (error) => {
        console.error('Error processing image on backend:', error);
        this.isCapturing.set(false);
        this.processingStatus.set({
          success: false,
          message: 'Error processing image on backend'
        });
      }
    });
  }
  
  clearResults(): void {
    this.processingStatus.set(null);
    this.imageInfo.set(null);
    this.colorInfo.set(null);
  }

  // Helper method for template
  formatFileSize(bytes: number): string {
    return Math.round(bytes / 1024).toString();
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