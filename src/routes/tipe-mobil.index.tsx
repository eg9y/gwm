import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAllPublishedCarModels } from "../server/frontend-car-models";
import type { CarModel } from "../server/car-models";

export const Route = createFileRoute("/tipe-mobil/")({
  component: TipeMobilPage,
  loader: async () => {
    try {
      const models = await getAllPublishedCarModels();
      return { models, error: null };
    } catch (error) {
      console.error("Error loading car models:", error);
      return { models: [], error: "Failed to load models" };
    }
  },
  head: () => ({
    meta: [
      {
        title:
          "Tipe Mobil GWM Indonesia - Tank, Haval, ORA | Great Wall Motors",
      },
      {
        name: "description",
        content:
          "Temukan berbagai tipe mobil GWM Indonesia - Tank 300, Tank 500, Haval H6, Haval Jolion, dan lainnya. Pilih kendaraan yang sesuai dengan gaya hidup dan kebutuhan Anda.",
      },
    ],
  }),
});

function TipeMobilPage() {
  const { models, error } = Route.useLoaderData();
  const [isLoading, setIsLoading] = useState(true);

  // Add a small delay for smooth loading transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="pt-32 pb-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Tipe Mobil GWM
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Temukan berbagai tipe mobil GWM yang sesuai dengan kebutuhan Anda
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : models.length === 0 && !error ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-500">
              No models available at the moment. Please check back later.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {models.map((model) => (
              <div
                key={model.id}
                className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                  <img
                    src={model.featuredImage}
                    alt={`${model.name} GWM`}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold">{model.name}</h3>
                  <p className="mt-2 text-gray-600 line-clamp-3">
                    {model.description}
                  </p>
                  <Link
                    to="/tipe-mobil/$model"
                    params={{ model: model.id }}
                    className="mt-3 inline-block text-primary font-medium"
                  >
                    Lihat Detail
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
