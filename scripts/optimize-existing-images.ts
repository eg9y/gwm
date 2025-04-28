import { db } from "../src/db";
import { carModels } from "../src/db/schema";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import fetch from "node-fetch";
import { createReadStream, writeFileSync } from "fs";
import { Readable } from "stream";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// R2 configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "gwm-indonesia";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://gwm.kopimap.com";

// Cloudflare API credentials
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

// Define image sizes
const IMAGE_SIZES = {
  mobile: { width: 640, height: null, suffix: "_mobile" },
  desktop: { width: 1200, height: null, suffix: "_desktop" },
};

/**
 * Generate a transformation URL for Cloudflare Image Transformations
 */
function getTransformUrl(
  imageUrl: string,
  options: {
    width?: number;
    height?: number;
    format?: string;
    quality?: number;
  }
) {
  try {
    const parsedUrl = new URL(imageUrl);

    // Format the transformation options as a URL path
    const transformParams = Object.entries(options)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join(",");

    // Construct the transformation URL
    return `${parsedUrl.protocol}//${parsedUrl.host}/cdn-cgi/image/${transformParams}${parsedUrl.pathname}`;
  } catch (error) {
    console.error(`Error creating transform URL for ${imageUrl}:`, error);
    return imageUrl; // Fall back to original URL on error
  }
}

/**
 * Download an image from a URL
 */
async function downloadImage(url: string): Promise<Buffer> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error);
    throw error;
  }
}

/**
 * Upload an image to R2
 */
async function uploadImageToR2(
  imageBuffer: Buffer,
  fileName: string
): Promise<string> {
  try {
    const objectKey = `optimized/${fileName}`;

    // Upload to R2
    await s3Client.send({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      Body: imageBuffer,
      ContentType: "image/webp", // Set content type as WebP
    });

    // Return public URL
    return `${R2_PUBLIC_URL}/${objectKey}`;
  } catch (error) {
    console.error(`Error uploading image to R2:`, error);
    throw error;
  }
}

/**
 * Process a single image and create optimized versions
 */
async function processImage(
  imageUrl: string
): Promise<{ mobile: string; desktop: string }> {
  try {
    // Generate transformation URLs
    const transforms = {
      mobile: getTransformUrl(imageUrl, {
        width: IMAGE_SIZES.mobile.width,
        format: "webp",
        quality: 85,
      }),
      desktop: getTransformUrl(imageUrl, {
        width: IMAGE_SIZES.desktop.width,
        format: "webp",
        quality: 85,
      }),
    };

    // Extract original filename
    const urlParts = imageUrl.split("/");
    const originalFileName = urlParts[urlParts.length - 1];
    const fileNameWithoutExt = originalFileName.split(".")[0];

    // Download transformed images
    const mobileImageBuffer = await downloadImage(transforms.mobile);
    const desktopImageBuffer = await downloadImage(transforms.desktop);

    // Upload transformed images to R2
    const mobileUrl = await uploadImageToR2(
      mobileImageBuffer,
      `${fileNameWithoutExt}${IMAGE_SIZES.mobile.suffix}.webp`
    );

    const desktopUrl = await uploadImageToR2(
      desktopImageBuffer,
      `${fileNameWithoutExt}${IMAGE_SIZES.desktop.suffix}.webp`
    );

    return { mobile: mobileUrl, desktop: desktopUrl };
  } catch (error) {
    console.error(`Error processing image ${imageUrl}:`, error);
    throw error;
  }
}

/**
 * Process all car models and optimize their images
 */
async function processAllCarModels() {
  try {
    // Get all car models
    const allModels = await db.select().from(carModels);

    console.log(`Found ${allModels.length} car models to process`);

    // Process each model
    for (const model of allModels) {
      console.log(`Processing model: ${model.name} (ID: ${model.id})`);

      // Process featuredImage
      if (model.featuredImage) {
        console.log(`  Processing featured image: ${model.featuredImage}`);
        try {
          const result = await processImage(model.featuredImage);
          console.log(`  Created optimized versions:
            Mobile: ${result.mobile}
            Desktop: ${result.desktop}`);

          // Here you could update the database with the new URLs if desired
          // For now, we'll just log them
        } catch (error) {
          console.error(`  Failed to process featured image:`, error);
        }
      }

      // Process mainProductImage
      if (model.mainProductImage) {
        console.log(
          `  Processing main product image: ${model.mainProductImage}`
        );
        try {
          const result = await processImage(model.mainProductImage);
          console.log(`  Created optimized versions:
            Mobile: ${result.mobile}
            Desktop: ${result.desktop}`);
        } catch (error) {
          console.error(`  Failed to process main product image:`, error);
        }
      }

      // Process subImage if it exists
      if (model.subImage) {
        console.log(`  Processing sub image: ${model.subImage}`);
        try {
          const result = await processImage(model.subImage);
          console.log(`  Created optimized versions:
            Mobile: ${result.mobile}
            Desktop: ${result.desktop}`);
        } catch (error) {
          console.error(`  Failed to process sub image:`, error);
        }
      }

      // Process color images
      if (model.colors) {
        const colors = model.colors as any[];
        for (let i = 0; i < colors.length; i++) {
          const color = colors[i];
          if (color.imageUrl) {
            console.log(`  Processing color image ${i + 1}: ${color.imageUrl}`);
            try {
              const result = await processImage(color.imageUrl);
              console.log(`  Created optimized versions:
                Mobile: ${result.mobile}
                Desktop: ${result.desktop}`);
            } catch (error) {
              console.error(`  Failed to process color image:`, error);
            }
          }
        }
      }

      // Process gallery images
      if (model.gallery) {
        const gallery = model.gallery as any[];
        for (let i = 0; i < gallery.length; i++) {
          const galleryItem = gallery[i];
          if (galleryItem.imageUrl) {
            console.log(
              `  Processing gallery image ${i + 1}: ${galleryItem.imageUrl}`
            );
            try {
              const result = await processImage(galleryItem.imageUrl);
              console.log(`  Created optimized versions:
                Mobile: ${result.mobile}
                Desktop: ${result.desktop}`);
            } catch (error) {
              console.error(`  Failed to process gallery image:`, error);
            }
          }
        }
      }

      console.log(`Completed processing model: ${model.name}\n`);
    }

    console.log("Image optimization complete!");
  } catch (error) {
    console.error("Error processing car models:", error);
  } finally {
    // Close the database connection
    await db.end();
  }
}

// Run the script
processAllCarModels().catch(console.error);
