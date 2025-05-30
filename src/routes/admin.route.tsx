import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-start";
import { Link, useNavigate, useMatches } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Users,
  FileText,
  Phone,
  Car,
  Home,
  Info,
  Settings,
} from "lucide-react";
import { ClerkProvider } from "@clerk/tanstack-start";
import { Toaster } from "react-hot-toast";

// Define the wrapper component
function AdminRouteWrapper() {
  return (
    <ClerkProvider>
      <AdminLayout />
    </ClerkProvider>
  );
}

export const Route = createFileRoute("/admin")({
  component: AdminRouteWrapper,
});

function AdminLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();
  const matches = useMatches();

  // Current path for active state
  const currentPath = matches[matches.length - 1]?.pathname || "";

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate({ to: "/sign-in" });
    }
  }, [isLoaded, isSignedIn, navigate]);

  // If auth is still loading or not signed in, show minimal loading UI
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Toast container */}
      <Toaster position="top-right" />

      {/* Admin Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-primary">
                  Admin Dashboard
                </h1>
              </div>
              <div className="ml-6 flex space-x-4">
                <Link
                  to="/admin/homepage"
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    currentPath.includes("/admin/homepage")
                      ? "text-white bg-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Home className="h-5 w-5 mr-2" />
                  Home
                </Link>
                <Link
                  to="/admin/kontak"
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    currentPath.includes("/admin/kontak")
                      ? "text-white bg-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Users className="h-5 w-5 mr-2" />
                  Contact Forms
                </Link>

                <Link
                  to="/admin/articles"
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    currentPath.includes("/admin/articles")
                      ? "text-white bg-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Articles
                </Link>

                <Link
                  to="/admin/models"
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    currentPath.includes("/admin/models")
                      ? "text-white bg-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Car className="h-5 w-5 mr-2" />
                  Car Models
                </Link>

                <Link
                  to="/admin/about-us"
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    currentPath.includes("/admin/about-us")
                      ? "text-white bg-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Info className="h-5 w-5 mr-2" />
                  About Us
                </Link>

                <Link
                  to="/admin/contact-info"
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    currentPath.includes("/admin/contact-info")
                      ? "text-white bg-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Contact Info
                </Link>
                <Link
                  to="/admin/site-settings"
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    currentPath.includes("/admin/site-settings")
                      ? "text-white bg-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Settings className="h-5 w-5 mr-2" />
                  Site Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Outlet for child routes */}
      <Outlet />
    </div>
  );
}
