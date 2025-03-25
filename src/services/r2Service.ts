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

    const fileName = formData.get("fileName")?.toString();
    const fileType = formData.get("fileType")?.toString();

    if (!fileName || !fileType) {
      throw new Error("File name and type are required");
    }

    return { fileName, fileType };
  })
  .handler(async ({ data }) => {
    try {
      const uniqueFileName = generateUniqueFileName(data.fileName);
      const objectKey = `images/${uniqueFileName}`;

      const putObjectCommand = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
        ContentType: data.fileType,
      });

      const presignedUrl = await getSignedUrl(s3Client, putObjectCommand, {
        expiresIn: 3600,
      });

      return {
        success: true,
        presignedUrl,
        objectKey,
        publicUrl: `${R2_PUBLIC_URL}/${objectKey}`,
      };
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to generate upload URL"
      );
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
  if (!url) return null;

  // Check if it's our domain
  if (url.startsWith(R2_PUBLIC_URL)) {
    // Extract the path after the domain
    const path = url.substring(R2_PUBLIC_URL.length);
    // Ensure it starts with a slash and return
    return path.startsWith("/") ? path.substring(1) : path;
  }

  // Check for old R2 URLs
  const r2Pattern =
    /https:\/\/[\w-]+\.[\w-]+\.r2\.cloudflarestorage\.com\/(images\/[\w.-]+)/;
  const match = url.match(r2Pattern);

  if (match) {
    return match[1];
  }

  return null;
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
