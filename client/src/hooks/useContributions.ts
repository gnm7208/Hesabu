import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { ArrearsRow, Contribution, ContributionMethod, ImportResult } from "../lib/types";

export interface AddContributionInput {
  group_member_id: string;
  amount_cents: number;
  method: ContributionMethod;
  contributed_at: string;
  mpesa_code?: string;
}

function invalidateGroupMoney(
  queryClient: ReturnType<typeof useQueryClient>,
  groupId: string,
) {
  queryClient.invalidateQueries({ queryKey: ["groups", groupId, "contributions"] });
  queryClient.invalidateQueries({ queryKey: ["groups", groupId, "arrears"] });
}

export function useContributions(groupId: string) {
  return useQuery({
    queryKey: ["groups", groupId, "contributions"],
    queryFn: () => api.get<Contribution[]>(`/groups/${groupId}/contributions`),
  });
}

export function useAddContribution(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddContributionInput) =>
      api.post<Contribution>(`/groups/${groupId}/contributions`, input),
    onSuccess: () => invalidateGroupMoney(queryClient, groupId),
  });
}

export function useImportContributions(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rawText: string) =>
      api.post<ImportResult>(`/groups/${groupId}/contributions/import`, { raw_text: rawText }),
    onSuccess: () => invalidateGroupMoney(queryClient, groupId),
  });
}

export function useResolveContribution(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contributionId, groupMemberId }: { contributionId: string; groupMemberId: string }) =>
      api.patch<Contribution>(`/groups/${groupId}/contributions/${contributionId}/resolve`, {
        group_member_id: groupMemberId,
      }),
    onSuccess: () => invalidateGroupMoney(queryClient, groupId),
  });
}

export function useArrears(groupId: string) {
  return useQuery({
    queryKey: ["groups", groupId, "arrears"],
    queryFn: () => api.get<ArrearsRow[]>(`/groups/${groupId}/arrears`),
  });
}
