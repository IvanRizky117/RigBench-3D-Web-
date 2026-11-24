import { useMemo, useState } from 'react';
import {
  Cards,
  Clock,
  Exam,
  Flag,
  ListChecks,
  Play,
  SquaresFour,
} from '@phosphor-icons/react';
import { getClusterTrack } from '../../data/curriculumData';
import { ABC_QUESTIONS, ESSAY_QUESTIONS } from '../../data/examBankData';
import type { ClusterId, ExamAttemptSummary, ToastVariant, TryOutScope } from '../../types/rigbench';
import { evaluateFullTryOut } from '../../utils/rubricMatcher';
import { MAX_ESSAY_CHARS, sanitizeUserText } from '../../utils/inputSanitizer';
import { formatCountdown, formatShortDate, getGradeLabel } from '../../utils/formatters';
import { useExamTimer } from '../../hooks/useExamTimer';
import { GlossaryFlashcards } from '../ui/GlossaryFlashcards';
import { TryOutResultsPanel } from './exam/TryOutResultsPanel';
import { GuidedPracticePanel } from './exam/GuidedPracticePanel';

interface ExamTabProps {
  examHistory: ExamAttemptSummary[];
  masteredGlossaryIds: string[];
  onRecordExamAttempt: (attempt: ExamAttemptSummary) => void;
  onToggleGlossaryMastered: (id: string) => void;
  onNotify: (title: string, description: string, variant?: ToastVariant) => void;
}

type ExamSubTab = 'tryout' | 'guided' | 'glossary';
type TryOutPhase = 'setup' | 'running' | 'results';

const DURATION_PRESETS = [30, 45, 60, 90];

const TRYOUT_SCOPES: Array<{ id: TryOutScope; label: string; shortDesc: string }> = [
  { id: 'all', label: 'Semua Materi', shortDesc: 'Praktikum PC + Arsitektur + Sejarah PC' },
  { id: 'praktikum', label: 'Praktikum PC', shortDesc: '7 klaster hardware, PSU, storage & EULA' },
  { id: 'arsitektur', label: 'Arsitektur Komputer', shortDesc: 'Modul 1: 5 Unit, Bus, OS, Pipeline & Paralel' },
  { id: 'sejarah', label: 'Sejarah PC', shortDesc: 'Modul 6: Tokoh, 5 Gen HW, Klasifikasi & 4 Era SW' },
  { id: 'theory', label: 'Teori (Modul 1 & 6)', shortDesc: 'Gabungan Arsitektur Komputer + Sejarah PC' },
];

function matchesTryOutScope(clusterId: ClusterId, scope: TryOutScope): boolean {
  if (scope === 'all') return true;
  const track = getClusterTrack(clusterId);
  if (scope === 'theory') return track === 'arsitektur' || track === 'sejarah';
  return track === scope;
}

export function ExamTab({
  examHistory,
  masteredGlossaryIds,
  onRecordExamAttempt,
  onToggleGlossaryMastered,
  onNotify,
}: ExamTabProps) {
  const [subTab, setSubTab] = useState<ExamSubTab>('tryout');
  const [phase, setPhase] = useState<TryOutPhase>('setup');
  const [tryOutScope, setTryOutScope] = useState<TryOutScope>('all');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [customMinutesInput, setCustomMinutesInput] = useState<string>('60');
  const [essayAnswers, setEssayAnswers] = useState<Record<string, string>>({});
  const [abcAnswers, setAbcAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [flaggedIds, setFlaggedIds] = useState<Record<string, boolean>>({});
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [showNavGrid, setShowNavGrid] = useState<boolean>(false);
  const [confirmingFinish, setConfirmingFinish] = useState(false);
  const [latestAttempt, setLatestAttempt] = useState<ExamAttemptSummary | null>(null);

  const scopedEssays = useMemo(
    () => ESSAY_QUESTIONS.filter((q) => matchesTryOutScope(q.clusterId, tryOutScope)),
    [tryOutScope]
  );
  const scopedAbcs = useMemo(
    () => ABC_QUESTIONS.filter((q) => matchesTryOutScope(q.clusterId, tryOutScope)),
    [tryOutScope]
  );
  const allQuestions = useMemo(() => [...scopedEssays, ...scopedAbcs], [scopedEssays, scopedAbcs]);
  const activeScopeMeta =
    TRYOUT_SCOPES.find((s) => s.id === tryOutScope) ?? TRYOUT_SCOPES[0];

  const finishTryOut = (expiredByTimer = false) => {
    const evaluated = evaluateFullTryOut({
      essayQuestions: scopedEssays,
      abcQuestions: scopedAbcs,
      essayAnswers,
      abcAnswers,
      durationMinutes,
      elapsedSeconds: timer.elapsedSeconds,
    });
    const attempt: ExamAttemptSummary = {
      ...evaluated,
      scope: tryOutScope,
      scopeLabel: activeScopeMeta.label,
    };
    setLatestAttempt(attempt);
    setPhase('results');
    setConfirmingFinish(false);
    setShowNavGrid(false);
    onRecordExamAttempt(attempt);
    onNotify(
      expiredByTimer ? 'Waktu Try Out Habis' : 'Analisis Rubrik Selesai',
      `Skor ${activeScopeMeta.label}: ${attempt.totalScore}/100 (Essay ${attempt.essayScorePercent}% · ABC ${attempt.abcScorePercent}%).`,
      attempt.totalScore >= 70 ? 'success' : 'info'
    );
  };

  const timer = useExamTimer({
    initialSeconds: durationMinutes * 60,
    running: phase === 'running',
    onExpire: () => finishTryOut(true),
  });

  const handleStartTryOut = () => {
    const clampedMins = Math.min(180, Math.max(10, Number(customMinutesInput) || durationMinutes));
    setDurationMinutes(clampedMins);
    setCustomMinutesInput(String(clampedMins));
    setEssayAnswers({});
    setAbcAnswers({});
    setFlaggedIds({});
    setActiveIndex(0);
    setConfirmingFinish(false);
    setShowNavGrid(false);
    setLatestAttempt(null);
    timer.reset(clampedMins * 60);
    setPhase('running');
  };

  const answeredCount = useMemo(() => {
    const essayDone = scopedEssays.filter((q) => (essayAnswers[q.id] ?? '').trim().length >= 5).length;
    const abcDone = scopedAbcs.filter((q) => Boolean(abcAnswers[q.id])).length;
    return essayDone + abcDone;
  }, [scopedEssays, scopedAbcs, essayAnswers, abcAnswers]);

  const activeQuestion = allQuestions[activeIndex] ?? allQuestions[0];

  const toggleFlag = (id: string) => {
    setFlaggedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="mx-auto max-w-5xl px-3.5 sm:px-6 lg:px-8 py-6 sm:py-7 space-y-6 pb-28 md:pb-16">
      {/* Clean Minimalist Sub-Navigation Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-[#F8FAFC] sm:text-2xl">
            Uji Pemahaman &amp; Try Out
          </h1>
          <p className="mt-0.5 text-xs text-[#94A3B8]">
            Prioritas 70% Essay Analisis · 30% Pilihan Ganda · Analisis rubrik cerdas lokal tanpa AI
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-[#3B82F6]/20 bg-[#070E1F] p-1 self-start sm:self-auto">
          {(
            [
              { id: 'tryout', label: 'Try Out', icon: Exam },
              { id: 'guided', label: 'Latihan Klaster', icon: ListChecks },
              { id: 'glossary', label: 'Glosarium', icon: Cards },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = subTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSubTab(item.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#2563EB] text-white'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <Icon size={14} weight={active ? 'fill' : 'regular'} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* === SUB-TAB 1: TRY OUT TTS (SINGLE-FOCUS WORKSPACE) === */}
      {subTab === 'tryout' && (
        <>
          {phase === 'setup' && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div className="datacore-card rounded-2xl p-6 lg:col-span-7 space-y-5">
                <div>
                  <h2 className="text-base font-medium text-[#F8FAFC]">Mulai Simulasi Berwaktu</h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#94A3B8]">
                    Pilih cakupan paket materi terlebih dahulu. Semua jawaban Essay dikoreksi otomatis di browser berdasarkan kata kunci konsep (tanpa hitungan rumus untuk Modul 1 &amp; 6).
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-[#94A3B8]">Cakupan Paket Try Out</p>
                  <div className="flex flex-wrap gap-1.5">
                    {TRYOUT_SCOPES.map((sc) => {
                      const active = tryOutScope === sc.id;
                      return (
                        <button
                          key={sc.id}
                          type="button"
                          onClick={() => setTryOutScope(sc.id)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors press-feedback ${
                            active
                              ? 'border-[#38BDF8] bg-[#2563EB]/25 text-[#38BDF8]'
                              : 'border-[#3B82F6]/15 bg-[#040812] text-[#94A3B8] hover:text-[#F8FAFC]'
                          }`}
                        >
                          {sc.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-[#64748B]">{activeScopeMeta.shortDesc}</p>
                </div>

                <div className="grid grid-cols-3 gap-3 border-y border-[#3B82F6]/15 py-4 text-center sm:text-left">
                  <div>
                    <p className="text-[11px] text-[#94A3B8]">Essay</p>
                    <p className="mt-0.5 font-mono text-base font-semibold text-[#38BDF8] tabular-nums">
                      {scopedEssays.length} · 70%
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#94A3B8]">Pilihan Ganda</p>
                    <p className="mt-0.5 font-mono text-base font-semibold text-[#F8FAFC] tabular-nums">
                      {scopedAbcs.length} · 30%
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#94A3B8]">Koreksi</p>
                    <p className="mt-0.5 text-sm font-medium text-[#34D399]">Rubric Lokal</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <p className="text-xs font-medium text-[#94A3B8]">Pilih Durasi Try Out</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {DURATION_PRESETS.map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => {
                          setDurationMinutes(mins);
                          setCustomMinutesInput(String(mins));
                        }}
                        className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
                          durationMinutes === mins
                            ? 'border-[#38BDF8] bg-[#2563EB]/25 text-[#38BDF8]'
                            : 'border-[#3B82F6]/15 bg-[#040812] text-[#94A3B8] hover:text-[#F8FAFC]'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                    <div className="flex items-center gap-1.5 rounded-lg border border-[#3B82F6]/15 bg-[#040812] px-2.5 py-1.5">
                      <input
                        type="number"
                        min={10}
                        max={180}
                        value={customMinutesInput}
                        onChange={(e) => {
                          setCustomMinutesInput(e.target.value);
                          const val = Number(e.target.value);
                          if (val >= 10 && val <= 180) setDurationMinutes(val);
                        }}
                        aria-label="Durasi kustom menit"
                        className="w-12 bg-transparent font-mono text-xs text-[#F8FAFC] focus:outline-none tabular-nums"
                      />
                      <span className="text-[11px] text-[#64748B]">menit</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartTryOut}
                  className="sapphire-btn inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium"
                >
                  <Play size={15} weight="fill" />
                  Mulai Try Out ({durationMinutes} Menit)
                </button>
              </div>

              {/* Clean Attempt History */}
              <div className="datacore-card rounded-2xl p-6 lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-[#F8FAFC]">Riwayat Skor</h2>
                  <span className="font-mono text-xs text-[#64748B] tabular-nums">
                    {examHistory.length} sesi
                  </span>
                </div>

                {examHistory.length === 0 ? (
                  <p className="rounded-xl bg-[#040812]/80 p-5 text-center text-xs text-[#64748B]">
                    Belum ada riwayat Try Out. Selesaikan sesi pertama untuk melihat rekap skor.
                  </p>
                ) : (
                  <div className="divide-y divide-[#3B82F6]/15 max-h-[280px] overflow-y-auto">
                    {examHistory.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setLatestAttempt(item);
                          setPhase('results');
                        }}
                        className="flex w-full items-center justify-between py-3 text-left hover:text-[#38BDF8] transition-colors"
                      >
                        <div>
                          <p className="text-xs font-medium text-[#F8FAFC]">
                            {item.scopeLabel ? `${item.scopeLabel} · ` : ''}
                            {formatShortDate(item.completedAtIso)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#94A3B8] tabular-nums">
                            Essay {item.essayScorePercent}% · ABC {item.abcScorePercent}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-base font-semibold text-[#38BDF8] tabular-nums">
                            {item.totalScore}
                          </p>
                          <p className="text-[10px] text-[#64748B]">
                            {getGradeLabel(item.totalScore).label}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RUNNING: Clean Single-Question Focus Workspace */}
          {phase === 'running' && (
            <div className="space-y-4">
              {/* Minimal Top Control Bar */}
              <div className="datacore-card sticky top-[72px] z-20 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-semibold tabular-nums ${
                      timer.remainingSeconds <= 60
                        ? 'border-[#F43F5E]/50 bg-[#F43F5E]/15 text-[#F43F5E]'
                        : timer.remainingSeconds <= 300
                          ? 'border-[#F59E0B]/50 bg-[#F59E0B]/15 text-[#F59E0B]'
                          : 'border-[#38BDF8]/35 bg-[#2563EB]/20 text-[#38BDF8]'
                    }`}
                  >
                    <Clock size={14} weight="bold" />
                    {formatCountdown(timer.remainingSeconds)}
                  </div>

                  <span className="text-xs text-[#94A3B8] tabular-nums">
                    Soal <strong className="text-[#F8FAFC]">{activeIndex + 1}</strong>/{allQuestions.length} ·{' '}
                    Terjawab <strong className="text-[#38BDF8]">{answeredCount}</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => setShowNavGrid((s) => !s)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#3B82F6]/20 bg-[#040812] px-2.5 py-1 text-xs text-[#CBD5E1] hover:border-[#38BDF8]"
                  >
                    <SquaresFour size={13} />
                    Peta Soal
                  </button>
                </div>

                {!confirmingFinish ? (
                  <button
                    type="button"
                    onClick={() =>
                      answeredCount < allQuestions.length
                        ? setConfirmingFinish(true)
                        : finishTryOut(false)
                    }
                    className="rounded-lg bg-[#10B981] px-3.5 py-1.5 text-xs font-semibold text-[#040812] hover:bg-[#34D399] press-feedback"
                  >
                    Selesai &amp; Skor
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#FDE68A]">
                      {allQuestions.length - answeredCount} kosong. Kumpulkan?
                    </span>
                    <button
                      type="button"
                      onClick={() => finishTryOut(false)}
                      className="rounded-md bg-[#10B981] px-2.5 py-1 font-semibold text-[#040812]"
                    >
                      Ya
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingFinish(false)}
                      className="rounded-md bg-[#0A162D] px-2.5 py-1 text-[#CBD5E1]"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>

              {/* Optional Collapsible Question Palette */}
              {showNavGrid && (
                <div className="datacore-card rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {allQuestions.map((q, idx) => {
                      const isEssay = q.type === 'essay';
                      const isActive = idx === activeIndex;
                      const isAnswered = isEssay
                        ? (essayAnswers[q.id] ?? '').trim().length >= 5
                        : Boolean(abcAnswers[q.id]);
                      const isFlagged = Boolean(flaggedIds[q.id]);
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => {
                            setActiveIndex(idx);
                            setShowNavGrid(false);
                          }}
                          className={`h-8 w-10 rounded-lg border font-mono text-xs font-medium transition-colors ${
                            isActive
                              ? 'border-[#38BDF8] bg-[#2563EB] text-white'
                              : isFlagged
                                ? 'border-[#F59E0B] bg-[#F59E0B]/20 text-[#F59E0B]'
                                : isAnswered
                                  ? 'border-[#10B981]/50 bg-[#10B981]/15 text-[#34D399]'
                                  : 'border-[#3B82F6]/15 bg-[#040812] text-[#94A3B8]'
                          }`}
                        >
                          {isEssay ? `E${idx + 1}` : `P${idx - scopedEssays.length + 1}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Focused Single Question Canvas */}
              <div className="datacore-card rounded-2xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between gap-2 border-b border-[#3B82F6]/15 pb-3">
                  <div className="text-xs">
                    <span className="font-mono font-semibold text-[#38BDF8]">
                      {activeQuestion.type === 'essay'
                        ? `ESSAY #${activeIndex + 1} (70%)`
                        : `PILIHAN GANDA #${activeIndex - scopedEssays.length + 1} (30%)`}
                    </span>
                    <span className="mx-2 text-[#475569]">·</span>
                    <span className="text-[#94A3B8]">{activeQuestion.topicTag}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleFlag(activeQuestion.id)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                      flaggedIds[activeQuestion.id]
                        ? 'border-[#F59E0B] bg-[#F59E0B]/15 text-[#F59E0B]'
                        : 'border-[#3B82F6]/15 bg-[#040812] text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    <Flag size={13} weight={flaggedIds[activeQuestion.id] ? 'fill' : 'regular'} />
                    Ragu
                  </button>
                </div>

                {activeQuestion.type === 'essay' && activeQuestion.caseContext && (
                  <div className="rounded-xl bg-[#040812]/80 px-4 py-3 text-xs leading-relaxed text-[#CBD5E1]">
                    <span className="font-medium text-[#38BDF8]">Studi Kasus: </span>
                    {activeQuestion.caseContext}
                  </div>
                )}

                <h2 className="text-base font-medium leading-relaxed text-[#F8FAFC] sm:text-lg">
                  {activeQuestion.prompt}
                </h2>

                {activeQuestion.type === 'essay' ? (
                  <div className="space-y-2">
                    <textarea
                      rows={7}
                      maxLength={MAX_ESSAY_CHARS}
                      value={essayAnswers[activeQuestion.id] ?? ''}
                      onChange={(e) => {
                        const clean = sanitizeUserText(e.target.value, MAX_ESSAY_CHARS, true);
                        if (clean.blockedInjection) {
                          onNotify(
                            'Input Berbahaya Diblokir',
                            'Tag HTML/script dan pola injeksi XSS otomatis dibersihkan demi keamanan.',
                            'warning'
                          );
                        }
                        setEssayAnswers((prev) => ({
                          ...prev,
                          [activeQuestion.id]: clean.value,
                        }));
                      }}
                      placeholder="Tuliskan analisis lengkapmu dengan istilah teknis yang tepat..."
                      className="w-full rounded-xl border border-[#3B82F6]/20 bg-[#040812] p-4 text-sm leading-relaxed text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#38BDF8] focus:outline-none"
                    />
                    <p className="text-right font-mono text-[11px] text-[#64748B] tabular-nums">
                      {(essayAnswers[activeQuestion.id] ?? '')
                        .trim()
                        .split(/\s+/)
                        .filter(Boolean).length}{' '}
                      kata · {(essayAnswers[activeQuestion.id] ?? '').length}/{MAX_ESSAY_CHARS} kar
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activeQuestion.options.map((opt) => {
                      const selected = abcAnswers[activeQuestion.id] === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() =>
                            setAbcAnswers((prev) => ({
                              ...prev,
                              [activeQuestion.id]: opt.key,
                            }))
                          }
                          className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition-colors ${
                            selected
                              ? 'border-[#38BDF8] bg-[#2563EB]/20 text-[#F8FAFC]'
                              : 'border-[#3B82F6]/15 bg-[#040812] text-[#CBD5E1] hover:border-[#3B82F6]/40'
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold ${
                              selected
                                ? 'bg-[#2563EB] text-white'
                                : 'bg-[#0A162D] text-[#94A3B8]'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="leading-relaxed">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-[#3B82F6]/15 pt-4">
                  <button
                    type="button"
                    disabled={activeIndex === 0}
                    onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                    className="rounded-xl border border-[#3B82F6]/20 bg-[#040812] px-4 py-2 text-xs font-medium text-[#CBD5E1] hover:border-[#38BDF8] disabled:opacity-40"
                  >
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    disabled={activeIndex === allQuestions.length - 1}
                    onClick={() =>
                      setActiveIndex((i) => Math.min(allQuestions.length - 1, i + 1))
                    }
                    className="sapphire-btn rounded-xl px-4 py-2 text-xs font-medium disabled:opacity-40"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === 'results' && latestAttempt && (
            <TryOutResultsPanel
              attempt={latestAttempt}
              essayAnswers={essayAnswers}
              onRestart={() => setPhase('setup')}
            />
          )}
        </>
      )}

      {/* === SUB-TAB 2: LATIHAN PER KLASTER === */}
      {subTab === 'guided' && <GuidedPracticePanel onNotify={onNotify} />}

      {/* === SUB-TAB 3: GLOSARIUM FLASHCARDS === */}
      {subTab === 'glossary' && (
        <GlossaryFlashcards
          masteredIds={masteredGlossaryIds}
          onToggleMastered={onToggleGlossaryMastered}
        />
      )}
    </div>
  );
}
