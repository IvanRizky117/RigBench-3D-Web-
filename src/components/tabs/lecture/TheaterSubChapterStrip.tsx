import { CheckCircle } from '@phosphor-icons/react';
import type { LectureSegment } from '../../../types/rigbench';

interface TheaterSubChapterStripProps {
  segments: LectureSegment[];
  activeSegmentIndex: number;
  completedSegmentIds: string[];
  onSelectSegment: (idx: number) => void;
}

export function TheaterSubChapterStrip({
  segments,
  activeSegmentIndex,
  completedSegmentIds,
  onSelectSegment,
}: TheaterSubChapterStripProps) {
  if (segments.length <= 1) return null;

  return (
    <div
      role="tablist"
      aria-label="Daftar sub-bab materi"
      className="flex items-center gap-1 overflow-x-auto border-b border-white/[0.06] bg-[#04070E] px-3 sm:px-5 scrollbar-none"
    >
      {segments.map((seg, idx) => {
        const isActive = idx === activeSegmentIndex;
        const isDone = completedSegmentIds.includes(seg.id);
        return (
          <button
            key={seg.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onSelectSegment(idx)}
            className={`relative flex min-h-[42px] shrink-0 items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
              isActive
                ? 'font-semibold text-[#F8FAFC]'
                : 'font-medium text-[#94A3B8] hover:text-[#E2E8F0]'
            }`}
          >
            <span
              className={`font-mono text-[11px] tabular-nums ${
                isDone
                  ? 'text-[#34D399]'
                  : isActive
                    ? 'text-[#38BDF8]'
                    : 'text-[#64748B]'
              }`}
            >
              {isDone ? <CheckCircle size={14} weight="fill" /> : `0${idx + 1}`}
            </span>

            <span className="max-w-[175px] sm:max-w-[240px] truncate">{seg.title}</span>

            {isActive && (
              <span
                aria-hidden="true"
                className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-[#38BDF8]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
