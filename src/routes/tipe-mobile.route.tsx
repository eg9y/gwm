import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { fetchPosts } from "../utils/posts";
import { seo } from "../utils/seo";
import { getSiteSettings } from "../server/site-settings";

export const Route = createFileRoute("/tipe-mobile")({
  loader: async () => {
    try {
      const [posts, siteSettings] = await Promise.all([
        fetchPosts(),
        getSiteSettings(),
      ]);
      return { posts, siteSettings };
    } catch (error) {
      console.error("Error loading data:", error);
      const posts = await fetchPosts(); // Fallback to just posts
      return { posts, siteSettings: null };
    }
  },
  component: PostsLayoutComponent,
  head: ({ loaderData }) => {
    const { siteSettings } = loaderData;
    const brandName = siteSettings?.brandName || "GWM Indonesia";

    return {
      meta: [
        ...seo({
          title: `Tipe Mobil - ${brandName} | Great Wall Motors`,
          description:
            "Jelajahi berbagai tipe mobil GWM Indonesia - Haval, Tank, dan ORA. Temukan mobil SUV premium yang sesuai dengan kebutuhan Anda.",
          keywords:
            "GWM, Great Wall Motors, Tipe Mobil, Haval, Tank, ORA, SUV Premium, Indonesia",
          image: "https://gwm.co.id/images/types-collection.webp",
        }),
      ],
      links: [
        {
          rel: "canonical",
          href: `${process.env.SITE_URL}/tipe-mobile`,
        },
      ],
    };
  },
});

function PostsLayoutComponent() {
  const { posts } = Route.useLoaderData();

  return (
    <div className="p-2 flex gap-2">
      <ul className="list-disc pl-4">
        {[...posts, { id: "i-do-not-exist", title: "Non-existent Post" }].map(
          (post) => {
            return (
              <li key={post.id} className="whitespace-nowrap">
                <Link
                  to="/tipe-mobil/$model"
                  params={{
                    model: post.id,
                  }}
                  className="block py-1 text-blue-800 hover:text-blue-600"
                  activeProps={{ className: "text-black font-bold" }}
                >
                  <div>{post.title.substring(0, 20)}</div>
                </Link>
              </li>
            );
          }
        )}
      </ul>
      <hr />
      <Outlet />
    </div>
  );
}
