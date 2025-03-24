import { useState, useEffect, useRef } from "react";

// Types for the component props
interface ModelColorPickerProps {
  modelId: string;
  colors: {
    id: string;
    name: string;
    hex: string;
    backgroundColor?: string; // Optional background color for display
  }[];
  baseUrl?: string;
}

export function ModelColorPicker({
  modelId,
  colors,
  baseUrl = "https://gwm.kopimap.com/model_colors",
}: ModelColorPickerProps) {
  // State
  const [selectedColor, setSelectedColor] = useState<string>(
    colors[0]?.id || ""
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  const [preloadedImages, setPreloadedImages] = useState<
    Record<string, boolean>
  >({});
  const [preloadingImages, setPreloadingImages] = useState<
    Record<string, boolean>
  >({});

  // Refs
  const preloadImageRef = useRef<Record<string, HTMLImageElement>>({});

  // Format model ID (replace hyphens with underscores)
  const formattedModelId = modelId.replace(/-/g, "_");

  // Get the currently selected color data
  const selectedColorData = colors.find((color) => color.id === selectedColor);

  // Get the hex color and background color
  const selectedColorHex = selectedColorData?.hex || "#FFFFFF";
  const selectedBackgroundColor =
    selectedColorData?.backgroundColor || "#F5F5F5";

  // Reset selectedColor when colors change
  useEffect(() => {
    if (colors && colors.length > 0) {
      setSelectedColor(colors[0].id);
      setPreloadedImages({});
      setPreloadingImages({});
      setImageError(false);
    }
  }, [colors]);

  // Image URL for current selection
  const imageUrl = `${baseUrl}/${formattedModelId}/${selectedColor}.webp`;

  // Reset loading state when color changes
  useEffect(() => {
    if (selectedColor) {
      // Only set loading state if the image hasn't been preloaded
      if (preloadedImages[selectedColor]) {
        // If preloaded, we can skip the loading state
        setIsLoading(false);
      } else {
        setIsLoading(true);
        setImageError(false);
      }
    }
  }, [selectedColor, preloadedImages]);

  // Preload image on hover
  useEffect(() => {
    const preloadImage = (colorId: string) => {
      // Skip if already preloaded or currently preloading
      if (preloadedImages[colorId] || preloadingImages[colorId]) {
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

      img.src = `${baseUrl}/${formattedModelId}/${colorId}.webp`;
      preloadImageRef.current[colorId] = img;
    };

    if (hoveredColor && hoveredColor !== selectedColor) {
      preloadImage(hoveredColor);
    }

    return () => {
      // Clean up is handled by the preloadingImages state
    };
  }, [
    hoveredColor,
    formattedModelId,
    baseUrl,
    preloadedImages,
    preloadingImages,
    selectedColor,
  ]);

  // Handle mouse enter on color button
  const handleColorHover = (colorId: string) => {
    setHoveredColor(colorId);
  };

  // Handle mouse leave on color button
  const handleColorLeave = () => {
    setHoveredColor(null);
  };

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
          {colors.map((color) => (
            <button
              key={color.id}
              type="button"
              className={`group flex flex-col items-center transition-all max-w-[90px] ${
                selectedColor === color.id ? "scale-105" : "hover:scale-105"
              }`}
              onClick={() => setSelectedColor(color.id)}
              onMouseEnter={() => handleColorHover(color.id)}
              onMouseLeave={handleColorLeave}
              aria-label={`Warna ${color.name}`}
              title={color.name}
            >
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 mb-1 sm:mb-2 flex items-center justify-center ${
                  selectedColor === color.id
                    ? "border-primary shadow-lg"
                    : hoveredColor === color.id
                      ? "border-primary/60 shadow-md"
                      : "border-gray-300 group-hover:border-primary/60 group-hover:shadow-md"
                }`}
                style={{ backgroundColor: color.hex }}
              >
                {selectedColor === color.id && (
                  <span className="flex items-center justify-center text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <title>Warna terpilih</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                )}

                {/* Small preloading indicator */}
                {preloadingImages[color.id] && color.id !== selectedColor && (
                  <span className="absolute -bottom-1 -right-1 bg-white rounded-full w-4 h-4 flex items-center justify-center">
                    <div className="w-3 h-3 border-2 border-primary/40 border-t-transparent rounded-full animate-spin" />
                  </span>
                )}
              </div>
              <span
                className={`text-xs text-center break-words hyphens-auto px-1 ${
                  selectedColor === color.id
                    ? "font-medium text-primary"
                    : hoveredColor === color.id
                      ? "text-primary/80"
                      : "text-gray-600 group-hover:text-primary/80"
                }`}
              >
                {color.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Image container */}
      <div
        className="relative rounded-lg overflow-hidden h-[250px] sm:h-[300px] md:h-[350px] shadow-inner border border-gray-200"
        style={{ backgroundColor: selectedBackgroundColor }}
      >
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-opacity-70 bg-white">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error message if image can't be loaded */}
        {imageError && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500 text-center bg-white bg-opacity-75 px-4 py-3 sm:px-6 sm:py-4 rounded-lg shadow-sm text-sm sm:text-base">
              Maaf, gambar untuk warna ini belum tersedia.
              <br />
              Silakan pilih warna lain.
            </p>
          </div>
        )}

        {/* The vehicle image */}
        <img
          src={imageUrl}
          alt={`${modelId.replace(/-/g, " ")} warna ${
            selectedColorData?.name || selectedColor
          }`}
          className="w-full h-full object-contain transition-opacity duration-300"
          style={{ opacity: isLoading || imageError ? 0 : 1 }}
          onLoad={() => {
            setIsLoading(false);
            // Mark this color as preloaded
            setPreloadedImages((prev) => ({
              ...prev,
              [selectedColor]: true,
            }));
            // No longer preloading
            setPreloadingImages((prev) => ({
              ...prev,
              [selectedColor]: false,
            }));
          }}
          onError={() => {
            setIsLoading(false);
            setImageError(true);
            // Mark this color as failed
            setPreloadedImages((prev) => ({
              ...prev,
              [selectedColor]: false,
            }));
            // No longer preloading
            setPreloadingImages((prev) => ({
              ...prev,
              [selectedColor]: false,
            }));
          }}
        />
      </div>

      {/* Color name display */}
      <div className="mt-3 sm:mt-4 text-center">
        <span className="inline-block bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-gray-800 font-medium shadow-sm text-sm sm:text-base">
          {selectedColorData?.name || selectedColor}
        </span>
      </div>
    </div>
  );
}
