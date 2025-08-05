import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import HomesPage from "@/pages/homes";
import HomeDetailPage from "@/pages/home-detail";
import DevicesPage from "@/pages/devices";
import EmergencyPage from "@/pages/emergency";
import GuestPage from "@/pages/guest";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/homes" component={HomesPage} />
      <Route path="/homes/:homeId" component={HomeDetailPage} />
      <Route path="/homes/:homeId/emergency" component={EmergencyPage} />
      <Route path="/homes/:homeId/guest" component={GuestPage} />
      <Route path="/devices" component={DevicesPage} />
      <Route component={NotFound} />
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
