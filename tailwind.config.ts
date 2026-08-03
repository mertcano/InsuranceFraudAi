import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep, trustworthy finance palette (dark-first)
        ink: {
          950: "#070b18",
          900: "#0b1120",
          800: "#111a2e",
          700: "#1b2740",
          600: "#273452",
        },
        trust: {
          // primary — institutional blue
          50: "#eff6ff",
          100: "#dbeafe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        alert: {
          // fraud / high-risk
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
        },
        caution: {
          // review / medium-risk
          400: "#fbbf24",
          500: "#f59e0b",
        },
        safe: {
          // clear / low-risk
          400: "#34d399",
          500: "#10b981",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(59,130,246,0.15), 0 8px 32px -8px rgba(59,130,246,0.25)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 40px -12px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(244,63,94,0.5)" },
          "70%": { boxShadow: "0 0 0 10px rgba(244,63,94,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(244,63,94,0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "pulse-ring": "pulse-ring 2s infinite",
      },
    },
  },
  plugins: [],
};

export default config;