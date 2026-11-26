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
import {
  GOAL_STATUS_LABEL,
  apiErrorMessage,
  formatDate,
  formatMinutes,
  todayISO,
} from '../utils/format';
import RollingNumber from '../components/RollingNumber';

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
    <li className="card hover-lift card-sweep goal" data-status={goal.status}>
      <div className="goal-body">
        <div className="goal-main">
          <Link to={`/goals/${goal.id}`} className="goal-title hover-underline">
            {goal.title}
          </Link>
          <div className="goal-meta">
            {GOAL_STATUS_LABEL[goal.status]} · NODES {doneNodes}/{totalNodes} ·{' '}
            {formatDate(goal.created_at)}
          </div>
          {goal.description && <p className="goal-desc">{goal.description}</p>}
        </div>
        <div className="goal-acts">
          <Link to={`/goals/${goal.id}`} className="act hover-underline">
            进入目标
          </Link>
          {goal.status === 'active' ? (
            <>
              <button
                type="button"
                onClick={() => onChangeStatus(goal, 'completed')}
                className="act hover-underline"
              >
                标记完成
              </button>
              <button
                type="button"
                onClick={() => onChangeStatus(goal, 'archived')}
                className="act hover-underline"
              >
                归档
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onChangeStatus(goal, 'active')}
              className="act hover-underline"
            >
              重新开始
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(goal)}
            className="act act--danger hover-underline"
          >
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
    <div className="stagger space-y-7">
      <section className="page-head">
        <div>
          <div className="page-eyebrow">WORKBENCH / 工作台</div>
          <h1 className="page-title">学习航线总览</h1>
        </div>
        <div className="page-meta">
          NODE · SHIZHOU-01
          <br />
          {formatDate(todayISO())} · SYS.NOMINAL
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card stat hover-lift card-sweep">
          <div className="card-eyebrow">进行中的目标</div>
          <div className="card-value">
            <RollingNumber value={stats.activeGoals} />
          </div>
        </div>
        <div className="card stat hover-lift card-sweep">
          <div className="card-eyebrow">节点完成</div>
          <div className="card-value">
            <RollingNumber value={stats.doneNodes} />
            <small> / {stats.totalNodes}</small>
          </div>
        </div>
        <div className="card stat hover-lift card-sweep">
          <div className="card-eyebrow">累计学习</div>
          <div className="card-value">
            <RollingNumber
              value={stats.totalMinutes}
              format={(minutes) => formatMinutes(Math.round(minutes))}
            />
          </div>
        </div>
        <div className="card stat hover-lift card-sweep">
          <div className="card-eyebrow">待考核</div>
          <div className="card-value">
            <RollingNumber value={stats.pendingAssessments} />
          </div>
        </div>
      </section>

      <section className="card card--soft space-y-3">
        <h2 className="section-label">新建学习目标 / NEW GOAL</h2>
        {formError && (
          <div className="alert" role="alert">
            <b>ERROR</b>
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleCreate} className="space-y-2.5">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="想学什么？例如：两个月啃下 Django REST Framework"
            className="field"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="补充说明（可不填）：目标背景、时间安排、参考资料…"
            rows={2}
            className="field"
          />
          <div className="flex items-center gap-3">
            <button type="submit" disabled={createGoal.isPending} className="btn">
              {createGoal.isPending ? '创建中…' : '创建目标'}
            </button>
            <span className="hint">回车前检查一遍：名称、范围、验收标准</span>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="section-label">我的学习目标 / ACTIVE GOALS</h2>

        {actionError && (
          <div className="alert" role="alert">
            <b>ERROR</b>
            <span>{actionError}</span>
          </div>
        )}
        {isLoading && <div className="ambient-wait hint">加载中…</div>}
        {error && (
          <div className="alert" role="alert">
            <b>ERROR</b>
            <span>{apiErrorMessage(error, '加载目标失败')}</span>
          </div>
        )}
        {!isLoading && !error && goals.length === 0 && (
          <div className="card--dashed">还没有学习目标，先在上面的表单里定一个吧。</div>
        )}

        <ul className="stagger space-y-3">
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
