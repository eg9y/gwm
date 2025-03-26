import { createServerFn } from "@tanstack/react-start";
import { db } from "../db";
import {
  carModels,
  type CarModelFeature,
  type CarModelColor,
  type GalleryImage,
} from "../db/schema";
import { eq, asc, desc, like, or, and } from "drizzle-orm";
import slugify from "slugify";
import { z } from "zod";

// Schema for car model input validation
const carModelSchema = z.object({
  id: z.string().optional(), // Optional for new models, required for updates
  name: z.string().min(1, "Model name is required"),
  featuredImage: z.string().min(1, "Featured image is required"),
  subheader: z.string().min(1, "Subheader is required"),
  price: z.string().min(1, "Price is required"),
  subImage: z.string().optional(),
  features: z
    .array(z.string().min(1, "Feature text is required"))
    .min(1, "At least one feature is required"),
  description: z.string().min(1, "Description is required"),
  mainProductImage: z.string().min(1, "Main product image is required"),
  colors: z
    .array(
      z.object({
        name: z.string().min(1, "Color name is required"),
        hex: z.string().min(1, "Color hex code is required"),
        backgroundColor: z.string().min(1, "Background color is required"),
        imageUrl: z.string().optional(),
      })
    )
    .min(1, "At least one color option is required"),
  gallery: z
    .array(
      z.object({
        imageUrl: z.string().min(1, "Image URL is required"),
        alt: z.string().min(1, "Alt text is required"),
      })
    )
    .optional()
    .default([]),
  category: z.string().min(1, "Category is required"),
  categoryDisplay: z.string().min(1, "Category display name is required"),
  published: z.coerce.number().default(0),
});

// Interface for parsed car model with proper types
export interface CarModel {
  id: string;
  name: string;
  featuredImage: string;
  subheader: string;
  price: string;
  subImage?: string;
  features: CarModelFeature[];
  description: string;
  mainProductImage: string;
  colors: CarModelColor[];
  gallery?: GalleryImage[];
  category: string;
  categoryDisplay: string;
  published: number;
  createdAt: string;
  updatedAt: string;
}

// Fetch all car models
export const getAllCarModels = createServerFn().handler(async () => {
  try {
    console.log("Starting getAllCarModels function");

    const models = await db
      .select()
      .from(carModels)
      .orderBy(asc(carModels.name));

    console.log(`Successfully fetched ${models.length} car models`);
    return models;
  } catch (error) {
    console.error("Error fetching car models:", error);
    // Log more detailed error information
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw new Error("Failed to fetch car models");
  }
});

// Get car model by ID
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
        .where(eq(carModels.id, data.id))
        .get();

      return model || null;
    } catch (error) {
      console.error("Error fetching car model:", error);
      throw new Error("Failed to fetch car model");
    }
  });

// Generate a slug for the car model ID
function generateModelId(name: string): string {
  return slugify(name, {
    lower: true,
    strict: true,
  });
}

// Process colors to add IDs based on names and ensure all properties are present
function processColors(
  colors: {
    name: string;
    hex: string;
    backgroundColor: string;
    imageUrl?: string;
  }[]
): CarModelColor[] {
  return colors.map((color) => ({
    name: color.name,
    hex: color.hex || "#000000", // Ensure default value if missing
    backgroundColor: color.backgroundColor || "#f5f5f5", // Ensure default value if missing
    imageUrl: color.imageUrl || undefined,
  }));
}

// Create a new car model
export const createCarModel = createServerFn()
  .validator((data: unknown) => {
    // Validate input
    const result = carModelSchema.safeParse(data);
    if (!result.success) {
      const errorMessages = result.error.errors
        .map((e) => e.message)
        .join(", ");
      throw new Error(errorMessages);
    }
    return result.data;
  })
  .handler(async ({ data }) => {
    try {
      const modelId = data.id || generateModelId(data.name);

      // Check if model with this ID already exists
      const existingModel = await db
        .select({ id: carModels.id })
        .from(carModels)
        .where(eq(carModels.id, modelId))
        .get();

      if (existingModel) {
        throw new Error(`Car model with ID '${modelId}' already exists`);
      }

      const currentTime = new Date().toISOString();
      const processedColors = processColors(data.colors);

      const newModel = {
        id: modelId,
        name: data.name,
        featuredImage: data.featuredImage,
        subheader: data.subheader,
        price: data.price,
        subImage: data.subImage,
        features: data.features,
        description: data.description,
        mainProductImage: data.mainProductImage,
        colors: processedColors,
        gallery: data.gallery,
        category: data.category,
        categoryDisplay: data.categoryDisplay,
        published: data.published,
        createdAt: currentTime,
        updatedAt: currentTime,
      };

      await db.insert(carModels).values(newModel);

      return {
        success: true,
        modelId,
        message: "Car model created successfully",
      };
    } catch (error) {
      console.error("Error creating car model:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to create car model"
      );
    }
  });

// Update an existing car model
export const updateCarModel = createServerFn()
  .validator((data: unknown) => {
    // Ensure ID is included for updates
    const validationSchema = carModelSchema.extend({
      id: z.string().min(1, "Model ID is required for updates"),
    });

    const result = validationSchema.safeParse(data);
    if (!result.success) {
      const errorMessages = result.error.errors
        .map((e) => e.message)
        .join(", ");
      throw new Error(errorMessages);
    }
    return result.data;
  })
  .handler(async ({ data }) => {
    try {
      // Check if model exists
      const existingModel = await db
        .select({ id: carModels.id })
        .from(carModels)
        .where(eq(carModels.id, data.id))
        .get();

      if (!existingModel) {
        throw new Error(`Car model with ID '${data.id}' not found`);
      }

      const processedColors = processColors(data.colors);

      // Update the model
      await db
        .update(carModels)
        .set({
          name: data.name,
          featuredImage: data.featuredImage,
          subheader: data.subheader,
          price: data.price,
          subImage: data.subImage,
          features: data.features,
          description: data.description,
          mainProductImage: data.mainProductImage,
          colors: processedColors,
          gallery: data.gallery,
          category: data.category,
          categoryDisplay: data.categoryDisplay,
          published: data.published,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(carModels.id, data.id));

      return {
        success: true,
        modelId: data.id,
        message: "Car model updated successfully",
      };
    } catch (error) {
      console.error("Error updating car model:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to update car model"
      );
    }
  });

// Delete a car model
export const deleteCarModel = createServerFn()
  .validator((data: unknown) => {
    const parsed = z.object({ id: z.string() }).safeParse(data);
    if (!parsed.success) {
      throw new Error("Invalid model ID");
    }
    return parsed.data;
  })
  .handler(async ({ data }) => {
    try {
      // Check if model exists
      const existingModel = await db
        .select({ id: carModels.id })
        .from(carModels)
        .where(eq(carModels.id, data.id))
        .get();

      if (!existingModel) {
        throw new Error(`Car model with ID '${data.id}' not found`);
      }

      // Delete the model
      await db.delete(carModels).where(eq(carModels.id, data.id));

      return {
        success: true,
        message: "Car model deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting car model:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to delete car model"
      );
    }
  });

// Search car models
export const searchCarModels = createServerFn()
  .validator((data: unknown) => {
    const parsed = z
      .object({
        query: z.string().optional(),
        category: z.string().optional(),
        publishedOnly: z.boolean().optional(),
      })
      .safeParse(data);

    if (!parsed.success) {
      throw new Error("Invalid search parameters");
    }
    return parsed.data;
  })
  .handler(async ({ data }) => {
    try {
      const queryBuilder = db.select().from(carModels);
      const whereConditions = [];

      // Add filters
      if (data.query) {
        whereConditions.push(like(carModels.name, `%${data.query}%`));
      }

      if (data.category) {
        whereConditions.push(eq(carModels.category, data.category));
      }

      if (data.publishedOnly) {
        whereConditions.push(eq(carModels.published, 1));
      }

      // Apply where conditions if any exist
      if (whereConditions.length > 0) {
        if (whereConditions.length === 1) {
          return await queryBuilder
            .where(whereConditions[0])
            .orderBy(asc(carModels.name));
        }

        return await queryBuilder
          .where(and(...whereConditions))
          .orderBy(asc(carModels.name));
      }

      // If no filters, just return all models sorted by name
      return await queryBuilder.orderBy(asc(carModels.name));
    } catch (error) {
      console.error("Error searching car models:", error);
      throw new Error("Failed to search car models");
    }
  });
