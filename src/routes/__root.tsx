import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import * as React from "react";
import { ClerkProvider } from "@clerk/tanstack-start";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import appCss from "~/styles/app.css?url";
import { seo } from "~/utils/seo";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import WhatsAppButton from "~/components/WhatsAppButton";

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
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="id">
        <head>
          <HeadContent />
        </head>
        <body>
          <div
            className="relative min-h-screen overflow-y-auto"
            data-react-root="true"
          >
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
              <WhatsAppButton />
            </div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
