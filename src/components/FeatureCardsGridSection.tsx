import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import LazyLoadImage from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css"; // Optional blur effect

// Define the structure of a single card based on the Zod schema
interface FeatureCard {
  imageUrl: string;
  title: string;
  description: string;
  link?: string;
  altText?: string; // Optional explicit alt text for the image
}

interface FeatureCardsGridSectionProps {
  title: string; // Main section title
  subtitle?: string; // Optional section subtitle
  cards: FeatureCard[]; // Array of cards from typeSpecificData
}

const FeatureCardsGridSection: React.FC<FeatureCardsGridSectionProps> = ({
  title,
  subtitle,
  cards,
}) => {
  // Ensure we only render up to 3 cards, even if more are somehow provided
  const cardsToRender = cards.slice(0, 3);

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg md:text-xl text-gray-600">{subtitle}</p>
          )}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cardsToRender.map((card, index) => {
            const content = (
              <div
                key={index}
                // Apply base styles and transitions here. Hover effects are applied based on link presence below.
                className={`bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full transition-all duration-200 ease-in-out ${
                  card.link
                    ? "hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]"
                    : "hover:shadow-lg"
                }`}
              >
                <div className="aspect-video overflow-hidden">
                  <LazyLoadImage
                    src={card.imageUrl}
                    alt={card.altText || card.title} // Use explicit altText or fallback to title
                    effect="blur"
                    className="w-full h-full object-cover"
                    // wrapperClassName="w-full h-auto block"
                    width="100%" // Ensure width is set for layout calculation
                    height="auto" // Adjust if fixed height is needed
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-gray-600 text-base mb-4 flex-grow">
                    {card.description}
                  </p>
                  {/* Conditionally render CTA only if a link exists */}
                  {card.link && (
                    <div className="mt-auto pt-4">
                      <span className="text-primary font-semibold inline-flex items-center">
                        Learn More {/* Standard CTA text */}
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );

            // If card has a link, wrap it in a Link component
            if (card.link) {
              // Check if it's an internal or external link
              const isExternal = card.link.startsWith("http");
              return (
                <Link
                  key={index} // Use index for key as card content might not have unique ID yet
                  to={card.link}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  className="block h-full no-underline focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
                >
                  {content}
                </Link>
              );
            }
            // If no link, just render the content div (no else needed)
            return content;
          })}
        </div>
      </div>
    </section>
  );
};

export default FeatureCardsGridSection;
