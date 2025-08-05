import { AlertTriangle, CircleAlert, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
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
      const response = await apiRequest("PATCH", `/api/critical-alerts/${alertId}/dismiss`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-summary"] });
      toast({
        title: "Alert dismissed",
        description: "The alert has been successfully dismissed.",
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

  const activeAlerts = alerts.filter(alert => !alert.isDismissed);

  if (activeAlerts.length === 0) {
    return null;
  }

  const getAlertStyles = (type: string) => {
    switch (type) {
      case "critical":
        return "bg-red-50 border-l-4 border-red-500 text-red-800";
      case "warning":
        return "bg-amber-50 border-l-4 border-amber-500 text-amber-800";
      default:
        return "bg-blue-50 border-l-4 border-blue-500 text-blue-800";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="text-red-500" size={18} />;
      case "warning":
        return <CircleAlert className="text-amber-500" size={18} />;
      default:
        return <CircleAlert className="text-blue-500" size={18} />;
    }
  };

  const getTimeAgo = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffMinutes === 0) return "Just now";
    if (diffMinutes === 1) return "1 min ago";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return "1 hour ago";
    return `${diffHours} hours ago`;
  };

  return (
    <div className="mb-6 space-y-3">
      {activeAlerts.map((alert) => (
        <div 
          key={alert.id}
          className={`${getAlertStyles(alert.type)} p-4 rounded-r-lg shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getAlertIcon(alert.type)}
              <div>
                <h3 className="font-semibold">
                  {alert.type === "critical" ? "Critical: " : alert.type === "warning" ? "Warning: " : ""}
                  {alert.title}
                </h3>
                <p className="text-sm opacity-90">{alert.message}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium opacity-75">
                {getTimeAgo(alert.createdAt)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissAlertMutation.mutate(alert.id)}
                disabled={dismissAlertMutation.isPending}
                className="opacity-75 hover:opacity-100"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}