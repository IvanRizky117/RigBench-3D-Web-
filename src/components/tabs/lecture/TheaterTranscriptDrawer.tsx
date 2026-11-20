import { SpeakerHigh, X } from '@phosphor-icons/react';
import type { SubtitleCue } from '../../../utils/subtitleCues';

interface TheaterTranscriptDrawerProps {
  open: boolean;
  onClose: () => void;
  cues: SubtitleCue[];
  activeCueIndex: number;
  segmentTitle: string;
  onJumpToCue: (cue: SubtitleCue) => void;
}

export function TheaterTranscriptDrawer({
  open,
  onClose,
  cues,
  activeCueIndex,
  segmentTitle,
  onJumpToCue,
}: TheaterTranscriptDrawerProps) {
  if (!open) return null;

  return (
    <div
      className="border-t border-[#3B82F6]/20 bg-[#040915]/98 px-4 py-3.5 sm:px-5"
      aria-label="Laci Transkrip Lengkap"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-semibold text-[#38BDF8]">
            TRANSKRIP LENGKAP · KETUK BARIS UNTUK LOMPAT
          </p>
          <p className="truncate text-xs text-[#94A3B8]">{segmentTitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup transkrip"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#3B82F6]/25 bg-[#081228] text-[#94A3B8] hover:text-white"
        >
          <X size={15} weight="bold" />
        </button>
      </div>

      <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
        {cues.map((cue) => {
          const isCurrent = cue.index === activeCueIndex;
          return (
            <button
              key={cue.id}
              type="button"
              onClick={() => onJumpToCue(cue)}
              className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left text-xs leading-relaxed transition-colors ${
                isCurrent
                  ? 'border border-[#38BDF8]/45 bg-[#2563EB]/20 text-[#F8FAFC]'
                  : 'border border-transparent bg-[#071024]/80 text-[#94A3B8] hover:border-[#3B82F6]/25 hover:text-[#E2E8F0]'
              }`}
            >
              <span className="mt-0.5 shrink-0 font-mono text-[10px] text-[#38BDF8] tabular-nums">
                {String(cue.index + 1).padStart(2, '0')}
              </span>
              <span>{cue.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface LocalTtsGuideModalProps {
  open: boolean;
  hasIndonesianVoice: boolean;
  isSupported: boolean;
  onClose: () => void;
}

export function LocalTtsGuideModal({
  open,
  hasIndonesianVoice,
  isSupported,
  onClose,
}: LocalTtsGuideModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#02050C]/80 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tts-guide-heading"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-[#3B82F6]/30 bg-[#070E1F] p-5 text-left shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB]/20 text-[#38BDF8]">
              <SpeakerHigh size={18} weight="duotone" />
            </span>
            <div>
              <h3 id="tts-guide-heading" className="text-sm font-semibold text-[#F8FAFC]">
                Panduan Suara AI Lokal (id-ID)
              </h3>
              <p className="text-[11px] text-[#94A3B8]">
                {!isSupported
                  ? 'Browser ini memakai mode teks sinkron timer.'
                  : hasIndonesianVoice
                    ? 'Suara Bahasa Indonesia lokal sudah terdeteksi di perangkat.'
                    : 'Suara id-ID belum aktif — ikuti langkah singkat berikut.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panduan suara"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#3B82F6]/20 text-[#94A3B8] hover:text-white"
          >
            <X size={15} weight="bold" />
          </button>
        </div>

        <ol className="mt-4 space-y-2 text-xs leading-relaxed text-[#CBD5E1]">
          <li className="rounded-xl border border-[#3B82F6]/15 bg-[#040915] p-3">
            <strong className="text-[#F8FAFC]">1. HP Android / Infinix:</strong> Buka{' '}
            <span className="text-[#38BDF8]">Pengaturan → Sistem → Bahasa &amp; Masukan → Output Text-to-Speech</span>, pilih{' '}
            <strong className="text-white">Layanan Suara Google</strong> dan unduh data suara{' '}
            <strong className="text-white">Indonesia (id-ID)</strong>.
          </li>
          <li className="rounded-xl border border-[#3B82F6]/15 bg-[#040915] p-3">
            <strong className="text-[#F8FAFC]">2. Laptop Windows / Chrome:</strong> Suara{' '}
            <span className="text-[#38BDF8]">Google Bahasa Indonesia</span> atau{' '}
            <span className="text-[#38BDF8]">Microsoft Gadis/Ardi</span> langsung tersedia secara
            lokal tanpa internet berbayar.
          </li>
          <li className="rounded-xl border border-[#3B82F6]/15 bg-[#040915] p-3">
            <strong className="text-[#F8FAFC]">3. Mode Tanpa Suara:</strong> Meskipun perangkat
            sedang bisu, subtitle sebaris dan sorotan diagram tetap berjalan sinkron otomatis.
          </li>
        </ol>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 min-h-[44px] w-full rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#3B82F6] transition-colors"
        >
          Siap, Lanjut Belajar
        </button>
      </div>
    </div>
  );
}
