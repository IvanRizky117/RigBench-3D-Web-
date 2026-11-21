import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CaretDown,
  CaretUp,
  CheckCircle,
  SpeakerHigh,
  StopCircle,
  Warning,
  X,
} from '@phosphor-icons/react';
import type { BusDomain, MainboardComponentSpec } from '../../../types/rigbench';
import { isIndonesianVoice, pickPreferredIndonesianVoice } from '../../../utils/speechVoices';

interface InspectPopupCardProps {
  component: MainboardComponentSpec;
  isInspected: boolean;
  onClose: () => void;
}

const BUS_DOMAIN_META: Record<BusDomain, { label: string; color: string }> = {
  northbridge: { label: 'Northbridge · Bus Kecepatan Tinggi', color: 'text-[#06B6D4]' },
  southbridge: { label: 'Southbridge · Jalur I/O & Storage', color: 'text-[#F59E0B]' },
  power: { label: 'Distribusi Daya ATX / VRM', color: 'text-[#10B981]' },
  io: { label: 'Back Panel External I/O', color: 'text-[#F59E0B]' },
  'front-panel': { label: 'Front Panel Casing (F_PANEL)', color: 'text-[#10B981]' },
};

export function InspectPopupCard({
  component,
  isInspected,
  onClose,
}: InspectPopupCardProps) {
  const [speaking, setSpeaking] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const asideRef = useRef<HTMLElement | null>(null);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  // Stop speech and scroll back to top when switching 3D component in-place
  useEffect(() => {
    stopSpeech();
    asideRef.current?.scrollTo({ top: 0 });
    return () => stopSpeech();
  }, [component.id, stopSpeech]);

  // Close popup on Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopSpeech();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, stopSpeech]);

  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speaking) {
      stopSpeech();
      return;
    }

    window.speechSynthesis.cancel();
    const script = `${component.name}. ${component.functionEssay} Catatan jebakan ujian: ${component.examTrap}`;
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = 'id-ID';
    utterance.rate = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const idVoice = pickPreferredIndonesianVoice(voices.filter(isIndonesianVoice));
    if (idVoice) {
      utterance.voice = idVoice;
      if (idVoice.lang) {
        utterance.lang = idVoice.lang;
      }
    }

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const domainMeta = BUS_DOMAIN_META[component.busDomain];
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return (
    <aside
      ref={asideRef}
      aria-label="Detail Komponen Motherboard"
      className={`absolute inset-x-2 bottom-2 sm:inset-x-auto sm:bottom-auto sm:top-14 sm:right-3 z-30 w-auto sm:w-[348px] sm:max-w-[calc(100vw-1.5rem)] ${
        isMobileExpanded ? 'max-h-[70dvh]' : 'max-h-[36dvh]'
      } sm:max-h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl border border-[#3B82F6]/25 bg-[#091122]/94 backdrop-blur-md p-3 sm:p-4 shadow-2xl space-y-2.5 sm:space-y-3.5`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-[#3B82F6]/15 pb-2 sm:pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] sm:text-xs">
            <span className="font-mono font-bold text-[#38BDF8]">{component.pinNumber}</span>
            <span className={`truncate font-medium ${domainMeta.color}`}>{domainMeta.label}</span>
          </div>
          <h2 className="mt-0.5 sm:mt-1 text-sm sm:text-base font-semibold leading-snug text-[#F8FAFC] truncate sm:whitespace-normal">
            {component.name}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsMobileExpanded((prev) => !prev)}
            aria-expanded={isMobileExpanded}
            aria-label={isMobileExpanded ? 'Ringkas panel komponen' : 'Perluas detail komponen'}
            className="sm:hidden inline-flex items-center gap-1 rounded-lg border border-[#3B82F6]/25 bg-[#040812] px-2 py-1.5 text-[11px] font-medium text-[#38BDF8] hover:border-[#38BDF8]/50 press-feedback"
          >
            {isMobileExpanded ? (
              <>
                <CaretDown size={13} weight="bold" />
                <span>Ringkas</span>
              </>
            ) : (
              <>
                <CaretUp size={13} weight="bold" />
                <span>Detail</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              stopSpeech();
              onClose();
            }}
            aria-label="Tutup panel penjelasan"
            className="shrink-0 rounded-lg border border-[#3B82F6]/20 bg-[#040812] p-1.5 text-[#94A3B8] hover:border-[#38BDF8]/50 hover:text-[#F8FAFC]"
          >
            <X size={15} weight="bold" />
          </button>
        </div>
      </div>

      {/* Audio Narasi + Status Row */}
      <div className="flex items-center justify-between gap-2">
        {speechSupported ? (
          <button
            type="button"
            onClick={handleToggleSpeech}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium transition-colors press-feedback ${
              speaking
                ? 'border-[#F43F5E]/50 bg-[#F43F5E]/15 text-[#FECDD3]'
                : 'border-[#38BDF8]/40 bg-[#2563EB]/20 text-[#38BDF8] hover:bg-[#2563EB]/30'
            }`}
          >
            {speaking ? (
              <>
                <StopCircle size={15} weight="fill" />
                Hentikan Suara
              </>
            ) : (
              <>
                <SpeakerHigh size={15} weight="duotone" />
                Putar Penjelasan Suara
              </>
            )}
          </button>
        ) : (
          <span className="text-[11px] text-[#64748B]">Suara browser tidak tersedia</span>
        )}

        {isInspected && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#10B981]">
            <CheckCircle size={13} weight="fill" />
            Tercatat
          </span>
        )}
      </div>

      {/* Fungsi Essay TTS (Compact 3-line summary on mobile unless expanded) */}
      <div className="space-y-1">
        <p className="hidden sm:block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
          Fungsi Standar Essay TTS
        </p>
        <p
          className={`text-xs leading-relaxed text-[#E2E8F0] ${
            isMobileExpanded ? '' : 'line-clamp-3 sm:line-clamp-none'
          }`}
        >
          {component.functionEssay}
        </p>
      </div>

      {/* Detailed Sections (Always visible on desktop sm+, toggleable via Detail button on mobile) */}
      <div className={`${isMobileExpanded ? 'block' : 'hidden sm:block'} space-y-3.5`}>
        {/* Jebakan Ujian TTS */}
        <div className="flex items-start gap-2 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-3">
          <Warning size={16} weight="fill" className="mt-0.5 shrink-0 text-[#F59E0B]" />
          <div className="text-xs leading-relaxed text-[#FDE68A]">
            <span className="font-semibold text-[#F59E0B]">Jebakan Soal TTS: </span>
            {component.examTrap}
          </div>
        </div>

        {/* Key Specs */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
            Poin Kunci Teknis
          </p>
          <ul className="space-y-1 text-xs text-[#CBD5E1]">
            {component.keySpecs.map((spec) => (
              <li key={spec} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#38BDF8]" />
                <span>{spec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* F_PANEL Pinout Table if C-Panel selected */}
        {component.pinoutDetails && component.pinoutDetails.length > 0 && (
          <div className="border-t border-[#3B82F6]/15 pt-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#34D399]">
              Pinout Header F_PANEL (Wajib Hafal TAS)
            </p>
            <div className="space-y-1.5">
              {component.pinoutDetails.map((row) => (
                <div
                  key={row.pin}
                  className="rounded-lg border border-[#3B82F6]/15 bg-[#040812] px-2.5 py-2 text-[11px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-semibold text-[#F8FAFC]">{row.label}</span>
                    <span className="font-mono text-[#38BDF8]">{row.pin}</span>
                  </div>
                  <p className="mt-0.5 text-[#94A3B8]">{row.purpose}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="hidden sm:block pt-1 text-right font-mono text-[10px] text-[#64748B]">
          Tekan ESC untuk menutup
        </p>
      </div>
    </aside>
  );
}
