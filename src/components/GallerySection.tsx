import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css"; // Optional blur effect

// Define the structure for a single image in the gallery
interface GalleryImageItem {
  imageUrl: string;
  altText?: string | null; // Alt text for the image
}

interface GallerySectionProps {
  title: string; // Main section title
  subtitle?: string | null; // Optional section subtitle
  images: GalleryImageItem[]; // Array of images
}

const GallerySection: React.FC<GallerySectionProps> = ({
  title,
  subtitle,
  images,
}) => {
  // Commenting out the early return to always render the section structure
  // if (!images || images.length === 0) {
  //   return null;
  // }

  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        {(title || subtitle) && (
          <div className="text-center mb-10 md:mb-16 max-w-3xl mx-auto">
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg md:text-xl text-gray-600">{subtitle}</p>
            )}
          </div>
        )}

        {/* Images Grid */}
        {images && images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {images.map((image, index) => (
              <div
                key={`${image.imageUrl}-${index}`} // Use a more stable key
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200 ease-in-out"
              >
                <LazyLoadImage
                  src={image.imageUrl}
                  alt={image.altText || `Gallery image ${index + 1}`}
                  effect="blur"
                  className="w-full h-full object-cover"
                  wrapperClassName="w-full h-full block"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <p>No images in this gallery yet.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default GallerySection;
