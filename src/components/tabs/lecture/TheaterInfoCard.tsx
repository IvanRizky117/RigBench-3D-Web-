import {
  CheckCircle,
  ClockCounterClockwise,
  Cpu,
  FlowArrow,
  HardDrives,
  Lightbulb,
  Lightning,
  ShieldWarning,
  SlidersHorizontal,
  TerminalWindow,
  Wrench,
  X,
} from '@phosphor-icons/react';
import type { DirectorKeyframe, TheaterCardVariant } from '../../../data/theaterDirectorTimeline';
import { TheaterCardMicroVisual } from './TheaterCardMicroVisual';

export type InfoCardPlacement = 'sidebar' | 'fullscreen-corner' | 'mobile-below';

interface TheaterInfoCardProps {
  keyframe: DirectorKeyframe;
  activeIndex: number;
  totalKeyframes: number;
  placement: InfoCardPlacement;
  onDismissInFullscreen?: () => void;
}

const VARIANT_META: Record<
  TheaterCardVariant,
  { label: string; tintBg: string; icon: typeof Cpu }
> = {
  'ipo-flow': {
    label: 'ALUR DATA IPO-S',
    tintBg: 'linear-gradient(165deg, rgba(14,32,58,0.96) 0%, rgba(7,13,25,0.98) 100%)',
    icon: FlowArrow,
  },
  'hardware-anatomy': {
    label: 'ANATOMI MAINBOARD',
    tintBg: 'linear-gradient(165deg, rgba(11,26,48,0.96) 0%, rgba(6,11,22,0.98) 100%)',
    icon: Cpu,
  },
  'memory-cpu': {
    label: 'MEMORI & PROSESOR',
    tintBg: 'linear-gradient(165deg, rgba(24,18,52,0.96) 0%, rgba(7,11,24,0.98) 100%)',
    icon: Cpu,
  },
  'power-storage': {
    label: 'DAYA & PENYIMPANAN',
    tintBg: 'linear-gradient(165deg, rgba(10,33,31,0.96) 0%, rgba(6,12,22,0.98) 100%)',
    icon: HardDrives,
  },
  'os-pipeline': {
    label: 'INSTALASI OS',
    tintBg: 'linear-gradient(165deg, rgba(13,28,50,0.96) 0%, rgba(6,11,22,0.98) 100%)',
    icon: TerminalWindow,
  },
  'troubleshoot-meter': {
    label: 'DIAGNOSTIK KASUS',
    tintBg: 'linear-gradient(165deg, rgba(42,14,24,0.96) 0%, rgba(9,11,20,0.98) 100%)',
    icon: Wrench,
  },
  electronics: {
    label: 'PENGUKURAN AVO',
    tintBg: 'linear-gradient(165deg, rgba(36,24,10,0.96) 0%, rgba(8,12,21,0.98) 100%)',
    icon: SlidersHorizontal,
  },
  'legal-cyber': {
    label: 'HUKUM & SIBER',
    tintBg: 'linear-gradient(165deg, rgba(38,13,26,0.96) 0%, rgba(7,11,22,0.98) 100%)',
    icon: ShieldWarning,
  },
  'arch-flow': {
    label: 'ARSITEKTUR SISTEM',
    tintBg: 'linear-gradient(165deg, rgba(12,30,58,0.96) 0%, rgba(6,12,24,0.98) 100%)',
    icon: FlowArrow,
  },
  'history-museum': {
    label: 'MUSEUM SEJARAH PC',
    tintBg: 'linear-gradient(165deg, rgba(34,23,12,0.96) 0%, rgba(8,12,24,0.98) 100%)',
    icon: ClockCounterClockwise,
  },
};

export function TheaterInfoCard({
  keyframe,
  activeIndex,
  totalKeyframes,
  placement,
  onDismissInFullscreen,
}: TheaterInfoCardProps) {
  const meta = VARIANT_META[keyframe.cardVariant];
  const Icon =
    keyframe.microKey.startsWith('psu-') ? Lightning : meta.icon;
  const isCorner = placement === 'fullscreen-corner';
  const isSidebar = placement === 'sidebar';

  return (
    <aside
      aria-label={`Kartu informasi ${keyframe.title}`}
      className={
        isSidebar
          ? 'flex h-full w-full flex-col justify-between border-l border-white/[0.08] p-4'
          : isCorner
            ? 'w-[300px] max-w-[calc(100vw-2rem)] rounded-xl border p-3.5 shadow-[0_18px_44px_rgba(0,0,0,0.82)]'
            : 'border-t border-white/[0.08] p-3.5 sm:px-5'
      }
      style={{
        background: meta.tintBg,
        borderColor: isCorner ? `${keyframe.domainColor}40` : undefined,
      }}
    >
      {/* Animated inner container keyed by keyframe.id for crisp 300ms slide+fade */}
      <div
        key={keyframe.id}
        className={`theater-card-enter flex flex-col ${isCorner ? 'gap-2.5' : 'gap-3'}`}
      >
        {/* Top Kicker Row (Unboxed typography, Zero-Pill discipline) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5 text-[10px] font-semibold tracking-wider text-[#94A3B8]">
            <Icon size={13} weight="bold" style={{ color: keyframe.domainColor }} className="shrink-0" />
            <span className="truncate">{meta.label}</span>
            <span className="text-[#475569]" aria-hidden="true">·</span>
            <span className="shrink-0 font-mono font-bold" style={{ color: keyframe.domainColor }}>
              {keyframe.pdfBadge}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <span className="font-mono text-[10px] text-[#64748B] tabular-nums">
              {activeIndex + 1}/{totalKeyframes}
            </span>
            {isCorner && onDismissInFullscreen && (
              <button
                type="button"
                onClick={onDismissInFullscreen}
                aria-label="Sembunyikan kartu info di layar penuh"
                title="Sembunyikan kartu info (sisakan penanda 3D)"
                className="inline-flex h-6 w-6 items-center justify-center rounded text-[#94A3B8] hover:bg-white/10 hover:text-white"
              >
                <X size={13} weight="bold" />
              </button>
            )}
          </div>
        </div>

        {/* Component Title */}
        <h4
          className={`font-semibold leading-snug text-[#F8FAFC] ${
            isCorner ? 'text-[13px]' : 'text-[15px]'
          }`}
        >
          {keyframe.title}
        </h4>

        {/* Category-Specific Micro-Visual */}
        <TheaterCardMicroVisual
          variant={keyframe.cardVariant}
          microKey={keyframe.microKey}
          accentColor={keyframe.domainColor}
          compact={isCorner}
        />

        {/* 1-Sentence Core Function Summary */}
        <p
          className={`leading-relaxed text-[#CBD5E1] ${
            isCorner ? 'text-[11.5px]' : 'text-xs'
          }`}
        >
          {keyframe.functionSummary}
        </p>

        {/* 2 Key Specifications */}
        <ul className="space-y-1.5 border-t border-white/[0.07] pt-2.5">
          {keyframe.keySpecs.map((spec) => (
            <li
              key={spec}
              className="flex items-start gap-1.5 text-[11px] leading-snug text-[#E2E8F0]"
            >
              <CheckCircle
                size={13}
                weight="fill"
                className="mt-0.5 shrink-0"
                style={{ color: keyframe.domainColor }}
              />
              <span>{spec}</span>
            </li>
          ))}
        </ul>

        {/* 1 Exam Tip */}
        <div
          className="flex items-start gap-2 rounded-lg border px-2.5 py-2 text-[11px] leading-snug text-[#FEF3C7]"
          style={{
            borderColor: 'rgba(245, 158, 11, 0.25)',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
          }}
        >
          <Lightbulb size={14} weight="fill" className="mt-0.5 shrink-0 text-[#F59E0B]" />
          <span>{keyframe.examTip}</span>
        </div>
      </div>
    </aside>
  );
}
