import { Plus, Users, Wallet } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState, ErrorNote, Skeleton } from "../components/ui/Feedback";
import { Field, Input, Select } from "../components/ui/Input";
import { useCreateGroup, useGroups } from "../hooks/useGroups";
import { formatCents, parseToCents } from "../lib/money";

export function Dashboard() {
  const { data: groups, isLoading } = useGroups();
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-display text-ink-900">Your chamas</h1>
          <p className="mt-1 text-sm text-ink-500">
            Every group whose books you help keep.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="shrink-0">
          <Plus size={16} strokeWidth={2.4} />
          New group
        </Button>
      </div>

      {showForm && <CreateGroupForm onDone={() => setShowForm(false)} />}

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2.5 h-3 w-24" />
            </Card>
          ))}
        </div>
      )}

      {groups && groups.length === 0 && !showForm && (
        <Card className="animate-rise">
          <EmptyState
            icon={Wallet}
            title="No chamas yet"
            hint="Create your first group to start matching M-PESA messages to members."
            action={
              <Button onClick={() => setShowForm(true)}>
                <Plus size={16} strokeWidth={2.4} />
                New group
              </Button>
            }
          />
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {groups?.map((group, i) => (
          <Link
            key={group.id}
            to={`/groups/${group.id}`}
            className="animate-rise rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chama-500/40"
            /* Short stagger — long enough to read as a cascade, short enough that
               the last card isn't perceptibly late. */
            style={{ animationDelay: `${Math.min(i, 6) * 45}ms` }}
          >
            <Card interactive className="h-full">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-title text-ink-900">{group.name}</h2>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-400">
                  <Users size={14} />
                </span>
              </div>
              <p className="mt-1.5 text-sm text-ink-500">
                <span className="tnum font-medium text-ink-700">
                  {formatCents(group.contribution_amount_cents, group.currency)}
                </span>{" "}
                / {group.contribution_frequency}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CreateGroupForm({ onDone }: { onDone: () => void }) {
  const createGroup = useCreateGroup();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("monthly");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createGroup.mutateAsync({
        name,
        contribution_amount_cents: parseToCents(amount || "0"),
        contribution_frequency: frequency,
      });
      onDone();
    } catch {
      setError("Couldn't create the group — check the amount and try again.");
    }
  }

  return (
    <Card className="animate-rise mb-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="Group name" className="flex-1">
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Contribution (KES)">
          <Input
            type="number"
            min="0"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="Frequency">
          <Select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as "weekly" | "monthly")}
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
          </Select>
        </Field>
        <Button type="submit" disabled={createGroup.isPending}>
          {createGroup.isPending ? "Creating…" : "Create"}
        </Button>
      </form>
      {error && <div className="mt-3">
        <ErrorNote>{error}</ErrorNote>
      </div>}
    </Card>
  );
}
