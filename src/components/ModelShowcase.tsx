interface ModelShowcaseProps {
  modelId: string;
  imageUrls: string[];
  title: string;
  description: string;
  price?: string;
  features?: string[];
  primaryButtonText?: string;
  secondaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonLink?: string;
  isReversed?: boolean;
}

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/autoplay";
import { Link } from "@tanstack/react-router";

const ModelShowcase = ({
  modelId,
  imageUrls,
  title,
  description,
  price,
  features = [],
  primaryButtonText,
  // secondaryButtonText,
  // secondaryButtonLink = "/",
  isReversed = false,
}: ModelShowcaseProps) => {
  return (
    <section
      className={`min-h-screen snap-start flex flex-col lg:flex-row ${
        isReversed ? "lg:flex-row-reverse" : ""
      } overflow-hidden bg-white`}
    >
      <div
        className="w-full lg:w-1/2 h-[40vh] sm:h-[50vh] lg:h-screen overflow-hidden relative"
        style={{ aspectRatio: "600 / 400" }}
      >
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          autoplay={{
            delay: 3000 + Math.floor(Math.random() * 4000),
            disableOnInteraction: false,
          }}
          speed={1500 + Math.floor(Math.random() * 1500)}
          loop={true}
          slidesPerView={1}
          className="w-full h-full"
        >
          {imageUrls.map((imageUrl, index) => (
            <SwiperSlide
              key={`${title}-slide-${imageUrl.substring(imageUrl.lastIndexOf("/") + 1)}`}
            >
              <img
                src={imageUrl}
                alt={`${title} view ${index + 1}`}
                className="w-full h-full object-cover object-center"
                loading="lazy"
                decoding="async"
                width="600"
                height="400"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="w-full lg:w-1/2 px-6 py-8 sm:p-8 md:p-12 lg:p-16 flex flex-col justify-center text-primary">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 tracking-tight">
          {title}
        </h2>

        {price && (
          <p className="text-xl sm:text-2xl font-semibold text-accent mb-4">
            {price}
          </p>
        )}

        <p className="text-sm sm:text-base md:text-lg leading-tight tracking-tight mb-6 text-secondary max-w-xl">
          {description}
        </p>

        {features.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-10">
            {features.map((feature) => (
              <div
                key={`${title}-${feature.replace(/\s+/g, "-").toLowerCase()}`}
                className="flex items-start gap-x-3"
              >
                <span className="flex h-[1lh] items-center">
                  <span className="text-accent text-xl font-bold">✓</span>
                </span>
                <span className="text-xs sm:text-base text-secondary">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-auto">
          {primaryButtonText && (
            <Link
              to={"/tipe-mobil/$model"}
              params={{
                model: modelId,
              }}
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded bg-primary text-white text-xs sm:text-sm font-medium text-center uppercase transition-all duration-300 hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0"
            >
              {primaryButtonText}
            </Link>
          )}

          {/* {secondaryButtonText && (
              <a
                href={secondaryButtonLink}
                className="px-4 sm:px-6 py-2.5 sm:py-3 rounded bg-gray-100 text-secondary text-xs sm:text-sm font-medium text-center uppercase transition-all duration-300 border border-gray-200 hover:bg-gray-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                {secondaryButtonText}
              </a>
            )} */}
        </div>
      </div>
    </section>
  );
};

export default ModelShowcase;
