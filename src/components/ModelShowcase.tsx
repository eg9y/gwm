interface ModelShowcaseProps {
  imageUrl: string;
  title: string;
  description: string;
  features?: string[];
  primaryButtonText?: string;
  secondaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonLink?: string;
  isReversed?: boolean;
}

const ModelShowcase = ({
  imageUrl,
  title,
  description,
  features = [],
  primaryButtonText,
  secondaryButtonText,
  primaryButtonLink = "/",
  secondaryButtonLink = "/",
  isReversed = false,
}: ModelShowcaseProps) => {
  return (
    <section
      className={`min-h-screen snap-start flex flex-col lg:flex-row ${
        isReversed ? "lg:flex-row-reverse" : ""
      } overflow-hidden bg-white`}
    >
      <div className="w-full lg:w-1/2 h-[40vh] sm:h-[50vh] lg:h-screen overflow-hidden relative">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover object-center transition-transform duration-300 ease-in-out hover:scale-[1.03]"
        />
      </div>

      <div className="w-full lg:w-1/2 px-6 py-8 sm:p-8 md:p-12 lg:p-16 flex flex-col justify-center text-primary">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium mb-4 tracking-tight">
          {title}
        </h2>
        <p className="text-sm sm:text-base md:text-lg leading-relaxed mb-6 text-secondary max-w-xl">
          {description}
        </p>

        {features.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-10">
            {features.map((feature) => (
              <div
                key={`${title}-${feature.replace(/\s+/g, "-").toLowerCase()}`}
                className="flex items-start"
              >
                <span className="text-accent mr-2 text-xl font-bold">✓</span>
                <span className="text-xs sm:text-sm text-secondary">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-auto">
          {primaryButtonText && (
            <a
              href={primaryButtonLink}
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded bg-primary text-white text-xs sm:text-sm font-medium text-center uppercase transition-all duration-300 hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0"
            >
              {primaryButtonText}
            </a>
          )}

          {secondaryButtonText && (
            <a
              href={secondaryButtonLink}
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded bg-gray-100 text-secondary text-xs sm:text-sm font-medium text-center uppercase transition-all duration-300 border border-gray-200 hover:bg-gray-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              {secondaryButtonText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

export default ModelShowcase;
