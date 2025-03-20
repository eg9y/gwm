interface HeroProps {
  backgroundImage?: string; // Kept for backward compatibility
  desktopImage: string;
  mobileImage: string;
  title: string;
  subtitle?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonLink?: string;
}

const Hero = ({
  backgroundImage, // Keeping for backward compatibility
  desktopImage,
  mobileImage,
  title,
  subtitle,
  primaryButtonText,
  secondaryButtonText,
  primaryButtonLink = "/",
  secondaryButtonLink = "/",
}: HeroProps) => {
  return (
    <section className="w-full relative text-primary snap-start sm:min-h-screen">
      {/* Desktop version - hidden on mobile, visible on sm screens and up */}
      <div
        className="hidden sm:flex absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full flex-col justify-between items-center pt-20"
        style={{ backgroundImage: `url(${desktopImage || backgroundImage})` }}
      >
        {/* Desktop content */}
        <div className="text-center px-5 max-w-7xl mx-auto pt-[5vh] z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-3 tracking-tight leading-tight text-shadow-sm">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm md:text-base font-normal mb-8 opacity-90 animate-fadeIn max-w-xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-row gap-4 md:gap-6 justify-center items-center w-full px-8 mb-20 z-10">
          {primaryButtonText && (
            <a
              href={primaryButtonLink}
              className="min-w-[180px] md:min-w-[240px] px-6 py-3 rounded bg-primary/90 text-white text-sm font-medium text-center uppercase transition-all duration-300 hover:bg-primary hover:-translate-y-0.5 active:translate-y-0 animate-fadeIn animation-delay-100 w-auto max-w-xs hover:shadow-lg"
            >
              {primaryButtonText}
            </a>
          )}

          {secondaryButtonText && (
            <a
              href={secondaryButtonLink}
              className="min-w-[180px] md:min-w-[240px] px-6 py-3 rounded bg-white/75 text-[#393c41] text-sm font-medium text-center uppercase transition-all duration-300 hover:bg-white/90 hover:-translate-y-0.5 active:translate-y-0 animate-fadeIn animation-delay-200 w-auto max-w-xs hover:shadow-lg"
            >
              {secondaryButtonText}
            </a>
          )}
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center animate-[bounce_2s_infinite] z-10">
          <span className="w-[30px] h-[50px] border-2 border-primary rounded-[25px] relative before:content-[''] before:absolute before:w-[6px] before:h-[6px] before:bg-primary before:rounded-full before:left-1/2 before:-translate-x-1/2 before:top-[10px] before:animate-[scroll_2s_infinite]" />
        </div>
      </div>

      {/* Mobile version - visible on mobile, hidden on sm screens and up */}
      <div className="block sm:hidden w-full">
        {/* Use an actual image element for mobile to get natural sizing */}
        <div className="relative w-full">
          <img
            src={mobileImage || backgroundImage}
            alt="Hero background"
            className="w-full h-auto object-contain"
          />

          {/* Overlay content for mobile - positioned absolute with flex */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {/* Top content area - moved to the top with minimal padding */}
            <div className="text-center px-4 max-w-7xl mx-auto pt-20">
              <h1 className="text-4xl font-bold mb-2 tracking-tight leading-tight text-shadow-sm">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs font-normal mb-4 opacity-90 animate-fadeIn max-w-md mx-auto leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Button area - positioned in the middle-lower section */}
            <div className="flex flex-col gap-3 justify-center items-center w-full px-4 absolute bottom-24 left-0 right-0">
              {primaryButtonText && (
                <a
                  href={primaryButtonLink}
                  className="w-full px-5 py-3 rounded-md bg-gradient-to-r from-black/20 to-black/30 text-white text-xs font-medium text-center uppercase transition-all duration-300 hover:from-black/95 hover:to-black/80 hover:-translate-y-0.5 active:translate-y-0 animate-fadeIn animation-delay-100 max-w-xs hover:shadow-md backdrop-blur-xs border border-white/10 shadow-lg"
                >
                  {primaryButtonText}
                </a>
              )}

              {secondaryButtonText && (
                <a
                  href={secondaryButtonLink}
                  className="w-full px-5 py-3 rounded-md bg-white/80 text-[#393c41] text-xs font-medium text-center uppercase transition-all duration-300 hover:bg-white/95 hover:-translate-y-0.5 active:translate-y-0 animate-fadeIn animation-delay-200 max-w-xs hover:shadow-md backdrop-blur-sm shadow-lg"
                >
                  {secondaryButtonText}
                </a>
              )}
            </div>

            {/* Scroll indicator - position at bottom */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center animate-[bounce_2s_infinite]">
              <span className="w-[24px] h-[40px] border-2 border-primary rounded-[25px] relative before:content-[''] before:absolute before:w-[5px] before:h-[5px] before:bg-primary before:rounded-full before:left-1/2 before:-translate-x-1/2 before:top-[10px] before:animate-[scroll_2s_infinite]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
