import { createServerFn } from "@tanstack/react-start";
import { db } from "../db";
import {
  carModels,
  type CarModelFeature,
  type CarModelColor,
  type GalleryImage,
} from "../db/schema";
import { eq, asc, and } from "drizzle-orm";
import { z } from "zod";

/**
 * Frontend-friendly car model type that handles null values from the database
 */
export type DisplayCarModel = {
  id: string;
  name: string;
  featuredImage: string;
  subheader: string;
  price: string;
  subImage: string | null;
  features: CarModelFeature[];
  description: string;
  mainProductImage: string;
  colors: CarModelColor[];
  gallery?: GalleryImage[];
  category: string;
  categoryDisplay: string;
  has180View?: number; // Mark as optional as it might be removed
  published: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * Get all published car models
 */
export const getAllPublishedCarModels = createServerFn().handler(async () => {
  try {
    const models = await db
      .select()
      .from(carModels)
      .where(eq(carModels.published, 1))
      .orderBy(asc(carModels.name));

    return models as DisplayCarModel[];
  } catch (error) {
    console.error("Error loading published car models:", error);
    throw new Error("Failed to load car models");
  }
});

/**
 * Get car model by ID
 */
export const getCarModelById = createServerFn()
  .validator((data: unknown) => {
    const parsed = z.object({ id: z.string() }).safeParse(data);
    if (!parsed.success) {
      throw new Error("Invalid model ID");
    }
    return parsed.data;
  })
  .handler(async ({ data }) => {
    try {
      const model = await db
        .select()
        .from(carModels)
        .where(and(eq(carModels.id, data.id), eq(carModels.published, 1)))
        .get();

      if (!model) {
        throw new Error(`Car model with ID '${data.id}' not found`);
      }

      return model as DisplayCarModel;
    } catch (error) {
      console.error(`Error loading car model with ID ${data.id}:`, error);
      throw new Error("Failed to load car model");
    }
  });

/**
 * Get car models by category
 */
export const getCarModelsByCategory = createServerFn()
  .validator((data: unknown) => {
    const parsed = z.object({ category: z.string() }).safeParse(data);
    if (!parsed.success) {
      throw new Error("Invalid category");
    }
    return parsed.data;
  })
  .handler(async ({ data }) => {
    try {
      const models = await db
        .select()
        .from(carModels)
        .where(
          and(eq(carModels.category, data.category), eq(carModels.published, 1))
        )
        .orderBy(asc(carModels.name));

      return models as DisplayCarModel[];
    } catch (error) {
      console.error(
        `Error loading car models from category ${data.category}:`,
        error
      );
      throw new Error("Failed to load car models");
    }
  });
