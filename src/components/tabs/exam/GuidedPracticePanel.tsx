import { useMemo, useState } from 'react';
import { CheckCircle, XCircle } from '@phosphor-icons/react';
import { CURRICULUM_CLUSTERS } from '../../../data/curriculumData';
import { ABC_QUESTIONS, ESSAY_QUESTIONS } from '../../../data/examBankData';
import type { ClusterId, EssayEvaluationResult, ToastVariant } from '../../../types/rigbench';
import { evaluateEssayAnswer } from '../../../utils/rubricMatcher';
import { MAX_ESSAY_CHARS, sanitizeUserText } from '../../../utils/inputSanitizer';

interface GuidedPracticePanelProps {
  onNotify: (title: string, description: string, variant?: ToastVariant) => void;
}

export function GuidedPracticePanel({ onNotify }: GuidedPracticePanelProps) {
  const [clusterId, setClusterId] = useState<ClusterId>('cluster-1');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, EssayEvaluationResult>>({});
  const [idealVisible, setIdealVisible] = useState<Record<string, boolean>>({});
  const [abcChoices, setAbcChoices] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});

  const essays = useMemo(
    () => ESSAY_QUESTIONS.filter((q) => q.clusterId === clusterId),
    [clusterId]
  );
  const abcs = useMemo(
    () => ABC_QUESTIONS.filter((q) => q.clusterId === clusterId),
    [clusterId]
  );

  const handleCheckEssay = (qId: string) => {
    const question = ESSAY_QUESTIONS.find((q) => q.id === qId);
    if (!question) return;
    const draft = drafts[qId] ?? '';
    if (draft.trim().length < 5) {
      onNotify(
        'Jawaban Terlalu Singkat',
        'Tuliskan penjelasan singkat terlebih dahulu sebelum memeriksa rubrik.',
        'warning'
      );
      return;
    }
    const res = evaluateEssayAnswer(question, draft);
    setResults((prev) => ({ ...prev, [qId]: res }));
  };

  return (
    <div className="space-y-6">
      {/* Compact 7-Cluster Filter Bar */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {CURRICULUM_CLUSTERS.map((cluster) => {
          const active = cluster.id === clusterId;
          return (
            <button
              key={cluster.id}
              type="button"
              onClick={() => setClusterId(cluster.id)}
              className={`rounded-xl px-3 py-2 text-left transition-all press-feedback ${
                active
                  ? 'border border-[#38BDF8]/55 bg-[#2563EB]/25 text-[#F8FAFC]'
                  : 'datacore-card text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <div className="font-mono text-[10px] font-semibold text-[#38BDF8]">
                {cluster.number}
              </div>
              <div className="truncate text-xs font-medium">{cluster.shortTitle}</div>
            </button>
          );
        })}
      </div>

      {/* Essay Practice (Flat Rows inside Single Card) */}
      <div className="datacore-card rounded-2xl divide-y divide-[#3B82F6]/15 overflow-hidden">
        {essays.map((q, idx) => {
          const result = results[q.id];
          const showIdeal = Boolean(idealVisible[q.id]);
          return (
            <div key={q.id} className="p-5 space-y-3.5">
              <div>
                <p className="font-mono text-[11px] text-[#38BDF8]">
                  ESSAY {idx + 1} · {q.topicTag}
                </p>
                {q.caseContext && (
                  <p className="mt-1.5 rounded-xl bg-[#040812]/80 px-3.5 py-2.5 text-xs text-[#CBD5E1]">
                    <strong className="text-[#38BDF8]">Kasus: </strong>
                    {q.caseContext}
                  </p>
                )}
                <h3 className="mt-2 text-sm font-medium text-[#F8FAFC] sm:text-base">{q.prompt}</h3>
              </div>

              <textarea
                rows={4}
                maxLength={MAX_ESSAY_CHARS}
                value={drafts[q.id] ?? ''}
                onChange={(e) => {
                  const clean = sanitizeUserText(e.target.value, MAX_ESSAY_CHARS, true);
                  if (clean.blockedInjection) {
                    onNotify(
                      'Input Berbahaya Diblokir',
                      'Tag HTML/script dan pola injeksi XSS otomatis dibersihkan demi keamanan.',
                      'warning'
                    );
                  }
                  setDrafts((prev) => ({ ...prev, [q.id]: clean.value }));
                }}
                placeholder="Ketik analisis dengan bahasamu sendiri, lalu uji dengan Analisis Rubrik Lokal..."
                className="w-full rounded-xl border border-[#3B82F6]/20 bg-[#040812] p-3.5 text-sm text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#38BDF8] focus:outline-none"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCheckEssay(q.id)}
                  className="sapphire-btn rounded-lg px-4 py-2 text-xs font-medium"
                >
                  Analisis Rubrik Lokal
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setIdealVisible((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                  }
                  className="rounded-lg border border-[#3B82F6]/20 bg-[#040812] px-3.5 py-2 text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC]"
                >
                  {showIdeal ? 'Sembunyikan Ideal' : 'Lihat Jawaban Ideal'}
                </button>
                {result && (
                  <span
                    className={`ml-auto font-mono text-sm font-semibold tabular-nums ${
                      result.scorePercent >= 70
                        ? 'text-[#34D399]'
                        : result.scorePercent >= 40
                          ? 'text-[#F59E0B]'
                          : 'text-[#F43F5E]'
                    }`}
                  >
                    Skor: {result.scorePercent}%
                  </span>
                )}
              </div>

              {result && (
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {result.criteriaResults.map((crit) => (
                    <div
                      key={crit.criterionId}
                      className="flex items-start gap-2 rounded-lg bg-[#050C1B] px-3 py-2 text-xs"
                    >
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
                  ))}
                </div>
              )}

              {showIdeal && (
                <p className="rounded-xl border border-[#38BDF8]/25 bg-[#0A162D]/80 px-3.5 py-3 text-xs leading-relaxed text-[#CBD5E1]">
                  <strong className="text-[#38BDF8]">Jawaban Ideal: </strong>
                  {q.idealAnswer}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Compact ABC Questions for Active Cluster */}
      {abcs.length > 0 && (
        <div className="datacore-card rounded-2xl divide-y divide-[#3B82F6]/15 overflow-hidden">
          {abcs.map((q, idx) => {
            const chosen = abcChoices[q.id];
            return (
              <div key={q.id} className="p-5 space-y-3">
                <div>
                  <span className="font-mono text-[11px] text-[#64748B]">
                    PILIHAN GANDA {idx + 1} · {q.topicTag}
                  </span>
                  <h3 className="mt-0.5 text-sm font-medium text-[#F8FAFC]">{q.prompt}</h3>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {q.options.map((opt) => {
                    const isSelected = chosen === opt.key;
                    const isRight = chosen && opt.key === q.correctKey;
                    const isWrong = isSelected && opt.key !== q.correctKey;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() =>
                          setAbcChoices((prev) => ({ ...prev, [q.id]: opt.key }))
                        }
                        className={`flex items-start gap-2.5 rounded-xl border p-3 text-left text-xs transition-colors ${
                          isRight
                            ? 'border-[#10B981]/60 bg-[#10B981]/15 text-[#F8FAFC]'
                            : isWrong
                              ? 'border-[#F43F5E]/60 bg-[#F43F5E]/15 text-[#F8FAFC]'
                              : 'border-[#3B82F6]/15 bg-[#040812] text-[#CBD5E1] hover:border-[#38BDF8]/40'
                        }`}
                      >
                        <span className="font-mono font-semibold text-[#38BDF8]">{opt.key}.</span>
                        <span className="leading-relaxed">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {chosen && (
                  <p className="text-xs leading-relaxed text-[#94A3B8]">
                    <strong className="text-[#34D399]">Pembahasan: </strong>
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
