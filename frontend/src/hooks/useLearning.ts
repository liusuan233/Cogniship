import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAssessment,
  createGoal,
  createLog,
  deleteAssessment,
  deleteGoal,
  deleteLog,
  deleteNode,
  fetchAssessments,
  fetchGoals,
  fetchLogs,
  parseNodes,
  updateAssessment,
  updateGoal,
  updateNode,
} from '../api/learning';
import type {
  AssessmentPayload,
  GoalPayload,
  LogPayload,
  NodePayload,
  ParseNodesResult,
} from '../api/learning';

const QUERY_KEYS = {
  goals: ['goals'] as const,
  logs: ['logs'] as const,
  assessments: ['assessments'] as const,
};

// ---------- 查询 ----------

export function useGoals() {
  return useQuery({ queryKey: QUERY_KEYS.goals, queryFn: fetchGoals });
}

export function useLogs() {
  return useQuery({ queryKey: QUERY_KEYS.logs, queryFn: fetchLogs });
}

export function useAssessments() {
  return useQuery({ queryKey: QUERY_KEYS.assessments, queryFn: fetchAssessments });
}

// ---------- 学习目标 ----------

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GoalPayload) => createGoal(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goals }),
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<GoalPayload> }) => updateGoal(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goals }),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteGoal(id),
    onSuccess: () => {
      // 删目标会级联删掉它的节点和考核
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goals });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assessments });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.logs });
    },
  });
}

// ---------- 节点 ----------

export function useParseNodes() {
  const queryClient = useQueryClient();
  return useMutation<ParseNodesResult, Error, { goalId: number; rawText: string }>({
    mutationFn: ({ goalId, rawText }) => parseNodes(goalId, rawText),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goals }),
  });
}

export function useUpdateNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: NodePayload }) => updateNode(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goals }),
  });
}

export function useDeleteNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteNode(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goals }),
  });
}

// ---------- 学习记录 ----------

export function useCreateLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LogPayload) => createLog(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.logs }),
  });
}

export function useDeleteLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteLog(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.logs }),
  });
}

// ---------- 自我考核 ----------

export function useCreateAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssessmentPayload) => createAssessment(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assessments }),
  });
}

export function useUpdateAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AssessmentPayload> }) =>
      updateAssessment(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assessments }),
  });
}

export function useDeleteAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAssessment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assessments }),
  });
}
