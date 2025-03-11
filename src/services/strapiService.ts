import { STRAPI_API_URL } from "../routes/__root";
import type {
  StrapiResponse,
  ArticleAttributes,
  StrapiMeta,
} from "../types/strapi";

/**
 * Fetch a list of articles from Strapi
 */
export async function fetchArticles(
  page = 1,
  pageSize = 9,
  category?: string,
  searchQuery?: string
): Promise<{ data: ArticleAttributes[] } & StrapiMeta> {
  // Build query parameters
  const queryParams = new URLSearchParams({
    "pagination[page]": page.toString(),
    "pagination[pageSize]": pageSize.toString(),
    populate: "featuredImage",
    sort: "publishedAt:desc",
  });

  // Add category filter if provided
  if (category && category !== "All") {
    queryParams.append("filters[category][$eq]", category);
  }

  // Add search filter if provided
  if (searchQuery) {
    queryParams.append("filters[$or][0][title][$containsi]", searchQuery);
    queryParams.append("filters[$or][1][content][$containsi]", searchQuery);
  }

  // Make the API request
  const response = await fetch(
    `${STRAPI_API_URL}/api/articles?${queryParams.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Error fetching articles: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a single article by slug
 */
export async function fetchArticleBySlug(
  slug: string
): Promise<{ data: ArticleAttributes; meta: StrapiMeta }> {
  const queryParams = new URLSearchParams({
    "filters[slug][$eq]": slug,
    populate: "featuredImage",
  });

  const response = await fetch(
    `${STRAPI_API_URL}/api/articles?${queryParams.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Error fetching article: ${response.statusText}`);
  }

  const data: StrapiResponse<ArticleAttributes> = await response.json();

  // Check if article exists
  if (!data.data || data.data.length === 0) {
    throw new Error(`Article with slug "${slug}" not found`);
  }

  // Return with proper type structure
  return {
    data: data.data[0].attributes,
    meta: data.meta,
  };
}

/**
 * Fetch promos from Strapi
 */
export async function fetchPromos(
  page = 1,
  pageSize = 4
): Promise<{ data: any[]; meta: StrapiMeta }> {
  // Build query parameters
  const queryParams = new URLSearchParams({
    "pagination[page]": page.toString(),
    "pagination[pageSize]": pageSize.toString(),
    populate: "promo_image",
    sort: "publishedAt:desc",
  });

  // Make the API request
  const response = await fetch(
    `${STRAPI_API_URL}/api/promos?${queryParams.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Error fetching promos: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get the full URL for a Strapi image
 */
export function getStrapiImageUrl(imageUrl: string): string {
  if (!imageUrl) return "";

  // Check if the URL is already absolute
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  return `${STRAPI_API_URL}${imageUrl}`;
}
