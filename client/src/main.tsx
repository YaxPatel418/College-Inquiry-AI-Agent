import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "./hooks/use-theme";
import { StrictMode } from "react";

// Create a wrapped app component to avoid any initialization order issues
const AppWithProviders = () => (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);

// Create root and render
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<AppWithProviders />);
} else {
  console.error("Root element not found!");
}
