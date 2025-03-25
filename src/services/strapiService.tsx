import { STRAPI_API_URL } from "../constants";
import type {
  ArticleAttributes,
  StrapiMeta,
  PromoAttributes,
} from "../types/strapi";
import { getAllArticles, getArticleBySlug } from "../server/articles";

/**
 * Fetch a list of articles from local database (formerly Strapi)
 */
export async function fetchArticles(
  page = 1,
  pageSize = 9,
  category?: string,
  searchQuery?: string
): Promise<{ data: ArticleAttributes[] } & StrapiMeta> {
  try {
    // Fetch articles from local database
    const response = await getAllArticles({
      data: {
        page,
        pageSize,
        category,
        searchQuery,
        publishedOnly: true,
      },
    });

    // Map response to match the Strapi API format
    return {
      data: response.data.map((article) => ({
        id: article.id,
        documentId: article.id.toString(),
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        slug: article.slug,
        publishedAt: article.publishedAt,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        category: article.category,
        featuredImage: article.featuredImageUrl
          ? {
              url: article.featuredImageUrl,
              alternativeText: article.featuredImageAlt || "",
            }
          : undefined,
        youtube_url: article.youtubeUrl,
      })),
      pagination: response.pagination,
    };
  } catch (error) {
    console.error("Error fetching articles:", error);
    throw new Error(`Error fetching articles: ${error}`);
  }
}

/**
 * Fetch a single article by slug from local database (formerly Strapi)
 */
export async function fetchArticleBySlug(
  slug: string
): Promise<ArticleAttributes> {
  try {
    // Fetch article from local database
    const article = await getArticleBySlug({ data: { slug } });

    if (!article) {
      throw new Error("Article not found");
    }

    // Map response to match the Strapi API format
    return {
      id: article.id,
      documentId: article.id.toString(),
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      slug: article.slug,
      publishedAt: article.publishedAt,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      category: article.category,
      featuredImage: article.featuredImageUrl
        ? {
            url: article.featuredImageUrl,
            alternativeText: article.featuredImageAlt || "",
          }
        : undefined,
      youtube_url: article.youtubeUrl,
    };
  } catch (error) {
    console.error("Error fetching article by slug:", error);
    throw error;
  }
}

/**
 * Fetch promos from local database (formerly Strapi)
 */
export async function fetchPromos(
  page = 1,
  pageSize = 4
): Promise<{ data: PromoAttributes[]; meta: StrapiMeta }> {
  // Filter articles to only show promos
  try {
    const response = await getAllArticles({
      data: {
        page,
        pageSize,
        category: "Promo",
        publishedOnly: true,
      },
    });

    // Map response to match the Strapi API format
    return {
      data: response.data.map((promo) => ({
        id: promo.id,
        title: promo.title,
        description: promo.excerpt,
        publishedAt: promo.publishedAt,
        promo_image: promo.featuredImageUrl
          ? {
              url: promo.featuredImageUrl,
              alternativeText: promo.featuredImageAlt || "",
            }
          : undefined,
      })),
      meta: {
        pagination: response.pagination,
      },
    };
  } catch (error) {
    console.error("Error fetching promos:", error);
    throw new Error(`Error fetching promos: ${error}`);
  }
}

/**
 * Get the full URL for an image
 */
export function getStrapiImageUrl(imageUrl: string): string {
  if (!imageUrl) return "";

  // Check if the URL is already absolute
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // Legacy Strapi images - maintain compatibility
  return `${STRAPI_API_URL}${imageUrl}`;
}
