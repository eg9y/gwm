/** @type {import('tailwindcss').Config} */

export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#000000", // GWM orange color
        secondary: "#4A4A4A", // Dark gray for text
        "color-1": "hsl(var(--color-1))",
        "color-2": "hsl(var(--color-2))",
        "color-3": "hsl(var(--color-3))",
        "color-4": "hsl(var(--color-4))",
        "color-5": "hsl(var(--color-5))",
      },
      animation: {
        rainbow: "rainbow var(--speed, 2s) infinite linear",
      },
      keyframes: {
        rainbow: {
          "0%": { "background-position": "0%" },
          "100%": { "background-position": "200%" },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "inherit",
            a: {
              color: "inherit",
              textDecoration: "inherit",
              fontWeight: "inherit",
            },
            h1: {
              fontWeight: "700",
            },
            h2: {
              fontWeight: "700",
            },
            h3: {
              fontWeight: "600",
            },
            blockquote: {
              fontWeight: "400",
              fontStyle: "italic",
              quotes: "none",
            },
            img: {
              maxWidth: "100%",
            },
            p: {
              marginTop: "1.25em",
              marginBottom: "1.25em",
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
