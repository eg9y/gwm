import React, { useState } from "react";
import type { GalleryImage } from "../db/schema";

interface ModelGalleryProps {
  modelId: string;
  modelName: string;
  gallery?: GalleryImage[];
}

export function ModelGallery({
  modelId,
  modelName,
  gallery = [],
}: ModelGalleryProps) {
  // If no gallery images provided or empty array, return null
  if (!gallery || gallery.length === 0) {
    return null;
  }

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const activeImage = gallery[activeImageIndex];

  return (
    <div className="w-full space-y-4">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        Gallery {modelName}
      </h2>

      {/* Main image display */}
      <div className="w-full bg-gray-100 rounded-lg overflow-hidden shadow-md">
        <img
          src={activeImage.imageUrl}
          alt={activeImage.alt || `${modelName} image`}
          className="w-full h-auto object-cover aspect-[16/9]"
        />
      </div>

      {/* Image caption/alt text */}
      <p className="text-sm text-gray-600 text-center">
        {activeImage.alt || `${modelName} image ${activeImageIndex + 1}`}
      </p>

      {/* Thumbnails */}
      {gallery.length > 1 && (
        <div className="flex overflow-x-auto gap-2 pb-2 pt-2 scrollbar-thin scrollbar-thumb-primary scrollbar-track-gray-200">
          {gallery.map((image, index) => (
            <button
              key={`${modelId}-gallery-${image.imageUrl}-${index}`}
              type="button"
              onClick={() => setActiveImageIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                index === activeImageIndex
                  ? "border-primary ring-2 ring-primary ring-opacity-50"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <img
                src={image.imageUrl}
                alt={image.alt || `${modelName} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
