import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

// Register router for typesafety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
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
    </StrictMode>
  );
} else {
  console.error("Root element not found");
}
