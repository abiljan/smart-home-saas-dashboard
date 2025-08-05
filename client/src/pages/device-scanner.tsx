import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Camera, Scan, Zap, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const [scanMode, setScanMode] = useState<'room' | 'device'>('room');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const visionMutation = useMutation({
    mutationFn: (imageData: string) =>
      apiRequest('/api/vision/detect-devices', {
        method: 'POST',
        body: JSON.stringify({ 
          image: imageData, 
          scanType: 'devices',
          context: { room: 'auto-detect' }
        }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: (result: ScanResult) => {
      setDetections(result.detectedDevices);
      setIsProcessing(false);
      if (result.detectedDevices.length > 0) {
        toast({
          title: `Found ${result.detectedDevices.length} device${result.detectedDevices.length > 1 ? 's' : ''}`,
          description: "Tap on detected devices to add them to your home.",
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
    mutationFn: (deviceData: any) =>
      apiRequest(`/api/homes/${homeId}/devices`, {
        method: 'POST',
        body: JSON.stringify(deviceData),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: (device) => {
      toast({
        title: "Device Added",
        description: `${device.name} has been added to your home.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/homes/${homeId}/devices`] });
      // Remove added device from detections
      setDetections(prev => prev.filter(d => d.suggestedName !== device.name));
    }
  });

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCameraReady(true);
      }
    } catch (error) {
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to scan for devices.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraReady(false);
    setIsScanning(false);
  }, [stream]);

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

    // Convert to base64 image
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    setIsProcessing(true);
    visionMutation.mutate(imageData);
  }, [isProcessing, visionMutation]);

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

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

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
                  <div className="flex gap-2">
                    <Button
                      variant={scanMode === 'room' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setScanMode('room')}
                    >
                      Room Scan
                    </Button>
                    <Button
                      variant={scanMode === 'device' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setScanMode('device')}
                    >
                      Focus Device
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  {!cameraReady ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                        <Button onClick={startCamera} className="bg-blue-600 hover:bg-blue-700">
                          Start Camera
                        </Button>
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
                      <Scan className="h-4 w-4 mr-2" />
                      {isProcessing ? 'Analyzing...' : 'Scan for Devices'}
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
                <div>1. Allow camera access when prompted</div>
                <div>2. Point camera at your devices</div>
                <div>3. Click "Scan for Devices"</div>
                <div>4. Tap detected devices to add them</div>
                <div className="pt-2 text-xs">
                  <strong>Room Scan:</strong> Wide view for multiple devices<br/>
                  <strong>Focus Device:</strong> Close-up for single device
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}