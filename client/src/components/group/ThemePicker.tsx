import { Check, Palette } from "lucide-react";
import { useState } from "react";
import { useAppearance } from "../../hooks/useAppearance";
import { useUpdateGroup } from "../../hooks/useGroups";
import { THEMES, getTheme, themeVars, type ThemeId } from "../../lib/themes";
import { Button } from "../ui/Button";
import { ErrorNote } from "../ui/Feedback";

/**
 * Theme chooser for a group.
 *
 * Never applied automatically from the group's name — guessing a chama's
 * character from its title would be wrong often enough to feel presumptuous, and
 * this is the treasurer's decision about their own group's identity.
 */
export function ThemePicker({
  groupId,
  current,
  onClose,
}: {
  groupId: string;
  current: string;
  onClose: () => void;
}) {
  const updateGroup = useUpdateGroup(groupId);
  const { resolved } = useAppearance();
  const [error, setError] = useState<string | null>(null);

  async function choose(theme: ThemeId) {
    setError(null);
    try {
      await updateGroup.mutateAsync({ theme });
      onClose();
    } catch {
      setError("Couldn't save the theme. Try again.");
    }
  }

  return (
    <div className="animate-rise mb-5 rounded-xl border border-ink-200/70 bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-ink-800">
          <Palette size={16} className="text-chama-600" />
          Chama theme
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {THEMES.map((theme) => {
          const selected = theme.id === getTheme(current).id;
          return (
            <button
              key={theme.id}
              onClick={() => choose(theme.id)}
              disabled={updateGroup.isPending}
              // Each swatch previews its own palette by scoping the accent vars to
              // itself, so the picker shows the actual colours rather than naming them.
              style={themeVars(theme, resolved === "dark")}
              className={
                "flex items-center gap-3 rounded-lg border p-2.5 text-left " +
                "transition-[transform,border-color,background-color] duration-150 ease-out-strong " +
                "active:scale-[0.98] active:duration-100 disabled:opacity-60 " +
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chama-500/40 " +
                (selected
                  ? "border-chama-500 bg-chama-50"
                  : "border-ink-200 hover:border-ink-300 hover:bg-ink-50")
              }
            >
              <span className="flex shrink-0 gap-0.5">
                <span className="size-3.5 rounded-full bg-chama-600" />
                <span className="size-3.5 rounded-full bg-chama-200" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink-900">
                  {theme.label}
                </span>
                <span className="block truncate text-xs text-ink-500">{theme.blurb}</span>
              </span>
              {selected && <Check size={15} className="shrink-0 text-chama-600" />}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-3">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
    </div>
  );
}
