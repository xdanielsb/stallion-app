import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { GrpcClientService } from './grpc-client.service';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  private stream: MediaStream | null = null;

  constructor(private grpcClient: GrpcClientService) { }

  getCameraStream(): Observable<MediaStream> {
    return new Observable(observer => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: false
        })
        .then(stream => {
          this.stream = stream;
          observer.next(stream);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
      } else {
        observer.error('Camera API not supported in this browser');
      }
    });
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  captureImage(): string {
    if (!this.stream) {
      throw new Error('Camera stream not available');
    }

    const video = document.createElement('video');
    video.srcObject = this.stream;
    video.play();

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get canvas context');
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  }

  sendImageToBackend(imageData: string, width: number, height: number) {
    return this.grpcClient.sendImageToBackend(imageData, width, height);
  }
}