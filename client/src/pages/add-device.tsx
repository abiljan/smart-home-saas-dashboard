import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Zap, Tv, Thermometer, Speaker, Camera, Lightbulb, Router } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Device database with common devices
const deviceCategories = {
  "TV": {
    icon: Tv,
    brands: ["Samsung", "LG", "Sony", "TCL", "Roku", "Apple TV", "Fire TV"],
    commonModels: {
      "Samsung": ["QN65Q70T", "UN55TU7000", "QN75Q80T", "Frame TV"],
      "LG": ["OLED55C1PUB", "55UP7000PUA", "OLED65G1PUA"],
      "Sony": ["XBR55X900H", "XBR65A8H", "KD55X85K"],
      "TCL": ["55R635", "65R646", "75R646"]
    }
  },
  "Thermostat": {
    icon: Thermometer,
    brands: ["Nest", "Honeywell", "Ecobee", "Emerson"],
    commonModels: {
      "Nest": ["Learning Thermostat", "Thermostat E", "Nest Hub"],
      "Honeywell": ["T6 Pro", "T9", "T10 Pro"],
      "Ecobee": ["SmartThermostat", "Ecobee4", "Ecobee3 Lite"]
    }
  },
  "Speaker": {
    icon: Speaker,
    brands: ["Amazon", "Google", "Apple", "Sonos", "Bose"],
    commonModels: {
      "Amazon": ["Echo Dot", "Echo", "Echo Show", "Echo Studio"],
      "Google": ["Nest Mini", "Nest Audio", "Nest Hub", "Nest Hub Max"],
      "Apple": ["HomePod", "HomePod Mini"],
      "Sonos": ["One", "Beam", "Arc", "Move"]
    }
  },
  "Security Camera": {
    icon: Camera,
    brands: ["Ring", "Nest", "Arlo", "Wyze", "Blink"],
    commonModels: {
      "Ring": ["Video Doorbell", "Stick Up Cam", "Spotlight Cam"],
      "Nest": ["Cam Indoor", "Cam Outdoor", "Doorbell"],
      "Arlo": ["Pro 4", "Essential", "Ultra 2"]
    }
  },
  "Smart Light": {
    icon: Lightbulb,
    brands: ["Philips Hue", "LIFX", "TP-Link Kasa", "Wyze"],
    commonModels: {
      "Philips Hue": ["White Bulb", "Color Bulb", "Light Strip", "Dimmer Switch"],
      "LIFX": ["Color Bulb", "White Bulb", "Light Strip"],
      "TP-Link Kasa": ["Smart Bulb", "Smart Switch", "Smart Dimmer"]
    }
  },
  "Router/WiFi": {
    icon: Router,
    brands: ["Eero", "Netgear", "Linksys", "ASUS", "TP-Link"],
    commonModels: {
      "Eero": ["Pro 6", "Pro 6E", "Beacon"],
      "Netgear": ["Nighthawk", "Orbi", "Nighthawk Pro"],
      "Linksys": ["Velop", "Max-Stream", "EA Series"]
    }
  }
};

const commonRooms = [
  "Living Room", "Kitchen", "Master Bedroom", "Guest Bedroom", 
  "Bathroom", "Dining Room", "Home Office", "Basement", 
  "Garage", "Hallway", "Entryway", "Patio/Deck"
];

interface DeviceFormData {
  name: string;
  category: string;
  manufacturer: string;
  model: string;
  roomLocation: string;
  customName: string;
}

export default function AddDevicePage() {
  const [location] = useLocation();
  const homeId = location.split('/')[2]; // Extract from /homes/:homeId/add-device
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<DeviceFormData>({
    name: '',
    category: '',
    manufacturer: '',
    model: '',
    roomLocation: '',
    customName: ''
  });

  const createDeviceMutation = useMutation({
    mutationFn: (deviceData: any) =>
      apiRequest(`/api/homes/${homeId}/devices`, {
        method: 'POST',
        body: JSON.stringify(deviceData),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({
        title: "Device Added Successfully",
        description: "The device has been added to your home and documentation is being retrieved.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/homes/${homeId}/devices`] });
      // Navigate back to home detail
      window.history.back();
    },
    onError: () => {
      toast({
        title: "Failed to Add Device",
        description: "Please try again or contact support if the problem persists.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    const deviceName = formData.customName || 
      `${formData.roomLocation} ${formData.category}` ||
      `${formData.manufacturer} ${formData.model}`;

    const deviceData = {
      name: deviceName,
      manufacturer: formData.manufacturer,
      model: formData.model,
      roomLocation: formData.roomLocation,
      status: 'online',
      discoveryMethod: 'manual_guided',
      metadata: {
        category: formData.category,
        addedViaWizard: true,
        customNotes: ''
      }
    };

    createDeviceMutation.mutate(deviceData);
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 1: return !!formData.category;
      case 2: return !!formData.manufacturer;
      case 3: return !!formData.roomLocation;
      case 4: return true; // Optional step
      default: return false;
    }
  };

  const canProceed = isStepComplete(currentStep);
  const selectedCategory = deviceCategories[formData.category as keyof typeof deviceCategories];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/homes/${homeId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Device</h1>
            <p className="text-gray-600">Simple 4-step device setup with automatic documentation</p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep ? 'bg-blue-600 text-white' : 
                  step <= currentStep + 1 && isStepComplete(step - 1) ? 'bg-blue-100 text-blue-600' : 
                  'bg-gray-200 text-gray-500'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Device Type</span>
            <span>Brand</span>
            <span>Location</span>
            <span>Review</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Step {currentStep}: {
                currentStep === 1 ? 'What type of device?' :
                currentStep === 2 ? 'What brand?' :
                currentStep === 3 ? 'Where is it located?' :
                'Review and customize'
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Device Category */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <Label>Select device category:</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(deviceCategories).map(([category, config]) => {
                    const IconComponent = config.icon;
                    return (
                      <button
                        key={category}
                        onClick={() => setFormData(prev => ({ ...prev, category }))}
                        className={`p-4 border-2 rounded-lg text-center transition-colors ${
                          formData.category === category
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <IconComponent className="h-8 w-8 mx-auto mb-2" />
                        <div className="font-medium">{category}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Brand Selection */}
            {currentStep === 2 && selectedCategory && (
              <div className="space-y-4">
                <Label>Select brand for {formData.category}:</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedCategory.brands.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => setFormData(prev => ({ ...prev, manufacturer: brand }))}
                      className={`p-3 border-2 rounded-lg text-center transition-colors ${
                        formData.manufacturer === brand
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{brand}</div>
                    </button>
                  ))}
                </div>
                
                {/* Model Selection (Optional) */}
                {formData.manufacturer && selectedCategory.commonModels[formData.manufacturer] && (
                  <div className="mt-6 space-y-3">
                    <Label>Common models (optional):</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedCategory.commonModels[formData.manufacturer].map((model) => (
                        <Badge
                          key={model}
                          variant={formData.model === model ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            model: prev.model === model ? '' : model 
                          }))}
                        >
                          {model}
                        </Badge>
                      ))}
                    </div>
                    <Input
                      placeholder="Or enter model manually..."
                      value={formData.model}
                      onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Room Location */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <Label>Where is this device located?</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {commonRooms.map((room) => (
                    <button
                      key={room}
                      onClick={() => setFormData(prev => ({ ...prev, roomLocation: room }))}
                      className={`p-3 border-2 rounded-lg text-center transition-colors ${
                        formData.roomLocation === room
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{room}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Review and Customize */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-3">Device Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Type:</strong> {formData.category}</div>
                    <div><strong>Brand:</strong> {formData.manufacturer}</div>
                    {formData.model && <div><strong>Model:</strong> {formData.model}</div>}
                    <div><strong>Location:</strong> {formData.roomLocation}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Custom device name (optional):</Label>
                  <Input
                    placeholder={`${formData.roomLocation} ${formData.category}`}
                    value={formData.customName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customName: e.target.value }))}
                  />
                  <p className="text-sm text-gray-600">
                    If left empty, will be named: "{formData.roomLocation} {formData.category}"
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">What happens next:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Device will be added to your home</li>
                    <li>• Manual and setup instructions will be automatically found</li>
                    <li>• Device will appear in your smart home interface</li>
                    <li>• Guest assistance will include this device</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep < 4 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceed}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={createDeviceMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createDeviceMutation.isPending ? 'Adding Device...' : 'Add Device'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}