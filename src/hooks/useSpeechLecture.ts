import { useCallback, useEffect, useRef, useState } from 'react';
import type { LectureSegment } from '../types/rigbench';
import {
  DEFAULT_TUTOR_PERSONA_ID,
  getTutorPersona,
  type TutorPersonaId,
} from '../data/ttsPersonas';
import {
  buildSubtitleCues,
  computeCueSpeechMetrics,
  type SubtitleCue,
} from '../utils/subtitleCues';
import {
  filterAndSortPreferredVoices,
  isIndonesianVoice,
  pickPreferredIndonesianVoice,
} from '../utils/speechVoices';
import {
  formatIndonesianSpeechText,
  hashSpeechScript,
  splitIntoSpeechSentences,
} from '../utils/indonesianPhonetics';
import {
  buildAudioCacheKey,
  getCachedAudioClip,
  setCachedAudioClip,
} from '../utils/ttsAudioCache';
import {
  buildPhoneticWordTimeline,
  detectWavPauseBoundaries,
} from '../utils/waveformSync';

export type PlaybackSpeed = 0.75 | 1 | 1.25 | 1.5;

export type AudioEngineMode =
  | 'idle'
  | 'loading'
  | 'gemini-cached'
  | 'gemini-live'
  | 'local-fallback'
  | 'silent-clock';

interface UseSpeechLectureOptions {
  segments: LectureSegment[];
  activeIndex: number;
  autoPlayNextOnComplete?: boolean;
  onSegmentComplete?: (nextIndex: number) => void;
  onSegmentFinished?: (segmentId: string) => void;
  onFallbackNotice?: (reason: string) => void;
}

export interface SpeechLectureController {
  isSupported: boolean;
  hasIndonesianVoice: boolean;
  isPlaying: boolean;
  isLoadingAudio: boolean;
  audioEngineMode: AudioEngineMode;
  progress: number; // 0..100
  durationSec: number;
  activeWordIndex: number | null;
  wavPausePcts: number[];
  speed: PlaybackSpeed;
  volume: number; // 0..1
  isMuted: boolean;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  selectedPersonaId: TutorPersonaId;
  setSelectedPersonaId: (id: TutorPersonaId) => void;
  voiceLabel: string;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceUri: string;
  setSelectedVoiceUri: (uri: string) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stop: () => void;
  setSpeed: (rate: PlaybackSpeed) => void;
  seekProgress: (percent: number) => void;
  seekToWordIndex: (wordIndex: number) => void;
}

interface WordTimelineEntry {
  globalWordIndex: number;
  startPct: number;
  endPct: number;
}

interface SentenceBlock {
  text: string;
  spokenText: string;
  words: string[];
  startWordIndex: number;
  endWordIndex: number;
  startPct: number;
  endPct: number;
}

const PERSONA_STORAGE_KEY = 'rigbench_tts_persona_v1';
const VOLUME_STORAGE_KEY = 'rigbench_tts_volume_v1';
const DEFAULT_TTS_VOLUME = 0.68;
const DEFAULT_BASE_CPS = 16.0;
const START_WAIT_TIMEOUT_MS = 1500;
const TICK_INTERVAL_MS = 50;

// Session-level guard: if hosted statically (e.g. Netlify SPA returning HTML for /api/tts),
// skip repeated futile fetches and launch smooth local voice instantaneously.
let staticHostTtsUnavailable = false;

function readStoredVolume(): number {
  if (typeof window === 'undefined') return DEFAULT_TTS_VOLUME;
  try {
    const raw = window.localStorage.getItem(VOLUME_STORAGE_KEY);
    if (!raw) return DEFAULT_TTS_VOLUME;
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
      return parsed;
    }
  } catch {
    // Ignore storage read errors
  }
  return DEFAULT_TTS_VOLUME;
}

function readStoredPersonaId(): TutorPersonaId {
  if (typeof window === 'undefined') return DEFAULT_TUTOR_PERSONA_ID;
  try {
    const raw = window.localStorage.getItem(PERSONA_STORAGE_KEY);
    return getTutorPersona(raw).id;
  } catch {
    return DEFAULT_TUTOR_PERSONA_ID;
  }
}

function buildGlobalWordTimeline(narration: string, cues: SubtitleCue[]): WordTimelineEntry[] {
  const phonetic = buildPhoneticWordTimeline(narration);
  if (phonetic.length > 0) {
    return phonetic.map((p) => ({
      globalWordIndex: p.wordIndex,
      startPct: p.startPct,
      endPct: p.endPct,
    }));
  }

  const timeline: WordTimelineEntry[] = [];
  for (const cue of cues) {
    const metrics = computeCueSpeechMetrics(cue.words);
    const cueSpan = Math.max(0.001, cue.endPct - cue.startPct);
    let prevFrac = 0;
    for (let i = 0; i < cue.words.length; i++) {
      const endFrac = metrics.wordEndFractions[i] ?? (i + 1) / Math.max(1, cue.words.length);
      timeline.push({
        globalWordIndex: cue.startWordIndex + i,
        startPct: cue.startPct + cueSpan * prevFrac,
        endPct: cue.startPct + cueSpan * endFrac,
      });
      prevFrac = endFrac;
    }
  }
  return timeline;
}

function findWordIndexAtPercent(timeline: WordTimelineEntry[], pct: number): number | null {
  if (!timeline.length) return null;
  const clamped = Math.max(0, Math.min(100, pct));
  for (let i = 0; i < timeline.length; i++) {
    if (clamped <= timeline[i].endPct) {
      return timeline[i].globalWordIndex;
    }
  }
  return timeline[timeline.length - 1].globalWordIndex;
}

function buildSentenceBlocks(narration: string): SentenceBlock[] {
  const sentences = splitIntoSpeechSentences(narration);
  if (!sentences.length) return [];

  const totalChars = sentences.reduce((sum, s) => sum + Math.max(1, s.length), 0);
  let wordCursor = 0;
  let charAcc = 0;

  return sentences.map((sentence, idx) => {
    const words = sentence.split(/\s+/).filter(Boolean);
    const startWordIndex = wordCursor;
    const endWordIndex = wordCursor + Math.max(0, words.length - 1);
    const startPct = (charAcc / totalChars) * 100;
    charAcc += Math.max(1, sentence.length);
    const endPct = idx === sentences.length - 1 ? 100 : (charAcc / totalChars) * 100;

    wordCursor += words.length;
    return {
      text: sentence,
      spokenText: formatIndonesianSpeechText(sentence),
      words,
      startWordIndex,
      endWordIndex,
      startPct,
      endPct,
    };
  });
}

function setPreservesPitch(audio: HTMLAudioElement, enabled: boolean) {
  const extended = audio as HTMLAudioElement & {
    preservesPitch?: boolean;
    mozPreservesPitch?: boolean;
    webkitPreservesPitch?: boolean;
  };
  extended.preservesPitch = enabled;
  extended.mozPreservesPitch = enabled;
  extended.webkitPreservesPitch = enabled;
}

/**
 * Hybrid Indonesian Tutor Audio Hook:
 * 1) Primary: Gemini TTS (`gemini-3.8-flash-lite-tts` via `/api/tts`) with two-tier permanent
 *    caching (server disk + browser IndexedDB) and `HTMLAudioElement` pitch-preserved playback.
 * 2) Fallback: Smooth sentence-level browser Web Speech API with Indonesian phonetic normalization
 *    when offline without cache, rate-limited, or hosted statically without `/api/tts`.
 */
export function useSpeechLecture({
  segments,
  activeIndex,
  autoPlayNextOnComplete = true,
  onSegmentComplete,
  onSegmentFinished,
  onFallbackNotice,
}: UseSpeechLectureOptions): SpeechLectureController {
  const isSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioEngineMode, setAudioEngineMode] = useState<AudioEngineMode>('idle');
  const [progress, setProgress] = useState(0);
  const [actualDurationSec, setActualDurationSec] = useState<number | null>(null);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [wavPausePcts, setWavPausePcts] = useState<number[]>([]);
  const [speed, setSpeedState] = useState<PlaybackSpeed>(1);
  const [volume, setVolumeState] = useState<number>(readStoredVolume);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedPersonaId, setSelectedPersonaIdState] = useState<TutorPersonaId>(
    readStoredPersonaId
  );
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [hasIndonesianVoice, setHasIndonesianVoice] = useState(true);
  const [selectedVoiceUri, setSelectedVoiceUriState] = useState<string>('');

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const activeObjectUrlRef = useRef<string | null>(null);
  const loadedAudioKeyRef = useRef<string | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const rafRef = useRef<number | null>(null);

  const timerRef = useRef<number | null>(null);
  const startTimeoutRef = useRef<number | null>(null);
  const speakDelayRef = useRef<number | null>(null);
  const playbackSessionRef = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const speedRef = useRef<PlaybackSpeed>(1);
  const volumeRef = useRef<number>(volume);
  const isMutedRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  const cpsRef = useRef<number>(DEFAULT_BASE_CPS);
  const onCompleteRef = useRef(onSegmentComplete);
  const onFinishedRef = useRef(onSegmentFinished);
  const onFallbackNoticeRef = useRef(onFallbackNotice);
  const fallbackNotifiedRef = useRef<boolean>(false);
  const userSelectedVoiceRef = useRef<boolean>(false);
  const autoPlayPendingRef = useRef<boolean>(false);
  const autoPlayTimerRef = useRef<number | null>(null);
  const autoPlayEnabledRef = useRef<boolean>(autoPlayNextOnComplete);
  const startPlaybackRef = useRef<((pct: number) => Promise<void>) | null>(null);

  onCompleteRef.current = onSegmentComplete;
  onFinishedRef.current = onSegmentFinished;
  onFallbackNoticeRef.current = onFallbackNotice;
  autoPlayEnabledRef.current = autoPlayNextOnComplete;
  speedRef.current = speed;
  volumeRef.current = volume;
  isMutedRef.current = isMuted;

  const activeSegment = segments[activeIndex] ?? segments[0];
  const durationSec = actualDurationSec ?? activeSegment?.durationSec ?? 30;

  const clearLocalTimers = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (startTimeoutRef.current !== null) {
      window.clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
    if (speakDelayRef.current !== null) {
      window.clearTimeout(speakDelayRef.current);
      speakDelayRef.current = null;
    }
    if (autoPlayTimerRef.current !== null) {
      window.clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const disposeAudioElement = useCallback(() => {
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.onended = null;
      audioElRef.current.onerror = null;
      audioElRef.current.onloadedmetadata = null;
      audioElRef.current.src = '';
      audioElRef.current = null;
    }
    if (activeObjectUrlRef.current) {
      URL.revokeObjectURL(activeObjectUrlRef.current);
      activeObjectUrlRef.current = null;
    }
    loadedAudioKeyRef.current = null;
    setActualDurationSec(null);
  }, []);

  const abortInFlightFetch = useCallback(() => {
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
      fetchAbortRef.current = null;
    }
    setIsLoadingAudio(false);
  }, []);

  const cancelPlayback = useCallback(() => {
    playbackSessionRef.current += 1;
    clearLocalTimers();
    abortInFlightFetch();
    if (audioElRef.current) {
      audioElRef.current.pause();
    }
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, [abortInFlightFetch, clearLocalTimers, isSupported]);

  useEffect(() => {
    cpsRef.current = DEFAULT_BASE_CPS;
  }, [selectedVoiceUri]);

  const setSelectedVoiceUri = useCallback((uri: string) => {
    userSelectedVoiceRef.current = true;
    setSelectedVoiceUriState(uri);
  }, []);

  const setSelectedPersonaId = useCallback((id: TutorPersonaId) => {
    const valid = getTutorPersona(id).id;
    setSelectedPersonaIdState(valid);
    try {
      window.localStorage.setItem(PERSONA_STORAGE_KEY, valid);
    } catch {
      // Ignore storage restrictions
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    volumeRef.current = clamped;
    if (clamped > 0 && isMutedRef.current) {
      setIsMuted(false);
      isMutedRef.current = false;
    }
    if (audioElRef.current) {
      audioElRef.current.volume = clamped;
      audioElRef.current.muted = clamped === 0;
    }
    try {
      window.localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped));
    } catch {
      // Ignore storage restrictions
    }
  }, []);

  const toggleMute = useCallback(() => {
    const next = !isMutedRef.current;
    isMutedRef.current = next;
    setIsMuted(next);
    if (audioElRef.current) {
      audioElRef.current.muted = next;
      audioElRef.current.volume = next ? 0 : volumeRef.current;
    } else if (isPlayingRef.current) {
      void startPlaybackRef.current?.(progressRef.current);
    }
  }, []);

  // Discover native browser voices for local fallback mode
  useEffect(() => {
    if (!isSupported) {
      setHasIndonesianVoice(false);
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;

      const { indonesianVoices, allowedVoices } = filterAndSortPreferredVoices(voices);
      setHasIndonesianVoice(indonesianVoices.length > 0);
      setAvailableVoices(allowedVoices);

      const preferredId = pickPreferredIndonesianVoice(indonesianVoices);
      setSelectedVoiceUriState((prev) => {
        if (userSelectedVoiceRef.current) {
          if (prev === '' || allowedVoices.some((v) => v.voiceURI === prev)) {
            return prev;
          }
        }
        if (
          prev &&
          allowedVoices.some((v) => v.voiceURI === prev && isIndonesianVoice(v))
        ) {
          return prev;
        }
        return preferredId ? preferredId.voiceURI : '';
      });
    };

    loadVoices();
    const delayedCheck = window.setTimeout(loadVoices, 250);
    const synth = window.speechSynthesis;
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', loadVoices);
    } else {
      synth.onvoiceschanged = loadVoices;
    }

    return () => {
      window.clearTimeout(delayedCheck);
      if (typeof synth.removeEventListener === 'function') {
        synth.removeEventListener('voiceschanged', loadVoices);
      } else {
        synth.onvoiceschanged = null;
      }
    };
  }, [isSupported]);

  // Reset cleanly when active segment, cluster, or tutor persona changes
  useEffect(() => {
    const shouldResumeAutoPlay = autoPlayPendingRef.current;
    autoPlayPendingRef.current = false;

    cancelPlayback();
    disposeAudioElement();
    progressRef.current = 0;
    setProgress(0);
    setActiveWordIndex(null);
    setWavPausePcts([]);
    setAudioEngineMode('idle');

    if (shouldResumeAutoPlay) {
      autoPlayTimerRef.current = window.setTimeout(() => {
        autoPlayTimerRef.current = null;
        void startPlaybackRef.current?.(0);
      }, 360);
    }
  }, [activeIndex, segments, selectedPersonaId, cancelPlayback, disposeAudioElement]);

  // Mandatory cleanup on unmount
  useEffect(() => {
    return () => {
      playbackSessionRef.current += 1;
      clearLocalTimers();
      abortInFlightFetch();
      disposeAudioElement();
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [abortInFlightFetch, clearLocalTimers, disposeAudioElement, isSupported]);

  const startLocalFallbackFrom = useCallback(
    (startPercent: number, rateOverride?: PlaybackSpeed, wordIndexOverride?: number) => {
      const segment = segments[activeIndex];
      if (!segment) return;

      cancelPlayback();
      const sessionId = playbackSessionRef.current;
      const sentences = buildSentenceBlocks(segment.narration);
      if (!sentences.length) return;

      const activeRate = rateOverride ?? speedRef.current;
      const totalWords = Math.max(1, sentences[sentences.length - 1].endWordIndex + 1);
      const clampedStart = Math.max(0, Math.min(99, startPercent));

      let startSentIdx = 0;
      let startWordOffset = 0;

      if (typeof wordIndexOverride === 'number') {
        const clampedWord = Math.max(0, Math.min(totalWords - 1, wordIndexOverride));
        const foundIdx = sentences.findIndex(
          (s) => clampedWord >= s.startWordIndex && clampedWord <= s.endWordIndex
        );
        startSentIdx = foundIdx >= 0 ? foundIdx : 0;
        startWordOffset = Math.max(0, clampedWord - sentences[startSentIdx].startWordIndex);
      } else {
        const byPctIdx = sentences.findIndex(
          (s) => clampedStart >= s.startPct && clampedStart < s.endPct
        );
        startSentIdx = byPctIdx >= 0 ? byPctIdx : sentences.length - 1;
        const block = sentences[startSentIdx];
        const span = Math.max(0.01, block.endPct - block.startPct);
        const localPct = Math.max(0, Math.min(0.95, (clampedStart - block.startPct) / span));
        startWordOffset = Math.min(
          Math.max(0, block.words.length - 1),
          Math.floor(localPct * block.words.length)
        );
      }

      const initialBlock = sentences[startSentIdx];
      const initialWordGlobal = initialBlock.startWordIndex + startWordOffset;
      const initialRatio =
        initialBlock.words.length > 0 ? startWordOffset / initialBlock.words.length : 0;
      const initialPct =
        initialBlock.startPct + (initialBlock.endPct - initialBlock.startPct) * initialRatio;

      progressRef.current = initialPct;
      setProgress(initialPct);
      setActiveWordIndex(initialWordGlobal);
      isPlayingRef.current = true;
      setIsPlaying(true);
      setAudioEngineMode(isSupported ? 'local-fallback' : 'silent-clock');

      const finishSegment = () => {
        if (sessionId !== playbackSessionRef.current || !isPlayingRef.current) return;
        clearLocalTimers();
        progressRef.current = 100;
        setProgress(100);
        setActiveWordIndex(totalWords - 1);
        isPlayingRef.current = false;
        setIsPlaying(false);
        onFinishedRef.current?.(segment.id);
        if (activeIndex + 1 < segments.length) {
          autoPlayPendingRef.current = autoPlayEnabledRef.current;
          onCompleteRef.current?.(activeIndex + 1);
        }
      };

      const speakSentence = (sentIdx: number, wordOffset: number, forceSilentClock = false) => {
        if (sessionId !== playbackSessionRef.current || !isPlayingRef.current) return;
        clearLocalTimers();

        const block = sentences[sentIdx];
        if (!block) {
          finishSegment();
          return;
        }

        const sliceWords = block.words.slice(wordOffset);
        const effectiveWords = sliceWords.length > 0 ? sliceWords : block.words;
        const spokenText =
          wordOffset === 0
            ? block.spokenText
            : formatIndonesianSpeechText(effectiveWords.join(' '));
        const firstGlobalWord = block.startWordIndex + (sliceWords.length > 0 ? wordOffset : 0);

        const wordFraction =
          block.words.length > 0 ? (firstGlobalWord - block.startWordIndex) / block.words.length : 0;
        const sliceStartPct =
          block.startPct + (block.endPct - block.startPct) * wordFraction;
        const sliceEndPct = block.endPct;

        const metrics = computeCueSpeechMetrics(effectiveWords);
        const expectedMs = Math.max(
          500,
          (metrics.totalWeight / (cpsRef.current * activeRate)) * 1000
        );

        let sentStartPerf = 0;
        let onStartFired = false;
        let boundarySeen = false;
        let silentClockMode = forceSilentClock || !isSupported;

        const startWordClock = () => {
          if (timerRef.current !== null) {
            window.clearInterval(timerRef.current);
          }
          sentStartPerf = performance.now();

          timerRef.current = window.setInterval(() => {
            if (sessionId !== playbackSessionRef.current || !isPlayingRef.current) return;
            const elapsedMs = performance.now() - sentStartPerf;
            const rawFraction = elapsedMs / expectedMs;
            const cappedFraction = silentClockMode
              ? Math.min(1, rawFraction)
              : Math.min(0.97, rawFraction);

            if (!boundarySeen) {
              const localIdx = metrics.wordEndFractions.findIndex((f) => cappedFraction <= f);
              const resolvedLocal =
                localIdx >= 0 ? localIdx : Math.max(0, effectiveWords.length - 1);
              setActiveWordIndex(firstGlobalWord + resolvedLocal);

              const pct = sliceStartPct + (sliceEndPct - sliceStartPct) * cappedFraction;
              progressRef.current = pct;
              setProgress(pct);
            }

            if (silentClockMode && rawFraction >= 1) {
              if (sentIdx + 1 < sentences.length) {
                speakSentence(sentIdx + 1, 0, true);
              } else {
                finishSegment();
              }
            }
          }, TICK_INTERVAL_MS);
        };

        if (silentClockMode) {
          setAudioEngineMode('silent-clock');
          progressRef.current = sliceStartPct;
          setProgress(sliceStartPct);
          setActiveWordIndex(firstGlobalWord);
          startWordClock();
          return;
        }

        const charToWord: Array<{ start: number; wordIdx: number }> = [];
        let cursor = 0;
        for (let i = 0; i < effectiveWords.length; i++) {
          charToWord.push({ start: cursor, wordIdx: firstGlobalWord + i });
          cursor += effectiveWords[i].length + 1;
        }

        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.lang = 'id-ID';
        utterance.rate = activeRate;
        utterance.pitch = 1.04;
        utterance.volume = isMutedRef.current ? 0 : volumeRef.current;

        const chosenVoice = selectedVoiceUri
          ? availableVoices.find((v) => v.voiceURI === selectedVoiceUri)
          : undefined;
        if (chosenVoice) {
          utterance.voice = chosenVoice;
          if (chosenVoice.lang) {
            utterance.lang = chosenVoice.lang;
          }
        }

        utterance.onstart = () => {
          if (sessionId !== playbackSessionRef.current || !isPlayingRef.current) return;
          if (startTimeoutRef.current !== null) {
            window.clearTimeout(startTimeoutRef.current);
            startTimeoutRef.current = null;
          }
          onStartFired = true;
          progressRef.current = sliceStartPct;
          setProgress(sliceStartPct);
          setActiveWordIndex(firstGlobalWord);
          startWordClock();
        };

        utterance.onboundary = (event) => {
          if (
            sessionId !== playbackSessionRef.current ||
            !isPlayingRef.current ||
            typeof event.charIndex !== 'number'
          ) {
            return;
          }
          // When phonetic sanitizer altered text length, approximate by ratio cleanly
          const spokenLen = Math.max(1, spokenText.length);
          const ratio = Math.max(0, Math.min(0.99, event.charIndex / spokenLen));
          const approxWordIdx = Math.min(
            effectiveWords.length - 1,
            Math.floor(ratio * effectiveWords.length)
          );
          boundarySeen = true;
          const matchedWord = firstGlobalWord + approxWordIdx;
          setActiveWordIndex(matchedWord);
          const span = Math.max(1, effectiveWords.length);
          const localFrac = Math.min(0.98, (approxWordIdx + 0.5) / span);
          const pct = sliceStartPct + (sliceEndPct - sliceStartPct) * localFrac;
          progressRef.current = pct;
          setProgress(pct);
        };

        utterance.onend = () => {
          if (sessionId !== playbackSessionRef.current || !isPlayingRef.current) return;
          clearLocalTimers();

          if (onStartFired && sentStartPerf > 0 && effectiveWords.length >= 2) {
            const actualMs = performance.now() - sentStartPerf;
            if (actualMs >= 450) {
              const observedBaseCps = metrics.totalWeight / (actualMs / 1000) / activeRate;
              const clampedCps = Math.max(9, Math.min(28, observedBaseCps));
              cpsRef.current = cpsRef.current * 0.4 + clampedCps * 0.6;
            }
          }

          progressRef.current = sliceEndPct;
          setProgress(sliceEndPct);
          setActiveWordIndex(block.endWordIndex);

          if (sentIdx + 1 < sentences.length) {
            speakSentence(sentIdx + 1, 0, false);
          } else {
            finishSegment();
          }
        };

        utterance.onerror = (event) => {
          if (sessionId !== playbackSessionRef.current || !isPlayingRef.current) return;
          if (event.error === 'canceled' || event.error === 'interrupted') return;
          if (startTimeoutRef.current !== null) {
            window.clearTimeout(startTimeoutRef.current);
            startTimeoutRef.current = null;
          }
          silentClockMode = true;
          setAudioEngineMode('silent-clock');
          if (timerRef.current === null) {
            progressRef.current = sliceStartPct;
            setProgress(sliceStartPct);
            setActiveWordIndex(firstGlobalWord);
            startWordClock();
          }
        };

        startTimeoutRef.current = window.setTimeout(() => {
          if (sessionId !== playbackSessionRef.current || !isPlayingRef.current || onStartFired) {
            return;
          }
          startWordClock();
        }, START_WAIT_TIMEOUT_MS);

        window.speechSynthesis.speak(utterance);
      };

      speakDelayRef.current = window.setTimeout(() => {
        speakSentence(startSentIdx, startWordOffset, !isSupported);
      }, 20);
    },
    [activeIndex, availableVoices, cancelPlayback, clearLocalTimers, isSupported, segments, selectedVoiceUri]
  );

  const playGeminiAudioElement = useCallback(
    (
      audio: HTMLAudioElement,
      segment: LectureSegment,
      startPercent: number,
      rate: PlaybackSpeed,
      mode: 'gemini-cached' | 'gemini-live',
      sessionId: number
    ) => {
      clearLocalTimers();
      const cues = buildSubtitleCues(segment.narration);
      const timeline = buildGlobalWordTimeline(segment.narration, cues);

      const syncFromAudio = () => {
        if (sessionId !== playbackSessionRef.current || !isPlayingRef.current) return;
        const dur = audio.duration;
        if (Number.isFinite(dur) && dur > 0) {
          const pct = Math.max(0, Math.min(100, (audio.currentTime / dur) * 100));
          progressRef.current = pct;
          setProgress(pct);
          setActiveWordIndex(findWordIndexAtPercent(timeline, pct));
        }
        if (!audio.paused && !audio.ended) {
          rafRef.current = window.requestAnimationFrame(syncFromAudio);
        }
      };

      const applyStartPosition = () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          setActualDurationSec(Math.round(audio.duration));
          const targetTime = (Math.max(0, Math.min(99, startPercent)) / 100) * audio.duration;
          if (Math.abs(audio.currentTime - targetTime) > 0.15) {
            audio.currentTime = targetTime;
          }
        }
      };

      audio.playbackRate = rate;
      audio.volume = isMutedRef.current ? 0 : volumeRef.current;
      audio.muted = isMutedRef.current;
      setPreservesPitch(audio, true);

      audio.onloadedmetadata = () => {
        if (sessionId !== playbackSessionRef.current) return;
        applyStartPosition();
      };

      audio.onended = () => {
        if (sessionId !== playbackSessionRef.current) return;
        clearLocalTimers();
        progressRef.current = 100;
        setProgress(100);
        if (timeline.length > 0) {
          setActiveWordIndex(timeline[timeline.length - 1].globalWordIndex);
        }
        isPlayingRef.current = false;
        setIsPlaying(false);
        onFinishedRef.current?.(segment.id);
        if (activeIndex + 1 < segments.length) {
          autoPlayPendingRef.current = autoPlayEnabledRef.current;
          onCompleteRef.current?.(activeIndex + 1);
        }
      };

      audio.onerror = () => {
        if (sessionId !== playbackSessionRef.current) return;
        clearLocalTimers();
        disposeAudioElement();
        startLocalFallbackFrom(progressRef.current, rate);
      };

      if (audio.readyState >= 1) {
        applyStartPosition();
      }

      isPlayingRef.current = true;
      setIsPlaying(true);
      setAudioEngineMode(mode);

      void audio
        .play()
        .then(() => {
          if (sessionId !== playbackSessionRef.current || !isPlayingRef.current) return;
          rafRef.current = window.requestAnimationFrame(syncFromAudio);
        })
        .catch(() => {
          if (sessionId !== playbackSessionRef.current) return;
          clearLocalTimers();
          startLocalFallbackFrom(startPercent, rate);
        });
    },
    [activeIndex, clearLocalTimers, disposeAudioElement, segments.length, startLocalFallbackFrom]
  );

  const startPlaybackFrom = useCallback(
    async (startPercent: number, rateOverride?: PlaybackSpeed, wordIndexOverride?: number) => {
      const segment = segments[activeIndex];
      if (!segment) return;

      const persona = getTutorPersona(selectedPersonaId);
      const activeRate = rateOverride ?? speedRef.current;

      if (persona.engine === 'local') {
        startLocalFallbackFrom(startPercent, activeRate, wordIndexOverride);
        return;
      }

      const spokenText = formatIndonesianSpeechText(segment.narration);
      const clientHash = hashSpeechScript(
        `${persona.id}|${persona.geminiVoice ?? ''}|${spokenText}`
      );
      const cacheKey = buildAudioCacheKey(segment.id, persona.id, clientHash);

      // Fast path: audio element already loaded for this exact segment + persona
      if (audioElRef.current && loadedAudioKeyRef.current === cacheKey) {
        playbackSessionRef.current += 1;
        const sessionId = playbackSessionRef.current;
        const mode =
          audioEngineMode === 'gemini-live' ? 'gemini-live' : 'gemini-cached';
        playGeminiAudioElement(
          audioElRef.current,
          segment,
          startPercent,
          activeRate,
          mode,
          sessionId
        );
        return;
      }

      cancelPlayback();
      const sessionId = playbackSessionRef.current;

      // Tier 1: Browser IndexedDB cache (0 tokens, instant offline playback)
      const cachedBlob = await getCachedAudioClip(cacheKey);
      if (sessionId !== playbackSessionRef.current) return;

      if (cachedBlob) {
        disposeAudioElement();
        const url = URL.createObjectURL(cachedBlob);
        const audio = new Audio(url);
        activeObjectUrlRef.current = url;
        audioElRef.current = audio;
        loadedAudioKeyRef.current = cacheKey;
        void detectWavPauseBoundaries(cachedBlob).then((pauses) => {
          if (sessionId === playbackSessionRef.current) {
            setWavPausePcts(pauses);
          }
        });
        playGeminiAudioElement(audio, segment, startPercent, activeRate, 'gemini-cached', sessionId);
        return;
      }

      // Tier 2: Fetch from server `/api/tts` (skip immediately if static hosting already detected)
      if (staticHostTtsUnavailable) {
        startLocalFallbackFrom(startPercent, activeRate, wordIndexOverride);
        return;
      }

      const controller = new AbortController();
      fetchAbortRef.current = controller;
      setIsLoadingAudio(true);
      setAudioEngineMode('loading');

      try {
        const res = await fetch(
          `/api/tts/${encodeURIComponent(segment.id)}/${encodeURIComponent(persona.id)}`,
          { signal: controller.signal }
        );

        const contentType = res.headers.get('Content-Type') ?? '';
        if (!res.ok || !contentType.includes('audio')) {
          if (contentType.includes('text/html') || res.status === 404) {
            staticHostTtsUnavailable = true;
          }
          let errMsg = 'Mode hosting static terdeteksi; memakai suara lokal perangkat.';
          try {
            const payload = (await res.json()) as { error?: string };
            if (payload?.error) errMsg = payload.error;
          } catch {
            // Static host (e.g. Netlify SPA) returns HTML fallback
          }
          throw new Error(errMsg);
        }

        const serverCacheHit = res.headers.get('X-TTS-Cache') === 'HIT';
        const wavBlob = await res.blob();
        if (sessionId !== playbackSessionRef.current || controller.signal.aborted) return;

        void setCachedAudioClip(cacheKey, wavBlob);
        void detectWavPauseBoundaries(wavBlob).then((pauses) => {
          if (sessionId === playbackSessionRef.current) {
            setWavPausePcts(pauses);
          }
        });

        disposeAudioElement();
        const url = URL.createObjectURL(wavBlob);
        const audio = new Audio(url);
        activeObjectUrlRef.current = url;
        audioElRef.current = audio;
        loadedAudioKeyRef.current = cacheKey;
        setIsLoadingAudio(false);
        fetchAbortRef.current = null;

        playGeminiAudioElement(
          audio,
          segment,
          startPercent,
          activeRate,
          serverCacheHit ? 'gemini-cached' : 'gemini-live',
          sessionId
        );
      } catch (err) {
        setIsLoadingAudio(false);
        fetchAbortRef.current = null;
        if (controller.signal.aborted || sessionId !== playbackSessionRef.current) {
          return;
        }
        const reason =
          err instanceof Error
            ? err.message
            : 'Koneksi ke suara AI terputus; beralih ke suara lokal.';
        if (!fallbackNotifiedRef.current) {
          fallbackNotifiedRef.current = true;
          onFallbackNoticeRef.current?.(reason);
        }
        startLocalFallbackFrom(startPercent, activeRate, wordIndexOverride);
      }
    },
    [
      activeIndex,
      audioEngineMode,
      cancelPlayback,
      disposeAudioElement,
      playGeminiAudioElement,
      segments,
      selectedPersonaId,
      startLocalFallbackFrom,
    ]
  );

  startPlaybackRef.current = startPlaybackFrom;

  const play = useCallback(() => {
    const startFrom = progressRef.current >= 98 ? 0 : progressRef.current;
    void startPlaybackFrom(startFrom);
  }, [startPlaybackFrom]);

  const pause = useCallback(() => {
    cancelPlayback();
  }, [cancelPlayback]);

  const togglePlay = useCallback(() => {
    if (isLoadingAudio || isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [isLoadingAudio, pause, play]);

  const stop = useCallback(() => {
    cancelPlayback();
    if (audioElRef.current) {
      audioElRef.current.currentTime = 0;
    }
    progressRef.current = 0;
    setProgress(0);
    setActiveWordIndex(null);
  }, [cancelPlayback]);

  const setSpeed = useCallback(
    (rate: PlaybackSpeed) => {
      setSpeedState(rate);
      speedRef.current = rate;
      if (audioElRef.current && loadedAudioKeyRef.current) {
        audioElRef.current.playbackRate = rate;
        setPreservesPitch(audioElRef.current, true);
        return;
      }
      if (isPlayingRef.current) {
        void startPlaybackFrom(progressRef.current, rate);
      }
    },
    [startPlaybackFrom]
  );

  const seekProgress = useCallback(
    (percent: number) => {
      const clamped = Math.max(0, Math.min(100, percent));
      const segment = segments[activeIndex];
      const cues = segment ? buildSubtitleCues(segment.narration) : [];
      const timeline = segment ? buildGlobalWordTimeline(segment.narration, cues) : [];
      const wordIdx = findWordIndexAtPercent(timeline, clamped);

      progressRef.current = clamped;
      setProgress(clamped);
      setActiveWordIndex(wordIdx);

      if (audioElRef.current && loadedAudioKeyRef.current) {
        const dur = audioElRef.current.duration;
        if (Number.isFinite(dur) && dur > 0) {
          audioElRef.current.currentTime = (clamped / 100) * dur;
        }
        return;
      }

      if (isPlayingRef.current) {
        void startPlaybackFrom(clamped, undefined, wordIdx ?? undefined);
      }
    },
    [activeIndex, segments, startPlaybackFrom]
  );

  const seekToWordIndex = useCallback(
    (wordIndex: number) => {
      const segment = segments[activeIndex];
      if (!segment) return;
      const cues = buildSubtitleCues(segment.narration);
      const timeline = buildGlobalWordTimeline(segment.narration, cues);
      const entry = timeline.find((t) => t.globalWordIndex === wordIndex);
      const targetCue =
        cues.find((c) => wordIndex >= c.startWordIndex && wordIndex <= c.endWordIndex) ?? cues[0];
      const pct = entry ? entry.startPct : targetCue ? targetCue.startPct : 0;

      progressRef.current = pct;
      setProgress(pct);
      setActiveWordIndex(wordIndex);

      if (audioElRef.current && loadedAudioKeyRef.current) {
        const dur = audioElRef.current.duration;
        if (Number.isFinite(dur) && dur > 0) {
          audioElRef.current.currentTime = (pct / 100) * dur;
        }
        return;
      }

      if (isPlayingRef.current) {
        void startPlaybackFrom(pct, undefined, wordIndex);
      }
    },
    [activeIndex, segments, startPlaybackFrom]
  );

  const selectedPersona = getTutorPersona(selectedPersonaId);
  const selectedVoice = selectedVoiceUri
    ? availableVoices.find((v) => v.voiceURI === selectedVoiceUri)
    : undefined;

  const voiceLabel =
    selectedPersona.engine === 'gemini' &&
    audioEngineMode !== 'local-fallback' &&
    audioEngineMode !== 'silent-clock'
      ? selectedPersona.shortLabel
      : !isSupported
        ? 'Mode Teks (Tanpa TTS)'
        : selectedVoice
          ? `${selectedVoice.name} (${selectedVoice.lang})`
          : 'Default Sistem (id-ID)';

  return {
    isSupported,
    hasIndonesianVoice,
    isPlaying,
    isLoadingAudio,
    audioEngineMode,
    progress,
    durationSec,
    activeWordIndex,
    wavPausePcts,
    speed,
    volume,
    isMuted,
    setVolume,
    toggleMute,
    selectedPersonaId,
    setSelectedPersonaId,
    voiceLabel,
    availableVoices,
    selectedVoiceUri,
    setSelectedVoiceUri,
    play,
    pause,
    togglePlay,
    stop,
    setSpeed,
    seekProgress,
    seekToWordIndex,
  };
}
