import { eq } from "drizzle-orm";
import { db } from "../db";
import { aboutUs } from "../db/schema";
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";

// Define types for about us data
export type AboutUs = typeof aboutUs.$inferSelect;
export type NewAboutUs = typeof aboutUs.$inferInsert;

// Initialize about us if none exists
export const initAboutUs = createServerFn().handler(async () => {
  const existingInfo = await db.select().from(aboutUs).limit(1);

  if (existingInfo.length === 0) {
    // No about us content exists, create default with rich content
    const defaultAboutUs: NewAboutUs = {
      title: "About GWM Indonesia",
      content: `
        <h2>Welcome to GWM Indonesia</h2>
        <p>Great Wall Motor (GWM) Indonesia is dedicated to bringing innovative automotive solutions to the Indonesian market. As a leading automobile manufacturer, we are committed to sustainability, quality, and customer satisfaction.</p>
        
        <h3>Our History</h3>
        <p>Founded with a vision to revolutionize the automotive industry in Indonesia, GWM has quickly established itself as a trusted name in providing high-quality vehicles that combine innovative technology, sustainability, and exceptional design.</p>
        
        <h3>Innovation at Our Core</h3>
        <p>At GWM Indonesia, innovation is at the heart of everything we do. We continuously strive to develop and incorporate the latest technologies into our vehicles, ensuring that our customers experience the best in automotive engineering.</p>
        
        <h3>Commitment to Sustainability</h3>
        <p>We believe in a greener future. Our commitment to sustainability is reflected in our range of new energy vehicles and our eco-friendly manufacturing processes. We're dedicated to reducing our carbon footprint and contributing to a more sustainable automotive industry.</p>
      `,
      mission: "To provide innovative and sustainable mobility solutions that enhance the quality of life for all Indonesians, setting new standards of excellence in the automotive industry.",
      vision: "To become the leading provider of new energy vehicles in Indonesia, revolutionizing transportation through cutting-edge technology, exceptional quality, and customer-focused solutions.",
      imageUrl: "https://gwm.kopimap.com/about-us-banner.jpg",
      imageAlt: "GWM Indonesia headquarters with modern vehicle lineup",
      updatedAt: new Date().toISOString(),
    };

    await db.insert(aboutUs).values(defaultAboutUs);
    return true;
  }

  return false;
});

// Get the about us content with caching
export const getAboutUs = createServerFn().handler(async () => {
  try {
    const info = await db.select().from(aboutUs).limit(1);
    
    if (info.length === 0) {
      // Auto-initialize if no content exists
      await initAboutUs();
      const newInfo = await db.select().from(aboutUs).limit(1);
      return newInfo.length > 0 ? newInfo[0] : null;
    }
    
    return info[0];
  } catch (error) {
    console.error("Error getting about us info:", error);
    throw error;
  }
});

// Update about us schema with enhanced validation
const updateAboutUsSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or less"),
  content: z.string().min(1, "Content is required"),
  mission: z.string().optional().nullable(),
  vision: z.string().optional().nullable(),
  imageUrl: z.string().url("Invalid image URL format").optional().nullable(),
  imageAlt: z.string().max(200, "Image alt text must be 200 characters or less").optional().nullable(),
});

// Update or create about us content (upsert) with improved error handling
export const updateAboutUs = createServerFn()
  .validator((data: unknown) => {
    try {
      return updateAboutUsSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(error.errors.map((e) => e.message).join(", "));
      }
      throw error;
    }
  })
  .handler(async ({ data }) => {
    try {
      // Check if this is a new record (id = 0) or an update
      if (data.id === 0) {
        // New record - insert
        const newData: NewAboutUs = {
          title: data.title,
          content: data.content,
          mission: data.mission ?? null,
          vision: data.vision ?? null,
          imageUrl: data.imageUrl ?? null,
          imageAlt: data.imageAlt ?? null,
          updatedAt: new Date().toISOString(),
        };

        const result = await db.insert(aboutUs).values(newData).returning();

        return {
          success: true,
          id: result[0].id,
          message: "About us content created successfully",
        };
      }

      // Existing record - update
      await db
        .update(aboutUs)
        .set({
          title: data.title,
          content: data.content,
          mission: data.mission ?? null,
          vision: data.vision ?? null,
          imageUrl: data.imageUrl ?? null,
          imageAlt: data.imageAlt ?? null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(aboutUs.id, data.id));

      return {
        success: true,
        id: data.id,
        message: "About us content updated successfully",
      };
    } catch (error) {
      console.error("Error updating about us content:", error);
      throw new Error("Failed to update about us content. Please check your input and try again.");
    }
  });
