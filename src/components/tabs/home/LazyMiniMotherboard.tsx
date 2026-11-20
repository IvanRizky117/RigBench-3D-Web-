import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowRight, Cube } from '@phosphor-icons/react';

const LazyMiniCanvas = lazy(() =>
  import('../../3d/MiniMotherboardCanvas').then((m) => ({
    default: m.MiniMotherboardCanvas,
  }))
);

interface LazyMiniMotherboardProps {
  onOpenFullLab: () => void;
}

/**
 * Viewport-triggered lazy boundary for the Home 3D Motherboard preview.
 * Prevents Three.js from downloading on initial paint, making First Contentful Paint
 * instant on budget Android phones (Infinix benchmark) while preserving full 3D fidelity.
 */
export function LazyMiniMotherboard({ onOpenFullLab }: LazyMiniMotherboardProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad) return;
    const node = sentinelRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '40px 0px', threshold: 0.05 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldLoad]);

  const fallbackCard = (
    <div className="datacore-card relative flex h-[320px] w-full flex-col overflow-hidden rounded-2xl lg:h-full lg:min-h-[340px]">
      <div className="flex items-center justify-between border-b border-[#3B82F6]/15 bg-[#040915]/90 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <Cube size={15} weight="duotone" className="text-[#38BDF8]" />
          <span className="font-medium text-[#F8FAFC]">Lab 3D Interaktif</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-[11px] text-[#38BDF8]">AKI-915P</span>
        </div>
        <button
          type="button"
          onClick={onOpenFullLab}
          className="inline-flex min-h-[36px] items-center gap-1 text-xs font-medium text-[#38BDF8] hover:text-[#7DD3FC] whitespace-nowrap"
        >
          Buka Lab 3D
          <ArrowRight size={13} weight="bold" />
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-2.5 bg-[#030814] p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#38BDF8]/30 bg-[#2563EB]/15 text-[#38BDF8]">
          <Cube size={24} weight="duotone" />
        </div>
        <p className="text-xs font-medium text-[#E2E8F0]">Menyiapkan Pratinjau 3D Motherboard...</p>
        <p className="font-mono text-[11px] text-[#64748B]">24 Titik Komponen · PBR Studio</p>
      </div>
      <div className="flex items-center justify-between border-t border-[#3B82F6]/15 bg-[#040915]/90 px-4 py-2.5 font-mono text-[11px] text-[#94A3B8]">
        <span>Mode Hemat Muat Awal</span>
        <span className="text-[#38BDF8]">24 Titik + C-Panel</span>
      </div>
    </div>
  );

  return (
    <div ref={sentinelRef} className="h-full w-full">
      {shouldLoad ? (
        <Suspense fallback={fallbackCard}>
          <LazyMiniCanvas onOpenFullLab={onOpenFullLab} />
        </Suspense>
      ) : (
        fallbackCard
      )}
    </div>
  );
}
