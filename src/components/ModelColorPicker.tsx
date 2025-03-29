import React, { useState, useEffect, useRef } from "react";
import type { CarModelColor } from "../db/schema";
import { ResponsiveLazyImage } from "./ResponsiveImage";

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
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Warna</h2>

      {/* Color Preview Image */}
      <div
        className="w-full aspect-video rounded-lg shadow-lg overflow-hidden transition-colors duration-300"
        style={{ backgroundColor: selectedBackgroundColor }}
      >
        <ResponsiveLazyImage
          src={imageUrl}
          alt={`${modelId.replace(/-/g, " ")} warna ${
            selectedColorData?.name || "Color"
          }`}
          className="w-full h-full object-contain p-4 md:p-8"
        />
      </div>

      {/* Color Swatches */}
      <div className="flex flex-wrap justify-center gap-3">
        {colorArray.map((color, index) => (
          <button
            key={`${modelId}-${color.name}-${index}`}
            type="button"
            onClick={() => setSelectedColorIndex(index)}
            className={`w-10 h-10 rounded-full border-2 transition-all transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              index === selectedColorIndex
                ? "border-primary ring-2 ring-primary ring-offset-2"
                : "border-gray-300 hover:border-gray-400 focus:ring-gray-400"
            }`}
            style={{ backgroundColor: color.hex || "#000000" }}
            aria-label={`Select color ${color.name || index + 1}`}
            title={color.name || `Color ${index + 1}`}
          />
        ))}
      </div>

      {/* Selected Color Name */}
      <p className="text-center text-gray-700">
        Warna dipilih: <strong>{selectedColorData?.name || "Default"}</strong>
      </p>
    </div>
  );
}
