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
import { getContactInfo } from "../server/contact-info";
import { getSiteSettings } from "../server/site-settings";

// Define a default WhatsApp URL as a fallback
const defaultWhatsAppUrl =
  "https://wa.me/6287884818135?text=Halo,%20saya%20ingin%20mengetahui%20informasi%20lebih%20lanjut%20mengenai%20product%20GWM.%0ANama%20:%0ADomisili%20:%0AType%20:";

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
  loader: async () => {
    try {
      // Fetch both contact info and site settings concurrently
      const [contactInfo, siteSettings] = await Promise.all([
        getContactInfo(),
        getSiteSettings(), // Fetch site settings
      ]);

      // Ensure logo URLs are included, provide defaults if necessary
      const logoUrl =
        contactInfo?.logoUrl || "https://gwm.kopimap.com/gwm_logo.webp"; // Default logo
      const logoWhiteUrl = contactInfo?.logoWhiteUrl || logoUrl; // Default to main logo if white is missing
      const whatsappUrl = contactInfo?.whatsappUrl || defaultWhatsAppUrl;

      return {
        contactInfo, // Pass the full object if needed elsewhere
        logoUrl,
        logoWhiteUrl,
        whatsappUrl,
        siteSettings, // Pass site settings
      };
    } catch (error) {
      console.error("Error fetching data in root loader:", error);
      // Return defaults even on error for both
      return {
        contactInfo: null,
        logoUrl: "https://gwm.kopimap.com/gwm_logo.webp",
        logoWhiteUrl: "https://gwm.kopimap.com/gwm_initial_logo.webp",
        whatsappUrl: defaultWhatsAppUrl,
        siteSettings: null, // Default site settings to null on error
      };
    }
  },
  head: ({ loaderData }) => {
    // Access siteSettings from loaderData
    const { siteSettings } = loaderData;
    const gaId = siteSettings?.googleAnalyticsId;
    const gtmId = siteSettings?.googleTagManagerId; // Extract GTM ID

    // Construct the Google Analytics script source URL dynamically
    const gaSrc = gaId
      ? `https://www.googletagmanager.com/gtag/js?id=${gaId}`
      : null;

    return {
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
          title:
            "GWM Indonesia - Great Wall Motors | Mobil SUV Premium Terbaik",
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
        // Only include the external script tag in head.scripts
        ...(import.meta.env.PROD && gaId
          ? [
              {
                async: true,
                // Use gaSrc || undefined to ensure src is undefined when gaId is null
                src: gaSrc || undefined,
              },
            ]
          : []),
        // Add Google Tag Manager script
        ...(import.meta.env.PROD && gtmId
          ? [
              {
                // GTM head script (inline)
                children: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
              },
            ]
          : []),
      ],
    };
  },
  scripts: ({ loaderData }) => {
    const { siteSettings } = loaderData;
    const gaId = siteSettings?.googleAnalyticsId;

    // Construct the Google Analytics config script content dynamically
    const gaConfigScript = gaId
      ? `
          // Check for admin path within the script itself
          if (window.location.pathname && !window.location.pathname.startsWith('/admin')) {
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          }
        `
      : "";

    // Return the inline script object if in PROD and gaId exists
    return import.meta.env.PROD && gaId
      ? [
          {
            children: gaConfigScript,
          },
        ]
      : [];
  },
  errorComponent: (props) => {
    // Define default logo URLs for the error boundary case
    const defaultLogoUrl = "https://gwm.kopimap.com/gwm_logo.webp";
    const defaultLogoWhiteUrl = defaultLogoUrl; // Use main logo as fallback

    // In error scenarios, siteSettings might not be available or reliable.
    // Pass null and let RootDocument handle it gracefully.
    return (
      <RootDocument
        logoUrl={defaultLogoUrl}
        logoWhiteUrl={defaultLogoWhiteUrl}
        whatsappUrl={defaultWhatsAppUrl}
        siteSettings={null} // Pass null for siteSettings in error case
      >
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function RootComponent() {
  const { contactInfo, logoUrl, logoWhiteUrl, whatsappUrl, siteSettings } =
    Route.useLoaderData();

  // Use whatsappUrl directly from loader data
  // const finalWhatsappUrl = contactInfo?.whatsappUrl || defaultWhatsAppUrl;

  return (
    <RootDocument
      logoUrl={logoUrl}
      logoWhiteUrl={logoWhiteUrl}
      whatsappUrl={whatsappUrl} // Pass whatsappUrl from loader
      siteSettings={siteSettings} // Pass siteSettings down
    >
      <ScrollToTop />
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({
  children,
  logoUrl,
  logoWhiteUrl,
  whatsappUrl,
  siteSettings, // Add siteSettings prop
}: {
  children: React.ReactNode;
  logoUrl: string;
  logoWhiteUrl: string;
  whatsappUrl: string;
  siteSettings?: { googleTagManagerId?: string | null } | null; // Define type for siteSettings
}) {
  // Get the router state to detect when routes are loading
  const { isLoading, location } = useRouterState();
  const isAdminPage = location.pathname.startsWith("/admin");
  const isVehicleDetailPage =
    location.pathname.startsWith("/tipe-mobil/") &&
    location.pathname.split("/").length > 2;

  const gtmId = siteSettings?.googleTagManagerId;

  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body className={isVehicleDetailPage ? "vehicle-detail-page" : ""}>
        {/* Google Tag Manager (noscript) */}
        {import.meta.env.PROD && gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager noscript fallback"
            />
          </noscript>
        )}
        <div
          className="relative min-h-screen overflow-y-auto"
          data-react-root="true"
        >
          {/* Show loading spinner when routes are transitioning */}
          {isLoading && <LoadingSpinner />}
          {/* Keep navbar fixed at the top and outside of any transition effects */}
          <div className="fixed top-0 left-0 right-0 z-50 bg-transparent">
            <Navbar
              logoUrl={logoUrl}
              logoWhiteUrl={logoWhiteUrl}
              whatsappUrl={whatsappUrl}
            />{" "}
            {/* Pass logo URLs */}
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
            <Footer logoUrl={logoUrl} /> {/* Pass logoUrl to Footer */}
            {!isAdminPage && <WhatsAppButton whatsappUrl={whatsappUrl} />}
          </div>
        </div>
      </body>
    </html>
  );
}
