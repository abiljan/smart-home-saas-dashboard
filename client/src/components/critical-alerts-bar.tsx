import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isDismissed: boolean;
}

interface CriticalAlertsBarProps {
  alerts: Alert[];
}

export function CriticalAlertsBar({ alerts }: CriticalAlertsBarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const dismissAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await apiRequest("PATCH", `/api/critical-alerts/${alertId}/dismiss`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-summary"] });
      toast({
        title: "Alert dismissed",
        description: "The critical alert has been dismissed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to dismiss alert. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDismiss = (alertId: string) => {
    dismissAlertMutation.mutate(alertId);
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "critical":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-amber-50 border-amber-200 text-amber-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-slate-50 border-slate-200 text-slate-800";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "critical":
        return "text-red-500";
      case "warning":
        return "text-amber-500";
      case "info":
        return "text-blue-500";
      default:
        return "text-slate-500";
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.isDismissed);

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-6">
      {activeAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-center justify-between p-4 rounded-lg border ${getAlertColor(alert.type)}`}
        >
          <div className="flex items-center space-x-3">
            <AlertTriangle className={`${getIconColor(alert.type)} flex-shrink-0`} size={20} />
            <div>
              <h4 className="font-medium">{alert.title}</h4>
              <p className="text-sm opacity-90">{alert.message}</p>
              <span className="text-xs opacity-75">
                {new Date(alert.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDismiss(alert.id)}
            disabled={dismissAlertMutation.isPending}
            className="flex-shrink-0 hover:bg-white/50"
          >
            <X size={16} />
          </Button>
        </div>
      ))}
    </div>
  );
}