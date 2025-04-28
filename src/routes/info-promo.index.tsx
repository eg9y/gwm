import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAllArticles } from "../server/articles";
import type { Article } from "../db";
import { seo } from "../utils/seo";

export const Route = createFileRoute("/info-promo/")({
  component: InfoPromoPage,
  head: () => ({
    meta: [
      ...seo({
        title: "Info & Promo - GWM Indonesia",
        description:
          "Berita terbaru dan promo spesial dari GWM Indonesia. Dapatkan informasi tentang peluncuran produk, promo penjualan, dan kegiatan GWM lainnya.",
        keywords:
          "GWM Indonesia, promo mobil, berita otomotif, Tank 300, Tank 500, Haval H6, Haval Jolion",
      }),
    ],
    links: [
      {
        rel: "canonical",
        href: "https://gwmindonesia.com/info-promo",
      },
    ],
  }),
});

function InfoPromoPage() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load page with a slight delay for smooth transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Fetch articles from SQLite
  useEffect(() => {
    async function loadArticles() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch articles from SQLite database
        const response = await getAllArticles({
          data: {
            page: currentPage,
            pageSize: 9,
            category: activeCategory === "All" ? undefined : activeCategory,
            searchQuery: searchQuery || undefined,
            publishedOnly: true, // Only fetch published articles for the public page
          },
        });

        setArticles(response.data);

        // Update pagination
        if (response.pagination) {
          setTotalPages(response.pagination.pageCount);
        }
      } catch (err) {
        console.error("Error fetching articles:", err);
        setError("Failed to load articles. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    loadArticles();
  }, [activeCategory, searchQuery, currentPage]);

  // Get image URL from article
  const getImageUrl = (article: Article) => {
    if (article.featuredImageUrl) {
      return article.featuredImageUrl;
    }
    return "https://gwm.kopimap.com/gwm_logo.webp";
  };

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

  const filteredArticles = articles;

  return (
    <>
      <div
        className={`bg-gray-50 pt-12 transition-opacity duration-500 ${isPageLoaded ? "opacity-100" : "opacity-0"}`}
        style={{ viewTransitionName: "main-content" }}
      >
        {/* Hero Section */}
        <div className="bg-white py-12 md:py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 content-fade-in">
              Info & Promo
            </h1>
            <p className="text-lg md:text-xl max-w-3xl content-fade-in animation-delay-100">
              Dapatkan informasi terbaru dan penawaran spesial dari GWM
              Indonesia
            </p>
          </div>
        </div>

        {/* Filter and Search */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 content-fade-in stagger-item">
              <button
                type="button"
                className={`px-4 py-2 rounded-sm text-sm font-medium transition ${
                  activeCategory === "All"
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => {
                  setActiveCategory("All");
                  setCurrentPage(1);
                }}
              >
                Semua
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-sm text-sm font-medium transition ${
                  activeCategory === "News"
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => {
                  setActiveCategory("News");
                  setCurrentPage(1);
                }}
              >
                Berita
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-sm text-sm font-medium transition ${
                  activeCategory === "Promo"
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => {
                  setActiveCategory("Promo");
                  setCurrentPage(1);
                }}
              >
                Promo
              </button>
            </div>

            <div className="w-full md:w-auto content-fade-in stagger-item">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setCurrentPage(1);
                }}
                className="relative"
              >
                <input
                  type="text"
                  placeholder="Cari info atau promo..."
                  className="w-full md:w-64 px-4 py-2 rounded-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <title>Search Icon</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </form>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={`skeleton-${i}`}
                  className="bg-white rounded-lg overflow-hidden shadow-md animate-pulse"
                >
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200 h-48" />
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-3">
                      <div className="bg-gray-200 h-6 w-16 rounded" />
                      <div className="bg-gray-200 h-4 w-24 rounded" />
                    </div>
                    <div className="bg-gray-200 h-6 w-full rounded mb-2" />
                    <div className="space-y-2 mb-4">
                      <div className="bg-gray-200 h-4 w-full rounded" />
                      <div className="bg-gray-200 h-4 w-5/6 rounded" />
                      <div className="bg-gray-200 h-4 w-4/6 rounded" />
                    </div>
                    <div className="bg-gray-200 h-8 w-36 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-8">
              <p>{error}</p>
            </div>
          )}

          {/* News Grid */}
          {!isLoading && !error && filteredArticles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className="bg-white overflow-hidden shadow-md hover:shadow-lg transition duration-300 flex flex-col transform hover:-translate-y-1 content-fade-in"
                  >
                    <Link
                      to="/info-promo/$slug"
                      params={{ slug: article.slug }}
                      aria-label={`Read more about ${article.title}`}
                      className="block h-48 overflow-hidden"
                      viewTransition={{ types: ["slide-left"] }}
                    >
                      <img
                        src={getImageUrl(article)}
                        alt={article.featuredImageAlt || article.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </Link>
                    <div className="p-5">
                      <div className="flex justify-between items-center mb-3">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            article.category === "News"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {article.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(article.publishedAt)}
                        </span>
                      </div>
                      <h2 className="text-lg font-semibold mb-2 text-gray-800 line-clamp-2">
                        {article.title}
                      </h2>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {article.excerpt}
                      </p>
                    </div>
                    <Link
                      to="/info-promo/$slug"
                      params={{ slug: article.slug }}
                      aria-label={`Read more about ${article.title}`}
                      className="px-3 pb-3 text-primary font-medium hover:underline flex items-center"
                      viewTransition={{ types: ["slide-left"] }}
                    >
                      Baca Selengkapnya
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <title>Arrow Right</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </Link>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mb-12">
                  <nav className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className={`p-2 rounded-md ${
                        currentPage === 1
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <title>Previous Page</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={`page-${page}`}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-md ${
                            currentPage === page
                              ? "bg-primary text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-md ${
                        currentPage === totalPages
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <title>Next Page</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              )}
            </>
          ) : !isLoading && filteredArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-gray-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <title>Sad Face Icon</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Tidak Ditemukan
              </h3>
              <p className="text-gray-500 max-w-md">
                Maaf, tidak ada hasil yang sesuai dengan pencarian Anda. Silakan
                coba dengan kata kunci lain.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                  setCurrentPage(1);
                }}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
              >
                Reset Pencarian
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
