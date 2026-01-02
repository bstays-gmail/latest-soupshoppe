import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { useHydrated } from "@/lib/store";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import Catering from "@/pages/catering";
import Login from "@/pages/login";
import Register from "@/pages/register";
import PrintMenu from "@/pages/print-menu";

function Router() {
  const hydrated = useHydrated();
  
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/catering" component={Catering} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/print-menu" component={PrintMenu} />
      <ProtectedRoute path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
