import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * One headline figure.
 *
 * Values deliberately use the font's default proportional figures. tabular-nums
 * gives every digit the width of a zero, which makes a large standalone number
 * look loose and gappy — it belongs in columns that must align vertically (the
 * ledger, table rows), not here.
 */
export function StatTile({
  label,
  value,
  note,
  tone = "neutral",
  icon: Icon,
}: {
  label: string;
  value: string;
  note?: ReactNode;
  tone?: "neutral" | "good" | "warning" | "critical";
  icon?: LucideIcon;
}) {
  const valueTone = {
    neutral: "text-ink-900",
    good: "text-chama-700",
    warning: "text-amber-700",
    critical: "text-red-700",
  }[tone];

  return (
    <div className="rounded-xl border border-ink-200/70 bg-surface px-4 py-3.5 shadow-card">
      <div className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
        {Icon && <Icon size={13} strokeWidth={2} />}
        {label}
      </div>
      <p className={`mt-1.5 text-[1.375rem] font-semibold tracking-[-0.02em] ${valueTone}`}>
        {value}
      </p>
      {note && <p className="mt-0.5 text-xs text-ink-400">{note}</p>}
    </div>
  );
}

/**
 * A single ratio against a limit.
 *
 * The fill carries severity and the unfilled track is a lighter step of the *same*
 * ramp — green-on-green, amber-on-amber — so the state reads across the whole bar
 * rather than only in the filled portion. A grey track would make a barely-started
 * red meter and a barely-started green one look identical at a glance.
 */
export function Meter({
  value,
  max,
  label,
  caption,
}: {
  value: number;
  max: number;
  label: string;
  caption?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  // Collection is a more-is-better ratio, so severity runs the opposite way to a
  // usage meter: falling behind is the alarming end.
  const tone = pct >= 90 ? "good" : pct >= 60 ? "warning" : "critical";
  const { fill, track, text } = {
    good: { fill: "bg-chama-600", track: "bg-chama-100", text: "text-chama-700" },
    warning: { fill: "bg-amber-500", track: "bg-amber-100", text: "text-amber-700" },
    critical: { fill: "bg-red-500", track: "bg-red-100", text: "text-red-700" },
  }[tone];

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium text-ink-500">{label}</span>
        <span className={`text-xs font-semibold ${text}`}>{pct}%</span>
      </div>
      <div
        className={`mt-1.5 h-2 w-full overflow-hidden rounded-full ${track}`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        {/* Width, not scaleX: a scaled fill would smear its rounded end. This runs
            once on data arrival, not per frame, so layout cost is irrelevant. */}
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out-strong ${fill}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {caption && <p className="mt-1.5 text-xs text-ink-400">{caption}</p>}
    </div>
  );
}
