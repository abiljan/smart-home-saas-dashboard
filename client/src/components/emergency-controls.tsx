import { useState } from "react";
import { AlertTriangle, Volume2, VolumeX, Power, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmergencySetting {
  settingName: string;
  isEnabled: boolean;
}

interface EmergencyControlsProps {
  settings: EmergencySetting[];
}

export function EmergencyControls({ settings }: EmergencyControlsProps) {
  const { toast } = useToast();
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());

  const updateSettingMutation = useMutation({
    mutationFn: async ({ name, enabled }: { name: string; enabled: boolean }) => {
      const response = await apiRequest("PATCH", `/api/emergency-settings/${name}`, {
        isEnabled: enabled,
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-summary"] });
      setPendingChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.name);
        return newSet;
      });
      toast({
        title: "Emergency setting updated",
        description: `${variables.name.replace(/_/g, ' ')} has been ${variables.enabled ? 'enabled' : 'disabled'}`,
        variant: variables.enabled ? "destructive" : "default"
      });
    },
    onError: (error, variables) => {
      setPendingChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.name);
        return newSet;
      });
      toast({
        title: "Failed to update setting",
        description: "Please try again or contact support",
        variant: "destructive"
      });
    },
  });

  const handleToggle = (settingName: string, currentValue: boolean) => {
    setPendingChanges(prev => new Set(prev).add(settingName));
    updateSettingMutation.mutate({
      name: settingName,
      enabled: !currentValue,
    });
  };

  const getSettingIcon = (name: string) => {
    switch (name) {
      case 'content_kill_switch':
        return <Power className="h-5 w-5 text-red-600" />;
      case 'maintenance_mode':
        return <Settings className="h-5 w-5 text-yellow-600" />;
      case 'sound_alerts':
        return <Volume2 className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSettingTitle = (name: string) => {
    switch (name) {
      case 'content_kill_switch':
        return 'Content Kill Switch';
      case 'maintenance_mode':
        return 'Maintenance Mode';
      case 'sound_alerts':
        return 'Sound Alerts';
      default:
        return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getSettingDescription = (name: string) => {
    switch (name) {
      case 'content_kill_switch':
        return 'Immediately disable all user-facing content';
      case 'maintenance_mode':
        return 'Put system into maintenance mode';
      case 'sound_alerts':
        return 'Enable audio notifications for critical alerts';
      default:
        return 'Emergency system control';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <span>Emergency Controls</span>
        </CardTitle>
        <CardDescription>
          Critical system controls - use with caution
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {settings?.map((setting) => (
            <div key={setting.settingName} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getSettingIcon(setting.settingName)}
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{getSettingTitle(setting.settingName)}</h4>
                    {setting.isEnabled && (
                      <Badge variant="destructive">Active</Badge>
                    )}
                    {pendingChanges.has(setting.settingName) && (
                      <Badge variant="secondary">Updating...</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {getSettingDescription(setting.settingName)}
                  </p>
                </div>
              </div>
              <Switch
                checked={setting.isEnabled}
                onCheckedChange={() => handleToggle(setting.settingName, setting.isEnabled)}
                disabled={pendingChanges.has(setting.settingName)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}