import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, useState, useEffect } from "react";
import { useAuth, SignInButton, SignUpButton } from "@clerk/tanstack-start";
import {
  Loader2,
  Search,
  Plus,
  Edit,
  Trash2,
  FileText,
  Eye,
} from "lucide-react";
import { getAllArticles, deleteArticle } from "../server/articles";

// Status badge component
function StatusBadge({ published }: { published: number }) {
  return (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded-full ${
        published
          ? "bg-green-100 text-green-800"
          : "bg-yellow-100 text-yellow-800"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

export const Route = createFileRoute("/admin/articles/")({
  component: AdminArticlesPage,
  loader: async () => {
    try {
      const response = await getAllArticles({
        data: { page: 1, pageSize: 50, publishedOnly: false },
      });
      return { articles: response.data, pagination: response.pagination };
    } catch (error) {
      console.error("Error fetching articles:", error);
      return {
        articles: [],
        pagination: { page: 1, pageSize: 10, pageCount: 0, total: 0 },
        error: "Failed to load articles",
      };
    }
  },
});

function AdminArticlesPage() {
  const { articles, pagination, error } = Route.useLoaderData();
  const { isSignedIn } = useAuth();
  const [articleList, setArticleList] = useState(articles);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredArticles, setFilteredArticles] = useState(articles);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const pageSize = 10;

  // Update articleList when articles from loader change
  useEffect(() => {
    setArticleList(articles);
  }, [articles]);

  // Filter articles when search query or status filter changes
  useEffect(() => {
    let filtered = articleList;

    // Apply status filter
    if (statusFilter === "published") {
      filtered = filtered.filter((article) => article.published === 1);
    } else if (statusFilter === "draft") {
      filtered = filtered.filter((article) => article.published === 0);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(lowerQuery) ||
          article.excerpt.toLowerCase().includes(lowerQuery) ||
          article.category.toLowerCase().includes(lowerQuery)
      );
    }

    setFilteredArticles(filtered);
    setCurrentPage(1);
  }, [searchQuery, articleList, statusFilter]);

  // Get paginated articles
  const getCurrentPageArticles = () => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredArticles.slice(startIndex, startIndex + pageSize);
  };

  // Handle article deletion
  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this article?")) {
      try {
        setIsDeleting(id);
        setDeleteError(null);
        const result = await deleteArticle({ data: { id } });
        if (result.success) {
          setArticleList((prev) => prev.filter((article) => article.id !== id));
        }
      } catch (err) {
        setDeleteError("Failed to delete article. Please try again.");
        console.error("Error deleting article:", err);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  // Format date helper function
  const formatDate = (dateString: string | null, published: number) => {
    if (!published) return "Not published";
    if (!dateString) return "Not published";

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  // If not signed in, display authentication options
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-white pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-medium text-primary mb-4">
            Admin Area
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            You need to sign in to access the admin dashboard
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignInButton mode="modal">
              <button
                type="button"
                className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button
                type="button"
                className="px-6 py-3 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors"
              >
                Sign Up
              </button>
            </SignUpButton>
          </div>

          <p className="mt-8 text-sm text-gray-500">
            This area is restricted to administrators only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl md:text-4xl font-medium text-primary mb-4 md:mb-0">
          Article Management
        </h1>

        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search articles..."
              className="pl-10 py-2 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "published" | "draft")
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="all">All Articles</option>
            <option value="published">Published Only</option>
            <option value="draft">Drafts Only</option>
          </select>

          <Link
            to="/admin/articles/new"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Article
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {deleteError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {deleteError}
        </div>
      )}

      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredArticles.length}{" "}
        {statusFilter !== "all" ? statusFilter : ""} article
        {filteredArticles.length !== 1 ? "s" : ""}
        {searchQuery.trim() ? ` matching "${searchQuery}"` : ""}
        {filteredArticles.length > 0 &&
          filteredArticles.length !== articleList.length &&
          ` (out of ${articleList.length} total)`}
      </div>

      <div className="bg-gray-50 p-6 rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Title
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Published Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {getCurrentPageArticles().length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  {articleList.length === 0
                    ? "No articles found. Create your first article!"
                    : "No articles match your search criteria."}
                </td>
              </tr>
            ) : (
              getCurrentPageArticles().map((article) => (
                <tr key={article.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {article.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {article.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <StatusBadge published={article.published} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(article.publishedAt, article.published)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-3">
                      <Link
                        to="/admin/articles/$id"
                        params={{ id: article.id.toString() }}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Edit Article"
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
                      {article.published === 1 && (
                        <Link
                          to="/info-promo/$slug"
                          params={{ slug: article.slug }}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="View Published Article"
                          target="_blank"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(article.id)}
                        disabled={isDeleting === article.id}
                        className="text-red-600 hover:text-red-900 focus:outline-none disabled:opacity-50 transition-colors"
                        title="Delete Article"
                      >
                        {isDeleting === article.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {filteredArticles.length > pageSize && (
          <div className="flex justify-center mt-6">
            <nav className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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

              {Array.from(
                { length: Math.ceil(filteredArticles.length / pageSize) },
                (_, i) => i + 1
              ).map((page) => (
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
              ))}

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(
                      Math.ceil(filteredArticles.length / pageSize),
                      prev + 1
                    )
                  )
                }
                disabled={
                  currentPage === Math.ceil(filteredArticles.length / pageSize)
                }
                className={`p-2 rounded-md ${
                  currentPage === Math.ceil(filteredArticles.length / pageSize)
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
      </div>
    </div>
  );
}
