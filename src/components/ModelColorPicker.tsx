import React, { useState, useEffect, useRef } from "react";
import type { CarModelColor } from "../db/schema";
import { Loader2 } from "lucide-react"; // Import spinner icon
import { ResponsiveLazyImage } from "./ResponsiveImage";
// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import type SwiperCore from "swiper";
import "swiper/css"; // Import Swiper styles
// If you want fade effect later, uncomment these:
// import 'swiper/css/effect-fade';
// import { EffectFade } from 'swiper/modules';

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
  const [hoveredColorIndex, setHoveredColorIndex] = useState<number | null>(
    null
  );
  const [preloadedImages, setPreloadedImages] = useState<
    Record<string, boolean>
  >({});
  const [preloadingImages, setPreloadingImages] = useState<
    Record<string, boolean>
  >({});
  const [swiperInstance, setSwiperInstance] = useState<SwiperCore | null>(null);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false); // State for conditional loading overlay

  // Refs
  const preloadImageRef = useRef<Record<string, HTMLImageElement>>({});

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

  // Reset selectedColorIndex and Swiper when colors prop changes
  useEffect(() => {
    if (colorArray && colorArray.length > 0) {
      if (selectedColorIndex >= colorArray.length) {
        setSelectedColorIndex(0);
        swiperInstance?.slideTo(0, 0);
      }
      setPreloadedImages({});
      setPreloadingImages({});
    } else {
      setSelectedColorIndex(0);
      swiperInstance?.slideTo(0, 0);
    }
    if (swiperInstance && selectedColorIndex !== 0) {
      swiperInstance.slideTo(selectedColorIndex, 0);
    }
  }, [colorArray, swiperInstance, selectedColorIndex]);

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

  // Handle color swatch click: Update state and slide Swiper
  const handleColorClick = (index: number) => {
    if (index !== selectedColorIndex) {
      // Check if the target image is preloaded BEFORE starting the slide
      const targetColorId = `color_${index}`;
      if (!preloadedImages[targetColorId]) {
        // Only show overlay if the target image isn't preloaded yet
        setShowLoadingOverlay(true);
      }
      setSelectedColorIndex(index);
      swiperInstance?.slideTo(index);
    }
  };

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
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Pilih Warna</h2>

      {/* Color Preview Area with Swiper */}
      <div
        className="w-full rounded-lg shadow-lg overflow-hidden transition-colors duration-300 relative"
        style={{
          backgroundColor: selectedBackgroundColor,
          transition: "background-color 300ms ease-in-out",
        }}
      >
        <Swiper
          spaceBetween={0}
          slidesPerView={1}
          onSlideChange={(swiper) => {
            if (swiper.activeIndex !== selectedColorIndex) {
              setSelectedColorIndex(swiper.activeIndex);
            }
          }}
          onSlideChangeTransitionEnd={() => setShowLoadingOverlay(false)}
          onSwiper={setSwiperInstance}
          allowTouchMove={false}
          className="w-full h-auto"
          key={modelId}
        >
          {colorArray.map((color, index) => (
            <SwiperSlide key={`${modelId}-${color.name || index}-slide`}>
              <ResponsiveLazyImage
                src={color.imageUrl || ""}
                alt={`${modelId.replace(/-/g, " ")} warna ${
                  color.name || "Color"
                }`}
                className="w-full object-contain"
              />
            </SwiperSlide>
          ))}
        </Swiper>
        {showLoadingOverlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10 z-10 backdrop-blur-sm transition-opacity duration-100">
            <Loader2 className="h-10 w-10 animate-spin text-white text-opacity-75" />
          </div>
        )}
      </div>

      {/* Color Swatches */}
      <div className="flex flex-wrap justify-center gap-3">
        {colorArray.map((color, index) => (
          <button
            key={`${modelId}-${color.name}-${index}`}
            type="button"
            onClick={() => handleColorClick(index)}
            onMouseEnter={() => handleColorHover(index)}
            onMouseLeave={handleColorLeave}
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
        <span className="text-sm text-gray-600">Warna dipilih:</span>{" "}
        <span
          key={selectedColorIndex}
          className="inline-block animate-fade-in-fast font-semibold"
        >
          {selectedColorData?.name || "Default"}
        </span>
      </p>
    </div>
  );
}
