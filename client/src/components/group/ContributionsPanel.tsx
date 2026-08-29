import { Inbox, PenLine, Upload, X } from "lucide-react";
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
import { EmptyState, ErrorNote, SkeletonRows } from "../ui/Feedback";
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
  // If any row needs resolving, every row reserves the slot — otherwise the
  // resolve control shoves that row's amount out of the column, which is the
  // one row the treasurer is scanning for.
  const showResolveSlot =
    isTreasurer && (contributions ?? []).some((c) => c.match_confidence === "unmatched");
  const [entry, setEntry] = useState<"import" | "manual" | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {/* The ledger is what this page is for, so the two entry forms are actions
          rather than permanent fixtures competing with it for the top of the
          column. Only one can be open — they do the same job by different routes,
          and showing both invites the wrong one being filled in. */}
      {isTreasurer && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={entry === "import" ? "primary" : "secondary"}
            onClick={() => setEntry((v) => (v === "import" ? null : "import"))}
          >
            <Upload size={15} />
            Import M-PESA SMS
          </Button>
          <Button
            variant={entry === "manual" ? "primary" : "secondary"}
            onClick={() => setEntry((v) => (v === "manual" ? null : "manual"))}
          >
            <PenLine size={15} />
            Record manually
          </Button>
          {entry && (
            <Button variant="ghost" onClick={() => setEntry(null)} aria-label="Close form">
              <X size={15} />
            </Button>
          )}
        </div>
      )}

      {entry === "import" && <ImportForm groupId={groupId} />}
      {entry === "manual" && <ManualAddForm groupId={groupId} currency={group.currency} />}

      {isLoading && (
        <Card className="px-4 py-0">
          <SkeletonRows rows={4} />
        </Card>
      )}

      {contributions && contributions.length > 0 && (
        <Card className="divide-y divide-ink-200/60 overflow-x-auto p-0">
          {contributions.map((c, i) => {
            const member = c.group_member_id ? membersById.get(c.group_member_id) : null;
            const needsAttention = c.match_confidence === "unmatched";
            return (
              <div
                key={c.id}
                className={
                  "animate-rise flex min-w-[38rem] items-center justify-between gap-3 px-4 py-3.5 " +
                  "transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl " +
                  // The one row a treasurer must act on gets a persistent tint, so it
                  // stays findable while scanning a long ledger.
                  (needsAttention ? "bg-red-50/40 hover:bg-red-50/70" : "hover:bg-ink-50")
                }
                style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
              >
                <div className="min-w-0">
                  <p
                    className={
                      "truncate text-sm font-medium " +
                      (member ? "text-ink-900" : "text-ink-400 italic")
                    }
                  >
                    {member?.full_name ?? "Unmatched"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-400">
                    {new Date(c.contributed_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {" · "}
                    {c.method}
                    {c.mpesa_code ? ` · ${c.mpesa_code}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {/* Fixed widths, not intrinsic ones: badge labels differ in length
                      ("auto" vs "unmatched"), so without a reserved column every
                      amount lands at a different x and the tabular figures buy
                      nothing. These two spans are what make the column scannable. */}
                  <span className="tnum w-28 text-right text-sm font-semibold text-ink-900">
                    {formatCents(c.amount_cents, group.currency)}
                  </span>
                  <span className="flex w-[5.5rem] justify-start">
                    <ConfidenceBadge value={c.match_confidence} />
                  </span>
                  {showResolveSlot && (
                    <span className="flex w-[13.5rem] justify-end">
                      {needsAttention && (
                        <ResolveControl groupId={groupId} contributionId={c.id} />
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {contributions?.length === 0 && (
        <Card className="animate-rise">
          <EmptyState
            icon={Inbox}
            title="No contributions yet"
            hint={
              isTreasurer
                ? "Paste a batch of M-PESA confirmation messages above to import them."
                : "Contributions will appear here once the treasurer records them."
            }
          />
        </Card>
      )}
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
      {error && (
        <div className="mt-3">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
      {result && (
        <div className="mt-3 rounded-md bg-ink-50 p-3 text-sm text-ink-600">
          <p>
            Imported {result.imported.length}, {result.duplicate_count} duplicate(s) skipped.
          </p>
          {result.unparsed.length > 0 && (
            <div className="mt-1">
              <p className="text-amber-700">{result.unparsed.length} line(s) couldn't be read:</p>
              <ul className="ml-4 list-disc text-xs text-ink-500">
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
      {error && (
        <div className="mt-3">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
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
