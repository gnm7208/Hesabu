import { createContext } from "react";

export type Appearance = "system" | "light" | "dark";

export const APPEARANCE_KEY = "hesabu.appearance";

export interface AppearanceValue {
  /** What the user chose. */
  appearance: Appearance;
  /** What that resolves to right now — "system" follows the device. */
  resolved: "light" | "dark";
  setAppearance: (next: Appearance) => void;
}

export const AppearanceContext = createContext<AppearanceValue>({
  appearance: "system",
  resolved: "light",
  setAppearance: () => {},
});
