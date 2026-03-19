import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import ThemeToggleFloating from "@/components/ThemeToggleFloating";
import SurahListPage from "./pages/SurahListPage";
import SurahReadingPage from "./pages/SurahReadingPage";
import SavedPage from "./pages/SavedPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeToggleFloating />
        <Routes>
          <Route path="/" element={<SurahListPage />} />
          <Route path="/surah/:number" element={<SurahReadingPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
