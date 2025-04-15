"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { seo } from "../utils/seo";
import { ModelColorPicker } from "../components/ModelColorPicker";
import { ModelGallery } from "../components/ModelGallery";
import {
  getCarModelById,
  getAllPublishedCarModels,
} from "../server/frontend-car-models";
import type { CarModelColor, GalleryImage } from "../db/schema";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { ChevronDown, Info } from "lucide-react";

// Add custom styles for hiding scrollbars
const HideScrollbarStyles = () => (
  <style>
    {`
    .hide-scrollbar {
      -ms-overflow-style: none; /* IE and Edge */
      scrollbar-width: none; /* Firefox */
    }
    .hide-scrollbar::-webkit-scrollbar {
      display: none; /* Chrome, Safari and Opera */
    }
    `}
  </style>
);

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
    specifications?: Array<{
      categoryTitle: string;
      specs: Array<{ key: string; value: string }>;
    }>;
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
  const [showStickyInfo, setShowStickyInfo] = useState(false);
  const [activeSpecCategory, setActiveSpecCategory] = useState<string | null>(
    vehicle.specifications?.[0]?.categoryTitle || null
  );
  const [activeSection, setActiveSection] = useState<string>("features");
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Add refs for each section
  const specsSectionRef = useRef<HTMLDivElement>(null);
  const featuresSectionRef = useRef<HTMLDivElement>(null);
  const aboutSectionRef = useRef<HTMLDivElement>(null);
  const colorsSectionRef = useRef<HTMLDivElement>(null);
  const gallerySectionRef = useRef<HTMLDivElement>(null);
  const relatedVehiclesSectionRef = useRef<HTMLDivElement>(null);

  // Add a small delay for smooth transition effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Use Intersection Observer to detect sections in viewport
  useEffect(() => {
    // Create section observers
    const sectionRefs = [
      { ref: featuresSectionRef, id: "features" },
      { ref: aboutSectionRef, id: "about" },
      { ref: colorsSectionRef, id: "colors" },
      { ref: specsSectionRef, id: "specs" },
      { ref: gallerySectionRef, id: "gallery" },
      { ref: relatedVehiclesSectionRef, id: "related" },
    ];

    // Create observers for each section
    const sectionObservers = sectionRefs.map(({ ref, id }) => {
      if (!ref.current) return null;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            // When section is at least 30% visible, set it as active
            if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
              setActiveSection(id);
            }
          }
        },
        {
          root: null,
          rootMargin: "-20% 0px -50% 0px", // Trigger when section is roughly in the middle of viewport
          threshold: [0.3],
        }
      );

      observer.observe(ref.current);
      return observer;
    });

    // Clean up all observers
    return () => {
      for (const observer of sectionObservers) {
        if (observer) observer.disconnect();
      }
    };
  }, []);

  // Use Intersection Observer to detect when hero section is scrolled out of view
  useEffect(() => {
    if (!heroSectionRef.current) return;

    // Create observer with options
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        // When hero section is only 20% or less visible (80% scrolled out), show the sticky bar
        setShowStickyInfo(
          !entry.isIntersecting || entry.intersectionRatio <= 0.4
        );
      },
      {
        // Root is the viewport
        root: null,
        // Margin to start observing before the element enters/exits viewport
        // Negative value on top means it will trigger earlier (when hero is still partially visible)
        rootMargin: "-70px 0px 0px 0px",
        // Array of thresholds at which to trigger the callback
        // 0.2 means when 20% of the element is visible
        threshold: [0, 0.4],
      }
    );

    // Start observing the hero section
    observerRef.current.observe(heroSectionRef.current);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Scroll functions for each section
  const scrollToFeatures = () => {
    if (featuresSectionRef.current) {
      featuresSectionRef.current.scrollIntoView({ behavior: "smooth" });
      setActiveSection("features");
    }
  };

  const scrollToAbout = () => {
    if (aboutSectionRef.current) {
      aboutSectionRef.current.scrollIntoView({ behavior: "smooth" });
      setActiveSection("about");
    }
  };

  const scrollToColors = () => {
    if (colorsSectionRef.current) {
      colorsSectionRef.current.scrollIntoView({ behavior: "smooth" });
      setActiveSection("colors");
    }
  };

  const scrollToSpecs = () => {
    if (specsSectionRef.current) {
      specsSectionRef.current.scrollIntoView({ behavior: "smooth" });
      setActiveSection("specs");
    }
  };

  const scrollToGallery = () => {
    if (gallerySectionRef.current) {
      gallerySectionRef.current.scrollIntoView({ behavior: "smooth" });
      setActiveSection("gallery");
    }
  };

  const scrollToRelatedVehicles = () => {
    if (relatedVehiclesSectionRef.current) {
      relatedVehiclesSectionRef.current.scrollIntoView({ behavior: "smooth" });
      setActiveSection("related");
    }
  };

  // Toggle specification category
  const toggleSpecCategory = (categoryTitle: string) => {
    setActiveSpecCategory(
      activeSpecCategory === categoryTitle ? null : categoryTitle
    );
  };

  return (
    <div
      className={`pt-16 transition-opacity duration-500 grainy-bg ${isPageLoaded ? "opacity-100" : "opacity-0"}`}
    >
      <HideScrollbarStyles />
      {/* Sticky Vehicle Info - shows when scrolled past hero */}
      <div
        className={`fixed top-[60px] sm:top-[70px] left-0 right-0 z-30 bg-white/95 backdrop-blur-sm shadow-md border-b border-gray-200 py-2 sm:py-2.5 transition-all duration-300 ${
          showStickyInfo
            ? "translate-y-0 opacity-100 visible"
            : "translate-y-[-100%] opacity-0 invisible pointer-events-none"
        }`}
        aria-hidden={!showStickyInfo}
      >
        <div className="container mx-auto px-4 flex items-center">
          <div className="flex items-center gap-3 flex-shrink-0 mr-4">
            <img
              src={vehicle.mainProductImage || vehicle.featuredImage}
              alt={`${vehicle.name} - ${vehicle.categoryDisplay || vehicle.category} main`}
              className="h-8 w-12 sm:h-10 sm:w-16 object-cover rounded-sm"
              loading="lazy"
              decoding="async"
            />
            <h3 className="font-semibold text-primary text-sm sm:text-base truncate max-w-[120px] sm:max-w-[150px]">
              {vehicle.name}
            </h3>
          </div>
          <div className="overflow-x-auto flex-grow hide-scrollbar">
            <div className="flex gap-2 min-w-max p-1">
              <button
                onClick={scrollToFeatures}
                type="button"
                className={`text-xs sm:text-sm whitespace-nowrap px-3 py-1.5 rounded-full transition-colors ${
                  activeSection === "features"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Fitur Unggulan
              </button>
              <button
                onClick={scrollToAbout}
                type="button"
                className={`text-xs sm:text-sm whitespace-nowrap px-3 py-1.5 rounded-full transition-colors ${
                  activeSection === "about"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Tentang
              </button>
              {vehicle.colors?.length > 0 && (
                <button
                  onClick={scrollToColors}
                  type="button"
                  className={`text-xs sm:text-sm whitespace-nowrap px-3 py-1.5 rounded-full transition-colors ${
                    activeSection === "colors"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Warna
                </button>
              )}
              {vehicle.specifications && vehicle.specifications.length > 0 && (
                <button
                  onClick={scrollToSpecs}
                  type="button"
                  className={`text-xs sm:text-sm whitespace-nowrap px-3 py-1.5 rounded-full transition-colors ${
                    activeSection === "specs"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Spesifikasi
                </button>
              )}
              {vehicle.gallery && vehicle.gallery.length > 0 && (
                <button
                  onClick={scrollToGallery}
                  type="button"
                  className={`text-xs sm:text-sm whitespace-nowrap px-3 py-1.5 rounded-full transition-colors ${
                    activeSection === "gallery"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Galeri
                </button>
              )}
              <button
                onClick={scrollToRelatedVehicles}
                type="button"
                className={`text-xs sm:text-sm whitespace-nowrap px-3 py-1.5 rounded-full transition-colors ${
                  activeSection === "related"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Tipe Lainnya
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero section with improved gradient overlay */}
      <div className="relative bg-gray-900 text-white" ref={heroSectionRef}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${vehicle.featuredImage})`,
            opacity: 0.7,
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70"
          aria-hidden="true"
        />
        <div className="relative container mx-auto px-4 py-24 sm:py-32">
          <span className="inline-block px-3 py-1 bg-primary text-white text-sm rounded-md mb-4 shadow-sm">
            {vehicle.categoryDisplay}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 drop-shadow-sm">
            {vehicle.name}
          </h1>
          <p className="text-xl max-w-2xl mb-6 text-white/90">
            {vehicle.description}
          </p>
          <p className="text-2xl font-semibold drop-shadow-sm">
            {vehicle.price}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-16">
        {/* Vehicle details - improved cards with subtle shadows */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16"
          ref={featuresSectionRef}
        >
          {/* Image with refined shadow and border */}
          <div className="flex flex-col gap-12">
            <div className="overflow-hidden rounded-lg shadow-md border border-gray-100 bg-white">
              <LazyLoadImage
                src={vehicle.featuredImage}
                alt={`${vehicle.name} - ${vehicle.categoryDisplay || vehicle.category} main image`}
                effect="blur"
                wrapperClassName="w-full h-full"
                className="w-full h-full object-cover"
              />
            </div>

            {vehicle.subImage && (
              <div className="overflow-hidden rounded-lg shadow-md border border-gray-100 bg-white">
                <LazyLoadImage
                  src={vehicle.subImage}
                  alt={`${vehicle.name} - ${vehicle.categoryDisplay || vehicle.category} sub image`}
                  effect="blur"
                  wrapperClassName="w-full h-full"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Features with enhanced card design */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="h-6 w-1.5 bg-primary rounded-full inline-block mr-3" />
              Fitur Unggulan
            </h2>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vehicle.features &&
                  Array.isArray(vehicle.features) &&
                  vehicle.features.map((feature, idx) => (
                    <div
                      key={`${vehicle.id}-feature-${idx}`}
                      className="flex items-center gap-3 bg-gray-50/80 p-3 rounded-lg hover:shadow-sm transition-shadow duration-200 border border-gray-100"
                    >
                      <div className="flex-shrink-0 bg-primary/10 rounded-full p-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-primary"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-700 font-medium text-sm">
                        {feature}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Action buttons with improved styling */}
            <div className="mt-8 space-y-4">
              <a
                href={`https://wa.me/6287774377422?text=Hello,%20Kak%20ARKAN.%20Saya%20ingin%20tanya%20tentang%20${vehicle.name}.%20Saya:%20...%20Domisili:%20..`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block py-3 bg-primary text-white text-center rounded-md font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-sm"
                aria-label={`Hubungi untuk test drive ${vehicle.name}`}
              >
                Hubungi Untuk Test Drive
              </a>
              <a
                href="/kontak"
                className="w-full block py-3 border border-gray-300 text-gray-700 text-center rounded-md font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-white"
                aria-label={`Pelajari lebih lanjut tentang ${vehicle.name}`}
              >
                Pelajari Lebih Lanjut
              </a>
            </div>
          </div>
        </div>

        {/* Vehicle description and color picker with improved layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
          {/* Vehicle description with enhanced styling */}
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
            ref={aboutSectionRef}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="h-6 w-1.5 bg-primary rounded-full inline-block mr-3" />
              Tentang {vehicle.name}
            </h2>
            <div className="prose prose-md max-w-none">
              <p>
                {vehicle.name} dirancang untuk memenuhi kebutuhan pengguna yang
                menginginkan kendaraan dengan performa tinggi dan fitur modern.
                Setiap detail dalam desain dan teknologi dipilih untuk
                memberikan pengalaman berkendara yang optimal.
              </p>
              {vehicle.features?.[0] && (
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

          {/* Color picker - with improved card design */}
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
            ref={colorsSectionRef}
          >
            {vehicle.colors?.length > 0 ? (
              <ModelColorPicker modelId={vehicle.id} colors={vehicle.colors} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 italic">
                  Informasi warna sedang diperbarui
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Specifications Section - Improved with better UI */}
        {vehicle.specifications && vehicle.specifications.length > 0 && (
          <div
            className="mb-16 bg-white p-6 rounded-lg shadow-sm border border-gray-100"
            ref={specsSectionRef}
            id="specifications"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="h-6 w-1.5 bg-primary rounded-full inline-block mr-3" />
                Spesifikasi Lengkap {vehicle.name}
              </h2>

              <div className="mt-4 md:mt-0 flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                <Info size={16} className="mr-2 text-primary" />
                <span>Klik kategori untuk melihat detail</span>
              </div>
            </div>

            {/* Specification Categories Navigation with improved styling */}
            <div className="flex overflow-x-auto pb-2 mb-6 gap-2 scrollbar-hide">
              {vehicle.specifications.map(
                (
                  category: {
                    categoryTitle: string;
                    specs: Array<{ key: string; value: string }>;
                  },
                  index: number
                ) => (
                  <button
                    key={`spec-nav-${category.categoryTitle}`}
                    onClick={() =>
                      setActiveSpecCategory(category.categoryTitle)
                    }
                    type="button"
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                      activeSpecCategory === category.categoryTitle
                        ? "bg-primary text-white shadow-sm"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {category.categoryTitle}
                  </button>
                )
              )}
            </div>

            {/* Specifications Content with improved card design */}
            <div className="space-y-4">
              {vehicle.specifications.map((category, catIndex) => (
                <div
                  key={`spec-cat-${category.categoryTitle}`}
                  className={`bg-gray-50 rounded-lg border border-gray-100 overflow-hidden transition-all duration-300 ${
                    activeSpecCategory === category.categoryTitle
                      ? "shadow-sm"
                      : ""
                  }`}
                >
                  {/* Category Header - Always visible and clickable with improved styling */}
                  <button
                    onClick={() => toggleSpecCategory(category.categoryTitle)}
                    type="button"
                    className={`w-full flex items-center justify-between p-5 text-left ${
                      activeSpecCategory === category.categoryTitle
                        ? "bg-gray-100/50 border-b border-gray-200"
                        : ""
                    }`}
                  >
                    <h3 className="text-lg font-semibold text-gray-800">
                      {category.categoryTitle}
                    </h3>
                    <div
                      className={`text-primary transition-transform duration-300 ${
                        activeSpecCategory === category.categoryTitle
                          ? "rotate-180"
                          : ""
                      }`}
                    >
                      <ChevronDown size={20} />
                    </div>
                  </button>

                  {/* Category Content - Only visible when active, with improved styling */}
                  {activeSpecCategory === category.categoryTitle && (
                    <div className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {category.specs.map((spec, specIndex) => (
                          <div
                            key={`spec-item-${category.categoryTitle}-${spec.key}`}
                            className="bg-white p-4 rounded-md border border-gray-100 hover:shadow-sm transition-shadow"
                          >
                            <div className="text-xs font-medium text-gray-500 mb-1">
                              {spec.key}
                            </div>
                            <div className="text-sm font-semibold text-gray-800">
                              {spec.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery Section with improved card design */}
        {vehicle.gallery && vehicle.gallery.length > 0 && (
          <div
            className="mb-16 bg-white p-6 rounded-lg shadow-sm border border-gray-100"
            ref={gallerySectionRef}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="h-6 w-1.5 bg-primary rounded-full inline-block mr-3" />
              Galeri {vehicle.name}
            </h2>
            <ModelGallery
              modelId={vehicle.id}
              modelName={vehicle.name}
              gallery={vehicle.gallery}
            />
          </div>
        )}

        {/* Related vehicles with improved card design */}
        <div
          className="mb-16 bg-white p-6 rounded-lg shadow-sm border border-gray-100"
          ref={relatedVehiclesSectionRef}
        >
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12 flex items-center justify-center">
            <span className="h-6 w-1.5 bg-primary rounded-full inline-block mr-3" />
            Tipe Mobil GWM Lainnya
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedVehicles.map((relatedVehicle) => (
              <div
                key={relatedVehicle.id}
                className="bg-gray-50 rounded-lg shadow-sm overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-md group border border-gray-100"
              >
                <Link
                  to="/tipe-mobil/$model"
                  params={{ model: relatedVehicle.id }}
                  className="block h-full"
                >
                  <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                    <LazyLoadImage
                      src={relatedVehicle.featuredImage}
                      alt={`${relatedVehicle.name} - ${
                        relatedVehicle.categoryDisplay ||
                        relatedVehicle.category
                      } main image`}
                      effect="blur"
                      width="100%"
                      height="100%"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                    <span className="text-primary font-medium flex items-center">
                      Lihat Detail
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="ml-1.5 transition-transform duration-300 group-hover:translate-x-1"
                        aria-label="Arrow right"
                        role="img"
                      >
                        <path
                          d="M5 12H19M19 12L13 6M19 12L13 18"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Call to action with improved card design */}
        <div className="mt-24 bg-primary/5 rounded-xl p-8 md:p-12 border border-primary/10 shadow-sm">
          <div className="text-center">
            <h2 className="text-2xl md:text-2xl font-bold text-gray-900 mb-4">
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
                className="px-6 py-3 bg-white text-gray-800 rounded-md font-medium text-center hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm"
              >
                Hubungi Kami
              </a>
              <a
                href={`https://wa.me/6287774377422?text=Hello,%20Kak%20ARKAN.%20Saya%20ingin%20tanya%20tentang%20${vehicle.name}.%20Saya:%20...%20Domisili:%20..`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-green-600 text-white rounded-md font-medium text-center hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 shadow-sm"
                aria-label={`Chat WhatsApp about ${vehicle.name}`}
              >
                Chat WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> a2929348136fd28c0ba03cc9d808f1289b7b4076
