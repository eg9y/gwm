import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  beforeLoad: () => {
    // Redirect to the contact page
    throw redirect({
      to: "/admin/kontak",
    });
  },
});
