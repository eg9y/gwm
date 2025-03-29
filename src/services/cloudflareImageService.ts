import { createServerFn } from "@tanstack/react-start";

// Cloudflare Zone ID for transformations
const CLOUDFLARE_ZONE_ID =
  process.env.CLOUDFLARE_ZONE_ID || "e58d07744620fbe99affce3dae4348af";

// Domain for transformations - ensure this is the domain where Cloudflare Image Transformations are enabled
const CLOUDFLARE_TRANSFORM_DOMAIN =
  process.env.CLOUDFLARE_TRANSFORM_DOMAIN || "kopimap.com";

// Interface for transformation options
export interface CloudflareTransformOptions {
  width?: number;
  height?: number;
  fit?: "scale-down" | "contain" | "cover" | "crop" | "pad";
  format?: "auto" | "webp" | "avif" | "jpeg" | "png" | "gif";
  quality?: number;
  sharpen?: number;
  blur?: number;
  trim?: number;
  metadata?: "keep" | "copyright" | "none";
  dpr?: number;
}

/**
 * Generates a transformation URL for temporary use during the upload process
 * This helps create and then store optimized versions, rather than transforming on-the-fly
 *
 * @param imageUrl - The original image URL
 * @param options - Transformation options
 * @returns The transformed image URL for download
 */
export async function getTransformUrl(
  imageUrl: string,
  options: CloudflareTransformOptions
): Promise<string> {
  // Ensure the input URL is properly encoded
  const encodedImageUrl = encodeURIComponent(imageUrl);

  // Construct the transformation parameters
  const params = Object.entries(options)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join(",");

  // For images hosted on R2 or other domains, use the /cdn-cgi/image/options/url pattern
  return `https://${CLOUDFLARE_TRANSFORM_DOMAIN}/cdn-cgi/image/${params}/${encodedImageUrl}`;
}

/**
 * Generates mobile/desktop variants of an image and returns their URLs
 * Used only during upload to create the optimized versions that will be stored
 *
 * @param originalUrl The original image URL
 * @returns Object with URLs for different versions
 */
export async function getOptimizedVersions(originalUrl: string): Promise<{
  mobile: string;
  desktop: string;
  thumbnail: string;
  original: string;
}> {
  // Extract filename from the original URL for creating the new filenames
  const urlObj = new URL(originalUrl);
  const pathname = urlObj.pathname;
  const filenameWithExt = pathname.split("/").pop() || "";

  // Split filename and extension
  const lastDotIndex = filenameWithExt.lastIndexOf(".");
  const filename =
    lastDotIndex !== -1
      ? filenameWithExt.slice(0, lastDotIndex)
      : filenameWithExt;
  const extension =
    lastDotIndex !== -1 ? filenameWithExt.slice(lastDotIndex) : "";

  // Create URLs for the different variants based on the naming convention
  // These URLs should point to where the files will be stored after transformation
  const basePath = pathname.slice(0, pathname.lastIndexOf("/") + 1);

  const mobileUrl = `${urlObj.protocol}//${urlObj.host}${basePath}${filename}_mobile${extension}`;
  const desktopUrl = originalUrl; // Desktop is the original URL
  const thumbnailUrl = `${urlObj.protocol}//${urlObj.host}${basePath}${filename}_thumbnail${extension}`;

  return {
    mobile: mobileUrl,
    desktop: desktopUrl,
    thumbnail: thumbnailUrl,
    original: originalUrl,
  };
}

/**
 * Creates download URLs for transformations to be saved to R2
 * Used to actually download the transformed images during upload
 *
 * @param originalUrl The original image URL
 * @returns Object with download URLs for different sized transformations
 */
export async function getTransformationDownloadUrls(
  originalUrl: string
): Promise<{
  mobile: string;
  desktop: string;
  thumbnail: string;
}> {
  // Mobile version (640px width)
  const mobileOptions: CloudflareTransformOptions = {
    width: 640,
    fit: "scale-down",
    format: "webp",
    quality: 80,
  };
  const mobileUrl = await getTransformUrl(originalUrl, mobileOptions);

  // Desktop version (max 1200px width)
  const desktopOptions: CloudflareTransformOptions = {
    width: 1200,
    fit: "scale-down",
    format: "webp",
    quality: 85,
  };
  const desktopUrl = await getTransformUrl(originalUrl, desktopOptions);

  // Thumbnail version (320px width)
  const thumbnailOptions: CloudflareTransformOptions = {
    width: 320,
    fit: "scale-down",
    format: "webp",
    quality: 75,
  };
  const thumbnailUrl = await getTransformUrl(originalUrl, thumbnailOptions);

  return {
    mobile: mobileUrl,
    desktop: desktopUrl,
    thumbnail: thumbnailUrl,
  };
}
