import { useState } from 'react';
import {
  CircleNotch,
  ClosedCaptioning,
  FastForward,
  ListBullets,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  SpeakerHigh,
  SpeakerLow,
  SpeakerSlash,
  Stop,
} from '@phosphor-icons/react';
import type { DirectorKeyframe } from '../../../data/theaterDirectorTimeline';
import type { PlaybackSpeed, SpeechLectureController } from '../../../hooks/useSpeechLecture';

interface TheaterControlsBarProps {
  speech: SpeechLectureController;
  chapters: DirectorKeyframe[];
  activeChapterIndex: number;
  onSelectChapter: (chapter: DirectorKeyframe) => void;
  segmentsCount: number;
  activeSegmentIndex: number;
  onSelectSegment: (idx: number) => void;
  ccEnabled: boolean;
  onToggleCc: () => void;
  transcriptOpen: boolean;
  onToggleTranscript: () => void;
  isFullscreen: boolean;
  hideChrome: boolean;
}

const SPEEDS: PlaybackSpeed[] = [0.75, 1, 1.25, 1.5];

function formatTimeSec(totalSec: number): string {
  const safe = Math.max(0, Math.round(totalSec));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`;
}

export function TheaterControlsBar({
  speech,
  chapters,
  activeChapterIndex,
  onSelectChapter,
  segmentsCount,
  activeSegmentIndex,
  onSelectSegment,
  ccEnabled,
  onToggleCc,
  transcriptOpen,
  onToggleTranscript,
  isFullscreen,
  hideChrome,
}: TheaterControlsBarProps) {
  const [hoveredChapterId, setHoveredChapterId] = useState<string | null>(null);

  const currentSec = Math.round((speech.progress / 100) * speech.durationSec);
  const volumePct = Math.round((speech.isMuted ? 0 : speech.volume) * 100);
  const activeChapter = chapters[activeChapterIndex];

  return (
    <div
      className={`z-20 space-y-2 px-3.5 py-2.5 sm:px-5 sm:py-3 transition-opacity duration-300 ${
        isFullscreen
          ? 'absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#02050C]/95 via-[#02050C]/85 to-transparent pt-6'
          : 'border-t border-white/[0.06] bg-[#04070E]'
      } ${hideChrome ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      {/* Active Chapter Context + Integrated Chapter Dots on Timeline */}
      <div className="space-y-1.5">
        {activeChapter && chapters.length > 1 && (
          <div className="flex items-center justify-between gap-2 text-[11px] text-[#94A3B8]">
            <span className="truncate">
              <span
                className="font-mono font-semibold"
                style={{ color: activeChapter.domainColor }}
              >
                {activeChapter.pdfBadge}
              </span>
              <span className="mx-1.5 text-[#475569]" aria-hidden="true">·</span>
              <span className="text-[#CBD5E1]">{activeChapter.shortLabel}</span>
            </span>
            <span className="shrink-0 font-mono text-[10px] text-[#64748B] tabular-nums">
              Titik {activeChapterIndex + 1}/{chapters.length}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="w-9 font-mono text-[11px] text-[#94A3B8] tabular-nums">
            {formatTimeSec(currentSec)}
          </span>

          {/* Custom Precision Timeline Track + Interactive Chapter Dots */}
          <div className="relative flex h-6 flex-1 items-center">
            <div className="pointer-events-none relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.12]">
              <div
                className="h-full rounded-full bg-[#38BDF8] transition-[width] duration-100"
                style={{ width: `${Math.max(0, Math.min(100, speech.progress))}%` }}
              />
            </div>

            {/* Native accessible scrubber overlaid cleanly */}
            <input
              type="range"
              min={0}
              max={100}
              step={0.2}
              value={Number(speech.progress.toFixed(1))}
              onChange={(e) => speech.seekProgress(Number(e.target.value))}
              aria-label="Timeline pemutaran materi"
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            />

            {/* Thin Chapter Dots directly on the timeline */}
            {chapters.length > 1 &&
              chapters.map((ch, idx) => {
                const leftPct = Math.max(0.8, Math.min(99.2, ch.startPct));
                const isActive = idx === activeChapterIndex;
                const isHovered = hoveredChapterId === ch.id;
                return (
                  <div
                    key={ch.id}
                    className="absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${leftPct}%` }}
                  >
                    {isHovered && (
                      <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0B1426] px-2 py-1 text-[11px] font-medium text-[#F8FAFC] shadow-lg ring-1 ring-white/15">
                        {ch.shortLabel}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectChapter(ch);
                      }}
                      onMouseEnter={() => setHoveredChapterId(ch.id)}
                      onMouseLeave={() => setHoveredChapterId(null)}
                      onFocus={() => setHoveredChapterId(ch.id)}
                      onBlur={() => setHoveredChapterId(null)}
                      aria-label={`Lompat ke ${ch.shortLabel}`}
                      title={ch.shortLabel}
                      className="group flex h-6 w-5 items-center justify-center focus:outline-none"
                    >
                      <span
                        className={`block rounded-full transition-all duration-150 ${
                          isActive
                            ? 'h-3 w-3 ring-2 ring-[#04070E]'
                            : 'h-2 w-2 opacity-80 group-hover:scale-125 group-hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: isActive ? ch.domainColor : '#CBD5E1',
                        }}
                      />
                    </button>
                  </div>
                );
              })}
          </div>

          <span className="w-9 text-right font-mono text-[11px] text-[#94A3B8] tabular-nums">
            {formatTimeSec(speech.durationSec)}
          </span>
        </div>
      </div>

      {/* Main Transport + Volume Slider + CC / Transcript / Speed */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={speech.togglePlay}
            className="sapphire-btn inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap"
          >
            {speech.isLoadingAudio ? (
              <CircleNotch size={15} weight="bold" className="animate-spin" />
            ) : speech.isPlaying ? (
              <Pause size={15} weight="fill" />
            ) : (
              <Play size={15} weight="fill" />
            )}
            {speech.isLoadingAudio
              ? 'Memuat...'
              : speech.isPlaying
                ? 'Jeda'
                : 'Putar'}
          </button>

          <button
            type="button"
            onClick={speech.stop}
            aria-label="Hentikan narasi"
            title="Hentikan narasi"
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-[#94A3B8] hover:bg-white/[0.06] hover:text-[#F8FAFC] press-feedback"
          >
            <Stop size={15} weight="fill" />
          </button>

          {segmentsCount > 1 && (
            <div className="flex items-center">
              <button
                type="button"
                disabled={activeSegmentIndex === 0}
                onClick={() => onSelectSegment(Math.max(0, activeSegmentIndex - 1))}
                aria-label="Sub-bab sebelumnya"
                className="inline-flex min-h-[40px] min-w-[38px] items-center justify-center rounded-lg text-[#94A3B8] hover:bg-white/[0.06] hover:text-[#F8FAFC] disabled:opacity-30"
              >
                <SkipBack size={15} weight="bold" />
              </button>
              <button
                type="button"
                disabled={activeSegmentIndex >= segmentsCount - 1}
                onClick={() =>
                  onSelectSegment(Math.min(segmentsCount - 1, activeSegmentIndex + 1))
                }
                aria-label="Sub-bab berikutnya"
                className="inline-flex min-h-[40px] min-w-[38px] items-center justify-center rounded-lg text-[#94A3B8] hover:bg-white/[0.06] hover:text-[#F8FAFC] disabled:opacity-30"
              >
                <SkipForward size={15} weight="bold" />
              </button>
            </div>
          )}

          {/* Dedicated TTS Volume Control (Default 68%, works cleanly in Normal & Fullscreen) */}
          <div className="flex items-center gap-1.5 pl-1">
            <button
              type="button"
              onClick={speech.toggleMute}
              aria-label={speech.isMuted ? 'Nyalakan suara narasi' : 'Bisukan suara narasi'}
              title={speech.isMuted ? 'Nyalakan suara' : 'Bisukan suara'}
              className="inline-flex min-h-[40px] min-w-[36px] items-center justify-center rounded-lg text-[#CBD5E1] hover:bg-white/[0.06] hover:text-[#38BDF8]"
            >
              {speech.isMuted || speech.volume <= 0.01 ? (
                <SpeakerSlash size={16} weight="bold" className="text-[#F59E0B]" />
              ) : speech.volume < 0.5 ? (
                <SpeakerLow size={16} weight="bold" />
              ) : (
                <SpeakerHigh size={16} weight="bold" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={volumePct}
              onChange={(e) => speech.setVolume(Number(e.target.value) / 100)}
              aria-label="Volume suara narasi"
              className="h-1.5 w-16 sm:w-20 cursor-pointer accent-[#38BDF8]"
            />
            <span className="hidden sm:inline w-8 font-mono text-[11px] text-[#94A3B8] tabular-nums">
              {volumePct}%
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onToggleCc}
            aria-pressed={ccEnabled}
            title={ccEnabled ? 'Sembunyikan subtitle' : 'Tampilkan subtitle'}
            className={`inline-flex min-h-[38px] items-center gap-1 rounded-lg px-2.5 text-xs font-medium transition-colors press-feedback ${
              ccEnabled
                ? 'bg-[#2563EB]/20 text-[#38BDF8]'
                : 'text-[#94A3B8] hover:bg-white/[0.06] hover:text-[#F8FAFC]'
            }`}
          >
            <ClosedCaptioning size={16} weight={ccEnabled ? 'fill' : 'regular'} />
            <span>CC</span>
          </button>

          {!isFullscreen && (
            <button
              type="button"
              onClick={onToggleTranscript}
              aria-expanded={transcriptOpen}
              className={`inline-flex min-h-[38px] items-center gap-1 rounded-lg px-2.5 text-xs font-medium transition-colors press-feedback ${
                transcriptOpen
                  ? 'bg-[#2563EB]/20 text-[#38BDF8]'
                  : 'text-[#94A3B8] hover:bg-white/[0.06] hover:text-[#F8FAFC]'
              }`}
            >
              <ListBullets size={16} weight="bold" />
              <span className="hidden sm:inline">Transkrip</span>
            </button>
          )}

          <div
            role="group"
            aria-label="Kecepatan pemutaran suara"
            className="inline-flex min-h-[38px] items-center gap-0.5 rounded-lg bg-white/[0.04] p-0.5"
          >
            <FastForward size={13} className="mx-1 text-[#64748B] hidden sm:block" />
            {SPEEDS.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => speech.setSpeed(rate)}
                className={`min-h-[32px] rounded-md px-2 py-1 font-mono text-[11px] font-medium whitespace-nowrap press-feedback ${
                  speech.speed === rate
                    ? 'bg-[#2563EB] text-white'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
