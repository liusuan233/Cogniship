import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { GoalStatus, LearningGoal } from '../api/types';
import {
  useAssessments,
  useCreateGoal,
  useDeleteGoal,
  useGoals,
  useLogs,
  useUpdateGoal,
} from '../hooks/useLearning';
import { GOAL_STATUS_LABEL, apiErrorMessage, formatDate, formatMinutes } from '../utils/format';

function GoalCard({
  goal,
  onChangeStatus,
  onDelete,
}: {
  goal: LearningGoal;
  onChangeStatus: (goal: LearningGoal, status: GoalStatus) => void;
  onDelete: (goal: LearningGoal) => void;
}) {
  const doneNodes = goal.nodes.filter((node) => node.status === 'done').length;
  const totalNodes = goal.nodes.length;

  return (
    <li className="border rounded-lg bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <Link to={`/goals/${goal.id}`} className="text-lg font-semibold hover:underline">
            {goal.title}
          </Link>
          <div className="mt-1 text-sm text-gray-500">
            {GOAL_STATUS_LABEL[goal.status]} · 节点 {doneNodes}/{totalNodes} 完成 · 创建于{' '}
            {formatDate(goal.created_at)}
          </div>
          {goal.description && <p className="mt-2 text-sm text-gray-700">{goal.description}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 text-sm">
          <Link to={`/goals/${goal.id}`} className="text-blue-600 hover:underline">
            进入目标
          </Link>
          {goal.status === 'active' ? (
            <>
              <button
                type="button"
                onClick={() => onChangeStatus(goal, 'completed')}
                className="text-gray-600 hover:underline"
              >
                标记完成
              </button>
              <button
                type="button"
                onClick={() => onChangeStatus(goal, 'archived')}
                className="text-gray-600 hover:underline"
              >
                归档
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onChangeStatus(goal, 'active')}
              className="text-gray-600 hover:underline"
            >
              重新开始
            </button>
          )}
          <button type="button" onClick={() => onDelete(goal)} className="text-red-500 hover:underline">
            删除
          </button>
        </div>
      </div>
    </li>
  );
}

export default function Dashboard() {
  const { data: goals = [], isLoading, error } = useGoals();
  const { data: logs = [] } = useLogs();
  const { data: assessments = [] } = useAssessments();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');

  const stats = useMemo(() => {
    const nodes = goals.flatMap((goal) => goal.nodes);
    return {
      activeGoals: goals.filter((goal) => goal.status === 'active').length,
      doneNodes: nodes.filter((node) => node.status === 'done').length,
      totalNodes: nodes.length,
      totalMinutes: logs.reduce((sum, log) => sum + log.duration_minutes, 0),
      pendingAssessments: assessments.filter((item) => !item.is_completed).length,
    };
  }, [goals, logs, assessments]);

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();

    const trimmed = title.trim();
    if (!trimmed) {
      setFormError('请输入目标名称');
      return;
    }

    setFormError('');
    createGoal.mutate(
      { title: trimmed, description: description.trim() },
      {
        onSuccess: () => {
          setTitle('');
          setDescription('');
        },
        onError: (err) => setFormError(apiErrorMessage(err, '创建目标失败')),
      },
    );
  };

  const handleChangeStatus = (goal: LearningGoal, status: GoalStatus) => {
    setActionError('');
    updateGoal.mutate(
      { id: goal.id, data: { status } },
      { onError: (err) => setActionError(apiErrorMessage(err)) },
    );
  };

  const handleDelete = (goal: LearningGoal) => {
    if (!window.confirm(`确定删除「${goal.title}」吗？它的学习节点和自我考核会一起删除，且无法恢复。`)) {
      return;
    }
    setActionError('');
    deleteGoal.mutate(goal.id, { onError: (err) => setActionError(apiErrorMessage(err)) });
  };

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">识舟工作台</h1>
          <p className="mt-1 text-sm text-gray-600">欢迎回来！你的学习航线已就绪。</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs text-gray-500">进行中的目标</div>
          <div className="text-xl font-semibold">{stats.activeGoals}</div>
        </div>
        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs text-gray-500">节点完成</div>
          <div className="text-xl font-semibold">
            {stats.doneNodes}/{stats.totalNodes}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs text-gray-500">累计学习</div>
          <div className="text-xl font-semibold">{formatMinutes(stats.totalMinutes)}</div>
        </div>
        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs text-gray-500">待考核</div>
          <div className="text-xl font-semibold">{stats.pendingAssessments}</div>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-semibold">新建学习目标</h2>
        {formError && <div className="mb-2 text-sm text-red-500">{formError}</div>}
        <form onSubmit={handleCreate} className="space-y-2">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="想学什么？例如：两个月啃下 Django REST Framework"
            className="w-full rounded-md border px-3 py-2"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="补充说明（可不填）：目标背景、时间安排、参考资料…"
            rows={2}
            className="w-full rounded-md border px-3 py-2"
          />
          <button
            type="submit"
            disabled={createGoal.isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {createGoal.isPending ? '创建中…' : '创建目标'}
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">我的学习目标</h2>

        {actionError && <div className="text-sm text-red-500">{actionError}</div>}
        {isLoading && <div className="text-sm text-gray-500">加载中…</div>}
        {error && <div className="text-sm text-red-500">{apiErrorMessage(error, '加载目标失败')}</div>}
        {!isLoading && !error && goals.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
            还没有学习目标，先在上面的表单里定一个吧。
          </div>
        )}

        <ul className="space-y-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onChangeStatus={handleChangeStatus}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}
