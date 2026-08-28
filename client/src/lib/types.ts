export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  currency: string;
  contribution_amount_cents: number;
  contribution_frequency: "weekly" | "monthly";
  created_by: string;
  created_at: string;
}

export type MemberRole = "treasurer" | "member";
export type MemberStatus = "active" | "inactive";

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  role: MemberRole;
  status: MemberStatus;
  joined_at: string;
}

export type ContributionMethod = "mpesa" | "cash" | "bank" | "other";
export type MatchConfidence = "auto" | "manual" | "unmatched" | "resolved";

export interface Contribution {
  id: string;
  group_id: string;
  group_member_id: string | null;
  amount_cents: number;
  method: ContributionMethod;
  mpesa_code: string | null;
  contributed_at: string;
  raw_text: string | null;
  match_confidence: MatchConfidence;
  recorded_by: string | null;
  created_at: string;
}

export interface ImportResult {
  imported: Contribution[];
  duplicate_count: number;
  unparsed: string[];
}

export interface ArrearsRow {
  group_member_id: string;
  full_name: string;
  phone: string | null;
  expected_cents: number;
  paid_cents: number;
  arrears_cents: number;
}

export interface StatementSummary {
  period_start: string;
  period_end: string;
  total_collected_cents: number;
  total_expected_cents: number;
  unmatched_cents: number;
  per_member: { group_member_id: string; full_name: string; phone: string | null; paid_cents: number }[];
  arrears: { group_member_id: string; full_name: string; arrears_cents: number }[];
}

export interface Statement {
  id: string;
  group_id: string;
  period_start: string;
  period_end: string;
  generated_by: string;
  generated_at: string;
  summary: StatementSummary;
  status: "draft" | "final";
}
