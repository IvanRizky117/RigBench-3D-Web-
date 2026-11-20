import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowsIn,
  ArrowsOut,
  ClosedCaptioning,
  FastForward,
  Info,
  ListBullets,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  SpeakerHigh,
  SpeakerSlash,
  Stop,
} from '@phosphor-icons/react';
import type { ClusterId, LectureSegment } from '../../../types/rigbench';
import type { PlaybackSpeed, SpeechLectureController } from '../../../hooks/useSpeechLecture';
import { buildSubtitleCues, findActiveCue } from '../../../utils/subtitleCues';
import { TheaterDiagramSvg } from './TheaterDiagramSvg';
import { TheaterSceneryBackdrop } from './TheaterSceneryBackdrop';
import { LocalTtsGuideModal, TheaterTranscriptDrawer } from './TheaterTranscriptDrawer';

interface TheaterStagePlayerProps {
  clusterId: ClusterId;
  clusterTitle: string;
  clusterNumber: string;
  segments: LectureSegment[];
  activeSegmentIndex: number;
  onSelectSegment: (idx: number) => void;
  speech: SpeechLectureController;
}

/**
 * Highlights keywords in crisp Sky Sapphire and subtly emphasizes the word
 * currently spoken by local browser Web Speech API on a single broadcast line.
 */
function renderSyncedLine(
  words: string[],
  startWordIndex: number,
  activeWordIndex: number | null,
  keywords: string[],
  isPlaying: boolean
) {
  const loweredKeywords = keywords.map((k) => k.toLowerCase());

  return words.map((word, offset) => {
    const globalIdx = startWordIndex + offset;
    const cleanWord = word.replace(/[.,;:!?()]/g, '').toLowerCase();
    const isKeyword = loweredKeywords.some(
      (kw) => cleanWord.length >= 2 && (kw === cleanWord || kw.split(/\s+/).includes(cleanWord))
    );
    const isSpoken = isPlaying && activeWordIndex !== null && globalIdx === activeWordIndex;

    return (
      <span
        key={`${globalIdx}-${word}`}
        className={`inline ${
          isSpoken
            ? 'font-semibold text-[#7DD3FC] underline decoration-[#38BDF8]/80 decoration-2 underline-offset-4'
            : isKeyword
              ? 'font-semibold text-[#38BDF8]'
              : 'text-[#F8FAFC]'
        }`}
      >
        {word}
        {offset < words.length - 1 ? ' ' : ''}
      </span>
    );
  });
}

export function TheaterStagePlayer({
  clusterId,
  clusterTitle,
  clusterNumber,
  segments,
  activeSegmentIndex,
  onSelectSegment,
  speech,
}: TheaterStagePlayerProps) {
  const stageRootRef = useRef<HTMLDivElement | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [ccEnabled, setCcEnabled] = useState(true);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [ttsGuideOpen, setTtsGuideOpen] = useState(false);

  const segment = segments[activeSegmentIndex] ?? segments[0];

  const cues = useMemo(
    () => (segment ? buildSubtitleCues(segment.narration) : []),
    [segment]
  );

  const activeCue = useMemo(
    () => findActiveCue(cues, speech.progress, speech.activeWordIndex),
    [cues, speech.progress, speech.activeWordIndex]
  );

  const resetIdleTimer = useCallback(() => {
    setControlsVisible(true);
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (isFullscreen) {
      idleTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
      }, 3200);
    }
  }, [isFullscreen]);

  const enterFullscreen = useCallback(async () => {
    setIsFullscreen(true);
    setControlsVisible(true);
    setTranscriptOpen(false);
    const el = stageRootRef.current;
    if (el && typeof el.requestFullscreen === 'function') {
      try {
        await el.requestFullscreen();
      } catch {
        // Safe CSS fixed inset-0 fallback already active
      }
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    setIsFullscreen(false);
    setControlsVisible(true);
    if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
      try {
        await document.exitFullscreen();
      } catch {
        // Ignore restricted iframe exit error
      }
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      void exitFullscreen();
    } else {
      void enterFullscreen();
    }
  }, [enterFullscreen, exitFullscreen, isFullscreen]);

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        setControlsVisible(true);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      setControlsVisible(true);
      return;
    }

    resetIdleTimer();
    const onActivity = () => resetIdleTimer();
    window.addEventListener('pointermove', onActivity);
    window.addEventListener('pointerdown', onActivity);
    window.addEventListener('keydown', onActivity);

    return () => {
      window.removeEventListener('pointermove', onActivity);
      window.removeEventListener('pointerdown', onActivity);
      window.removeEventListener('keydown', onActivity);
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [isFullscreen, resetIdleTimer]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        void exitFullscreen();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [exitFullscreen, isFullscreen, toggleFullscreen]);

  if (!segment) return null;

  const speeds: PlaybackSpeed[] = [1, 1.25, 1.5];
  const hideChrome = isFullscreen && !controlsVisible;

  return (
    <>
      <div
        ref={stageRootRef}
        className={
          isFullscreen
            ? 'fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#02050C]'
            : 'datacore-card relative overflow-hidden rounded-2xl'
        }
      >
        {/* Top Theater Header (Responsive portrait/landscape + auto-hide in fullscreen) */}
        <div
          className={`z-20 flex flex-wrap items-center justify-between gap-2.5 border-b border-[#3B82F6]/18 bg-[#060D1E]/95 px-3.5 py-2.5 sm:px-5 sm:py-3 transition-opacity duration-300 ${
            isFullscreen ? 'absolute inset-x-0 top-0' : ''
          } ${hideChrome ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] text-[#94A3B8]">
              <span className="font-mono font-semibold text-[#38BDF8]">TEATER {clusterNumber}</span>
              <span className="mx-1.5" aria-hidden="true">·</span>
              <span>{clusterTitle}</span>
            </p>
            <h3 className="truncate text-sm font-medium text-[#F8FAFC] sm:text-base">
              {segment.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-[#94A3B8]">
            {speech.isSupported ? (
              <SpeakerHigh size={15} weight="duotone" className="text-[#38BDF8] shrink-0 hidden sm:block" />
            ) : (
              <SpeakerSlash size={15} className="text-[#F59E0B] shrink-0" />
            )}

            {speech.availableVoices.length > 0 ? (
              <select
                aria-label="Pilih suara narasi lokal browser"
                value={speech.selectedVoiceUri}
                onChange={(e) => speech.setSelectedVoiceUri(e.target.value)}
                className="min-h-[38px] max-w-[138px] sm:max-w-[180px] truncate rounded-lg border border-[#3B82F6]/25 bg-[#040812] px-2 py-1 text-[11px] sm:text-xs text-[#E2E8F0] focus:border-[#38BDF8] focus:outline-none"
              >
                {speech.availableVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-mono text-[11px] truncate max-w-[130px]">{speech.voiceLabel}</span>
            )}

            <button
              type="button"
              onClick={() => setTtsGuideOpen(true)}
              title="Panduan aktivasi suara AI lokal Bahasa Indonesia"
              aria-label="Panduan suara AI lokal"
              className={`inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border px-2 text-xs transition-colors press-feedback ${
                !speech.hasIndonesianVoice
                  ? 'border-[#F59E0B]/45 bg-[#F59E0B]/15 text-[#FCD34D]'
                  : 'border-[#3B82F6]/25 bg-[#040812] text-[#94A3B8] hover:border-[#38BDF8] hover:text-[#38BDF8]'
              }`}
            >
              <Info size={15} weight="bold" />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Keluar Fullscreen (F / Esc)' : 'Layar Penuh (F)'}
              aria-label={isFullscreen ? 'Keluar layar penuh' : 'Masuk layar penuh'}
              className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center gap-1 rounded-lg border border-[#3B82F6]/25 bg-[#040812] px-2.5 text-xs font-medium text-[#E2E8F0] hover:border-[#38BDF8] hover:text-[#38BDF8] press-feedback"
            >
              {isFullscreen ? <ArrowsIn size={15} weight="bold" /> : <ArrowsOut size={15} weight="bold" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Keluar' : 'Layar Penuh'}</span>
            </button>
          </div>
        </div>

        {/* Rich Layered Per-Cluster Scenery Stage + Unobstructed Diagram + Dedicated Single-Line Subtitle */}
        <div
          className={`relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#02050C] px-3 sm:px-7 ${
            isFullscreen ? 'h-full py-16 sm:py-20' : 'py-5 sm:py-7'
          }`}
        >
          <TheaterSceneryBackdrop
            clusterId={clusterId}
            isPlaying={speech.isPlaying}
            progress={speech.progress}
          />

          {/* Central Projection Frame + Dedicated Single-Line Subtitle Below Diagram */}
          <div
            key={segment.id}
            className={`relative z-10 flex w-full flex-col gap-3 transition-all duration-300 ${
              isFullscreen ? 'max-w-5xl' : 'max-w-4xl'
            }`}
          >
            <div className="flex items-center justify-between gap-2 px-1 text-[11px] font-mono text-[#CBD5E1]/85">
              <span className="truncate">{segment.stageCaption}</span>
              <span className="shrink-0 text-[#38BDF8] tabular-nums">
                Segmen {activeSegmentIndex + 1}/{segments.length}
              </span>
            </div>

            {/* Unobstructed Diagram Box (0% covered by subtitle!) */}
            <div
              className={`w-full rounded-2xl border border-[#3B82F6]/28 bg-[#050C1C]/86 p-2 sm:p-4 shadow-[0_24px_64px_-22px_rgba(37,99,235,0.48)] ${
                isFullscreen
                  ? 'aspect-[16/9] max-h-[52dvh] sm:aspect-[16/7] sm:max-h-[56dvh]'
                  : 'aspect-[16/8.6] sm:aspect-[16/6.3] min-h-[195px]'
              }`}
            >
              <TheaterDiagramSvg
                visualType={segment.visualType}
                progress={speech.progress}
                isPlaying={speech.isPlaying}
              />
            </div>

            {/* Dedicated Single-Line Synced Subtitle Track (Outside Diagram Box) */}
            {ccEnabled && activeCue && (
              <div
                aria-live="polite"
                className="flex min-h-[48px] items-center justify-center rounded-xl border border-[#3B82F6]/22 bg-[#040915]/92 px-3.5 py-2 text-center shadow-[0_12px_28px_-14px_rgba(0,0,0,0.9)]"
              >
                <p
                  className={`cinema-subtitle-text leading-snug tracking-wide ${
                    isFullscreen
                      ? 'text-sm sm:text-lg md:text-xl'
                      : 'text-[13px] sm:text-[15px]'
                  }`}
                >
                  {renderSyncedLine(
                    activeCue.words,
                    activeCue.startWordIndex,
                    speech.activeWordIndex,
                    segment.highlightedKeywords,
                    speech.isPlaying
                  )}
                </p>
              </div>
            )}

            <p className="px-1 text-center text-[11px] sm:text-xs text-[#94A3B8]">
              <span className="font-medium text-[#34D399]">Kunci Essay:</span> {segment.examTakeaway}
            </p>
          </div>
        </div>

        {/* Bottom Control Bar + Timeline Scrubber (44px thumb-friendly targets) */}
        <div
          className={`z-20 space-y-2.5 border-t border-[#3B82F6]/18 bg-[#060D1E]/96 px-3.5 py-3 sm:px-5 transition-opacity duration-300 ${
            isFullscreen ? 'absolute inset-x-0 bottom-0' : ''
          } ${hideChrome ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-[#94A3B8] tabular-nums">
              {Math.round((speech.progress / 100) * segment.durationSec)}s
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(speech.progress)}
              onChange={(e) => speech.seekProgress(Number(e.target.value))}
              aria-label="Timeline scrubber kuliah"
              className="h-2 flex-1 cursor-pointer accent-[#2563EB]"
            />
            <span className="font-mono text-[11px] text-[#94A3B8] tabular-nums">
              {segment.durationSec}s
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={speech.togglePlay}
                className="sapphire-btn inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap"
              >
                {speech.isPlaying ? <Pause size={15} weight="fill" /> : <Play size={15} weight="fill" />}
                {speech.isPlaying ? 'Jeda' : 'Putar Narasi'}
              </button>

              <button
                type="button"
                onClick={speech.stop}
                aria-label="Hentikan narasi"
                className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-[#3B82F6]/22 bg-[#0B152B] px-3 py-2 text-xs font-medium text-[#E2E8F0] hover:border-[#38BDF8]/50 press-feedback"
              >
                <Stop size={14} weight="fill" />
                <span className="hidden xs:inline sm:inline">Stop</span>
              </button>

              {segments.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={activeSegmentIndex === 0}
                    onClick={() => onSelectSegment(Math.max(0, activeSegmentIndex - 1))}
                    aria-label="Segmen sebelumnya"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#94A3B8] hover:bg-white/5 hover:text-[#F8FAFC] disabled:opacity-35"
                  >
                    <SkipBack size={16} weight="bold" />
                  </button>
                  <button
                    type="button"
                    disabled={activeSegmentIndex >= segments.length - 1}
                    onClick={() => onSelectSegment(Math.min(segments.length - 1, activeSegmentIndex + 1))}
                    aria-label="Segmen berikutnya"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#94A3B8] hover:bg-white/5 hover:text-[#F8FAFC] disabled:opacity-35"
                  >
                    <SkipForward size={16} weight="bold" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setCcEnabled((v) => !v)}
                aria-pressed={ccEnabled}
                title={ccEnabled ? 'Sembunyikan subtitle sebaris' : 'Tampilkan subtitle sebaris'}
                className={`inline-flex min-h-[44px] items-center gap-1 rounded-xl border px-2.5 text-xs font-medium transition-colors press-feedback ${
                  ccEnabled
                    ? 'border-[#38BDF8]/50 bg-[#2563EB]/20 text-[#38BDF8]'
                    : 'border-[#3B82F6]/20 bg-[#040812] text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <ClosedCaptioning size={16} weight={ccEnabled ? 'fill' : 'regular'} />
                <span>CC</span>
              </button>

              {!isFullscreen && (
                <button
                  type="button"
                  onClick={() => setTranscriptOpen((v) => !v)}
                  aria-expanded={transcriptOpen}
                  className={`inline-flex min-h-[44px] items-center gap-1 rounded-xl border px-2.5 text-xs font-medium transition-colors press-feedback ${
                    transcriptOpen
                      ? 'border-[#38BDF8]/50 bg-[#2563EB]/20 text-[#38BDF8]'
                      : 'border-[#3B82F6]/20 bg-[#040812] text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  <ListBullets size={16} weight="bold" />
                  <span className="hidden sm:inline">Transkrip</span>
                </button>
              )}

              <div className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-[#3B82F6]/20 bg-[#040812] p-1">
                <FastForward size={13} className="ml-1 text-[#64748B] hidden sm:block" />
                {speeds.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => speech.setSpeed(rate)}
                    className={`min-h-[34px] rounded-lg px-2 py-1 font-mono text-[11px] font-medium press-feedback ${
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

        {/* Optional Collapsible Full Transcript Drawer */}
        {!isFullscreen && (
          <TheaterTranscriptDrawer
            open={transcriptOpen}
            onClose={() => setTranscriptOpen(false)}
            cues={cues}
            activeCueIndex={activeCue?.index ?? 0}
            segmentTitle={segment.title}
            onJumpToCue={(cue) => speech.seekToWordIndex(cue.startWordIndex)}
          />
        )}
      </div>

      <LocalTtsGuideModal
        open={ttsGuideOpen}
        hasIndonesianVoice={speech.hasIndonesianVoice}
        isSupported={speech.isSupported}
        onClose={() => setTtsGuideOpen(false)}
      />
    </>
  );
}
