import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Statement } from "../lib/types";

export interface GenerateStatementInput {
  period_start: string;
  period_end: string;
}

export function useStatements(groupId: string) {
  return useQuery({
    queryKey: ["groups", groupId, "statements"],
    queryFn: () => api.get<Statement[]>(`/groups/${groupId}/statements`),
  });
}

export function useGenerateStatement(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateStatementInput) =>
      api.post<Statement>(`/groups/${groupId}/statements`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "statements"] });
    },
  });
}
