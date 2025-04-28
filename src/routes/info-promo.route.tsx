import { Outlet, createFileRoute } from "@tanstack/react-router";
import { seo } from "../utils/seo";

export const Route = createFileRoute("/info-promo")({
  component: PostsLayoutComponent,
  head: () => ({
    meta: [
      ...seo({
        title: "Info Promo - GWM Indonesia | Great Wall Motors",
        description:
          "Jelajahi berbagai info promo GWM Indonesia - Haval, Tank, dan ORA. Temukan promo mobil SUV premium yang sesuai dengan kebutuhan Anda.",
        keywords:
          "GWM, Great Wall Motors, Tipe Mobil, Haval, Tank, ORA, SUV Premium, Indonesia",
        image: "https://gwm.co.id/images/types-collection.webp",
      }),
    ],
    links: [
      {
        rel: "canonical",
        href: "https://gwmindonesia.com/info-promo",
      },
    ],
  }),
});

function PostsLayoutComponent() {
  return <Outlet />;
}
