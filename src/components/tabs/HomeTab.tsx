import { useRef } from 'react';
import { ArrowRight, BookOpen } from '@phosphor-icons/react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import type { ClusterId, TabId, UserProgressStore } from '../../types/rigbench';
import { HomeBentoGrid } from './home/HomeBentoGrid';
import { HomeFeatureSections } from './home/HomeFeatureSections';
import { PWAInstallButton } from '../ui/PWAInstallButton';

interface HomeTabProps {
  progress: UserProgressStore;
  onNavigateTab: (tab: TabId) => void;
  onOpenCluster: (clusterId: ClusterId) => void;
  onResetProgress: () => void;
}

const SNAPPY_EASE = [0.22, 1, 0.36, 1] as const;

export function HomeTab({
  progress,
  onNavigateTab,
  onOpenCluster,
  onResetProgress,
}: HomeTabProps) {
  const heroRef = useRef<HTMLElement | null>(null);
  const reducedMotion = Boolean(useReducedMotion());

  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // GPU-only Hero scroll-out choreography
  const heroY = useTransform(heroScrollProgress, [0, 1], [0, -56]);
  const heroScale = useTransform(heroScrollProgress, [0, 1], [1, 0.96]);
  const heroOpacity = useTransform(heroScrollProgress, [0, 0.78], [1, 0]);
  const indicatorOpacity = useTransform(heroScrollProgress, [0, 0.25], [1, 0]);

  const scrollToBento = () => {
    const target = document.getElementById('rigbench-bento-showcase');
    if (target) {
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  };

  return (
    <div className="relative overflow-x-clip pb-28 md:pb-16">
      {/* Full-Viewport Centered Hero (2-Line Clean White + Smooth Cyan-Blue Gradient, Royal Sapphire CTA) */}
      <section
        ref={heroRef}
        className="relative flex min-h-[82vh] sm:min-h-[88vh] flex-col items-center justify-center px-4 pb-16 pt-6 text-center sm:px-6 lg:px-8"
      >
        <motion.div
          className="mx-auto max-w-4xl will-change-transform"
          style={
            reducedMotion
              ? undefined
              : {
                  y: heroY,
                  scale: heroScale,
                  opacity: heroOpacity,
                }
          }
        >
          <motion.h1
            initial={reducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: SNAPPY_EASE }}
            className="mx-auto max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.03em] sm:text-6xl lg:text-[64px]"
          >
            <span className="block text-[#F8FAFC]">Arsitektur PC.</span>
            <span className="shiny-gradient-headline mt-1 inline-block">Tervisualisasi.</span>
          </motion.h1>

          <motion.p
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: SNAPPY_EASE }}
            className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-[#94A3B8] sm:text-base"
          >
            Platform interaktif Praktikum Hardware-Software STMIK AKI dengan teater visual, lab 3D
            motherboard, dan uji pemahaman otomatis.
          </motion.p>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16, ease: SNAPPY_EASE }}
            className="mt-9 flex flex-wrap items-center justify-center gap-4"
          >
            <motion.button
              type="button"
              onClick={() => onNavigateTab('lecture')}
              whileHover={reducedMotion ? undefined : { y: -2, scale: 1.015 }}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="sapphire-btn inline-flex min-h-[46px] items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium whitespace-nowrap"
            >
              <BookOpen size={17} weight="duotone" />
              <span>Mulai Belajar</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => onNavigateTab('lab3d')}
              whileHover={reducedMotion ? undefined : { x: 2 }}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="inline-flex min-h-[44px] items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#94A3B8] hover:text-[#38BDF8] transition-colors whitespace-nowrap"
            >
              <span>Eksplorasi Lab 3D</span>
              <ArrowRight size={14} weight="bold" />
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Subtle Bottom Scroll Indicator */}
        <motion.button
          type="button"
          onClick={scrollToBento}
          style={reducedMotion ? undefined : { opacity: indicatorOpacity }}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.28, ease: SNAPPY_EASE }}
          className="group absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[11px] font-medium tracking-wide text-[#64748B] hover:text-[#38BDF8] transition-colors focus:outline-none"
        >
          <span>Scroll untuk eksplorasi</span>
          <span className="relative h-8 w-[2px] overflow-hidden rounded-full bg-[#3B82F6]/20">
            <motion.span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-4 rounded-full bg-gradient-to-b from-transparent via-[#38BDF8] to-[#2563EB]"
              animate={
                reducedMotion
                  ? { y: 8 }
                  : {
                      y: [-16, 32],
                      opacity: [0, 1, 0],
                    }
              }
              transition={
                reducedMotion
                  ? undefined
                  : {
                      duration: 1.6,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }
              }
            />
          </span>
        </motion.button>
      </section>

      {/* Complete DataCore Bento Showcase + Cara Kerja + Kenapa RigBench + Closing CTA */}
      <div id="rigbench-bento-showcase" className="scroll-mt-24 space-y-24 pt-2">
        <HomeBentoGrid
          progress={progress}
          onNavigateTab={onNavigateTab}
          onOpenCluster={onOpenCluster}
          onResetProgress={onResetProgress}
        />

        <HomeFeatureSections onNavigateTab={onNavigateTab} />
      </div>

      {/* Quiet Minimal Footer with Optional PWA Install Action */}
      <footer className="mx-auto mt-20 max-w-6xl border-t border-[#3B82F6]/15 px-4 pt-7 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 text-xs text-[#64748B] sm:flex-row">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <span className="font-medium text-[#94A3B8] text-center sm:text-left">
              RigBench · Praktikum Hardware-Software STMIK AKI
            </span>
            <PWAInstallButton compact />
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => onNavigateTab('lecture')}
              className="min-h-[44px] inline-flex items-center hover:text-[#38BDF8] transition-colors"
            >
              Materi
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('lab3d')}
              className="min-h-[44px] inline-flex items-center hover:text-[#38BDF8] transition-colors"
            >
              Lab 3D
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('exam')}
              className="min-h-[44px] inline-flex items-center hover:text-[#38BDF8] transition-colors"
            >
              Try Out
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
