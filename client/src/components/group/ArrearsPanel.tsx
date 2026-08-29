import { CheckCircle2, Users } from "lucide-react";
import { useArrears } from "../../hooks/useContributions";
import { formatCents } from "../../lib/money";
import { Card } from "../ui/Card";
import { EmptyState, SkeletonRows } from "../ui/Feedback";

export function ArrearsPanel({ groupId, currency }: { groupId: string; currency: string }) {
  const { data: arrears, isLoading } = useArrears(groupId);

  if (isLoading) {
    return (
      <Card className="px-4 py-0">
        <SkeletonRows rows={4} />
      </Card>
    );
  }

  if (arrears?.length === 0) {
    return (
      <Card className="animate-rise">
        <EmptyState
          icon={Users}
          title="No active members yet"
          hint="Add members to the group and their contribution schedule will be tracked here."
        />
      </Card>
    );
  }

  const behind = arrears?.filter((r) => r.arrears_cents > 0).length ?? 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Lead with the number the treasurer actually came here for, so they don't
          have to count red rows themselves. */}
      <p className="text-sm text-ink-500">
        {behind === 0 ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-chama-700">
            <CheckCircle2 size={15} />
            Everyone is paid up.
          </span>
        ) : (
          <>
            <span className="font-semibold text-ink-900">{behind}</span>
            {behind === 1 ? " member is" : " members are"} behind schedule.
          </>
        )}
      </p>

      <Card className="divide-y divide-ink-200/60 p-0">
        {arrears?.map((row, i) => {
          const owing = row.arrears_cents > 0;
          return (
            <div
              key={row.group_member_id}
              className={
                "animate-rise flex items-center justify-between gap-3 px-4 py-3.5 " +
                "transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl " +
                (owing ? "hover:bg-red-50/50" : "hover:bg-ink-50")
              }
              style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-900">{row.full_name}</p>
                <p className="mt-0.5 text-xs text-ink-400">
                  Expected <span className="tnum">{formatCents(row.expected_cents, currency)}</span>
                  {" · Paid "}
                  <span className="tnum">{formatCents(row.paid_cents, currency)}</span>
                </p>
              </div>
              {owing ? (
                <span className="tnum shrink-0 text-sm font-semibold text-red-600">
                  {formatCents(row.arrears_cents, currency)}
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-chama-700">
                  <CheckCircle2 size={15} />
                  Paid up
                </span>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
