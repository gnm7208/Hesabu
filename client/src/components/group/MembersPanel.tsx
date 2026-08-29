import { UserPlus, Users, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { RoleBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState, ErrorNote, SkeletonRows } from "../ui/Feedback";
import { Field, Input, Select } from "../ui/Input";
import { useAddMember, useMembers, useRemoveMember } from "../../hooks/useMembers";
import { ApiError } from "../../lib/api";
import type { MemberRole } from "../../lib/types";

export function MembersPanel({ groupId, isTreasurer }: { groupId: string; isTreasurer: boolean }) {
  const { data: members, isLoading } = useMembers(groupId);
  const removeMember = useRemoveMember(groupId);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {isTreasurer && (
        <div>
          <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
            <UserPlus size={16} />
            Add member
          </Button>
          {showForm && <AddMemberForm groupId={groupId} onDone={() => setShowForm(false)} />}
        </div>
      )}

      {isLoading && (
        <Card className="px-4 py-0">
          <SkeletonRows rows={4} />
        </Card>
      )}

      {members?.length === 0 && (
        <Card className="animate-rise">
          <EmptyState
            icon={Users}
            title="No members yet"
            hint="Add members with their M-PESA phone numbers so imported payments match automatically."
          />
        </Card>
      )}

      {members && members.length > 0 && (
      <Card className="divide-y divide-ink-200/60 p-0">
        {members?.map((member, i) => (
          <div
            key={member.id}
            className="animate-rise flex items-center justify-between gap-3 px-4 py-3.5 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl hover:bg-ink-50"
            style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink-900">{member.full_name}</p>
              {/* A member with no phone can never be auto-matched, so say that
                  rather than leaving an ambiguous blank. */}
              <p className={"mt-0.5 truncate text-xs " + (member.phone ? "tnum text-ink-400" : "text-ink-400 italic")}>
                {member.phone ?? "no phone on file"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <RoleBadge value={member.role} />
              {member.status === "inactive" && (
                <span className="text-xs text-ink-400">inactive</span>
              )}
              {isTreasurer && member.role !== "treasurer" && member.status === "active" && (
                <button
                  onClick={() => removeMember.mutate(member.id)}
                  className="rounded-md p-1 text-ink-400 transition-[transform,color,background-color] duration-150 ease-out-strong hover:bg-red-50 hover:text-red-600 active:scale-90 active:duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                  title="Remove member"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </Card>
      )}
    </div>
  );
}

function AddMemberForm({ groupId, onDone }: { groupId: string; onDone: () => void }) {
  const addMember = useAddMember(groupId);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<MemberRole>("member");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await addMember.mutateAsync({ full_name: fullName, phone, role });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add member");
    }
  }

  return (
    <Card className="mt-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="Full name" className="flex-1">
          <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input
            required
            placeholder="0712345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value as MemberRole)}>
            <option value="member">Member</option>
            <option value="treasurer">Treasurer</option>
          </Select>
        </Field>
        <Button type="submit" disabled={addMember.isPending}>
          {addMember.isPending ? "Adding…" : "Add"}
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
