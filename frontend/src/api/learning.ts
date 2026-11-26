import { apiClient } from './client';
import type {
  GoalStatus,
  LearningGoal,
  LearningNode,
  NodeStatus,
  SelfAssessment,
  StudyLog,
} from './types';

export interface GoalPayload {
  title: string;
  description?: string;
  status?: GoalStatus;
}

export interface NodePayload {
  title?: string;
  content?: string;
  status?: NodeStatus;
  order?: number;
}

export interface LogPayload {
  study_date: string;
  duration_minutes: number;
  content?: string;
  node?: number | null;
}

export interface AssessmentPayload {
  goal: number;
  title: string;
  scheduled_date: string;
  is_completed?: boolean;
  score?: number | null;
  reflection?: string;
}

export interface ParseNodesResult {
  message: string;
  nodes: LearningNode[];
}

/** 兼容 DRF 未来开启分页的情况（返回 {results: []}） */
function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }
  if (payload && typeof payload === 'object') {
    const results = (payload as { results?: unknown }).results;
    if (Array.isArray(results)) {
      return results as T[];
    }
  }
  return [];
}

// ---------- 学习目标 ----------

export async function fetchGoals(): Promise<LearningGoal[]> {
  const { data } = await apiClient.get('/learning/goals/');
  return unwrapList<LearningGoal>(data);
}

export async function createGoal(payload: GoalPayload): Promise<LearningGoal> {
  const { data } = await apiClient.post<LearningGoal>('/learning/goals/', payload);
  return data;
}

export async function updateGoal(id: number, payload: Partial<GoalPayload>): Promise<LearningGoal> {
  const { data } = await apiClient.patch<LearningGoal>(`/learning/goals/${id}/`, payload);
  return data;
}

export async function deleteGoal(id: number): Promise<void> {
  await apiClient.delete(`/learning/goals/${id}/`);
}

/** 取一份可以直接丢给 AI 的拆解提示词 */
export async function getGoalPrompt(id: number): Promise<string> {
  const { data } = await apiClient.get<{ prompt: string }>(`/learning/goals/${id}/get_prompt/`);
  return data.prompt;
}

/** 把 AI 返回的 JSON 文本交给后端解析成节点 */
export async function parseNodes(id: number, rawText: string): Promise<ParseNodesResult> {
  const { data } = await apiClient.post<ParseNodesResult>(`/learning/goals/${id}/parse_nodes/`, {
    raw_text: rawText,
  });
  return data;
}

// ---------- 学习节点 ----------

export async function updateNode(id: number, payload: NodePayload): Promise<LearningNode> {
  const { data } = await apiClient.patch<LearningNode>(`/learning/nodes/${id}/`, payload);
  return data;
}

export async function deleteNode(id: number): Promise<void> {
  await apiClient.delete(`/learning/nodes/${id}/`);
}

// ---------- 学习记录 ----------

export async function fetchLogs(): Promise<StudyLog[]> {
  const { data } = await apiClient.get('/learning/logs/');
  return unwrapList<StudyLog>(data);
}

export async function createLog(payload: LogPayload): Promise<StudyLog> {
  const { data } = await apiClient.post<StudyLog>('/learning/logs/', payload);
  return data;
}

export async function updateLog(id: number, payload: Partial<LogPayload>): Promise<StudyLog> {
  const { data } = await apiClient.patch<StudyLog>(`/learning/logs/${id}/`, payload);
  return data;
}

export async function deleteLog(id: number): Promise<void> {
  await apiClient.delete(`/learning/logs/${id}/`);
}

// ---------- 自我考核 ----------

export async function fetchAssessments(): Promise<SelfAssessment[]> {
  const { data } = await apiClient.get('/learning/assessments/');
  return unwrapList<SelfAssessment>(data);
}

export async function createAssessment(payload: AssessmentPayload): Promise<SelfAssessment> {
  const { data } = await apiClient.post<SelfAssessment>('/learning/assessments/', payload);
  return data;
}

export async function updateAssessment(
  id: number,
  payload: Partial<AssessmentPayload>,
): Promise<SelfAssessment> {
  const { data } = await apiClient.patch<SelfAssessment>(`/learning/assessments/${id}/`, payload);
  return data;
}

export async function deleteAssessment(id: number): Promise<void> {
  await apiClient.delete(`/learning/assessments/${id}/`);
}
