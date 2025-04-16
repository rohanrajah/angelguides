import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { initializeFonts } from "./lib/fonts";

// Initialize fonts
initializeFonts();

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Toaster />
  </>
);
