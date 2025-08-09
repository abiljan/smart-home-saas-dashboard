import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Camera, Scan, Zap, CheckCircle, AlertCircle, Settings, QrCode } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import jsQR from "jsqr";
// @ts-ignore
import Quagga from "quagga";

interface DetectedDevice {
  type: string;
  brand: string;
  model?: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  suggestedName: string;
  manualFound: boolean;
}

interface ScanResult {
  detectedDevices: DetectedDevice[];
  extractedText: string[];
  processingTime: number;
}

export default function DeviceScannerPage() {
  const [location] = useLocation();
  const homeId = location.split('/')[2]; 
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [detections, setDetections] = useState<DetectedDevice[]>([]);
  const [scanMode, setScanMode] = useState<'room' | 'device' | 'barcode' | 'qr'>('room');
  const [detectionEngine, setDetectionEngine] = useState<'yolo' | 'openai'>('yolo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<{yolo: boolean, openai: boolean}>({yolo: false, openai: false});
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scannedCode, setScannedCode] = useState<string>('');
  const [barcodeInitialized, setBarcodeInitialized] = useState(false);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);

  const visionMutation = useMutation({
    mutationFn: async (imageData: string): Promise<ScanResult> => {
      const result = await apiRequest('POST', '/api/vision/detect-devices', { 
        image: imageData, 
        engine: detectionEngine,
        scanType: 'devices',
        context: { room: 'auto-detect' }
      });
      return result as unknown as ScanResult;
    },
    onSuccess: (result: ScanResult) => {
      setDetections(result.detectedDevices);
      setIsProcessing(false);
      if (result.detectedDevices.length > 0) {
        const engineLabel = (result as any).engine === 'yolo' ? 'YOLOv8' : 'OpenAI';
        const timing = result.processingTime ? ` in ${result.processingTime}ms` : '';
        toast({
          title: `Found ${result.detectedDevices.length} device${result.detectedDevices.length > 1 ? 's' : ''}`,
          description: `${engineLabel} detected devices${timing}. Tap to add them to your home.`,
        });
      }
    },
    onError: () => {
      setIsProcessing(false);
      toast({
        title: "Scan Failed",
        description: "Unable to process image. Please try again.",
        variant: "destructive",
      });
    }
  });

  const addDeviceMutation = useMutation({
    mutationFn: async (deviceData: any) => {
      const result = await apiRequest('POST', `/api/homes/${homeId}/devices`, deviceData);
      return result;
    },
    onSuccess: (device: any) => {
      toast({
        title: "Device Added",
        description: `${device.name} has been added to your home.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/homes/${homeId}/devices`] });
      // Remove added device from detections
      setDetections(prev => prev.filter(d => d.suggestedName !== device.name));
    }
  });

  // Check camera capabilities and permissions
  const checkCameraCapabilities = useCallback(async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API not supported in this browser');
        return false;
      }

      // Check HTTPS requirement (except localhost and development)
      const isSecure = window.location.protocol === 'https:' || 
                       window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '0.0.0.0' ||
                       window.location.hostname.includes('localhost') ||
                       window.location.port === '5000'; // Development server
      
      // Security check: verify HTTPS or development environment
      
      // Skip HTTPS check in development - let browser handle the actual permission
      // Temporarily disable this check to debug camera issues
      // if (!isSecure && window.location.hostname !== '127.0.0.1' && !window.location.hostname.includes('localhost')) {
      //   setCameraError(`Camera access requires HTTPS. Current: ${window.location.href} - Please use https:// or localhost`);
      //   return false;
      // }

      // Get available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      
      // Camera enumeration: found cameras for selection
      
      if (cameras.length === 0) {
        setCameraError('No camera found on this device');
        return false;
      }

      setAvailableCameras([...cameras]);
      
      // Auto-select best camera (rear camera if available, otherwise first camera)
      const rearCamera = cameras.find(camera => 
        camera.label.toLowerCase().includes('back') || 
        camera.label.toLowerCase().includes('rear') ||
        camera.label.toLowerCase().includes('environment')
      );
      const selectedCamera = rearCamera?.deviceId || cameras[0].deviceId;
      setSelectedCameraId(selectedCamera);
      
      // Camera selection: auto-selected best available camera
      
      return true;
    } catch (error) {
      // Camera capability check failed
      setCameraError('Unable to check camera capabilities');
      return false;
    }
  }, []);

  const startCamera = useCallback(async () => {
    // Starting camera initialization
    setCameraError('');
    
    try {
      // First check capabilities
      const canUseCamera = await checkCameraCapabilities();
      // Check if camera capabilities are available
      if (!canUseCamera) return;

      // Try to get camera stream with flexible constraints
      let constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      // Use specific camera if selected
      if (selectedCameraId) {
        constraints.video = {
          ...constraints.video,
          deviceId: { exact: selectedCameraId }
        };
      } else {
        // Mobile: prefer rear camera, Desktop: accept any camera
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        constraints.video = {
          ...constraints.video,
          facingMode: isMobile ? { ideal: 'environment' } : 'user'
        };
      }

      let mediaStream: MediaStream;
      
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        // Fallback: try with minimal constraints if rear camera fails
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCameraReady(true);
        setCameraError('');
      }
    } catch (error: any) {
      // Camera access error - handle gracefully
      
      let errorMessage = 'Camera access failed';
      let errorDescription = 'Please check your camera permissions and try again.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera Permission Denied';
        errorDescription = 'Please allow camera access in your browser settings and refresh the page.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No Camera Found';
        errorDescription = 'No camera device was found. Please connect a camera and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera In Use';
        errorDescription = 'Camera is being used by another application. Please close other camera apps and try again.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera Constraints Not Supported';
        errorDescription = 'Your camera doesn\'t support the required settings. Trying with basic settings...';
        
        // Try again with minimal constraints
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream;
            setStream(basicStream);
            setCameraReady(true);
            return;
          }
        } catch (basicError) {
          errorDescription = 'Camera access failed even with basic settings.';
        }
      }

      setCameraError(`${errorMessage}: ${errorDescription}`);
      toast({
        title: errorMessage,
        description: errorDescription,
        variant: "destructive",
      });
    }
  }, [toast, selectedCameraId, checkCameraCapabilities]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraReady(false);
    setIsScanning(false);
  }, [stream]);

  // Handle scanned codes (both QR and barcode)
  const handleCodeScanned = useCallback(async (code: string, type: 'qr' | 'barcode') => {
    try {
      setIsProcessing(true);
      
      // Try to look up device information from the scanned code
      const response = await apiRequest('POST', '/api/devices/lookup-by-code', {
        code,
        type,
        homeId
      });

      if ((response as any).device) {
        // Auto-add device if found
        const deviceData = {
          ...(response as any).device,
          discoveryMethod: type === 'qr' ? 'qr_code' : 'barcode',
          status: 'online',
          roomLocation: 'Scanned Device'
        };
        addDeviceMutation.mutate(deviceData);
      } else {
        toast({
          title: "Device Not Found",
          description: `Could not find device information for ${type.toUpperCase()} code: ${code}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Code lookup failed:', error);
      toast({
        title: "Lookup Failed",
        description: "Failed to look up device information from scanned code.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [homeId, addDeviceMutation, toast]);

  // QR Code scanning function
  const scanForQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

    if (qrCode) {
      setScannedCode(qrCode.data);
      handleCodeScanned(qrCode.data, 'qr');
      toast({
        title: "QR Code Detected",
        description: `Scanned: ${qrCode.data.substring(0, 50)}${qrCode.data.length > 50 ? '...' : ''}`,
      });
    }
  }, [handleCodeScanned, toast]);

  const captureAndAnalyze = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0);

    if (scanMode === 'qr') {
      // QR Code scanning
      scanForQRCode();
    } else if (scanMode === 'barcode') {
      // Barcode scanning is handled by Quagga continuous scanning
      toast({
        title: "Barcode Mode Active",
        description: "Hold a barcode steady in view for automatic detection.",
      });
    } else {
      // Visual recognition (room/device scanning)
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setIsProcessing(true);
      visionMutation.mutate(imageData);
    }
  }, [isProcessing, visionMutation, scanMode, scanForQRCode, toast]);

  const handleAddDevice = (detection: DetectedDevice) => {
    const deviceData = {
      name: detection.suggestedName,
      manufacturer: detection.brand,
      model: detection.model || 'Unknown Model',
      roomLocation: 'Auto-detected',
      status: 'online',
      discoveryMethod: 'visual_recognition',
      metadata: {
        confidence: detection.confidence,
        detectionType: detection.type,
        visuallyDetected: true,
        manualAvailable: detection.manualFound
      }
    };

    addDeviceMutation.mutate(deviceData);
  };

  // Initialize barcode scanner
  const initializeBarcodeScanner = useCallback(() => {
    if (!barcodeInitialized && videoRef.current) {
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: videoRef.current,
          constraints: {
            width: 1280,
            height: 720,
            facingMode: "environment"
          }
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: 2,
        decoder: {
          readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader"]
        },
        locate: true
      }, (err: any) => {
        if (err) {
          console.log('Barcode scanner initialization failed:', err);
          toast({
            title: "Barcode Scanner Error",
            description: "Failed to initialize barcode scanner. Using manual input instead.",
            variant: "destructive"
          });
          return;
        }
        console.log('Barcode scanner initialized successfully');
        setBarcodeInitialized(true);
        Quagga.start();
      });

      Quagga.onDetected((data: any) => {
        setScannedCode(data.codeResult.code);
        handleCodeScanned(data.codeResult.code, 'barcode');
        toast({
          title: "Barcode Detected",
          description: `Scanned: ${data.codeResult.code}`,
        });
        Quagga.stop();
        setBarcodeInitialized(false);
      });
    }
  }, [barcodeInitialized, toast]);

  // Start continuous scanning based on mode
  const startContinuousScanning = useCallback(() => {
    if (scanMode === 'qr') {
      const qrInterval = setInterval(scanForQRCode, 500); // Scan every 500ms
      return () => clearInterval(qrInterval);
    } else if (scanMode === 'barcode') {
      initializeBarcodeScanner();
      return () => {
        if (barcodeInitialized) {
          Quagga.stop();
          setBarcodeInitialized(false);
        }
      };
    }
  }, [scanMode, scanForQRCode, initializeBarcodeScanner, barcodeInitialized]);

  // Check service availability
  const checkServiceStatus = useCallback(async () => {
    try {
      // Check YOLOv8 service
      const yoloResponse = await fetch('http://localhost:5001/health').catch(() => null);
      const yoloAvailable = yoloResponse?.ok || false;
      
      // Check if we have OpenAI configured (we can't directly test without making a paid API call)
      // We'll assume it's available if the user selects it
      const openaiAvailable = true; // Will be validated on actual detection call
      
      setServiceStatus({
        yolo: yoloAvailable,
        openai: openaiAvailable
      });
    } catch (error) {
      console.log('Service status check failed:', error);
    }
  }, []);

  useEffect(() => {
    // Check camera capabilities and service status on mount
    let mounted = true;
    
    const initCamera = async () => {
      if (mounted && availableCameras.length === 0) {
        await checkCameraCapabilities();
      }
    };
    
    initCamera();
    checkServiceStatus();
    
    // Periodically check service status
    const statusInterval = setInterval(checkServiceStatus, 10000); // Every 10 seconds
    
    return () => {
      mounted = false;
      clearInterval(statusInterval);
      stopCamera();
    };
  }, [checkCameraCapabilities, checkServiceStatus, availableCameras.length, stopCamera]);

  // Handle continuous scanning for barcode/QR modes
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    if (cameraReady && (scanMode === 'qr' || scanMode === 'barcode')) {
      cleanup = startContinuousScanning();
    }
    
    return cleanup;
  }, [cameraReady, scanMode, startContinuousScanning]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/homes/${homeId}`}>
            <Button variant="outline" size="sm" className="text-white border-gray-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Visual Device Discovery</h1>
            <p className="text-gray-400">Point your camera to automatically identify smart home devices</p>
          </div>
        </div>

        {/* Camera Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Camera View
                  </CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={scanMode === 'room' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setScanMode('room')}
                    >
                      <Camera className="h-3 w-3 mr-1" />
                      Room Scan
                    </Button>
                    <Button
                      variant={scanMode === 'device' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setScanMode('device')}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Focus Device
                    </Button>
                    <Button
                      variant={scanMode === 'qr' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setScanMode('qr')}
                    >
                      <QrCode className="h-3 w-3 mr-1" />
                      QR Code
                    </Button>
                    <Button
                      variant={scanMode === 'barcode' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setScanMode('barcode')}
                    >
                      <Scan className="h-3 w-3 mr-1" />
                      Barcode
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Camera Selection */}
                {availableCameras.length > 1 && (
                  <div className="mb-4">
                    <Select value={selectedCameraId} onValueChange={setSelectedCameraId}>
                      <SelectTrigger className="w-full bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Select camera" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCameras.map((camera) => (
                          <SelectItem key={camera.deviceId} value={camera.deviceId}>
                            {camera.label || `Camera ${camera.deviceId.slice(0, 8)}...`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Detection Engine Selection */}
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-2">Detection Engine</div>
                  <div className="flex gap-2">
                    <Button
                      variant={detectionEngine === 'yolo' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDetectionEngine('yolo')}
                      className="flex items-center gap-2"
                      disabled={!serviceStatus.yolo}
                    >
                      {serviceStatus.yolo ? '🚀' : '⏳'} Fast (YOLOv8)
                      <Badge variant="secondary" className="text-xs">
                        {serviceStatus.yolo ? 'Ready' : 'Starting...'}
                      </Badge>
                    </Button>
                    <Button
                      variant={detectionEngine === 'openai' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDetectionEngine('openai')}
                      className="flex items-center gap-2"
                    >
                      🧠 Smart (OpenAI)
                      <Badge variant="outline" className="text-xs">Premium</Badge>
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {detectionEngine === 'yolo' ? (
                      serviceStatus.yolo ? (
                        '⚡ Real-time local processing (~25ms) with general object detection'
                      ) : (
                        '⏳ YOLOv8 service is starting up automatically...'
                      )
                    ) : (
                      '🎯 AI-powered analysis (~1500ms) with brand/model recognition'
                    )}
                  </div>
                  
                  {!serviceStatus.yolo && (
                    <div className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                      <div className="animate-spin w-3 h-3 border border-yellow-400 border-t-transparent rounded-full"></div>
                      Installing Python dependencies and starting YOLOv8 service...
                    </div>
                  )}
                </div>

                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  {cameraError ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center px-4">
                        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                        <h3 className="font-medium text-white mb-2">Camera Error</h3>
                        <p className="text-gray-300 text-sm mb-4 max-w-md">{cameraError}</p>
                        <div className="space-y-2">
                          <Button onClick={startCamera} className="bg-blue-600 hover:bg-blue-700">
                            Retry Camera Access
                          </Button>
                          <div className="text-xs text-gray-400">
                            Make sure you're using HTTPS or localhost, and camera permissions are granted.
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : !cameraReady ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                        <Button onClick={startCamera} className="bg-blue-600 hover:bg-blue-700">
                          Start Camera
                        </Button>
                        {availableCameras.length > 0 && (
                          <div className="mt-2 text-xs text-gray-400">
                            {availableCameras.length} camera{availableCameras.length > 1 ? 's' : ''} detected
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      <canvas ref={barcodeCanvasRef} className="hidden" />
                      
                      {/* Detection Overlays */}
                      {detections.map((detection, idx) => (
                        <div
                          key={idx}
                          className="absolute border-2 border-green-400 bg-green-400/20 cursor-pointer hover:bg-green-400/30 transition-colors"
                          style={{
                            left: `${(detection.boundingBox.x / 1280) * 100}%`,
                            top: `${(detection.boundingBox.y / 720) * 100}%`,
                            width: `${(detection.boundingBox.width / 1280) * 100}%`,
                            height: `${(detection.boundingBox.height / 720) * 100}%`,
                          }}
                          onClick={() => handleAddDevice(detection)}
                        >
                          <div className="absolute -top-8 left-0 bg-green-400 text-black px-2 py-1 rounded text-xs font-medium">
                            {detection.brand} {detection.type} ({Math.round(detection.confidence * 100)}%)
                          </div>
                        </div>
                      ))}

                      {/* Processing Overlay */}
                      {isProcessing && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-center">
                            <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                            <p className="text-sm">Analyzing image...</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Camera Controls */}
                {cameraReady && (
                  <div className="flex justify-center gap-4 mt-4">
                    <Button
                      onClick={captureAndAnalyze}
                      disabled={isProcessing}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {scanMode === 'qr' ? (
                        <QrCode className="h-4 w-4 mr-2" />
                      ) : scanMode === 'barcode' ? (
                        <Scan className="h-4 w-4 mr-2" />
                      ) : (
                        <Camera className="h-4 w-4 mr-2" />
                      )}
                      {isProcessing 
                        ? 'Analyzing...' 
                        : scanMode === 'qr' 
                        ? 'Scan QR Code' 
                        : scanMode === 'barcode'
                        ? 'Activate Barcode Scanner'
                        : 'Scan for Devices'
                      }
                    </Button>
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      className="border-gray-600"
                    >
                      Stop Camera
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detection Results */}
          <div className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Detected Devices</CardTitle>
              </CardHeader>
              <CardContent>
                {detections.length === 0 ? (
                  <div className="text-center py-8">
                    <Zap className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">
                      No devices detected yet. Point your camera at smart home devices and click "Scan".
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {detections.map((detection, idx) => (
                      <div key={idx} className="border border-gray-600 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">{detection.suggestedName}</h4>
                          <Badge 
                            variant={detection.confidence > 0.8 ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {Math.round(detection.confidence * 100)}%
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-400 space-y-1">
                          <div>Brand: {detection.brand}</div>
                          {detection.model && <div>Model: {detection.model}</div>}
                          <div className="flex items-center gap-2">
                            {detection.manualFound ? (
                              <CheckCircle className="h-3 w-3 text-green-400" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-yellow-400" />
                            )}
                            <span className="text-xs">
                              {detection.manualFound ? 'Manual found' : 'Manual search needed'}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleAddDevice(detection)}
                          size="sm"
                          className="w-full mt-3 bg-green-600 hover:bg-green-700"
                          disabled={addDeviceMutation.isPending}
                        >
                          Add Device
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">How to Use</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-400 space-y-2">
                {scanMode === 'qr' || scanMode === 'barcode' ? (
                  <>
                    <div>1. Allow camera access when prompted</div>
                    <div>2. Hold the {scanMode === 'qr' ? 'QR code' : 'barcode'} steady in view</div>
                    <div>3. {scanMode === 'qr' ? 'Click "Scan" or wait for auto-detection' : 'Barcode will be detected automatically'}</div>
                    <div>4. Device will be added automatically if found</div>
                    <div className="pt-2 text-xs border-t border-gray-600 mt-3 pt-3">
                      <strong>{scanMode === 'qr' ? 'QR Code' : 'Barcode'} Tips:</strong><br/>
                      • Ensure code is well-lit and clearly visible<br/>
                      • Hold device steady for better scanning<br/>
                      • Try different distances if scanning fails<br/>
                      • Clean the camera lens for better clarity
                    </div>
                    {scannedCode && (
                      <div className="pt-2 text-xs border-t border-gray-600 mt-3 pt-3">
                        <strong>Last Scanned:</strong><br/>
                        <span className="font-mono text-green-400">{scannedCode.substring(0, 40)}{scannedCode.length > 40 ? '...' : ''}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>1. Allow camera access when prompted</div>
                    <div>2. Point camera at your devices</div>
                    <div>3. Click "Scan for Devices"</div>
                    <div>4. Tap detected devices to add them</div>
                    <div className="pt-2 text-xs border-t border-gray-600 mt-3 pt-3">
                      <strong>Tips for Visual Scanning:</strong><br/>
                      • Use front-facing camera if available<br/>
                      • Ensure good lighting for better detection<br/>
                      • Move closer to devices for clearer capture<br/>
                      • Try different angles if detection fails
                    </div>
                  </>
                )}
                <div className="pt-2 text-xs">
                  <strong>Scan Modes:</strong><br/>
                  <strong>Room Scan:</strong> Wide view for multiple devices<br/>
                  <strong>Focus Device:</strong> Close-up for single device<br/>
                  <strong>QR Code:</strong> Scan device QR codes for instant setup<br/>
                  <strong>Barcode:</strong> Scan UPC/EAN barcodes for product info
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}