import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

// Lazy-load the Contact component
const Contact = lazy(() => import("../pages/Contact"));

export const Route = createFileRoute("/kontak")({
  component: ContactPage,
  head: () => ({
    meta: [
      {
        title: "Kontak GWM Indonesia",
      },
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
    ],
    links: [
      {
        rel: "canonical",
        href: "https://gwm-indonesia.com/kontak",
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
