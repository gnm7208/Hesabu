import { UserPlus, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { RoleBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
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

      {isLoading && <p className="text-gray-500">Loading…</p>}

      <Card className="divide-y divide-gray-100 p-0">
        {members?.map((member) => (
          <div key={member.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-gray-900">{member.full_name}</p>
              <p className="text-sm text-gray-500">{member.phone ?? "no phone on file"}</p>
            </div>
            <div className="flex items-center gap-2">
              <RoleBadge value={member.role} />
              {member.status === "inactive" && (
                <span className="text-xs text-gray-400">inactive</span>
              )}
              {isTreasurer && member.role !== "treasurer" && member.status === "active" && (
                <button
                  onClick={() => removeMember.mutate(member.id)}
                  className="text-gray-400 hover:text-red-600"
                  title="Remove member"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </Card>
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
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </Card>
  );
}
