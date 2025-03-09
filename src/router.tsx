import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import App from "./App";
import { lazy } from "react";

// Lazy-load the Contact page for better performance
const Contact = lazy(() => import("./pages/Contact"));

// Root route - Layout component
export const rootRoute = createRootRoute({
  component: () => <App />,
});

// Home route (index)
export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => null, // Handled by the App component
});

// Contact route
export const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/kontak",
  component: () => <Contact />,
});

// Register routes
const routeTree = rootRoute.addChildren([indexRoute, contactRoute]);

// Create router
export const router = createRouter({
  routeTree,
  defaultPreload: "intent", // Preload routes when user hovers over links
});

// RouterProvider component
export const Router = () => {
  return <RouterProvider router={router} />;
};

// Export as default
export default Router;
