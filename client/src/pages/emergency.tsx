import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertTriangle, Phone, MapPin, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmergencyFormData {
  message: string;
  location: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  guestContact: string;
}

export default function EmergencyPage() {
  const [location] = useLocation();
  const homeId = location.split('/')[2]; // Extract homeId from /homes/:homeId/emergency
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<EmergencyFormData>({
    message: '',
    location: '',
    urgency: 'high',
    guestContact: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const emergencyMutation = useMutation({
    mutationFn: (data: EmergencyFormData) => 
      apiRequest(`/api/homes/${homeId}/emergency`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Emergency Alert Sent",
        description: "Your emergency alert has been sent to the home administrator. Help is on the way.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/homes/${homeId}/emergency-alerts`] });
    },
    onError: () => {
      toast({
        title: "Emergency Alert Failed",
        description: "Failed to send emergency alert. Please try again or call emergency services directly.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) return;
    emergencyMutation.mutate(formData);
  };

  const handleQuickEmergency = (message: string, urgency: 'high' | 'critical') => {
    emergencyMutation.mutate({
      message,
      location: formData.location || 'Unknown Location',
      urgency,
      guestContact: formData.guestContact
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-red-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-800 mb-2">Emergency Alert Sent!</h1>
            <p className="text-green-700">
              Your emergency message has been sent to the home administrator.
            </p>
          </div>

          <Card className="border-green-200">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">What happens next:</h3>
              <div className="space-y-2 text-green-700">
                <p>✅ Administrator has been notified immediately</p>
                <p>✅ Emergency logged in system</p>
                <p>✅ Response team will contact you within 5 minutes</p>
              </div>
              
              <div className="mt-6 p-4 bg-green-100 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>For life-threatening emergencies:</strong><br />
                  Call 911 immediately
                </p>
              </div>

              <div className="mt-6 flex gap-3 justify-center">
                <Link href={`/homes/${homeId}`}>
                  <Button variant="outline">
                    Return to Home
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => setIsSubmitted(false)}
                >
                  Send Another Alert
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/homes/${homeId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-red-800">Emergency Help</h1>
              <p className="text-red-700">Get immediate assistance from the home administrator</p>
            </div>
          </div>
        </div>

        {/* Critical Notice */}
        <Alert className="mb-6 border-red-300 bg-red-100">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>For life-threatening emergencies, call 911 immediately.</strong><br />
            This system contacts the home administrator for non-emergency assistance.
          </AlertDescription>
        </Alert>

        {/* Quick Emergency Buttons */}
        <Card className="mb-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">Quick Emergency Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => handleQuickEmergency("URGENT: Guest needs immediate assistance", 'critical')}
              className="w-full bg-red-600 hover:bg-red-700 text-white h-12"
              disabled={emergencyMutation.isPending}
            >
              🚨 URGENT: Need Immediate Help
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                onClick={() => handleQuickEmergency("Guest is locked out and needs access", 'high')}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                disabled={emergencyMutation.isPending}
              >
                🔐 Locked Out
              </Button>
              <Button 
                onClick={() => handleQuickEmergency("Device malfunction - need technical support", 'medium')}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                disabled={emergencyMutation.isPending}
              >
                ⚡ Device Problem
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Custom Emergency Form */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">Describe Your Emergency</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-red-700">
                  What kind of help do you need? *
                </label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Describe the situation and what assistance you need..."
                  className="border-red-200 focus:border-red-400"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-red-700">
                    Your Location in Home
                  </label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Living Room, Kitchen, Guest Bedroom"
                    className="border-red-200 focus:border-red-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-red-700">
                    Urgency Level
                  </label>
                  <Select 
                    value={formData.urgency} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, urgency: value }))}
                  >
                    <SelectTrigger className="border-red-200 focus:border-red-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">🔴 Critical - Life/Safety</SelectItem>
                      <SelectItem value="high">🟠 High - Urgent Assistance</SelectItem>
                      <SelectItem value="medium">🟡 Medium - Important</SelectItem>
                      <SelectItem value="low">🟢 Low - Can Wait</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-red-700">
                  Your Contact Info (Optional)
                </label>
                <Input
                  value={formData.guestContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, guestContact: e.target.value }))}
                  placeholder="Phone number or email for direct contact"
                  className="border-red-200 focus:border-red-400"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={!formData.message.trim() || emergencyMutation.isPending}
                >
                  {emergencyMutation.isPending ? 'Sending Alert...' : 'Send Emergency Alert'}
                </Button>
                <Link href={`/homes/${homeId}`}>
                  <Button type="button" variant="outline" className="border-red-300">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-red-700">
          <MapPin className="h-4 w-4 inline mr-1" />
          This alert will be sent to the home administrator with your location and message.
        </div>
      </div>
    </div>
  );
}