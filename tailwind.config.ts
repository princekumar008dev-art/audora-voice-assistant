import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        echo: {
          dark: "#0b0f19",
          card: "#121826",
          accent: "#00d2ff",
          glow: "#00f0ff",
          purple: "#7928ca",
          ring: "#0ea5e9",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 8s linear infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "wave": "wave 1.2s ease-in-out infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 15px rgba(0, 210, 255, 0.5), inset 0 0 15px rgba(0, 210, 255, 0.3)" },
          "100%": { boxShadow: "0 0 35px rgba(0, 210, 255, 0.9), 0 0 60px rgba(121, 40, 202, 0.6), inset 0 0 25px rgba(0, 240, 255, 0.7)" },
        },
        wave: {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
