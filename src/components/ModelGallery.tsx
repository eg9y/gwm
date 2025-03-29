import { useState, type CSSProperties } from "react";
import type { Swiper as SwiperCore } from "swiper/types"; // Import Swiper type
import type { GalleryImage } from "../db/schema";
import { ResponsiveLazyImage } from "./ResponsiveImage";
import { ChevronLeft, ChevronRight } from "lucide-react"; // Import icons

// Swiper core styles must be imported first
import "swiper/css";
// Required Swiper modules styles
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/thumbs";
import "swiper/css/free-mode";

// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
// Import Swiper core and required modules
import { Navigation, Pagination, Thumbs, FreeMode } from "swiper/modules";

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
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperCore | null>(null);

  // If no gallery images provided or empty array, return null
  if (!gallery || gallery.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 text-center mb-4 md:mb-6">
        Gallery {modelName}
      </h2>

      {/* Main Swiper */}
      <div className="relative group">
        <Swiper
          modules={[Navigation, Pagination, Thumbs, FreeMode]}
          spaceBetween={10}
          navigation={{
            nextEl: ".swiper-button-next-custom",
            prevEl: ".swiper-button-prev-custom",
          }}
          pagination={{ clickable: true }}
          thumbs={{
            swiper:
              thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
          }}
          loop={true}
          className="w-full h-auto rounded-lg overflow-hidden shadow-lg aspect-[16/9] bg-gray-100 grab-cursor"
          style={
            {
              "--swiper-navigation-color": "#ffffff",
              "--swiper-pagination-color": "#ffffff",
              "--swiper-pagination-bullet-inactive-color": "#ffffff",
              "--swiper-pagination-bullet-inactive-opacity": "0.5",
              "--swiper-pagination-bullet-size": "8px",
              "--swiper-pagination-bullet-horizontal-gap": "4px",
            } as CSSProperties
          }
        >
          {gallery.map((image, index) => (
            <SwiperSlide
              key={`${modelId}-main-gallery-${image.imageUrl}-${index}`}
            >
              <ResponsiveLazyImage
                src={image.imageUrl}
                alt={image.alt || `${modelName} image ${index + 1}`}
                className="w-full h-full object-contain block"
                width="100%"
              />
              {/* Optional: Add caption inside the slide */}
              {image.alt && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-sm text-white text-center">{image.alt}</p>
                </div>
              )}
            </SwiperSlide>
          ))}
          {/* Custom Navigation Arrows */}
          <button
            type="button"
            aria-label="Previous Slide"
            className="swiper-button-prev-custom absolute left-2 top-1/2 -translate-y-1/2 z-10 cursor-pointer rounded-full bg-black/40 text-white p-2 hover:bg-black/60 focus:bg-black/60 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none ring-primary focus:ring-2 disabled:opacity-0"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            aria-label="Next Slide"
            className="swiper-button-next-custom absolute right-2 top-1/2 -translate-y-1/2 z-10 cursor-pointer rounded-full bg-black/40 text-white p-2 hover:bg-black/60 focus:bg-black/60 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none ring-primary focus:ring-2 disabled:opacity-0"
          >
            <ChevronRight size={24} />
          </button>
        </Swiper>
      </div>

      {/* Thumbnails Swiper */}
      {gallery.length > 1 && (
        <div className="w-full">
          <Swiper
            onSwiper={setThumbsSwiper}
            loop={false}
            spaceBetween={10}
            slidesPerView={4}
            freeMode={true}
            watchSlidesProgress={true}
            modules={[Thumbs, FreeMode]}
            className="mySwiperThumbs grab-cursor"
            breakpoints={{
              640: {
                slidesPerView: 5,
                spaceBetween: 10,
              },
              768: {
                slidesPerView: 6,
                spaceBetween: 15,
              },
              1024: {
                slidesPerView: 7,
                spaceBetween: 15,
              },
            }}
          >
            {gallery.map((image, index) => (
              <SwiperSlide
                key={`${modelId}-thumb-gallery-${image.imageUrl}-${index}`}
                className="cursor-pointer rounded-md overflow-hidden border-2 border-transparent opacity-60 hover:opacity-100 focus:opacity-100 transition-all duration-200 ease-in-out swiper-slide-thumb-active:opacity-100 swiper-slide-thumb-active:border-primary swiper-slide-thumb-active:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
              >
                <ResponsiveLazyImage
                  src={image.imageUrl}
                  alt={image.alt || `${modelName} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover block"
                  sizes="100px"
                  width={100}
                  height={60}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
}
