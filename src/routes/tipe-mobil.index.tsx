import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAllPublishedCarModels } from "../server/frontend-car-models";
import { getSiteSettings } from "../server/site-settings";

export const Route = createFileRoute("/tipe-mobil/")({
  component: TipeMobilPage,
  loader: async () => {
    try {
      const [models, siteSettings] = await Promise.all([
        getAllPublishedCarModels(),
        getSiteSettings(),
      ]);
      return { models, siteSettings, error: null };
    } catch (error) {
      console.error("Error loading data:", error);
      return { models: [], siteSettings: null, error: "Failed to load data" };
    }
  },
  head: ({ loaderData }) => {
    const { siteSettings } = loaderData;
    const brandName =
      siteSettings?.brandName || "GWM Indonesia | Great Wall Motors";

    // Use custom meta title from site settings if available, otherwise use default
    const pageTitle =
      siteSettings?.tipeMobilPageMetaTitle ||
      `Tipe Mobil ${brandName} - Tank, Haval, ORA | Great Wall Motors`;

    return {
      meta: [
        {
          title: pageTitle,
        },
        {
          name: "description",
          content: `Temukan berbagai tipe mobil ${brandName} - Tank 300, Tank 500, Haval H6, Haval Jolion, dan lainnya. Pilih kendaraan yang sesuai dengan gaya hidup dan kebutuhan Anda.`,
        },
      ],
    };
  },
});

function TipeMobilPage() {
  const { models, siteSettings, error } = Route.useLoaderData();
  const [isLoading, setIsLoading] = useState(true);

  const brandName = siteSettings?.brandName || "GWM Indonesia";

  // Add a small delay for smooth loading transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="pt-32 pb-10 grainy-bg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Tipe Mobil {brandName}
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Temukan berbagai tipe mobil {brandName} yang sesuai dengan kebutuhan
            Anda
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <output
              className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"
              aria-live="polite"
              aria-label="Loading vehicle models"
            >
              <span className="sr-only">Loading vehicle models...</span>
            </output>
          </div>
        ) : models.length === 0 && !error ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-700">
              No models available at the moment. Please check back later.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {models.map((model) => (
              <Link
                key={model.id}
                to="/tipe-mobil/$model"
                params={{ model: model.id }}
                className="block bg-white shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group"
                aria-label={`View details for ${model.name}`}
              >
                <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                  <img
                    src={model.featuredImage}
                    alt={`${model.name} - GWM ${model.category || ""} vehicle`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold">{model.name}</h3>
                  <p className="mt-2 text-gray-600 line-clamp-3">
                    {model.description}
                  </p>
                  <span className="mt-3 inline-block text-primary font-medium group-hover:underline">
                    Lihat Detail
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
