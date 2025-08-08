import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { useNotifications } from "@/hooks/use-notifications";
import { CriticalAlertsBar } from "@/components/critical-alerts-bar";
import { SystemHealthOverview } from "@/components/system-health-overview";
import { KeyMetricsDashboard } from "@/components/key-metrics-dashboard";
import { EmergencyControls } from "@/components/emergency-controls";
import { ActivityLog } from "@/components/activity-log";
import { Bell, Home, Building, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardData {
  systemHealth: Array<{
    service: string;
    status: string;
    responseTime?: string;
    uptime?: string;
    details?: any;
  }>;
  systemMetrics: Array<{
    metricType: string;
    value: string;
    previousValue?: string;
  }>;
  criticalAlerts: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    createdAt: string;
    isDismissed: boolean;
  }>;
  recentActivity: Array<{
    id: string;
    eventType: string;
    title: string;
    description: string;
    severity: string;
    timestamp: string;
  }>;
  emergencySettings: Array<{
    settingName: string;
    isEnabled: boolean;
  }>;
  lastUpdated: string;
}

export default function Dashboard() {
  const [lastUpdated, setLastUpdated] = useState<string>("Just now");
  
  const { data: dashboardData, refetch } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard-summary"],
    refetchInterval: 180000, // 3 minutes
  });

  // WebSocket connection for real-time updates
  const { isConnected } = useWebSocket({
    onMessage: (data: any) => {
      // WebSocket message received - refetch dashboard data
      refetch();
      setLastUpdated("Just now");
    },
  });

  // Notifications setup
  const { requestPermission, showNotification } = useNotifications();

  useEffect(() => {
    // Request notification permission after 2 seconds
    const timer = setTimeout(() => {
      requestPermission();
    }, 2000);

    return () => clearTimeout(timer);
  }, [requestPermission]);

  useEffect(() => {
    // Show notifications for critical alerts
    if (dashboardData?.criticalAlerts) {
      dashboardData.criticalAlerts.forEach((alert) => {
        if (alert.type === "critical" && !alert.isDismissed) {
          showNotification(alert.title, {
            body: alert.message,
            tag: alert.id,
          });
        }
      });
    }
  }, [dashboardData?.criticalAlerts, showNotification]);

  useEffect(() => {
    // Update last updated time every minute
    const interval = setInterval(() => {
      if (dashboardData?.lastUpdated) {
        const now = new Date();
        const updated = new Date(dashboardData.lastUpdated);
        const diffMinutes = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60));
        
        if (diffMinutes === 0) {
          setLastUpdated("Just now");
        } else if (diffMinutes === 1) {
          setLastUpdated("1 min ago");
        } else {
          setLastUpdated(`${diffMinutes} min ago`);
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [dashboardData?.lastUpdated]);

  const unreadAlertsCount = dashboardData?.criticalAlerts?.filter((alert) => !alert.isDismissed).length || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Home className="text-white" size={16} />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">Smart Home SaaS</h1>
                  <p className="text-xs text-slate-500">Superadmin Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Last Update Indicator */}
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                <span>Last updated: <span>{lastUpdated}</span></span>
              </div>
              
              {/* Notification Bell */}
              <button className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors">
                <Bell size={18} />
                {unreadAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadAlertsCount}
                  </span>
                )}
              </button>
              
              {/* Customer Homes Link */}
              <Link href="/homes">
                <Button variant="outline" size="sm">
                  <Building className="h-4 w-4 mr-2" />
                  Customer Homes
                </Button>
              </Link>
              
              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">A</span>
                </div>
                <span className="text-sm font-medium text-slate-900">Admin User</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Critical Alerts Bar */}
          <CriticalAlertsBar alerts={dashboardData?.criticalAlerts || []} />

          {/* Key Metrics Dashboard */}
          <KeyMetricsDashboard 
            metrics={dashboardData?.systemMetrics || []}
          />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health Overview */}
            <SystemHealthOverview healthData={dashboardData?.systemHealth || []} />
            
            {/* Emergency Controls */}
            <EmergencyControls settings={dashboardData?.emergencySettings || []} />
          </div>

          {/* Activity Log */}
          <ActivityLog activities={dashboardData?.recentActivity || []} />
        </div>
      </div>
    </div>
  );
}
