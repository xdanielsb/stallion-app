import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

// Export types for use in components
export interface ImageRequest {
  image_data: string;
  image_format: string;
}

export interface ImageInfo {
  width: number;
  height: number;
  format: string;
  size_bytes: number;
  aspect_ratio: number;
}

export interface ColorInfo {
  dominant_color: string;
  is_grayscale: boolean;
  has_transparency: boolean;
}

export interface ImageResponse {
  success: boolean;
  message: string;
  image_info?: ImageInfo;
  color_info?: ColorInfo;
}

@Injectable({
  providedIn: 'root'
})
export class GrpcClientService {
  private gatewayUrl = 'http://localhost:3000'; // HTTP to gRPC gateway

  constructor(private http: HttpClient) {}

  sendImageToBackend(imageData: string, width: number, height: number): Observable<ImageResponse> {
    // Convert dataURL to base64 without the prefix
    const base64Data = imageData.split(',')[1];
    
    const requestBody = {
      image_data: base64Data,
      image_format: 'jpeg'
    };

    console.log('Sending image to backend via gateway:', {
      size: base64Data.length,
      format: 'jpeg'
    });

    // Send image to our HTTP-to-gRPC gateway
    return this.http.post<ImageResponse>(`${this.gatewayUrl}/api/process-image`, requestBody);
  }
}