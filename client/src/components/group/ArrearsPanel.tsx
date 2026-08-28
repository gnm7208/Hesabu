import { useArrears } from "../../hooks/useContributions";
import { formatCents } from "../../lib/money";
import { Card } from "../ui/Card";

export function ArrearsPanel({ groupId, currency }: { groupId: string; currency: string }) {
  const { data: arrears, isLoading } = useArrears(groupId);

  if (isLoading) return <p className="text-gray-500">Loading…</p>;

  return (
    <Card className="divide-y divide-gray-100 p-0">
      {arrears?.map((row) => (
        <div key={row.group_member_id} className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="font-medium text-gray-900">{row.full_name}</p>
            <p className="text-xs text-gray-400">
              Expected {formatCents(row.expected_cents, currency)} · Paid{" "}
              {formatCents(row.paid_cents, currency)}
            </p>
          </div>
          <p
            className={`text-sm font-semibold ${
              row.arrears_cents > 0 ? "text-red-600" : "text-chama-600"
            }`}
          >
            {row.arrears_cents > 0 ? formatCents(row.arrears_cents, currency) : "Paid up"}
          </p>
        </div>
      ))}
      {arrears?.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-gray-500">No active members yet.</p>
      )}
    </Card>
  );
}
