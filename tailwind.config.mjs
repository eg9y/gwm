/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#000000", // GWM orange color
        secondary: "#4A4A4A", // Dark gray for text
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
