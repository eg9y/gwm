import { createFileRoute, useLoaderData } from "@tanstack/react-router";

import Hero from "../components/Hero";
import ModelShowcase from "../components/ModelShowcase";
import Promos from "../components/Promos";
import { seo } from "../utils/seo";
import {
  getHomepageConfig,
  type HomepageConfigWithSections,
  type HomepageFeatureSectionDb,
} from "../server/homepage";

export const Route = createFileRoute("/")({
  component: HomePage,
  // Add loader to fetch dynamic homepage data
  loader: async () => {
    try {
      const data = await getHomepageConfig();
      if (!data) {
        // Provide default/empty data if config is missing
        return { config: null, featureSections: [] };
      }
      return {
        config: data, // Base config for Hero
        featureSections: data.featureSections || [], // Sections for ModelShowcase
      };
    } catch (error) {
      console.error("Failed to load homepage data:", error);
      // Return default/empty state on error
      return { config: null, featureSections: [] };
    }
  },
  // Update head metadata using fetched data if available
  head: (params) => {
    const data = params.loaderData as {
      config: HomepageConfigWithSections | null;
      featureSections: HomepageFeatureSectionDb[];
    };
    const config = data?.config;
    // Use fetched image URLs or fallbacks
    const desktopImageUrl =
      config?.heroDesktopImageUrl || "/placeholder-desktop.webp"; // Replace with actual fallback
    const mobileImageUrl =
      config?.heroMobileImageUrl || "/placeholder-mobile.webp"; // Replace with actual fallback
    const title = config?.heroTitle || "GWM Indonesia";
    const description =
      config?.heroSubtitle ||
      "Great Wall Motors - Premium SUVs and Innovative Technology";

    return {
      meta: [
        ...seo({
          title: title,
          description: description,
          keywords:
            "GWM, Great Wall Motors, Haval H6, Haval Jolion, Tank 300, Tank 500, SUV Premium, Mobil Hybrid, Indonesia", // Keep keywords or make dynamic?
          image: desktopImageUrl, // Use fetched image
        }),
      ],
      links: [
        {
          rel: "canonical",
          href: "https://gwmindonesia.com/", // Updated domain
        },
        // Preload LCP images using fetched URLs
        {
          rel: "preload",
          href: desktopImageUrl,
          as: "image",
          media: "(min-width: 640px)",
          fetchpriority: "high",
        },
        {
          rel: "preload",
          href: mobileImageUrl,
          as: "image",
          media: "(max-width: 639px)",
          fetchpriority: "high",
        },
      ],
    };
  },
});

function HomePage() {
  const { config, featureSections } = useLoaderData({ from: "/" });
  // Remove router and state management for sections, as it's now just content blocks

  // Use fallback defaults if config is null
  const heroConfig = config || {
    heroDesktopImageUrl: "/placeholder-desktop.webp",
    heroMobileImageUrl: "/placeholder-mobile.webp",
    heroTitle: "GWM Indonesia",
    heroSubtitle: "Welcome",
    heroPrimaryButtonText: "Explore",
    heroPrimaryButtonLink: "/",
    heroSecondaryButtonText: "Contact",
    heroSecondaryButtonLink: "/kontak",
  };

  return (
    <div className="relative min-h-screen">
      {/* Remove snap scrolling containers */}
      {/* Hero Section using dynamic data */}
      <div id="hero" className="section-container-auto-height">
        <Hero
          desktopImage={heroConfig.heroDesktopImageUrl}
          mobileImage={heroConfig.heroMobileImageUrl}
          title={heroConfig.heroTitle}
          subtitle={heroConfig.heroSubtitle ?? undefined}
          primaryButtonText={heroConfig.heroPrimaryButtonText ?? undefined}
          secondaryButtonText={heroConfig.heroSecondaryButtonText ?? undefined}
          primaryButtonLink={heroConfig.heroPrimaryButtonLink ?? undefined}
          secondaryButtonLink={heroConfig.heroSecondaryButtonLink ?? undefined}
        />
      </div>

      {/* Feature Sections (previously Model Showcase) using dynamic data */}
      {featureSections.map((section, index) => (
        <div
          key={section.id || index} // Use section ID or index as key
          id={`feature-${index}`} // Create dynamic ID
          className="section-container-auto-height"
        >
          <ModelShowcase
            // Pass arrays of image URLs
            desktopImageUrls={section.desktopImageUrls || []} // Pass desktop URL array
            mobileImageUrls={section.mobileImageUrls || []} // Pass mobile URL array
            imageAlt={section.imageAlt ?? undefined}
            title={section.title}
            subtitle={section.subtitle ?? undefined}
            description={section.description}
            features={section.features || []} // Ensure features is an array
            primaryButtonText={section.primaryButtonText ?? undefined}
            primaryButtonLink={section.primaryButtonLink ?? undefined}
            secondaryButtonText={section.secondaryButtonText ?? undefined}
            secondaryButtonLink={section.secondaryButtonLink ?? undefined}
            isReversed={index % 2 !== 0} // Keep alternating layout
          />
        </div>
      ))}

      {/* Promos section - Keep as is or make dynamic later */}
      <div id="promos" className="section-container-auto-height grainy-bg">
        <Promos />
      </div>
    </div>
  );
}
