import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { detectDeviceTier } from '../../utils/deviceTier';

interface AnimatedSapphireBeamsProps {
  className?: string;
  fixedFullPage?: boolean;
  /** Softer intensity for reading/exam tabs (Materi & Ujian) */
  dimmed?: boolean;
}

function ScrollAuroraLayers({
  dimmed,
  reducedMotion,
}: {
  dimmed: boolean;
  reducedMotion: boolean;
}) {
  const { scrollYProgress } = useScroll();
  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    restDelta: 0.001,
  });

  const topGlowX = useTransform(smoothScroll, [0, 1], ['0vw', '-14vw']);
  const topGlowY = useTransform(smoothScroll, [0, 1], ['0vh', '16vh']);
  const topGlowScale = useTransform(smoothScroll, [0, 0.5, 1], [1, 1.08, 0.96]);

  const leftGlowX = useTransform(smoothScroll, [0, 1], ['0vw', '16vw']);
  const leftGlowY = useTransform(smoothScroll, [0, 1], ['0vh', '-12vh']);

  const sweepRotate = useTransform(smoothScroll, [0, 1], [-24, -14]);
  const sweepY = useTransform(smoothScroll, [0, 1], ['0vh', '-10vh']);

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-500 ${
        dimmed ? 'opacity-40' : 'opacity-100'
      }`}
    >
      {/* Top-Right Deep Royal Sapphire Aurora Wash */}
      <motion.div
        className="absolute -top-[26vh] -right-[14vw] h-[88vh] w-[76vw] rounded-full will-change-transform"
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
        className="absolute top-[36vh] -left-[22vw] h-[82vh] w-[76vw] rounded-full will-change-transform"
        style={{
          background:
            'radial-gradient(ellipse at 48% 52%, rgba(30, 64, 175, 0.22) 0%, rgba(56, 189, 248, 0.08) 42%, rgba(2, 5, 12, 0) 72%)',
          x: reducedMotion ? 0 : leftGlowX,
          y: reducedMotion ? 0 : leftGlowY,
        }}
      />

      {/* Subtle Diagonal Sapphire Light Sweep */}
      <motion.div
        className="absolute -top-[20vh] left-[18vw] h-[145vh] w-[42vw] will-change-transform"
        style={{
          background:
            'linear-gradient(90deg, rgba(2, 5, 12, 0) 0%, rgba(37, 99, 235, 0.09) 46%, rgba(56, 189, 248, 0.08) 54%, rgba(2, 5, 12, 0) 100%)',
          rotate: reducedMotion ? -24 : sweepRotate,
          y: reducedMotion ? 0 : sweepY,
        }}
      />

      {/* Extended Bottom Sapphire Anchor Glow reaching past Bottom Dock Bleed */}
      <div
        className="absolute inset-x-0 bottom-0 h-[56vh]"
        style={{
          background:
            'radial-gradient(ellipse 90% 85% at 50% 100%, rgba(37, 99, 235, 0.18) 0%, rgba(29, 78, 216, 0.08) 48%, rgba(2, 5, 12, 0) 82%)',
        }}
      />
    </div>
  );
}

function LightweightCssAuroraLayers({
  dimmed,
  reducedMotion,
}: {
  dimmed: boolean;
  reducedMotion: boolean;
}) {
  return (
    <div
      className={`absolute inset-0 transition-opacity duration-500 ${
        dimmed ? 'opacity-40' : 'opacity-100'
      }`}
    >
      {/* Lightweight Compositor-Only Top-Right Sapphire Wash */}
      <div
        className={`absolute -top-[22vh] -right-[16vw] h-[78vh] w-[82vw] rounded-full ${
          reducedMotion ? '' : 'aurora-gpu-drift-a'
        }`}
        style={{
          background:
            'radial-gradient(ellipse at 50% 48%, rgba(37, 99, 235, 0.25) 0%, rgba(29, 78, 216, 0.13) 40%, rgba(2, 5, 12, 0) 74%)',
        }}
      />

      {/* Lightweight Compositor-Only Lower Horizon & Extended Bottom Bleed Glow */}
      <div
        className={`absolute top-[38vh] -left-[22vw] h-[86vh] w-[96vw] rounded-full ${
          reducedMotion ? '' : 'aurora-gpu-drift-b'
        }`}
        style={{
          background:
            'radial-gradient(ellipse at 48% 55%, rgba(30, 64, 175, 0.22) 0%, rgba(56, 189, 248, 0.08) 44%, rgba(2, 5, 12, 0) 76%)',
        }}
      />

      {/* Seamless Bottom Anchor Glow extending past Chrome Android URL bar collapse bleed */}
      <div
        className="absolute inset-x-0 bottom-0 h-[56vh]"
        style={{
          background:
            'radial-gradient(ellipse 95% 88% at 50% 100%, rgba(37, 99, 235, 0.18) 0%, rgba(29, 78, 216, 0.08) 50%, rgba(2, 5, 12, 0) 84%)',
        }}
      />
    </div>
  );
}

/**
 * Ultra-dark cinematic Aurora Sapphire color gradient backdrop over #02050C.
 * Uses 100lvh + 104px bottom bleed without contain:strict so Chrome Android's
 * collapsing URL bar never reveals a black gap above the bottom dock.
 */
export function AnimatedSapphireBeams({
  className = '',
  fixedFullPage = true,
  dimmed = false,
}: AnimatedSapphireBeamsProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const isLowTier = detectDeviceTier().tier === 'low';

  const positionClass = fixedFullPage
    ? 'fixed inset-x-0 top-0 h-[calc(100lvh+104px)] min-h-screen z-0'
    : 'absolute inset-0';

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none overflow-hidden select-none bg-[#02050C] ${positionClass} ${className}`}
    >
      {isLowTier ? (
        <LightweightCssAuroraLayers dimmed={dimmed} reducedMotion={reducedMotion} />
      ) : (
        <ScrollAuroraLayers dimmed={dimmed} reducedMotion={reducedMotion} />
      )}
    </div>
  );
}
