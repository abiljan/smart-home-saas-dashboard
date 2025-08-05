import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Simple test component to ensure app loads
function TestDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Smart Home SaaS Dashboard
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-100 p-4 rounded">
              <h3 className="font-medium text-green-800">API Status</h3>
              <p className="text-green-600">Operational</p>
            </div>
            <div className="bg-blue-100 p-4 rounded">
              <h3 className="font-medium text-blue-800">Database</h3>
              <p className="text-blue-600">Connected</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded">
              <h3 className="font-medium text-yellow-800">WebSocket</h3>
              <p className="text-yellow-600">Active</p>
            </div>
            <div className="bg-purple-100 p-4 rounded">
              <h3 className="font-medium text-purple-800">Services</h3>
              <p className="text-purple-600">Running</p>
            </div>
          </div>
          <div className="mt-6">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              View Full Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={TestDashboard} />
      <Route path="/test" component={TestDashboard} />
      <Route>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
            <p className="text-gray-600">The requested page could not be found.</p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
