import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { getAboutUs } from "../server/about-us";
import { ResponsiveLazyImage } from "../components/ResponsiveImage";
import WhatsAppButton from "../components/WhatsAppButton";

export const Route = createFileRoute("/about-us")({
  component: AboutUsPage,
  loader: async () => {
    try {
      const aboutUsContent = await getAboutUs();
      return { aboutUsContent };
    } catch (error) {
      console.error("Error fetching about us content:", error);
      return {
        aboutUsContent: null,
        error: "Failed to load about us content",
      };
    }
  },
});

function AboutUsPage() {
  const { aboutUsContent, error } = Route.useLoaderData();
  const brandName = process.env.BRAND_NAME || "GWM Indonesia";

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);

    // Set page title
    document.title = aboutUsContent?.title
      ? `${aboutUsContent.title} | ${brandName}`
      : `About Us | ${brandName}`;
  }, [aboutUsContent, brandName]);

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="bg-red-50 p-4 rounded-md shadow">
          <p className="text-red-700">
            There was an error loading the about us content. Please try again
            later.
          </p>
        </div>
      </div>
    );
  }

  if (!aboutUsContent) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="bg-yellow-50 p-4 rounded-md shadow">
          <p className="text-yellow-700">
            No about us content is available at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="bg-white pt-8 md:pt-16"
        style={{ viewTransitionName: "main-content" }}
      >
        {/* Hero section with background overlay */}
        {aboutUsContent.imageUrl && (
          <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] mb-12 overflow-hidden">
            <ResponsiveLazyImage
              src={aboutUsContent.imageUrl}
              alt={aboutUsContent.imageAlt || "GWM Indonesia"}
              className="w-full h-full object-cover"
              sizes="100vw"
              wrapperClassName="absolute inset-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-6 md:p-10 text-white">
              <h1 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-lg">
                {aboutUsContent.title}
              </h1>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 md:px-8 mb-20">
          {/* If no image is provided, show the title here */}
          {!aboutUsContent.imageUrl && (
            <h1 className="text-3xl md:text-5xl font-bold text-primary mb-8">
              {aboutUsContent.title}
            </h1>
          )}

          {/* Content Section */}
          <div
            className="prose prose-lg max-w-none mb-16 prose-headings:text-primary prose-img:rounded-lg prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: aboutUsContent.content }}
          />

          {/* Mission & Vision Section with improved styling */}
          {(aboutUsContent.mission || aboutUsContent.vision) && (
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
              {aboutUsContent.mission && (
                <div className="bg-white p-8 rounded-xl shadow-lg border-l-4 border-primary transition-transform duration-300 hover:scale-[1.02]">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                      <svg
                        className="w-6 h-6 text-primary"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-primary">
                      Our Mission
                    </h2>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {aboutUsContent.mission}
                  </p>
                </div>
              )}

              {aboutUsContent.vision && (
                <div className="bg-white p-8 rounded-xl shadow-lg border-l-4 border-primary transition-transform duration-300 hover:scale-[1.02]">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                      <svg
                        className="w-6 h-6 text-primary"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 6c3.79 0 7.17 2.13 8.82 5.5C19.17 14.87 15.79 17 12 17s-7.17-2.13-8.82-5.5C4.83 8.13 8.21 6 12 6m0-2C7 4 2.73 7.11 1 11.5 2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4zm0 5c1.38 0 2.5 1.12 2.5 2.5S13.38 14 12 14s-2.5-1.12-2.5-2.5S10.62 9 12 9m0-2c-2.48 0-4.5 2.02-4.5 4.5S9.52 16 12 16s4.5-2.02 4.5-4.5S14.48 7 12 7z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-primary">
                      Our Vision
                    </h2>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {aboutUsContent.vision}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <WhatsAppButton />
    </>
  );
}
