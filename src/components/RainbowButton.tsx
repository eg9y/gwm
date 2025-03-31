import type { ButtonHTMLAttributes } from "react";
import { cn } from "../utils/cn";

interface RainbowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: "primary" | "secondary";
  isMobile?: boolean;
  bgColor?: string;
}

export function RainbowButton({
  children,
  className,
  href,
  variant = "primary",
  isMobile = false,
  bgColor = "#D03000", // Default to the GWM highlight color
  ...props
}: RainbowButtonProps) {
  const buttonClasses = cn(
    "group relative inline-flex animate-rainbow cursor-pointer items-center justify-center rounded-lg border-0 bg-[length:200%] font-bold uppercase text-white transition-colors [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.08*1rem)_solid_transparent] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",

    // Base sizing - desktop vs mobile
    isMobile
      ? "w-full max-w-xs py-3 px-5 text-xs hover:scale-[1.02] active:scale-100"
      : "h-11 min-w-[180px] md:min-w-[240px] px-6 py-3.5 text-sm hover:-translate-y-1 active:translate-y-0",

    // Animation classes
    !isMobile && "animate-fadeInUp animation-delay-600",

    // before styles (glow effect)
    "before:absolute before:bottom-[-20%] before:left-1/2 before:z-0 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))] before:bg-[length:200%] before:[filter:blur(calc(0.8*1rem))]",

    // Additional GWM styling
    "transition-all duration-300 shadow-lg",

    className
  );

  const buttonStyle = {
    backgroundColor: bgColor, // Fallback background color
    // Add a subtle vertical gradient from the base color to a slightly darker shade
    backgroundImage: `linear-gradient(to bottom, ${bgColor}, color-mix(in srgb, ${bgColor} 85%, black))`,
  };

  // If href is provided, render as an anchor tag
  if (href) {
    return (
      <a href={href} className={buttonClasses} style={buttonStyle}>
        <span className="relative z-10">{children}</span>
      </a>
    );
  }

  // Otherwise render as a button
  return (
    <button className={buttonClasses} style={buttonStyle} {...props}>
      <span className="relative z-10">{children}</span>
    </button>
  );
}
