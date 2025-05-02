import React from "react";
import { Link } from "@tanstack/react-router"; // Assuming use of react-router for links

interface BannerProps {
  imageUrl: string;
  altText?: string | null;
  link?: string | null;
}

const Banner: React.FC<BannerProps> = ({ imageUrl, altText, link }) => {
  const bannerImage = (
    <img
      src={imageUrl}
      alt={altText || "Banner image"} // Provide a default alt text
      className="w-full h-auto object-cover" // Basic styling, adjust as needed
      loading="lazy" // Lazy load banner images below the fold
    />
  );

  if (link) {
    // Check if it's an external link
    const isExternal =
      link.startsWith("http://") || link.startsWith("https://");

    if (isExternal) {
      return (
        <a
          href={link}
          target="_blank" // Open external links in new tab
          rel="noopener noreferrer" // Security measure for external links
          className="block w-full" // Make the link block-level
        >
          {bannerImage}
        </a>
      );
    } else {
      // Assume internal link managed by router
      return (
        <Link to={link} className="block w-full">
          {bannerImage}
        </Link>
      );
    }
  } else {
    // If no link, just render the image
    return bannerImage;
  }
};

export default Banner;
