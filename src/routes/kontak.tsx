import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Helmet } from "react-helmet";

// Lazy-load the Contact component
const Contact = lazy(() => import("../pages/Contact"));

export const Route = createFileRoute("/kontak")({
  component: ContactPage,
});

function ContactPage() {
  return (
    <>
      <Helmet>
        <title>Kontak GWM Indonesia | Great Wall Motors</title>
        <meta
          name="description"
          content="Hubungi GWM Indonesia untuk informasi produk, test drive, atau layanan purna jual. Temukan dealer terdekat dan jadwalkan kunjungan Anda."
        />
        <meta
          name="keywords"
          content="kontak GWM, dealer GWM, test drive GWM, layanan purna jual, Great Wall Motors Indonesia"
        />
        <link rel="canonical" href="https://gwm-indonesia.com/kontak" />
        <meta property="og:title" content="Kontak GWM Indonesia" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gwm-indonesia.com/kontak" />
        <meta
          property="og:description"
          content="Hubungi GWM Indonesia untuk informasi produk, test drive, atau layanan purna jual"
        />
      </Helmet>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse text-primary">Loading...</div>
          </div>
        }
      >
        <Contact />
      </Suspense>
    </>
  );
}
