import { Upload } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  useAddContribution,
  useContributions,
  useImportContributions,
  useResolveContribution,
} from "../../hooks/useContributions";
import { useMembers } from "../../hooks/useMembers";
import { ApiError } from "../../lib/api";
import { formatCents, parseToCents } from "../../lib/money";
import type { ContributionMethod, Group, ImportResult } from "../../lib/types";
import { ConfidenceBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field, Input, Select, TextArea } from "../ui/Input";

export function ContributionsPanel({
  groupId,
  group,
  isTreasurer,
}: {
  groupId: string;
  group: Group;
  isTreasurer: boolean;
}) {
  const { data: contributions, isLoading } = useContributions(groupId);
  const { data: members } = useMembers(groupId);
  const membersById = new Map((members ?? []).map((m) => [m.id, m]));

  return (
    <div className="flex flex-col gap-4">
      {isTreasurer && (
        <div className="grid gap-4 sm:grid-cols-2">
          <ImportForm groupId={groupId} />
          <ManualAddForm groupId={groupId} currency={group.currency} />
        </div>
      )}

      {isLoading && <p className="text-gray-500">Loading…</p>}

      <Card className="divide-y divide-gray-100 p-0">
        {contributions?.map((c) => {
          const member = c.group_member_id ? membersById.get(c.group_member_id) : null;
          return (
            <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900">
                  {member?.full_name ?? "Unmatched"}{" "}
                  <span className="font-normal text-gray-500">
                    · {formatCents(c.amount_cents, group.currency)}
                  </span>
                </p>
                <p className="truncate text-xs text-gray-400">
                  {new Date(c.contributed_at).toLocaleDateString()} · {c.method}
                  {c.mpesa_code ? ` · ${c.mpesa_code}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ConfidenceBadge value={c.match_confidence} />
                {isTreasurer && c.match_confidence === "unmatched" && (
                  <ResolveControl groupId={groupId} contributionId={c.id} />
                )}
              </div>
            </div>
          );
        })}
        {contributions?.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-gray-500">No contributions yet.</p>
        )}
      </Card>
    </div>
  );
}

function ImportForm({ groupId }: { groupId: string }) {
  const importContributions = useImportContributions(groupId);
  const [rawText, setRawText] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    try {
      const res = await importContributions.mutateAsync(rawText);
      setResult(res);
      setRawText("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Import failed");
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Paste M-PESA confirmation SMS (one per line)">
          <TextArea
            rows={5}
            required
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="QAR7A1B2C3 Confirmed. You have received Ksh2,000.00 from JANE DOE 254712345678 on 3/8/26 at 9:15 AM..."
          />
        </Field>
        <Button type="submit" disabled={importContributions.isPending}>
          <Upload size={16} />
          {importContributions.isPending ? "Importing…" : "Import"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {result && (
        <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm text-gray-600">
          <p>
            Imported {result.imported.length}, {result.duplicate_count} duplicate(s) skipped.
          </p>
          {result.unparsed.length > 0 && (
            <div className="mt-1">
              <p className="text-amber-700">{result.unparsed.length} line(s) couldn't be read:</p>
              <ul className="ml-4 list-disc text-xs text-gray-500">
                {result.unparsed.map((line) => (
                  <li key={line} className="truncate">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function ManualAddForm({ groupId, currency }: { groupId: string; currency: string }) {
  const addContribution = useAddContribution(groupId);
  const { data: members } = useMembers(groupId);
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<ContributionMethod>("cash");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await addContribution.mutateAsync({
        group_member_id: memberId,
        amount_cents: parseToCents(amount),
        method,
        contributed_at: new Date(date).toISOString(),
      });
      setAmount("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't record contribution");
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Record a contribution manually">
          <Select required value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            <option value="" disabled>
              Select member
            </option>
            {members
              ?.filter((m) => m.status === "active")
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
          </Select>
        </Field>
        <div className="flex gap-3">
          <Field label={`Amount (${currency})`} className="flex-1">
            <Input
              type="number"
              min="0"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field label="Method">
            <Select value={method} onChange={(e) => setMethod(e.target.value as ContributionMethod)}>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="mpesa">M-PESA</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Button type="submit" disabled={addContribution.isPending}>
          {addContribution.isPending ? "Saving…" : "Record contribution"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </Card>
  );
}

function ResolveControl({ groupId, contributionId }: { groupId: string; contributionId: string }) {
  const { data: members } = useMembers(groupId);
  const resolveContribution = useResolveContribution(groupId);
  const [memberId, setMemberId] = useState("");

  async function handleResolve() {
    if (!memberId) return;
    await resolveContribution.mutateAsync({ contributionId, groupMemberId: memberId });
    setMemberId("");
  }

  return (
    <div className="flex items-center gap-1">
      <Select
        value={memberId}
        onChange={(e) => setMemberId(e.target.value)}
        className="max-w-[9rem] py-1 text-xs"
      >
        <option value="">Match to…</option>
        {members
          ?.filter((m) => m.status === "active")
          .map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
      </Select>
      <Button
        variant="secondary"
        className="px-2 py-1 text-xs"
        disabled={!memberId || resolveContribution.isPending}
        onClick={handleResolve}
      >
        Resolve
      </Button>
    </div>
  );
}
