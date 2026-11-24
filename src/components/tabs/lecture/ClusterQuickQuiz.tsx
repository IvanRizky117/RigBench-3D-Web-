import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Eye, EyeSlash, Lightning, XCircle } from '@phosphor-icons/react';
import { ABC_QUESTIONS, ESSAY_QUESTIONS } from '../../../data/examBankData';
import type { ClusterId, EssayEvaluationResult } from '../../../types/rigbench';
import { evaluateEssayAnswer } from '../../../utils/rubricMatcher';
import { MAX_ESSAY_CHARS, sanitizeUserText } from '../../../utils/inputSanitizer';

interface ClusterQuickQuizProps {
  clusterId: ClusterId;
}

export function ClusterQuickQuiz({ clusterId }: ClusterQuickQuizProps) {
  const clusterEssays = useMemo(
    () => ESSAY_QUESTIONS.filter((q) => q.clusterId === clusterId),
    [clusterId]
  );
  const clusterAbcs = useMemo(
    () => ABC_QUESTIONS.filter((q) => q.clusterId === clusterId),
    [clusterId]
  );

  const [essayDrafts, setEssayDrafts] = useState<Record<string, string>>({});
  const [essayResults, setEssayResults] = useState<Record<string, EssayEvaluationResult>>({});
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [abcAnswers, setAbcAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});

  useEffect(() => {
    setEssayDrafts({});
    setEssayResults({});
    setRevealedIds({});
    setAbcAnswers({});
  }, [clusterId]);

  if (clusterEssays.length === 0 && clusterAbcs.length === 0) {
    return null;
  }

  return (
    <div className="workbench-card rounded-xl p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/[0.06]">
        <div>
          <p className="font-mono text-[11px] font-semibold text-[#38BDF8]">
            CONTOH SOAL INSTAN · TANPA HITUNGAN RUMUS
          </p>
          <h4 className="mt-0.5 text-base font-semibold text-[#F3F4F6]">
            Latihan Langsung Klaster Ini ({clusterEssays.length} Essay Analisis · {clusterAbcs.length} Pilihan Ganda)
          </h4>
        </div>
      </div>

      {/* Essay Analisis Instan */}
      <div className="space-y-4">
        {clusterEssays.map((q) => {
          const draft = essayDrafts[q.id] ?? '';
          const result = essayResults[q.id];
          const revealed = Boolean(revealedIds[q.id]);

          return (
            <div key={q.id} className="rounded-xl bg-[#0B0E14] p-4 sm:p-5 border border-white/[0.06] space-y-3">
              <p className="font-mono text-[11px] font-semibold text-[#38BDF8]">
                ESSAY ANALISIS · {q.topicTag}
              </p>
              <p className="text-sm font-medium leading-relaxed text-[#F8FAFC]">{q.prompt}</p>

              <textarea
                rows={3}
                maxLength={MAX_ESSAY_CHARS}
                value={draft}
                onChange={(e) => {
                  const clean = sanitizeUserText(e.target.value, MAX_ESSAY_CHARS, true);
                  setEssayDrafts((prev) => ({ ...prev, [q.id]: clean.value }));
                }}
                placeholder="Tulis poin analisis konsep kunci kamu di sini, lalu klik Cek Rubrik Instan..."
                className="w-full rounded-xl bg-[#070D1B] p-3 text-xs sm:text-sm text-[#F8FAFC] placeholder-[#64748B] border border-white/10 focus:border-[#38BDF8] focus:outline-none"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEssayResults((prev) => ({
                      ...prev,
                      [q.id]: evaluateEssayAnswer(q, draft),
                    }))
                  }
                  className="sapphire-btn inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap press-feedback"
                >
                  <Lightning size={14} weight="fill" />
                  Cek Rubrik Instan
                </button>
                <button
                  type="button"
                  onClick={() => setRevealedIds((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#141E33] px-3 py-2 text-xs text-[#CBD5E1] border border-white/10 hover:text-white whitespace-nowrap"
                >
                  {revealed ? <EyeSlash size={14} /> : <Eye size={14} />}
                  {revealed ? 'Tutup Kunci Jawaban' : 'Lihat Kunci Ideal'}
                </button>
              </div>

              {result && (
                <div className="rounded-xl bg-[#070D1B] p-3.5 border border-[#38BDF8]/25 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F8FAFC]">Hasil Cek Rubrik Lokal</span>
                    <span className="font-mono font-bold text-[#34D399] tabular-nums">
                      Skor {result.scorePercent}% ({result.earnedPoints}/{result.maxPoints} poin)
                    </span>
                  </div>
                  <div className="space-y-1">
                    {result.criteriaResults.map((cr) => (
                      <div key={cr.criterionId} className="flex items-start gap-2">
                        {cr.matched ? (
                          <CheckCircle size={14} weight="fill" className="mt-0.5 shrink-0 text-[#10B981]" />
                        ) : (
                          <XCircle size={14} weight="fill" className="mt-0.5 shrink-0 text-[#F43F5E]" />
                        )}
                        <span className={cr.matched ? 'text-[#CBD5E1]' : 'text-[#94A3B8]'}>
                          {cr.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {revealed && (
                <div className="rounded-xl bg-[#10B981]/10 p-3.5 border border-[#10B981]/25 space-y-1.5 text-xs">
                  <p className="font-mono font-semibold text-[#34D399]">JAWABAN IDEAL UJIAN</p>
                  <p className="leading-relaxed text-[#E2E8F0]">{q.idealAnswer}</p>
                  <p className="text-[#FDE68A]">Tips: {q.examTip}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pilihan Ganda Instan */}
      <div className="space-y-3">
        {clusterAbcs.map((q, idx) => {
          const picked = abcAnswers[q.id];
          return (
            <div key={q.id} className="rounded-xl bg-[#0B0E14] p-4 sm:p-5 border border-white/[0.06] space-y-3">
              <p className="font-mono text-[11px] font-semibold text-[#F59E0B]">
                PILIHAN GANDA #{idx + 1} · {q.topicTag}
              </p>
              <p className="text-sm font-medium leading-relaxed text-[#F8FAFC]">{q.prompt}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {q.options.map((opt) => {
                  const isCorrect = opt.key === q.correctKey;
                  const isSelected = picked === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setAbcAnswers((prev) => ({ ...prev, [q.id]: opt.key }))}
                      className={`flex items-start gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-xs border transition-colors ${
                        picked && isCorrect
                          ? 'bg-[#10B981]/15 border-[#10B981]/50 text-[#34D399]'
                          : picked && isSelected
                            ? 'bg-[#F43F5E]/15 border-[#F43F5E]/50 text-[#FDA4AF]'
                            : 'bg-[#11192C] border-white/[0.08] text-[#CBD5E1] hover:border-[#38BDF8]/45'
                      }`}
                    >
                      <span className="font-mono font-bold shrink-0">{opt.key}.</span>
                      <span className="leading-relaxed">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
              {picked && (
                <p className="rounded-lg bg-[#070D1B] px-3.5 py-2.5 text-xs leading-relaxed text-[#CBD5E1] border border-white/[0.06]">
                  <strong className={picked === q.correctKey ? 'text-[#34D399]' : 'text-[#FDA4AF]'}>
                    {picked === q.correctKey ? 'Benar! ' : `Kurang tepat (Kunci: ${q.correctKey}). `}
                  </strong>
                  {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
