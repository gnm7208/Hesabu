import { Plus, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Field, Input, Select } from "../components/ui/Input";
import { useCreateGroup, useGroups } from "../hooks/useGroups";
import { formatCents, parseToCents } from "../lib/money";

export function Dashboard() {
  const { data: groups, isLoading } = useGroups();
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Your chamas</h1>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus size={16} />
          New group
        </Button>
      </div>

      {showForm && <CreateGroupForm onDone={() => setShowForm(false)} />}

      {isLoading && <p className="text-gray-500">Loading…</p>}

      {groups && groups.length === 0 && !showForm && (
        <Card className="text-center text-gray-500">
          No chamas yet. Create one to start tracking contributions.
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {groups?.map((group) => (
          <Link key={group.id} to={`/groups/${group.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-gray-900">{group.name}</h2>
                <Users size={16} className="text-gray-400" />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {formatCents(group.contribution_amount_cents, group.currency)} /{" "}
                {group.contribution_frequency}
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
    <Card className="mb-6">
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
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </Card>
  );
}
