import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { StudyLog } from '../api/types';
import { useCreateLog, useDeleteLog, useGoals, useLogs } from '../hooks/useLearning';
import { apiErrorMessage, formatDate, formatMinutes, todayISO } from '../utils/format';

/** 距今天 n 天内（含今天）的日期字符串，用于统计 */
function daysAgoISO(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function Logs() {
  const { data: goals = [] } = useGoals();
  const { data: logs = [], isLoading, error } = useLogs();
  const createLog = useCreateLog();
  const deleteLog = useDeleteLog();

  const [studyDate, setStudyDate] = useState(todayISO());
  const [duration, setDuration] = useState('30');
  const [nodeId, setNodeId] = useState('');
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');

  // 把「目标 / 节点」摊平，方便下拉选择和学习记录里显示节点名
  const nodeOptions = useMemo(
    () =>
      goals.flatMap((goal) =>
        goal.nodes.map((node) => ({
          id: node.id,
          label: `${goal.title} / ${node.title}`,
        })),
      ),
    [goals],
  );

  const nodeLabels = useMemo(
    () => new Map(nodeOptions.map((option) => [option.id, option.label])),
    [nodeOptions],
  );

  const stats = useMemo(() => {
    const weekStart = daysAgoISO(6);
    return {
      totalMinutes: logs.reduce((sum, log) => sum + log.duration_minutes, 0),
      weekMinutes: logs
        .filter((log) => formatDate(log.study_date) >= weekStart)
        .reduce((sum, log) => sum + log.duration_minutes, 0),
      count: logs.length,
    };
  }, [logs]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const minutes = Number(duration);
    if (!studyDate) {
      setFormError('请选择学习日期');
      return;
    }
    if (!Number.isInteger(minutes) || minutes <= 0) {
      setFormError('学习时长需为大于 0 的整数（分钟）');
      return;
    }

    setFormError('');
    createLog.mutate(
      {
        study_date: studyDate,
        duration_minutes: minutes,
        content: content.trim(),
        node: nodeId === '' ? null : Number(nodeId),
      },
      {
        onSuccess: () => {
          setContent('');
        },
        onError: (err) => setFormError(apiErrorMessage(err, '保存学习记录失败')),
      },
    );
  };

  const handleDelete = (log: StudyLog) => {
    if (!window.confirm(`确定删除 ${formatDate(log.study_date)} 的这条记录吗？`)) return;
    setActionError('');
    deleteLog.mutate(log.id, { onError: (err) => setActionError(apiErrorMessage(err, '删除失败')) });
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold">学习记录</h1>
        <p className="mt-1 text-sm text-gray-600">按天记录学习时长和心得，日拱一卒。</p>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs text-gray-500">累计学习</div>
          <div className="text-xl font-semibold">{formatMinutes(stats.totalMinutes)}</div>
        </div>
        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs text-gray-500">近 7 天</div>
          <div className="text-xl font-semibold">{formatMinutes(stats.weekMinutes)}</div>
        </div>
        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs text-gray-500">记录条数</div>
          <div className="text-xl font-semibold">{stats.count}</div>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-semibold">记一笔</h2>
        {formError && <div className="mb-2 text-sm text-red-500">{formError}</div>}
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-xs text-gray-500" htmlFor="study-date">
                学习日期
              </label>
              <input
                id="study-date"
                type="date"
                value={studyDate}
                onChange={(event) => setStudyDate(event.target.value)}
                className="rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500" htmlFor="duration">
                时长（分钟）
              </label>
              <input
                id="duration"
                type="number"
                min={1}
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                className="w-28 rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500" htmlFor="node">
                关联节点（可不选）
              </label>
              <select
                id="node"
                value={nodeId}
                onChange={(event) => setNodeId(event.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">不关联节点</option>
                {nodeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="今天学了什么？有什么卡住的地方？（可不填）"
            rows={2}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={createLog.isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {createLog.isPending ? '保存中…' : '保存记录'}
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">历史记录</h2>
        {actionError && <div className="text-sm text-red-500">{actionError}</div>}
        {isLoading && <div className="text-sm text-gray-500">加载中…</div>}
        {error && <div className="text-sm text-red-500">{apiErrorMessage(error, '加载学习记录失败')}</div>}
        {!isLoading && !error && logs.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
            还没有学习记录，先记今天的第一笔吧。
          </div>
        )}

        <ul className="space-y-2">
          {logs.map((log) => (
            <li key={log.id} className="rounded-lg border bg-white p-3">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="font-medium">
                    {formatDate(log.study_date)}
                    <span className="ml-2 text-sm text-gray-500">{formatMinutes(log.duration_minutes)}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {log.node === null
                      ? '未关联节点'
                      : (nodeLabels.get(log.node) ?? `节点 #${log.node}`)}
                  </div>
                  {log.content && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{log.content}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(log)}
                  className="text-sm text-red-500 hover:underline"
                >
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
