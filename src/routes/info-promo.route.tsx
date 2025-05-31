import { Outlet, createFileRoute } from "@tanstack/react-router";
import { seo } from "../utils/seo";

export const Route = createFileRoute("/info-promo")({
  component: PostsLayoutComponent,
  head: () => {
    const brandName = process.env.BRAND_NAME || "GWM Indonesia";
    return {
      meta: [
        ...seo({
          title: `Info Promo - ${brandName} | Great Wall Motors`,
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
          href: `${process.env.SITE_URL}/info-promo`,
        },
      ],
    };
  },
});

function PostsLayoutComponent() {
  return <Outlet />;
}
