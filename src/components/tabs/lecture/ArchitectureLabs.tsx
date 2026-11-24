import { useEffect, useState } from 'react';
import {
  ArrowCounterClockwise,
  CheckCircle,
  Cpu,
  HardDrives,
  Pause,
  Play,
  Printer,
  ShareNetwork,
} from '@phosphor-icons/react';
import {
  COMPUTER_TYPES_M1,
  FUNCTIONAL_UNITS_M1,
  OS_TIMELINE_M1,
  PARALLEL_ARCH_DATA,
  RISC_VS_CISC_DATA,
} from '../../../data/extraCurriculumData';
import type { ClusterId } from '../../../types/rigbench';

interface ArchitectureLabsProps {
  clusterId: ClusterId;
  onNotify: (title: string, description: string, variant?: 'info' | 'success' | 'warning') => void;
}

type PipeMode = 'serial' | 'pipeline' | 'superscalar';
const STAGES = ['FETCH', 'DECODE', 'ALU', 'WRITE'] as const;

function getInstructionStage(mode: PipeMode, instIndex: number, cycle: number): string {
  if (cycle <= 0) return '—';
  const startCycle =
    mode === 'serial'
      ? instIndex * 4 + 1
      : mode === 'pipeline'
        ? instIndex + 1
        : Math.floor(instIndex / 2) + 1;
  const offset = cycle - startCycle;
  if (offset < 0) return 'Antre';
  if (offset >= 4) return 'Selesai';
  return STAGES[offset];
}

export function ArchitectureLabs({ clusterId, onNotify }: ArchitectureLabsProps) {
  // arch-1: Bus Tunggal & Register Buffer Printer Simulator
  const [bufferEnabled, setBufferEnabled] = useState(true);
  const [printRunning, setPrintRunning] = useState(false);
  const [printTick, setPrintTick] = useState(0); // 0..10
  const [activeUnitId, setActiveUnitId] = useState<string>('alu');

  // arch-2: Pipelining vs Serial & Superscalar Stepper
  const [pipeMode, setPipeMode] = useState<PipeMode>('pipeline');
  const [cycle, setCycle] = useState(4);
  const [pipeAuto, setPipeAuto] = useState(false);

  // arch-3: Parallel Architecture focus
  const [parallelFocus, setParallelFocus] = useState<'multiprocessor' | 'multicomputer'>('multiprocessor');

  const maxPipeCycles = pipeMode === 'serial' ? 16 : pipeMode === 'pipeline' ? 7 : 5;

  // Clean timer for Register Buffer Printer Simulator
  useEffect(() => {
    if (!printRunning) return;
    const id = window.setInterval(() => {
      setPrintTick((prev) => {
        if (prev >= 10) {
          setPrintRunning(false);
          return 10;
        }
        return prev + 1;
      });
    }, 350);
    return () => window.clearInterval(id);
  }, [printRunning]);

  // Clean timer for Pipelining Stepper Auto-Play
  useEffect(() => {
    if (!pipeAuto) return;
    const id = window.setInterval(() => {
      setCycle((prev) => {
        if (prev >= maxPipeCycles) {
          setPipeAuto(false);
          return maxPipeCycles;
        }
        return prev + 1;
      });
    }, 650);
    return () => window.clearInterval(id);
  }, [pipeAuto, maxPipeCycles]);

  // --- KLASTER A1: Bus Tunggal & Register Buffer + 5 Unit & 5 Tipe ---
  if (clusterId === 'arch-1') {
    const activeUnit =
      FUNCTIONAL_UNITS_M1.find((u) => u.id === activeUnitId) ?? FUNCTIONAL_UNITS_M1[2];
    const cpuTasksDone = printTick === 0 ? 0 : bufferEnabled ? Math.min(8, printTick) : printTick >= 10 ? 1 : 0;
    const cpuBlocked = printRunning && !bufferEnabled;

    return (
      <div className="space-y-6">
        <div className="workbench-card rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="text-base font-semibold text-[#F3F4F6]">
                Simulasi Bus Tunggal &amp; Register Buffer Printer
              </h4>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">
                Bandingkan status CPU &amp; Bus saat mencetak dokumen dengan Register Buffer aktif vs nonaktif.
              </p>
            </div>
            <div className="inline-flex rounded-lg bg-[#0B0E14] p-1 border border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setBufferEnabled(true);
                  setPrintRunning(false);
                  setPrintTick(0);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap press-feedback ${
                  bufferEnabled ? 'bg-[#10B981]/20 text-[#34D399]' : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                }`}
              >
                Register Buffer: ON
              </button>
              <button
                type="button"
                onClick={() => {
                  setBufferEnabled(false);
                  setPrintRunning(false);
                  setPrintTick(0);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap press-feedback ${
                  !bufferEnabled ? 'bg-[#F43F5E]/20 text-[#FDA4AF]' : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                }`}
              >
                Tanpa Buffer: OFF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-[#0B0E14] p-4 border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[#38BDF8]">CPU &amp; BUS TUNGGAL</span>
                <Cpu size={16} className={cpuBlocked ? 'text-[#F43F5E]' : 'text-[#10B981]'} />
              </div>
              <p className={`text-sm font-semibold ${cpuBlocked ? 'text-[#FDA4AF]' : 'text-[#34D399]'}`}>
                {cpuBlocked
                  ? 'TERSANDERA MENUNGGU PRINTER'
                  : printTick > 0
                    ? 'BEBAS KERJAKAN TUGAS LAIN'
                    : 'SIAP KIRIM DATA'}
              </p>
              <p className="font-mono text-xs text-[#94A3B8] tabular-nums">
                Tugas CPU selesai selama cetak: <strong className="text-[#F8FAFC]">{cpuTasksDone} tugas</strong>
              </p>
            </div>

            <div className="rounded-xl bg-[#0B0E14] p-4 border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[#F59E0B]">REGISTER BUFFER</span>
                <HardDrives size={16} className={bufferEnabled ? 'text-[#F59E0B]' : 'text-[#475569]'} />
              </div>
              <p className="text-sm font-semibold text-[#F8FAFC]">
                {bufferEnabled
                  ? printTick === 0
                    ? 'Siap menampung burst CPU'
                    : printTick < 10
                      ? `Menampung sisa ${100 - printTick * 10}%`
                      : 'Buffer kosong (selesai)'
                  : 'Tidak Digunakan (Bypass)'}
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#1E293B]">
                <div
                  className="h-full rounded-full bg-[#F59E0B] transition-[width] duration-200"
                  style={{ width: bufferEnabled && printTick > 0 ? `${Math.max(0, 100 - printTick * 10)}%` : '0%' }}
                />
              </div>
            </div>

            <div className="rounded-xl bg-[#0B0E14] p-4 border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[#A855F7]">PRINTER (I/O LAMBAT)</span>
                <Printer size={16} className="text-[#A855F7]" />
              </div>
              <p className="font-mono text-sm font-semibold text-[#F8FAFC] tabular-nums">
                Progres Cetak: {printTick * 10}%
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#1E293B]">
                <div
                  className="h-full rounded-full bg-[#A855F7] transition-[width] duration-200"
                  style={{ width: `${printTick * 10}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setPrintTick(1);
                setPrintRunning(true);
                onNotify(
                  bufferEnabled ? 'Transfer Kilat ke Register Buffer' : 'Mode Tanpa Buffer Aktif',
                  bufferEnabled
                    ? 'CPU langsung bebas menjalankan tugas lain sementara printer mencetak dari isi buffer.'
                    : 'CPU dan Bus Tunggal terkunci hingga seluruh proses mekanik printer selesai.',
                  bufferEnabled ? 'success' : 'warning'
                );
              }}
              className="sapphire-btn inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white whitespace-nowrap press-feedback"
            >
              <Play size={14} weight="fill" />
              Kirim Tugas Cetak (Simulasi)
            </button>
            <p className="text-xs text-[#94A3B8]">
              Inti Modul 1: Buffer elektronik menyelaraskan kesenjangan kecepatan antara CPU dan periferal mekanik.
            </p>
          </div>
        </div>

        {/* 5 Functional Units & 5 Computer Types Explorer */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="workbench-card rounded-xl p-6 lg:col-span-7 space-y-4">
            <h4 className="text-base font-semibold text-[#F3F4F6]">Inspektor 5 Unit Fungsional Komputer</h4>
            <div className="flex flex-wrap gap-1.5">
              {FUNCTIONAL_UNITS_M1.map((unit) => (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => setActiveUnitId(unit.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap press-feedback ${
                    activeUnitId === unit.id
                      ? 'bg-[#2563EB]/25 text-[#38BDF8] border border-[#38BDF8]/45'
                      : 'bg-[#0B0E14] text-[#9CA3AF] border border-white/[0.08] hover:text-[#F3F4F6]'
                  }`}
                >
                  {unit.label}
                </button>
              ))}
            </div>
            <div className="rounded-xl bg-[#0B0E14] p-4 border border-white/[0.06] space-y-2">
              <p className="font-mono text-xs text-[#38BDF8]">{activeUnit.speedTier}</p>
              <p className="text-sm font-semibold text-[#F8FAFC]">{activeUnit.label}</p>
              <p className="text-xs leading-relaxed text-[#CBD5E1]">{activeUnit.role}</p>
              <p className="pt-1 text-xs text-[#34D399]">
                <CheckCircle size={13} weight="fill" className="inline mr-1.5" />
                {activeUnit.keyFact}
              </p>
            </div>
          </div>

          <div className="workbench-card rounded-xl p-6 lg:col-span-5 space-y-3">
            <h4 className="text-base font-semibold text-[#F3F4F6]">5 Tipe Komputer (Modul 1)</h4>
            <div className="divide-y divide-white/[0.06]">
              {COMPUTER_TYPES_M1.map((t) => (
                <div key={t.id} className="py-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#F3F4F6]">{t.name}</span>
                    <span className="font-mono text-[11px] text-[#38BDF8]">{t.scale}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#94A3B8] leading-relaxed">{t.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- KLASTER A2: Simulator Pipelining/Superscalar + RISC vs CISC + OS t0–t5 ---
  if (clusterId === 'arch-2') {
    const modeSummary: Record<PipeMode, { title: string; sEffect: string; note: string }> = {
      serial: {
        title: 'Eksekusi Serial (Tanpa Pipeline)',
        sEffect: 'S = 4 siklus/instruksi',
        note: 'Instruksi berikutnya harus menunggu instruksi sebelumnya selesai total (4 instruksi = 16 siklus).',
      },
      pipeline: {
        title: 'Pipelining (Tumpang-Tindih 1 Jalur)',
        sEffect: 'S efektif ≈ 1 siklus',
        note: 'Tahap Fetch, Decode, ALU, dan Writeback berjalan tumpang-tindih sehingga 4 instruksi tuntas di siklus ke-7.',
      },
      superscalar: {
        title: 'Superscalar (2 Jalur Pipeline Paralel)',
        sEffect: 'S efektif < 1 siklus',
        note: 'Dua instruksi masuk berbarengan di tiap siklus sehingga 4 instruksi tuntas hanya dalam 5 siklus!',
      },
    };
    const activeSummary = modeSummary[pipeMode];

    return (
      <div className="space-y-6">
        <div className="workbench-card rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="text-base font-semibold text-[#F3F4F6]">
                Simulator Visual Pipelining vs Serial &amp; Superscalar
              </h4>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">
                Amati bagaimana tumpang-tindih tahap instruksi menurunkan langkah efektif S tanpa perlu hitungan rumit.
              </p>
            </div>
            <div className="inline-flex rounded-lg bg-[#0B0E14] p-1 border border-white/[0.08]">
              {(
                [
                  { id: 'serial', label: 'Serial' },
                  { id: 'pipeline', label: 'Pipelining' },
                  { id: 'superscalar', label: 'Superscalar' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setPipeAuto(false);
                    setPipeMode(m.id);
                    setCycle(m.id === 'serial' ? 5 : m.id === 'pipeline' ? 4 : 3);
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap press-feedback ${
                    pipeMode === m.id
                      ? 'bg-[#2563EB]/25 text-[#38BDF8]'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
            {[0, 1, 2, 3].map((idx) => {
              const stage = getInstructionStage(pipeMode, idx, cycle);
              const isDone = stage === 'Selesai';
              const isActive = STAGES.includes(stage as (typeof STAGES)[number]);
              return (
                <div
                  key={idx}
                  className={`rounded-xl p-3.5 border transition-colors ${
                    isDone
                      ? 'bg-[#10B981]/10 border-[#10B981]/40'
                      : isActive
                        ? 'bg-[#2563EB]/15 border-[#38BDF8]/50'
                        : 'bg-[#0B0E14] border-white/[0.06]'
                  }`}
                >
                  <p className="font-mono text-[11px] text-[#94A3B8]">INSTRUKSI I{idx + 1}</p>
                  <p
                    className={`mt-1 font-mono text-sm font-bold ${
                      isDone ? 'text-[#34D399]' : isActive ? 'text-[#38BDF8]' : 'text-[#64748B]'
                    }`}
                  >
                    {stage}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#0B0E14] px-4 py-3 border border-white/[0.06]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (cycle >= maxPipeCycles) setCycle(1);
                  setPipeAuto((v) => !v);
                }}
                className="sapphire-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white whitespace-nowrap press-feedback"
              >
                {pipeAuto ? <Pause size={13} weight="fill" /> : <Play size={13} weight="fill" />}
                {pipeAuto ? 'Jeda' : 'Putar Siklus'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPipeAuto(false);
                  setCycle((c) => (c >= maxPipeCycles ? 1 : c + 1));
                }}
                className="rounded-lg bg-[#141E33] px-3 py-1.5 text-xs text-[#E2E8F0] border border-white/10 hover:border-[#38BDF8]/50 whitespace-nowrap"
              >
                +1 Siklus
              </button>
              <button
                type="button"
                onClick={() => {
                  setPipeAuto(false);
                  setCycle(1);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-[#0A1324] px-2.5 py-1.5 text-xs text-[#94A3B8] border border-white/10 hover:text-white"
              >
                <ArrowCounterClockwise size={13} />
                Reset
              </button>
            </div>
            <div className="text-right text-xs">
              <span className="font-mono font-bold text-[#38BDF8] tabular-nums">
                Siklus {cycle} / {maxPipeCycles}
              </span>
              <span className="mx-2 text-[#475569]">·</span>
              <span className="font-mono font-semibold text-[#34D399]">{activeSummary.sEffect}</span>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-[#CBD5E1]">
            <strong className="text-[#F8FAFC]">{activeSummary.title}:</strong> {activeSummary.note}
          </p>
        </div>

        {/* RISC vs CISC + OS t0-t5 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="workbench-card rounded-xl p-6 lg:col-span-6 space-y-4">
            <h4 className="text-base font-semibold text-[#F3F4F6]">Komparasi Arsitektur RISC vs CISC</h4>
            <div className="divide-y divide-white/[0.06]">
              {RISC_VS_CISC_DATA.map((row) => (
                <div key={row.aspect} className="py-3 space-y-1.5 text-xs">
                  <p className="font-semibold text-[#F8FAFC]">{row.aspect}</p>
                  <p className="text-[#CBD5E1]">
                    <span className="font-mono font-semibold text-[#38BDF8]">RISC:</span> {row.risc}
                  </p>
                  <p className="text-[#94A3B8]">
                    <span className="font-mono font-semibold text-[#F59E0B]">CISC:</span> {row.cisc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="workbench-card rounded-xl p-6 lg:col-span-6 space-y-4">
            <h4 className="text-base font-semibold text-[#F3F4F6]">
              Alur Sharing Waktu OS (t0–t5) &amp; Multiprogramming
            </h4>
            <div className="space-y-2">
              {OS_TIMELINE_M1.map((item) => (
                <div key={item.slot} className="rounded-lg bg-[#0B0E14] px-3.5 py-2.5 border border-white/[0.06] text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-[#38BDF8]">{item.slot}</span>
                    <span className="font-medium text-[#F59E0B]">{item.actor}</span>
                  </div>
                  <p className="mt-1 text-[#CBD5E1] leading-relaxed">{item.activity}</p>
                  <p className="mt-1 text-[11px] text-[#34D399]">{item.multiBenefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- KLASTER A3: Multiprosesor (Shared-Memory) vs Multikomputer (Message-Passing) ---
  const activeParallel = PARALLEL_ARCH_DATA[parallelFocus];

  return (
    <div className="workbench-card rounded-xl p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-[#F3F4F6]">
            Komparator Komputasi Paralel: Shared-Memory vs Message-Passing
          </h4>
          <p className="mt-0.5 text-xs text-[#9CA3AF]">
            Pilih arsitektur paralel untuk membandingkan pola akses memori, interkoneksi, dan trade-off biaya.
          </p>
        </div>
        <div className="inline-flex rounded-lg bg-[#0B0E14] p-1 border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setParallelFocus('multiprocessor')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap press-feedback ${
              parallelFocus === 'multiprocessor'
                ? 'bg-[#10B981]/20 text-[#34D399]'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            Multiprosesor (Shared-Memory)
          </button>
          <button
            type="button"
            onClick={() => setParallelFocus('multicomputer')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap press-feedback ${
              parallelFocus === 'multicomputer'
                ? 'bg-[#F59E0B]/20 text-[#FCD34D]'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            Multikomputer (Message-Passing)
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-[#0B0E14] p-5 border border-white/[0.06] space-y-3">
        <div className="flex items-center gap-2">
          <ShareNetwork
            size={18}
            weight="duotone"
            className={parallelFocus === 'multiprocessor' ? 'text-[#34D399]' : 'text-[#F59E0B]'}
          />
          <div>
            <p className="text-sm font-semibold text-[#F8FAFC]">{activeParallel.title}</p>
            <p className="font-mono text-[11px] text-[#38BDF8]">{activeParallel.tagline}</p>
          </div>
        </div>
        <p className="text-xs sm:text-sm leading-relaxed text-[#CBD5E1]">{activeParallel.mechanism}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1 text-xs">
          <div className="rounded-lg bg-[#10B981]/10 px-3.5 py-2.5 border border-[#10B981]/25">
            <p className="font-mono text-[11px] font-semibold text-[#34D399]">KEUNGGULAN</p>
            <p className="mt-1 text-[#E2E8F0]">{activeParallel.strength}</p>
          </div>
          <div className="rounded-lg bg-[#F59E0B]/10 px-3.5 py-2.5 border border-[#F59E0B]/25">
            <p className="font-mono text-[11px] font-semibold text-[#F59E0B]">TANTANGAN / TRADE-OFF</p>
            <p className="mt-1 text-[#FDE68A]">{activeParallel.tradeoff}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
