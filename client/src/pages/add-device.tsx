import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Settings, CheckCircle2, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Types from the database schema
interface DeviceCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  isCustom: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

interface DeviceBrand {
  id: string;
  categoryId: string;
  name: string;
  displayName: string;
  website?: string;
  supportUrl?: string;
  isActive: boolean;
  createdAt: string;
}

interface DeviceModel {
  id: string;
  brandId: string;
  name: string;
  displayName: string;
  modelNumber?: string;
  description?: string;
  specifications?: Record<string, any>;
  manualUrl?: string;
  supportUrl?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

interface DeviceFormData {
  name: string;
  categoryId: string;
  brandId: string;
  modelId: string;
  customCategory: string;
  customBrand: string;
  customModel: string;
  roomLocation: string;
  discoveryMethod: "manual" | "wifi_scan" | "barcode" | "visual";
  notes: string;
  purchaseDate: string;
  warrantyExpiry: string;
}

const commonRooms = [
  "Living Room", "Kitchen", "Master Bedroom", "Guest Bedroom", 
  "Bathroom", "Dining Room", "Home Office", "Basement", 
  "Garage", "Hallway", "Entryway", "Patio/Deck", "Other"
];

export default function AddDevicePage() {
  const [location] = useLocation();
  const homeId = location.split('/')[2]; // Extract from /homes/:homeId/add-device
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<DeviceFormData>({
    name: '',
    categoryId: '',
    brandId: '',
    modelId: '',
    customCategory: '',
    customBrand: '',
    customModel: '',
    roomLocation: '',
    discoveryMethod: 'manual',
    notes: '',
    purchaseDate: '',
    warrantyExpiry: ''
  });

  const [selectedCategory, setSelectedCategory] = useState<DeviceCategory | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<DeviceBrand | null>(null);
  const [selectedModel, setSelectedModel] = useState<DeviceModel | null>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);

  // Fetch device categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['device-categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/device-categories');
      return response.json();
    }
  });

  // Fetch brands for selected category
  const { data: brands = [], isLoading: brandsLoading } = useQuery({
    queryKey: ['device-brands', formData.categoryId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/device-brands?categoryId=${formData.categoryId}`);
      return response.json();
    },
    enabled: !!formData.categoryId && !isCustomCategory
  });

  // Fetch models for selected brand
  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['device-models', formData.brandId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/device-models/${formData.brandId}`);
      return response.json();
    },
    enabled: !!formData.brandId && !isCustomBrand
  });

  const createDeviceMutation = useMutation({
    mutationFn: async (deviceData: any) => {
      const response = await apiRequest('POST', `/api/homes/${homeId}/devices`, deviceData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Device Added Successfully",
        description: "The device has been added to your home and documentation is being retrieved.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/homes/${homeId}/devices`] });
      // Navigate back to home detail
      window.history.back();
    },
    onError: (error: any) => {
      toast({
        title: "Error Adding Device",
        description: error.message || "Failed to add device. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    if (categoryId === 'custom') {
      setIsCustomCategory(true);
      setFormData(prev => ({ 
        ...prev, 
        categoryId: '', 
        brandId: '', 
        modelId: '',
        customBrand: '',
        customModel: ''
      }));
      setSelectedCategory(null);
      setSelectedBrand(null);
      setSelectedModel(null);
    } else {
      setIsCustomCategory(false);
      const category = categories.find((cat: DeviceCategory) => cat.id === categoryId);
      setSelectedCategory(category);
      setFormData(prev => ({ 
        ...prev, 
        categoryId, 
        brandId: '', 
        modelId: '',
        customCategory: '',
        customBrand: '',
        customModel: ''
      }));
      setSelectedBrand(null);
      setSelectedModel(null);
    }
    setIsCustomBrand(false);
    setIsCustomModel(false);
  };

  // Handle brand selection
  const handleBrandSelect = (brandId: string) => {
    if (brandId === 'custom') {
      setIsCustomBrand(true);
      setFormData(prev => ({ ...prev, brandId: '', modelId: '', customModel: '' }));
      setSelectedBrand(null);
      setSelectedModel(null);
    } else {
      setIsCustomBrand(false);
      const brand = brands.find((br: DeviceBrand) => br.id === brandId);
      setSelectedBrand(brand);
      setFormData(prev => ({ ...prev, brandId, modelId: '', customBrand: '', customModel: '' }));
      setSelectedModel(null);
    }
    setIsCustomModel(false);
  };

  // Handle model selection
  const handleModelSelect = (modelId: string) => {
    if (modelId === 'custom') {
      setIsCustomModel(true);
      setFormData(prev => ({ ...prev, modelId: '' }));
      setSelectedModel(null);
    } else {
      setIsCustomModel(false);
      const model = models.find((mod: DeviceModel) => mod.id === modelId);
      setSelectedModel(model);
      setFormData(prev => ({ ...prev, modelId, customModel: '' }));
      
      // Auto-populate device name if not set
      if (!formData.name && model && selectedBrand) {
        setFormData(prev => ({ 
          ...prev, 
          name: `${selectedBrand.displayName} ${model.displayName}` 
        }));
      }
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    // Validate required fields
    if (!formData.name) {
      toast({
        title: "Name Required",
        description: "Please provide a name for the device.",
        variant: "destructive"
      });
      return;
    }

    if (!isCustomCategory && !formData.categoryId) {
      toast({
        title: "Category Required",
        description: "Please select a device category.",
        variant: "destructive"
      });
      return;
    }

    if (isCustomCategory && !formData.customCategory) {
      toast({
        title: "Custom Category Required",
        description: "Please specify a custom category.",
        variant: "destructive"
      });
      return;
    }

    // Prepare device data for submission
    const deviceData = {
      name: formData.name,
      categoryId: !isCustomCategory ? formData.categoryId : null,
      brandId: !isCustomBrand && formData.brandId ? formData.brandId : null,
      modelId: !isCustomModel && formData.modelId ? formData.modelId : null,
      customCategory: isCustomCategory ? formData.customCategory : null,
      customBrand: isCustomBrand ? formData.customBrand : null,
      customModel: isCustomModel ? formData.customModel : null,
      roomLocation: formData.roomLocation,
      discoveryMethod: formData.discoveryMethod,
      notes: formData.notes,
      purchaseDate: formData.purchaseDate || null,
      warrantyExpiry: formData.warrantyExpiry || null,
      metadata: {
        selectedCategory: selectedCategory?.displayName,
        selectedBrand: selectedBrand?.displayName,
        selectedModel: selectedModel?.displayName
      }
    };

    createDeviceMutation.mutate(deviceData);
  };

  const canProceedToStep2 = isCustomCategory ? 
    formData.customCategory : 
    formData.categoryId;

  const canProceedToStep3 = canProceedToStep2 && (
    isCustomBrand ? 
      formData.customBrand : 
      (formData.brandId || isCustomCategory)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/homes/${homeId}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Device</h1>
          <p className="text-gray-600 mt-2">Add a device to your smart home with comprehensive device recognition</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step ? 'bg-blue-600 text-white' : 
                  (step === 1 && canProceedToStep2) || (step === 2 && canProceedToStep3) ? 'bg-green-600 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {((step === 1 && canProceedToStep2) || (step === 2 && canProceedToStep3) || currentStep > step) ? 
                    <CheckCircle2 className="h-4 w-4" /> : step}
                </div>
                {step < 3 && <div className="w-12 h-0.5 bg-gray-300" />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Device Type</span>
            <span>Brand & Model</span>
            <span>Details</span>
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            {/* Step 1: Device Category */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">What type of device are you adding?</h2>
                
                {categoriesLoading ? (
                  <div className="text-center py-8">Loading device categories...</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {categories.filter((cat: DeviceCategory) => cat.isActive).map((category: DeviceCategory) => (
                      <Button
                        key={category.id}
                        variant={formData.categoryId === category.id ? "default" : "outline"}
                        className="h-auto p-4 flex flex-col items-center space-y-2"
                        onClick={() => handleCategorySelect(category.id)}
                      >
                        <Settings className="h-6 w-6" />
                        <div className="text-center">
                          <div className="font-medium text-sm">{category.displayName}</div>
                          <div className="text-xs text-gray-500">{category.description}</div>
                        </div>
                      </Button>
                    ))}
                    
                    {/* Custom Category Option */}
                    <Button
                      variant={isCustomCategory ? "default" : "outline"}
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                      onClick={() => handleCategorySelect('custom')}
                    >
                      <Plus className="h-6 w-6" />
                      <div className="text-center">
                        <div className="font-medium text-sm">Other/Custom</div>
                        <div className="text-xs text-gray-500">Define your own</div>
                      </div>
                    </Button>
                  </div>
                )}

                {/* Custom Category Input */}
                {isCustomCategory && (
                  <div className="mb-6">
                    <Label htmlFor="customCategory">Custom Device Category</Label>
                    <Input
                      id="customCategory"
                      placeholder="e.g., Pool Equipment, Custom Sensor, etc."
                      value={formData.customCategory}
                      onChange={(e) => setFormData(prev => ({ ...prev, customCategory: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between">
                  <div />
                  <Button 
                    onClick={() => setCurrentStep(2)}
                    disabled={!canProceedToStep2}
                  >
                    Next: Brand & Model
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Brand & Model */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Brand and Model</h2>
                
                {/* Selected Category Display */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium">
                      Category: {isCustomCategory ? formData.customCategory : selectedCategory?.displayName}
                    </span>
                  </div>
                </div>

                {/* Brand Selection */}
                {!isCustomCategory && (
                  <div className="mb-6">
                    <Label htmlFor="brand">Brand</Label>
                    {brandsLoading ? (
                      <div className="py-4 text-gray-500">Loading brands...</div>
                    ) : (
                      <Select onValueChange={handleBrandSelect} value={isCustomBrand ? 'custom' : formData.brandId}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select a brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map((brand: DeviceBrand) => (
                            <SelectItem key={brand.id} value={brand.id}>
                              {brand.displayName}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Other/Custom Brand</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {/* Custom Brand Input */}
                {(isCustomBrand || isCustomCategory) && (
                  <div className="mb-6">
                    <Label htmlFor="customBrand">Custom Brand</Label>
                    <Input
                      id="customBrand"
                      placeholder="Enter brand name"
                      value={formData.customBrand}
                      onChange={(e) => setFormData(prev => ({ ...prev, customBrand: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                )}

                {/* Model Selection */}
                {!isCustomBrand && formData.brandId && (
                  <div className="mb-6">
                    <Label htmlFor="model">Model</Label>
                    {modelsLoading ? (
                      <div className="py-4 text-gray-500">Loading models...</div>
                    ) : (
                      <Select onValueChange={handleModelSelect} value={isCustomModel ? 'custom' : formData.modelId}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          {models.map((model: DeviceModel) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.displayName}
                              {model.modelNumber && <span className="text-gray-500 ml-2">({model.modelNumber})</span>}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Other/Custom Model</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {/* Custom Model Input */}
                {(isCustomModel || isCustomBrand || isCustomCategory) && (
                  <div className="mb-6">
                    <Label htmlFor="customModel">Custom Model</Label>
                    <Input
                      id="customModel"
                      placeholder="Enter model name or number"
                      value={formData.customModel}
                      onChange={(e) => setFormData(prev => ({ ...prev, customModel: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Back
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep(3)}
                    disabled={!canProceedToStep3}
                  >
                    Next: Details
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Device Details */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Device Details</h2>

                {/* Device Name */}
                <div className="mb-6">
                  <Label htmlFor="deviceName">Device Name *</Label>
                  <Input
                    id="deviceName"
                    placeholder="e.g., Living Room TV"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">Give this device a friendly name</p>
                </div>

                {/* Room Location */}
                <div className="mb-6">
                  <Label htmlFor="room">Room Location</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, roomLocation: value }))} value={formData.roomLocation}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonRooms.map((room) => (
                        <SelectItem key={room} value={room}>
                          {room}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Discovery Method */}
                <div className="mb-6">
                  <Label htmlFor="discoveryMethod">How did you find this device?</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, discoveryMethod: value as any }))} value={formData.discoveryMethod}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Entry</SelectItem>
                      <SelectItem value="visual">Visual Recognition</SelectItem>
                      <SelectItem value="wifi_scan">WiFi Scan</SelectItem>
                      <SelectItem value="barcode">Barcode Scan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional information about this device..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="mt-2"
                    rows={3}
                  />
                </div>

                {/* Purchase Date */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchaseDate">Purchase Date (Optional)</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="warrantyExpiry">Warranty Expiry (Optional)</Label>
                    <Input
                      id="warrantyExpiry"
                      type="date"
                      value={formData.warrantyExpiry}
                      onChange={(e) => setFormData(prev => ({ ...prev, warrantyExpiry: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Device Summary</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div><strong>Name:</strong> {formData.name}</div>
                    <div><strong>Category:</strong> {isCustomCategory ? formData.customCategory : selectedCategory?.displayName}</div>
                    <div><strong>Brand:</strong> {isCustomBrand || isCustomCategory ? formData.customBrand : selectedBrand?.displayName}</div>
                    <div><strong>Model:</strong> {isCustomModel || isCustomBrand || isCustomCategory ? formData.customModel : selectedModel?.displayName}</div>
                    <div><strong>Room:</strong> {formData.roomLocation}</div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createDeviceMutation.isPending || !formData.name}
                  >
                    {createDeviceMutation.isPending ? 'Adding Device...' : 'Add Device'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}