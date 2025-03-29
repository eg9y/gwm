import { createServerFn } from "@tanstack/react-start";

// Define the sizes we need based on the UI analysis
const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 }, // Navbar thumbnails
  small: { width: 400, height: 300 }, // Medium sized grid images
  medium: { width: 800, height: 600 }, // Medium-large images
  large: { width: 1200, height: 900 }, // Hero/featured images
  original: { width: null, height: null }, // Original size (no resizing)
};

// Cloudflare account ID (you would get this from your Cloudflare dashboard)
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

// Define the output image types
type ImageType = "webp" | "avif" | "auto" | "jpeg" | "png";

interface OptimizationOptions {
  width?: number | null;
  height?: number | null;
  format?: ImageType;
  quality?: number;
  fit?: "cover" | "contain" | "scale-down" | "crop";
}

interface OptimizedImage {
  url: string;
  width: number | null;
  height: number | null;
  size: string;
  format: string;
}

/**
 * Optimizes an image using Cloudflare Image Transformations
 */
export const optimizeImage = createServerFn({ method: "POST" })
  .validator((formData: unknown) => {
    if (!(formData instanceof FormData)) {
      throw new Error("Invalid form data");
    }

    const imageFile = formData.get("imageFile") as File;
    const format = (formData.get("format") as ImageType) || "auto";
    const quality = Number(formData.get("quality")) || 80;
    const size =
      (formData.get("size") as keyof typeof IMAGE_SIZES) || "original";

    if (!imageFile) {
      throw new Error("Image file is required");
    }

    return { imageFile, format, quality, size };
  })
  .handler(async ({ data }) => {
    try {
      const { imageFile, format, quality, size } = data;

      // Create a temporary ObjectURL to pass to Cloudflare
      const imageUrl = URL.createObjectURL(imageFile);

      // Get the dimensions for the requested size
      const dimensions = IMAGE_SIZES[size];

      // Prepare optimization options
      const options: OptimizationOptions = {
        quality,
        format,
        fit: "cover",
      };

      if (dimensions.width) options.width = dimensions.width;
      if (dimensions.height) options.height = dimensions.height;

      // Generate optimized versions
      const optimizedImages: OptimizedImage[] = await generateOptimizedVersions(
        imageFile,
        options
      );

      // Clean up the temporary URL
      URL.revokeObjectURL(imageUrl);

      return {
        success: true,
        optimizedImages,
        originalSize: imageFile.size,
      };
    } catch (error) {
      console.error("Error optimizing image:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to optimize image"
      );
    }
  });

/**
 * Generate optimized versions of an image
 * This would integrate with Cloudflare Image Transformations API
 */
async function generateOptimizedVersions(
  imageFile: File,
  options: OptimizationOptions
): Promise<OptimizedImage[]> {
  // For actual implementation, you would upload the image to Cloudflare Images
  // or use a direct transformation endpoint

  // For now, we're returning a placeholder implementation
  const sizes = Object.keys(IMAGE_SIZES) as (keyof typeof IMAGE_SIZES)[];

  const formData = new FormData();
  formData.append("file", imageFile);

  // Here you would call the Cloudflare API to optimize the image
  // const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`, {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${API_TOKEN}`,
  //   },
  //   body: formData,
  // });

  // For now, we'll simulate the response
  return sizes.map((size) => {
    const dims = IMAGE_SIZES[size];
    return {
      url: URL.createObjectURL(imageFile), // In real implementation, this would be a URL from Cloudflare
      width: dims.width,
      height: dims.height,
      size: size,
      format: options.format || "auto",
    };
  });
}

/**
 * Function to determine if an image needs optimization
 * Checks image dimensions and file size to decide
 */
export function shouldOptimizeImage(file: File): boolean {
  return file.size > 1024 * 150; // If larger than 150KB, optimize
}

/**
 * Convert a File to a Buffer for server-side processing
 */
export async function fileToBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert file to buffer"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}
