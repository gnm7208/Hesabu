import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  APPEARANCE_KEY,
  AppearanceContext,
  type Appearance,
} from "./appearance";

function readStored(): Appearance {
  try {
    const raw = localStorage.getItem(APPEARANCE_KEY);
    return raw === "light" || raw === "dark" ? raw : "system";
  } catch {
    // Private browsing / blocked storage — following the device is a sane default.
    return "system";
  }
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<Appearance>(readStored);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false,
  );

  // Track the device setting even while an explicit preference is active, so
  // switching back to "system" lands on the right appearance immediately.
  useEffect(() => {
    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mql) return;
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const resolved: "light" | "dark" =
    appearance === "system" ? (systemDark ? "dark" : "light") : appearance;

  // The attribute is the single source of truth the stylesheet reads; colorScheme
  // makes native controls (selects, date pickers, scrollbars) follow along.
  useEffect(() => {
    document.documentElement.dataset.appearance = resolved;
    document.documentElement.style.colorScheme = resolved;
  }, [resolved]);

  const setAppearance = useCallback((next: Appearance) => {
    setAppearanceState(next);
    try {
      if (next === "system") localStorage.removeItem(APPEARANCE_KEY);
      else localStorage.setItem(APPEARANCE_KEY, next);
    } catch {
      // Preference just won't survive a reload; the session still works.
    }
  }, []);

  return (
    <AppearanceContext.Provider value={{ appearance, resolved, setAppearance }}>
      {children}
    </AppearanceContext.Provider>
  );
}
