import { useContext } from "react";
import { AppearanceContext } from "../context/appearance";

export function useAppearance() {
  return useContext(AppearanceContext);
}
