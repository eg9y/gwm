import { useState, useEffect, useRef } from "react";
import type { CarModelColor } from "../db/schema";

// Types for the component props
interface ModelColorPickerProps {
  modelId: string;
  colors: CarModelColor[];
  baseUrl?: string;
}

export function ModelColorPicker({
  modelId,
  colors,
  baseUrl = "https://gwm.kopimap.com/model_colors",
}: ModelColorPickerProps) {
  // State
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);
  const [hoveredColorIndex, setHoveredColorIndex] = useState<number | null>(
    null
  );
  const [preloadedImages, setPreloadedImages] = useState<
    Record<string, boolean>
  >({});
  const [preloadingImages, setPreloadingImages] = useState<
    Record<string, boolean>
  >({});

  // Refs
  const preloadImageRef = useRef<Record<string, HTMLImageElement>>({});
  const loadingTimeoutRef = useRef<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Format model ID (replace hyphens with underscores)
  const formattedModelId = modelId.replace(/-/g, "_");

  // Ensure colors is an array (handle potential JSON string)
  const colorArray = Array.isArray(colors) ? colors : [];

  // Get the currently selected color data
  const selectedColorData = colorArray[selectedColorIndex];
  const selectedColorId = `color_${selectedColorIndex}`;

  // Get the hex color and background color
  const selectedColorHex = selectedColorData?.hex || "#FFFFFF";
  const selectedBackgroundColor =
    selectedColorData?.backgroundColor || "#F5F5F5";

  // Check if the image is already cached by the browser on initial load
  useEffect(() => {
    // Function to check if image is cached
    const checkInitialImageCache = () => {
      if (selectedColorData?.imageUrl) {
        // Use the imageUrl from the color data directly
        const initialImageUrl = selectedColorData.imageUrl;
        const img = new Image();

        img.onload = () => {
          // If image loads immediately (from cache), update states
          setIsLoading(false);
          setPreloadedImages((prev) => ({
            ...prev,
            [selectedColorId]: true,
          }));
        };

        img.src = initialImageUrl;

        // If the image is complete already, it was cached
        if (img.complete) {
          setIsLoading(false);
          setPreloadedImages((prev) => ({
            ...prev,
            [selectedColorId]: true,
          }));
        }
      }
    };

    checkInitialImageCache();

    // Safety timeout to prevent infinite loading state
    loadingTimeoutRef.current = window.setTimeout(() => {
      setIsLoading(false);
    }, 5000) as unknown as number;

    return () => {
      if (loadingTimeoutRef.current !== null) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [selectedColorData, selectedColorId]);

  // Reset selectedColor when colors change
  useEffect(() => {
    if (colorArray && colorArray.length > 0) {
      setSelectedColorIndex(0);
      setPreloadedImages({});
      setPreloadingImages({});
      setImageError(false);
    }
  }, [colorArray]);

  // Image URL for current selection - use imageUrl from the color data directly
  const imageUrl = selectedColorData?.imageUrl || "";

  // Reset loading state when color changes
  useEffect(() => {
    if (selectedColorId) {
      if (preloadedImages[selectedColorId]) {
        // If preloaded, we can skip the loading state
        setIsLoading(false);
      } else {
        setIsLoading(true);
        setImageError(false);

        // Safety timeout to prevent infinite loading state
        if (loadingTimeoutRef.current !== null) {
          clearTimeout(loadingTimeoutRef.current);
        }

        loadingTimeoutRef.current = window.setTimeout(() => {
          // Check if image is already loaded but event wasn't captured
          if (imgRef.current?.complete && imgRef.current.naturalWidth !== 0) {
            setIsLoading(false);
            setPreloadedImages((prev) => ({
              ...prev,
              [selectedColorId]: true,
            }));
          }
        }, 1000) as unknown as number;
      }
    }
  }, [selectedColorId, preloadedImages]);

  // Preload image on hover
  useEffect(() => {
    const preloadImage = (index: number) => {
      const colorId = `color_${index}`;
      const colorData = colorArray[index];

      // Skip if no imageUrl, already preloaded, or currently preloading
      if (
        !colorData?.imageUrl ||
        preloadedImages[colorId] ||
        preloadingImages[colorId]
      ) {
        return;
      }

      // Mark as currently preloading
      setPreloadingImages((prev) => ({
        ...prev,
        [colorId]: true,
      }));

      const img = new Image();

      img.onload = () => {
        // Mark this image as preloaded
        setPreloadedImages((prev) => ({
          ...prev,
          [colorId]: true,
        }));

        // No longer preloading
        setPreloadingImages((prev) => ({
          ...prev,
          [colorId]: false,
        }));
      };

      img.onerror = () => {
        // Mark as attempted but failed
        setPreloadedImages((prev) => ({
          ...prev,
          [colorId]: false,
        }));

        // No longer preloading
        setPreloadingImages((prev) => ({
          ...prev,
          [colorId]: false,
        }));
      };

      img.src = colorData.imageUrl;
      preloadImageRef.current[colorId] = img;
    };

    if (
      hoveredColorIndex !== null &&
      hoveredColorIndex !== selectedColorIndex
    ) {
      preloadImage(hoveredColorIndex);
    }

    return () => {
      // Clean up is handled by the preloadingImages state
    };
  }, [
    hoveredColorIndex,
    colorArray,
    preloadedImages,
    preloadingImages,
    selectedColorIndex,
  ]);

  // Handle mouse enter on color button
  const handleColorHover = (index: number) => {
    setHoveredColorIndex(index);
  };

  // Handle mouse leave on color button
  const handleColorLeave = () => {
    setHoveredColorIndex(null);
  };

  // If no colors, show a placeholder message
  if (colorArray.length === 0) {
    return (
      <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm text-center text-gray-500">
        Warna tidak tersedia untuk model ini
      </div>
    );
  }

  return (
    <div className="mb-8 relative bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-100 shadow-sm">
      {/* New feature badge */}
      <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-sm font-medium shadow-md transform translate-x-1 -translate-y-1 z-10">
        Fitur Baru
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
        Pilih Warna
      </h2>
      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
        Lihat {modelId.replace(/-/g, " ")} dalam berbagai pilihan warna
      </p>

      {/* Color selection */}
      <div className="mb-4 sm:mb-6">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-y-4 gap-x-2 justify-items-center">
          {colorArray.map((color, index) => (
            <button
              key={`color-${index}-${color.name}`}
              type="button"
              className={`group flex flex-col items-center transition-all max-w-[90px] ${
                selectedColorIndex === index ? "scale-105" : "hover:scale-105"
              }`}
              onClick={() => setSelectedColorIndex(index)}
              onMouseEnter={() => handleColorHover(index)}
              onMouseLeave={handleColorLeave}
              aria-label={`Warna ${color.name}`}
              title={color.name}
            >
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 mb-1 sm:mb-2 flex items-center justify-center ${
                  selectedColorIndex === index
                    ? "border-primary shadow-lg"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                style={{ backgroundColor: color.hex }}
              />
              <span
                className={`text-xs sm:text-sm text-center ${
                  selectedColorIndex === index
                    ? "font-medium text-primary"
                    : "text-gray-700 group-hover:text-gray-900"
                }`}
              >
                {color.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Color preview */}
      <div
        className="aspect-video rounded-lg overflow-hidden flex items-center justify-center relative"
        style={{ backgroundColor: selectedBackgroundColor }}
      >
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
            <div className="w-10 h-10 border-4 border-t-transparent border-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Error state */}
        {imageError && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 bg-opacity-50 p-4 text-center">
            <svg
              className="w-12 h-12 text-gray-400 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <title>Error loading image</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <p className="text-gray-600">
              Gambar tidak dapat dimuat. Silakan coba warna lain.
            </p>
          </div>
        )}

        {/* Image */}
        {imageUrl && (
          <img
            ref={imgRef}
            src={imageUrl}
            alt={`${modelId.replace(/-/g, " ")} warna ${
              selectedColorData.name
            }`}
            className={`max-w-full max-h-full object-contain transition-opacity duration-200 ${
              isLoading || imageError ? "opacity-0" : "opacity-100"
            }`}
            onLoad={() => {
              setIsLoading(false);
              setPreloadedImages((prev) => ({
                ...prev,
                [selectedColorId]: true,
              }));
            }}
            onError={() => {
              setIsLoading(false);
              setImageError(true);
            }}
          />
        )}
      </div>

      {/* Color name displayed prominently */}
      {selectedColorData && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">{selectedColorData.name}</h3>
            <p className="text-sm text-gray-500">Tersedia untuk semua varian</p>
          </div>
          <div className="flex space-x-2">
            <div
              className="w-8 h-8 rounded-full border border-gray-200"
              style={{ backgroundColor: selectedColorHex }}
              title={`Color: ${selectedColorData.name}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
