import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import ProfileSetup from "./pages/ProfileSetup";
import GamePlay from "./pages/GamePlay";
import BadgeGallery from "./pages/BadgeGallery";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/user/gamified/Electronics-Engineer">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/setup" element={<ProfileSetup />} />
          <Route path="/home" element={<Home />} />
          <Route path="/play/:levelId" element={<GamePlay />} />
          <Route path="/badges" element={<BadgeGallery />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
