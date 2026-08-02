import type { Config } from "tailwindcss";

/**
 * Theme tokens mirror the CSS custom properties in app/globals.css —
 * the single source of truth for the design system. Components using
 * Tailwind utilities (strategy-center, outreach-studio) should use these
 * named colors so they stay in sync with the vanilla-CSS screens.
 */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        ink: { DEFAULT: "var(--ink)", soft: "var(--ink-soft)" },
        muted: "var(--muted)",
        faint: "var(--faint)",
        line: { DEFAULT: "var(--border)", soft: "var(--border-soft)" },
        accent: {
          blue: "var(--blue)",
          "blue-soft": "var(--blue-soft)",
          violet: "var(--violet)",
          "violet-soft": "var(--violet-soft)",
          pink: "var(--pink)",
          teal: "var(--teal)",
          "teal-soft": "var(--teal-soft)",
        },
        success: { DEFAULT: "var(--success)", soft: "var(--success-soft)" },
        warning: { DEFAULT: "var(--warning)", soft: "var(--warning-soft)" },
        danger: { DEFAULT: "var(--danger)", soft: "var(--danger-soft)" },
      },
      fontFamily: {
        sans: ["DM Sans", "Arial", "sans-serif"],
        display: ["Plus Jakarta Sans", "DM Sans", "sans-serif"],
        mono: ["DM Mono", "ui-monospace", "SF Mono", "monospace"],
      },
      fontSize: {
        display: ["29px", { lineHeight: "1.15", letterSpacing: "-1px", fontWeight: "800" }],
        title: ["18px", { lineHeight: "1.25", letterSpacing: "-0.4px", fontWeight: "700" }],
        section: ["15px", { lineHeight: "1.3", letterSpacing: "-0.3px", fontWeight: "700" }],
        body: ["13.5px", { lineHeight: "1.5" }],
        caption: ["12px", { lineHeight: "1.45" }],
        label: ["11px", { lineHeight: "1.3", letterSpacing: "0.4px", fontWeight: "700" }],
      },
      borderRadius: {
        card: "15px",
        control: "10px",
        chip: "8px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(36,34,32,0.04)",
        lift: "0 12px 28px rgba(36,34,32,0.09)",
        accent: "0 8px 18px rgba(75,115,255,0.28)",
      },
    },
  },
  plugins: [],
} satisfies Config;
