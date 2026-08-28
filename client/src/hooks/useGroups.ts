import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Group } from "../lib/types";

export interface CreateGroupInput {
  name: string;
  contribution_amount_cents: number;
  contribution_frequency: "weekly" | "monthly";
}

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: () => api.get<Group[]>("/groups"),
  });
}

export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: ["groups", groupId],
    queryFn: () => api.get<Group>(`/groups/${groupId}`),
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGroupInput) => api.post<Group>("/groups", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}
