import { useState, useEffect, useRef, useCallback } from "react";
import { useDrag } from "@use-gesture/react";

// Types for the component props
interface OneEightyViewProps {
  modelId: string;
  colors: {
    id: string;
    name: string;
    hex: string;
    backgroundColor?: string; // Optional background color for display
    explicitFrames?: number[]; // Optional explicit list of frame numbers
  }[];
  totalFrames?: number;
  baseUrl?: string;
}

// Define drag state interface
interface DragState {
  isDragging: boolean;
  lastX: number;
}

// Image cache by color and frame
interface ImageCache {
  [colorId: string]: {
    [frameIndex: number]: boolean;
  };
}

// Initial configuration for Tank 300
const DEFAULT_TOTAL_FRAMES = 24; // Assuming 24 frames for a 180 degree view
const DEFAULT_BASE_URL = "https://gwm.kopimap.com/180_view";

export function OneEightyView({
  modelId,
  colors,
  totalFrames = DEFAULT_TOTAL_FRAMES,
  baseUrl = DEFAULT_BASE_URL,
}: OneEightyViewProps) {
  // State
  const [selectedColor, setSelectedColor] = useState<string>(
    colors[0]?.id || "orange"
  );
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadedFrames, setLoadedFrames] = useState<number>(0);
  const [dragSensitivity] = useState<number>(0.5); // Adjust this to control drag sensitivity
  const [isUserDraggingSlider, setIsUserDraggingSlider] =
    useState<boolean>(false);
  const [availableFrames, setAvailableFrames] = useState<number[]>([]);
  const [imageCache, setImageCache] = useState<ImageCache>({});

  // Get explicit frames for the selected color if available
  const selectedColorData = colors.find((color) => color.id === selectedColor);
  const hasExplicitFrames =
    selectedColorData?.explicitFrames &&
    selectedColorData.explicitFrames.length > 0;

  // Get the hex color of the selected color for background
  const selectedColorHex = selectedColorData?.hex || "#FFFFFF";

  // Get the background color for display, fall back to a lighter version of the hex color if not provided
  const selectedBackgroundColor =
    selectedColorData?.backgroundColor || selectedColorHex;

  // Check if all frames for the current color have been preloaded
  const allFramesPreloaded = useCallback(() => {
    if (!availableFrames.length) return false;

    const colorCache = imageCache[selectedColor] || {};
    return availableFrames.every((frame) => colorCache[frame] === true);
  }, [availableFrames, imageCache, selectedColor]);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const loadingRef = useRef<boolean>(true);
  const loadedFramesRef = useRef<number>(0);
  const loadedStatusRef = useRef<boolean[]>(Array(totalFrames).fill(false));
  const attemptedFramesRef = useRef<boolean[]>(Array(totalFrames).fill(false));

  // A more stable image loading implementation that avoids recursion issues
  const preloadImages = useCallback(() => {
    // Create cache entry for this color if it doesn't exist
    if (!imageCache[selectedColor]) {
      setImageCache((prev) => ({
        ...prev,
        [selectedColor]: {},
      }));
    }

    // Check if frames for this color have already been loaded
    const cachedFrames = imageCache[selectedColor] || {};

    // Reset loading state
    setIsLoading(true);
    setLoadedFrames(0);
    loadingRef.current = true;
    loadedFramesRef.current = 0;

    // Get the color data for the currently selected color
    const colorData = colors.find((color) => color.id === selectedColor);

    // Check if we have explicit frames for this color
    if (colorData?.explicitFrames && colorData.explicitFrames.length > 0) {
      // Use explicit frames
      const framesToLoad = [...colorData.explicitFrames].sort((a, b) => a - b);
      setAvailableFrames(framesToLoad);

      loadedStatusRef.current = Array(totalFrames).fill(false);
      attemptedFramesRef.current = Array(totalFrames).fill(false);

      const formattedModelId = modelId.replace(/-/g, "_");
      let loadedCount = 0;

      // Filter out frames that have already been loaded
      const unloadedFrames = framesToLoad.filter(
        (frameIndex) => !cachedFrames[frameIndex]
      );

      // If all frames are already loaded, skip loading process
      if (unloadedFrames.length === 0) {
        setIsLoading(false);
        loadingRef.current = false;

        // Select the first frame if the current one is invalid
        if (!framesToLoad.includes(currentFrame)) {
          setCurrentFrame(framesToLoad[0] || 0);
        }
        return;
      }

      setLoadedFrames(framesToLoad.length - unloadedFrames.length);
      loadedCount = framesToLoad.length - unloadedFrames.length;

      // Create a promise for each image that needs loading
      const loadPromises = unloadedFrames.map((frameIndex) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            loadedCount++;
            setLoadedFrames(loadedCount);

            // Update cache
            setImageCache((prev) => ({
              ...prev,
              [selectedColor]: {
                ...prev[selectedColor],
                [frameIndex]: true,
              },
            }));

            resolve();
          };
          img.onerror = () => {
            console.warn(
              `Failed to load explicit frame ${frameIndex} for ${selectedColor}`
            );
            resolve(); // Resolve anyway to continue loading
          };
          img.src = `${baseUrl}/${formattedModelId}/${selectedColor}/${frameIndex}.webp`;
        });
      });

      // When all images are loaded
      Promise.all(loadPromises).then(() => {
        setIsLoading(false);
        loadingRef.current = false;

        // Select the first frame if the current one is invalid
        if (!framesToLoad.includes(currentFrame)) {
          setCurrentFrame(framesToLoad[0] || 0);
        }
      });

      // If there's nothing to load, mark as completed
      if (loadPromises.length === 0) {
        setIsLoading(false);
        loadingRef.current = false;
      }

      return; // Skip the auto-detection process
    }

    // If no explicit frames, use the auto-detection method
    loadedStatusRef.current = Array(totalFrames).fill(false);
    attemptedFramesRef.current = Array(totalFrames).fill(false);
    const successfullyLoadedFrames: number[] = [];
    let autoDetectedCount = 0;

    // Convert hyphens to underscores in the model ID for the image path
    const formattedModelId = modelId.replace(/-/g, "_");

    // Function to handle a single image loaded
    const handleImageLoaded = (index: number) => {
      if (!loadedStatusRef.current[index]) {
        loadedStatusRef.current[index] = true;
        loadedFramesRef.current += 1;
        successfullyLoadedFrames.push(index);
        autoDetectedCount++;
        setLoadedFrames(autoDetectedCount);

        // Update cache
        setImageCache((prev) => ({
          ...prev,
          [selectedColor]: {
            ...prev[selectedColor],
            [index]: true,
          },
        }));

        // Sort the available frames for proper sequencing
        successfullyLoadedFrames.sort((a, b) => a - b);
        setAvailableFrames([...successfullyLoadedFrames]);

        // Check if we've tried loading all frames
        if (attemptedFramesRef.current.every((attempted) => attempted)) {
          loadingRef.current = false;
          setIsLoading(false);

          // If we don't have any frames at all, something is wrong
          if (successfullyLoadedFrames.length === 0) {
            console.error(`No frames could be loaded for ${selectedColor}`);
          } else if (
            currentFrame >= successfullyLoadedFrames.length ||
            !successfullyLoadedFrames.includes(currentFrame)
          ) {
            // Set to the first available frame if current is invalid
            setCurrentFrame(successfullyLoadedFrames[0] || 0);
          }
        }
      }
    };

    // Function to handle image loading error
    const handleImageError = (index: number) => {
      console.warn(
        `Could not load image at frame ${index} for ${selectedColor} - this frame may not exist`
      );
      attemptedFramesRef.current[index] = true;

      // Check if we've tried loading all frames
      if (attemptedFramesRef.current.every((attempted) => attempted)) {
        loadingRef.current = false;
        setIsLoading(false);

        // If we don't have any frames at all, something is wrong
        if (successfullyLoadedFrames.length === 0) {
          console.error(`No frames could be loaded for ${selectedColor}`);
        } else if (
          currentFrame >= successfullyLoadedFrames.length ||
          !successfullyLoadedFrames.includes(currentFrame)
        ) {
          // Set to the first available frame if current is invalid
          setCurrentFrame(successfullyLoadedFrames[0] || 0);
        }
      }
    };

    // First check if we can populate available frames from cache
    const cachedFrameIndices = Object.keys(cachedFrames)
      .filter((key) => cachedFrames[Number.parseInt(key)])
      .map((key) => Number.parseInt(key))
      .sort((a, b) => a - b);

    if (cachedFrameIndices.length > 0) {
      setAvailableFrames(cachedFrameIndices);
      autoDetectedCount = cachedFrameIndices.length;
      setLoadedFrames(autoDetectedCount);
    }

    // Load all potential frames
    for (let i = 0; i < totalFrames; i++) {
      // Skip already cached frames
      if (cachedFrames[i]) {
        successfullyLoadedFrames.push(i);
        loadedStatusRef.current[i] = true;
        attemptedFramesRef.current[i] = true;
        continue;
      }

      const img = new Image();
      img.onload = () => {
        handleImageLoaded(i);
        attemptedFramesRef.current[i] = true;
      };
      img.onerror = () => {
        handleImageError(i);
      };
      img.src = `${baseUrl}/${formattedModelId}/${selectedColor}/${i}.webp`;
    }

    // If we have frames in cache already, check if we're done
    if (cachedFrameIndices.length > 0) {
      // Update available frames from cache immediately
      successfullyLoadedFrames.push(...cachedFrameIndices);
      successfullyLoadedFrames.sort((a, b) => a - b);

      const uniqueFrames = [...new Set(successfullyLoadedFrames)];
      setAvailableFrames(uniqueFrames);

      // If all frames were from cache, finish loading
      if (uniqueFrames.length === cachedFrameIndices.length) {
        setIsLoading(false);
        loadingRef.current = false;
      }
    }
  }, [
    modelId,
    selectedColor,
    totalFrames,
    baseUrl,
    currentFrame,
    colors,
    imageCache,
  ]);

  // Trigger preloading when color or model changes
  useEffect(() => {
    preloadImages();
  }, [preloadImages]);

  // Map slider position to available frames
  const mapFrameIndex = useCallback(
    (index: number) => {
      if (availableFrames.length === 0) return 0;

      // If index is in available frames, use it directly
      if (availableFrames.includes(index)) return index;

      // Otherwise, find the closest available frame
      const closestFrame = availableFrames.reduce((prev, curr) =>
        Math.abs(curr - index) < Math.abs(prev - index) ? curr : prev
      );

      return closestFrame;
    },
    [availableFrames]
  );

  // Set up drag handling for the image viewer with special handling for large gaps
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    lastX: 0,
  });

  const bind = useDrag(({ first, last, movement: [mx], xy: [x] }) => {
    if (isUserDraggingSlider || availableFrames.length === 0) return;

    if (first) {
      setDragState({ isDragging: true, lastX: x });
      return;
    }

    if (last) {
      setDragState({ ...dragState, isDragging: false });
      return;
    }

    const deltaX = x - dragState.lastX;
    const frameDelta = Math.floor(deltaX * dragSensitivity);

    if (frameDelta !== 0) {
      if (availableFrames.length === 0) return;

      // Find current index in available frames array
      const currentIndexInAvailable = availableFrames.indexOf(currentFrame);
      if (currentIndexInAvailable === -1) return;

      // Calculate new index in available frames array
      let newIndexInAvailable =
        (currentIndexInAvailable - frameDelta) % availableFrames.length;
      if (newIndexInAvailable < 0)
        newIndexInAvailable += availableFrames.length;

      // Get the actual frame number
      const newFrame = availableFrames[newIndexInAvailable];

      setCurrentFrame(newFrame);
      setDragState({ isDragging: true, lastX: x });
    }
  });

  // Handle slider interactions
  const handleSliderTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderTrackRef.current || availableFrames.length === 0) return;

    const rect = sliderTrackRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const trackWidth = rect.width;
    const clickRatio = Math.max(0, Math.min(1, clickPosition / trackWidth));

    // Map the ratio to an index in available frames
    const indexInAvailable = Math.floor(
      clickRatio * (availableFrames.length - 1)
    );
    const newFrame = availableFrames[indexInAvailable];

    setCurrentFrame(newFrame);
  };

  const handleSliderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsUserDraggingSlider(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (
        !isUserDraggingSlider ||
        !sliderTrackRef.current ||
        availableFrames.length === 0
      )
        return;

      const rect = sliderTrackRef.current.getBoundingClientRect();
      const mousePosition = e.clientX - rect.left;
      const trackWidth = rect.width;
      const ratio = Math.max(0, Math.min(1, mousePosition / trackWidth));

      // Map the ratio to an index in available frames
      const indexInAvailable = Math.floor(ratio * (availableFrames.length - 1));
      const newFrame = availableFrames[indexInAvailable];

      setCurrentFrame(newFrame);
    };

    const handleMouseUp = () => {
      setIsUserDraggingSlider(false);
    };

    if (isUserDraggingSlider) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isUserDraggingSlider, availableFrames]);

  // Handle touch events for the slider
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (
        !isUserDraggingSlider ||
        !sliderTrackRef.current ||
        e.touches.length === 0 ||
        availableFrames.length === 0
      )
        return;

      const rect = sliderTrackRef.current.getBoundingClientRect();
      const touchPosition = e.touches[0].clientX - rect.left;
      const trackWidth = rect.width;
      const ratio = Math.max(0, Math.min(1, touchPosition / trackWidth));

      // Map the ratio to an index in available frames
      const indexInAvailable = Math.floor(ratio * (availableFrames.length - 1));
      const newFrame = availableFrames[indexInAvailable];

      setCurrentFrame(newFrame);
    };

    const handleTouchEnd = () => {
      setIsUserDraggingSlider(false);
    };

    if (isUserDraggingSlider) {
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isUserDraggingSlider, availableFrames]);

  const handleSliderTouchStart = () => {
    setIsUserDraggingSlider(true);
  };

  // Get current frame's position for slider display
  const getCurrentFramePositionRatio = () => {
    if (availableFrames.length === 0) return 0;
    const index = availableFrames.indexOf(currentFrame);
    return index >= 0 ? index / (availableFrames.length - 1) : 0;
  };

  // Should we show the loading overlay?
  const showLoading = isLoading && !allFramesPreloaded();

  return (
    <div className="mb-16 relative bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
      {/* New feature badge */}
      <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-sm font-medium shadow-md transform translate-x-1 -translate-y-1">
        Fitur Baru
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        Lihat dari Segala Sudut
      </h2>
      <p className="text-gray-600 mb-6">
        Putar untuk melihat {modelId.replace("-", " ")} dari berbagai sudut
        pandang
      </p>

      {/* Color selection */}
      <div className="mb-6">
        <p className="text-gray-700 font-medium mb-2">Pilih Warna:</p>
        <div className="flex flex-wrap gap-3">
          {colors.map((color) => (
            <button
              key={color.id}
              type="button"
              className={`flex flex-col items-center transition-all ${
                selectedColor === color.id ? "scale-105" : ""
              }`}
              onClick={() => setSelectedColor(color.id)}
              aria-label={`Warna ${color.name}`}
              title={color.name}
            >
              <div
                className={`w-16 h-16 rounded-full border-2 mb-2 flex items-center justify-center ${
                  selectedColor === color.id
                    ? "border-primary shadow-lg"
                    : "border-gray-300"
                }`}
                style={{ backgroundColor: color.hex }}
              >
                {selectedColor === color.id && (
                  <span className="flex items-center justify-center text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
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
              </div>
              <span
                className={`text-xs text-center ${
                  selectedColor === color.id
                    ? "font-medium text-primary"
                    : "text-gray-600"
                }`}
              >
                {color.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 180 degree view container */}
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden md:h-[400px] cursor-grab active:cursor-grabbing shadow-inner border border-gray-200"
        style={{ backgroundColor: selectedBackgroundColor }}
        {...bind()}
      >
        {/* Loading overlay - only show if we haven't loaded all frames */}
        {showLoading && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center z-10"
            style={{ backgroundColor: `${selectedBackgroundColor}E6` }}
          >
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-700 font-medium bg-white bg-opacity-75 px-4 py-2 rounded-full">
              Memuat{" "}
              {Math.round(
                (loadedFrames / (availableFrames.length || totalFrames)) * 100
              )}
              %
            </p>
          </div>
        )}

        {/* No frames found message */}
        {!isLoading && availableFrames.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500 text-center bg-white bg-opacity-75 px-6 py-4 rounded-lg shadow-sm">
              Maaf, tampilan 360° untuk warna ini belum tersedia.
              <br />
              Silakan pilih warna lain.
            </p>
          </div>
        )}

        {/* Image frames - only render available frames */}
        {availableFrames.map((index) => {
          const frameKey = `${modelId}-${selectedColor}-frame-${index}`;
          // Convert hyphens to underscores in the model ID for the image path
          const formattedModelId = modelId.replace(/-/g, "_");

          // Check if this image has been loaded before
          const isPreloaded = imageCache[selectedColor]?.[index] === true;

          return (
            <img
              key={frameKey}
              ref={(el) => {
                if (el) imagesRef.current[index] = el;
              }}
              src={`${baseUrl}/${formattedModelId}/${selectedColor}/${index}.webp`}
              alt={`${modelId} ${selectedColor} view ${index}`}
              className={`absolute inset-0 w-full h-full object-contain ${
                // Only apply transition if the image is not preloaded or during initial loading
                !isPreloaded && isLoading
                  ? "transition-opacity duration-500"
                  : ""
              } ${
                currentFrame === index ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            />
          );
        })}

        {/* Instructions - only show if we have frames */}
        {availableFrames.length > 0 && (
          <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
            <p className="text-gray-700 bg-white bg-opacity-75 mx-auto py-2 px-4 rounded-full shadow-sm backdrop-blur-sm inline-block">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 inline mr-2 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <title>Arah kiri</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16l-4-4m0 0l4-4m-4 4h18"
                />
              </svg>
              Seret untuk memutar tampilan
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 inline ml-2 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <title>Rotasi ke kanan</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </p>
          </div>
        )}
      </div>

      {/* Custom slider for precise control - only show if we have frames */}
      {availableFrames.length > 0 && (
        <div className="mt-4 mb-4 px-4">
          <div
            ref={sliderTrackRef}
            className="h-2 bg-gray-200 rounded-full relative cursor-pointer"
            onClick={handleSliderTrackClick}
            onKeyDown={(e) => {
              if (availableFrames.length === 0) return;

              // Find current index in available frames array
              const currentIndexInAvailable =
                availableFrames.indexOf(currentFrame);
              if (currentIndexInAvailable === -1) return;

              // Left arrow decreases frame, right arrow increases frame
              if (e.key === "ArrowLeft") {
                const newIndex =
                  currentIndexInAvailable === 0
                    ? availableFrames.length - 1
                    : currentIndexInAvailable - 1;
                setCurrentFrame(availableFrames[newIndex]);
              } else if (e.key === "ArrowRight") {
                const newIndex =
                  (currentIndexInAvailable + 1) % availableFrames.length;
                setCurrentFrame(availableFrames[newIndex]);
              }
            }}
            tabIndex={0}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={availableFrames.length - 1}
            aria-valuenow={availableFrames.indexOf(currentFrame)}
            aria-valuetext={`Frame ${currentFrame} dari total ${availableFrames.length} frame tersedia`}
          >
            {/* Progress track */}
            <div
              className="absolute left-0 top-0 h-full bg-primary rounded-full"
              style={{ width: `${getCurrentFramePositionRatio() * 100}%` }}
            />

            {/* Draggable handle */}
            <div
              ref={sliderRef}
              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-primary shadow-md flex items-center justify-center -ml-3 cursor-grab active:cursor-grabbing"
              style={{ left: `${getCurrentFramePositionRatio() * 100}%` }}
              onMouseDown={handleSliderMouseDown}
              onTouchStart={handleSliderTouchStart}
              aria-label={`Atur sudut pandang (frame ${currentFrame} dari total ${availableFrames.length} frame tersedia)`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
