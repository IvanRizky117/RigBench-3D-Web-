import { useEffect, useState } from 'react';
import { CheckCircle, Clock, Warning } from '@phosphor-icons/react';
import { CURRICULUM_CLUSTERS } from '../../data/curriculumData';
import type { ClusterId } from '../../types/rigbench';
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

  const [segmentIndex, setSegmentIndex] = useState(0);

  useEffect(() => {
    setSegmentIndex(0);
  }, [activeClusterId]);

  const speech = useSpeechLecture({
    segments: cluster.segments,
    activeIndex: segmentIndex,
    onSegmentComplete: (nextIdx) => {
      setSegmentIndex(nextIdx);
    },
  });

  const isCompleted = completedClusters.includes(cluster.id);

  return (
    <div className="space-y-6 pb-24 md:pb-16">
      {/* Compact 7-Cluster Selector Strip (Zero Wall-of-Text, 44px+ touch targets) */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {CURRICULUM_CLUSTERS.map((item) => {
          const active = item.id === cluster.id;
          const done = completedClusters.includes(item.id);
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
                {done ? (
                  <CheckCircle size={13} weight="fill" className="text-[#10B981]" />
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

      {/* Main Theater Motion-Lecture Stage (Dynamic Per-Cluster Scenery + Single-Line Subtitle) */}
      <TheaterStagePlayer
        clusterId={cluster.id}
        clusterTitle={cluster.title}
        clusterNumber={cluster.number}
        segments={cluster.segments}
        activeSegmentIndex={segmentIndex}
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
