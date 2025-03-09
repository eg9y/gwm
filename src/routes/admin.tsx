import { createFileRoute, Navigate } from "@tanstack/react-router";
import { STRAPI_API_URL } from "./__root";

export const Route = createFileRoute("/admin")({
  component: AdminRedirect,
});

function AdminRedirect() {
  // Redirect to Strapi admin panel
  const adminUrl = `${STRAPI_API_URL}/admin`;

  // Using window.location for a full page redirect to external URL
  // This is better than using Navigate for external URLs
  window.location.href = adminUrl;

  // Return Navigate as a fallback, though it won't be used for external URLs
  return <Navigate to="/" />;
}
