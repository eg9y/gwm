import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

// Lazy-load the Contact component
const Contact = lazy(() => import("../pages/Contact"));

export const Route = createFileRoute("/kontak")({
  component: ContactPage,
  head: () => ({
    title: "Kontak GWM Indonesia - Hubungi Kami",
    meta: [
      {
        name: "description",
        content:
          "Hubungi GWM Indonesia untuk informasi produk, test drive, atau layanan purna jual. Temukan dealer terdekat dan jadwalkan kunjungan Anda.",
      },
      {
        name: "keywords",
        content:
          "kontak GWM, dealer GWM, test drive GWM, layanan purna jual, Great Wall Motors Indonesia",
      },
      {
        property: "og:title",
        content: "Kontak GWM Indonesia - Hubungi Kami",
      },
      {
        property: "og:description",
        content:
          "Hubungi GWM Indonesia untuk informasi produk, test drive, atau layanan purna jual. Temukan dealer terdekat dan jadwalkan kunjungan Anda.",
      },
      {
        property: "og:image",
        content: "https://gwm.kopimap.com/kontak_banner.jpg",
      },
      {
        property: "og:url",
        content: "https://gwm.co.id/kontak",
      },
      {
        property: "og:type",
        content: "website",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://gwm.co.id/kontak",
      },
    ],
  }),
});

function ContactPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-primary">Loading...</div>
        </div>
      }
    >
      <Contact />
    </Suspense>
  );
}
