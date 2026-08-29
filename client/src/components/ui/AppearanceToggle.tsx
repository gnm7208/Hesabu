import { Monitor, Moon, Sun } from "lucide-react";
import { useContext } from "react";
import { AppearanceContext, type Appearance } from "../../context/appearance";

const OPTIONS: { id: Appearance; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "system", label: "Match device", icon: Monitor },
  { id: "dark", label: "Dark", icon: Moon },
];

/**
 * Three explicit states rather than a two-way switch.
 *
 * A plain light/dark toggle has to silently pick a starting side, which strands
 * anyone whose device already answers the question — and gives them no way back
 * to "follow my device" once they've touched it. Segmented control, so the
 * current state is readable without opening anything.
 */
export function AppearanceToggle() {
  const { appearance, setAppearance } = useContext(AppearanceContext);

  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className="flex items-center gap-0.5 rounded-lg bg-ink-100 p-0.5"
    >
      {OPTIONS.map(({ id, label, icon: Icon }) => {
        const selected = appearance === id;
        return (
          <button
            key={id}
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={() => setAppearance(id)}
            className={
              "flex size-7 items-center justify-center rounded-md " +
              "transition-[background-color,color,transform] duration-150 ease-out-strong " +
              "active:scale-90 active:duration-100 " +
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chama-500/40 " +
              (selected
                ? "bg-surface text-ink-900 shadow-card"
                : "text-ink-400 hover:text-ink-700")
            }
          >
            <Icon size={14} strokeWidth={2.1} />
          </button>
        );
      })}
    </div>
  );
}
