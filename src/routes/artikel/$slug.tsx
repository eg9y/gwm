import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import {
  fetchArticleBySlug,
  getStrapiImageUrl,
} from "../../services/strapiService";
import type { ArticleAttributes } from "../../types/strapi";

console.log("Article route file loaded");

export const Route = createFileRoute("/artikel/$slug")({
  component: ArticleDetailPage,
  // Use the updated syntax for head metadata
  head: () => ({
    meta: [
      {
        title: "Loading Article...",
      },
      {
        name: "description",
        content: "Loading article content...",
      },
    ],
  }),
});

function ArticleDetailPage() {
  console.log("ArticleDetailPage component rendering");
  const { slug } = Route.useParams();
  const [article, setArticle] = useState<ArticleAttributes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  console.log("kanjai", article);

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

  // Load page with a slight delay for smooth transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Fetch article from Strapi
  useEffect(() => {
    async function loadArticle() {
      try {
        setIsLoading(true);
        setError(null);

        const articleData = await fetchArticleBySlug(slug);
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
  }, [slug]);

  // Format date helper function
  const formatDate = (dateString: string) => {
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

              {article?.featuredImage?.url && (
                <div className="mb-8">
                  <img
                    src={getStrapiImageUrl(article.featuredImage.url)}
                    alt={article.title}
                    className="rounded-lg w-full h-auto object-cover max-h-[500px] image-load-transition"
                    loading="lazy"
                    onLoad={(e) =>
                      e.currentTarget.classList.add("image-loaded")
                    }
                  />
                </div>
              )}

              {/* YouTube Video Embed if available */}
              {article.youtube_url && (
                <YouTubeEmbed url={article.youtube_url} />
              )}

              <div
                className="prose prose-lg max-w-none text-gray-700"
                // Using dangerouslySetInnerHTML is necessary for rendering formatted content
                // Content is sanitized with DOMPurify to prevent XSS attacks
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(article.content),
                }}
              />
            </div>

            <div className="border-t border-gray-200 pt-8 mt-8">
              <Link
                to="/info-promo"
                className="inline-flex items-center text-primary hover:underline"
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
