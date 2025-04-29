import { createServerFn } from "@tanstack/react-start";
import { db } from "../db";
import type { Article, NewArticle } from "../db";
import { articles } from "../db/schema";
import { eq, like, desc, and, or, sql, ne } from "drizzle-orm";
import type { SQL, asc } from "drizzle-orm";
import slugify from "slugify";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";
import type { UploadResult } from "../services/r2Service";

// Create a virtual DOM environment for DOMPurify
const { window } = new JSDOM("");
const DOMPurify = createDOMPurify(window);

// Generate a unique slug from title
function generateSlug(title: string, id?: number): string {
  let slug = slugify(title, {
    lower: true,
    strict: true,
  });

  // If there's an ID (for updates), add it to ensure uniqueness
  if (id) {
    slug = `${slug}-${id}`;
  }

  return slug;
}

// Sanitize HTML content
function sanitizeContent(content: string): string {
  try {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "p",
        "br",
        "hr",
        "ul",
        "ol",
        "li",
        "blockquote",
        "pre",
        "code",
        "em",
        "strong",
        "del",
        "a",
        "img",
        "div",
        "span",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "iframe",
      ],
      ALLOWED_ATTR: [
        "href",
        "src",
        "alt",
        "title",
        "class",
        "target",
        "style",
        "width",
        "height",
        "id",
        "frameborder",
        "allowfullscreen",
        "allow",
      ],
    });
  } catch (error) {
    console.error("Error sanitizing content:", error);
    // Return the original content if sanitization fails
    return content;
  }
}

// Interface for article creation/update
interface ArticleInput {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  published?: boolean;
  customSlug?: string;
  metaDescription?: string;
}

// Create a new article
export const createArticle = createServerFn({ method: "POST" })
  .validator((formData: unknown): ArticleInput => {
    if (!(formData instanceof FormData)) {
      throw new Error("Invalid form data");
    }

    const title = formData.get("title")?.toString();
    const content = formData.get("content")?.toString();
    const excerpt = formData.get("excerpt")?.toString();
    const category = formData.get("category")?.toString();
    const featuredImageUrl = formData.get("featuredImageUrl")?.toString();
    const featuredImageAlt = formData.get("featuredImageAlt")?.toString();
    const published = formData.get("published") === "true";
    const customSlug = formData.get("slug")?.toString() || "";
    const metaDescription = formData.get("metaDescription")?.toString();

    if (!title || !content || !excerpt || !category) {
      throw new Error("Title, content, excerpt, and category are required");
    }

    return {
      title,
      content,
      excerpt,
      category,
      featuredImageUrl,
      featuredImageAlt,
      published,
      customSlug,
      metaDescription,
    };
  })
  .handler(async ({ data }) => {
    try {
      // Generate a slug from the title or use custom slug if provided
      let slug = data.customSlug
        ? data.customSlug.trim()
        : generateSlug(data.title);

      // Ensure slug is not empty
      if (!slug) {
        slug = generateSlug(data.title);
      }

      // Check if slug already exists
      const existingArticle = await db
        .select()
        .from(articles)
        .where(eq(articles.slug, slug))
        .get();

      if (existingArticle) {
        // If slug already exists, add a timestamp to make it unique
        slug = `${slug}-${Date.now()}`;
      }

      // Sanitize content
      const sanitizedContent = sanitizeContent(data.content);

      // Create article object
      const newArticle: NewArticle = {
        title: data.title,
        slug,
        content: sanitizedContent,
        excerpt: data.excerpt,
        category: data.category,
        featuredImageUrl: data.featuredImageUrl,
        featuredImageAlt: data.featuredImageAlt,
        published: data.published ? 1 : 0,
        publishedAt: data.published ? new Date().toISOString() : null,
        metaDescription: data.metaDescription ?? null,
      };

      // Insert the article
      const result = await db.insert(articles).values(newArticle);

      if (result.changes && result.changes > 0) {
        // Fetch the newly created article to return it
        const article = await db
          .select()
          .from(articles)
          .where(eq(articles.slug, slug))
          .get();

        return { success: true, article };
      }

      throw new Error("Failed to create article");
    } catch (error) {
      console.error("Error creating article:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to create article"
      );
    }
  });

// Update an existing article
export const updateArticle = createServerFn({ method: "POST" })
  .validator((formData: unknown): ArticleInput & { id: number } => {
    if (!(formData instanceof FormData)) {
      throw new Error("Invalid form data");
    }

    const id = Number(formData.get("id"));
    const title = formData.get("title")?.toString();
    const content = formData.get("content")?.toString();
    const excerpt = formData.get("excerpt")?.toString();
    const category = formData.get("category")?.toString();
    const featuredImageUrl = formData.get("featuredImageUrl")?.toString();
    const featuredImageAlt = formData.get("featuredImageAlt")?.toString();
    const published = formData.get("published") === "true";
    const customSlug = formData.get("slug")?.toString() || "";
    const metaDescription = formData.get("metaDescription")?.toString();

    if (!id || Number.isNaN(id)) {
      throw new Error("Valid article ID is required");
    }

    if (!title || !content || !excerpt || !category) {
      throw new Error("Title, content, excerpt, and category are required");
    }

    return {
      id,
      title,
      content,
      excerpt,
      category,
      featuredImageUrl,
      featuredImageAlt,
      published,
      customSlug,
      metaDescription,
    };
  })
  .handler(async ({ data }) => {
    try {
      // Get the existing article to check if it exists
      const existingArticle = await db
        .select()
        .from(articles)
        .where(eq(articles.id, data.id))
        .get();

      if (!existingArticle) {
        throw new Error("Article not found");
      }

      // Generate a slug based on provided slug, or current slug if unchanged,
      // or regenerate from title if needed
      let slug = existingArticle.slug;

      // If a custom slug was provided, use it
      if (data.customSlug?.trim()) {
        slug = data.customSlug.trim();
      }
      // If title changed and no custom slug was provided, regenerate slug
      else if (
        data.title !== existingArticle.title &&
        !data.customSlug?.trim()
      ) {
        slug = generateSlug(data.title, data.id);
      }

      // If custom slug is provided but already exists for a different article, make it unique
      if (
        data.customSlug?.trim() &&
        data.customSlug.trim() !== existingArticle.slug
      ) {
        const slugExists = await db
          .select()
          .from(articles)
          .where(and(eq(articles.slug, slug), ne(articles.id, data.id)))
          .get();

        if (slugExists) {
          // If slug already exists for a different article, add the ID to make it unique
          slug = `${slug}-${data.id}`;
        }
      }

      // Sanitize content
      const sanitizedContent = sanitizeContent(data.content);

      // Determine if we need to update publishedAt
      let publishedAt = existingArticle.publishedAt;

      // If article is being published for the first time
      if (data.published && existingArticle.published === 0) {
        publishedAt = new Date().toISOString();
      }

      // If article is being unpublished, set publishedAt to null
      if (!data.published && existingArticle.published === 1) {
        publishedAt = null;
      }

      // Update article
      const result = await db
        .update(articles)
        .set({
          title: data.title,
          slug,
          content: sanitizedContent,
          excerpt: data.excerpt,
          category: data.category,
          featuredImageUrl: data.featuredImageUrl ?? null,
          featuredImageAlt: data.featuredImageAlt ?? null,
          published: data.published ? 1 : 0,
          publishedAt,
          updatedAt: new Date().toISOString(),
          metaDescription: data.metaDescription ?? null,
        })
        .where(eq(articles.id, data.id));

      if (result.changes && result.changes > 0) {
        // Fetch the updated article
        const updatedArticle = await db
          .select()
          .from(articles)
          .where(eq(articles.id, data.id))
          .get();

        return { success: true, article: updatedArticle };
      }

      throw new Error("Failed to update article");
    } catch (error) {
      console.error("Error updating article:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to update article"
      );
    }
  });

// Delete an article
export const deleteArticle = createServerFn()
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid input format");
    }

    let id: number | undefined;

    if ("id" in input && typeof input.id === "number") {
      id = input.id;
    } else if (
      "data" in input &&
      typeof input.data === "object" &&
      input.data &&
      "id" in input.data &&
      typeof input.data.id === "number"
    ) {
      id = input.data.id;
    }

    if (!id || Number.isNaN(id)) {
      throw new Error("Valid article ID is required");
    }

    return { id };
  })
  .handler(async ({ data }) => {
    try {
      const result = await db.delete(articles).where(eq(articles.id, data.id));

      if (result.changes && result.changes > 0) {
        return { success: true, message: "Article deleted successfully" };
      }

      throw new Error("Article not found or could not be deleted");
    } catch (error) {
      console.error("Error deleting article:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to delete article"
      );
    }
  });

// Get all articles with pagination, filtering, and search
export const getAllArticles = createServerFn({
  method: "GET",
})
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid input format");
    }

    const defaultValues = {
      page: 1,
      pageSize: 10,
      category: undefined,
      searchQuery: undefined,
      publishedOnly: false,
    };

    // Extract input values with type checking
    let page = defaultValues.page;
    let pageSize = defaultValues.pageSize;
    let category: string | undefined = defaultValues.category;
    let searchQuery: string | undefined = defaultValues.searchQuery;
    let publishedOnly = defaultValues.publishedOnly;

    // First check if data property exists
    if (input) {
      if ("page" in input && typeof input.page === "number") {
        page = input.page;
      }

      if ("pageSize" in input && typeof input.pageSize === "number") {
        pageSize = input.pageSize;
      }

      if ("category" in input && typeof input.category === "string") {
        category = input.category === "All" ? undefined : input.category;
      }

      if ("searchQuery" in input && typeof input.searchQuery === "string") {
        searchQuery = input.searchQuery.trim() || undefined;
      }

      if ("publishedOnly" in input) {
        publishedOnly = Boolean(input.publishedOnly);
      }
    }

    return { page, pageSize, category, searchQuery, publishedOnly };
  })
  .handler(async ({ data }) => {
    try {
      // Build query filters
      const conditions = [];

      if (data.publishedOnly) {
        conditions.push(eq(articles.published, 1));
      }

      if (data.category) {
        conditions.push(eq(articles.category, data.category));
      }

      if (data.searchQuery) {
        const searchPattern = `%${data.searchQuery}%`;
        conditions.push(like(articles.title, searchPattern));
      }

      // Calculate pagination
      const offset = (data.page - 1) * data.pageSize;

      // Create the base query with all conditions
      const baseQuery = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count using Drizzle's count function
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(articles)
        .where(baseQuery)
        .get();

      const totalCount = countResult?.count || 0;
      const totalPages = Math.ceil(totalCount / data.pageSize);

      // Get paginated results using Drizzle's ORM query builder
      const articlesList = await db
        .select()
        .from(articles)
        .where(baseQuery)
        .orderBy(desc(articles.createdAt))
        .limit(data.pageSize)
        .offset(offset);

      console.log("results", articlesList);

      return {
        data: articlesList,
        pagination: {
          page: data.page,
          pageSize: data.pageSize,
          pageCount: totalPages,
          total: totalCount,
        },
      };
    } catch (error) {
      console.error("Error retrieving articles:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to retrieve articles"
      );
    }
  });

// Get a single article by slug
export const getArticleBySlug = createServerFn()
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid input format");
    }

    let slug: string | undefined;

    if ("slug" in input && typeof input.slug === "string") {
      slug = input.slug;
    } else if (
      "data" in input &&
      typeof input.data === "object" &&
      input.data &&
      "slug" in input.data &&
      typeof input.data.slug === "string"
    ) {
      slug = input.data.slug;
    }

    if (!slug) {
      throw new Error("Article slug is required");
    }

    return { slug };
  })
  .handler(async ({ data }) => {
    try {
      const article = await db
        .select()
        .from(articles)
        .where(eq(articles.slug, data.slug))
        .get();

      if (!article) {
        throw new Error("Article not found");
      }

      return article;
    } catch (error) {
      console.error("Error retrieving article:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to retrieve article"
      );
    }
  });

// Get an article by ID
export const getArticleById = createServerFn()
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid input format");
    }

    let id: number | undefined;

    if ("id" in input && typeof input.id === "number") {
      id = input.id;
    } else if (
      "data" in input &&
      typeof input.data === "object" &&
      input.data &&
      "id" in input.data &&
      typeof input.data.id === "number"
    ) {
      id = input.data.id;
    }

    if (!id || Number.isNaN(id)) {
      throw new Error("Valid article ID is required");
    }

    return { id };
  })
  .handler(async ({ data }) => {
    try {
      const article = await db
        .select()
        .from(articles)
        .where(eq(articles.id, data.id))
        .get();

      if (!article) {
        throw new Error("Article not found");
      }

      return article;
    } catch (error) {
      console.error("Error retrieving article:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to retrieve article"
      );
    }
  });
