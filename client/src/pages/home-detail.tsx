import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Wifi, Home, Users, AlertTriangle, Settings, Camera } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CustomerHome, Device } from "@shared/schema";

export default function HomeDetailPage() {
  const [, params] = useRoute("/homes/:homeId");
  const homeId = params?.homeId;

  const { data: home, isLoading: homeLoading } = useQuery<CustomerHome>({
    queryKey: ["/api/homes", homeId],
    enabled: !!homeId,
  });

  const { data: devices, isLoading: devicesLoading } = useQuery<Device[]>({
    queryKey: ["/api/homes", homeId, "devices"],
    enabled: !!homeId,
  });

  if (homeLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!home) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Home not found</h2>
          <p className="text-gray-600 mb-4">The home you're looking for doesn't exist.</p>
          <Link href="/homes">
            <Button>Back to Homes</Button>
          </Link>
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
            <Link href="/homes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Homes
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{home.name}</h1>
                  {home.address && (
                    <p className="text-gray-600">{home.address}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={home.status === "active" ? "default" : "secondary"}>
                    {home.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Home className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Devices</p>
                      <p className="text-2xl font-bold">{devices?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Members</p>
                      <p className="text-2xl font-bold">1</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Alerts</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Devices Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Devices</CardTitle>
                    <CardDescription>
                      Manage and discover devices in your home
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Link href={`/homes/${homeId}/discover`}>
                      <Button variant="outline" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Camera className="w-4 h-4 mr-2" />
                        Scan Devices
                      </Button>
                    </Link>
                    <Link href={`/homes/${homeId}/add-device`}>
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Manually
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {devicesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : !devices || devices.length === 0 ? (
                  <div className="text-center py-8">
                    <Home className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 mb-2">No devices yet</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Discover devices using your camera or add them manually.
                    </p>
                    <div className="flex justify-center space-x-2">
                      <Link href={`/homes/${homeId}/discover`}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Camera className="w-4 h-4 mr-2" />
                          Scan Devices
                        </Button>
                      </Link>
                      <Link href={`/homes/${homeId}/add-device`}>
                        <Button size="sm" variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Manually
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {devices.slice(0, 5).map((device) => (
                      <DeviceListItem key={device.id} device={device} homeId={homeId!} />
                    ))}
                    {devices.length > 5 && (
                      <div className="pt-3 border-t">
                        <Link href={`/homes/${homeId}/devices`}>
                          <Button variant="ghost" className="w-full">
                            View All {devices.length} Devices
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/homes/${homeId}/guest`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Guest View
                  </Button>
                </Link>
                <Link href={`/homes/${homeId}/emergency`} className="block">
                  <Button variant="destructive" className="w-full justify-start">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Emergency Panel
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Home Settings
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Home created</p>
                      <p className="text-gray-600">
                        {home.createdAt ? new Date(home.createdAt).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                  </div>
                  {devices && devices.length > 0 && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">First device added</p>
                        <p className="text-gray-600">Recently</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeviceListItem({ device, homeId }: { device: Device; homeId: string }) {
  return (
    <Link href={`/homes/${homeId}/devices/${device.id}`}>
      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Home className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">{device.name}</h4>
            <Badge variant={device.status === "active" ? "default" : "secondary"} className="text-xs">
              {device.status}
            </Badge>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
            {device.manufacturer && <span>{device.manufacturer}</span>}
            {device.model && <span>{device.model}</span>}
            {device.roomLocation && <span>{device.roomLocation}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}