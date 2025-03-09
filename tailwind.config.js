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
  plugins: [],
};
