import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getGoalPrompt } from '../api/learning';
import type { GoalStatus, LearningNode } from '../api/types';
import AssessmentList from '../components/AssessmentList';
import {
  useAssessments,
  useCreateAssessment,
  useDeleteGoal,
  useDeleteNode,
  useGoals,
  useParseNodes,
  useUpdateGoal,
  useUpdateNode,
} from '../hooks/useLearning';
import {
  GOAL_STATUS_LABEL,
  NODE_STATUS_LABEL,
  apiErrorMessage,
  copyText,
  formatDate,
  nextNodeStatus,
  todayISO,
} from '../utils/format';

export default function GoalDetail() {
  const { goalId } = useParams<{ goalId: string }>();
  const numericGoalId = Number(goalId);
  const navigate = useNavigate();

  const { data: goals = [], isLoading } = useGoals();
  const { data: assessments = [] } = useAssessments();
  const parseNodesMutation = useParseNodes();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const updateNode = useUpdateNode();
  const deleteNode = useDeleteNode();
  const createAssessment = useCreateAssessment();

  const [prompt, setPrompt] = useState('');
  const [promptStatus, setPromptStatus] = useState<'idle' | 'loading' | 'copied'>('idle');
  const [rawText, setRawText] = useState('');
  const [parseMessage, setParseMessage] = useState('');
  const [parseError, setParseError] = useState('');

  const [editingNodeId, setEditingNodeId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [nodeError, setNodeError] = useState('');

  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [assessmentDate, setAssessmentDate] = useState(todayISO());
  const [assessmentError, setAssessmentError] = useState('');

  const [goalError, setGoalError] = useState('');

  const goal = goals.find((item) => item.id === numericGoalId);

  const nodes = useMemo(
    () => (goal ? [...goal.nodes].sort((a, b) => a.order - b.order) : []),
    [goal],
  );

  const goalAssessments = useMemo(
    () => assessments.filter((item) => item.goal === numericGoalId),
    [assessments, numericGoalId],
  );

  if (isLoading) {
    return <div className="text-sm text-gray-500">加载中…</div>;
  }

  if (!goal) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-500">目标不存在，或者它属于其他账号。</p>
        <Link to="/" className="text-blue-600 hover:underline">
          返回工作台
        </Link>
      </div>
    );
  }

  const doneCount = nodes.filter((node) => node.status === 'done').length;

  // ---- AI 拆解 ----

  const handleCopyPrompt = async () => {
    setPromptStatus('loading');
    setParseError('');
    try {
      const text = await getGoalPrompt(goal.id);
      setPrompt(text);
      await copyText(text);
      setPromptStatus('copied');
    } catch (err) {
      setPromptStatus('idle');
      setParseError(apiErrorMessage(err, '获取提示词失败'));
    }
  };

  const handleParse = () => {
    if (!rawText.trim()) {
      setParseError('请先把 AI 返回的 JSON 文本粘贴进来');
      return;
    }
    setParseError('');
    setParseMessage('');
    parseNodesMutation.mutate(
      { goalId: goal.id, rawText: rawText.trim() },
      {
        onSuccess: (result) => {
          setParseMessage(result.message);
          setRawText('');
        },
        onError: (err) => setParseError(apiErrorMessage(err, '解析失败')),
      },
    );
  };

  // ---- 节点操作 ----

  const handleToggleNode = (node: LearningNode) => {
    setNodeError('');
    updateNode.mutate(
      { id: node.id, data: { status: nextNodeStatus(node.status) } },
      { onError: (err) => setNodeError(apiErrorMessage(err, '更新节点状态失败')) },
    );
  };

  const startEditNode = (node: LearningNode) => {
    setEditingNodeId(node.id);
    setEditTitle(node.title);
    setEditContent(node.content);
    setNodeError('');
  };

  const handleSaveNode = (nodeId: number) => {
    if (!editTitle.trim()) {
      setNodeError('节点标题不能为空');
      return;
    }
    setNodeError('');
    updateNode.mutate(
      { id: nodeId, data: { title: editTitle.trim(), content: editContent.trim() } },
      {
        onSuccess: () => setEditingNodeId(null),
        onError: (err) => setNodeError(apiErrorMessage(err, '保存节点失败')),
      },
    );
  };

  const handleDeleteNode = (node: LearningNode) => {
    if (!window.confirm(`确定删除节点「${node.title}」吗？`)) return;
    setNodeError('');
    deleteNode.mutate(node.id, { onError: (err) => setNodeError(apiErrorMessage(err, '删除节点失败')) });
  };

  // ---- 目标操作 ----

  const handleChangeStatus = (status: GoalStatus) => {
    setGoalError('');
    updateGoal.mutate(
      { id: goal.id, data: { status } },
      { onError: (err) => setGoalError(apiErrorMessage(err)) },
    );
  };

  const handleDeleteGoal = () => {
    if (!window.confirm(`确定删除目标「${goal.title}」吗？节点和自我考核会一起删除，且无法恢复。`)) {
      return;
    }
    setGoalError('');
    deleteGoal.mutate(goal.id, {
      onSuccess: () => navigate('/', { replace: true }),
      onError: (err) => setGoalError(apiErrorMessage(err, '删除目标失败')),
    });
  };

  // ---- 考核 ----

  const handleCreateAssessment = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = assessmentTitle.trim();
    if (!trimmed) {
      setAssessmentError('请输入考核名称');
      return;
    }
    if (!assessmentDate) {
      setAssessmentError('请选择考核日期');
      return;
    }

    setAssessmentError('');
    createAssessment.mutate(
      { goal: goal.id, title: trimmed, scheduled_date: assessmentDate },
      {
        onSuccess: () => {
          setAssessmentTitle('');
          setAssessmentDate(todayISO());
        },
        onError: (err) => setAssessmentError(apiErrorMessage(err, '创建考核失败')),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-sm">
        <Link to="/" className="text-blue-600 hover:underline">
          ← 返回工作台
        </Link>
      </div>

      {/* 目标头部 */}
      <section className="rounded-lg border bg-white p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{goal.title}</h1>
            <div className="mt-1 text-sm text-gray-500">
              创建于 {formatDate(goal.created_at)} · 节点 {doneCount}/{nodes.length} 完成
            </div>
            {goal.description && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{goal.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 text-sm">
            <select
              value={goal.status}
              onChange={(event) => handleChangeStatus(event.target.value as GoalStatus)}
              className="rounded-md border px-2 py-1"
            >
              {(Object.keys(GOAL_STATUS_LABEL) as GoalStatus[]).map((status) => (
                <option key={status} value={status}>
                  {GOAL_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
            <button type="button" onClick={handleDeleteGoal} className="text-red-500 hover:underline">
              删除目标
            </button>
          </div>
        </div>
        {goalError && <div className="mt-2 text-sm text-red-500">{goalError}</div>}
      </section>

      {/* AI 拆解 */}
      <section className="rounded-lg border bg-white p-4">
        <h2 className="font-semibold">用 AI 拆解目标</h2>
        <ol className="mt-1 list-inside list-decimal text-sm text-gray-600">
          <li>点「复制 AI 提示词」，把提示词粘贴给任意 AI（ChatGPT / DeepSeek 等）</li>
          <li>把 AI 返回的 JSON 数组原样粘贴到下面</li>
          <li>点「解析并生成节点」</li>
        </ol>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyPrompt}
            disabled={promptStatus === 'loading'}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            {promptStatus === 'loading' ? '获取中…' : '复制 AI 提示词'}
          </button>
          {promptStatus === 'copied' && <span className="text-sm text-green-600">已复制到剪贴板</span>}
        </div>

        {prompt && (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-gray-600">查看提示词文本</summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-3 text-xs">
              {prompt}
            </pre>
          </details>
        )}

        <div className="mt-3 space-y-2">
          <textarea
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            placeholder='在这里粘贴 AI 返回的 JSON，例如：[{"title": "第一章", "content": "..."}]'
            rows={5}
            className="w-full rounded-md border px-3 py-2 font-mono text-xs"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleParse}
              disabled={parseNodesMutation.isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {parseNodesMutation.isPending ? '解析中…' : '解析并生成节点'}
            </button>
            <span className="text-xs text-gray-500">注意：重复粘贴会追加节点，不会覆盖已有节点</span>
          </div>
          {parseMessage && <div className="text-sm text-green-600">{parseMessage}</div>}
          {parseError && <div className="text-sm text-red-500">{parseError}</div>}
        </div>

        {goal.ai_prompt_raw_text && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-gray-600">查看上次解析的原始文本</summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-3 text-xs">
              {goal.ai_prompt_raw_text}
            </pre>
          </details>
        )}
      </section>

      {/* 节点列表 */}
      <section className="space-y-3">
        <h2 className="font-semibold">学习节点（{nodes.length}）</h2>
        {nodeError && <div className="text-sm text-red-500">{nodeError}</div>}
        {nodes.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
            还没有节点，用上面的 AI 拆解生成一批吧。
          </div>
        )}

        <ul className="space-y-2">
          {nodes.map((node, index) => (
            <li key={node.id} className="rounded-lg border bg-white p-3">
              {editingNodeId === node.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                  <textarea
                    value={editContent}
                    onChange={(event) => setEditContent(event.target.value)}
                    rows={3}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveNode(node.id)}
                      disabled={updateNode.isPending}
                      className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {updateNode.isPending ? '保存中…' : '保存'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingNodeId(null)}
                      className="rounded-md border px-3 py-1 text-sm"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="font-medium">
                      <span className="mr-2 text-xs text-gray-400">#{index + 1}</span>
                      {node.title}
                    </div>
                    {node.content && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{node.content}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 text-sm">
                    <button
                      type="button"
                      onClick={() => handleToggleNode(node)}
                      className={
                        node.status === 'done'
                          ? 'text-green-600 hover:underline'
                          : 'text-gray-600 hover:underline'
                      }
                      title="点击切换状态：未开始 → 进行中 → 已完成"
                    >
                      {NODE_STATUS_LABEL[node.status]}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditNode(node)}
                      className="text-gray-600 hover:underline"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNode(node)}
                      className="text-red-500 hover:underline"
                    >
                      删除
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* 自我考核 */}
      <section className="space-y-3">
        <h2 className="font-semibold">自我考核</h2>

        <form onSubmit={handleCreateAssessment} className="space-y-2 rounded-lg border bg-white p-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-500" htmlFor="assessment-title">
                考核名称
              </label>
              <input
                id="assessment-title"
                type="text"
                value={assessmentTitle}
                onChange={(event) => setAssessmentTitle(event.target.value)}
                placeholder="例如：第一章自测"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500" htmlFor="assessment-date">
                考核日期
              </label>
              <input
                id="assessment-date"
                type="date"
                value={assessmentDate}
                onChange={(event) => setAssessmentDate(event.target.value)}
                className="rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={createAssessment.isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {createAssessment.isPending ? '添加中…' : '添加考核'}
            </button>
          </div>
          {assessmentError && <div className="text-sm text-red-500">{assessmentError}</div>}
        </form>

        <AssessmentList assessments={goalAssessments} goals={goals} emptyHint="这个目标还没有考核安排" />
      </section>
    </div>
  );
}
