import { useState } from 'react';
import { ArrowCounterClockwise, CheckCircle, XCircle } from '@phosphor-icons/react';
import { ABC_QUESTIONS, ESSAY_QUESTIONS } from '../../../data/examBankData';
import type { ExamAttemptSummary } from '../../../types/rigbench';
import { formatCountdown, formatShortDate, getGradeLabel } from '../../../utils/formatters';

interface TryOutResultsPanelProps {
  attempt: ExamAttemptSummary;
  essayAnswers: Record<string, string>;
  onRestart: () => void;
}

export function TryOutResultsPanel({
  attempt,
  essayAnswers,
  onRestart,
}: TryOutResultsPanelProps) {
  const [reviewFilter, setReviewFilter] = useState<'all' | 'essay' | 'abc'>('all');

  return (
    <div className="space-y-6">
      {/* Clean Score Summary Header */}
      <div className="datacore-card rounded-2xl p-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="font-mono text-[11px] text-[#38BDF8]">
            HASIL TRY OUT · {formatShortDate(attempt.completedAtIso)}
          </p>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-4xl font-semibold text-[#F8FAFC] tabular-nums">
              {attempt.totalScore}
              <span className="text-lg font-normal text-[#64748B]">/100</span>
            </span>
            <span className="text-sm font-medium text-[#34D399]">
              {getGradeLabel(attempt.totalScore).label}
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] tabular-nums">
            Durasi: {formatCountdown(attempt.elapsedSeconds)} / {attempt.durationMinutes} menit
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 border-t border-[#3B82F6]/15 pt-4 lg:border-t-0 lg:pt-0">
          <div>
            <p className="text-[11px] text-[#94A3B8]">Essay (70%)</p>
            <p className="font-mono text-2xl font-semibold text-[#38BDF8] tabular-nums">
              {attempt.essayScorePercent}%
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[#94A3B8]">Pilihan Ganda (30%)</p>
            <p className="font-mono text-2xl font-semibold text-[#F8FAFC] tabular-nums">
              {attempt.abcScorePercent}%
            </p>
            <p className="text-[10px] text-[#64748B] tabular-nums">
              {attempt.abcCorrectCount}/{attempt.abcTotalCount} benar
            </p>
          </div>
          <button
            type="button"
            onClick={onRestart}
            className="sapphire-btn inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-medium"
          >
            <ArrowCounterClockwise size={14} weight="bold" />
            Ulangi Try Out
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'all', label: `Semua (${ESSAY_QUESTIONS.length + ABC_QUESTIONS.length})` },
            { id: 'essay', label: `Rubrik Essay (${ESSAY_QUESTIONS.length})` },
            { id: 'abc', label: `Pilihan Ganda (${ABC_QUESTIONS.length})` },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setReviewFilter(item.id)}
            className={`rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-colors press-feedback ${
              reviewFilter === item.id
                ? 'border-[#38BDF8]/50 bg-[#2563EB]/25 text-[#38BDF8]'
                : 'border-[#3B82F6]/15 bg-[#070E1F] text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Compact Flat-Row Essay Rubric Breakdown */}
      {(reviewFilter === 'all' || reviewFilter === 'essay') && (
        <div className="datacore-card rounded-2xl divide-y divide-[#3B82F6]/15 overflow-hidden">
          {ESSAY_QUESTIONS.map((q, idx) => {
            const evalRes = attempt.essayEvaluations.find((e) => e.questionId === q.id);
            const score = evalRes?.scorePercent ?? 0;
            const userAns = essayAnswers[q.id];
            return (
              <div key={q.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-[11px] text-[#38BDF8]">
                      ESSAY #{idx + 1} · {q.topicTag}
                    </span>
                    <h3 className="mt-0.5 text-sm font-medium text-[#F8FAFC] sm:text-base">
                      {q.prompt}
                    </h3>
                  </div>
                  <span
                    className={`shrink-0 font-mono text-base font-semibold tabular-nums ${
                      score >= 70
                        ? 'text-[#34D399]'
                        : score >= 40
                          ? 'text-[#F59E0B]'
                          : 'text-[#F43F5E]'
                    }`}
                  >
                    {score}%
                  </span>
                </div>

                {userAns !== undefined && (
                  <p className="rounded-xl bg-[#040812]/80 px-3.5 py-2.5 text-xs text-[#CBD5E1]">
                    <span className="font-medium text-[#94A3B8]">Jawabanmu: </span>
                    {userAns.trim() || '(Kosong)'}
                  </p>
                )}

                {evalRes && (
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {evalRes.criteriaResults.map((crit) => (
                      <div
                        key={crit.criterionId}
                        className="flex items-start justify-between gap-2 rounded-lg bg-[#050C1B]/90 px-3 py-2 text-xs"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          {crit.matched ? (
                            <CheckCircle
                              size={14}
                              weight="fill"
                              className="mt-0.5 shrink-0 text-[#10B981]"
                            />
                          ) : (
                            <XCircle
                              size={14}
                              weight="fill"
                              className="mt-0.5 shrink-0 text-[#F43F5E]"
                            />
                          )}
                          <span className={crit.matched ? 'text-[#E2E8F0]' : 'text-[#64748B]'}>
                            {crit.label}
                          </span>
                        </div>
                        <span className="shrink-0 font-mono text-[11px] text-[#64748B] tabular-nums">
                          {crit.earnedWeight}/{crit.weight}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs leading-relaxed text-[#94A3B8]">
                  <span className="font-medium text-[#38BDF8]">Standar Ideal: </span>
                  {q.idealAnswer}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Compact Flat-Row ABC Results */}
      {(reviewFilter === 'all' || reviewFilter === 'abc') && (
        <div className="datacore-card rounded-2xl divide-y divide-[#3B82F6]/15 overflow-hidden">
          {ABC_QUESTIONS.map((q, idx) => {
            const evalRes = attempt.abcEvaluations.find((e) => e.questionId === q.id);
            const isCorrect = evalRes?.isCorrect ?? false;
            return (
              <div key={q.id} className="p-4 sm:p-5 space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-[11px] text-[#64748B]">
                      ABC #{idx + 1} · {q.topicTag}
                    </span>
                    <h3 className="mt-0.5 text-sm font-medium text-[#F8FAFC]">{q.prompt}</h3>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 text-xs font-medium ${
                      isCorrect ? 'text-[#34D399]' : 'text-[#F43F5E]'
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle size={14} weight="fill" /> Benar
                      </>
                    ) : (
                      <>
                        <XCircle size={14} weight="fill" /> Salah
                      </>
                    )}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-[#94A3B8]">
                  Pilihanmu: <strong className="text-[#F8FAFC]">{evalRes?.selectedKey ?? '—'}</strong> ·
                  Kunci: <strong className="text-[#34D399]">{q.correctKey}</strong>
                </p>
                <p className="text-xs leading-relaxed text-[#94A3B8]">{q.explanation}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
