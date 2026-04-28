import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Policy from "./pages/Policy.tsx";
import AlgoDashboard from "./pages/algoscout/Dashboard.tsx";
import AlgoJobDetail from "./pages/algoscout/JobDetail.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AlgoDashboard />} />
          <Route path="/unmapped" element={<Index />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/algoscout" element={<AlgoDashboard />} />
          <Route path="/algoscout/job/:id" element={<AlgoJobDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
