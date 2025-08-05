import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Activity {
  id: string;
  eventType: string;
  title: string;
  description: string;
  severity: string;
  timestamp: string;
}

interface ActivityLogProps {
  activities: Activity[];
}

export function ActivityLog({ activities }: ActivityLogProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "warning":
        return "bg-amber-500";
      case "info":
        return "bg-blue-500";
      default:
        return "bg-slate-400";
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffMinutes === 0) return "Just now";
    if (diffMinutes === 1) return "1 min ago";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  return (
    <Card className="bg-white shadow-sm border border-slate-200">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Recent Activity
          </CardTitle>
          <Button 
            variant="link" 
            size="sm"
            className="text-blue-600 hover:text-blue-800"
          >
            View All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No recent activity to display
            </div>
          ) : (
            activities.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-start space-x-3 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0"
              >
                <div className={`w-2 h-2 ${getSeverityColor(activity.severity)} rounded-full mt-2 flex-shrink-0`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-900 font-medium">{activity.title}</p>
                    <span className="text-xs text-slate-500">{getTimeAgo(activity.timestamp)}</span>
                  </div>
                  <p className="text-sm text-slate-600">{activity.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
