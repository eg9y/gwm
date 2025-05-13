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

// Schema for individual gallery images (Backend)
const galleryImageServerSchema = z.object({
  imageUrl: z
    .string()
    .url("Image URL must be valid")
    .min(1, "Image is required"),
  altText: z.string().optional(),
});

// Schema for the 'gallery' section type data (Backend)
const gallerySectionDataServerSchema = z.object({
  images: z
    .array(galleryImageServerSchema)
    .min(1, "At least one image is required"),
});

const gallerySectionServerSchema = baseSectionSchema.extend({
  sectionType: z.literal("gallery"),
  typeSpecificData: gallerySectionDataServerSchema,
});

// --- Discriminated Union for Section Validation ---
const sectionUnionSchema = z.discriminatedUnion("sectionType", [
  defaultSectionSchema,
  featureCardsGridSchema,
  bannerSectionSchema,
  gallerySectionServerSchema, // Add gallery schema for backend
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
  gallerySectionDataServerSchema, // Export gallery schema
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
): HomepageFeatureSectionUnion | null {
  // Return null if parsing fails
  const base = {
    id: section.id,
    order: section.order,
    title: section.title,
    subtitle: section.subtitle ?? undefined,
  };

  // Initialize parsedData with proper type
  const parsedData: Record<string, unknown> | null = (() => {
    try {
      if (
        section.typeSpecificData &&
        typeof section.typeSpecificData === "string"
      ) {
        return JSON.parse(section.typeSpecificData);
      }
      return null;
    } catch (error) {
      console.error(
        `Error parsing typeSpecificData JSON for section ID ${section.id}:`,
        section.typeSpecificData, // Log the problematic data
        error
      );
      return null;
    }
  })();

  // Validate sectionType *before* accessing parsedData based on it
  if (
    !["default", "feature_cards_grid", "banner", "gallery"].includes(
      section.sectionType || ""
    )
  ) {
    console.warn(
      `Invalid section type "${section.sectionType}" for section ID ${section.id}. Skipping.`
    );
    return null;
  }

  if (section.sectionType === "feature_cards_grid") {
    // Validate parsedData against the expected schema for this type
    const gridDataResult = featureCardsGridDataSchema.safeParse(parsedData);
    if (!gridDataResult.success) {
      console.warn(
        `Invalid data structure for feature_cards_grid section ID ${section.id}. Skipping.`,
        gridDataResult.error.flatten()
      );
      return null;
    }
    return {
      ...base,
      sectionType: "feature_cards_grid",
      typeSpecificData: gridDataResult.data, // Use validated data
    };
  }

  if (section.sectionType === "banner") {
    // Validate parsedData against the expected schema for this type
    const bannerDataResult = bannerSectionDataSchema.safeParse(parsedData);
    if (!bannerDataResult.success) {
      console.warn(
        `Invalid data structure for banner section ID ${section.id}. Skipping.`,
        bannerDataResult.error.flatten()
      );
      return null;
    }
    return {
      ...base,
      sectionType: "banner",
      typeSpecificData: bannerDataResult.data, // Use validated data
    };
  }

  if (section.sectionType === "gallery") {
    // Validate parsedData against the expected schema for this type
    const galleryDataResult =
      gallerySectionDataServerSchema.safeParse(parsedData);
    if (!galleryDataResult.success) {
      console.warn(
        `Invalid data structure for gallery section ID ${section.id}. Skipping.`,
        galleryDataResult.error.flatten()
      );
      return null;
    }
    return {
      ...base,
      sectionType: "gallery",
      typeSpecificData: galleryDataResult.data, // Use validated data
    };
  }

  // Default case: Handle 'default' section type (map legacy fields or use parsed data if valid)
  // Validate parsedData against the expected schema for this type
  const defaultDataResult = defaultSectionDataSchema.safeParse(parsedData);

  // Helper function to safely convert to string array
  const toSafeStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      const result: string[] = [];
      for (const item of value) {
        if (typeof item === "string") {
          result.push(item);
        }
      }
      return result;
    }
    return typeof value === "string" ? [value] : [];
  };

  // Create a valid typeSpecificData object with proper defaults
  const typeSpecificData: z.infer<typeof defaultSectionDataSchema> = {
    description: defaultDataResult.success
      ? defaultDataResult.data.description
      : section.description || "",
    desktopImageUrls: defaultDataResult.success
      ? defaultDataResult.data.desktopImageUrls
      : toSafeStringArray(section.desktopImageUrls),
    mobileImageUrls: defaultDataResult.success
      ? defaultDataResult.data.mobileImageUrls
      : toSafeStringArray(section.mobileImageUrls),
    imageAlt: defaultDataResult.success
      ? defaultDataResult.data.imageAlt
      : (section.imageAlt ?? "Feature section image"),
    features: defaultDataResult.success
      ? defaultDataResult.data.features
      : toSafeStringArray(section.features),
    primaryButtonText: defaultDataResult.success
      ? defaultDataResult.data.primaryButtonText
      : (section.primaryButtonText ?? ""),
    primaryButtonLink: defaultDataResult.success
      ? defaultDataResult.data.primaryButtonLink
      : (section.primaryButtonLink ?? ""),
    secondaryButtonText: defaultDataResult.success
      ? defaultDataResult.data.secondaryButtonText
      : (section.secondaryButtonText ?? ""),
    secondaryButtonLink: defaultDataResult.success
      ? defaultDataResult.data.secondaryButtonLink
      : (section.secondaryButtonLink ?? ""),
  };

  // Validate the constructed typeSpecificData
  const finalValidation = defaultSectionDataSchema.safeParse(typeSpecificData);
  if (!finalValidation.success) {
    console.warn(
      `Invalid data structure for default section ID ${section.id} after mapping. Skipping.`,
      finalValidation.error.flatten()
    );
    return null;
  }

  return {
    ...base,
    sectionType: "default",
    typeSpecificData: finalValidation.data,
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
      const sectionsUnion = sectionsDb
        .map(mapDbSectionToUnion)
        .filter(Boolean) as HomepageFeatureSectionUnion[]; // Filter out nulls

      console.log("secitonsUnion", sectionsUnion);

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
    const result = homepageConfigUpdateSchema.safeParse(data);
    if (!result.success) {
      console.error(
        "Homepage config validation failed:",
        result.error.flatten()
      );
      throw new Error(
        `Validation failed: ${JSON.stringify(result.error.flatten().fieldErrors)}`
      );
    }
    return result.data;
  })
  .handler(async ({ data }) => {
    const { featureSections = [], ...configData } = data;
    const configId = "main";
    const now = new Date().toISOString();

    try {
      const result = await db.transaction(async (tx) => {
        const upsertedConfig = await tx
          .insert(homepageConfig)
          .values({ ...configData, id: configId, updatedAt: now })
          .onConflictDoUpdate({
            target: homepageConfig.id,
            set: { ...configData, updatedAt: now },
          })
          .returning()
          .get();

        await tx
          .delete(homepageFeatureSections)
          .where(eq(homepageFeatureSections.homepageConfigId, configId));

        if (featureSections.length > 0) {
          const sectionsToInsert: (typeof homepageFeatureSections.$inferInsert)[] =
            featureSections.map((section, index) => {
              const insertData: typeof homepageFeatureSections.$inferInsert = {
                homepageConfigId: configId,
                order: index,
                sectionType: section.sectionType,
                title: section.title,
                subtitle: section.subtitle,
                typeSpecificData: section.typeSpecificData
                  ? JSON.stringify(section.typeSpecificData)
                  : null,
                updatedAt: now,
                createdAt: now,
                description: null,
                desktopImageUrls: [], // Default for DB not null
                mobileImageUrls: [], // Default for DB not null
                imageAlt: null,
                features: [], // Default for DB not null
                primaryButtonText: null,
                primaryButtonLink: null,
                secondaryButtonText: null,
                secondaryButtonLink: null,
              };

              if (section.sectionType === "default") {
                const defaultData = section.typeSpecificData as z.infer<
                  typeof defaultSectionDataSchema
                >;
                insertData.description = defaultData.description;
                insertData.desktopImageUrls = defaultData.desktopImageUrls;
                insertData.mobileImageUrls = defaultData.mobileImageUrls ?? []; // Ensure array
                insertData.imageAlt = defaultData.imageAlt;
                insertData.features = defaultData.features ?? []; // Ensure array
                insertData.primaryButtonText = defaultData.primaryButtonText;
                insertData.primaryButtonLink = defaultData.primaryButtonLink;
                insertData.secondaryButtonText =
                  defaultData.secondaryButtonText;
                insertData.secondaryButtonLink =
                  defaultData.secondaryButtonLink;
              }
              // No legacy fields for 'feature_cards_grid', 'banner', or 'gallery'
              // typeSpecificData is already stringified above for all types.

              // Remove undefined optional fields before insertion if necessary,
              // but Drizzle should handle explicit nulls for nullable fields.
              // Subtitle is already handled by `subtitle: section.subtitle,` which could be undefined.
              // Drizzle will use default for undefined if the column has one, or insert null.
              // For our schema, subtitle is nullable.

              return insertData;
            });
          await tx.insert(homepageFeatureSections).values(sectionsToInsert);
        }

        const updatedSectionsDb = await tx
          .select()
          .from(homepageFeatureSections)
          .where(eq(homepageFeatureSections.homepageConfigId, configId))
          .orderBy(asc(homepageFeatureSections.order));

        const updatedSectionsUnion = updatedSectionsDb
          .map(mapDbSectionToUnion)
          .filter(Boolean) as HomepageFeatureSectionUnion[];

        return { ...upsertedConfig, featureSections: updatedSectionsUnion };
      });

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
