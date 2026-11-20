import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';

interface AnimatedSapphireBeamsProps {
  className?: string;
  fixedFullPage?: boolean;
  /** Softer intensity for reading/exam tabs (Materi & Ujian) */
  dimmed?: boolean;
}

/**
 * Ultra-dark cinematic Aurora Sapphire color gradient backdrop over #02050C.
 * Pure glowing color washes (zero busy wireframe/network lines) that glide
 * calmly with scroll progress via GPU-only Framer Motion transforms.
 */
export function AnimatedSapphireBeams({
  className = '',
  fixedFullPage = true,
  dimmed = false,
}: AnimatedSapphireBeamsProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll();
  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    restDelta: 0.001,
  });

  // Gentle scroll-linked Aurora drift (GPU translate/scale/rotate only)
  const topGlowX = useTransform(smoothScroll, [0, 1], ['0vw', '-14vw']);
  const topGlowY = useTransform(smoothScroll, [0, 1], ['0vh', '16vh']);
  const topGlowScale = useTransform(smoothScroll, [0, 0.5, 1], [1, 1.08, 0.96]);

  const leftGlowX = useTransform(smoothScroll, [0, 1], ['0vw', '16vw']);
  const leftGlowY = useTransform(smoothScroll, [0, 1], ['0vh', '-12vh']);

  const sweepRotate = useTransform(smoothScroll, [0, 1], [-24, -14]);
  const sweepY = useTransform(smoothScroll, [0, 1], ['0vh', '-10vh']);

  const positionClass = fixedFullPage ? 'fixed inset-0 z-0' : 'absolute inset-0';

  return (
    <div
      aria-hidden="true"
      style={{ contain: 'strict' }}
      className={`pointer-events-none overflow-hidden select-none bg-[#02050C] ${positionClass} ${className}`}
    >
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          dimmed ? 'opacity-40' : 'opacity-100'
        }`}
      >
        {/* Top-Right Deep Royal Sapphire Aurora Wash */}
        <motion.div
          className="absolute -top-[28vh] -right-[14vw] h-[88vh] w-[76vw] rounded-full will-change-transform"
          style={{
            background:
              'radial-gradient(ellipse at 50% 48%, rgba(37, 99, 235, 0.26) 0%, rgba(29, 78, 216, 0.14) 36%, rgba(14, 165, 233, 0.05) 56%, rgba(2, 5, 12, 0) 74%)',
            x: reducedMotion ? 0 : topGlowX,
            y: reducedMotion ? 0 : topGlowY,
            scale: reducedMotion ? 1 : topGlowScale,
          }}
        />

        {/* Lower-Left Indigo & Cyan Atmospheric Horizon */}
        <motion.div
          className="absolute top-[36vh] -left-[22vw] h-[76vh] w-[72vw] rounded-full will-change-transform"
          style={{
            background:
              'radial-gradient(ellipse at 48% 52%, rgba(30, 64, 175, 0.22) 0%, rgba(56, 189, 248, 0.08) 42%, rgba(2, 5, 12, 0) 72%)',
            x: reducedMotion ? 0 : leftGlowX,
            y: reducedMotion ? 0 : leftGlowY,
          }}
        />

        {/* Subtle DataCore Diagonal Sapphire Light Sweep (Calm, Non-Intrusive) */}
        <motion.div
          className="absolute -top-[20vh] left-[18vw] h-[140vh] w-[42vw] will-change-transform"
          style={{
            background:
              'linear-gradient(90deg, rgba(2, 5, 12, 0) 0%, rgba(37, 99, 235, 0.09) 46%, rgba(56, 189, 248, 0.08) 54%, rgba(2, 5, 12, 0) 100%)',
            rotate: reducedMotion ? -24 : sweepRotate,
            y: reducedMotion ? 0 : sweepY,
          }}
        />

        {/* Deep Bottom Obsidian Anchor Glow */}
        <div
          className="absolute inset-x-0 bottom-0 h-[38vh]"
          style={{
            background:
              'radial-gradient(ellipse 65% 80% at 50% 100%, rgba(37, 99, 235, 0.12) 0%, rgba(2, 5, 12, 0) 72%)',
          }}
        />
      </div>
    </div>
  );
}
