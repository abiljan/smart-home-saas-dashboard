import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Shield } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  const queryClient = useQueryClient();

  const updateSettingMutation = useMutation({
    mutationFn: async ({ name, isEnabled }: { name: string; isEnabled: boolean }) => {
      const response = await apiRequest("PATCH", `/api/emergency-settings/${name}`, { isEnabled });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-summary"] });
      toast({
        title: `Emergency setting ${variables.isEnabled ? 'enabled' : 'disabled'}`,
        description: `${variables.name.replace('_', ' ')} has been ${variables.isEnabled ? 'enabled' : 'disabled'}.`,
        variant: variables.isEnabled ? "destructive" : "default",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update emergency setting. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getSetting = (name: string) => {
    return settings.find(s => s.settingName === name);
  };

  const getSettingConfig = (name: string) => {
    switch (name) {
      case "content_kill_switch":
        return {
          title: "Content Kill Switch",
          description: "Immediately disable content delivery to all homes",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-900",
          descColor: "text-red-700",
        };
      case "maintenance_mode":
        return {
          title: "API Maintenance Mode",
          description: "Put API in maintenance mode for system updates",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          textColor: "text-amber-900",
          descColor: "text-amber-700",
        };
      case "sound_alerts":
        return {
          title: "Sound Alerts",
          description: "Enable audio notifications for critical events",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-900",
          descColor: "text-blue-700",
        };
      default:
        return {
          title: name.replace('_', ' '),
          description: "Emergency control setting",
          bgColor: "bg-slate-50",
          borderColor: "border-slate-200",
          textColor: "text-slate-900",
          descColor: "text-slate-700",
        };
    }
  };

  const handleToggle = (settingName: string, currentValue: boolean) => {
    updateSettingMutation.mutate({
      name: settingName,
      isEnabled: !currentValue,
    });
  };

  return (
    <Card className="bg-white shadow-sm border border-slate-200">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Emergency Controls
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Shield className="text-red-500" size={20} />
            <span className="text-xs text-red-600 font-medium">Critical Access</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {["content_kill_switch", "maintenance_mode", "sound_alerts"].map((settingName) => {
          const setting = getSetting(settingName);
          const config = getSettingConfig(settingName);
          
          return (
            <div 
              key={settingName}
              className={`flex items-center justify-between p-4 ${config.bgColor} rounded-lg border ${config.borderColor}`}
            >
              <div>
                <h4 className={`font-medium ${config.textColor}`}>{config.title}</h4>
                <p className={`text-sm ${config.descColor}`}>{config.description}</p>
              </div>
              <Switch
                checked={setting?.isEnabled || false}
                onCheckedChange={() => handleToggle(settingName, setting?.isEnabled || false)}
                disabled={updateSettingMutation.isPending}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
