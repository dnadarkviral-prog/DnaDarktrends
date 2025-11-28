/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#050507",
          800: "#0B0B0F",
          700: "#111118"
        },
        primary: {
          500: "#FF3B3B",
          600: "#E22929",
          700: "#C41E1E"
        }
      },
      boxShadow: {
        soft: "0 24px 60px rgba(0,0,0,0.5)"
      },
      borderRadius: {
        "2xl": "1rem"
      }
    }
  },
  plugins: []
};
