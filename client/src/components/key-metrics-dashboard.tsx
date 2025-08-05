import { TrendingUp, TrendingDown, Minus, DollarSign, Home, Users, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SystemMetric {
  metricType: string;
  value: string;
  previousValue?: string;
}

interface KeyMetricsDashboardProps {
  metrics: SystemMetric[];
}

export function KeyMetricsDashboard({ metrics }: KeyMetricsDashboardProps) {
  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'mrr':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'active_homes':
        return <Home className="h-5 w-5 text-blue-600" />;
      case 'churn_rate':
        return <Users className="h-5 w-5 text-orange-600" />;
      case 'device_discovery_rate':
        return <AlertTriangle className="h-5 w-5 text-purple-600" />;
      default:
        return <TrendingUp className="h-5 w-5 text-gray-600" />;
    }
  };

  const getMetricTitle = (type: string) => {
    switch (type) {
      case 'mrr':
        return 'Monthly Recurring Revenue';
      case 'active_homes':
        return 'Active Homes';
      case 'churn_rate':
        return 'Churn Rate';
      case 'device_discovery_rate':
        return 'Device Discovery Rate';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatValue = (type: string, value: string) => {
    switch (type) {
      case 'mrr':
        return `$${parseFloat(value).toLocaleString()}`;
      case 'churn_rate':
      case 'device_discovery_rate':
        return `${value}%`;
      default:
        return value;
    }
  };

  const getTrendIcon = (current: string, previous?: string) => {
    if (!previous) return <Minus className="h-4 w-4 text-gray-500" />;
    
    const currentVal = parseFloat(current);
    const previousVal = parseFloat(previous);
    
    if (currentVal > previousVal) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (currentVal < previousVal) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendPercentage = (current: string, previous?: string) => {
    if (!previous) return null;
    
    const currentVal = parseFloat(current);
    const previousVal = parseFloat(previous);
    const change = ((currentVal - previousVal) / previousVal) * 100;
    
    return change.toFixed(1);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics?.map((metric) => {
        const trendPercentage = getTrendPercentage(metric.value, metric.previousValue);
        return (
          <Card key={metric.metricType}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {getMetricTitle(metric.metricType)}
              </CardTitle>
              {getMetricIcon(metric.metricType)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatValue(metric.metricType, metric.value)}
              </div>
              {trendPercentage && (
                <div className="flex items-center text-xs text-muted-foreground">
                  {getTrendIcon(metric.value, metric.previousValue)}
                  <span className="ml-1">
                    {trendPercentage}% from last period
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}