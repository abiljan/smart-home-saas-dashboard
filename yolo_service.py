#!/usr/bin/env python3
"""
YOLOv8 Object Detection Service for Smart Home Dashboard
Fast, local, real-time object detection service using Ultralytics YOLOv8
"""

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image
import logging
import time
import json
from typing import Dict, List, Tuple, Any

# Import YOLOv8 from ultralytics
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    print("⚠️  Ultralytics not installed. Run: pip install ultralytics")
    YOLO_AVAILABLE = False

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests from React frontend

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model variable
model = None

def load_yolo_model():
    """Load YOLOv8 model with error handling"""
    global model
    try:
        if not YOLO_AVAILABLE:
            raise ImportError("YOLOv8 not available")
            
        logger.info("Loading YOLOv8 nano model...")
        model = YOLO('yolov8n.pt')  # Nano model for speed
        logger.info("✅ YOLOv8 model loaded successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to load YOLOv8 model: {e}")
        return False

def decode_base64_image(base64_string: str) -> np.ndarray:
    """Convert base64 string to OpenCV image"""
    try:
        # Remove data URL prefix if present
        if base64_string.startswith('data:image'):
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Convert to PIL Image then to OpenCV format
        pil_image = Image.open(BytesIO(image_data))
        opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        
        return opencv_image
    except Exception as e:
        logger.error(f"Error decoding image: {e}")
        raise

def map_yolo_to_smart_home_devices(detections: List[Dict]) -> List[Dict]:
    """Map YOLO COCO class names to smart home device categories"""
    
    # Mapping COCO classes to smart home device types
    DEVICE_MAPPING = {
        'tv': {'type': 'television', 'category': 'tv'},
        'laptop': {'type': 'computer', 'category': 'smart_appliance'},
        'mouse': {'type': 'computer_accessory', 'category': 'smart_appliance'},
        'remote': {'type': 'remote_control', 'category': 'tv'},
        'keyboard': {'type': 'computer_accessory', 'category': 'smart_appliance'},
        'cell phone': {'type': 'smartphone', 'category': 'smart_appliance'},
        'microwave': {'type': 'microwave', 'category': 'smart_appliance'},
        'oven': {'type': 'oven', 'category': 'smart_appliance'},
        'toaster': {'type': 'toaster', 'category': 'smart_appliance'},
        'sink': {'type': 'smart_faucet', 'category': 'smart_appliance'},
        'refrigerator': {'type': 'smart_refrigerator', 'category': 'smart_appliance'},
        'clock': {'type': 'smart_display', 'category': 'voice_assistant'},
    }
    
    # Brand suggestions based on device type
    BRAND_SUGGESTIONS = {
        'television': ['Samsung', 'LG', 'Sony', 'TCL', 'Roku'],
        'smart_refrigerator': ['Samsung', 'LG', 'Whirlpool', 'GE'],
        'microwave': ['Samsung', 'Panasonic', 'Sharp', 'LG'],
        'smart_display': ['Amazon', 'Google', 'Facebook'],
        'computer': ['Apple', 'Dell', 'HP', 'Lenovo'],
        'smartphone': ['Apple', 'Samsung', 'Google', 'OnePlus']
    }
    
    smart_devices = []
    
    for detection in detections:
        class_name = detection['name'].lower()
        
        if class_name in DEVICE_MAPPING:
            device_info = DEVICE_MAPPING[class_name]
            device_type = device_info['type']
            
            # Suggest a brand
            possible_brands = BRAND_SUGGESTIONS.get(device_type, ['Unknown'])
            suggested_brand = possible_brands[0]  # Pick first as default
            
            # Generate room-appropriate name
            room_context = "Living Room"  # Could be enhanced with room detection
            suggested_name = f"{room_context} {device_type.replace('_', ' ').title()}"
            
            smart_device = {
                'type': device_type,
                'brand': suggested_brand,
                'model': f"{suggested_brand} Model",  # Generic model name
                'confidence': detection['confidence'],
                'boundingBox': detection['bbox'],
                'suggestedName': suggested_name,
                'manualFound': True,  # Assume manuals are available for major brands
                'detectionEngine': 'yolo',
                'cocoClass': detection['name']  # Keep original COCO class for reference
            }
            
            smart_devices.append(smart_device)
    
    return smart_devices

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'yolo-detection',
        'model_loaded': model is not None,
        'yolo_available': YOLO_AVAILABLE
    })

@app.route('/detect', methods=['POST'])
def detect_objects():
    """Main object detection endpoint"""
    start_time = time.time()
    
    try:
        # Validate request
        if not request.json or 'image' not in request.json:
            return jsonify({'error': 'Image data required'}), 400
        
        if not model:
            return jsonify({'error': 'YOLOv8 model not loaded'}), 500
        
        image_data = request.json['image']
        scan_type = request.json.get('scanType', 'devices')
        context = request.json.get('context', {})
        
        # Decode and process image
        opencv_image = decode_base64_image(image_data)
        
        # Run YOLOv8 detection
        results = model(opencv_image, verbose=False)
        
        # Process results
        detections = []
        for result in results:
            for box in result.boxes:
                if box.conf[0] > 0.3:  # Confidence threshold
                    # Get bounding box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    
                    detection = {
                        'name': model.names[int(box.cls[0])],
                        'confidence': float(box.conf[0]),
                        'bbox': {
                            'x': int(x1),
                            'y': int(y1), 
                            'width': int(x2 - x1),
                            'height': int(y2 - y1)
                        }
                    }
                    detections.append(detection)
        
        # Map to smart home devices
        smart_devices = map_yolo_to_smart_home_devices(detections)
        
        # Calculate processing time
        processing_time = int((time.time() - start_time) * 1000)  # ms
        
        # Build response in format compatible with existing frontend
        response = {
            'detectedDevices': smart_devices,
            'extractedText': [d['name'] for d in detections],  # COCO class names
            'roomContext': context.get('room', 'unknown'),
            'processingTime': processing_time,
            'engine': 'yolo',
            'rawDetections': len(detections),
            'smartDevices': len(smart_devices)
        }
        
        logger.info(f"Detected {len(detections)} objects, {len(smart_devices)} smart devices in {processing_time}ms")
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Detection error: {e}")
        return jsonify({
            'error': str(e),
            'detectedDevices': [],
            'extractedText': [],
            'processingTime': int((time.time() - start_time) * 1000),
            'engine': 'yolo'
        }), 500

@app.route('/models', methods=['GET'])
def list_models():
    """List available YOLO models"""
    models = [
        {'name': 'yolov8n.pt', 'size': 'nano', 'speed': 'fastest', 'accuracy': 'good'},
        {'name': 'yolov8s.pt', 'size': 'small', 'speed': 'fast', 'accuracy': 'better'},
        {'name': 'yolov8m.pt', 'size': 'medium', 'speed': 'medium', 'accuracy': 'high'},
        {'name': 'yolov8l.pt', 'size': 'large', 'speed': 'slow', 'accuracy': 'higher'},
        {'name': 'yolov8x.pt', 'size': 'extra-large', 'speed': 'slowest', 'accuracy': 'highest'}
    ]
    return jsonify({'available_models': models, 'current_model': 'yolov8n.pt'})

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("🚀 Starting YOLOv8 Detection Service...")
    print("📦 Loading model...")
    
    if load_yolo_model():
        print("✅ YOLOv8 service ready!")
        print("🌐 Server running on http://localhost:5001")
        print("📚 Endpoints:")
        print("   POST /detect - Object detection")
        print("   GET /health - Health check")  
        print("   GET /models - Available models")
        
        app.run(host='0.0.0.0', port=5001, debug=False)
    else:
        print("❌ Failed to start YOLOv8 service")
        print("💡 Make sure to install: pip install ultralytics")
        exit(1)