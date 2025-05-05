import { createAPIFileRoute } from "@tanstack/react-start/api";
import { eq } from "drizzle-orm";
import { articles, carModels } from "~/db/schema";
import { db } from "~/db";

const BASE_URL = "https://gwmindonesia.com"; // Or fetch from environment variable

// Define static paths (adjust as needed)
const staticPaths: string[] = [
  "/",
  "/info-promo",
  "/kontak",
  "/about-us",
  "/tipe-mobil",
];

export const APIRoute = createAPIFileRoute("/api/sitemap")({
  GET: async () => {
    let paths: string[] = staticPaths;
    try {
      // Fetch dynamic article slugs
      const publishedArticles = await db
        .select({
          slug: articles.slug,
        })
        .from(articles)
        .where(eq(articles.published, 1));

      const articleSlugs = publishedArticles.map((article) => article.slug);
      console.log("articleSlugs", articleSlugs);
      const articlePaths = articleSlugs.map(
        (slug: string) => `/info-promo/${slug}`
      );

      console.log("articlePaths", articlePaths);

      // Fetch dynamic car model slugs (IDs) directly from the database
      const publishedCarModels = await db
        .select({
          id: carModels.id,
        })
        .from(carModels)
        .where(eq(carModels.published, 1));

      const carModelPaths = publishedCarModels.map(
        (model) => `/tipe-mobil/${model.id}`
      );

      // Combine static, article, and car model paths
      paths = [...staticPaths, ...articlePaths, ...carModelPaths];
    } catch (error) {
      console.error("Error fetching dynamic paths for sitemap:", error);
      // Continue with only static paths if fetching dynamic ones fails
    }

    // Generate sitemap content
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((path) => `  <url><loc>${BASE_URL}${path}</loc></url>`).join("\\n")}
</urlset>`;

    // Return the XML response directly
    return new Response(sitemapContent, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  },
});
