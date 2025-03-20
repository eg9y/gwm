import { hydrateRoot } from "react-dom/client";
import { StrictMode, Suspense, useEffect } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import "./index.css";

// Component to handle cleanup of initial loader
const AppWithLoaderCleanup = () => {
  useEffect(() => {
    // Remove loader and loading class once the app has hydrated
    document.documentElement.classList.remove("loading");
    const loader = document.getElementById("initial-loader");
    if (loader) {
      loader.style.opacity = "0";
      loader.style.transition = "opacity 0.3s ease";
      setTimeout(() => {
        loader?.parentNode?.removeChild(loader);
      }, 300);
    }
  }, []);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-white animate-fade-in">
          <div className="text-primary">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-lg font-medium">Loading GWM Indonesia...</p>
            </div>
          </div>
        </div>
      }
    >
      <RouterProvider router={router} />
    </Suspense>
  );
};

// Hydrate the app
hydrateRoot(
  document,
  <StrictMode>
    <AppWithLoaderCleanup />
  </StrictMode>
);
