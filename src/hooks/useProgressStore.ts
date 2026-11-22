import { useCallback, useEffect, useState } from 'react';
import type {
  AssemblyReport,
  ClusterId,
  ExamAttemptSummary,
  LiveBackgroundMode,
  UserProgressStore,
} from '../types/rigbench';

const STORAGE_KEY = 'rigbench_stmik_aki_progress_v1';

const DEFAULT_PROGRESS: UserProgressStore = {
  completedClusters: [],
  inspectedComponents: [],
  assemblyCompleted: false,
  osSimCompleted: false,
  diskSimCompleted: false,
  masteredGlossaryIds: [],
  examHistory: [],
  assemblyHistory: [],
  liveBgMode: 'pcb-flow',
};

const VALID_CLUSTER_IDS = new Set<ClusterId>([
  'cluster-1',
  'cluster-2',
  'cluster-3',
  'cluster-4',
  'cluster-5',
  'cluster-6',
  'cluster-7',
]);

function safeStringArray(input: unknown, maxItems: number, maxLen = 64): string[] {
  if (!Array.isArray(input)) return [];
  const unique = new Set<string>();
  for (const item of input) {
    if (typeof item === 'string' && item.length > 0 && item.length <= maxLen) {
      unique.add(item);
      if (unique.size >= maxItems) break;
    }
  }
  return Array.from(unique);
}

function isValidExamAttempt(item: unknown): item is ExamAttemptSummary {
  if (!item || typeof item !== 'object') return false;
  const rec = item as Record<string, unknown>;
  return (
    typeof rec.id === 'string' &&
    typeof rec.completedAtIso === 'string' &&
    typeof rec.totalScore === 'number' &&
    Number.isFinite(rec.totalScore) &&
    rec.totalScore >= 0 &&
    rec.totalScore <= 100 &&
    typeof rec.essayScorePercent === 'number' &&
    typeof rec.abcScorePercent === 'number' &&
    Array.isArray(rec.essayEvaluations) &&
    Array.isArray(rec.abcEvaluations)
  );
}

function isValidAssemblyReport(item: unknown): item is AssemblyReport {
  if (!item || typeof item !== 'object') return false;
  const rec = item as Record<string, unknown>;
  return (
    typeof rec.id === 'string' &&
    typeof rec.completedAtIso === 'string' &&
    (rec.difficulty === 'practice' || rec.difficulty === 'exam' || rec.difficulty === 'freeroam') &&
    typeof rec.accuracyPercent === 'number' &&
    Number.isFinite(rec.accuracyPercent)
  );
}

function readStorage(): UserProgressStore {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw || raw.length > 250_000) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw, (key, value) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return undefined;
      }
      return value;
    }) as Partial<UserProgressStore> | null;

    if (!parsed || typeof parsed !== 'object') return DEFAULT_PROGRESS;

    const completedClusters = safeStringArray(parsed.completedClusters, 10, 24).filter(
      (id): id is ClusterId => VALID_CLUSTER_IDS.has(id as ClusterId)
    );

    const examHistory = Array.isArray(parsed.examHistory)
      ? parsed.examHistory.filter(isValidExamAttempt).slice(0, 12)
      : [];

    const assemblyHistory = Array.isArray(parsed.assemblyHistory)
      ? parsed.assemblyHistory.filter(isValidAssemblyReport).slice(0, 12)
      : [];

    return {
      completedClusters,
      inspectedComponents: safeStringArray(parsed.inspectedComponents, 40, 48),
      assemblyCompleted: Boolean(parsed.assemblyCompleted),
      osSimCompleted: Boolean(parsed.osSimCompleted),
      diskSimCompleted: Boolean(parsed.diskSimCompleted),
      masteredGlossaryIds: safeStringArray(parsed.masteredGlossaryIds, 60, 48),
      examHistory,
      assemblyHistory,
      liveBgMode: parsed.liveBgMode === 'cozy-desk' ? 'cozy-desk' : 'pcb-flow',
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function useProgressStore() {
  const [progress, setProgress] = useState<UserProgressStore>(() => readStorage());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage quota issues gracefully
    }
  }, [progress]);

  const toggleClusterComplete = useCallback((clusterId: ClusterId) => {
    setProgress((prev) => {
      const exists = prev.completedClusters.includes(clusterId);
      return {
        ...prev,
        completedClusters: exists
          ? prev.completedClusters.filter((id) => id !== clusterId)
          : [...prev.completedClusters, clusterId],
      };
    });
  }, []);

  const markClusterComplete = useCallback((clusterId: ClusterId) => {
    setProgress((prev) => {
      if (prev.completedClusters.includes(clusterId)) return prev;
      return { ...prev, completedClusters: [...prev.completedClusters, clusterId] };
    });
  }, []);

  const recordInspectedComponent = useCallback((componentId: string) => {
    setProgress((prev) => {
      if (prev.inspectedComponents.includes(componentId)) return prev;
      return { ...prev, inspectedComponents: [...prev.inspectedComponents, componentId] };
    });
  }, []);

  const markAssemblyComplete = useCallback(() => {
    setProgress((prev) => (prev.assemblyCompleted ? prev : { ...prev, assemblyCompleted: true }));
  }, []);

  const recordAssemblyReport = useCallback((report: AssemblyReport) => {
    // Keep Free Roam experiments isolated from localStorage Ujian TAS / Latihan score history
    if (report.difficulty === 'freeroam') return;
    setProgress((prev) => ({
      ...prev,
      assemblyCompleted: true,
      assemblyHistory: [report, ...prev.assemblyHistory].slice(0, 12),
    }));
  }, []);

  const markOsSimComplete = useCallback(() => {
    setProgress((prev) => (prev.osSimCompleted ? prev : { ...prev, osSimCompleted: true }));
  }, []);

  const markDiskSimComplete = useCallback(() => {
    setProgress((prev) => (prev.diskSimCompleted ? prev : { ...prev, diskSimCompleted: true }));
  }, []);

  const toggleGlossaryMastered = useCallback((glossaryId: string) => {
    setProgress((prev) => {
      const exists = prev.masteredGlossaryIds.includes(glossaryId);
      return {
        ...prev,
        masteredGlossaryIds: exists
          ? prev.masteredGlossaryIds.filter((id) => id !== glossaryId)
          : [...prev.masteredGlossaryIds, glossaryId],
      };
    });
  }, []);

  const recordExamAttempt = useCallback((attempt: ExamAttemptSummary) => {
    setProgress((prev) => ({
      ...prev,
      examHistory: [attempt, ...prev.examHistory].slice(0, 12),
    }));
  }, []);

  const setLiveBgMode = useCallback((mode: LiveBackgroundMode) => {
    setProgress((prev) => ({ ...prev, liveBgMode: mode }));
  }, []);

  const resetAllProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem('rigbench_completed_segments_v1');
    } catch {
      // Ignore storage error
    }
  }, []);

  return {
    progress,
    toggleClusterComplete,
    markClusterComplete,
    recordInspectedComponent,
    markAssemblyComplete,
    recordAssemblyReport,
    markOsSimComplete,
    markDiskSimComplete,
    toggleGlossaryMastered,
    recordExamAttempt,
    setLiveBgMode,
    resetAllProgress,
  };
}

