import { createFileRoute, useLoaderData } from "@tanstack/react-router";

import Hero from "../components/Hero";
import ModelShowcase from "../components/ModelShowcase";
import Promos from "../components/Promos";
import { seo } from "../utils/seo";
import {
  getHomepageConfig,
  type HomepageConfigWithSections,
  type HomepageFeatureSectionUnion,
} from "../server/homepage";
import FeatureCardsGridSection from "../components/FeatureCardsGridSection";
import Banner from "../components/Banner";

export const Route = createFileRoute("/")({
  component: HomePage,
  // Update loader to return HomepageConfigWithSections | null directly
  loader: async (): Promise<HomepageConfigWithSections | null> => {
    try {
      const data = await getHomepageConfig();
      console.log("data", data);
      // Return data directly or null
      return data ?? null; // Use null coalescing for clarity
    } catch (error) {
      console.log("ajjay", error);
      console.error("Failed to load homepage data:", error);
      // Return null on error
      return null;
    }
  },
  // Update head metadata using fetched data if available
  head: (params) => {
    // Loader data is now HomepageConfigWithSections | null
    const config = params.loaderData;

    // Use fetched title/description or fallbacks
    const title = config?.metaTitle || config?.heroTitle || "GWM Indonesia";
    const description =
      config?.metaDescription ||
      config?.heroSubtitle ||
      "Great Wall Motors - Premium SUVs and Innovative Technology";

    // Use fetched image URLs or fallbacks
    const desktopImageUrl =
      config?.heroDesktopImageUrl || "/placeholder-desktop.webp"; // Replace with actual fallback
    const mobileImageUrl =
      config?.heroMobileImageUrl || "/placeholder-mobile.webp"; // Replace with actual fallback

    return {
      // Use the dynamically determined title
      title: title,
      meta: [
        ...seo({
          // Pass the dynamic title and description to the seo util
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
  // Load data directly - it's HomepageConfigWithSections | null
  const homepageData = useLoaderData({ from: "/" });

  // Handle the case where data might be null
  if (!homepageData) {
    // Optionally render a loading state or a default empty state
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <p>Loading homepage...</p> {/* Or render a basic fallback */}
      </div>
    );
  }

  // Destructure data now that we know it's not null
  const { featureSections = [], ...heroConfig } = homepageData;

  // No need for fallback defaults here as heroConfig is derived from non-null homepageData
  // const heroConfig = config || { ... }; // Removed

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

      {/* Feature Sections - Conditionally render based on type */}
      {featureSections.map((section, index) => {
        // Use a switch statement for clearer type narrowing
        switch (section.sectionType) {
          case "feature_cards_grid": {
            // section is now correctly typed as FeatureCardsGridSectionType
            const typeData = section.typeSpecificData; // No need for 'as any'
            return (
              <div
                key={section.id || index}
                id={`feature-${index}`}
                className="section-container-auto-height"
              >
                <FeatureCardsGridSection
                  title={section.title}
                  subtitle={section.subtitle}
                  cards={typeData.cards || []} // Access typeData directly
                />
              </div>
            );
          }
          case "default": {
            // section is now correctly typed as DefaultSectionType
            const typeData = section.typeSpecificData; // No need for 'as any'
            return (
              <div
                key={section.id || index} // Use section ID or index as key
                id={`feature-${index}`} // Create dynamic ID
                className="section-container-auto-height"
              >
                <ModelShowcase
                  // Pass data from typeSpecificData for default type
                  desktopImageUrls={typeData.desktopImageUrls || []}
                  mobileImageUrls={typeData.mobileImageUrls || []}
                  imageAlt={typeData.imageAlt}
                  title={section.title}
                  subtitle={section.subtitle}
                  description={typeData.description}
                  features={typeData.features || []}
                  primaryButtonText={typeData.primaryButtonText}
                  primaryButtonLink={typeData.primaryButtonLink}
                  secondaryButtonText={typeData.secondaryButtonText}
                  secondaryButtonLink={typeData.secondaryButtonLink}
                  isReversed={index % 2 !== 0} // Keep alternating layout
                />
              </div>
            );
          }
          case "banner": {
            // section is now correctly typed as BannerSectionType
            const typeData = section.typeSpecificData; // No need for 'as any'
            return (
              <div
                key={section.id || index}
                id={`feature-${index}`}
                className="section-container-auto-height w-full max-w-full p-0 m-0" // Basic container, adjust styling as needed
              >
                <Banner
                  imageUrl={typeData.imageUrl}
                  altText={typeData.altText}
                  link={typeData.link}
                />
              </div>
            );
          }
          default:
            // Optional: Handle unknown section types explicitly or return null
            // The switch statement with exhaustive checks might make this less necessary,
            // but it's good practice for future changes.
            // We can assert never here to ensure all types are handled.
            const _exhaustiveCheck: never = section;
            console.warn(
              `Unknown section type encountered during render: ${(_exhaustiveCheck as any)?.sectionType}`
            );
            return null;
        }
      })}

      {/* Promos section - Keep as is or make dynamic later */}
      <div id="promos" className="section-container-auto-height grainy-bg">
        <Promos />
      </div>
    </div>
  );
}
