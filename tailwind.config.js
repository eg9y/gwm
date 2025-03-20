/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#171a20",
        secondary: "#393c41",
        accent: "#3e6ae1",
        "light-gray": "#f4f4f4",
      },
      fontFamily: {
        sans: ['"Gotham"', '"Helvetica Neue"', "Arial", "sans-serif"],
      },
    },
  },
  plugins: [
    ({ addUtilities }) => {
      const newUtilities = {
        ".text-shadow-sm": {
          textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
        },
        ".text-shadow": {
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        },
        ".text-shadow-lg": {
          textShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        },
        ".text-shadow-none": {
          textShadow: "none",
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
