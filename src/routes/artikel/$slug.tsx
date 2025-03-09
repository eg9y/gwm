import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import {
  fetchArticleBySlug,
  getStrapiImageUrl,
} from "../../services/strapiService";
import type { ArticleAttributes } from "../../types/strapi";

export const Route = createFileRoute("/artikel/$slug")({
  component: ArticlePage,
});

function ArticlePage() {
  const { slug } = useParams({ from: "/artikel/$slug" });
  const [article, setArticle] = useState<ArticleAttributes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadArticle() {
      try {
        setIsLoading(true);
        setError(null);
        const articleData = await fetchArticleBySlug(slug);
        setArticle(articleData.data);
      } catch (err) {
        console.error("Error loading article:", err);
        setError(err instanceof Error ? err.message : "Failed to load article");
      } finally {
        setIsLoading(false);
      }
    }

    loadArticle();
  }, [slug]);

  // Format the date in a more readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  // Get image URL or fallback
  const getImageUrl = () => {
    if (article?.featuredImage) {
      return getStrapiImageUrl(article.featuredImage.url);
    }
    return "https://source.unsplash.com/random/1200x600/?car";
  };

  // Render content sections for better safety
  const renderSections = (content: string) => {
    console.log("article", article);
    // Split content by paragraphs for simplicity
    const paragraphs = content.split("\n\n").filter(Boolean);

    return (
      <>
        {paragraphs.map((paragraph) => (
          <p
            key={`paragraph-${slug}-${paragraph.slice(0, 10)}`}
            className="mb-4"
          >
            {paragraph}
          </p>
        ))}
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="pt-24 min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-12" />
            <div className="h-96 bg-gray-200 rounded-lg mb-8" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-24 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Article Not Found
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/info-promo"
            className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition"
          >
            Back to News
          </a>
        </div>
      </div>
    );
  }

  if (!article) return null;

  const { title, content, publishedAt, category } = article;

  return (
    <>
      <Helmet>
        <title>{title} | GWM Indonesia</title>
        <meta name="description" content={article.excerpt} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:image" content={getImageUrl()} />
        <meta property="og:type" content="article" />
        <link
          rel="canonical"
          href={`https://gwm-indonesia.com/artikel/${slug}`}
        />
      </Helmet>

      <div className="pt-24 min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Article Header */}
            <header className="mb-8">
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    category === "News"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {category}
                </span>
                <span>{formatDate(publishedAt)}</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 enhanced-content-fade-in">
                {title}
              </h1>
            </header>

            {/* Featured Image */}
            <div className="mb-8 rounded-lg overflow-hidden shadow-md enhanced-content-fade-in">
              <img
                src={getImageUrl()}
                alt={title}
                className="w-full object-cover h-64 md:h-96"
                loading="lazy"
              />
            </div>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none enhanced-content-fade-in">
              {renderSections(content)}
            </div>

            {/* Share & Back Buttons */}
            <div className="mt-10 border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between enhanced-content-fade-in">
              <div className="flex gap-3 mb-4 sm:mb-0">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=https://gwm-indonesia.com/artikel/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-2 rounded-full transition"
                >
                  <span className="sr-only">Share on Facebook</span>
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <title>Facebook Share Icon</title>
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=https://gwm-indonesia.com/artikel/${slug}&text=${encodeURIComponent(title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-2 rounded-full transition"
                >
                  <span className="sr-only">Share on Twitter</span>
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <title>Twitter Share Icon</title>
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${title} - https://gwm-indonesia.com/artikel/${slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-2 rounded-full transition"
                >
                  <span className="sr-only">Share on WhatsApp</span>
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <title>WhatsApp Share Icon</title>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </a>
              </div>
              <a
                href="/info-promo"
                className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Back Arrow Icon</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to News
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
