import { AlertTriangle, Banknote, TrendingDown, Users } from "lucide-react";
import { useArrears, useContributions } from "../../hooks/useContributions";
import { useMembers } from "../../hooks/useMembers";
import { formatCentsShort } from "../../lib/money";
import { Skeleton } from "../ui/Feedback";
import { Meter, StatTile } from "../ui/Stat";

/**
 * The state-of-the-books header.
 *
 * Everything here is derived from data the page already fetches — no new
 * endpoints. The point is that a treasurer opening a group should not have to
 * read a ledger to learn whether they are behind and whether anything needs
 * their attention; those are the two questions that bring them here.
 */
export function GroupSummary({ groupId, currency }: { groupId: string; currency: string }) {
  const { data: arrears, isLoading: loadingArrears } = useArrears(groupId);
  const { data: contributions, isLoading: loadingContributions } = useContributions(groupId);
  const { data: members } = useMembers(groupId);

  if (loadingArrears || loadingContributions) {
    return (
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-ink-200/70 bg-white px-4 py-3.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2.5 h-6 w-28" />
          </div>
        ))}
      </div>
    );
  }

  const rows = arrears ?? [];
  const collected = rows.reduce((sum, r) => sum + r.paid_cents, 0);
  const expected = rows.reduce((sum, r) => sum + r.expected_cents, 0);
  const outstanding = rows.reduce((sum, r) => sum + r.arrears_cents, 0);
  const behind = rows.filter((r) => r.arrears_cents > 0).length;
  const unmatched = (contributions ?? []).filter(
    (c) => c.match_confidence === "unmatched",
  ).length;
  const activeMembers = (members ?? []).filter((m) => m.status === "active").length;

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={Banknote}
          label="Collected"
          value={formatCentsShort(collected, currency)}
          note={`of ${formatCentsShort(expected, currency)} expected`}
          tone="neutral"
        />
        <StatTile
          icon={TrendingDown}
          label="Outstanding"
          value={formatCentsShort(outstanding, currency)}
          note={
            behind === 0
              ? "everyone is paid up"
              : `${behind} ${behind === 1 ? "member" : "members"} behind`
          }
          tone={outstanding > 0 ? "critical" : "good"}
        />
        <StatTile
          icon={AlertTriangle}
          label="Needs matching"
          value={String(unmatched)}
          note={
            unmatched === 0
              ? "nothing to review"
              : `${unmatched === 1 ? "payment" : "payments"} with no member`
          }
          tone={unmatched > 0 ? "warning" : "good"}
        />
        <StatTile
          icon={Users}
          label="Active members"
          value={String(activeMembers)}
          note={`${rows.length} on the schedule`}
        />
      </div>

      {expected > 0 && (
        <div className="rounded-xl border border-ink-200/70 bg-white px-4 py-3.5 shadow-card">
          <Meter
            value={collected}
            max={expected}
            label="Collected against schedule"
            caption={
              outstanding > 0
                ? `${formatCentsShort(outstanding, currency)} still to come in.`
                : "Fully collected for the period."
            }
          />
        </div>
      )}
    </div>
  );
}
