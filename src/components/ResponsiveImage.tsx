import {
  LazyLoadImage,
  type LazyLoadImageProps,
} from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css"; // Optional effect

// Helper to generate mobile URL from the original URL using naming convention
const getMobileUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const lastSlashIndex = pathname.lastIndexOf("/");
    const filename = pathname.slice(lastSlashIndex + 1);

    // Split filename and extension
    const lastDotIndex = filename.lastIndexOf(".");
    if (lastDotIndex === -1) return url; // No extension, return original

    const nameWithoutExt = filename.slice(0, lastDotIndex);
    const extension = filename.slice(lastDotIndex);

    // Create mobile URL
    const mobileFilename = `${nameWithoutExt}_mobile${extension}`;
    const mobilePath = pathname.slice(0, lastSlashIndex + 1) + mobileFilename;

    return `${urlObj.protocol}//${urlObj.host}${mobilePath}${urlObj.search}`;
  } catch (error) {
    console.error("Error generating mobile URL:", error);
    return url;
  }
};

// Generate srcset for responsive images
const generateSrcSet = (src: string | undefined): string | undefined => {
  if (!src || src.toLowerCase().endsWith(".svg")) return src;
  const mobileUrl = getMobileUrl(src);
  // Only include mobile if it's different from src
  console.log("mobileurl", mobileUrl);
  if (mobileUrl && mobileUrl !== src) {
    return `${mobileUrl} 640w, ${src} 1200w`;
  }
  return src; // Return only src if mobile is same or failed
};

// Extend LazyLoadImageProps to include our specific needs if necessary
interface ResponsiveLazyImageProps extends LazyLoadImageProps {
  // Custom props
  wrapperClassName?: string;
}

export function ResponsiveLazyImage({
  src,
  alt,
  className = "",
  wrapperClassName,
  sizes = "(max-width: 768px) 100vw, 1200px", // Default sizes
  effect = "blur", // Default effect
  ...rest // Pass down other LazyLoadImage props like width, height, etc.
}: ResponsiveLazyImageProps) {
  const srcSet = generateSrcSet(src);

  // If wrapperClassName is provided, wrap the image in a div with that class
  if (wrapperClassName) {
    return (
      <div className={wrapperClassName}>
        <LazyLoadImage
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt || "Image"} // Provide a default alt text
          className={className}
          effect={effect}
          {...rest} // Spread the rest of the props
        />
      </div>
    );
  }

  // Otherwise, render the image directly without a wrapper
  return (
    <LazyLoadImage
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt || "Image"} // Provide a default alt text
      className={className}
      effect={effect}
      {...rest} // Spread the rest of the props
    />
  );
}
