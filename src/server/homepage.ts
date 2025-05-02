import { db } from "../db";
import { homepageConfig, homepageFeatureSections } from "../db/schema";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";

// --- Section Type Schemas ---

// Base schema common to all section types
const baseSectionSchema = z.object({
  id: z.number().optional(),
  order: z.number(),
  // title is now the main title for composite sections, or the identifying title
  title: z.string().min(1, "Section title/identifier is required"),
  subtitle: z.string().optional(), // Optional subtitle common to most types
});

// Schema for the original 'default' section type (ModelShowcase)
const defaultSectionDataSchema = z.object({
  description: z.string().min(1, "Description is required"),
  desktopImageUrls: z
    .array(z.string().url())
    .min(1, "At least one Desktop Image URL is required"),
  mobileImageUrls: z.array(z.string().url()).optional().default([]),
  imageAlt: z.string().optional(),
  features: z.array(z.string()).optional().default([]),
  primaryButtonText: z.string().optional(),
  primaryButtonLink: z.string().optional().or(z.literal("")),
  secondaryButtonText: z.string().optional(),
  secondaryButtonLink: z.string().optional().or(z.literal("")),
});

const defaultSectionSchema = baseSectionSchema.extend({
  sectionType: z.literal("default"),
  typeSpecificData: defaultSectionDataSchema,
});

// Schema for the new 'feature_cards_grid' section type
const featureCardSchema = z.object({
  // No separate ID needed here unless cards become independently managed
  imageUrl: z
    .string()
    .url("Card image URL must be valid")
    .min(1, "Card image is required"),
  title: z.string().min(1, "Card title is required"),
  description: z.string().min(1, "Card description is required"),
  link: z.string().optional().or(z.literal("")), // Optional link for the card
});

const featureCardsGridDataSchema = z.object({
  cards: z
    .array(featureCardSchema)
    .min(1, "At least one feature card is required")
    .max(3, "Maximum of 3 feature cards allowed"), // Example constraint
});

const featureCardsGridSchema = baseSectionSchema.extend({
  sectionType: z.literal("feature_cards_grid"),
  // Main title/subtitle from base schema are used for the overall section header
  typeSpecificData: featureCardsGridDataSchema,
});

// Schema for the new 'banner' section type data
const bannerSectionDataSchema = z.object({
  imageUrl: z
    .string()
    .url("Image URL must be valid")
    .min(1, "Image is required"),
  altText: z.string().optional(),
  link: z.string().optional().or(z.literal("")), // Optional link for the banner
});

const bannerSectionSchema = baseSectionSchema.extend({
  sectionType: z.literal("banner"),
  typeSpecificData: bannerSectionDataSchema,
});

// --- Discriminated Union for Section Validation ---
const sectionUnionSchema = z.discriminatedUnion("sectionType", [
  defaultSectionSchema,
  featureCardsGridSchema,
  bannerSectionSchema,
  // Add other section type schemas here in the future
]);

// --- Homepage Config Update Schema (using the union) ---
const homepageConfigUpdateSchema = z.object({
  heroDesktopImageUrl: z.string().url().min(1, "Desktop image URL is required"),
  heroMobileImageUrl: z.string().url().min(1, "Mobile image URL is required"),
  heroTitle: z.string().min(1, "Hero title is required"),
  heroSubtitle: z.string().optional(),
  heroPrimaryButtonText: z.string().optional(),
  heroPrimaryButtonLink: z.string().optional().or(z.literal("")), // Allow empty string
  heroSecondaryButtonText: z.string().optional(),
  heroSecondaryButtonLink: z.string().optional().or(z.literal("")), // Allow empty string
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  featureSections: z.array(sectionUnionSchema).optional().default([]), // Use the discriminated union
});

// Export the schemas needed by the database schema definition
export {
  defaultSectionDataSchema,
  featureCardsGridDataSchema,
  bannerSectionDataSchema,
};

// --- Types ---
export type HomepageConfig = typeof homepageConfig.$inferSelect;
// Existing DB schema type (includes all raw columns)
export type HomepageFeatureSectionDb =
  typeof homepageFeatureSections.$inferSelect;
// Type derived from the discriminated union (useful for frontend/backend data consistency)
export type HomepageFeatureSectionUnion = z.infer<typeof sectionUnionSchema>;

export type HomepageConfigWithSections = HomepageConfig & {
  metaTitle?: string | null;
  metaDescription?: string | null;
  // Use the union type for feature sections after processing
  featureSections: HomepageFeatureSectionUnion[];
};

// Helper to map raw DB data to the union type, handling legacy sections
function mapDbSectionToUnion(
  section: HomepageFeatureSectionDb
): HomepageFeatureSectionUnion {
  const base = {
    id: section.id,
    order: section.order,
    title: section.title,
    subtitle: section.subtitle ?? undefined,
  };

  if (section.sectionType === "feature_cards_grid") {
    // Explicitly cast and validate/default the typeSpecificData
    const gridData = section.typeSpecificData as
      | z.infer<typeof featureCardsGridDataSchema>
      | null
      | undefined;
    return {
      ...base,
      sectionType: "feature_cards_grid",
      // Ensure the returned structure matches featureCardsGridSchema
      typeSpecificData: { cards: gridData?.cards || [] }, // Default to empty array if data is null/missing
    };
  }

  if (section.sectionType === "banner") {
    // Explicitly cast and validate/default the typeSpecificData
    const bannerData = section.typeSpecificData as
      | z.infer<typeof bannerSectionDataSchema>
      | null
      | undefined;
    return {
      ...base,
      sectionType: "banner",
      // Ensure the returned structure matches bannerSectionSchema
      typeSpecificData: {
        imageUrl: bannerData?.imageUrl || "", // Provide default empty string
        altText: bannerData?.altText ?? undefined,
        link: bannerData?.link ?? undefined,
      },
    };
  }

  // Default case: Handle 'default' section type (map legacy fields)
  const typeSpecificData: z.infer<typeof defaultSectionDataSchema> = {
    description: section.description || "", // Provide default
    desktopImageUrls: section.desktopImageUrls || [], // Provide default
    mobileImageUrls: section.mobileImageUrls || [], // Provide default
    imageAlt: section.imageAlt ?? undefined,
    features: section.features || [], // Provide default
    primaryButtonText: section.primaryButtonText ?? undefined,
    primaryButtonLink: section.primaryButtonLink ?? undefined,
    secondaryButtonText: section.secondaryButtonText ?? undefined,
    secondaryButtonLink: section.secondaryButtonLink ?? undefined,
  };

  return {
    ...base,
    sectionType: "default",
    typeSpecificData: typeSpecificData,
  };
}

/**
 * Retrieves the homepage configuration along with its feature sections.
 * Maps raw section data to the structured union type.
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

      const sectionsDb = await db
        .select()
        .from(homepageFeatureSections)
        .where(eq(homepageFeatureSections.homepageConfigId, config.id))
        .orderBy(asc(homepageFeatureSections.order));

      // Map DB sections to the union type
      const sectionsUnion = sectionsDb.map(mapDbSectionToUnion);

      return { ...config, featureSections: sectionsUnion }; // Return mapped sections
    } catch (error) {
      console.error("Error fetching homepage config with sections:", error);
      throw new Error("Failed to fetch homepage configuration");
    }
  }
);

/**
 * Updates the homepage configuration and its associated feature sections.
 * Uses a transaction to ensure atomicity and validates using discriminated union.
 */
export const updateHomepageConfig = createServerFn({ method: "POST" })
  // Use the updated schema with discriminated union for validation
  .validator((data: unknown) => {
    console.log(
      `Validating homepage config update: ${JSON.stringify(data, null, 2).substring(0, 500)}...`
    );
    const result = homepageConfigUpdateSchema.safeParse(data);
    if (!result.success) {
      console.error(
        "Homepage config validation failed:",
        result.error.flatten()
      );
      // Provide a user-friendly error message based on Zod's error
      throw new Error(
        `Validation failed: ${JSON.stringify(result.error.flatten().fieldErrors)}`
      );
    }
    console.log("Homepage config validation successful.");
    return result.data; // Return validated data
  })
  .handler(async ({ data }) => {
    // data is now validated according to homepageConfigUpdateSchema
    const { featureSections = [], ...configData } = data;
    const configId = "main";
    const now = new Date().toISOString();

    try {
      const result = await db.transaction(async (tx) => {
        // 1. Upsert the main homepage configuration
        const upsertedConfig = await tx
          .insert(homepageConfig)
          .values({ ...configData, id: configId, updatedAt: now })
          .onConflictDoUpdate({
            target: homepageConfig.id,
            set: { ...configData, updatedAt: now },
          })
          .returning()
          .get();

        // 2. Delete existing feature sections for this homepage
        await tx
          .delete(homepageFeatureSections)
          .where(eq(homepageFeatureSections.homepageConfigId, configId));

        // 3. Insert the new/updated feature sections
        if (featureSections.length > 0) {
          // Explicitly type the mapped array to match Drizzle's expected insert type
          const sectionsToInsert: (typeof homepageFeatureSections.$inferInsert)[] =
            featureSections.map((section, index) => {
              // Base data structure matching the DB schema (nullable fields)
              let insertData: typeof homepageFeatureSections.$inferInsert = {
                homepageConfigId: configId,
                order: index,
                sectionType: section.sectionType,
                title: section.title,
                subtitle: section.subtitle,
                typeSpecificData: section.typeSpecificData as any, // Store validated data, cast for Drizzle type
                updatedAt: now,
                createdAt: now,
                // Initialize legacy fields as null or empty arrays
                description: null,
                desktopImageUrls: [],
                mobileImageUrls: [],
                imageAlt: null,
                features: [],
                primaryButtonText: null,
                primaryButtonLink: null,
                secondaryButtonText: null,
                secondaryButtonLink: null,
              };

              // Populate legacy fields only if the section type is 'default'
              if (section.sectionType === "default") {
                insertData.description = section.typeSpecificData.description;
                insertData.desktopImageUrls =
                  section.typeSpecificData.desktopImageUrls;
                insertData.mobileImageUrls =
                  section.typeSpecificData.mobileImageUrls;
                insertData.imageAlt = section.typeSpecificData.imageAlt;
                insertData.features = section.typeSpecificData.features;
                insertData.primaryButtonText =
                  section.typeSpecificData.primaryButtonText;
                insertData.primaryButtonLink =
                  section.typeSpecificData.primaryButtonLink;
                insertData.secondaryButtonText =
                  section.typeSpecificData.secondaryButtonText;
                insertData.secondaryButtonLink =
                  section.typeSpecificData.secondaryButtonLink;
              }

              // Remove undefined values (though defaults above should prevent this)
              Object.keys(insertData).forEach((key) => {
                if (insertData[key as keyof typeof insertData] === undefined) {
                  delete insertData[key as keyof typeof insertData];
                }
              });

              return insertData; // Return the correctly typed object
            });
          await tx.insert(homepageFeatureSections).values(sectionsToInsert);
        }

        // 4. Fetch the updated sections and map them to the union type for return
        const updatedSectionsDb = await tx
          .select()
          .from(homepageFeatureSections)
          .where(eq(homepageFeatureSections.homepageConfigId, configId))
          .orderBy(asc(homepageFeatureSections.order));

        const updatedSectionsUnion = updatedSectionsDb.map(mapDbSectionToUnion);

        return { ...upsertedConfig, featureSections: updatedSectionsUnion };
      });

      console.log("Homepage config and sections updated successfully.");
      return {
        success: true,
        config: result, // Return the config with sections mapped to union types
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
