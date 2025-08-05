import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wifi, Plus, Settings, Power } from "lucide-react";

interface Device {
  id: string;
  name: string;
  homeId: string;
  manufacturer?: string;
  model?: string;
  roomLocation?: string;
  status: string;
  discoveryMethod?: string;
  metadata?: any;
  createdAt: string;
}

interface Home {
  id: string;
  name: string;
  address?: string;
  ownerName?: string;
  deviceCount?: number;
}

export default function DevicesPage() {
  const [location] = useLocation();
  
  const { data: homes = [], isLoading: homesLoading } = useQuery<Home[]>({
    queryKey: ['/api/homes'],
  });

  const { data: devices = [], isLoading: devicesLoading } = useQuery<Device[]>({
    queryKey: ['/api/devices'],
  });

  const devicesWithHomes = devices.map(device => {
    const home = homes.find(h => h.id === device.homeId);
    return { ...device, homeName: home?.name || 'Unknown Home' };
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'offline':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getDiscoveryIcon = (method?: string) => {
    if (method === 'wifi_scan') return <Wifi className="h-4 w-4" />;
    if (method === 'manual') return <Plus className="h-4 w-4" />;
    return <Settings className="h-4 w-4" />;
  };

  if (homesLoading || devicesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Device Management</h1>
          </div>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading devices...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Device Management</h1>
              <p className="text-gray-600 mt-1">
                Manage all smart home devices across customer homes
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {devices.length} Total Devices
          </Badge>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mb-6">
          <Link href="/homes">
            <Button variant="outline">
              View Customer Homes
            </Button>
          </Link>
          <Button variant="outline" disabled>
            Device Discovery
          </Button>
          <Button variant="outline" disabled>
            Bulk Actions
          </Button>
        </div>

        {/* Device Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{devices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Online</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {devices.filter(d => d.status.toLowerCase() === 'online').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Offline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {devices.filter(d => d.status.toLowerCase() === 'offline').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Homes Covered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {new Set(devices.map(d => d.homeId)).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Devices List */}
        <div className="space-y-4">
          {devicesWithHomes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Devices Found</h3>
                <p className="text-gray-600 mb-4">
                  No smart home devices have been discovered yet.
                </p>
                <Link href="/homes">
                  <Button>
                    View Customer Homes
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            devicesWithHomes.map((device) => (
              <Card key={device.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {device.status.toLowerCase() === 'online' ? (
                            <Power className="h-4 w-4 text-green-600" />
                          ) : (
                            <Power className="h-4 w-4 text-gray-400" />
                          )}
                          <h3 className="text-lg font-semibold text-gray-900">
                            {device.name}
                          </h3>
                        </div>
                        <Badge className={getStatusColor(device.status)}>
                          {device.status}
                        </Badge>
                        {device.discoveryMethod && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            {getDiscoveryIcon(device.discoveryMethod)}
                            <span className="capitalize">
                              {device.discoveryMethod.replace('_', ' ')}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Home:</span>
                          <p className="text-gray-600">{device.homeName}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Location:</span>
                          <p className="text-gray-600">{device.roomLocation || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Manufacturer:</span>
                          <p className="text-gray-600">{device.manufacturer || 'Unknown'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Model:</span>
                          <p className="text-gray-600">{device.model || 'Unknown'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Link href={`/homes/${device.homeId}`}>
                        <Button variant="outline" size="sm">
                          View Home
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" disabled>
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Device management interface - Navigate to individual homes for detailed device configuration
        </div>
      </div>
    </div>
  );
}