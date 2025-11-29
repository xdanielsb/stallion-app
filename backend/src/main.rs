use std::collections::HashMap;
use tonic::{transport::Server, Request, Response, Status};
use image::DynamicImage;

// Include generated protobuf code
mod image_service;

use image_service::{
    image_processor_server::{ImageProcessor, ImageProcessorServer},
    ImageRequest, ImageResponse, ImageInfo, ColorInfo
};

#[derive(Debug, Default)]
pub struct ImageServiceImpl;

impl ImageServiceImpl {
    // Helper function to get dominant color
    fn get_dominant_color(&self, img: &DynamicImage) -> String {
        let rgb_img = img.to_rgb8();
        let mut color_counts = HashMap::new();
        
        // Sample colors from image (every 10 pixels for efficiency)
        for (x, y, pixel) in rgb_img.enumerate_pixels() {
            if x % 10 == 0 && y % 10 == 0 {
                let (r, g, b) = (pixel[0], pixel[1], pixel[2]);
                *color_counts.entry((r, g, b)).or_insert(0) += 1;
            }
        }
        
        // Get most frequent color
        if let Some(((r, g, b), _)) = color_counts.iter().max_by_key(|(_, count)| *count) {
            format!("#{:02X}{:02X}{:02X}", r, g, b)
        } else {
            "#000000".to_string()
        }
    }
    
    // Helper function to detect if image is grayscale
    fn is_grayscale(&self, img: &DynamicImage) -> bool {
        let rgb_img = img.to_rgb8();
        let mut grayscale_count = 0;
        let mut total_checked = 0;
        
        // Sample every 20th pixel for efficiency
        for (x, y, pixel) in rgb_img.enumerate_pixels() {
            if x % 20 == 0 && y % 20 == 0 {
                let r = pixel[0];
                let g = pixel[1];
                let b = pixel[2];
                
                // Consider grayscale if R, G, B values are very similar
                if (r as i16 - g as i16).abs() < 10 && 
                   (g as i16 - b as i16).abs() < 10 && 
                   (r as i16 - b as i16).abs() < 10 {
                    grayscale_count += 1;
                }
                total_checked += 1;
            }
        }
        
        // If more than 90% of sampled pixels are grayscale, consider image grayscale
        total_checked > 0 && (grayscale_count as f32 / total_checked as f32) > 0.9
    }
}

#[tonic::async_trait]
impl ImageProcessor for ImageServiceImpl {
    async fn process_image(
        &self,
        request: Request<ImageRequest>,
    ) -> Result<Response<ImageResponse>, Status> {
        let request = request.into_inner();
        
        // Load and decode image
        let img_result = image::load_from_memory(&request.image_data);
        
        let img = match img_result {
            Ok(img) => img,
            Err(e) => {
                return Ok(Response::new(ImageResponse {
                    success: false,
                    message: format!("Failed to decode image: {}", e),
                    image_info: None,
                    color_info: None,
                }));
            }
        };
        
        // Extract image information
        let image_info = Some(ImageInfo {
            width: img.width(),
            height: img.height(),
            format: request.image_format.clone(),
            size_bytes: request.image_data.len() as u64,
            aspect_ratio: img.width() as f32 / img.height() as f32,
        });
        
        // Extract color information
        let dominant_color = self.get_dominant_color(&img);
        let is_grayscale = self.is_grayscale(&img);
        
        let color_info = Some(ColorInfo {
            dominant_color,
            is_grayscale,
            has_transparency: img.color().has_alpha(),
        });
        
        Ok(Response::new(ImageResponse {
            success: true,
            message: "Image processed successfully".to_string(),
            image_info,
            color_info,
        }))
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let addr = "0.0.0.0:50051".parse()?;
    
    let image_service = ImageServiceImpl::default();
    
    println!("Image Processing gRPC Server listening on {}", addr);
    
    // Create gRPC server
    Server::builder()
        .add_service(ImageProcessorServer::new(image_service))
        .serve(addr)
        .await?;
    
    Ok(())
}