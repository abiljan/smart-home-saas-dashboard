import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CriticalAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isDismissed: boolean;
}

interface CriticalAlertsBarProps {
  alerts: CriticalAlert[];
}

export function CriticalAlertsBar({ alerts }: CriticalAlertsBarProps) {
  const dismissMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await apiRequest("PATCH", `/api/critical-alerts/${alertId}/dismiss`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-summary"] });
    },
  });

  const activeAlerts = alerts?.filter(alert => !alert.isDismissed) || [];

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Critical Alerts ({activeAlerts.length})
          </h3>
          <div className="mt-2 space-y-2">
            {activeAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between bg-white p-3 rounded-md border">
                <div className="flex items-center space-x-3">
                  <Badge variant={alert.type === "critical" ? "destructive" : "secondary"}>
                    {alert.type}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissMutation.mutate(alert.id)}
                  disabled={dismissMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}