/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0b0e11",
        surface: "#1e2329",
        border: "#2b3139",
        primary: {
          DEFAULT: "#FF6B00",
          foreground: "#ffffff",
        },
        success: "#02c076",
        error: "#f84960",
        muted: "#848e9c",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      borderRadius: {
        DEFAULT: "2px",
        sm: "1px",
        md: "2px",
        lg: "4px",
        xl: "4px",
      },
    },
  },
  plugins: [],
};