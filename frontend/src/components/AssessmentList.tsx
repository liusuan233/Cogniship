import { useState } from 'react';
import type { LearningGoal, SelfAssessment } from '../api/types';
import { useDeleteAssessment, useUpdateAssessment } from '../hooks/useLearning';
import { apiErrorMessage, formatDate } from '../utils/format';

interface AssessmentListProps {
  assessments: SelfAssessment[];
  goals: LearningGoal[];
  /** 是否显示所属目标（跨目标列表时需要） */
  showGoal?: boolean;
  emptyHint?: string;
}

export default function AssessmentList({
  assessments,
  goals,
  showGoal = false,
  emptyHint = '还没有考核安排',
}: AssessmentListProps) {
  const updateAssessment = useUpdateAssessment();
  const deleteAssessment = useDeleteAssessment();

  const [completingId, setCompletingId] = useState<number | null>(null);
  const [score, setScore] = useState('');
  const [reflection, setReflection] = useState('');
  const [formError, setFormError] = useState('');

  const goalTitle = (goalId: number) =>
    goals.find((goal) => goal.id === goalId)?.title ?? `目标 #${goalId}`;

  const startComplete = (assessment: SelfAssessment) => {
    setCompletingId(assessment.id);
    setScore(assessment.score === null ? '' : String(assessment.score));
    setReflection(assessment.reflection);
    setFormError('');
  };

  const submitComplete = (assessment: SelfAssessment) => {
    const trimmed = score.trim();
    const parsedScore = trimmed === '' ? null : Number(trimmed);

    if (parsedScore !== null && (Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100)) {
      setFormError('分数需为 0-100 之间的数字');
      return;
    }

    setFormError('');
    updateAssessment.mutate(
      {
        id: assessment.id,
        data: { is_completed: true, score: parsedScore, reflection: reflection.trim() },
      },
      {
        onSuccess: () => setCompletingId(null),
        onError: (err) => setFormError(apiErrorMessage(err, '保存考核结果失败')),
      },
    );
  };

  const reopen = (assessment: SelfAssessment) => {
    setFormError('');
    updateAssessment.mutate(
      { id: assessment.id, data: { is_completed: false } },
      { onError: (err) => setFormError(apiErrorMessage(err)) },
    );
  };

  const handleDelete = (assessment: SelfAssessment) => {
    if (!window.confirm(`确定删除考核「${assessment.title}」吗？`)) return;
    setFormError('');
    deleteAssessment.mutate(assessment.id, {
      onError: (err) => setFormError(apiErrorMessage(err, '删除失败')),
    });
  };

  if (assessments.length === 0) {
    return <div className="text-sm text-gray-500">{emptyHint}</div>;
  }

  return (
    <div className="space-y-2">
      {formError && <div className="text-sm text-red-500">{formError}</div>}

      <ul className="stagger space-y-2">
        {assessments.map((assessment) => (
          <li key={assessment.id} className="hover-lift card-sweep rounded-lg border bg-white p-3">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="font-medium">
                  {assessment.title}
                  <span
                    className={
                      assessment.is_completed
                        ? 'ml-2 text-xs text-green-600'
                        : 'ml-2 text-xs text-orange-500'
                    }
                  >
                    {assessment.is_completed ? '已考核' : '待考核'}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {showGoal && <>目标：{goalTitle(assessment.goal)} · </>}
                  考核日期：{formatDate(assessment.scheduled_date)}
                  {assessment.is_completed && assessment.score !== null && (
                    <> · 得分：{assessment.score}</>
                  )}
                </div>
                {assessment.reflection && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                    {assessment.reflection}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1 text-sm">
                {assessment.is_completed ? (
                  <button type="button" onClick={() => reopen(assessment)} className="hover-underline text-gray-600">
                    重新打开
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startComplete(assessment)}
                    className="hover-underline text-blue-600"
                  >
                    填写结果
                  </button>
                )}
                <button type="button" onClick={() => handleDelete(assessment)} className="hover-underline text-red-500">
                  删除
                </button>
              </div>
            </div>

            {completingId === assessment.id && (
              <div className="mt-3 space-y-2 border-t pt-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700" htmlFor={`score-${assessment.id}`}>
                    自评分数（0-100，可留空）
                  </label>
                  <input
                    id={`score-${assessment.id}`}
                    type="number"
                    min={0}
                    max={100}
                    value={score}
                    onChange={(event) => setScore(event.target.value)}
                    className="w-24 rounded-md border px-2 py-1 text-sm"
                  />
                </div>
                <textarea
                  value={reflection}
                  onChange={(event) => setReflection(event.target.value)}
                  placeholder="这次考核的总结和反思…"
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => submitComplete(assessment)}
                    disabled={updateAssessment.isPending}
                    className="hover-btn rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {updateAssessment.isPending ? '保存中…' : '保存结果'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompletingId(null)}
                    className="rounded-md border px-3 py-1 text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
