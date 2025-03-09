import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { RouterContext } from "../router-context";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";
import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";

// Define the base URL for our Strapi API
export const STRAPI_API_URL = "http://localhost:1337";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
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
    <div className="relative min-h-screen overflow-y-auto">
      <Helmet>
        <title>GWM Indonesia - Great Wall Motors</title>
        <meta
          name="description"
          content="Great Wall Motors Indonesia - Mobil berkualitas tinggi dengan teknologi terkini"
        />
      </Helmet>

      <Navbar />
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
          <div className="transition-opacity duration-300 opacity-100 content-fade-in">
            <Outlet />
          </div>
        )}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
