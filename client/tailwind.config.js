/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-teal": "#0a8e6e",
        "brand-blue": "#4056e3",
        "brand-sky": "#00aeda",
        "brand-navy": "#111144",
        "brand-yellow": "#e5c603",
        page: "#f5f7fa",
        surface: "#ffffff",
        "surface-muted": "#f1f4f8",
        border: "#d8dee8",
        body: "#2e3440",
        heading: "#111144",
        muted: "#5b6573",
      },
    },
  },
  plugins: [],
};

