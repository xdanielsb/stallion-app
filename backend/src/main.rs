use std::collections::HashMap;
use tonic::{transport::Server, Request, Response, Status};
use image::DynamicImage;

// Include generated protobuf code
mod image_service;

use image_service::{
    image_processor_server::{ImageProcessor, ImageProcessorServer},
    ImageRequest, ImageResponse, ImageInfo, ColorInfo, BoundingBoxInfo
};

use image::{GenericImageView, imageops::FilterType};
use ndarray::{Array4, Axis, s};
use ort::{
	inputs,
	session::{Session, SessionOutputs},
	value::TensorRef
};


#[derive(Debug, Default)]
pub struct ImageServiceImpl;


#[derive(Debug, Clone, Copy)]
struct BoundingBox {
	x1: f32,
	y1: f32,
	x2: f32,
	y2: f32
}

fn intersection(box1: &BoundingBox, box2: &BoundingBox) -> f32 {
	(box1.x2.min(box2.x2) - box1.x1.max(box2.x1)) * (box1.y2.min(box2.y2) - box1.y1.max(box2.y1))
}

fn union(box1: &BoundingBox, box2: &BoundingBox) -> f32 {
	((box1.x2 - box1.x1) * (box1.y2 - box1.y1)) + ((box2.x2 - box2.x1) * (box2.y2 - box2.y1)) - intersection(box1, box2)
}

const YOLOV8M_URL: &str = "https://cdn.pyke.io/0/pyke:ort-rs/example-models@0.0.0/yolov8m.onnx";

#[rustfmt::skip]
const YOLOV8_CLASS_LABELS: [&str; 80] = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat", "traffic light",
	"fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat", "dog", "horse", "sheep", "cow", "elephant",
	"bear", "zebra", "giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard",
	"sports ball", "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket", "bottle",
	"wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange", "broccoli",
	"carrot", "hot dog", "pizza", "donut", "cake", "chair", "couch", "potted plant", "bed", "dining table", "toilet",
	"tv", "laptop", "mouse", "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink", "refrigerator",
	"book", "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush"
];


fn prepare_input_and_model(
    img: &DynamicImage,
    model_path: &str,
) -> ort::Result<Vec<(BoundingBox, String, f32)>> {


	let (img_width, img_height) = (img.width(), img.height());
    let img_onnx = img.resize_exact(640, 640, FilterType::CatmullRom);

    // Allocate input tensor (1,3,640,640)
    let mut input: Array4<f32> = Array4::zeros((1, 3, 640, 640));

    // Normalize pixels into tensor
    for pixel in img_onnx.pixels() {
        let x = pixel.0 as usize;
        let y = pixel.1 as usize;
        let [r, g, b, _] = pixel.2 .0;
        input[[0, 0, y, x]] = (r as f32) / 255.0;
        input[[0, 1, y, x]] = (g as f32) / 255.0;
        input[[0, 2, y, x]] = (b as f32) / 255.0;
    }

    // Load ONNX model
    let mut model = Session::builder()?.commit_from_url(model_path)?;

	// Run YOLOv8 inference
	let outputs: SessionOutputs = model.run(inputs!["images" => TensorRef::from_array_view(&input)?])?;
	let output = outputs["output0"].try_extract_array::<f32>()?.t().into_owned();

	let mut boxes = Vec::new();
	let output = output.slice(s![.., .., 0]);
	for row in output.axis_iter(Axis(0)) {
		let row: Vec<_> = row.iter().copied().collect();
		let (class_id, prob) = row
			.iter()
			// skip bounding box coordinates
			.skip(4)
			.enumerate()
			.map(|(index, value)| (index, *value))
			.reduce(|accum, row| if row.1 > accum.1 { row } else { accum })
			.unwrap();
		if prob < 0.5 {
			continue;
		}
		let label = YOLOV8_CLASS_LABELS[class_id].to_string();
		let xc = row[0] / 640. * (img_width as f32);
		let yc = row[1] / 640. * (img_height as f32);
		let w = row[2] / 640. * (img_width as f32);
		let h = row[3] / 640. * (img_height as f32);
		boxes.push((
			BoundingBox {
				x1: xc - w / 2.,
				y1: yc - h / 2.,
				x2: xc + w / 2.,
				y2: yc + h / 2.
			},
			label,
			prob
		));
	}

	boxes.sort_by(|box1, box2| box2.2.total_cmp(&box1.2));
	let mut result = Vec::new();

	while !boxes.is_empty() {
		result.push(boxes[0].clone());
		boxes = boxes
			.iter()
			.filter(|box1| intersection(&boxes[0].0, &box1.0) / union(&boxes[0].0, &box1.0) < 0.7)
			.cloned()
			.collect();
	}


	Ok(result)

}


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
                    bounding_boxes: vec![],
                }));
            }
        };

        // process with onnx
        let bounding_boxes = prepare_input_and_model(&img, YOLOV8M_URL)
            .map_err(|e| Status::internal(format!("Model inference failed: {}", e)))?;

        
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
        
        // Convert bounding boxes to protobuf format
        let bounding_boxes_proto: Vec<BoundingBoxInfo> = bounding_boxes.into_iter().map(|(bbox, label, confidence)| {
            BoundingBoxInfo {
                x1: bbox.x1,
                y1: bbox.y1,
                x2: bbox.x2,
                y2: bbox.y2,
                label,
                confidence,
            }
        }).collect();
        
        Ok(Response::new(ImageResponse {
            success: true,
            message: "Image processed successfully".to_string(),
            image_info,
            color_info,
            bounding_boxes: bounding_boxes_proto,
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