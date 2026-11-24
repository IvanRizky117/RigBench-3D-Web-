import { useState } from 'react';
import {
  ArrowCounterClockwise,
  CheckCircle,
  ClockCounterClockwise,
  Cpu,
  UserCircle,
  XCircle,
} from '@phosphor-icons/react';
import {
  CLASSIFICATION_DATA_M6,
  EXPERT_DEFINITIONS_M6,
  FIVE_GENERATIONS_M6,
  FOUR_SOFTWARE_ERAS_M6,
  GENERATION_QUIZ_ITEMS_M6,
  HISTORY_PIONEERS_M6,
  SYSTEM_ELEMENTS_M6,
  type HistoryPioneerItem,
} from '../../../data/extraCurriculumData';
import type { ClusterId } from '../../../types/rigbench';

interface HistoryLabsProps {
  clusterId: ClusterId;
}

export function HistoryLabs({ clusterId }: HistoryLabsProps) {
  // hist-1: Pioneer cards filter
  const [eraFilter, setEraFilter] = useState<'Semua' | HistoryPioneerItem['category']>('Semua');

  // hist-2: 5 Generations selector + Mini-Quiz state
  const [selectedGen, setSelectedGen] = useState<number>(1);
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [pickedOption, setPickedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState<number>(0);

  // hist-3: 3 Elements & Classification tabs
  const [activeElementId, setActiveElementId] = useState<string>('hardware');
  const [classTab, setClassTab] = useState<'byData' | 'byPurpose' | 'bySize'>('byData');

  // --- KLASTER S1: Kartu Profil Tokoh & Penemuan Bersejarah ---
  if (clusterId === 'hist-1') {
    const categories = ['Semua', 'Manual', 'Mekanik', 'Mekanik Elektronik', 'Elektronik'] as const;
    const items = HISTORY_PIONEERS_M6.filter((p) => eraFilter === 'Semua' || p.category === eraFilter);

    return (
      <div className="workbench-card rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-semibold text-[#F3F4F6]">
              Kartu Profil Tokoh &amp; Penemuan Bersejarah (4 Golongan Alat Hitung)
            </h4>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              Saring berdasarkan golongan alat untuk menghafal tahun, penemu, dan ciri kunci ujian.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setEraFilter(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap press-feedback ${
                  eraFilter === cat
                    ? 'bg-[#2563EB]/25 text-[#38BDF8] border border-[#38BDF8]/45'
                    : 'bg-[#0B0E14] text-[#9CA3AF] border border-white/[0.08] hover:text-[#F3F4F6]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl bg-[#0B0E14] p-4 border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-mono font-bold text-[#F59E0B]">{item.year}</span>
                <span className="font-mono text-[11px] text-[#38BDF8]">{item.category}</span>
              </div>
              <p className="text-sm font-semibold text-[#F8FAFC]">{item.name}</p>
              <p className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <UserCircle size={14} className="text-[#38BDF8] shrink-0" />
                <span>{item.inventor}</span>
              </p>
              <p className="text-xs leading-relaxed text-[#CBD5E1]">{item.keyInnovation}</p>
              <p className="pt-1 text-[11px] text-[#34D399]">Catatan Ujian: {item.examNote}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- KLASTER S2: Timeline 5 Generasi HW + 4 Era SW Strip + Mini-Quiz Tebak Generasi ---
  if (clusterId === 'hist-2') {
    const activeGen = FIVE_GENERATIONS_M6.find((g) => g.gen === selectedGen) ?? FIVE_GENERATIONS_M6[0];
    const currentQuiz = GENERATION_QUIZ_ITEMS_M6[quizIndex] ?? GENERATION_QUIZ_ITEMS_M6[0];
    const quizFinished = quizIndex >= GENERATION_QUIZ_ITEMS_M6.length;

    return (
      <div className="space-y-6">
        {/* Interactive 5 Hardware Generations Timeline */}
        <div className="workbench-card rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-semibold text-[#F3F4F6]">
                Timeline Interaktif 5 Generasi Hardware Komputer
              </h4>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">
                Rentang tahun dan mesin mengikuti Modul 6 PDF untuk akurasi ujian, disertai catatan konteks modern.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {FIVE_GENERATIONS_M6.map((g) => {
              const active = g.gen === selectedGen;
              return (
                <button
                  key={g.gen}
                  type="button"
                  onClick={() => setSelectedGen(g.gen)}
                  className={`rounded-xl px-3 py-2.5 text-left transition-all press-feedback ${
                    active
                      ? 'bg-[#2563EB]/25 border border-[#38BDF8]/55'
                      : 'bg-[#0B0E14] border border-white/[0.08] hover:border-white/25'
                  }`}
                >
                  <p className={`font-mono text-xs font-bold ${active ? 'text-[#38BDF8]' : 'text-[#94A3B8]'}`}>
                    GEN {g.gen}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-[#F3F4F6]">{g.coreTech}</p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-[#64748B]">{g.yearsPdf}</p>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl bg-[#0B0E14] p-5 border border-white/[0.06] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-base font-semibold text-[#F8FAFC]">
                Generasi {activeGen.gen}: {activeGen.coreTech}
              </p>
              <span className="font-mono text-xs font-semibold text-[#F59E0B]">{activeGen.yearsPdf}</span>
            </div>
            <p className="text-xs text-[#38BDF8]">
              Mesin &amp; Contoh Kunci: <span className="text-[#E2E8F0]">{activeGen.machines}</span>
            </p>
            <ul className="space-y-1.5 text-xs leading-relaxed text-[#CBD5E1]">
              {activeGen.traits.map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#38BDF8] shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <p className="rounded-lg bg-[#2563EB]/10 px-3 py-2 text-xs text-[#BAE6FD] border border-[#38BDF8]/25">
              {activeGen.modernNote}
            </p>
          </div>
        </div>

        {/* Mini-Quiz Tebak Generasi & Ciri Komputer Instan */}
        <div className="workbench-card rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-base font-semibold text-[#F3F4F6]">
                Mini-Quiz Instan: Tebak Generasi &amp; Ciri Komputer
              </h4>
              <p className="text-xs text-[#9CA3AF]">Uji hafalan cepat ciri kunci Generasi 1 hingga Generasi 5.</p>
            </div>
            <span className="font-mono text-xs font-semibold text-[#34D399] tabular-nums">
              Skor: {quizScore} / {GENERATION_QUIZ_ITEMS_M6.length}
            </span>
          </div>

          {quizFinished ? (
            <div className="rounded-xl bg-[#0B0E14] p-5 border border-[#10B981]/30 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#34D399]">
                  Mini-Quiz Selesai! Skor Kamu: {quizScore} dari {GENERATION_QUIZ_ITEMS_M6.length}
                </p>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  Lanjutkan ke Contoh Soal Instan di bawah atau ulangi untuk mempertajam ingatan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQuizIndex(0);
                  setPickedOption(null);
                  setQuizScore(0);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#141E33] px-3.5 py-2 text-xs font-medium text-[#F8FAFC] border border-white/10 hover:border-[#38BDF8]/50"
              >
                <ArrowCounterClockwise size={14} />
                Ulangi Mini-Quiz
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-[#0B0E14] p-5 border border-white/[0.06] space-y-4">
              <p className="font-mono text-[11px] text-[#38BDF8] tabular-nums">
                CLUE {quizIndex + 1} / {GENERATION_QUIZ_ITEMS_M6.length}
              </p>
              <p className="text-sm font-medium leading-relaxed text-[#F8FAFC]">{currentQuiz.clue}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {currentQuiz.options.map((opt, idx) => {
                  const answered = pickedOption !== null;
                  const isCorrect = idx === currentQuiz.correctIndex;
                  const isPicked = idx === pickedOption;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={answered}
                      onClick={() => {
                        setPickedOption(idx);
                        if (idx === currentQuiz.correctIndex) {
                          setQuizScore((s) => s + 1);
                        }
                      }}
                      className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 text-left text-xs font-medium border transition-colors ${
                        answered && isCorrect
                          ? 'bg-[#10B981]/15 border-[#10B981]/50 text-[#34D399]'
                          : answered && isPicked
                            ? 'bg-[#F43F5E]/15 border-[#F43F5E]/50 text-[#FDA4AF]'
                            : 'bg-[#11192C] border-white/[0.08] text-[#E2E8F0] hover:border-[#38BDF8]/45'
                      }`}
                    >
                      <span>{opt}</span>
                      {answered && isCorrect && <CheckCircle size={15} weight="fill" />}
                      {answered && isPicked && !isCorrect && <XCircle size={15} weight="fill" />}
                    </button>
                  );
                })}
              </div>

              {pickedOption !== null && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/[0.06]">
                  <p className="text-xs text-[#CBD5E1]">{currentQuiz.explanation}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuizIndex((i) => i + 1);
                      setPickedOption(null);
                    }}
                    className="sapphire-btn rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white whitespace-nowrap press-feedback"
                  >
                    {quizIndex + 1 < GENERATION_QUIZ_ITEMS_M6.length ? 'Clue Berikutnya' : 'Lihat Skor'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- KLASTER S3: Definisi Pakar, 3 Elemen Sistem, Matriks Klasifikasi & 4 Era Software ---
  const activeElement =
    SYSTEM_ELEMENTS_M6.find((el) => el.id === activeElementId) ?? SYSTEM_ELEMENTS_M6[0];

  return (
    <div className="space-y-6">
      {/* Expert Definitions + 3 System Elements */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="workbench-card rounded-xl p-6 lg:col-span-7 space-y-4">
          <div>
            <h4 className="text-base font-semibold text-[#F3F4F6]">
              Perbandingan Definisi Komputer Menurut 3 Pakar (Computare)
            </h4>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              Asal kata Latin <em className="text-[#38BDF8]">computare</em> (menghitung) dalam rumusan Hamacher, Blissmer &amp; Fuori.
            </p>
          </div>
          <div className="space-y-2.5">
            {EXPERT_DEFINITIONS_M6.map((item) => (
              <div key={item.expert} className="rounded-xl bg-[#0B0E14] p-4 border border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-[#F8FAFC]">{item.expert}</span>
                  <span className="font-mono text-[11px] text-[#38BDF8]">{item.focus}</span>
                </div>
                <p className="text-xs leading-relaxed text-[#CBD5E1]">{item.definition}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="workbench-card rounded-xl p-6 lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-[#F59E0B]" />
            <h4 className="text-base font-semibold text-[#F3F4F6]">Diagram 3 Elemen Sistem Komputer</h4>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {SYSTEM_ELEMENTS_M6.map((el) => (
              <button
                key={el.id}
                type="button"
                onClick={() => setActiveElementId(el.id)}
                className={`rounded-xl px-2.5 py-2.5 text-center text-xs font-semibold border transition-colors press-feedback ${
                  activeElementId === el.id
                    ? 'bg-[#F59E0B]/15 border-[#F59E0B]/50 text-[#FCD34D]'
                    : 'bg-[#0B0E14] border-white/[0.08] text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {el.id === 'hardware' ? 'Hardware' : el.id === 'software' ? 'Software' : 'Brainware'}
              </button>
            ))}
          </div>
          <div className="rounded-xl bg-[#0B0E14] p-4 border border-white/[0.06] space-y-2 text-xs">
            <p className="text-sm font-semibold text-[#F8FAFC]">{activeElement.name}</p>
            <p className="leading-relaxed text-[#CBD5E1]">{activeElement.role}</p>
            <p className="pt-1 text-[#FDE68A]">Ketergantungan: {activeElement.dependency}</p>
          </div>
        </div>
      </div>

      {/* Classification Matrix (Data / Purpose / Physical) */}
      <div className="workbench-card rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-semibold text-[#F3F4F6]">Matriks Klasifikasi Komputer (Modul 6)</h4>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              Catatan penting: ukuran fisik komputer tidak menentukan kemampuannya!
            </p>
          </div>
          <div className="inline-flex rounded-lg bg-[#0B0E14] p-1 border border-white/[0.08]">
            {(
              [
                { id: 'byData', label: 'Data Olahan' },
                { id: 'byPurpose', label: 'Tujuan Penggunaan' },
                { id: 'bySize', label: 'Bentuk Fisik' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setClassTab(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap press-feedback ${
                  classTab === tab.id ? 'bg-[#2563EB]/25 text-[#38BDF8]' : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {CLASSIFICATION_DATA_M6[classTab].map((row) => (
            <div key={row.name} className="rounded-xl bg-[#0B0E14] p-4 border border-white/[0.06] space-y-1.5">
              <p className="text-sm font-semibold text-[#38BDF8]">{row.name}</p>
              <p className="text-xs leading-relaxed text-[#CBD5E1]">{row.desc}</p>
              {'example' in row && row.example && (
                <p className="pt-1 text-[11px] text-[#34D399]">Contoh: {row.example}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4 Software Eras */}
      <div className="workbench-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ClockCounterClockwise size={18} className="text-[#A855F7]" />
          <h4 className="text-base font-semibold text-[#F3F4F6]">
            Timeline 4 Era Perkembangan Perangkat Lunak (Software)
          </h4>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {FOUR_SOFTWARE_ERAS_M6.map((era) => (
            <div key={era.era} className="rounded-xl bg-[#0B0E14] p-4 border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between gap-1 text-xs">
                <span className="font-semibold text-[#F8FAFC]">{era.era}</span>
                <span className="font-mono text-[11px] text-[#A855F7]">{era.period}</span>
              </div>
              <p className="text-xs leading-relaxed text-[#CBD5E1]">{era.summary}</p>
              <ul className="space-y-1 pt-1 text-[11px] text-[#94A3B8]">
                {era.traits.map((tr) => (
                  <li key={tr}>• {tr}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
