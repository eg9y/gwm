import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type * as React from "react";
import { useEffect, useRef } from "react";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import appCss from "~/styles/app.css?url";
import { seo } from "~/utils/seo";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import WhatsAppButton from "~/components/WhatsAppButton";
import { LoadingSpinner } from "~/components/LoadingSpinner";

// Create scroll restoration component
function ScrollToTop() {
  const { location } = useRouterState();
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    // Only scroll to top if the path has changed
    if (prevPathRef.current !== location.pathname) {
      window.scrollTo(0, 0);
      prevPathRef.current = location.pathname;
    }
  });

  return null;
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      // Base SEO that will be used if child routes don't override
      ...seo({
        title: "GWM Indonesia - Great Wall Motors | Mobil SUV Premium Terbaik",
        description:
          "Great Wall Motors Indonesia - Mobil SUV premium berkualitas tinggi dengan teknologi terkini. Haval, Tank, dan ORA tersedia di Indonesia.",
        keywords:
          "GWM, Great Wall Motors, Haval H6, Haval Jolion, Tank 300, Tank 500, SUV Premium, Mobil Hybrid, Indonesia",
      }),
    ],
    links: [
      // Reverted async loading due to type/compatibility issues.
      // Using standard blocking stylesheet link.
      { rel: "stylesheet", href: appCss },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "https://gwm.kopimap.com/favicon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "https://gwm.kopimap.com/favicon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "https://gwm.kopimap.com/favicon.png",
      },
      { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
      { rel: "icon", href: "https://gwm.kopimap.com/favicon.png" },
    ],
    scripts: [
      ...(import.meta.env.PROD
        ? [
            {
              async: true,
              src: "https://www.googletagmanager.com/gtag/js?id=G-RYBLP114YY",
            },
            {
              children: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-RYBLP114YY');
        `,
            },
          ]
        : []),
    ],
  }),
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <ScrollToTop />
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  // Get the router state to detect when routes are loading
  const { isLoading, location } = useRouterState();
  const isAdminPage = location.pathname.startsWith("/admin");
  const isVehicleDetailPage =
    location.pathname.startsWith("/tipe-mobil/") &&
    location.pathname.split("/").length > 2;

  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body className={isVehicleDetailPage ? "vehicle-detail-page" : ""}>
        <div
          className="relative min-h-screen overflow-y-auto"
          data-react-root="true"
        >
          {/* Show loading spinner when routes are transitioning */}
          {isLoading && <LoadingSpinner />}
          {/* Keep navbar fixed at the top and outside of any transition effects */}
          <div className="fixed top-0 left-0 right-0 z-50 bg-transparent">
            <Navbar />
          </div>
          {/* Add padding to account for fixed navbar */}
          <div className="">
            <main>
              <div className="transition-opacity duration-300 opacity-100">
                {children}
                <TanStackRouterDevtools position="bottom-right" />
                <Scripts />
              </div>
            </main>

            <Footer />
            {!isAdminPage && <WhatsAppButton />}
          </div>
        </div>
      </body>
    </html>
  );
}
