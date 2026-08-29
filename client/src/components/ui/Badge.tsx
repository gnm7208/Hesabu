import type { MatchConfidence, MemberRole } from "../../lib/types";

/* The four confidence states are the core vocabulary of the reconciliation ledger,
   so they read as a deliberate scale rather than four unrelated colours:
   green = the parser matched it, blue = a human entered it, amber = a human
   rescued it, red = still needs attention. Only red is alarming, because only
   red is actionable. */
const confidenceStyles: Record<MatchConfidence, { class: string; label: string }> = {
  auto: { class: "bg-chama-50 text-chama-700 ring-chama-600/20", label: "auto" },
  manual: { class: "bg-blue-50 text-blue-700 ring-blue-600/20", label: "manual" },
  resolved: { class: "bg-amber-50 text-amber-700 ring-amber-600/20", label: "resolved" },
  unmatched: { class: "bg-red-50 text-red-700 ring-red-600/20", label: "unmatched" },
};

export function ConfidenceBadge({ value }: { value: MatchConfidence }) {
  const style = confidenceStyles[value];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium tracking-wide ring-1 ring-inset ${style.class}`}
    >
      {style.label}
    </span>
  );
}

const roleClasses: Record<MemberRole, string> = {
  treasurer: "bg-chama-50 text-chama-700 ring-chama-600/20",
  member: "bg-ink-100 text-ink-600 ring-ink-300/40",
};

export function RoleBadge({ value }: { value: MemberRole }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium tracking-wide ring-1 ring-inset ${roleClasses[value]}`}
    >
      {value}
    </span>
  );
}
