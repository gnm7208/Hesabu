import { FileText } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useGenerateStatement, useStatements } from "../../hooks/useStatements";
import { ApiError } from "../../lib/api";
import { formatCents } from "../../lib/money";
import type { Statement } from "../../lib/types";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
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

      {isLoading && <p className="text-gray-500">Loading…</p>}

      <Card className="divide-y divide-gray-100 p-0">
        {statements?.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelected(s)}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-gray-400" />
              <span className="font-medium text-gray-900">
                {s.period_start} → {s.period_end}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {formatCents(s.summary.total_collected_cents, currency)}
            </span>
          </button>
        ))}
        {statements?.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-gray-500">No statements yet.</p>
        )}
      </Card>

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
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
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
        <h3 className="font-medium text-gray-900">
          Statement: {statement.period_start} → {statement.period_end}
        </h3>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-700">
          Close
        </button>
      </div>
      <dl className="mb-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-gray-500">Collected</dt>
          <dd className="font-semibold text-gray-900">
            {formatCents(summary.total_collected_cents, currency)}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Expected</dt>
          <dd className="font-semibold text-gray-900">
            {formatCents(summary.total_expected_cents, currency)}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Unmatched</dt>
          <dd className="font-semibold text-amber-600">
            {formatCents(summary.unmatched_cents, currency)}
          </dd>
        </div>
      </dl>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="pb-1 font-normal">Member</th>
            <th className="pb-1 font-normal">Paid</th>
          </tr>
        </thead>
        <tbody>
          {summary.per_member.map((row) => (
            <tr key={row.group_member_id} className="border-t border-gray-100">
              <td className="py-1.5 text-gray-900">{row.full_name}</td>
              <td className="py-1.5 text-gray-700">{formatCents(row.paid_cents, currency)}</td>
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
