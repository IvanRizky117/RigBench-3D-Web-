import { useCallback, useEffect, useRef, useState } from 'react';
import type { LectureSegment } from '../types/rigbench';
import { buildSubtitleCues, computeCueSpeechMetrics } from '../utils/subtitleCues';
import {
  filterAndSortPreferredVoices,
  isIndonesianVoice,
  pickPreferredIndonesianVoice,
} from '../utils/speechVoices';

export type PlaybackSpeed = 1 | 1.25 | 1.5;

interface UseSpeechLectureOptions {
  segments: LectureSegment[];
  activeIndex: number;
  onSegmentComplete?: (nextIndex: number) => void;
}

export interface SpeechLectureController {
  isSupported: boolean;
  hasIndonesianVoice: boolean;
  isPlaying: boolean;
  progress: number; // 0..100
  activeWordIndex: number | null;
  speed: PlaybackSpeed;
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

const DEFAULT_BASE_CPS = 16.0;
const START_WAIT_TIMEOUT_MS = 1500;
const TICK_INTERVAL_MS = 50;

/**
 * 100% Local Browser Web Speech API hook for Theater Motion-Lecture Player.
 * Uses per-cue utterance queueing locked to onstart/onend, 1.5s start-wait guard,
 * performance.now() weighted word tracking, and automatic per-voice CPS calibration.
 */
export function useSpeechLecture({
  segments,
  activeIndex,
  onSegmentComplete,
}: UseSpeechLectureOptions): SpeechLectureController {
  const isSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [speed, setSpeedState] = useState<PlaybackSpeed>(1);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [hasIndonesianVoice, setHasIndonesianVoice] = useState(true);
  const [selectedVoiceUri, setSelectedVoiceUriState] = useState<string>('');

  const timerRef = useRef<number | null>(null);
  const startTimeoutRef = useRef<number | null>(null);
  const speakDelayRef = useRef<number | null>(null);
  const playbackSessionRef = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const speedRef = useRef<PlaybackSpeed>(1);
  const isPlayingRef = useRef<boolean>(false);
  const cpsRef = useRef<number>(DEFAULT_BASE_CPS);
  const onCompleteRef = useRef(onSegmentComplete);
  const userSelectedVoiceRef = useRef<boolean>(false);

  onCompleteRef.current = onSegmentComplete;
  speedRef.current = speed;

  const clearTimers = useCallback(() => {
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
  }, []);

  const cancelSpeech = useCallback(() => {
    playbackSessionRef.current += 1;
    clearTimers();
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, [clearTimers, isSupported]);

  // Reset adaptive CPS when switching local TTS voice
  useEffect(() => {
    cpsRef.current = DEFAULT_BASE_CPS;
  }, [selectedVoiceUri]);

  const setSelectedVoiceUri = useCallback((uri: string) => {
    userSelectedVoiceRef.current = true;
    setSelectedVoiceUriState(uri);
  }, []);

  // Discover native local browser voices (prioritize id-ID/in-ID; never auto-pick foreign voices)
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
        // Respect explicit user choice if that voice is still available (including '' for Default Sistem id-ID)
        if (userSelectedVoiceRef.current) {
          if (prev === '' || allowedVoices.some((v) => v.voiceURI === prev)) {
            return prev;
          }
        }

        // Keep existing Indonesian voice if still valid
        if (
          prev &&
          allowedVoices.some((v) => v.voiceURI === prev && isIndonesianVoice(v))
        ) {
          return prev;
        }

        // Auto-select Indonesian voice if available; otherwise stay on '' (Default Sistem id-ID)
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

  // Reset cleanly when active segment or cluster changes
  useEffect(() => {
    cancelSpeech();
    progressRef.current = 0;
    setProgress(0);
    setActiveWordIndex(null);
  }, [activeIndex, segments, cancelSpeech]);

  // Mandatory cleanup on unmount (tab switch or page unload)
  useEffect(() => {
    return () => {
      playbackSessionRef.current += 1;
      clearTimers();
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [clearTimers, isSupported]);

  const startPlaybackFrom = useCallback(
    (startPercent: number, rateOverride?: PlaybackSpeed, wordIndexOverride?: number) => {
      const segment = segments[activeIndex];
      if (!segment) return;

      cancelSpeech();

      const sessionId = playbackSessionRef.current;
      const cues = buildSubtitleCues(segment.narration);
      if (!cues.length) return;

      const activeRate = rateOverride ?? speedRef.current;
      const totalWords = Math.max(1, cues[cues.length - 1].endWordIndex + 1);
      const clampedStart = Math.max(0, Math.min(99, startPercent));

      let startCueIdx = 0;
      let startWordOffset = 0;

      if (typeof wordIndexOverride === 'number') {
        const clampedWord = Math.max(0, Math.min(totalWords - 1, wordIndexOverride));
        const foundIdx = cues.findIndex(
          (c) => clampedWord >= c.startWordIndex && clampedWord <= c.endWordIndex
        );
        startCueIdx = foundIdx >= 0 ? foundIdx : 0;
        startWordOffset = Math.max(0, clampedWord - cues[startCueIdx].startWordIndex);
      } else {
        const byPctIdx = cues.findIndex(
          (c) => clampedStart >= c.startPct && clampedStart < c.endPct
        );
        startCueIdx = byPctIdx >= 0 ? byPctIdx : cues.length - 1;
        const cue = cues[startCueIdx];
        const cueSpan = Math.max(0.01, cue.endPct - cue.startPct);
        const localPct = Math.max(0, Math.min(0.95, (clampedStart - cue.startPct) / cueSpan));
        startWordOffset = Math.min(
          Math.max(0, cue.words.length - 1),
          Math.floor(localPct * cue.words.length)
        );
      }

      const initialWordGlobal = cues[startCueIdx].startWordIndex + startWordOffset;
      const initialCue = cues[startCueIdx];
      const initialCueWordRatio =
        initialCue.words.length > 0 ? startWordOffset / initialCue.words.length : 0;
      const initialPct =
        initialCue.startPct + (initialCue.endPct - initialCue.startPct) * initialCueWordRatio;

      progressRef.current = initialPct;
      setProgress(initialPct);
      setActiveWordIndex(initialWordGlobal);
      isPlayingRef.current = true;
      setIsPlaying(true);

      const finishSegment = () => {
        if (sessionId !== playbackSessionRef.current || !isPlayingRef.current) return;
        clearTimers();
        progressRef.current = 100;
        setProgress(100);
        setActiveWordIndex(totalWords - 1);
        isPlayingRef.current = false;
        setIsPlaying(false);
        if (activeIndex + 1 < segments.length) {
          onCompleteRef.current?.(activeIndex + 1);
        }
      };

      const speakCue = (cueIdx: number, wordOffset: number, forceSilentClock = false) => {
        if (sessionId !== playbackSessionRef.current || !isPlayingRef.current) return;
        clearTimers();

        const cue = cues[cueIdx];
        if (!cue) {
          finishSegment();
          return;
        }

        const spokenWords = cue.words.slice(wordOffset);
        const effectiveWords = spokenWords.length > 0 ? spokenWords : cue.words;
        const spokenText = effectiveWords.join(' ') || cue.text;
        const firstGlobalWord = cue.startWordIndex + (spokenWords.length > 0 ? wordOffset : 0);

        const cueWordFraction =
          cue.words.length > 0 ? (firstGlobalWord - cue.startWordIndex) / cue.words.length : 0;
        const sliceStartPct =
          cue.startPct + (cue.endPct - cue.startPct) * cueWordFraction;
        const sliceEndPct = cue.endPct;

        const metrics = computeCueSpeechMetrics(effectiveWords);
        const expectedCueMs = Math.max(
          450,
          (metrics.totalWeight / (cpsRef.current * activeRate)) * 1000
        );

        let cueStartPerf = 0;
        let onStartFired = false;
        let boundarySeenInCue = false;
        let silentClockMode = forceSilentClock || !isSupported;

        const startWordClock = () => {
          if (timerRef.current !== null) {
            window.clearInterval(timerRef.current);
          }
          cueStartPerf = performance.now();

          timerRef.current = window.setInterval(() => {
            if (sessionId !== playbackSessionRef.current || !isPlayingRef.current) return;

            const elapsedMs = performance.now() - cueStartPerf;
            const rawFraction = elapsedMs / expectedCueMs;

            // In active TTS mode without onboundary, cap at 0.97 so cue never jumps early before onend
            const cappedFraction = silentClockMode
              ? Math.min(1, rawFraction)
              : Math.min(0.97, rawFraction);

            if (!boundarySeenInCue) {
              const localIdx = metrics.wordEndFractions.findIndex((f) => cappedFraction <= f);
              const resolvedLocal =
                localIdx >= 0 ? localIdx : Math.max(0, effectiveWords.length - 1);
              setActiveWordIndex(firstGlobalWord + resolvedLocal);

              const pct = sliceStartPct + (sliceEndPct - sliceStartPct) * cappedFraction;
              progressRef.current = pct;
              setProgress(pct);
            }

            if (silentClockMode && rawFraction >= 1) {
              if (cueIdx + 1 < cues.length) {
                speakCue(cueIdx + 1, 0, true);
              } else {
                finishSegment();
              }
            }
          }, TICK_INTERVAL_MS);
        };

        if (silentClockMode) {
          progressRef.current = sliceStartPct;
          setProgress(sliceStartPct);
          setActiveWordIndex(firstGlobalWord);
          startWordClock();
          return;
        }

        // Precompute char offset -> global word index for voices that emit onboundary
        const charToWord: Array<{ start: number; wordIdx: number }> = [];
        let cursor = 0;
        for (let i = 0; i < effectiveWords.length; i++) {
          charToWord.push({ start: cursor, wordIdx: firstGlobalWord + i });
          cursor += effectiveWords[i].length + 1;
        }

        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.lang = 'id-ID';
        utterance.rate = activeRate;
        utterance.pitch = 1;

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
          boundarySeenInCue = true;
          let matchedWord = firstGlobalWord;
          for (let i = charToWord.length - 1; i >= 0; i--) {
            if (event.charIndex >= charToWord[i].start) {
              matchedWord = charToWord[i].wordIdx;
              break;
            }
          }
          setActiveWordIndex(matchedWord);
          const wordSpan = Math.max(1, effectiveWords.length);
          const localFrac = Math.min(0.98, (matchedWord - firstGlobalWord + 0.5) / wordSpan);
          const pct = sliceStartPct + (sliceEndPct - sliceStartPct) * localFrac;
          progressRef.current = pct;
          setProgress(pct);
        };

        utterance.onend = () => {
          if (sessionId !== playbackSessionRef.current || !isPlayingRef.current) return;
          clearTimers();

          // Auto-calibrate local voice CPS from actual spoken duration
          if (onStartFired && cueStartPerf > 0 && effectiveWords.length >= 2) {
            const actualMs = performance.now() - cueStartPerf;
            if (actualMs >= 350) {
              const observedBaseCps = metrics.totalWeight / (actualMs / 1000) / activeRate;
              const clampedCps = Math.max(9, Math.min(28, observedBaseCps));
              cpsRef.current = cpsRef.current * 0.4 + clampedCps * 0.6;
            }
          }

          progressRef.current = sliceEndPct;
          setProgress(sliceEndPct);
          setActiveWordIndex(cue.endWordIndex);

          if (cueIdx + 1 < cues.length) {
            speakCue(cueIdx + 1, 0, false);
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
          if (timerRef.current === null) {
            progressRef.current = sliceStartPct;
            setProgress(sliceStartPct);
            setActiveWordIndex(firstGlobalWord);
            startWordClock();
          }
        };

        // Hold timer until onstart fires, with 1.5s max wait guard for slow TTS init
        startTimeoutRef.current = window.setTimeout(() => {
          if (sessionId !== playbackSessionRef.current || !isPlayingRef.current || onStartFired) {
            return;
          }
          startWordClock();
        }, START_WAIT_TIMEOUT_MS);

        window.speechSynthesis.speak(utterance);
      };

      // Small 20ms yield after cancel() avoids Chrome's synchronous cancel+speak drop bug
      speakDelayRef.current = window.setTimeout(() => {
        speakCue(startCueIdx, startWordOffset, !isSupported);
      }, 20);
    },
    [activeIndex, availableVoices, cancelSpeech, clearTimers, isSupported, segments, selectedVoiceUri]
  );

  const play = useCallback(() => {
    const startFrom = progressRef.current >= 98 ? 0 : progressRef.current;
    startPlaybackFrom(startFrom);
  }, [startPlaybackFrom]);

  const pause = useCallback(() => {
    cancelSpeech();
  }, [cancelSpeech]);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [pause, play]);

  const stop = useCallback(() => {
    cancelSpeech();
    progressRef.current = 0;
    setProgress(0);
    setActiveWordIndex(null);
  }, [cancelSpeech]);

  const setSpeed = useCallback(
    (rate: PlaybackSpeed) => {
      setSpeedState(rate);
      speedRef.current = rate;
      if (isPlayingRef.current) {
        startPlaybackFrom(progressRef.current, rate);
      }
    },
    [startPlaybackFrom]
  );

  const seekProgress = useCallback(
    (percent: number) => {
      const clamped = Math.max(0, Math.min(100, percent));
      const segment = segments[activeIndex];
      const cues = segment ? buildSubtitleCues(segment.narration) : [];
      let wordIdx: number | null = null;
      if (cues.length > 0) {
        const cue = cues.find((c) => clamped >= c.startPct && clamped < c.endPct) ?? cues[cues.length - 1];
        const span = Math.max(0.01, cue.endPct - cue.startPct);
        const frac = Math.max(0, Math.min(0.99, (clamped - cue.startPct) / span));
        const offset = Math.min(
          Math.max(0, cue.words.length - 1),
          Math.floor(frac * cue.words.length)
        );
        wordIdx = cue.startWordIndex + offset;
      }

      progressRef.current = clamped;
      setProgress(clamped);
      setActiveWordIndex(wordIdx);
      if (isPlayingRef.current) {
        startPlaybackFrom(clamped, undefined, wordIdx ?? undefined);
      }
    },
    [activeIndex, segments, startPlaybackFrom]
  );

  const seekToWordIndex = useCallback(
    (wordIndex: number) => {
      const segment = segments[activeIndex];
      if (!segment) return;
      const cues = buildSubtitleCues(segment.narration);
      const targetCue =
        cues.find((c) => wordIndex >= c.startWordIndex && wordIndex <= c.endWordIndex) ?? cues[0];
      const pct = targetCue ? targetCue.startPct : 0;
      progressRef.current = pct;
      setProgress(pct);
      setActiveWordIndex(wordIndex);
      if (isPlayingRef.current) {
        startPlaybackFrom(pct, undefined, wordIndex);
      }
    },
    [activeIndex, segments, startPlaybackFrom]
  );

  const selectedVoice = selectedVoiceUri
    ? availableVoices.find((v) => v.voiceURI === selectedVoiceUri)
    : undefined;
  const voiceLabel = !isSupported
    ? 'Mode Teks (Browser tanpa TTS)'
    : selectedVoice
      ? `${selectedVoice.name} (${selectedVoice.lang})`
      : 'Default Sistem (id-ID)';

  return {
    isSupported,
    hasIndonesianVoice,
    isPlaying,
    progress,
    activeWordIndex,
    speed,
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
