interface HeroProps {
  backgroundImage: string;
  title: string;
  subtitle?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonLink?: string;
}

const Hero = ({
  backgroundImage,
  title,
  subtitle,
  // primaryButtonText,
  secondaryButtonText,
  // primaryButtonLink = "/",
  secondaryButtonLink = "/",
}: HeroProps) => {
  return (
    <section
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex flex-col justify-between items-center pt-16 sm:pt-20 relative text-primary snap-start"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="text-center px-4 sm:px-5 max-w-7xl mx-auto pt-[10vh] sm:pt-[15vh]">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium mb-2.5 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm md:text-base font-normal mb-6 sm:mb-8 opacity-80 animate-fadeIn max-w-md sm:max-w-xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center items-center w-full px-4 sm:px-8 mb-16 sm:mb-20">
        {/* {primaryButtonText && (
          <a
            href={primaryButtonLink}
            className="w-full sm:min-w-[180px] md:min-w-[240px] px-4 sm:px-6 py-2.5 sm:py-3 rounded bg-primary/80 text-white text-xs sm:text-sm font-medium text-center uppercase transition-all duration-300 hover:bg-primary hover:-translate-y-0.5 active:translate-y-0 animate-fadeIn animation-delay-100 sm:w-auto max-w-xs"
          >
            {primaryButtonText}
          </a>
        )} */}

        {secondaryButtonText && (
          <a
            href={secondaryButtonLink}
            className="w-full sm:min-w-[180px] md:min-w-[240px] px-4 sm:px-6 py-2.5 sm:py-3 rounded bg-white/65 text-[#393c41] text-xs sm:text-sm font-medium text-center uppercase transition-all duration-300 hover:bg-white/80 hover:-translate-y-0.5 active:translate-y-0 animate-fadeIn animation-delay-200 sm:w-auto max-w-xs"
          >
            {secondaryButtonText}
          </a>
        )}
      </div>

      <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center animate-[bounce_2s_infinite]">
        <span className="w-[24px] sm:w-[30px] h-[40px] sm:h-[50px] border-2 border-primary rounded-[25px] relative before:content-[''] before:absolute before:w-[5px] sm:before:w-[6px] before:h-[5px] sm:before:h-[6px] before:bg-primary before:rounded-full before:left-1/2 before:-translate-x-1/2 before:top-[10px] before:animate-[scroll_2s_infinite]" />
      </div>
    </section>
  );
};

export default Hero;
