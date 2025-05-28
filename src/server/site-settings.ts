import { eq } from "drizzle-orm";
import { db } from "../db";
import { siteSettings } from "../db/schema";
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";

// Define the type for new site settings (used for initialization)
export type NewSiteSettings = typeof siteSettings.$inferInsert;
// Define the type for selected site settings
export type SiteSettings = typeof siteSettings.$inferSelect;

// Schema for validating site settings updates
const siteSettingsSchema = z.object({
  id: z.string().default("main"),
  brandName: z.string().optional().nullable(), // Optional: Company/brand name
  googleAnalyticsId: z.string().optional().nullable(), // Optional: Allows empty string or null
  googleTagManagerId: z.string().optional().nullable(), // Optional: Allows empty string or null
});

// Initialize site settings if none exist
export const initSiteSettings = createServerFn().handler(async () => {
  const existingSettings = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, "main"))
    .limit(1);

  if (existingSettings.length === 0) {
    // No settings exist, create default (empty)
    const defaultSettings: NewSiteSettings = {
      id: "main",
      brandName: "GWM Indonesia", // Default brand name
      googleAnalyticsId: null, // Default to null or an example placeholder if preferred
      googleTagManagerId: null, // Default to null
      updatedAt: new Date().toISOString(),
    };

    await db.insert(siteSettings).values(defaultSettings);
    console.log("Default site settings initialized.");
    return { success: true, message: "Default settings initialized." };
  }

  return { success: false, message: "Settings already exist." };
});

// Get the site settings
export const getSiteSettings = createServerFn().handler(async () => {
  try {
    const settings = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, "main"))
      .limit(1);

    if (settings.length > 0) {
      return settings[0];
    }

    // Attempt to initialize if not found, then retry fetching
    console.log("Site settings not found, attempting initialization...");
    await initSiteSettings(); // Call the initialization function
    const retrySettings = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, "main"))
      .limit(1);
    if (retrySettings.length > 0) {
      return retrySettings[0];
    }
    console.error(
      "Failed to retrieve site settings even after initialization attempt."
    );
    return null; // Return null if still not found after init attempt
  } catch (error) {
    console.error("Error getting site settings:", error);
    throw new Error("Failed to retrieve site settings.");
  }
});

// Update site settings
export const updateSiteSettings = createServerFn()
  .validator((data: unknown) => {
    try {
      // Ensure IDs are treated as strings, allow null or empty for optional fields
      const parsed = siteSettingsSchema.parse(data);
      return {
        ...parsed,
        brandName: parsed.brandName || null,
        googleAnalyticsId: parsed.googleAnalyticsId || null,
        googleTagManagerId: parsed.googleTagManagerId || null,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(error.errors.map((e) => e.message).join(", "));
      }
      throw new Error("Invalid data format for site settings.");
    }
  })
  .handler(async ({ data }) => {
    try {
      await db
        .update(siteSettings)
        .set({
          brandName: data.brandName,
          googleAnalyticsId: data.googleAnalyticsId,
          googleTagManagerId: data.googleTagManagerId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(siteSettings.id, "main")); // Always update the 'main' row

      return {
        success: true,
        message: "Site settings updated successfully.",
      };
    } catch (error) {
      console.error("Error updating site settings:", error);
      throw new Error("Failed to update site settings.");
    }
  });
