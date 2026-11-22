import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowsIn,
  ArrowsOut,
  Crosshair,
  Info,
  Lightbulb,
  X,
} from '@phosphor-icons/react';
import type { LectureSegment } from '../../../types/rigbench';
import type { SpeechLectureController } from '../../../hooks/useSpeechLecture';
import { TUTOR_PERSONAS, type TutorPersonaId } from '../../../data/ttsPersonas';
import { buildSubtitleCues, findActiveCue } from '../../../utils/subtitleCues';
import {
  findActiveResolvedKeyframe,
  resolveSegmentKeyframes,
  type DirectorKeyframe,
} from '../../../data/theaterDirectorTimeline';
import { Theater3DStageCanvas } from '../../3d/Theater3DStageCanvas';
import { TheaterSubChapterStrip } from './TheaterSubChapterStrip';
import { TheaterMotionVisuals } from './TheaterMotionVisuals';
import { TheaterControlsBar } from './TheaterControlsBar';
import { LocalTtsGuideModal, TheaterTranscriptDrawer } from './TheaterTranscriptDrawer';

interface TheaterStagePlayerProps {
  clusterTitle: string;
  clusterNumber: string;
  segments: LectureSegment[];
  activeSegmentIndex: number;
  completedSegmentIds: string[];
  onSelectSegment: (idx: number) => void;
  speech: SpeechLectureController;
}

const HINT_STORAGE_KEY = 'rigbench_3d_theater_hint_dismissed_v1';

function readHintDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(HINT_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

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
  clusterTitle,
  clusterNumber,
  segments,
  activeSegmentIndex,
  completedSegmentIds,
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
  const [webglFailed, setWebglFailed] = useState(false);
  const [isManualOrbit, setIsManualOrbit] = useState(false);
  const [resyncSignal, setResyncSignal] = useState(0);
  const [hintDismissed, setHintDismissed] = useState<boolean>(readHintDismissed);

  const segment = segments[activeSegmentIndex] ?? segments[0];

  const cues = useMemo(
    () => (segment ? buildSubtitleCues(segment.narration) : []),
    [segment]
  );

  const activeCue = useMemo(
    () => findActiveCue(cues, speech.progress, speech.activeWordIndex),
    [cues, speech.progress, speech.activeWordIndex]
  );

  const resolvedDirector = useMemo(
    () =>
      segment
        ? resolveSegmentKeyframes(segment.visualType, segment.narration, speech.wavPausePcts)
        : null,
    [segment, speech.wavPausePcts]
  );

  const directorState = useMemo(
    () =>
      resolvedDirector
        ? findActiveResolvedKeyframe(resolvedDirector, speech.progress, speech.activeWordIndex)
        : null,
    [resolvedDirector, speech.progress, speech.activeWordIndex]
  );

  const handleDismissHint = useCallback(() => {
    setHintDismissed(true);
    try {
      window.localStorage.setItem(HINT_STORAGE_KEY, '1');
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleSelectChapter = useCallback(
    (kf: DirectorKeyframe) => {
      if (kf.startWordIndex > 0) {
        speech.seekToWordIndex(kf.startWordIndex);
      } else {
        speech.seekProgress(kf.startPct);
      }
      setResyncSignal((v) => v + 1);
      setIsManualOrbit(false);
    },
    [speech]
  );

  const handleResyncCamera = useCallback(() => {
    setResyncSignal((v) => v + 1);
    setIsManualOrbit(false);
  }, []);

  const handleWebglFailed = useCallback(() => {
    setWebglFailed(true);
  }, []);

  const resetIdleTimer = useCallback(() => {
    setControlsVisible(true);
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (isFullscreen) {
      idleTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
      }, 3400);
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
        // Safe CSS fixed inset-0 fallback
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
    if (isFullscreen) void exitFullscreen();
    else void enterFullscreen();
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

  if (!segment || !resolvedDirector || !directorState) return null;

  const { plan, keyframe, index: activeKeyframeIdx } = directorState;
  const is3DActive = plan.is3D && !webglFailed;
  const hideChrome = isFullscreen && !controlsVisible;
  const showLocalVoiceDropdown =
    (speech.selectedPersonaId === 'local-browser' ||
      speech.audioEngineMode === 'local-fallback') &&
    speech.availableVoices.length > 0;

  return (
    <>
      <div
        ref={stageRootRef}
        className={
          isFullscreen
            ? 'fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#04070E]'
            : 'relative overflow-hidden rounded-2xl bg-[#04070E] ring-1 ring-white/[0.08]'
        }
      >
        {/* Minimal Top Bar (Auto-hides cleanly in Fullscreen) */}
        <div
          className={`z-20 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 sm:px-5 transition-opacity duration-300 ${
            isFullscreen
              ? 'absolute inset-x-0 top-0 bg-gradient-to-b from-[#02050C]/90 via-[#02050C]/55 to-transparent pb-6'
              : 'border-b border-white/[0.06] bg-[#04070E]'
          } ${hideChrome ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] text-[#94A3B8]">
              <span className="font-mono font-semibold text-[#38BDF8]">TEATER {clusterNumber}</span>
              <span className="mx-1.5 text-[#475569]" aria-hidden="true">·</span>
              <span>{clusterTitle}</span>
            </p>
            <h3 className="truncate text-sm font-medium text-[#F8FAFC] sm:text-base">
              {segment.title}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#94A3B8]">
            <select
              aria-label="Pilih karakter suara tutor"
              value={speech.selectedPersonaId}
              onChange={(e) => speech.setSelectedPersonaId(e.target.value as TutorPersonaId)}
              className="min-h-[36px] max-w-[165px] sm:max-w-[205px] truncate rounded-lg border border-white/10 bg-[#080E1A] px-2.5 py-1 text-[11px] sm:text-xs text-[#E2E8F0] focus:border-[#38BDF8] focus:outline-none"
            >
              {TUTOR_PERSONAS.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.label}
                </option>
              ))}
            </select>

            {showLocalVoiceDropdown && (
              <select
                aria-label="Pilih suara narasi lokal browser"
                value={speech.selectedVoiceUri}
                onChange={(e) => speech.setSelectedVoiceUri(e.target.value)}
                className="min-h-[36px] max-w-[140px] truncate rounded-lg border border-white/10 bg-[#080E1A] px-2 py-1 text-[11px] text-[#E2E8F0] focus:border-[#38BDF8] focus:outline-none"
              >
                <option value="">Default Sistem (id-ID)</option>
                {speech.availableVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setTtsGuideOpen(true)}
              title="Panduan suara AI lokal Bahasa Indonesia"
              aria-label="Panduan suara AI lokal"
              className={`inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-xs transition-colors press-feedback ${
                !speech.hasIndonesianVoice
                  ? 'bg-[#F59E0B]/15 text-[#FCD34D]'
                  : 'text-[#94A3B8] hover:bg-white/[0.06] hover:text-[#38BDF8]'
              }`}
            >
              <Info size={16} weight="bold" />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Keluar Fullscreen (F / Esc)' : 'Layar Penuh (F)'}
              aria-label={isFullscreen ? 'Keluar layar penuh' : 'Masuk layar penuh'}
              className="inline-flex min-h-[36px] items-center justify-center gap-1 rounded-lg bg-white/[0.06] px-2.5 text-xs font-medium text-[#E2E8F0] hover:bg-white/[0.12] hover:text-white press-feedback"
            >
              {isFullscreen ? <ArrowsIn size={15} weight="bold" /> : <ArrowsOut size={15} weight="bold" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Keluar' : 'Layar Penuh'}</span>
            </button>
          </div>
        </div>

        {/* Clean Unboxed Sub-Chapter Strip Directly Above Video Stage */}
        {!isFullscreen && (
          <TheaterSubChapterStrip
            segments={segments}
            activeSegmentIndex={activeSegmentIndex}
            completedSegmentIds={completedSegmentIds}
            onSelectSegment={onSelectSegment}
          />
        )}

        {/* Frameless Seamless Dark 3D Stage (Zero Borders, Zero Floating Info Cards!) */}
        <div
          className={`relative w-full overflow-hidden bg-[#04070E] ${
            isFullscreen
              ? 'flex-1 h-full'
              : 'aspect-[16/10] sm:aspect-[16/9] min-h-[260px] sm:min-h-[390px]'
          }`}
        >
          {is3DActive ? (
            <Theater3DStageCanvas
              sceneKind={plan.sceneKind}
              keyframe={keyframe}
              isPlaying={speech.isPlaying}
              resyncSignal={resyncSignal}
              onManualOrbitChange={setIsManualOrbit}
              onWebglFailed={handleWebglFailed}
            />
          ) : (
            <TheaterMotionVisuals
              sceneKind={plan.sceneKind}
              keyframe={keyframe}
              keyframes={resolvedDirector.keyframes}
              activeIndex={activeKeyframeIdx}
              progress={speech.progress}
              isWebglFallback={plan.is3D && webglFailed}
            />
          )}

          {/* Minimal "Ikuti Kamera" button ONLY when user manually orbits away */}
          {is3DActive && isManualOrbit && !hideChrome && (
            <button
              type="button"
              onClick={handleResyncCamera}
              className={`absolute right-3.5 z-20 inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-[#0B1528]/90 px-3 py-1.5 text-xs font-medium text-[#7DD3FC] ring-1 ring-[#38BDF8]/40 hover:bg-[#10203C] press-feedback ${
                isFullscreen ? 'top-16' : 'top-3'
              }`}
            >
              <Crosshair size={14} weight="bold" />
              <span>Ikuti Kamera</span>
            </button>
          )}

          {/* Subtle one-time dismissible 3D gesture hint (first visit only) */}
          {is3DActive && !hintDismissed && !isFullscreen && (
            <div className="absolute bottom-3 right-3.5 z-20 flex items-center gap-2 rounded-lg bg-[#070E1C]/85 px-2.5 py-1.5 text-[11px] text-[#CBD5E1] ring-1 ring-white/10">
              <span>Geser putar 3D · Gulir/cubit zoom</span>
              <button
                type="button"
                onClick={handleDismissHint}
                aria-label="Tutup petunjuk kontrol 3D"
                className="text-[#94A3B8] hover:text-white"
              >
                <X size={13} weight="bold" />
              </button>
            </div>
          )}

          {/* Fullscreen Plain Borderless Subtitle (floats cleanly without any box!) */}
          {isFullscreen && ccEnabled && activeCue && (
            <div
              aria-live="polite"
              className={`pointer-events-none absolute inset-x-4 z-10 text-center transition-all duration-300 ${
                controlsVisible ? 'bottom-32 sm:bottom-28' : 'bottom-8'
              }`}
            >
              <p className="mx-auto max-w-4xl text-base font-medium leading-snug tracking-wide text-[#F8FAFC] drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] sm:text-xl md:text-2xl">
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
        </div>

        {/* Normal Mode: Plain Borderless Subtitle Directly Below Frameless 3D Canvas */}
        {!isFullscreen && ccEnabled && activeCue && (
          <div
            aria-live="polite"
            className="flex min-h-[44px] items-center justify-center bg-[#04070E] px-4 py-2 text-center"
          >
            <p className="max-w-4xl text-[13px] sm:text-[15px] leading-snug tracking-wide">
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

        {/* Controls Bar with Integrated Chapter Dots + Volume Slider */}
        <TheaterControlsBar
          speech={speech}
          chapters={resolvedDirector.keyframes}
          activeChapterIndex={activeKeyframeIdx}
          onSelectChapter={handleSelectChapter}
          segmentsCount={segments.length}
          activeSegmentIndex={activeSegmentIndex}
          onSelectSegment={onSelectSegment}
          ccEnabled={ccEnabled}
          onToggleCc={() => setCcEnabled((v) => !v)}
          transcriptOpen={transcriptOpen}
          onToggleTranscript={() => setTranscriptOpen((v) => !v)}
          isFullscreen={isFullscreen}
          hideChrome={hideChrome}
        />

        {/* Normal Mode Only: Clean Unboxed 1-Sentence Function + 1 Exam Tip Below Controls */}
        {!isFullscreen && (
          <div className="border-t border-white/[0.06] bg-[#060B15] px-4 py-3 sm:px-5">
            <div className="flex flex-col gap-1.5 md:flex-row md:items-baseline md:justify-between md:gap-6">
              <p className="text-xs sm:text-[13px] leading-relaxed text-[#CBD5E1]">
                <span
                  className="mr-2 font-mono text-[11px] font-bold"
                  style={{ color: keyframe.domainColor }}
                >
                  {keyframe.pdfBadge}
                </span>
                <strong className="font-semibold text-[#F8FAFC]">{keyframe.title}:</strong>{' '}
                {keyframe.functionSummary}
              </p>
              <p className="flex shrink-0 items-start gap-1.5 text-[11px] sm:text-xs leading-snug text-[#FDE68A]/90 md:max-w-sm">
                <Lightbulb size={14} weight="fill" className="mt-0.5 shrink-0 text-[#F59E0B]" />
                <span>{keyframe.examTip}</span>
              </p>
            </div>
          </div>
        )}

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
