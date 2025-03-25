import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { getAllArticles } from "../server/articles";
import type { Article } from "../db";

function Promos() {
  const [promos, setPromos] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPromos() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch promo articles from SQLite database
        const response = await getAllArticles({
          data: {
            page: 1,
            pageSize: 4,
            category: "Promo",
            publishedOnly: true,
          },
        });
        setPromos(response.data);
      } catch (err) {
        console.error("Error fetching promos:", err);
        setError("Failed to load promotional content");
      } finally {
        setIsLoading(false);
      }
    }

    loadPromos();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (promos.length === 0) {
    return null;
  }

  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Promo Spesial</h2>
          <Link
            to="/info-promo"
            className="text-primary hover:underline flex items-center"
          >
            Lihat Semua
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <title>Lihat Semua Arrow</title>
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promos.map((promo) => (
            <div
              key={promo.id}
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition duration-300"
            >
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={
                    promo.featuredImageUrl ||
                    "https://source.unsplash.com/random/800x600/?car"
                  }
                  alt={promo.featuredImageAlt || promo.title}
                  className="object-cover w-full h-48"
                />
              </div>
              <div className="p-4">
                <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full mb-2">
                  Promo
                </span>
                <Link
                  to="/info-promo/$slug"
                  params={{ slug: promo.slug }}
                  className="text-primary font-medium hover:underline flex items-center text-sm"
                >
                  Selengkapnya
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <title>Read More Arrow</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Promos;
