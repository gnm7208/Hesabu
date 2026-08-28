import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { GroupMember, MemberRole } from "../lib/types";

export interface AddMemberInput {
  full_name: string;
  phone: string;
  role?: MemberRole;
}

export function useMembers(groupId: string) {
  return useQuery({
    queryKey: ["groups", groupId, "members"],
    queryFn: () => api.get<GroupMember[]>(`/groups/${groupId}/members`),
  });
}

export function useAddMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddMemberInput) =>
      api.post<GroupMember>(`/groups/${groupId}/members`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "arrears"] });
    },
  });
}

export function useRemoveMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => api.delete(`/groups/${groupId}/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "members"] });
    },
  });
}
