import { useState } from 'react';
import {
  ArrowRight,
  Circuitry,
  Lightning,
  ShieldCheck,
  Trash,
  Warning,
} from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { CURRICULUM_CLUSTERS } from '../../../data/curriculumData';
import { MAINBOARD_COMPONENTS } from '../../../data/mainboardData';
import type { ClusterId, TabId, UserProgressStore } from '../../../types/rigbench';
import { LazyMiniMotherboard } from './LazyMiniMotherboard';

interface HomeBentoGridProps {
  progress: UserProgressStore;
  onNavigateTab: (tab: TabId) => void;
  onOpenCluster: (clusterId: ClusterId) => void;
  onResetProgress: () => void;
}

const IPO_STEPS = [
  { id: 'input', label: '01 Input', detail: 'Keyboard, Mouse & Scanner mengirim sinyal data.' },
  { id: 'process', label: '02 Process', detail: 'CPU & RAM mengolah instruksi via jalur Northbridge.' },
  { id: 'output', label: '03 Output', detail: 'Monitor & Speaker menyajikan hasil pemrosesan.' },
  { id: 'storage', label: '04 Storage', detail: 'HDD/SSD menyimpan data permanen di partisi NTFS.' },
] as const;

const SNAPPY_EASE = [0.22, 1, 0.36, 1] as const;
const TACTILE_SPRING = { type: 'spring' as const, stiffness: 380, damping: 30 };

const gridContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardRevealVariants: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: SNAPPY_EASE },
  },
};

export function HomeBentoGrid({
  progress,
  onNavigateTab,
  onOpenCluster,
  onResetProgress,
}: HomeBentoGridProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const [activeIpoIdx, setActiveIpoIdx] = useState(1);
  const [activeUtilityView, setActiveUtilityView] = useState<'psu' | 'rubric'>('rubric');
  const [confirmingReset, setConfirmingReset] = useState(false);

  const completedCount = progress.completedClusters.length;
  const inspectedCount = progress.inspectedComponents.length;
  const bestScore =
    progress.examHistory.length > 0
      ? Math.max(...progress.examHistory.map((h) => h.totalScore))
      : null;

  const readiness = Math.round(
    (completedCount / CURRICULUM_CLUSTERS.length) * 55 +
      (Math.min(inspectedCount, MAINBOARD_COMPONENTS.length) / MAINBOARD_COMPONENTS.length) * 30 +
      (progress.assemblyCompleted ? 15 : 0)
  );

  // Radial gauge stroke math (radius = 44 -> circumference ~ 276.46)
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const gaugeOffset = circumference - (readiness / 100) * circumference;

  const hoverProps = reducedMotion
    ? {}
    : {
        whileHover: { y: -4 },
        whileTap: { scale: 0.99 },
        transition: TACTILE_SPRING,
      };

  return (
    <section
      aria-label="Ringkasan Visual RigBench"
      className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"
    >
      <motion.div
        variants={reducedMotion ? undefined : gridContainerVariants}
        initial={reducedMotion ? false : 'hidden'}
        whileInView="visible"
        viewport={{ once: true, amount: 0.14 }}
        className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:grid-flow-dense"
      >
        {/* CARD 1 (Left Top): Interactive IPO Computing Pipeline */}
        <motion.div
          variants={reducedMotion ? undefined : cardRevealVariants}
          {...hoverProps}
          className="datacore-card datacore-card-interactive rounded-2xl p-5 lg:col-span-4 flex flex-col justify-between gap-4 will-change-transform"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#F8FAFC]">Alur Siklus Komputasi</h2>
            <button
              type="button"
              onClick={() => onOpenCluster('cluster-1')}
              className="text-xs font-medium text-[#38BDF8] hover:text-[#7DD3FC] whitespace-nowrap"
            >
              Klaster 01
            </button>
          </div>

          <div className="space-y-1.5">
            {IPO_STEPS.map((step, idx) => {
              const active = idx === activeIpoIdx;
              return (
                <motion.button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveIpoIdx(idx)}
                  whileTap={reducedMotion ? undefined : { scale: 0.985 }}
                  className={`relative flex w-full items-center justify-between overflow-hidden rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                    active
                      ? 'text-[#F8FAFC]'
                      : 'bg-[#030712]/80 text-[#94A3B8] border border-[#3B82F6]/12 hover:border-[#3B82F6]/35 hover:text-[#F8FAFC]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="ipoActiveHighlight"
                      transition={TACTILE_SPRING}
                      className="absolute inset-0 rounded-xl border border-[#38BDF8]/45 bg-[#2563EB]/25 shadow-[0_0_18px_rgba(37,99,235,0.28)]"
                    />
                  )}
                  <span className="relative z-10 font-mono font-semibold">{step.label}</span>
                  <span
                    className={`relative z-10 text-[11px] ${
                      active ? 'text-[#38BDF8]' : 'text-[#64748B]'
                    }`}
                  >
                    {active ? 'Aktif' : 'Lihat'}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <div className="min-h-[34px]">
            <AnimatePresence mode="wait">
              <motion.p
                key={IPO_STEPS[activeIpoIdx].id}
                initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: SNAPPY_EASE }}
                className="text-xs leading-relaxed text-[#94A3B8]"
              >
                {IPO_STEPS[activeIpoIdx].detail}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* CARD 2 (Center Dominant): Live Interactive 3D Motherboard Preview inside DataCore Card */}
        <motion.div
          variants={reducedMotion ? undefined : cardRevealVariants}
          whileHover={reducedMotion ? undefined : { y: -4 }}
          transition={TACTILE_SPRING}
          className="lg:col-span-5 lg:row-span-2 will-change-transform"
        >
          <LazyMiniMotherboard onOpenFullLab={() => onNavigateTab('lab3d')} />
        </motion.div>

        {/* CARD 3 (Right Top): Chipset Architecture & Curriculum Metrics */}
        <motion.div
          variants={reducedMotion ? undefined : cardRevealVariants}
          {...hoverProps}
          className="datacore-card datacore-card-interactive rounded-2xl p-5 lg:col-span-3 flex flex-col justify-between gap-4 will-change-transform"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F8FAFC]">Arsitektur Bus</h2>
            <Circuitry size={16} weight="duotone" className="text-[#38BDF8]" />
          </div>

          <div className="space-y-2.5">
            <div className="rounded-xl border border-[#38BDF8]/25 bg-[#030815]/90 px-3 py-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono font-semibold text-[#38BDF8]">NORTHBRIDGE</span>
                <span className="font-mono text-[#94A3B8]">8.5 GB/s</span>
              </div>
              <p className="mt-0.5 text-[11px] text-[#94A3B8]">CPU · RAM DDR2 · PCIe x16</p>
            </div>

            <div className="mx-auto h-3 w-px bg-gradient-to-b from-[#38BDF8] to-[#F59E0B]" />

            <div className="rounded-xl border border-[#F59E0B]/25 bg-[#030815]/90 px-3 py-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono font-semibold text-[#F59E0B]">SOUTHBRIDGE</span>
                <span className="font-mono text-[#94A3B8]">I/O Hub</span>
              </div>
              <p className="mt-0.5 text-[11px] text-[#94A3B8]">SATA · IDE · USB · BIOS</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-[#3B82F6]/15 pt-3 text-center">
            <div>
              <p className="font-mono text-sm font-semibold text-[#F8FAFC] tabular-nums">7</p>
              <p className="text-[10px] text-[#94A3B8]">Klaster</p>
            </div>
            <div>
              <p className="font-mono text-sm font-semibold text-[#38BDF8] tabular-nums">24</p>
              <p className="text-[10px] text-[#94A3B8]">Titik 3D</p>
            </div>
            <div>
              <p className="font-mono text-sm font-semibold text-[#F8FAFC] tabular-nums">70%</p>
              <p className="text-[10px] text-[#94A3B8]">Essay</p>
            </div>
          </div>
        </motion.div>

        {/* CARD 4 (Left Bottom): Readiness Score Radial Gauge */}
        <motion.div
          variants={reducedMotion ? undefined : cardRevealVariants}
          {...hoverProps}
          className="datacore-card datacore-card-interactive rounded-2xl p-5 lg:col-span-4 flex flex-col justify-between gap-3 will-change-transform"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F8FAFC]">Kesiapan Uji Pemahaman</h2>
            {!confirmingReset ? (
              <button
                type="button"
                onClick={() => setConfirmingReset(true)}
                title="Reset progres lokal"
                className="inline-flex items-center gap-1 text-[11px] text-[#64748B] hover:text-[#F43F5E] transition-colors"
              >
                <Trash size={13} />
                Reset
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px]">
                <Warning size={13} weight="fill" className="text-[#F43F5E]" />
                <button
                  type="button"
                  onClick={() => {
                    onResetProgress();
                    setConfirmingReset(false);
                  }}
                  className="font-semibold text-[#F43F5E] hover:underline"
                >
                  Hapus
                </button>
                <span className="text-[#475569]">/</span>
                <button
                  type="button"
                  onClick={() => setConfirmingReset(false)}
                  className="text-[#94A3B8] hover:text-[#F8FAFC]"
                >
                  Batal
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-5">
            <div className="relative h-24 w-24 shrink-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="rgba(59, 130, 246, 0.14)"
                  strokeWidth="6"
                  strokeDasharray="3 3"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="url(#readinessGrad)"
                  strokeWidth="6.5"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={
                    reducedMotion
                      ? { strokeDashoffset: gaugeOffset }
                      : { strokeDashoffset: circumference }
                  }
                  whileInView={{ strokeDashoffset: gaugeOffset }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.85, ease: SNAPPY_EASE }}
                />
                <defs>
                  <linearGradient id="readinessGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#38BDF8" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-2xl font-semibold text-[#F8FAFC] tabular-nums">
                  {readiness}%
                </span>
                <span className="text-[10px] text-[#64748B]">Progres</span>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">Klaster Materi</span>
                <span className="font-mono font-semibold text-[#F8FAFC] tabular-nums">
                  {completedCount}/{CURRICULUM_CLUSTERS.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">Inspeksi 3D</span>
                <span className="font-mono font-semibold text-[#38BDF8] tabular-nums">
                  {inspectedCount}/{MAINBOARD_COMPONENTS.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">Try Out Terbaik</span>
                <span className="font-mono font-semibold text-[#10B981] tabular-nums">
                  {bestScore !== null ? `${bestScore}/100` : '—'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CARD 5 (Right Bottom): Interactive Rubric Shield & PSU Pinout Quick Card */}
        <motion.div
          variants={reducedMotion ? undefined : cardRevealVariants}
          {...hoverProps}
          className="datacore-card datacore-card-interactive rounded-2xl p-5 lg:col-span-3 flex flex-col justify-between gap-3 will-change-transform"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#F8FAFC]">
              {activeUtilityView === 'rubric' ? 'Rubric Auto-Scoring' : 'Pinout Jumper PSU'}
            </h2>
            <div className="inline-flex rounded-lg border border-[#3B82F6]/20 bg-[#030815] p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => setActiveUtilityView('rubric')}
                className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
                  activeUtilityView === 'rubric'
                    ? 'bg-[#2563EB] text-white'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                Rubric
              </button>
              <button
                type="button"
                onClick={() => setActiveUtilityView('psu')}
                className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
                  activeUtilityView === 'psu'
                    ? 'bg-[#2563EB] text-white'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                PSU
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeUtilityView === 'rubric' ? (
              <motion.div
                key="rubric-panel"
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: SNAPPY_EASE }}
                className="flex flex-col items-center py-1 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#38BDF8]/30 bg-[#2563EB]/20 text-[#38BDF8] shadow-[0_0_24px_rgba(37,99,235,0.35)]">
                  <ShieldCheck size={26} weight="duotone" />
                </div>
                <p className="mt-2.5 text-xs text-[#94A3B8]">
                  Koreksi otomatis 14 Essay &amp; 15 ABC langsung di browser.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="psu-panel"
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: SNAPPY_EASE }}
                className="space-y-1.5 py-1 text-xs"
              >
                <div className="flex items-center justify-between rounded-lg border border-[#10B981]/30 bg-[#030815] px-2.5 py-1.5">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[#10B981]">
                    <Lightning size={13} weight="fill" />
                    Pin 16 (Hijau)
                  </span>
                  <span className="font-mono text-[10px] text-[#94A3B8]">PS_ON</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#3B82F6]/20 bg-[#030815] px-2.5 py-1.5">
                  <span className="font-mono text-[#E2E8F0]">Pin 15/17 (Hitam)</span>
                  <span className="font-mono text-[10px] text-[#94A3B8]">GND</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() =>
              activeUtilityView === 'rubric' ? onNavigateTab('exam') : onOpenCluster('cluster-3')
            }
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#3B82F6]/25 bg-[#040A18] py-2 text-xs font-medium text-[#38BDF8] hover:border-[#38BDF8]/50 hover:text-[#7DD3FC] press-feedback"
          >
            {activeUtilityView === 'rubric' ? 'Mulai Try Out' : 'Pelajari SMPS PSU'}
            <ArrowRight size={13} weight="bold" />
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
