import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import AppErrorBoundary from "./components/AppErrorBoundary";
import "./index.css";

// Register Service Worker in production, or unregister old ones in development
if (
  "serviceWorker" in navigator &&
  (import.meta as any).env?.PROD
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log(
          "[PWA] Service Worker registered:",
          registration.scope,
        );
      })
      .catch((error) => {
        console.error(
          "[PWA] Service Worker registration failed:",
          error,
        );
      });
  });
}

if (
  "serviceWorker" in navigator &&
  (import.meta as any).env?.DEV
) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('The root element with id="root" was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
