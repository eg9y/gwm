interface HeroProps {
  backgroundImage?: string; // Kept for backward compatibility
  desktopImage: string;
  mobileImage: string;
  videoBackground?: string; // Optional video background URL
  title: string;
  tagline?: string; // New optional tagline that appears above the title
  subtitle?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonLink?: string;
  overlayOpacity?: number; // Control the darkness of the overlay
  highlightColor?: string; // Color for highlights and accents
  imageDarkenAmount?: number; // Control the darkness level of the image filter (0-100)
}

const Hero = ({
  backgroundImage, // Keeping for backward compatibility
  desktopImage,
  mobileImage,
  videoBackground,
  title,
  tagline,
  subtitle,
  primaryButtonText,
  secondaryButtonText,
  primaryButtonLink = "/",
  secondaryButtonLink = "/",
  overlayOpacity = 0.3, // Default overlay opacity
  highlightColor = "#FF3E00", // Default highlight color (GWM red)
  imageDarkenAmount = 0, // Default darkness level
}: HeroProps) => {
  return (
    <section className="w-full relative text-white snap-start sm:min-h-screen overflow-hidden">
      {/* Desktop version - hidden on mobile, visible on sm screens and up */}
      <div className="hidden sm:flex absolute inset-0 flex-col justify-between items-center pt-20">
        {/* Background image with filter applied only to this element */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full"
          style={{
            backgroundImage: `url(${desktopImage || backgroundImage})`,
            filter: `brightness(${100 - imageDarkenAmount}%)`,
            zIndex: 0,
          }}
        />

        {/* Optional video background */}
        {videoBackground && (
          <div className="absolute inset-0 w-full h-full z-0">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: `brightness(${100 - imageDarkenAmount}%)` }}
            >
              <source src={videoBackground} type="video/mp4" />
            </video>
          </div>
        )}

        {/* Gradient overlay for better text readability */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-[1]"
          style={{ opacity: overlayOpacity }}
        />

        {/* Desktop content */}
        <div className="text-center px-5 max-w-7xl mx-auto pt-[8vh] z-10">
          {tagline && (
            <span
              className="inline-block px-4 py-1 mb-4 text-xs uppercase tracking-widest font-semibold rounded-full animate-fadeInDown"
              style={{
                backgroundColor: `${highlightColor}20`,
                color: highlightColor,
                border: `1px solid ${highlightColor}40`,
              }}
            >
              {tagline}
            </span>
          )}
          <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight leading-tight text-shadow-md animate-fadeInUp drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm md:text-base font-normal mb-8 opacity-95 animate-fadeIn animation-delay-300 max-w-xl mx-auto leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
              {subtitle}
            </p>
          )}

          {/* Decorative line */}
          <div className="flex justify-center">
            <div
              className="h-1 w-20 rounded animate-scaleIn animation-delay-500 mb-8"
              style={{ backgroundColor: highlightColor }}
            />
          </div>
        </div>

        <div className="flex flex-row gap-4 md:gap-6 justify-center items-center w-full px-8 mb-20 z-10">
          {primaryButtonText && (
            <a
              href={primaryButtonLink}
              className="group min-w-[180px] md:min-w-[240px] px-6 py-3.5 rounded-lg text-white text-sm font-medium text-center uppercase transition-all duration-300 hover:-translate-y-1 active:translate-y-0 animate-fadeInUp animation-delay-600 w-auto max-w-xs hover:shadow-lg relative overflow-hidden"
              style={{ backgroundColor: highlightColor }}
            >
              <span className="relative z-10">{primaryButtonText}</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </a>
          )}

          {secondaryButtonText && (
            <a
              href={secondaryButtonLink}
              className="group min-w-[180px] md:min-w-[240px] px-6 py-3.5 rounded-lg bg-white/15 text-white backdrop-blur-sm text-sm font-medium text-center uppercase transition-all duration-300 hover:-translate-y-1 active:translate-y-0 animate-fadeInUp animation-delay-700 w-auto max-w-xs hover:shadow-lg border border-white/30 relative overflow-hidden"
            >
              <span className="relative z-10">{secondaryButtonText}</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            </a>
          )}
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center animate-[pulse_3s_infinite] z-10">
          <span className="w-[30px] h-[50px] border-2 border-white/60 rounded-[25px] relative before:content-[''] before:absolute before:w-[6px] before:h-[6px] before:bg-white before:rounded-full before:left-1/2 before:-translate-x-1/2 before:top-[10px] before:animate-[scroll_2.5s_infinite]" />
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 left-20 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-20 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-float animation-delay-1000" />
      </div>

      {/* Mobile version - visible on mobile, hidden on sm screens and up */}
      <div className="block sm:hidden w-full">
        {/* Use an actual image element for mobile to get natural sizing */}
        <div className="relative w-full">
          {/* Background image with filter */}
          <div className="w-full">
            <img
              src={mobileImage || backgroundImage}
              alt="Hero background"
              className="w-full h-auto object-contain"
              style={{ filter: `brightness(${100 - imageDarkenAmount}%)` }}
            />
          </div>

          {/* Optional video background for mobile */}
          {videoBackground && (
            <div className="absolute inset-0 w-full h-full">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-contain"
                style={{ filter: `brightness(${100 - imageDarkenAmount}%)` }}
              >
                <source src={videoBackground} type="video/mp4" />
              </video>
            </div>
          )}

          {/* Gradient overlay for better text readability */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 z-[1]"
            style={{ opacity: overlayOpacity }}
          />

          {/* Overlay content for mobile - positioned absolute with flex */}
          <div className="absolute inset-0 flex flex-col justify-between z-10">
            {/* Top content area - moved to the top with minimal padding */}
            <div className="text-center px-4 max-w-7xl mx-auto pt-24">
              {tagline && (
                <span
                  className="inline-block px-3 py-1 mb-3 text-xs uppercase tracking-widest font-semibold rounded-full animate-fadeInDown"
                  style={{
                    backgroundColor: `${highlightColor}20`,
                    color: highlightColor,
                    border: `1px solid ${highlightColor}40`,
                  }}
                >
                  {tagline}
                </span>
              )}
              <h1 className="text-4xl font-bold mb-2 tracking-tight leading-tight text-shadow-md animate-fadeInUp drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)]">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs md:text-sm font-normal mb-4 opacity-95 animate-fadeIn animation-delay-300 max-w-md mx-auto leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                  {subtitle}
                </p>
              )}

              {/* Decorative line */}
              <div className="flex justify-center">
                <div
                  className="h-1 w-16 rounded animate-scaleIn animation-delay-500 mb-4"
                  style={{ backgroundColor: highlightColor }}
                />
              </div>
            </div>

            {/* Button area - positioned in the middle-lower section */}
            <div className="flex flex-col gap-3 justify-center items-center w-full px-4 absolute bottom-16 left-0 right-0">
              {primaryButtonText && (
                <a
                  href={primaryButtonLink}
                  className="group w-full px-5 py-3.5 rounded-lg text-white text-xs font-medium text-center uppercase transition-all duration-300 hover:scale-[1.02] active:scale-100 animate-fadeInUp animation-delay-600 max-w-xs shadow-lg relative overflow-hidden"
                  style={{ backgroundColor: highlightColor }}
                >
                  <span className="relative z-10">{primaryButtonText}</span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                </a>
              )}

              {secondaryButtonText && (
                <a
                  href={secondaryButtonLink}
                  className="group w-full px-5 py-3.5 rounded-lg bg-white/15 text-white backdrop-blur-md text-xs font-medium text-center uppercase transition-all duration-300 hover:scale-[1.02] active:scale-100 animate-fadeInUp animation-delay-700 max-w-xs shadow-lg border border-white/30 relative overflow-hidden"
                >
                  <span className="relative z-10">{secondaryButtonText}</span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                </a>
              )}
            </div>

            {/* Scroll indicator - position at bottom */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center animate-[pulse_3s_infinite]">
              <span className="w-[24px] h-[40px] border-2 border-white/60 rounded-[25px] relative before:content-[''] before:absolute before:w-[5px] before:h-[5px] before:bg-white before:rounded-full before:left-1/2 before:-translate-x-1/2 before:top-[10px] before:animate-[scroll_2.5s_infinite]" />
            </div>
          </div>
        </div>
      </div>

      {/* Add custom animations to tailwind */}
      <style>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        @keyframes scroll {
          0% { opacity: 1; top: 10px; }
          50% { opacity: 0.7; top: 25px; }
          100% { opacity: 1; top: 10px; }
        }
        .text-shadow-lg {
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.5);
        }
        .animate-fadeInUp {
          animation: fadeInUp 1s ease forwards;
        }
        .animate-fadeInDown {
          animation: fadeInDown 1s ease forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 1s ease forwards;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animation-delay-300 {
          animation-delay: 300ms;
        }
        .animation-delay-500 {
          animation-delay: 500ms;
        }
        .animation-delay-600 {
          animation-delay: 600ms;
        }
        .animation-delay-700 {
          animation-delay: 700ms;
        }
        .animation-delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </section>
  );
};

export default Hero;
