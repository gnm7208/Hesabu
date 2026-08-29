import { useState } from "react";
import { useParams } from "react-router-dom";
import { ArrearsPanel } from "../components/group/ArrearsPanel";
import { ContributionsPanel } from "../components/group/ContributionsPanel";
import { MembersPanel } from "../components/group/MembersPanel";
import { StatementsPanel } from "../components/group/StatementsPanel";
import { Tabs } from "../components/ui/Tabs";
import { useAuth } from "../hooks/useAuth";
import { useGroup } from "../hooks/useGroups";
import { useMembers } from "../hooks/useMembers";
import { Skeleton } from "../components/ui/Feedback";
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
  if (isLoading || !group)
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-9 w-full" />
      </div>
    );

  const isTreasurer =
    members?.some((m) => m.user_id === user?.id && m.role === "treasurer") ?? false;

  return (
    <div>
      <div className="animate-rise mb-5">
        <h1 className="text-display text-ink-900">{group.name}</h1>
        <p className="mt-1 text-sm text-ink-500">
          <span className="tnum font-medium text-ink-700">
            {formatCents(group.contribution_amount_cents, group.currency)}
          </span>{" "}
          / {group.contribution_frequency} · {group.currency}
        </p>
      </div>

      <div className="mb-5">
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
      </div>

      <div key={tab} className="animate-rise">
      {tab === "members" && <MembersPanel groupId={groupId} isTreasurer={isTreasurer} />}
      {tab === "contributions" && (
        <ContributionsPanel groupId={groupId} group={group} isTreasurer={isTreasurer} />
      )}
      {tab === "arrears" && <ArrearsPanel groupId={groupId} currency={group.currency} />}
      {tab === "statements" && (
        <StatementsPanel groupId={groupId} currency={group.currency} isTreasurer={isTreasurer} />
      )}
      </div>
    </div>
  );
}
