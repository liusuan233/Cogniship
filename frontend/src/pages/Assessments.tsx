import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AssessmentList from '../components/AssessmentList';
import { useAssessments, useCreateAssessment, useGoals } from '../hooks/useLearning';
import { apiErrorMessage, todayISO } from '../utils/format';

type Filter = 'pending' | 'completed' | 'all';

const FILTER_LABEL: Record<Filter, string> = {
  pending: '待考核',
  completed: '已考核',
  all: '全部',
};

export default function Assessments() {
  const { data: goals = [] } = useGoals();
  const { data: assessments = [], isLoading, error } = useAssessments();
  const createAssessment = useCreateAssessment();

  const [filter, setFilter] = useState<Filter>('pending');
  const [goalId, setGoalId] = useState('');
  const [title, setTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState(todayISO());
  const [formError, setFormError] = useState('');

  const selectedGoalId = goalId === '' ? (goals[0]?.id ?? null) : Number(goalId);

  const counts = useMemo(
    () => ({
      pending: assessments.filter((item) => !item.is_completed).length,
      completed: assessments.filter((item) => item.is_completed).length,
      all: assessments.length,
    }),
    [assessments],
  );

  const visible = useMemo(() => {
    const filtered =
      filter === 'pending'
        ? assessments.filter((item) => !item.is_completed)
        : filter === 'completed'
          ? assessments.filter((item) => item.is_completed)
          : assessments;

    return [...filtered].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
  }, [assessments, filter]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (selectedGoalId === null) {
      setFormError('请先创建一个学习目标');
      return;
    }
    const trimmed = title.trim();
    if (!trimmed) {
      setFormError('请输入考核名称');
      return;
    }
    if (!scheduledDate) {
      setFormError('请选择考核日期');
      return;
    }

    setFormError('');
    createAssessment.mutate(
      { goal: selectedGoalId, title: trimmed, scheduled_date: scheduledDate },
      {
        onSuccess: () => {
          setTitle('');
          setScheduledDate(todayISO());
        },
        onError: (err) => setFormError(apiErrorMessage(err, '创建考核失败')),
      },
    );
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold">自我考核</h1>
        <p className="mt-1 text-sm text-gray-600">学完一段就自测一次，把得分和反思留下来。</p>
      </section>

      {goals.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
          考核要挂在学习目标下，先去{' '}
          <Link to="/" className="text-blue-600 hover:underline">
            工作台
          </Link>{' '}
          建一个目标吧。
        </div>
      ) : (
        <section className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 font-semibold">新建考核</h2>
          {formError && <div className="mb-2 text-sm text-red-500">{formError}</div>}
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-xs text-gray-500" htmlFor="goal">
                所属目标
              </label>
              <select
                id="goal"
                value={goalId === '' ? String(goals[0].id) : goalId}
                onChange={(event) => setGoalId(event.target.value)}
                className="rounded-md border px-3 py-2 text-sm"
              >
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500" htmlFor="assessment-title">
                考核名称
              </label>
              <input
                id="assessment-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="例如：Django 视图层自测"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500" htmlFor="scheduled-date">
                考核日期
              </label>
              <input
                id="scheduled-date"
                type="date"
                value={scheduledDate}
                onChange={(event) => setScheduledDate(event.target.value)}
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
          </form>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex gap-2 text-sm">
          {(Object.keys(FILTER_LABEL) as Filter[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={
                filter === item
                  ? 'rounded-md bg-blue-600 px-3 py-1 text-white'
                  : 'rounded-md border px-3 py-1 text-gray-600'
              }
            >
              {FILTER_LABEL[item]}（{counts[item]}）
            </button>
          ))}
        </div>

        {isLoading && <div className="text-sm text-gray-500">加载中…</div>}
        {error && <div className="text-sm text-red-500">{apiErrorMessage(error, '加载考核失败')}</div>}

        {!isLoading && !error && (
          <AssessmentList
            assessments={visible}
            goals={goals}
            showGoal
            emptyHint={
              filter === 'pending' ? '没有待考核的项目，去学点什么吧。' : '这个分类下还没有考核记录。'
            }
          />
        )}
      </section>
    </div>
  );
}
