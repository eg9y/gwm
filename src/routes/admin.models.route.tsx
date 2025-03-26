import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/models")({
  component: AdminModelsLayout,
});

function AdminModelsLayout() {
  return <Outlet />;
}
