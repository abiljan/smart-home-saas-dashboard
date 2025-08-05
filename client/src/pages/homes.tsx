import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Home, Users, Settings, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CustomerHome } from "@shared/schema";

export default function HomesPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newHomeName, setNewHomeName] = useState("");
  const [newHomeAddress, setNewHomeAddress] = useState("");

  const { data: homes, isLoading } = useQuery<CustomerHome[]>({
    queryKey: ["/api/homes"],
  });

  const createHomeMutation = useMutation({
    mutationFn: async (homeData: { name: string; address: string }) => {
      const response = await apiRequest("POST", "/api/homes", homeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/homes"] });
      setIsCreateDialogOpen(false);
      setNewHomeName("");
      setNewHomeAddress("");
      toast({
        title: "Home created successfully",
        description: "You can now start adding devices to your new home.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to create home",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleCreateHome = () => {
    if (!newHomeName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your home.",
        variant: "destructive",
      });
      return;
    }
    createHomeMutation.mutate({
      name: newHomeName,
      address: newHomeAddress,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Homes</h1>
              <p className="text-gray-600">Manage your smart home documentation</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Home
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Home</DialogTitle>
                  <DialogDescription>
                    Set up a new home to start managing your smart devices and documentation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="home-name">Home Name</Label>
                    <Input
                      id="home-name"
                      placeholder="Main House, Office, etc."
                      value={newHomeName}
                      onChange={(e) => setNewHomeName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="home-address">Address (Optional)</Label>
                    <Textarea
                      id="home-address"
                      placeholder="123 Main St, City, State"
                      value={newHomeAddress}
                      onChange={(e) => setNewHomeAddress(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateHome} disabled={createHomeMutation.isPending}>
                    {createHomeMutation.isPending ? "Creating..." : "Create Home"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {!homes || homes.length === 0 ? (
          <div className="text-center py-12">
            <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No homes yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first home to start managing smart devices and documentation.
            </p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Home
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {homes.map((home) => (
              <HomeCard key={home.id} home={home} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HomeCard({ home }: { home: CustomerHome }) {
  return (
    <Link href={`/homes/${home.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{home.name}</CardTitle>
            <Badge variant={home.status === "active" ? "default" : "secondary"}>
              {home.status}
            </Badge>
          </div>
          {home.address && (
            <CardDescription className="text-sm text-gray-600">
              {home.address}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-600">
                <Home className="w-4 h-4 mr-2" />
                Devices
              </div>
              <span className="font-medium">0</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                Members
              </div>
              <span className="font-medium">1</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-600">
                <Activity className="w-4 h-4 mr-2" />
                Last Activity
              </div>
              <span className="font-medium text-gray-500">
                {home.createdAt ? new Date(home.createdAt).toLocaleDateString() : 'Recently'}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </Button>
              <Button size="sm" className="flex-1">
                View Home
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}