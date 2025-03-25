import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { getArticleBySlug } from "../server/articles";
import type { Article } from "../db";

// Add CSS for resizable images
const articleStyles = `
  .resize-image {
    display: block;
    max-width: 100%;
    height: auto;
  }
  
  .resize-image.align-left {
    float: left;
    margin-right: 1.5rem;
    margin-bottom: 1rem;
    margin-top: 0.5rem;
  }
  
  .resize-image.align-right {
    float: right;
    margin-left: 1.5rem;
    margin-bottom: 1rem;
    margin-top: 0.5rem;
  }
  
  .resize-image.align-center {
    margin-left: auto;
    margin-right: auto;
    float: none;
  }
  
  /* Clear floats after images to prevent text from being cut off */
  .article-content:after {
    content: "";
    display: table;
    clear: both;
  }
`;

export const Route = createFileRoute("/info-promo/$slug")({
  // Add a loader to fetch article data on the server
  loader: async ({ params }) => {
    try {
      const article = await getArticleBySlug({ data: { slug: params.slug } });
      return { article };
    } catch (error) {
      console.error("Error loading article:", error);
      return { article: null, error: "Failed to load article" };
    }
  },

  // Use the loaded data for head metadata
  head: ({ loaderData }) => {
    const { article } = loaderData;

    if (!article) {
      return {
        meta: [
          {
            title: "Article Not Found - GWM Indonesia",
          },
          {
            name: "description",
            content: "The requested article could not be found.",
          },
        ],
      };
    }

    return {
      meta: [
        {
          title: `${article.title} - GWM Indonesia`,
        },
        {
          name: "description",
          content:
            article.excerpt || `${article.title} - Great Wall Motors Indonesia`,
        },
        {
          name: "keywords",
          content: `GWM, Great Wall Motors, ${article.category}, ${article.title}`,
        },
        {
          property: "og:title",
          content: `${article.title} - GWM Indonesia`,
        },
        {
          property: "og:description",
          content:
            article.excerpt || `${article.title} - Great Wall Motors Indonesia`,
        },
        {
          property: "og:image",
          content:
            article.featuredImageUrl || "https://gwm.co.id/hero_image.webp",
        },
        {
          property: "og:url",
          content: `https://gwm.co.id/info-promo/${article.slug}`,
        },
        {
          property: "og:type",
          content: "article",
        },
        {
          property: "article:published_time",
          content: article.publishedAt || new Date().toISOString(),
        },
        {
          property: "article:section",
          content: article.category || "News",
        },
      ],
      links: [
        {
          rel: "canonical",
          href: `https://gwm.co.id/info-promo/${article.slug}`,
        },
      ],
    };
  },
  component: ArticleDetailPage,
});

function ArticleDetailPage() {
  const { slug } = Route.useParams();
  const { article: loaderArticle, error: loaderError } = Route.useLoaderData();
  const [article, setArticle] = useState<Article | null>(loaderArticle || null);
  const [isLoading, setIsLoading] = useState(!loaderArticle);
  const [error, setError] = useState<string | null>(loaderError || null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  console.log("Article data:", article);

  // Load page with a slight delay for smooth transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Fetch article from SQLite if it wasn't loaded by SSR
  useEffect(() => {
    // If we already have the article from the loader, don't fetch again
    if (loaderArticle) return;

    async function loadArticle() {
      try {
        setIsLoading(true);
        setError(null);

        const articleData = await getArticleBySlug({ data: { slug } });
        console.log("Article data:", articleData);
        setArticle(articleData);
      } catch (err) {
        console.error("Error loading article:", err);
        setError("Failed to load article.");
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      loadArticle();
    }
  }, [slug, loaderArticle]);

  // Update document head when article data is loaded
  useEffect(() => {
    if (article) {
      // This updates the title dynamically after data is loaded
      document.title = article.title;

      // Update meta description if it exists
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && article.excerpt) {
        metaDesc.setAttribute("content", article.excerpt);
      }
    }
  }, [article]);

  // Format date helper function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  // YouTube embed component
  const YouTubeEmbed = ({ url }: { url: string }) => {
    // Extract video ID from YouTube URL
    const getYouTubeVideoId = (youtubeUrl: string) => {
      const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = youtubeUrl.match(regExp);
      return match && match[2].length === 11 ? match[2] : null;
    };

    const videoId = getYouTubeVideoId(url);

    if (!videoId) {
      return <div className="text-red-500">Invalid YouTube URL</div>;
    }

    return (
      <div className="relative w-full my-6" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full rounded-lg"
        />
      </div>
    );
  };

  // Add debug output to help troubleshoot
  console.log("Rendering state:", { isLoading, error, article, isPageLoaded });

  return (
    <div
      className={`pt-16 bg-gray-50 transition-opacity duration-500 ${isPageLoaded ? "opacity-100" : "opacity-0"}`}
      style={{ viewTransitionName: "main-content" }}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="flex justify-between items-center mb-6">
                <div className="bg-gray-200 h-5 w-20 rounded" />
                <div className="bg-gray-200 h-5 w-32 rounded" />
              </div>
              <div className="h-64 bg-gray-200 rounded-lg mb-6" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-4/6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
            >
              Kembali
            </button>
          </div>
        </div>
      )}

      {/* Article Content */}
      {!isLoading && article && (
        <div className="container mx-auto px-4 py-12">
          {/* Add the resizable image styles */}
          <style dangerouslySetInnerHTML={{ __html: articleStyles }} />

          <div className="max-w-3xl mx-auto">
            <div className="mb-8 content-fade-in">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                {article.title}
              </h1>

              <div className="flex justify-between items-center mb-6">
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${
                    article.category === "News"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {article.category}
                </span>
                <span className="text-sm text-gray-600">
                  {formatDate(article.publishedAt)}
                </span>
              </div>

              {article.featuredImageUrl && (
                <div className="mb-8">
                  <img
                    src={article.featuredImageUrl}
                    alt={article.featuredImageAlt || article.title}
                    className="rounded-lg w-full h-auto object-cover max-h-[500px] image-load-transition"
                    loading="lazy"
                    onLoad={(e) =>
                      e.currentTarget.classList.add("image-loaded")
                    }
                  />
                </div>
              )}

              {/* YouTube Video Embed if available */}
              {article.youtubeUrl && <YouTubeEmbed url={article.youtubeUrl} />}

              {/* Content rendered using DOMPurify to sanitize HTML */}
              <div
                className="prose prose-lg max-w-none text-gray-700 tiptap-content article-content prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:bg-gray-50 prose-blockquote:py-2 prose-blockquote:rounded-sm"
                // We use DOMPurify to sanitize HTML from Tiptap to prevent XSS attacks
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(article.content, {
                    ADD_ATTR: ["alignment", "width", "height", "class"],
                  }),
                }}
              />
            </div>

            <div className="border-t border-gray-200 pt-8 mt-8">
              <Link
                to="/info-promo"
                className="inline-flex items-center text-primary hover:underline"
                viewTransition={{ types: ["slide-right"] }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <title>Back Arrow</title>
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Kembali ke Info & Promo
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
