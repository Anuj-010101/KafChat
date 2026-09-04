/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0A0B0F", // app background — near-black
          panel: "#121319", // sidebar / cards
          soft: "#191B23", // hover / secondary surface
          border: "#252833",
        },
        signal: {
          sky: "#38BDF8", // primary CTA / streak flame / brand accent
          "sky-dim": "#0EA5E9",
          "sky-deep": "#0284C7", // online / active / read-ticks / links
          "sky-deep-dim": "#075E93",
        },
        ash: {
          DEFAULT: "#ECEAE3", // primary text
          muted: "#8B8F9C", // secondary text
          faint: "#565A68",
        },
        danger: "#F16063",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        panel: "0 8px 30px rgba(0,0,0,0.35)",
        glow: "0 0 0 4px rgba(56,189,248,0.15)",
      },
      keyframes: {
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(2,132,199,0.55)" },
          "70%": { boxShadow: "0 0 0 8px rgba(2,132,199,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(2,132,199,0)" },
        },
        bubbleIn: {
          "0%": { opacity: 0, transform: "translateY(6px) scale(0.98)" },
          "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
        },
        flicker: {
          "0%, 100%": { transform: "scale(1) rotate(0deg)" },
          "50%": { transform: "scale(1.08) rotate(-3deg)" },
        },
      },
      animation: {
        pulseRing: "pulseRing 2s infinite",
        bubbleIn: "bubbleIn 0.18s ease-out",
        flicker: "flicker 1.6s ease-in-out infinite",
      },
      borderRadius: {
        bubble: "1.25rem",
      },
    },
  },
  plugins: [],
};
