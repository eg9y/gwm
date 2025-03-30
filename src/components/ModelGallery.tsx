import { useEffect, memo } from "react";
import type { GalleryImage } from "../db/schema";
import { Masonry, type RenderComponentProps } from "masonic";
import "react-lazy-load-image-component/src/effects/blur.css";
import { LazyLoadImage } from "react-lazy-load-image-component";

interface ModelGalleryProps {
  modelId: string;
  modelName: string;
  gallery?: GalleryImage[];
}

interface GalleryCardProps extends RenderComponentProps<GalleryImage> {
  modelName: string;
}

const GalleryCard = ({ data: image, modelName, index }: GalleryCardProps) => {
  return (
    <div className="relative overflow-hidden rounded-lg shadow-md group bg-gray-100">
      <LazyLoadImage
        src={image.imageUrl}
        alt={image.alt || `${modelName} Image ${index + 1}`}
        className="w-full h-auto object-cover block align-middle"
        effect="blur"
        wrapperClassName="w-full h-auto"
        threshold={300}
      />
      {image.alt && (
        <div className="absolute top-0 left-0 p-2 bg-black/60 rounded-br-lg">
          <p className="text-xs font-medium text-white text-left">
            {image.alt}
          </p>
        </div>
      )}
    </div>
  );
};

export const ModelGallery = memo(function ModelGallery({
  modelId,
  modelName,
  gallery = [],
}: ModelGalleryProps) {
  if (!gallery || gallery.length === 0) return null;

  useEffect(() => {
    for (const image of gallery.slice(0, 3)) {
      const img = new Image();
      img.src = image.imageUrl;
    }
  }, [gallery]);

  const renderGalleryCard = (props: RenderComponentProps<GalleryImage>) => (
    <GalleryCard {...props} modelName={modelName} />
  );

  return (
    <div className="w-full space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 text-center mb-4 md:mb-6">
        {modelName} Gallery
      </h2>

      <div className="w-full max-w-6xl mx-auto">
        <Masonry
          items={gallery}
          render={renderGalleryCard}
          columnWidth={250}
          columnGutter={16}
          rowGutter={16}
          overscanBy={5}
          key={modelId}
          itemKey={(item, index) => `${modelId}-${item.imageUrl}-${index}`}
        />
      </div>
    </div>
  );
});
