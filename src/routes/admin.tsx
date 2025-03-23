import { createFileRoute } from "@tanstack/react-router";
import { Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className=" min-h-screen bg-white">
      <header className="pt-16 bg-primary shadow-md fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">
              GWM Admin Dashboard
            </h1>
          </div>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link
                  to="/admin/kontak"
                  className="text-white hover:text-gray-200 transition-colors"
                  activeProps={{ className: "text-white font-bold" }}
                >
                  Kontak
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  Kembali ke Situs
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="pt-40">
        <Outlet />
      </main>
    </div>
  );
}
