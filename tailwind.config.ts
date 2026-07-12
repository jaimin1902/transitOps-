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
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#875A7B", // Main Brand Color
          600: "#714B67", // Primary Button
          700: "#5D3F56", // Hover
          800: "#4A3346", // Active
          900: "#392736", // Dark
        },
        gray: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
      },
      borderRadius: {
        button: "10px",
        input: "10px",
        card: "12px",
        modal: "16px",
        dropdown: "12px",
      },
      boxShadow: {
        small: "0 1px 2px rgba(0,0,0,.05)",
        medium: "0 4px 10px rgba(0,0,0,.08)",
        large: "0 10px 25px rgba(0,0,0,.12)",
      },
    },
  },
  plugins: [],
};
export default config;
