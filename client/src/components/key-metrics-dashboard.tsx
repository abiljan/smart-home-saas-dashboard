import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ExternalLink } from "lucide-react";

interface Metric {
  metricType: string;
  value: string;
  previousValue?: string;
}

interface HealthData {
  service: string;
  status: string;
}

interface KeyMetricsDashboardProps {
  metrics: Metric[];
  healthData: HealthData[];
}

export function KeyMetricsDashboard({ metrics, healthData }: KeyMetricsDashboardProps) {
  const getMetricByType = (type: string) => {
    return metrics.find(m => m.metricType === type);
  };

  const calculateChange = (current: string, previous?: string) => {
    if (!previous) return null;
    
    const currentNum = parseFloat(current);
    const previousNum = parseFloat(previous);
    const change = currentNum - previousNum;
    const percentage = (change / previousNum) * 100;
    
    return {
      value: Math.abs(change),
      percentage: Math.abs(percentage),
      isPositive: change > 0,
      isNegative: change < 0,
    };
  };

  const discoveryRate = getMetricByType("device_discovery_rate");
  const mrr = getMetricByType("mrr");
  const activeHomes = getMetricByType("active_homes");
  const churnRate = getMetricByType("churn_rate");

  const discoveryChange = discoveryRate ? calculateChange(discoveryRate.value, discoveryRate.previousValue) : null;
  const mrrChange = mrr ? calculateChange(mrr.value, mrr.previousValue) : null;
  const homesChange = activeHomes ? calculateChange(activeHomes.value, activeHomes.previousValue) : null;
  const churnChange = churnRate ? calculateChange(churnRate.value, churnRate.previousValue) : null;

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(parseFloat(value));
  };

  const formatNumber = (value: string) => {
    return new Intl.NumberFormat('en-US').format(parseFloat(value));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Device Discovery Success Rate */}
      <Card className="bg-white shadow-sm border border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Device Discovery Rate
            </CardTitle>
            <span className="text-xs text-slate-500">Primary Metric</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {discoveryRate?.value || "0"}%
            </div>
            {discoveryChange && (
              <div className="flex items-center justify-center space-x-2">
                {discoveryChange.isNegative ? (
                  <ArrowDown className="text-red-500" size={16} />
                ) : (
                  <ArrowUp className="text-emerald-500" size={16} />
                )}
                <span className={`text-sm font-medium ${discoveryChange.isNegative ? 'text-red-600' : 'text-emerald-600'}`}>
                  {discoveryChange.percentage.toFixed(1)}% from yesterday
                </span>
              </div>
            )}
          </div>
          <div className="bg-slate-100 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${parseFloat(discoveryRate?.value || "0") >= 90 ? 'bg-emerald-500' : parseFloat(discoveryRate?.value || "0") >= 85 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${discoveryRate?.value || 0}%` }}
            ></div>
          </div>
          <div className="text-center text-xs text-slate-600">
            Target: 90% | Critical: &lt;85%
          </div>
        </CardContent>
      </Card>

      {/* Business Metrics */}
      <Card className="bg-white shadow-sm border border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Business Metrics
            </CardTitle>
            <Button variant="ghost" size="sm">
              <ExternalLink size={14} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Monthly Recurring Revenue</span>
            <div className="text-right">
              <div className="text-lg font-semibold text-slate-900">
                {mrr ? formatCurrency(mrr.value) : "$0"}
              </div>
              {mrrChange && (
                <div className="flex items-center space-x-1">
                  <ArrowUp className="text-emerald-500" size={12} />
                  <span className="text-emerald-600 text-xs">
                    +{mrrChange.percentage.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Active Homes</span>
            <div className="text-right">
              <div className="text-lg font-semibold text-slate-900">
                {activeHomes ? formatNumber(activeHomes.value) : "0"}
              </div>
              {homesChange && (
                <div className="flex items-center space-x-1">
                  <ArrowUp className="text-emerald-500" size={12} />
                  <span className="text-emerald-600 text-xs">
                    +{homesChange.value.toFixed(0)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Churn Rate</span>
            <div className="text-right">
              <div className="text-lg font-semibold text-slate-900">
                {churnRate?.value || "0"}%
              </div>
              {churnChange && (
                <div className="flex items-center space-x-1">
                  {churnChange.isNegative ? (
                    <ArrowDown className="text-emerald-500" size={12} />
                  ) : (
                    <ArrowUp className="text-red-500" size={12} />
                  )}
                  <span className={`text-xs ${churnChange.isNegative ? 'text-emerald-600' : 'text-red-600'}`}>
                    {churnChange.isNegative ? '-' : '+'}{churnChange.percentage.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Overview */}
      <Card className="bg-white shadow-sm border border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Support Overview
            </CardTitle>
            <Button 
              variant="link" 
              size="sm"
              className="text-blue-600 hover:text-blue-800"
              onClick={() => window.open('https://zendesk.com', '_blank')}
            >
              Open Zendesk
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Open Tickets</span>
            <div className="text-right">
              <div className="text-lg font-semibold text-amber-600">23</div>
              <div className="text-xs text-slate-500">+5 today</div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Avg Response Time</span>
            <div className="text-right">
              <div className="text-lg font-semibold text-slate-900">2.3h</div>
              <div className="text-xs text-emerald-600">-0.5h</div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Customer Satisfaction</span>
            <div className="text-right">
              <div className="text-lg font-semibold text-emerald-600">4.7/5</div>
              <div className="text-xs text-slate-500">94% positive</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}