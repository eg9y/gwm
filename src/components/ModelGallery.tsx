import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
} from "react";
import type { Swiper as SwiperCore } from "swiper/types";
import type { GalleryImage } from "../db/schema";
import { ResponsiveLazyImage } from "./ResponsiveImage";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "swiper/css/free-mode";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Thumbs, FreeMode } from "swiper/modules";
import { memo } from "react";

interface ModelGalleryProps {
  modelId: string;
  modelName: string;
  gallery?: GalleryImage[];
}

export const ModelGallery = memo(function ModelGallery({
  modelId,
  modelName,
  gallery = [],
}: ModelGalleryProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperCore | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mainSwiperRef = useRef<SwiperCore | null>(null);
  const initialized = useRef(false);

  if (!gallery || gallery.length === 0) return null;

  // Preload the first few images
  useEffect(() => {
    for (const image of gallery.slice(0, 3)) {
      const img = new Image();
      img.src = image.imageUrl;
    }
  }, [gallery]);

  // Swiper initialization with cleanup
  useEffect(() => {
    if (initialized.current) return;
    const timer = setTimeout(() => {
      if (mainSwiperRef.current) {
        mainSwiperRef.current.update();
        mainSwiperRef.current.slideTo(0, 0);
        initialized.current = true;
      }
      if (thumbsSwiper) {
        thumbsSwiper.update();
        thumbsSwiper.slideTo(0, 0);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [thumbsSwiper]);

  // Fullscreen toggle handler
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Handle slide change for active index tracking
  const handleSlideChange = useCallback((swiper: SwiperCore) => {
    setActiveIndex(Math.round(swiper.realIndex));
  }, []);

  return (
    <div
      className={`w-full space-y-6 ${isFullscreen ? "fixed inset-0 z-50 bg-black" : ""}`}
    >
      <h2 className="text-3xl font-bold text-gray-900 text-center mb-4 md:mb-6">
        {modelName} Gallery
      </h2>

      {/* Main Swiper */}
      <div className="relative group w-full">
        <Swiper
          modules={[Navigation, Thumbs, FreeMode]}
          slidesPerView="auto"
          spaceBetween={10}
          freeMode={{
            enabled: true,
            sticky: false,
            momentum: true,
            momentumRatio: 0.7,
          }}
          navigation={{
            nextEl: ".swiper-button-next-custom",
            prevEl: ".swiper-button-prev-custom",
          }}
          thumbs={{
            swiper:
              thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
          }}
          grabCursor={true}
          resistanceRatio={0.85}
          speed={400}
          threshold={5}
          touchReleaseOnEdges={true}
          onSwiper={(swiper) => {
            mainSwiperRef.current = swiper;
            swiper.slideTo(0, 0);
          }}
          onSlideChange={handleSlideChange}
          className="w-full rounded-lg overflow-hidden bg-gray-900/5 will-change-transform"
          style={
            {
              "--swiper-navigation-color": "#ffffff",
              "--swiper-pagination-color": "#ffffff",
              "--swiper-pagination-bullet-inactive-color": "#ffffff",
              "--swiper-pagination-bullet-inactive-opacity": "0.3",
              "--swiper-pagination-bullet-size": "10px",
              "--swiper-pagination-bullet-horizontal-gap": "6px",
            } as CSSProperties
          }
        >
          {gallery.map((image, index) => (
            <SwiperSlide
              key={`${modelId}-main-${image.imageUrl}-${index}`}
              className="flex-shrink-0 flex justify-center items-center"
              style={{ width: "auto" }} // Let the width be determined by the image
            >
              <div className="h-full max-h-[380px] md:max-h-[60vh] overflow-hidden relative">
                <img
                  src={image.imageUrl}
                  alt={image.alt || `${modelName} Image ${index + 1}`}
                  className={`h-[380px] object-contain ${isFullscreen ? "max-h-screen" : ""}`}
                  loading={index < 3 ? "eager" : "lazy"}
                  // sizes="(max-width: 768px) 380px, 50vw"
                />
                {image.alt && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-base font-medium text-white text-center">
                      {image.alt}
                    </p>
                  </div>
                )}
              </div>
            </SwiperSlide>
          ))}

          {/* Custom Navigation */}
          <button
            type="button"
            aria-label="Previous Slide"
            className="swiper-button-prev-custom absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-gray-900/70 p-3 text-white hover:bg-gray-900 focus:bg-gray-900 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none ring-2 ring-offset-2 ring-gray-500"
          >
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="Next Slide"
            className="swiper-button-next-custom absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-gray-900/70 p-3 text-white hover:bg-gray-900 focus:bg-gray-900 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none ring-2 ring-offset-2 ring-gray-500"
          >
            <ChevronRight size={28} strokeWidth={2.5} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-20 rounded-full bg-gray-900/70 p-2 text-white hover:bg-gray-900 focus:bg-gray-900 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none ring-2 ring-offset-2 ring-gray-500"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </Swiper>
      </div>

      {/* Thumbnails Swiper */}
      {gallery.length > 1 && (
        <div
          className={`w-full max-w-5xl mx-auto py-3 ${isFullscreen ? "hidden" : ""}`}
        >
          <Swiper
            onSwiper={(swiper) => {
              setThumbsSwiper(swiper);
              swiper.slideTo(0, 0);
            }}
            spaceBetween={8}
            slidesPerView="auto"
            freeMode={true}
            watchSlidesProgress={true}
            modules={[Thumbs]}
            className="mySwiperThumbs select-none will-change-transform"
          >
            {gallery.map((image, index) => (
              <SwiperSlide
                key={`${modelId}-thumb-${image.imageUrl}-${index}`}
                style={{ width: "auto" }}
                className={`cursor-pointer rounded-md overflow-hidden border-2 transition-all duration-300 ease-in-out ${
                  activeIndex === index
                    ? "border-blue-600 opacity-100 scale-105 shadow-md"
                    : "border-transparent opacity-80 hover:opacity-100 hover:border-gray-300"
                }`}
              >
                <ResponsiveLazyImage
                  src={image.imageUrl}
                  alt={image.alt || `${modelName} Thumbnail ${index + 1}`}
                  className="w-20 h-20 object-cover"
                  sizes="80px"
                  width={80}
                  height={80}
                  loading={index < 5 ? "eager" : "lazy"}
                  effect="blur"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
});
