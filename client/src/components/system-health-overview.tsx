import { CheckCircle, AlertCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SystemHealthItem {
  service: string;
  status: string;
  responseTime?: string;
  uptime?: string;
  details?: any;
}

interface SystemHealthOverviewProps {
  healthData: SystemHealthItem[];
}

export function SystemHealthOverview({ healthData }: SystemHealthOverviewProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'down':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health</CardTitle>
        <CardDescription>Real-time status of all services</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {healthData?.map((service) => (
            <div key={service.service} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(service.status)}
                <div>
                  <h4 className="font-medium capitalize">{service.service.replace('_', ' ')}</h4>
                  {service.details?.connections && (
                    <p className="text-sm text-gray-600">
                      {service.details.connections} connections, {service.details.messagesPerSec}/sec
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(service.status)}>
                  {service.status}
                </Badge>
                {service.responseTime && (
                  <span className="text-sm text-gray-600">{service.responseTime}</span>
                )}
                {service.uptime && (
                  <span className="text-sm text-gray-600">{service.uptime}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}