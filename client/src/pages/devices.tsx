import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Plus, Wifi, Search, Home, Smartphone, Settings } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Device } from "@shared/schema";

export default function DevicesPage() {
  const { toast } = useToast();
  const [, params] = useRoute("/homes/:homeId/devices");
  const homeId = params?.homeId;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: "",
    manufacturer: "",
    model: "",
    roomLocation: "",
  });

  const { data: devices, isLoading } = useQuery<Device[]>({
    queryKey: ["/api/homes", homeId, "devices"],
    enabled: !!homeId,
  });

  const { data: discoveredDevices, mutate: scanWifi, isPending: isScanning } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/homes/${homeId}/scan-wifi`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "WiFi scan complete",
        description: `Found ${data.discovered.length} devices`,
      });
    },
  });

  const createDeviceMutation = useMutation({
    mutationFn: async (deviceData: typeof newDevice) => {
      const response = await apiRequest("POST", `/api/homes/${homeId}/devices`, deviceData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/homes", homeId, "devices"] });
      setIsAddDialogOpen(false);
      setNewDevice({ name: "", manufacturer: "", model: "", roomLocation: "" });
      toast({
        title: "Device added successfully",
        description: "Your device has been added to the home.",
      });
    },
  });

  const handleAddDevice = () => {
    if (!newDevice.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a device name.",
        variant: "destructive",
      });
      return;
    }
    createDeviceMutation.mutate(newDevice);
  };

  const addDiscoveredDevice = (device: any) => {
    createDeviceMutation.mutate({
      ...device,
      discoveryMethod: "wifi_scan",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href={`/homes/${homeId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
                  <p className="text-gray-600">Manage and discover smart devices</p>
                </div>
                <div className="flex space-x-2">
                  <Dialog open={isDiscoveryOpen} onOpenChange={setIsDiscoveryOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Wifi className="w-4 h-4 mr-2" />
                        Discover Devices
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>WiFi Device Discovery</DialogTitle>
                        <DialogDescription>
                          Scan your network to automatically discover smart devices.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {!discoveredDevices && (
                          <div className="text-center py-6">
                            <Wifi className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 mb-4">
                              Click scan to discover devices on your network
                            </p>
                            <Button onClick={() => scanWifi()} disabled={isScanning}>
                              {isScanning ? "Scanning..." : "Start WiFi Scan"}
                            </Button>
                          </div>
                        )}
                        {discoveredDevices && (
                          <div className="space-y-3">
                            <h4 className="font-medium">Discovered Devices</h4>
                            {discoveredDevices.discovered.map((device: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <h5 className="font-medium">{device.name}</h5>
                                  <p className="text-sm text-gray-600">
                                    {device.manufacturer} {device.model} • {device.roomLocation}
                                  </p>
                                </div>
                                <Button size="sm" onClick={() => addDiscoveredDevice(device)}>
                                  Add Device
                                </Button>
                              </div>
                            ))}
                            <Button variant="outline" onClick={() => scanWifi()} className="w-full">
                              Scan Again
                            </Button>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Device
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Device</DialogTitle>
                        <DialogDescription>
                          Manually add a device to your home.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="device-name">Device Name *</Label>
                          <Input
                            id="device-name"
                            placeholder="Smart TV, Thermostat, etc."
                            value={newDevice.name}
                            onChange={(e) => setNewDevice(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="manufacturer">Manufacturer</Label>
                            <Input
                              id="manufacturer"
                              placeholder="Samsung, Nest, etc."
                              value={newDevice.manufacturer}
                              onChange={(e) => setNewDevice(prev => ({ ...prev, manufacturer: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="model">Model</Label>
                            <Input
                              id="model"
                              placeholder="Model number"
                              value={newDevice.model}
                              onChange={(e) => setNewDevice(prev => ({ ...prev, model: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="room">Room Location</Label>
                          <Select value={newDevice.roomLocation} onValueChange={(value) => setNewDevice(prev => ({ ...prev, roomLocation: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select room" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Living Room">Living Room</SelectItem>
                              <SelectItem value="Kitchen">Kitchen</SelectItem>
                              <SelectItem value="Bedroom">Bedroom</SelectItem>
                              <SelectItem value="Bathroom">Bathroom</SelectItem>
                              <SelectItem value="Office">Office</SelectItem>
                              <SelectItem value="Garage">Garage</SelectItem>
                              <SelectItem value="Basement">Basement</SelectItem>
                              <SelectItem value="Attic">Attic</SelectItem>
                              <SelectItem value="Hallway">Hallway</SelectItem>
                              <SelectItem value="Outdoor">Outdoor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddDevice} disabled={createDeviceMutation.isPending}>
                          {createDeviceMutation.isPending ? "Adding..." : "Add Device"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {!devices || devices.length === 0 ? (
          <div className="text-center py-12">
            <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No devices yet</h3>
            <p className="text-gray-600 mb-6">
              Start by discovering devices on your network or add them manually.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={() => setIsDiscoveryOpen(true)}>
                <Wifi className="w-5 h-5 mr-2" />
                Discover Devices
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Add Manually
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <DeviceCard key={device.id} device={device} homeId={homeId!} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DeviceCard({ device, homeId }: { device: Device; homeId: string }) {
  return (
    <Link href={`/homes/${homeId}/devices/${device.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{device.name}</CardTitle>
            <Badge variant={device.status === "active" ? "default" : "secondary"}>
              {device.status}
            </Badge>
          </div>
          <CardDescription>
            {device.manufacturer && device.model
              ? `${device.manufacturer} ${device.model}`
              : "Unknown device"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {device.roomLocation && (
              <div className="flex items-center text-sm text-gray-600">
                <Home className="w-4 h-4 mr-2" />
                {device.roomLocation}
              </div>
            )}
            {device.discoveryMethod && (
              <div className="flex items-center text-sm text-gray-600">
                {device.discoveryMethod === "wifi_scan" ? (
                  <Wifi className="w-4 h-4 mr-2" />
                ) : (
                  <Smartphone className="w-4 h-4 mr-2" />
                )}
                {device.discoveryMethod === "wifi_scan" ? "Discovered via WiFi" : "Added manually"}
              </div>
            )}
            <div className="pt-3 border-t">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Search className="w-4 h-4 mr-1" />
                  Find Manual
                </Button>
                <Button size="sm" className="flex-1">
                  <Settings className="w-4 h-4 mr-1" />
                  Details
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}