export type ThemeName = "default" | "dark" | "ocean";

export const themes = {
  default: {
    background: "#ffffff",
    secondary: "#f3f4f6",
    text: "#111111",
    secondaryText: "#6b7280",
    border: "#e5e7eb",
    accent: "#facc15",
  },

  dark: {
    background: "#111111",
    secondary: "#1f1f1f",
    text: "#ffffff",
    secondaryText: "#a1a1aa",
    border: "#3f3f46",
    accent: "#d0f30b",
  },

  ocean: {
    background: "#f0f9ff",
    secondary: "#e0f2fe",
    text: "#0f172a",
    secondaryText: "#334155",
    border: "#a6c1cc",
    accent: "#0ea5e9",
  },
} as const;

export const themeOrder: ThemeName[] = [
  "default",
  "dark",
  "ocean",
];