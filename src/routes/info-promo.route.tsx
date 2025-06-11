import { Outlet, createFileRoute } from "@tanstack/react-router";
import { seo } from "../utils/seo";
import { getSiteSettings } from "../server/site-settings";

export const Route = createFileRoute("/info-promo")({
  component: PostsLayoutComponent,
  loader: async () => {
    try {
      const siteSettings = await getSiteSettings();
      return { siteSettings };
    } catch (error) {
      console.error("Error loading site settings:", error);
      return { siteSettings: null };
    }
  },
  head: ({ loaderData }) => {
    const { siteSettings } = loaderData;
    const brandName =
      siteSettings?.brandName || "GWM Indonesia | Great Wall Motors";

    return {
      meta: [
        ...seo({
          title: `Info Promo - ${brandName}`,
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
