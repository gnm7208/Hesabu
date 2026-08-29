import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Group } from "../lib/types";
import type { ThemeId } from "../lib/themes";

export interface CreateGroupInput {
  name: string;
  contribution_amount_cents: number;
  contribution_frequency: "weekly" | "monthly";
  theme?: ThemeId;
}

export interface UpdateGroupInput {
  name?: string;
  contribution_amount_cents?: number;
  contribution_frequency?: "weekly" | "monthly";
  theme?: ThemeId;
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

export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateGroupInput) => api.patch<Group>(`/groups/${groupId}`, input),
    onSuccess: (group) => {
      // Seed the detail cache from the response so the new theme paints
      // immediately, then refresh the list where the card also shows it.
      queryClient.setQueryData(["groups", groupId], group);
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}
