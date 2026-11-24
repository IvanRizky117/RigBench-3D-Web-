import { useEffect, useState } from 'react';
import { CheckCircle, Clock, Warning } from '@phosphor-icons/react';
import { CURRICULUM_CLUSTERS, getClusterTrack } from '../../data/curriculumData';
import { MATERIAL_TRACKS } from '../../data/extraCurriculumData';
import type { ClusterId, MaterialTrackId } from '../../types/rigbench';
import { useSpeechLecture } from '../../hooks/useSpeechLecture';
import { TheaterStagePlayer } from './lecture/TheaterStagePlayer';
import { ClusterInteractiveLabs } from './lecture/ClusterInteractiveLabs';

interface LectureTabProps {
  activeClusterId: ClusterId;
  onSelectCluster: (id: ClusterId) => void;
  completedClusters: ClusterId[];
  onToggleClusterComplete: (id: ClusterId) => void;
  onJumpTo3DComponent: (componentId: string) => void;
  onNotify: (title: string, description: string, variant?: 'info' | 'success' | 'warning') => void;
}

const COMPLETED_SEGMENTS_KEY = 'rigbench_completed_segments_v1';

function readCompletedSegments(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(COMPLETED_SEGMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function LectureTab({
  activeClusterId,
  onSelectCluster,
  completedClusters,
  onToggleClusterComplete,
  onJumpTo3DComponent,
  onNotify,
}: LectureTabProps) {
  const cluster =
    CURRICULUM_CLUSTERS.find((c) => c.id === activeClusterId) ?? CURRICULUM_CLUSTERS[0];
  const activeTrack: MaterialTrackId = getClusterTrack(cluster.id);
  const trackClusters = CURRICULUM_CLUSTERS.filter((c) => getClusterTrack(c.id) === activeTrack);
  const activeTrackMeta =
    MATERIAL_TRACKS.find((t) => t.id === activeTrack) ?? MATERIAL_TRACKS[0];

  const [segmentIndex, setSegmentIndex] = useState(0);
  const [completedSegmentIds, setCompletedSegmentIds] = useState<string[]>(readCompletedSegments);

  useEffect(() => {
    setSegmentIndex(0);
  }, [activeClusterId]);

  const handleSelectTrack = (trackId: MaterialTrackId) => {
    if (trackId === activeTrack) return;
    const firstCluster = CURRICULUM_CLUSTERS.find((c) => getClusterTrack(c.id) === trackId);
    if (firstCluster) {
      onSelectCluster(firstCluster.id);
    }
  };

  const speech = useSpeechLecture({
    segments: cluster.segments,
    activeIndex: segmentIndex,
    autoPlayNextOnComplete: true,
    onSegmentComplete: (nextIdx) => {
      setSegmentIndex(nextIdx);
    },
    onSegmentFinished: (finishedId) => {
      setCompletedSegmentIds((prev) => {
        if (prev.includes(finishedId)) return prev;
        const next = [...prev, finishedId];
        try {
          window.localStorage.setItem(COMPLETED_SEGMENTS_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage quota errors
        }
        return next;
      });
    },
    onFallbackNotice: (reason) => {
      const isAutoplayBlocked = /putar otomatis|ketuk tombol putar/i.test(reason);
      onNotify(
        isAutoplayBlocked ? 'Ketuk Putar untuk Suara AI' : 'Mode Suara Lokal',
        reason,
        'info'
      );
    },
  });

  const isCompleted = completedClusters.includes(cluster.id);

  return (
    <div className="space-y-6 pb-24 md:pb-16">
      {/* 3 Sub-Tab Switcher: Praktikum PC · Arsitektur Komputer · Sejarah PC */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Sub-tab topik materi"
          className="inline-flex flex-wrap gap-1 rounded-xl bg-[#070D1B] p-1 border border-white/[0.08]"
        >
          {MATERIAL_TRACKS.map((track) => {
            const trackItems = CURRICULUM_CLUSTERS.filter((c) => getClusterTrack(c.id) === track.id);
            const trackDoneCount = trackItems.filter((c) => completedClusters.includes(c.id)).length;
            const selected = track.id === activeTrack;
            return (
              <button
                key={track.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => handleSelectTrack(track.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all press-feedback ${
                  selected
                    ? 'bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white shadow-[0_0_18px_rgba(37,99,235,0.35)]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <span>{track.label}</span>
                <span
                  className={`font-mono text-[11px] tabular-nums ${
                    selected ? 'text-[#BAE6FD]' : 'text-[#64748B]'
                  }`}
                >
                  {trackDoneCount}/{trackItems.length}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-[#94A3B8]">
          <span className="font-mono font-semibold text-[#38BDF8]">{activeTrackMeta.sourceLabel}</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>{activeTrackMeta.subtitle}</span>
        </p>
      </div>

      {/* Dynamic Cluster Selector Strip for Active Sub-Tab */}
      <div
        className={`grid gap-2 ${
          trackClusters.length >= 6
            ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-7'
            : 'grid-cols-1 sm:grid-cols-3'
        }`}
      >
        {trackClusters.map((item) => {
          const active = item.id === cluster.id;
          const done = completedClusters.includes(item.id);
          const doneCount = item.segments.filter((s) => completedSegmentIds.includes(s.id)).length;
          const totalSec = item.segments.reduce((acc, s) => acc + s.durationSec, 0);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectCluster(item.id)}
              className={`min-h-[54px] rounded-xl px-3 py-2.5 text-left transition-all press-feedback ${
                active
                  ? 'border border-[#38BDF8]/55 bg-gradient-to-br from-[#2563EB]/30 to-[#0B1730] shadow-[0_0_24px_rgba(37,99,235,0.28)]'
                  : 'datacore-card hover:border-[#3B82F6]/35'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`font-mono text-[11px] font-semibold tabular-nums ${
                    active ? 'text-[#38BDF8]' : 'text-[#64748B]'
                  }`}
                >
                  {item.number}
                </span>
                {done || (doneCount > 0 && doneCount === item.segments.length) ? (
                  <CheckCircle size={13} weight="fill" className="text-[#10B981]" />
                ) : doneCount > 0 ? (
                  <span className="font-mono text-[10px] font-semibold text-[#34D399] tabular-nums">
                    {doneCount}/{item.segments.length}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-[#64748B] tabular-nums">
                    <Clock size={10} />
                    {Math.max(1, Math.round(totalSec / 60))}m
                  </span>
                )}
              </div>
              <p
                className={`mt-1 truncate text-xs font-medium ${
                  active ? 'text-[#F8FAFC]' : 'text-[#94A3B8]'
                }`}
              >
                {item.shortTitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main 3D Cinematic Hardware Theater Stage + Horizontal Sub-Chapter Strip */}
      <TheaterStagePlayer
        clusterTitle={cluster.title}
        clusterNumber={cluster.number}
        segments={cluster.segments}
        activeSegmentIndex={segmentIndex}
        completedSegmentIds={completedSegmentIds}
        onSelectSegment={setSegmentIndex}
        speech={speech}
      />

      {/* Compact Single-Line Bullet Summary & Exam Trap Warning */}
      <div className="datacore-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-[#94A3B8]">
              <span className="font-mono font-semibold text-[#38BDF8]">
                KLASTER {cluster.number}
              </span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>{cluster.ttsWeight}</span>
            </p>
            <h2 className="mt-0.5 text-lg font-medium text-[#F8FAFC] sm:text-xl">
              {cluster.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              onToggleClusterComplete(cluster.id);
              onNotify(
                isCompleted ? 'Status Klaster Dibatalkan' : `Klaster ${cluster.number} Selesai`,
                isCompleted
                  ? 'Klaster ditandai kembali untuk dipelajari.'
                  : 'Progres penguasaan klaster disimpan ke browser.',
                isCompleted ? 'info' : 'success'
              );
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium whitespace-nowrap press-feedback ${
              isCompleted
                ? 'bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/35'
                : 'bg-[#0A162D] text-[#E2E8F0] border border-[#3B82F6]/25 hover:border-[#38BDF8]/50'
            }`}
          >
            <CheckCircle size={15} weight={isCompleted ? 'fill' : 'regular'} />
            {isCompleted ? 'Klaster Dikuasai' : 'Tandai Selesai'}
          </button>
        </div>

        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 text-xs sm:text-[13px] leading-relaxed text-[#CBD5E1]">
          {cluster.summaryPoints.map((point) => (
            <li key={point} className="flex items-start gap-2 rounded-xl bg-[#050C1B]/75 px-3 py-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#38BDF8] shrink-0" />
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-start gap-2.5 rounded-xl bg-[#F59E0B]/10 px-3.5 py-2.5 text-xs leading-relaxed text-[#FDE68A] border border-[#F59E0B]/25">
          <Warning size={15} weight="fill" className="mt-0.5 shrink-0 text-[#F59E0B]" />
          <span>{cluster.trapWarning}</span>
        </div>
      </div>

      {/* Dedicated Interactive Practice Lab for Active Cluster (Preserved Intact) */}
      <ClusterInteractiveLabs
        clusterId={cluster.id}
        onJumpTo3DComponent={onJumpTo3DComponent}
        onNotify={onNotify}
      />
    </div>
  );
}
