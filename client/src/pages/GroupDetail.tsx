import { useState } from "react";
import { useParams } from "react-router-dom";
import { ArrearsPanel } from "../components/group/ArrearsPanel";
import { ContributionsPanel } from "../components/group/ContributionsPanel";
import { MembersPanel } from "../components/group/MembersPanel";
import { StatementsPanel } from "../components/group/StatementsPanel";
import { useAuth } from "../hooks/useAuth";
import { useGroup } from "../hooks/useGroups";
import { useMembers } from "../hooks/useMembers";
import { formatCents } from "../lib/money";

type Tab = "members" | "contributions" | "arrears" | "statements";

const TABS: { id: Tab; label: string }[] = [
  { id: "contributions", label: "Contributions" },
  { id: "arrears", label: "Arrears" },
  { id: "statements", label: "Statements" },
  { id: "members", label: "Members" },
];

export function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const { data: group, isLoading } = useGroup(groupId);
  const { data: members } = useMembers(groupId ?? "");
  const [tab, setTab] = useState<Tab>("contributions");

  if (!groupId) return null;
  if (isLoading || !group) return <p className="text-gray-500">Loading…</p>;

  const isTreasurer =
    members?.some((m) => m.user_id === user?.id && m.role === "treasurer") ?? false;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">{group.name}</h1>
        <p className="text-sm text-gray-500">
          {formatCents(group.contribution_amount_cents, group.currency)} /{" "}
          {group.contribution_frequency} · {group.currency}
        </p>
      </div>

      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.id
                ? "border-chama-600 text-chama-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "members" && <MembersPanel groupId={groupId} isTreasurer={isTreasurer} />}
      {tab === "contributions" && (
        <ContributionsPanel groupId={groupId} group={group} isTreasurer={isTreasurer} />
      )}
      {tab === "arrears" && <ArrearsPanel groupId={groupId} currency={group.currency} />}
      {tab === "statements" && (
        <StatementsPanel groupId={groupId} currency={group.currency} isTreasurer={isTreasurer} />
      )}
    </div>
  );
}
