import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Add custom color shades for the Kanban board
        blue: {
          "25": "#f5f8ff",
          "50": "#eff6ff",
          "100": "#dbeafe",
          "200": "#bfdbfe",
          "400": "#3b82f6",
          "800": "#1e40af",
        },
        purple: {
          "25": "#f9f5ff",
          "50": "#f5f3ff",
          "100": "#ede9fe",
          "200": "#ddd6fe",
          "400": "#a855f7",
          "800": "#6b21a8",
        },
        amber: {
          "25": "#fffcf5",
          "50": "#fffbeb",
          "100": "#fef3c7",
          "200": "#fde68a",
          "400": "#f59e0b",
          "800": "#92400e",
        },
        teal: {
          "25": "#f0fdfa",
          "50": "#e6fffa",
          "100": "#ccfbf1",
          "200": "#99f6e4",
          "400": "#2dd4bf",
          "800": "#115e59",
        },
        indigo: {
          "25": "#f5f8ff",
          "50": "#eef2ff",
          "100": "#e0e7ff",
          "200": "#c7d2fe",
          "400": "#6366f1",
          "800": "#3730a3",
        },
        green: {
          "25": "#f3faf7",
          "50": "#ecfdf5",
          "100": "#d1fae5",
          "200": "#a7f3d0",
          "400": "#22c55e",
          "800": "#166534",
        },
        red: {
          "25": "#fef5f5",
          "50": "#fef2f2",
          "100": "#fee2e2",
          "200": "#fecaca",
          "400": "#f87171",
          "800": "#991b1b",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config

