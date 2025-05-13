import { createServerFn } from "@tanstack/react-start";
import {
  PutObjectCommand,
  S3Client,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";

// R2 configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "gwm-indonesia";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://gwm.kopimap.com";

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

// Generate a unique filename
export function generateUniqueFileName(fileName: string): string {
  const timestamp = new Date().getTime();
  const randomString = crypto.randomBytes(8).toString("hex");
  const extension = fileName.split(".").pop();
  return `${timestamp}-${randomString}.${extension}`;
}

// Get a presigned URL for direct browser upload
export const getPresignedUploadUrl = createServerFn({ method: "POST" })
  .validator((formData: unknown) => {
    if (!(formData instanceof FormData)) {
      throw new Error("Invalid form data");
    }

    const fileName = formData.get("fileName") as string;
    const fileType = formData.get("fileType") as string;

    if (!fileName || !fileType) {
      throw new Error("File name and type are required");
    }

    // Basic sanitization/validation for filename
    if (fileName.length > 255 || !/^[a-zA-Z0-9-_./ ()]+$/.test(fileName)) {
      throw new Error("Invalid file name format or length.");
    }

    return { fileName, fileType };
  })
  .handler(async ({ data }) => {
    try {
      const { fileName, fileType } = data;

      // Determine folder based on file type
      const folder = fileType.startsWith("image/") ? "images" : "files";

      // Use the client-provided filename directly for the object key
      const objectKey = `${folder}/${fileName.startsWith("/") ? fileName.substring(1) : fileName}`;

      console.log(
        `Generating presigned URL for key: ${objectKey}, type: ${fileType}`
      );

      // Create the command for S3
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
        ContentType: fileType,
      });

      // Generate a presigned URL
      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600, // URL expires in 1 hour
      });

      // Return the presigned URL and the public URL for accessing the file
      return {
        success: true,
        presignedUrl,
        objectKey,
        publicUrl: `${R2_PUBLIC_URL}/${objectKey}`,
      };
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate upload URL";
      throw new Error(`Presigned URL Error: ${message}`);
    }
  });

// Type for image upload result
export interface UploadResult {
  objectKey: string;
  publicUrl: string;
}

// Utility to ensure image URLs use the correct domain
export function ensureCorrectImageDomain(imageUrl: string): string {
  if (!imageUrl) return imageUrl;

  // If it's already using the correct domain, return as is
  if (imageUrl.startsWith(R2_PUBLIC_URL)) {
    return imageUrl;
  }

  // Check if it's an R2 URL pattern
  const r2Pattern =
    /https:\/\/[\w-]+\.[\w-]+\.r2\.cloudflarestorage\.com\/images\/([\w.-]+)/;
  const match = imageUrl.match(r2Pattern);

  if (match) {
    // Extract the image name and construct new URL
    const imageName = match[1];
    return `${R2_PUBLIC_URL}/images/${imageName}`;
  }

  // If it doesn't match any pattern we know, return as is
  return imageUrl;
}

// Extract object key from a public URL
export function extractObjectKeyFromUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;

  try {
    // Check if it's our primary public URL
    if (url.startsWith(`${R2_PUBLIC_URL}/`)) {
      // Extract the path after the domain, removing leading slash
      const path = new URL(url).pathname;
      return path.startsWith("/") ? path.substring(1) : path;
    }

    // Check for the direct R2 endpoint URL pattern
    const r2EndpointPattern =
      /^https:\/\/[\w-]+\.r2\.cloudflarestorage\.com\/([^?#]+)/;
    const endpointMatch = url.match(r2EndpointPattern);
    if (endpointMatch?.[1]) {
      // Ensure it's likely within our bucket structure (e.g., starts with 'images/' or 'files/')
      if (
        endpointMatch[1].startsWith("images/") ||
        endpointMatch[1].startsWith("files/")
      ) {
        return endpointMatch[1];
      }
    }

    console.warn(`Could not extract a valid R2 object key from URL: ${url}`);
    return null; // Return null if no pattern matches
  } catch (error) {
    console.error(
      `Error parsing URL in extractObjectKeyFromUrl: ${url}`,
      error
    );
    return null;
  }
}

// Delete an object from R2
export const deleteObjectFromR2 = createServerFn({ method: "POST" })
  .validator((formData: unknown) => {
    if (!(formData instanceof FormData)) {
      throw new Error("Invalid form data");
    }

    const imageUrl = formData.get("imageUrl")?.toString();
    if (!imageUrl) {
      throw new Error("Image URL is required");
    }

    const objectKey = extractObjectKeyFromUrl(imageUrl);
    if (!objectKey) {
      throw new Error("Could not extract object key from URL");
    }

    return { objectKey };
  })
  .handler(async ({ data }) => {
    try {
      const deleteObjectCommand = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: data.objectKey,
      });

      await s3Client.send(deleteObjectCommand);

      return {
        success: true,
        message: `Object ${data.objectKey} deleted successfully`,
      };
    } catch (error) {
      console.error("Error deleting object from R2:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to delete object from R2"
      );
    }
  });

/**
 * Delete an image from R2 storage, including its mobile version if it exists
 */
export const deleteImageFromR2 = createServerFn({ method: "POST" })
  .validator((formData: unknown) => {
    if (!(formData instanceof FormData)) {
      throw new Error("Invalid form data");
    }

    const imageUrl = formData.get("imageUrl") as string;
    if (!imageUrl || !imageUrl.startsWith("http")) {
      throw new Error("Valid Image URL is required for deletion");
    }

    return { imageUrl };
  })
  .handler(async ({ data }) => {
    try {
      const { imageUrl } = data;
      console.log(`Received request to delete image: ${imageUrl}`);

      // Extract the object key from the URL using our utility function
      const objectKey = extractObjectKeyFromUrl(imageUrl);

      if (!objectKey) {
        console.error(`Could not extract object key from URL: ${imageUrl}`);
        throw new Error(
          `Invalid image URL format, cannot determine object key: ${imageUrl}`
        );
      }

      // Generate the mobile version's object key
      const lastDotIndex = objectKey.lastIndexOf(".");
      let mobileObjectKey: string | null = null;
      if (lastDotIndex !== -1 && objectKey.includes("/")) {
        // Ensure it's a path with extension
        const baseName = objectKey.substring(0, lastDotIndex);
        const extension = objectKey.substring(lastDotIndex); // Includes the dot
        // Check if it *already* has _mobile suffix (shouldn't happen if called with desktop URL, but safe check)
        if (!baseName.endsWith("_mobile")) {
          mobileObjectKey = `${baseName}_mobile${extension}`;
        } else {
          console.log(
            `Skipping mobile key derivation, base name already ends with _mobile: ${objectKey}`
          );
        }
      } else {
        console.warn(`Could not reliably derive mobile key for: ${objectKey}`);
      }

      const keysToDelete = [objectKey];
      if (mobileObjectKey) {
        keysToDelete.push(mobileObjectKey);
      }

      console.log("Attempting to delete R2 keys:", keysToDelete);

      const results = {
        success: true,
        message: "Deletion process completed.",
        deleted: [] as string[],
        failed: [] as string[],
      };

      for (const key of keysToDelete) {
        try {
          console.log(`Deleting R2 object: ${key}`);
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: R2_BUCKET_NAME,
              Key: key,
            })
          );
          console.log(`Successfully deleted: ${key}`);
          results.deleted.push(key);
        } catch (error: unknown) {
          // Check if error is 'NoSuchKey' - this is not a failure in our context
          if (
            error &&
            typeof error === "object" &&
            "name" in error &&
            error.name === "NoSuchKey"
          ) {
            console.log(
              `Object not found (already deleted or never existed): ${key}`
            );
            // Optionally add to a 'notFound' array in results if needed
          } else {
            // Log actual errors
            console.error(
              `[Delete Error] Failed to delete object ${key}:`,
              error
            );
            results.success = false; // Mark overall success as false if any real error occurs
            results.failed.push(key);
            // Update message to reflect partial failure
            results.message = "Deletion process completed with errors.";
            // Do NOT re-throw here, allow loop to continue for other keys
          }
        }
      }

      // If any actual failures occurred, throw an error to signal failure to the client
      if (results.failed.length > 0) {
        throw new Error(
          `Failed to delete one or more image variants: ${results.failed.join(", ")}`
        );
      }

      return results; // Return detailed results
    } catch (error) {
      console.error("Error deleting image from R2:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to delete image from storage"
      );
    }
  });
