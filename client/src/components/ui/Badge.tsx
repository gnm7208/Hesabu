import type { MatchConfidence, MemberRole } from "../../lib/types";

const confidenceClasses: Record<MatchConfidence, string> = {
  auto: "bg-chama-100 text-chama-700",
  manual: "bg-blue-100 text-blue-700",
  resolved: "bg-amber-100 text-amber-700",
  unmatched: "bg-red-100 text-red-700",
};

export function ConfidenceBadge({ value }: { value: MatchConfidence }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${confidenceClasses[value]}`}
    >
      {value}
    </span>
  );
}

const roleClasses: Record<MemberRole, string> = {
  treasurer: "bg-chama-100 text-chama-700",
  member: "bg-gray-100 text-gray-600",
};

export function RoleBadge({ value }: { value: MemberRole }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleClasses[value]}`}>
      {value}
    </span>
  );
}
