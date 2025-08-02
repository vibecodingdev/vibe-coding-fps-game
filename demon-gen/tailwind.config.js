const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "pages/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        gaming: {
          primary: "#ff6600",
          secondary: "#ff4400",
          accent: "#ffaa66",
          danger: "#ff4444",
          success: "#44ff00",
          "bg-primary": "#000000",
          "bg-secondary": "#1a1a1a",
          "bg-tertiary": "#2a2a2a",
          "text-primary": "#ffffff",
          "text-secondary": "#ffaa66",
          "text-muted": "#cccccc",
          border: "#333333",
          "border-hover": "#555555",
          glow: "rgba(255, 102, 0, 0.5)",
        },
        primary: {
          50: "#fff5f0",
          100: "#ffe5d6",
          200: "#ffccad",
          300: "#ffaa66",
          400: "#ff8833",
          500: "#ff6600",
          600: "#e55a00",
          700: "#cc4d00",
          800: "#b34000",
          900: "#8b3000",
        },
      },
      fontFamily: {
        sans: ["Inter", "var(--font-sans)", ...fontFamily.sans],
        gaming: ["Orbitron", "Rajdhani", "Space Mono", "monospace"],
        mono: ["Space Mono", "Courier New", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 5px rgba(255, 102, 0, 0.3)",
          },
          "50%": {
            boxShadow:
              "0 0 20px rgba(255, 102, 0, 0.5), 0 0 30px rgba(255, 68, 0, 0.3)",
          },
        },
        "hell-flicker": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "hell-flicker": "hell-flicker 2s infinite alternate",
      },
      backgroundImage: {
        "gaming-gradient":
          "linear-gradient(45deg, #ff6600 0%, #ff8800 50%, #ffaa66 100%)",
        "gaming-bg":
          "linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(139, 0, 0, 0.3) 30%, rgba(0, 0, 0, 0.95) 70%, rgba(75, 0, 0, 0.3) 100%)",
        "hell-grid":
          "linear-gradient(rgba(139, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 0, 0, 0.05) 1px, transparent 1px)",
      },
      boxShadow: {
        "gaming-glow": "0 0 15px rgba(255, 102, 0, 0.5)",
        "gaming-hover":
          "0 10px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 102, 0, 0.3)",
        "hell-glow": "0 0 20px #ff4400, 0 0 40px #ff4400",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
