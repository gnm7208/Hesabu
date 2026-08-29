import { ChevronRight, FileText } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useGenerateStatement, useStatements } from "../../hooks/useStatements";
import { ApiError } from "../../lib/api";
import { formatCents } from "../../lib/money";
import type { Statement } from "../../lib/types";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState, ErrorNote, SkeletonRows } from "../ui/Feedback";
import { Field, Input } from "../ui/Input";

export function StatementsPanel({
  groupId,
  currency,
  isTreasurer,
}: {
  groupId: string;
  currency: string;
  isTreasurer: boolean;
}) {
  const { data: statements, isLoading } = useStatements(groupId);
  const [selected, setSelected] = useState<Statement | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {isTreasurer && <GenerateForm groupId={groupId} />}

      {isLoading && (
        <Card className="px-4 py-0">
          <SkeletonRows rows={3} />
        </Card>
      )}

      {statements?.length === 0 && (
        <Card className="animate-rise">
          <EmptyState
            icon={FileText}
            title="No statements yet"
            hint={
              isTreasurer
                ? "Generate one to freeze a period's contributions into a shareable record."
                : "Statements appear here once the treasurer closes a period."
            }
          />
        </Card>
      )}

      {statements && statements.length > 0 && (
        <Card className="divide-y divide-ink-200/60 p-0">
          {statements.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="group animate-rise flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-chama-500/40"
              style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
                  <FileText size={15} />
                </span>
                <span className="tnum truncate text-sm font-medium text-ink-900">
                  {s.period_start} → {s.period_end}
                </span>
              </div>
              <span className="flex shrink-0 items-center gap-1.5">
                <span className="tnum text-sm font-semibold text-ink-900">
                  {formatCents(s.summary.total_collected_cents, currency)}
                </span>
                {/* Nudges toward the row it opens — the arrow leans in on hover. */}
                <ChevronRight
                  size={15}
                  className="text-ink-300 transition-transform duration-150 ease-out-strong group-hover:translate-x-0.5 group-hover:text-ink-500"
                />
              </span>
            </button>
          ))}
        </Card>
      )}

      {selected && (
        <StatementDetail statement={selected} currency={currency} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function GenerateForm({ groupId }: { groupId: string }) {
  const generateStatement = useGenerateStatement(groupId);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await generateStatement.mutateAsync({ period_start: periodStart, period_end: periodEnd });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't generate statement");
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="Period start">
          <Input
            type="date"
            required
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
          />
        </Field>
        <Field label="Period end">
          <Input
            type="date"
            required
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </Field>
        <Button type="submit" disabled={generateStatement.isPending}>
          {generateStatement.isPending ? "Generating…" : "Generate statement"}
        </Button>
      </form>
      {error && (
        <div className="mt-3">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
    </Card>
  );
}

function StatementDetail({
  statement,
  currency,
  onClose,
}: {
  statement: Statement;
  currency: string;
  onClose: () => void;
}) {
  const { summary } = statement;
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-ink-900">
          Statement: {statement.period_start} → {statement.period_end}
        </h3>
        <button onClick={onClose} className="text-sm text-ink-400 hover:text-ink-700">
          Close
        </button>
      </div>
      <dl className="mb-5 grid grid-cols-3 gap-2.5 text-sm">
        <div className="rounded-lg bg-ink-50 px-3 py-2.5">
          <dt className="text-xs text-ink-500">Collected</dt>
          <dd className="tnum mt-0.5 font-semibold text-ink-900">
            {formatCents(summary.total_collected_cents, currency)}
          </dd>
        </div>
        <div className="rounded-lg bg-ink-50 px-3 py-2.5">
          <dt className="text-xs text-ink-500">Expected</dt>
          <dd className="tnum mt-0.5 font-semibold text-ink-900">
            {formatCents(summary.total_expected_cents, currency)}
          </dd>
        </div>
        <div className="rounded-lg bg-amber-50 px-3 py-2.5">
          <dt className="text-xs text-amber-700/80">Unmatched</dt>
          <dd className="tnum mt-0.5 font-semibold text-amber-700">
            {formatCents(summary.unmatched_cents, currency)}
          </dd>
        </div>
      </dl>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink-500">
            <th className="pb-1.5 font-normal">Member</th>
            <th className="pb-1.5 text-right font-normal">Paid</th>
          </tr>
        </thead>
        <tbody>
          {summary.per_member.map((row) => (
            <tr key={row.group_member_id} className="border-t border-ink-200/60">
              <td className="py-2 text-ink-900">{row.full_name}</td>
              <td className="tnum py-2 text-right font-medium text-ink-700">{formatCents(row.paid_cents, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {summary.arrears.length > 0 && (
        <p className="mt-3 text-xs text-red-600">
          {summary.arrears.length} member(s) still in arrears for this period.
        </p>
      )}
    </Card>
  );
}
