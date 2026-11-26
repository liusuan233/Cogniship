// 与后端 DRF 接口返回的数据结构对应（见 src/learning/models.py）

export type GoalStatus = 'active' | 'completed' | 'archived';
export type NodeStatus = 'todo' | 'in_progress' | 'done';

/** 学习节点 */
export interface LearningNode {
  id: number;
  goal: number;
  title: string;
  content: string;
  order: number;
  status: NodeStatus;
  created_at: string;
}

/** 学习目标（列表/详情接口都带 nodes 嵌套） */
export interface LearningGoal {
  id: number;
  user: number;
  title: string;
  description: string;
  status: GoalStatus;
  created_at: string;
  ai_prompt_raw_text: string;
  nodes: LearningNode[];
}

/** 学习记录 / 打卡 */
export interface StudyLog {
  id: number;
  user: number;
  node: number | null;
  study_date: string;
  duration_minutes: number;
  content: string;
  created_at: string;
}

/** 自我考核 */
export interface SelfAssessment {
  id: number;
  goal: number;
  title: string;
  scheduled_date: string;
  is_completed: boolean;
  score: number | null;
  reflection: string;
}

/** JWT 令牌对 */
export interface TokenPair {
  access: string;
  refresh: string;
}
