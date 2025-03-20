import {
  createRootRouteWithContext,
  Outlet,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";
import { useEffect, useRef, useState } from "react";

// Use Record instead of empty interface to avoid linter error
export type RootRouteContext = Record<string, never>;

// Define the base URL for our Strapi API from environment variables
export const STRAPI_API_URL =
  import.meta.env.VITE_STRAPI_API_URL || "http://localhost:1337";

export const Route = createRootRouteWithContext<RootRouteContext>()({
  component: () => (
    <html lang="id">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <HeadContent />
      </head>
      <body>
        <RootComponent />
        <Scripts />
      </body>
    </html>
  ),
  // Default head metadata for the entire site
  head: () => ({
    meta: [
      {
        title: "GWM Indonesia - Great Wall Motors",
      },
      {
        name: "description",
        content:
          "Great Wall Motors Indonesia - Mobil berkualitas tinggi dengan teknologi terkini",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://gwm-indonesia.com",
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
    ],
  }),
});

function RootComponent() {
  const prevPathname = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Start with main content already loaded but invisible
    // This prevents jarring appearance after navbar/footer are visible
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100); // Reduced time for faster transition

    return () => clearTimeout(timer);
  }, []);

  // Reset scroll position on route change
  useEffect(() => {
    const handleRouteChange = () => {
      const pathname = window.location.pathname;
      if (prevPathname.current !== pathname) {
        window.scrollTo(0, 0);
        prevPathname.current = pathname;
      }
    };

    handleRouteChange();
    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  return (
    <div
      className="relative min-h-screen overflow-y-auto"
      data-react-root="true"
    >
      {/* Keep navbar fixed at the top and outside of any transition effects */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <Navbar />
      </div>

      {/* Add padding to account for fixed navbar */}
      <div className="pt-[70px]">
        <main>
          {isLoading ? (
            <div className="w-full animate-pulse">
              {/* Skeleton loader that roughly matches page content layout */}
              <div className="h-screen bg-gray-100 flex flex-col">
                <div className="bg-gray-200 h-1/3 w-full" />
                <div className="px-4 py-8 max-w-7xl mx-auto w-full">
                  <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-6" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="h-64 bg-gray-200 rounded" />
                    <div className="space-y-3">
                      <div className="h-6 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="transition-opacity duration-300 opacity-100">
              <Outlet />
            </div>
          )}
        </main>

        <Footer />
        <WhatsAppButton />
      </div>
    </div>
  );
}
