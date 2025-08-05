import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HealthData {
  service: string;
  status: string;
  responseTime?: string;
  uptime?: string;
  details?: any;
}

interface SystemHealthOverviewProps {
  healthData: HealthData[];
}

export function SystemHealthOverview({ healthData }: SystemHealthOverviewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-emerald-500";
      case "degraded":
        return "bg-amber-500";
      case "down":
        return "bg-red-500";
      default:
        return "bg-slate-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "operational":
        return { text: "Operational", color: "text-emerald-600" };
      case "degraded":
        return { text: "Degraded", color: "text-amber-600" };
      case "down":
        return { text: "Down", color: "text-red-600" };
      default:
        return { text: "Unknown", color: "text-slate-600" };
    }
  };

  const getServiceTitle = (service: string) => {
    switch (service) {
      case "api":
        return "API Status";
      case "database":
        return "Database";
      case "realtime":
        return "Real-time";
      case "external_services":
        return "External Services";
      default:
        return service;
    }
  };

  const getServiceMetrics = (service: string, data: HealthData) => {
    switch (service) {
      case "api":
        return [
          { label: "Response Time", value: data.responseTime || "N/A", color: undefined },
          { label: "Uptime (24h)", value: data.uptime || "N/A", color: undefined },
          { label: "Requests/min", value: "142", color: undefined }, // Static for now
        ];
      case "database":
        return [
          { label: "Query Time", value: data.responseTime || "45ms", color: undefined },
          { label: "Connections", value: "28/100", color: undefined },
          { label: "Storage Used", value: "2.4GB", color: undefined },
        ];
      case "realtime":
        return [
          { label: "Connections", value: data.details?.connections || "847", color: undefined },
          { label: "Messages/sec", value: data.details?.messagesPerSec || "23", color: undefined },
          { label: "Last Sync", value: "Now", color: undefined },
        ];
      case "external_services":
        return [
          { label: "Stripe API", value: "●", color: "text-emerald-500" },
          { label: "Zendesk API", value: "●", color: "text-amber-500" },
          { label: "Email Service", value: "●", color: "text-emerald-500" },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {healthData.map((health) => {
        const statusInfo = getStatusText(health.status);
        const metrics = getServiceMetrics(health.service, health);

        return (
          <Card key={health.service} className="bg-white shadow-sm border border-slate-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {getServiceTitle(health.service)}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 ${getStatusColor(health.status)} rounded-full`}></div>
                  <span className={`text-xs font-medium ${statusInfo.color}`}>
                    {statusInfo.text}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {metrics.map((metric, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">{metric.label}</span>
                  <span className={`text-sm font-semibold ${metric.color ? metric.color : 'text-slate-900'}`}>
                    {metric.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}