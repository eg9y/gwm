import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/autoplay";

interface ModelShowcaseProps {
  desktopImageUrls: string[];
  mobileImageUrls: string[];
  imageAlt?: string;
  title: string;
  subtitle?: string;
  description: string;
  price?: string;
  features?: string[];
  primaryButtonText?: string;
  secondaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonLink?: string;
  isReversed?: boolean;
}

const ModelShowcase = ({
  desktopImageUrls,
  mobileImageUrls,
  imageAlt,
  title,
  subtitle,
  description,
  price,
  features = [],
  primaryButtonText,
  primaryButtonLink,
  secondaryButtonText,
  secondaryButtonLink,
  isReversed = false,
}: ModelShowcaseProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Intersection observer to add fade-in effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Fallback if arrays are empty
  const desktopImages =
    desktopImageUrls?.length > 0
      ? desktopImageUrls
      : ["/placeholder-desktop.webp"];
  const mobileImages =
    mobileImageUrls?.length > 0
      ? mobileImageUrls
      : ["/placeholder-mobile.webp"];

  return (
    <section
      ref={sectionRef}
      className={`min-h-screen snap-start flex flex-col lg:flex-row ${
        isReversed ? "lg:flex-row-reverse" : ""
      } overflow-hidden relative perspective bg-gradient-to-br from-white via-white to-gray-50`}
    >
      {/* Background design elements */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />

      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Image showcase side */}
      <div
        className={`w-full lg:w-1/2 h-[45vh] sm:h-[50vh] lg:h-screen overflow-hidden relative shadow-2xl ${
          isVisible ? "animate-slide-in" : "opacity-0"
        }`}
        style={{
          transition: "opacity 0.8s ease, transform 1.2s ease",
          transitionDelay: "0.2s",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10 pointer-events-none" />

        {/* Use Swiper */}
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          autoplay={{
            delay: 3000 + Math.floor(Math.random() * 4000),
            disableOnInteraction: false,
          }}
          speed={1500 + Math.floor(Math.random() * 1500)}
          loop={desktopImages.length > 1}
          slidesPerView={1}
          className="w-full h-full"
        >
          {/* Map over desktop images for slides */}
          {desktopImages.map((imageUrl, index) => (
            <SwiperSlide
              key={`${title}-desktop-${index}-${imageUrl.substring(imageUrl.lastIndexOf("/") + 1)}`}
            >
              {/* Use picture element inside SwiperSlide for responsive sources */}
              <picture>
                {/* Provide mobile sources if available and distinct, otherwise fallback to desktop */}
                {mobileImages.length > 0 && (
                  <source
                    media="(max-width: 767px)"
                    srcSet={mobileImages[index % mobileImages.length]}
                  />
                )}
                {/* Desktop source */}
                <source media="(min-width: 768px)" srcSet={imageUrl} />
                {/* Fallback img tag */}
                <img
                  src={imageUrl}
                  alt={imageAlt || `${title} view ${index + 1}`}
                  className="w-full h-full object-cover object-center scale-[1.02] hover:scale-[1.05] transition-transform duration-7000"
                  loading="lazy"
                  decoding="async"
                  width="600"
                  height="400"
                />
              </picture>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Content side */}
      <div
        className={`w-full lg:w-1/2 px-6 py-8 sm:p-8 md:p-12 lg:p-16 flex flex-col justify-center relative z-10 grainy-bg ${
          isVisible ? "animate-fade-in" : "opacity-0"
        }`}
        style={{
          transition: "opacity 1s ease",
          transitionDelay: "0.4s",
        }}
      >
        <div className="max-w-xl">
          {/* Model title with accent line */}
          <div className="relative mb-2">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-primary">
              {title}
            </h2>
            <div className="h-1 w-12 bg-red-500 mt-3 rounded-full" />
          </div>

          {/* Display Subtitle if provided */}
          {subtitle && (
            <p className="text-lg sm:text-xl md:text-2xl font-light text-gray-600 mb-3 sm:mb-5">
              {subtitle}
            </p>
          )}

          {/* Price with improved styling */}
          {price && (
            <p className="text-xl sm:text-2xl font-semibold text-accent m-1 sm:mt-4 sm:mb-4 flex items-center gap-x-2">
              <span className="text-xs uppercase tracking-widest text-gray-400">
                Starting at
              </span>
              {price}
            </p>
          )}

          {/* Description with improved typography */}
          <p className="text-sm sm:text-base md:text-lg leading-relaxed mb-4 sm:mb-8 text-secondary max-w-xl opacity-80">
            {description}
          </p>

          {/* Improved feature section */}
          {features.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-5 mb-10 sm:mb-12">
              {features.map((feature, index) => (
                <div
                  key={`${title}-${feature.replace(/\s+/g, "-").toLowerCase()}`}
                  className={`flex items-start gap-x-3 p-1 sm:p-3 rounded-lg transition-all duration-300 ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  }`}
                  style={{
                    transitionDelay: `${0.1 * (index + 1)}s`,
                    backgroundColor:
                      index % 2 === 0 ? "rgba(0,0,0,0.01)" : "rgba(0,0,0,0.03)",
                  }}
                >
                  <span className="flex h-6 w-6 rounded-full bg-accent/10 items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-accent"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M5 14L9 17L19 7"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="text-sm text-secondary font-medium">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Enhanced buttons using props */}
          <div
            className={`flex flex-col sm:flex-row gap-3 sm:gap-4 mt-auto ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
            style={{
              transition: "opacity 0.6s ease, transform 0.6s ease",
              transitionDelay: "0.8s",
            }}
          >
            {/* Primary Button */}
            {primaryButtonText && primaryButtonLink && (
              <Link
                to={
                  primaryButtonLink.startsWith("/")
                    ? primaryButtonLink
                    : undefined
                }
                href={
                  !primaryButtonLink.startsWith("/")
                    ? primaryButtonLink
                    : undefined
                }
                target={
                  !primaryButtonLink.startsWith("/") ? "_blank" : undefined
                }
                rel={
                  !primaryButtonLink.startsWith("/")
                    ? "noopener noreferrer"
                    : undefined
                }
                className="group px-6 py-3.5 bg-primary text-white text-sm font-semibold text-center uppercase tracking-wide transition-all duration-300 hover:bg-primary/90 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {primaryButtonText}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 12H19M19 12L13 6M19 12L13 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              </Link>
            )}
            {/* Secondary Button */}
            {secondaryButtonText && secondaryButtonLink && (
              <Link
                to={
                  secondaryButtonLink.startsWith("/")
                    ? secondaryButtonLink
                    : undefined
                }
                href={
                  !secondaryButtonLink.startsWith("/")
                    ? secondaryButtonLink
                    : undefined
                }
                target={
                  !secondaryButtonLink.startsWith("/") ? "_blank" : undefined
                }
                rel={
                  !secondaryButtonLink.startsWith("/")
                    ? "noopener noreferrer"
                    : undefined
                }
                className="group px-6 py-3.5 bg-transparent border border-primary text-primary text-sm font-semibold text-center uppercase tracking-wide transition-all duration-300 hover:bg-primary/5 hover:-translate-y-1 hover:shadow-md active:translate-y-0 relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {secondaryButtonText}
                </span>
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Add custom animations */}
      <style>{`
        .perspective {
          perspective: 1000px;
        }
        
        .animate-fade-in {
          animation: fadeIn 1.2s ease forwards;
        }
        
        .animate-slide-in {
          animation: slideIn 1.2s ease forwards;
        }
        
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes slideIn {
          0% { 
            opacity: 0; 
            transform: ${isReversed ? "translateX(-20px)" : "translateX(20px)"}; 
          }
          100% { 
            opacity: 1; 
            transform: translateX(0); 
          }
        }
        
        .duration-7000 {
          transition-duration: 7000ms;
        }
      `}</style>
    </section>
  );
};

export default ModelShowcase;
