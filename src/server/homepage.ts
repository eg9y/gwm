import { db } from "../db";
import { homepageConfig, homepageFeatureSections } from "../db/schema";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";

// Define the schema for a single feature section for validation
const featureSectionSchema = z.object({
  id: z.number().optional(), // Optional for existing sections
  order: z.number(),
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  desktopImageUrl: z
    .string()
    .url("Must be a valid URL")
    .min(1, "Desktop Image URL is required"),
  mobileImageUrl: z.string().url("Must be a valid URL").optional(), // Mobile image URL is optional
  imageAlt: z.string().optional(),
  features: z.array(z.string()).optional(),
  primaryButtonText: z.string().optional(),
  primaryButtonLink: z.string().optional().or(z.literal("")),
  secondaryButtonText: z.string().optional(),
  secondaryButtonLink: z.string().optional().or(z.literal("")),
});

// Define the schema for updating homepage config, including feature sections
const homepageConfigUpdateSchema = z.object({
  heroDesktopImageUrl: z.string().url().min(1, "Desktop image URL is required"),
  heroMobileImageUrl: z.string().url().min(1, "Mobile image URL is required"),
  heroTitle: z.string().min(1, "Hero title is required"),
  heroSubtitle: z.string().optional(),
  heroPrimaryButtonText: z.string().optional(),
  heroPrimaryButtonLink: z.string().optional().or(z.literal("")), // Allow empty string
  heroSecondaryButtonText: z.string().optional(),
  heroSecondaryButtonLink: z.string().optional().or(z.literal("")), // Allow empty string
  metaTitle: z.string().optional(), // Added meta title
  metaDescription: z.string().optional(), // Added meta description
  // Ensure feature sections is truly optional
  featureSections: z
    .array(
      z.object({
        id: z.number().optional(), // Optional for existing sections
        order: z.number().optional().or(z.number()),
        title: z.string().min(1, "Title is required"),
        subtitle: z.string().optional(),
        description: z.string().min(1, "Description is required"),
        desktopImageUrl: z
          .string()
          .url("Must be a valid URL")
          .min(1, "Desktop Image URL is required"),
        mobileImageUrl: z.string().url("Must be a valid URL").optional(), // Make mobile URL optional
        imageAlt: z.string().optional(),
        features: z.array(z.string()).optional(),
        primaryButtonText: z.string().optional(),
        primaryButtonLink: z.string().optional().or(z.literal("")),
        secondaryButtonText: z.string().optional(),
        secondaryButtonLink: z.string().optional().or(z.literal("")),
        // Support for arrays (from client side format)
        desktopImageUrls: z.array(z.string()).optional(),
        mobileImageUrls: z.array(z.string()).optional(),
      })
    )
    .optional(), // Keep .optional()
});

// Type for the homepage configuration data, including sections
export type HomepageConfig = typeof homepageConfig.$inferSelect;
export type HomepageFeatureSectionDb =
  typeof homepageFeatureSections.$inferSelect;
export type HomepageConfigWithSections = HomepageConfig & {
  metaTitle?: string | null;
  metaDescription?: string | null;
  featureSections: HomepageFeatureSectionDb[];
};

/**
 * Retrieves the homepage configuration along with its feature sections.
 * Assumes a single config row with id = 'main'.
 */
export const getHomepageConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<HomepageConfigWithSections | null> => {
    try {
      const config = await db
        .select()
        .from(homepageConfig)
        .where(eq(homepageConfig.id, "main"))
        .limit(1)
        .get();

      if (!config) {
        return null;
      }

      const sections = await db
        .select()
        .from(homepageFeatureSections)
        .where(eq(homepageFeatureSections.homepageConfigId, config.id))
        .orderBy(asc(homepageFeatureSections.order));

      return { ...config, featureSections: sections };
    } catch (error) {
      console.error("Error fetching homepage config with sections:", error);
      throw new Error("Failed to fetch homepage configuration");
    }
  }
);

/**
 * Updates the homepage configuration and its associated feature sections.
 * Uses a transaction to ensure atomicity.
 */
export const updateHomepageConfig = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    // For debugging - log the structure of the incoming data
    console.log(
      "Validating homepage config data:",
      JSON.stringify(data, null, 2).substring(0, 500) + "..."
    );

    const result = homepageConfigUpdateSchema.safeParse(data);
    if (!result.success) {
      // Log the detailed error for server-side debugging
      console.error(
        "Homepage config validation failed:",
        result.error.flatten()
      );

      // Try again with a more lenient approach if needed
      try {
        // Cast to any to handle processing
        const anyData = data as any;

        // Ensure meta fields are strings if present
        if (anyData.metaTitle === null) delete anyData.metaTitle;
        if (anyData.metaDescription === null) delete anyData.metaDescription;

        // Process feature sections if they exist
        if (anyData.featureSections && Array.isArray(anyData.featureSections)) {
          anyData.featureSections = anyData.featureSections.map(
            (section: any) => {
              // Handle mobile image URLs being empty arrays
              if (
                section.mobileImageUrls &&
                Array.isArray(section.mobileImageUrls) &&
                section.mobileImageUrls.length === 0
              ) {
                section.mobileImageUrl =
                  section.desktopImageUrl ||
                  (section.desktopImageUrls &&
                  section.desktopImageUrls.length > 0
                    ? section.desktopImageUrls[0]
                    : undefined);
              } else if (
                section.mobileImageUrls &&
                Array.isArray(section.mobileImageUrls) &&
                section.mobileImageUrls.length > 0
              ) {
                section.mobileImageUrl = section.mobileImageUrls[0];
              }

              // Ensure desktopImageUrl is set
              if (
                !section.desktopImageUrl &&
                section.desktopImageUrls &&
                Array.isArray(section.desktopImageUrls) &&
                section.desktopImageUrls.length > 0
              ) {
                section.desktopImageUrl = section.desktopImageUrls[0];
              }

              return section;
            }
          );
        }

        // Try validation again
        const secondAttempt = homepageConfigUpdateSchema.safeParse(anyData);
        if (secondAttempt.success) {
          return secondAttempt.data;
        }

        // If still failing, log that too
        console.error(
          "Second validation attempt failed:",
          secondAttempt.error.flatten()
        );
      } catch (err) {
        console.error("Error in fallback validation:", err);
      }

      // Provide a user-friendly error message
      throw new Error(
        `Validation failed: ${JSON.stringify(result.error.flatten().fieldErrors)}`
      );
    }
    return result.data;
  })
  .handler(async ({ data }) => {
    // Use featureSections or default to empty array if optional and not provided
    const { featureSections = [], ...configData } = data;
    const configId = "main";

    try {
      // Use a transaction to handle multiple dependent operations
      const result = await db.transaction(async (tx) => {
        // 1. Upsert the main homepage configuration
        const upsertedConfig = await tx
          .insert(homepageConfig)
          .values({
            ...configData,
            id: configId,
            updatedAt: new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: homepageConfig.id,
            set: { ...configData, updatedAt: new Date().toISOString() },
          })
          .returning()
          .get();

        // 2. Delete existing feature sections for this homepage
        await tx
          .delete(homepageFeatureSections)
          .where(eq(homepageFeatureSections.homepageConfigId, configId));

        // 3. Insert the new feature sections
        if (featureSections.length > 0) {
          const sectionsToInsert = featureSections.map((section, index) => {
            // Process image data, supporting both single URLs and arrays

            // Handle desktop images (required)
            const desktopImageUrl =
              section.desktopImageUrl ||
              (section.desktopImageUrls && section.desktopImageUrls.length > 0
                ? section.desktopImageUrls[0]
                : "");

            const desktopImageUrls =
              section.desktopImageUrls ||
              (desktopImageUrl ? [desktopImageUrl] : []);

            // Handle mobile images (optional, fallback to desktop)
            const hasMobileImages =
              section.mobileImageUrl ||
              (section.mobileImageUrls && section.mobileImageUrls.length > 0);

            // For mobile, if we have no mobile images, use desktop as fallback
            const mobileImageUrl =
              section.mobileImageUrl ||
              (section.mobileImageUrls && section.mobileImageUrls.length > 0
                ? section.mobileImageUrls[0]
                : desktopImageUrl);

            const mobileImageUrls = hasMobileImages
              ? section.mobileImageUrls ||
                (section.mobileImageUrl ? [section.mobileImageUrl] : [])
              : desktopImageUrls; // Fallback to desktop

            return {
              ...section,
              homepageConfigId: configId,
              order: index, // Ensure order is set based on the array index
              features: section.features || [], // Ensure features is an array
              desktopImageUrls: desktopImageUrls, // Use processed arrays
              mobileImageUrls: mobileImageUrls, // Use processed arrays
              imageAlt: section.imageAlt || `Feature section ${index + 1}`, // Provide default alt text
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(), // Set createdAt for new inserts
              // Remove id if it exists, as it's auto-incremented
              id: undefined,
            };
          });
          await tx.insert(homepageFeatureSections).values(sectionsToInsert);
        }

        // 4. Fetch the updated sections to return them
        const updatedSections = await tx
          .select()
          .from(homepageFeatureSections)
          .where(eq(homepageFeatureSections.homepageConfigId, configId))
          .orderBy(asc(homepageFeatureSections.order));

        return { ...upsertedConfig, featureSections: updatedSections };
      });

      console.log("Homepage config and sections updated successfully.");
      return {
        success: true,
        config: result,
        message: "Homepage configuration updated successfully.",
      };
    } catch (error) {
      console.error("Error updating homepage config and sections:", error);
      return {
        success: false,
        message: "Failed to update homepage configuration.",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
