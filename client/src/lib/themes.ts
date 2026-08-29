/**
 * Chama themes.
 *
 * A chama's identity comes from what it is *for* — a mama mboga group saving
 * against stock, boda riders saving for a bike, parents saving for school fees.
 * Each theme pairs an accent ramp with a hand-drawn motif tiled faintly behind
 * the page.
 *
 * How the palette swap works: Tailwind v4 emits its theme colours as CSS custom
 * properties and every utility reads them through `var()`, so writing
 * `--color-chama-600` onto a wrapper element re-tints every `bg-chama-*` /
 * `text-chama-*` inside it. No per-theme utility classes, no config changes —
 * adding a theme below is the entire job.
 *
 * The slug list is mirrored in server/schemas/group.py, which validates it.
 */

export type ThemeId = "harambee" | "mboga" | "boda" | "shule" | "kilimo" | "biashara";

/** Motif drawn by ThemeBackdrop. */
export type MotifId = "coins" | "produce" | "wheels" | "books" | "crops" | "shop";

export interface Theme {
  id: ThemeId;
  label: string;
  /** What kind of chama this suits — shown in the picker. */
  blurb: string;
  motif: MotifId;
  /**
   * Steps 50-800 of the accent ramp. Only the steps the UI actually uses are
   * listed; anything missing falls back to the stylesheet's default green.
   */
  accent: Record<50 | 100 | 200 | 500 | 600 | 700 | 800, string>;
}

export const THEMES: Theme[] = [
  {
    id: "harambee",
    label: "Harambee",
    blurb: "General savings and welfare groups",
    motif: "coins",
    accent: {
      50: "#f0fdf4",
      100: "#dcfce7",
      200: "#bbf7d0",
      500: "#22c55e",
      600: "#16a34a",
      700: "#15803d",
      800: "#166534",
    },
  },
  {
    id: "mboga",
    label: "Mama Mboga",
    blurb: "Grocers and market traders",
    motif: "produce",
    accent: {
      50: "#f7fee7",
      100: "#ecfccb",
      200: "#d9f99d",
      500: "#84cc16",
      600: "#65a30d",
      700: "#4d7c0f",
      800: "#3f6212",
    },
  },
  {
    id: "boda",
    label: "Boda Riders",
    blurb: "Riders saving toward bikes and repairs",
    motif: "wheels",
    accent: {
      50: "#fff7ed",
      100: "#ffedd5",
      200: "#fed7aa",
      500: "#f97316",
      600: "#ea580c",
      700: "#c2410c",
      800: "#9a3412",
    },
  },
  {
    id: "shule",
    label: "School Fees",
    blurb: "Parents saving for termly fees",
    motif: "books",
    accent: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
    },
  },
  {
    id: "kilimo",
    label: "Kilimo",
    blurb: "Farmers pooling for seed and inputs",
    motif: "crops",
    accent: {
      50: "#fefce8",
      100: "#fef9c3",
      200: "#fef08a",
      500: "#eab308",
      600: "#ca8a04",
      700: "#a16207",
      800: "#854d0e",
    },
  },
  {
    id: "biashara",
    label: "Biashara",
    blurb: "Shopkeepers and small business circles",
    motif: "shop",
    accent: {
      50: "#eef2ff",
      100: "#e0e7ff",
      200: "#c7d2fe",
      500: "#6366f1",
      600: "#4f46e5",
      700: "#4338ca",
      800: "#3730a3",
    },
  },
];

const BY_ID = new Map(THEMES.map((t) => [t.id, t]));

export function getTheme(id: string | null | undefined): Theme {
  return BY_ID.get((id ?? "") as ThemeId) ?? THEMES[0];
}

/**
 * Accent ramp as inline CSS custom properties, for spreading onto a wrapper's
 * `style`. Returned as a plain record so React can apply it without a cast at
 * every call site.
 */
export function themeVars(theme: Theme): Record<string, string> {
  return Object.fromEntries(
    Object.entries(theme.accent).map(([step, hex]) => [`--color-chama-${step}`, hex]),
  );
}
