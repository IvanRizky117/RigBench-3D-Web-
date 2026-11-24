import { ArrowClockwise, X } from '@phosphor-icons/react';
import type { AssemblyStepId } from '../../../types/rigbench';

export interface RotateToolMeta {
  show: boolean;
  aligned: boolean;
  actionLabel: string;
  alignedLabel: string;
  angleBadge: string;
  gestureHint: string;
}

export function getRotateToolMeta(
  activeHeldId: AssemblyStepId | null,
  rotationStep: number
): RotateToolMeta {
  if (!activeHeldId) {
    return {
      show: false,
      aligned: true,
      actionLabel: '',
      alignedLabel: '',
      angleBadge: '',
      gestureHint: '',
    };
  }
  if (activeHeldId === 'install-cpu') {
    const deg = (rotationStep % 4) * 90;
    return {
      show: true,
      aligned: rotationStep % 4 === 0,
      actionLabel: 'Putar CPU',
      alignedLabel: 'Pin-1 Sejajar',
      angleBadge: `${deg}°`,
      gestureHint: 'Sejajarkan segitiga emas',
    };
  }
  if (activeHeldId === 'install-ram-1' || activeHeldId === 'install-ram-2') {
    const normStep = ((rotationStep % 4) + 4) % 4;
    const deg = normStep * 90;
    return {
      show: true,
      aligned: normStep === 0,
      actionLabel: normStep === 2 ? 'Notch Terbalik' : 'Putar RAM',
      alignedLabel: 'Notch Sejajar',
      angleBadge: `${deg}°`,
      gestureHint: normStep === 2 ? 'Notch terbalik 180° — putar lagi' : 'Sejajarkan celah notch',
    };
  }
  if (activeHeldId === 'install-ide-cable') {
    const aligned = rotationStep % 2 === 0;
    return {
      show: true,
      aligned,
      actionLabel: 'Balik Pin-1 IDE',
      alignedLabel: 'Merah Pin-1 OK',
      angleBadge: aligned ? 'Pin-1' : 'Terbalik',
      gestureHint: 'Garis merah ke Pin-1',
    };
  }
  if (
    activeHeldId === 'wire-hdd-led' ||
    activeHeldId === 'wire-pled-pos' ||
    activeHeldId === 'wire-pled-neg'
  ) {
    const aligned = rotationStep % 2 === 0;
    return {
      show: true,
      aligned,
      actionLabel: 'Balik Polaritas',
      alignedLabel: 'Polaritas (+) OK',
      angleBadge: aligned ? '+ / -' : '- / +',
      gestureHint: 'Pastikan kutub (+) benar',
    };
  }
  if (activeHeldId === 'install-atx-24pin') {
    const aligned = rotationStep % 2 === 0;
    return {
      show: true,
      aligned,
      actionLabel: 'Balik Klip ATX',
      alignedLabel: 'Klip ATX 24P OK',
      angleBadge: aligned ? 'Klip' : 'Terbalik',
      gestureHint: 'Sejajarkan klip pengunci ke kait soket',
    };
  }
  if (activeHeldId === 'install-atx-4pin') {
    const aligned = rotationStep % 2 === 0;
    return {
      show: true,
      aligned,
      actionLabel: 'Balik Klip 4-Pin',
      alignedLabel: 'Klip 4-Pin OK',
      angleBadge: aligned ? 'Klip' : 'Terbalik',
      gestureHint: 'Sejajarkan klip pengunci ATX 12V',
    };
  }
  if (activeHeldId === 'install-hdd-molex') {
    const aligned = rotationStep % 2 === 0;
    return {
      show: true,
      aligned,
      actionLabel: 'Balik Bevel Molex',
      alignedLabel: 'Bevel D-Shape OK',
      angleBadge: aligned ? 'Atas' : 'Terbalik',
      gestureHint: 'Sisi miring D-Shape menghadap atas',
    };
  }
  return {
    show: false,
    aligned: true,
    actionLabel: '',
    alignedLabel: '',
    angleBadge: '',
    gestureHint: '',
  };
}

interface TouchRotateFloatingPillProps {
  activeHeldId: AssemblyStepId | null;
  rotationStep: number;
  isFreeRoam: boolean;
  allPartsInstalled: boolean;
  isDragging: boolean;
  isTouchInput: boolean;
  dockHeightPx: number;
  onRotatePart: () => void;
  onCancelDrag: () => void;
}

export function TouchRotateFloatingPill({
  activeHeldId,
  rotationStep,
  isFreeRoam,
  allPartsInstalled,
  isDragging,
  isTouchInput,
  dockHeightPx,
  onRotatePart,
  onCancelDrag,
}: TouchRotateFloatingPillProps) {
  const meta = getRotateToolMeta(activeHeldId, rotationStep);
  const showRotate = meta.show && (isFreeRoam || !allPartsInstalled);

  if (!showRotate && !isDragging) return null;

  const bottomPx = Math.max(120, dockHeightPx) + 18;

  return (
    <div
      style={{
        bottom: `calc(${bottomPx}px + env(safe-area-inset-bottom, 0px))`,
      }}
      className="pointer-events-none fixed right-2.5 sm:right-3 z-40 flex flex-col items-end gap-2"
    >
      {showRotate && (
        <button
          type="button"
          data-rotate-pill="true"
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onRotatePart();
          }}
          aria-label={meta.aligned ? meta.alignedLabel : meta.actionLabel}
          className={`pointer-events-auto flex min-h-[46px] items-center gap-2 rounded-2xl border px-3 py-2 shadow-[0_12px_30px_rgba(2,5,12,0.75)] transition-colors active:scale-95 ${
            meta.aligned
              ? 'border-[#10B981]/65 bg-[#061A17]/95 text-[#34D399]'
              : 'border-[#F59E0B]/75 bg-[#1B1306]/95 text-[#FDE68A]'
          }`}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
              meta.aligned
                ? 'bg-[#10B981]/20 text-[#34D399]'
                : 'bg-[#F59E0B]/20 text-[#FBBF24]'
            }`}
          >
            <ArrowClockwise size={16} weight="bold" />
          </span>
          <div className="flex flex-col items-start leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold">
                {meta.aligned ? meta.alignedLabel : meta.actionLabel}
              </span>
              <span className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[9px] font-bold">
                {meta.angleBadge}
              </span>
            </div>
            <span className="text-[9px] opacity-85">
              {isDragging
                ? isTouchInput
                  ? 'Ketuk 2 jari untuk putar'
                  : 'Tekan [R] saat drag'
                : isTouchInput
                  ? 'Ketuk atau double-tap kanvas'
                  : 'Tekan [R] / klik tombol'}
            </span>
          </div>
        </button>
      )}

      {isDragging && (
        <button
          type="button"
          data-cancel-drag="true"
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onCancelDrag();
          }}
          aria-label="Batalkan seret komponen"
          className="pointer-events-auto inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#F43F5E]/65 bg-[#1B0912]/95 px-3 py-1.5 text-[11px] font-semibold text-[#FDA4AF] shadow-[0_10px_24px_rgba(2,5,12,0.75)] transition-colors active:scale-95"
        >
          <X size={14} weight="bold" />
          <span>Batal Drag</span>
        </button>
      )}
    </div>
  );
}
