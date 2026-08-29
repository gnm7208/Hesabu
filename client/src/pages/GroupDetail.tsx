import { AlertCircle, ArrowLeft, FileText, Receipt, Users } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrearsPanel } from "../components/group/ArrearsPanel";
import { ContributionsPanel } from "../components/group/ContributionsPanel";
import { GroupSummary } from "../components/group/GroupSummary";
import { MembersPanel } from "../components/group/MembersPanel";
import { StatementsPanel } from "../components/group/StatementsPanel";
import { Skeleton } from "../components/ui/Feedback";
import { SideNav, type NavItem } from "../components/ui/SideNav";
import { useAuth } from "../hooks/useAuth";
import { useArrears, useContributions } from "../hooks/useContributions";
import { useGroup } from "../hooks/useGroups";
import { useMembers } from "../hooks/useMembers";
import { formatCents } from "../lib/money";

type Tab = "members" | "contributions" | "arrears" | "statements";

export function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const { data: group, isLoading } = useGroup(groupId);
  const { data: members } = useMembers(groupId ?? "");
  const { data: contributions } = useContributions(groupId ?? "");
  const { data: arrears } = useArrears(groupId ?? "");
  const [tab, setTab] = useState<Tab>("contributions");

  if (!groupId) return null;
  if (isLoading || !group) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-40" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const isTreasurer =
    members?.some((m) => m.user_id === user?.id && m.role === "treasurer") ?? false;

  const unmatched = (contributions ?? []).filter(
    (c) => c.match_confidence === "unmatched",
  ).length;
  const behind = (arrears ?? []).filter((r) => r.arrears_cents > 0).length;

  // Counts live on the nav so the work waiting in each view is visible without
  // opening it — the unmatched queue especially, which is the treasurer's job.
  const navItems: NavItem<Tab>[] = [
    {
      id: "contributions",
      label: "Ledger",
      icon: Receipt,
      count: unmatched,
      attention: unmatched > 0,
    },
    { id: "arrears", label: "Arrears", icon: AlertCircle, count: behind, attention: behind > 0 },
    { id: "statements", label: "Statements", icon: FileText },
    { id: "members", label: "Members", icon: Users, count: members?.length },
  ];

  return (
    <div>
      <Link
        to="/dashboard"
        className="mb-3 inline-flex items-center gap-1.5 rounded text-sm text-ink-500 transition-colors duration-150 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chama-500/40"
      >
        <ArrowLeft size={15} />
        All chamas
      </Link>

      <div className="animate-rise mb-6">
        <h1 className="text-display text-ink-900">{group.name}</h1>
        <p className="mt-1 text-sm text-ink-500">
          <span className="font-medium text-ink-700">
            {formatCents(group.contribution_amount_cents, group.currency)}
          </span>{" "}
          / {group.contribution_frequency} · {group.currency}
        </p>
      </div>

      <GroupSummary groupId={groupId} currency={group.currency} />

      <div className="flex flex-col gap-5 lg:flex-row lg:gap-7">
        <nav className="lg:w-52 lg:shrink-0">
          <div className="lg:sticky lg:top-20">
            <SideNav items={navItems} value={tab} onChange={setTab} />
          </div>
        </nav>

        {/* min-w-0 so a wide ledger row scrolls inside the column instead of
            stretching the flex parent and pushing the rail off-screen. */}
        <div key={tab} className="animate-rise min-w-0 flex-1">
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
    </div>
  );
}
