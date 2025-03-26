import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { seo } from "../utils/seo";
import { ModelColorPicker } from "../components/ModelColorPicker";
import { ModelGallery } from "../components/ModelGallery";
import {
  getCarModelById,
  getAllPublishedCarModels,
} from "../server/frontend-car-models";
import type { CarModelColor, GalleryImage } from "../db/schema";

// Define the expected types for loader data
type LoaderData = {
  vehicle: {
    id: string;
    name: string;
    featuredImage: string;
    price: string;
    description: string;
    features: string[];
    mainProductImage: string;
    colors: CarModelColor[];
    gallery?: GalleryImage[];
    category: string;
    categoryDisplay: string;
    published: number;
  };
  relatedVehicles: Array<{
    id: string;
    name: string;
    featuredImage: string;
    price: string;
    description: string;
    features: string[];
    mainProductImage: string;
    colors: CarModelColor[];
    category: string;
    categoryDisplay: string;
    published: number;
  }>;
};

export const Route = createFileRoute("/tipe-mobil/$model")({
  beforeLoad: ({ params }) => {
    // This is executed first - just to check the model ID exists
    // The actual loading happens in the loader function
    const { model } = params;
    if (!model) {
      throw new Error("Model ID is required");
    }
  },

  loader: async ({ params }) => {
    const { model: modelId } = params;

    // Get the vehicle details
    try {
      const model = await getCarModelById({ data: { id: modelId } });

      // Get all other models for related vehicles
      const allModels = await getAllPublishedCarModels();

      // Filter out the current model and limit to 3 related models
      const relatedVehicles = allModels
        .filter((relatedModel) => relatedModel.id !== modelId)
        .slice(0, 3);

      return {
        vehicle: model,
        relatedVehicles,
      } satisfies LoaderData;
    } catch (error) {
      console.error(`Failed to load model ${modelId}:`, error);
      throw new Error(`No vehicle found with ID: ${modelId}`);
    }
  },

  head: ({ loaderData }) => {
    const { vehicle } = loaderData;

    return {
      meta: [
        ...seo({
          title: `${vehicle.name} - Tipe Mobil GWM Indonesia | Great Wall Motors`,
          description: `${vehicle.name} - ${vehicle.description} Dapatkan informasi lengkap mengenai spesifikasi, harga, dan fitur ${vehicle.name}.`,
          keywords: `GWM, Great Wall Motors, ${vehicle.name}, ${vehicle.categoryDisplay}, Tipe Mobil GWM, ${vehicle.name} Indonesia, ${vehicle.name} Spesifikasi`,
          image: vehicle.featuredImage,
        }),
      ],
      links: [
        {
          rel: "canonical",
          href: `https://gwm.co.id/tipe-mobil/${vehicle.id}`,
        },
      ],
    };
  },

  component: VehicleDetailPage,
});

function VehicleDetailPage() {
  const { vehicle, relatedVehicles } = Route.useLoaderData();
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Add a small delay for smooth transition effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`pt-16 transition-opacity duration-500 ${isPageLoaded ? "opacity-100" : "opacity-0"}`}
    >
      {/* Hero section */}
      <div className="relative bg-gray-900 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url(${vehicle.featuredImage})`,
          }}
        />
        <div className="relative container mx-auto px-4 py-24 sm:py-32">
          <span className="inline-block px-3 py-1 bg-primary text-white text-sm rounded-md mb-4">
            {vehicle.categoryDisplay}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            {vehicle.name}
          </h1>
          <p className="text-xl max-w-2xl mb-6">{vehicle.description}</p>
          <p className="text-2xl font-semibold">{vehicle.price}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-16">
        {/* Vehicle details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Image */}
          <div className="rounded-lg overflow-hidden shadow-lg">
            <img
              src={vehicle.featuredImage}
              alt={vehicle.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Features */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Fitur Unggulan
            </h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <ul className="space-y-4">
                {vehicle.features &&
                  Array.isArray(vehicle.features) &&
                  vehicle.features.map((feature, idx) => (
                    <li
                      key={`${vehicle.id}-feature-${idx}`}
                      className="flex items-start gap-3"
                    >
                      <span className="flex-shrink-0 mt-1 text-primary font-bold">
                        ✓
                      </span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
              </ul>
            </div>

            {/* Action buttons */}
            <div className="mt-8 space-y-4">
              <a
                href={`https://wa.me/6287774377422?text=Hello,%20Kak%20ARKAN.%20Saya%20ingin%20tanya%20tentang%20${vehicle.name}.%20Saya:%20...%20Domisili:%20..`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block py-3 bg-primary text-white text-center rounded-md font-medium hover:bg-primary/90 transition-colors"
              >
                Hubungi Untuk Test Drive
              </a>
              <a
                href="/kontak"
                className="w-full block py-3 border border-gray-300 text-gray-700 text-center rounded-md font-medium hover:bg-gray-50 transition-colors"
              >
                Pelajari Lebih Lanjut
              </a>
            </div>
          </div>
        </div>

        {/* Vehicle description and color picker in a side-by-side layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
          {/* Vehicle description */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Tentang {vehicle.name}
            </h2>
            <div className="prose prose-lg max-w-none">
              <p>
                {vehicle.name} dirancang untuk memenuhi kebutuhan pengguna yang
                menginginkan kendaraan dengan performa tinggi dan fitur modern.
                Setiap detail dalam desain dan teknologi dipilih untuk
                memberikan pengalaman berkendara yang optimal.
              </p>
              {vehicle.features && vehicle.features[0] && (
                <p className="mt-4">
                  Dengan {vehicle.features[0].toLowerCase()}, {vehicle.name}{" "}
                  memberikan tenaga dan torsi yang cukup untuk menghadapi
                  berbagai kondisi jalan. Kombinasi dengan{" "}
                  {vehicle.features[1]
                    ? vehicle.features[1].toLowerCase()
                    : "transmisi modern"}{" "}
                  menawarkan perpindahan gigi yang halus dan responsif.
                </p>
              )}
              <p className="mt-4">
                Interior {vehicle.name} dirancang dengan mengutamakan kenyamanan
                dan kemudahan penggunaan. Teknologi-teknologi canggih
                diintegrasikan untuk meningkatkan keselamatan dan kenyamanan
                berkendara.
              </p>
            </div>
          </div>

          {/* Color picker - only show for models that have color options */}
          <div>
            {vehicle.colors &&
              Array.isArray(vehicle.colors) &&
              vehicle.colors.length > 0 && (
                <ModelColorPicker
                  modelId={vehicle.id}
                  colors={vehicle.colors}
                />
              )}
          </div>
        </div>

        {/* Gallery Section - only show if gallery images exist */}
        {vehicle.gallery?.length > 0 && (
          <div className="mb-16">
            <ModelGallery
              modelId={vehicle.id}
              modelName={vehicle.name}
              gallery={vehicle.gallery}
            />
          </div>
        )}

        {/* Related vehicles */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Tipe Mobil GWM Lainnya
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedVehicles.map((relatedVehicle) => (
              <div
                key={relatedVehicle.id}
                className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-lg"
              >
                <Link
                  to="/tipe-mobil/$model"
                  params={{ model: relatedVehicle.id }}
                  className="block h-full"
                >
                  <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                    <img
                      src={relatedVehicle.featuredImage}
                      alt={relatedVehicle.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <span className="text-xs text-gray-500 mb-1 block">
                      {relatedVehicle.categoryDisplay}
                    </span>
                    <h3 className="text-xl font-semibold mb-2">
                      {relatedVehicle.name}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {relatedVehicle.description}
                    </p>
                    <span className="text-primary font-medium">
                      Lihat Detail →
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-24 bg-gray-100 rounded-xl p-8 md:p-12">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Tertarik dengan {vehicle.name}?
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Konsultasikan kebutuhan Anda dengan sales consultant kami untuk
              mendapatkan informasi terbaru mengenai harga, promo, dan
              ketersediaan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/kontak"
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-md font-medium text-center hover:bg-primary/90 transition-colors"
              >
                Hubungi Kami
              </a>
              <a
                href={`https://wa.me/6287774377422?text=Hello,%20Kak%20ARKAN.%20Saya%20ingin%20tanya%20tentang%20${vehicle.name}.%20Saya:%20...%20Domisili:%20..`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-green-500 text-white rounded-md font-medium text-center hover:bg-green-600 transition-colors"
              >
                Chat WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
