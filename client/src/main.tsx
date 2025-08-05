import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress unhandled promise rejections in development
window.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);
