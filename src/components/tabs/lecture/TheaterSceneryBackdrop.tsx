import type { ClusterId } from '../../../types/rigbench';

interface TheaterSceneryBackdropProps {
  clusterId: ClusterId;
  isPlaying: boolean;
  progress: number;
}

interface SceneryTheme {
  label: string;
  primaryGlow: string;
  secondaryGlow: string;
  gridColor: string;
  accentHex: string;
  deskTint: string;
  particleHex: string;
}

const CLUSTER_THEMES: Record<ClusterId, SceneryTheme> = {
  'cluster-1': {
    label: 'Sapphire Mainboard Lab',
    primaryGlow: 'rgba(37, 99, 235, 0.34)',
    secondaryGlow: 'rgba(56, 189, 248, 0.22)',
    gridColor: 'rgba(56, 189, 248, 0.16)',
    accentHex: '#38BDF8',
    deskTint: '#07142C',
    particleHex: '#7DD3FC',
  },
  'cluster-2': {
    label: 'Silicon Cleanroom Vault',
    primaryGlow: 'rgba(99, 102, 241, 0.32)',
    secondaryGlow: 'rgba(56, 189, 248, 0.24)',
    gridColor: 'rgba(129, 140, 248, 0.18)',
    accentHex: '#818CF8',
    deskTint: '#0A1330',
    particleHex: '#A5B4FC',
  },
  'cluster-3': {
    label: 'High-Voltage PSU Bench',
    primaryGlow: 'rgba(245, 158, 11, 0.24)',
    secondaryGlow: 'rgba(37, 99, 235, 0.28)',
    gridColor: 'rgba(245, 158, 11, 0.16)',
    accentHex: '#F59E0B',
    deskTint: '#14131E',
    particleHex: '#FCD34D',
  },
  'cluster-4': {
    label: 'Storage Platter Vault',
    primaryGlow: 'rgba(16, 185, 129, 0.26)',
    secondaryGlow: 'rgba(37, 99, 235, 0.28)',
    gridColor: 'rgba(52, 211, 153, 0.15)',
    accentHex: '#34D399',
    deskTint: '#071B22',
    particleHex: '#6EE7B7',
  },
  'cluster-5': {
    label: 'Diagnostic Recovery Room',
    primaryGlow: 'rgba(14, 165, 233, 0.30)',
    secondaryGlow: 'rgba(16, 185, 129, 0.20)',
    gridColor: 'rgba(56, 189, 248, 0.17)',
    accentHex: '#38BDF8',
    deskTint: '#071828',
    particleHex: '#67E8F9',
  },
  'cluster-6': {
    label: 'Oscilloscope Electronics Bench',
    primaryGlow: 'rgba(20, 184, 166, 0.28)',
    secondaryGlow: 'rgba(245, 158, 11, 0.18)',
    gridColor: 'rgba(45, 212, 191, 0.16)',
    accentHex: '#2DD4BF',
    deskTint: '#081B24',
    particleHex: '#5EEAD4',
  },
  'cluster-7': {
    label: 'Cyber Shield Ops Stage',
    primaryGlow: 'rgba(139, 92, 246, 0.30)',
    secondaryGlow: 'rgba(244, 63, 94, 0.18)',
    gridColor: 'rgba(167, 139, 250, 0.16)',
    accentHex: '#A78BFA',
    deskTint: '#120D26',
    particleHex: '#C4B5FD',
  },
};

const AMBIENT_PARTICLES = [
  { x: 9, y: 20, r: 2.2, delay: '0s', dur: '7.2s' },
  { x: 18, y: 66, r: 1.8, delay: '-2.1s', dur: '8.4s' },
  { x: 29, y: 34, r: 2.5, delay: '-1.3s', dur: '6.8s' },
  { x: 42, y: 16, r: 1.9, delay: '-4.2s', dur: '9.1s' },
  { x: 58, y: 24, r: 2.3, delay: '-0.8s', dur: '7.6s' },
  { x: 71, y: 40, r: 2.0, delay: '-3.5s', dur: '8.2s' },
  { x: 83, y: 19, r: 2.4, delay: '-2.6s', dur: '7.0s' },
  { x: 91, y: 62, r: 1.7, delay: '-5.0s', dur: '8.8s' },
];

/**
 * Rich layered futuristic computer lab + neon hardware workbench backdrop
 * that dynamically adapts its architectural silhouette and lighting to each
 * of the 7 STMIK AKI curriculum clusters. 100% vector GPU-friendly (0 KB raster bloat).
 */
export function TheaterSceneryBackdrop({
  clusterId,
  isPlaying,
  progress,
}: TheaterSceneryBackdropProps) {
  const theme = CLUSTER_THEMES[clusterId] ?? CLUSTER_THEMES['cluster-1'];
  const sweepOffset = -12 + (progress / 100) * 24;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      style={{
        background: `radial-gradient(ellipse 82% 62% at 50% 18%, ${theme.primaryGlow} 0%, rgba(4, 8, 18, 0.92) 72%, #02050C 100%)`,
      }}
    >
      {/* Dynamic Aurora Light Wash (smooth GPU drift synchronized to narration) */}
      <div
        className={`absolute -inset-x-16 -top-24 h-72 rounded-full opacity-80 transition-transform duration-700 will-change-transform ${
          isPlaying ? 'theater-aurora-breathe' : ''
        }`}
        style={{
          background: `radial-gradient(ellipse 65% 65% at 50% 50%, ${theme.secondaryGlow} 0%, transparent 72%)`,
          transform: `translate3d(${sweepOffset.toFixed(1)}px, 0, 0)`,
        }}
      />

      {/* Architectural Lab & Hardware Workbench Scene SVG */}
      <svg
        viewBox="0 0 1200 540"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id={`desk-grad-${clusterId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.deskTint} stopOpacity="0.18" />
            <stop offset="100%" stopColor="#02050C" stopOpacity="0.96" />
          </linearGradient>
          <linearGradient id={`beam-grad-${clusterId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.accentHex} stopOpacity="0.18" />
            <stop offset="100%" stopColor={theme.accentHex} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Overhead Studio Projector Beam */}
        <polygon
          points="330,0 870,0 1090,410 110,410"
          fill={`url(#beam-grad-${clusterId})`}
        />

        {/* Perspective Workbench Floor Horizon */}
        <rect x="0" y="380" width="1200" height="160" fill={`url(#desk-grad-${clusterId})`} />
        <line
          x1="0"
          y1="380"
          x2="1200"
          y2="380"
          stroke={theme.accentHex}
          strokeOpacity="0.34"
          strokeWidth="1.5"
        />

        {/* Perspective Architectural Floor Grid */}
        <g stroke={theme.gridColor} strokeWidth="1">
          <line x1="0" y1="406" x2="1200" y2="406" />
          <line x1="0" y1="438" x2="1200" y2="438" />
          <line x1="0" y1="482" x2="1200" y2="482" />
          {[-420, -240, -90, 60, 210, 360, 510, 660, 810, 960, 1110, 1260, 1440].map((bx) => (
            <line key={bx} x1={600 + (bx - 600) * 0.42} y1="380" x2={bx} y2="540" />
          ))}
        </g>

        {/* Cluster-Specific Hardware Lab Silhouettes (Left & Right Flanks) */}
        {clusterId === 'cluster-1' && (
          <g stroke={theme.accentHex} strokeOpacity="0.24" fill="none" strokeWidth="1.4">
            {/* Left PCB Trace Silhouette */}
            <path d="M24 120 H120 L155 155 H210 M24 165 H92 L130 205 H195 M24 260 H135 L168 292 H230" />
            <circle cx="210" cy="155" r="4" fill={theme.accentHex} fillOpacity="0.35" />
            <circle cx="195" cy="205" r="4" fill={theme.accentHex} fillOpacity="0.35" />
            <rect x="46" y="302" width="74" height="58" rx="8" fill="#061229" fillOpacity="0.55" />
            {/* Right Rack + Socket Silhouette */}
            <path d="M1176 135 H1080 L1042 173 H988 M1176 225 H1065 L1030 260 H970" />
            <circle cx="988" cy="173" r="4" fill={theme.accentHex} fillOpacity="0.35" />
            <rect x="1068" y="294" width="84" height="68" rx="10" fill="#061229" fillOpacity="0.55" />
          </g>
        )}

        {clusterId === 'cluster-2' && (
          <g stroke={theme.accentHex} strokeOpacity="0.26" fill="none" strokeWidth="1.3">
            {/* Left Silicon Wafer Concentric Circles */}
            <circle cx="110" cy="210" r="95" />
            <circle cx="110" cy="210" r="64" strokeDasharray="6 6" />
            <rect x="74" y="174" width="72" height="72" rx="8" fill="#0A1538" fillOpacity="0.48" />
            {/* Right RAM DIMM Stack Silhouettes */}
            <rect x="1032" y="138" width="136" height="24" rx="4" fill="#0A1538" fillOpacity="0.48" />
            <rect x="1048" y="176" width="120" height="24" rx="4" fill="#0A1538" fillOpacity="0.48" />
            <rect x="1018" y="214" width="150" height="24" rx="4" fill="#0A1538" fillOpacity="0.48" />
          </g>
        )}

        {clusterId === 'cluster-3' && (
          <g stroke={theme.accentHex} strokeOpacity="0.28" fill="none" strokeWidth="1.5">
            {/* Sine Wave Power Rail Traces */}
            <path d="M0 190 Q60 140 120 190 T240 190" />
            <path d="M960 215 Q1020 165 1080 215 T1200 215" />
            {/* Left/Right ATX Harness Lines */}
            <rect x="44" y="250" width="96" height="106" rx="10" fill="#17141F" fillOpacity="0.55" />
            <circle cx="92" cy="303" r="32" strokeDasharray="8 5" />
            <rect x="1060" y="268" width="92" height="86" rx="10" fill="#17141F" fillOpacity="0.55" />
          </g>
        )}

        {clusterId === 'cluster-4' && (
          <g stroke={theme.accentHex} strokeOpacity="0.26" fill="none" strokeWidth="1.4">
            {/* Left HDD Platter Rings */}
            <circle cx="122" cy="238" r="88" fill="#071B22" fillOpacity="0.45" />
            <circle cx="122" cy="238" r="56" />
            <circle cx="122" cy="238" r="22" />
            <line x1="184" y1="312" x2="122" y2="238" strokeWidth="2.5" />
            {/* Right Storage Bay Slots */}
            <rect x="1028" y="142" width="136" height="36" rx="6" fill="#071B22" fillOpacity="0.5" />
            <rect x="1028" y="192" width="136" height="36" rx="6" fill="#071B22" fillOpacity="0.5" />
            <rect x="1028" y="242" width="136" height="36" rx="6" fill="#071B22" fillOpacity="0.5" />
          </g>
        )}

        {clusterId === 'cluster-5' && (
          <g stroke={theme.accentHex} strokeOpacity="0.26" fill="none" strokeWidth="1.4">
            {/* Left Terminal Monitor Silhouette */}
            <rect x="38" y="146" width="156" height="114" rx="10" fill="#071828" fillOpacity="0.52" />
            <line x1="58" y1="176" x2="152" y2="176" />
            <line x1="58" y1="198" x2="128" y2="198" />
            <line x1="58" y1="220" x2="168" y2="220" />
            {/* Right Diagnostic Checklist Towers */}
            <rect x="1018" y="152" width="144" height="122" rx="10" fill="#071828" fillOpacity="0.52" />
            <circle cx="1044" cy="184" r="7" />
            <line x1="1062" y1="184" x2="1142" y2="184" />
            <circle cx="1044" cy="214" r="7" />
            <line x1="1062" y1="214" x2="1132" y2="214" />
            <circle cx="1044" cy="244" r="7" />
            <line x1="1062" y1="244" x2="1146" y2="244" />
          </g>
        )}

        {clusterId === 'cluster-6' && (
          <g stroke={theme.accentHex} strokeOpacity="0.28" fill="none" strokeWidth="1.5">
            {/* Oscilloscope Wave Left & Right */}
            <path d="M10 220 L55 220 L74 166 L98 272 L122 188 L146 220 L215 220" />
            <path d="M985 220 L1035 220 L1056 174 L1082 266 L1108 192 L1132 220 L1190 220" />
            {/* Multimeter Dial Silhouette */}
            <circle cx="114" cy="316" r="46" fill="#081B24" fillOpacity="0.55" />
            <line x1="114" y1="316" x2="144" y2="294" strokeWidth="2.4" />
          </g>
        )}

        {clusterId === 'cluster-7' && (
          <g stroke={theme.accentHex} strokeOpacity="0.28" fill="none" strokeWidth="1.5">
            {/* Left & Right Layered Hexagonal Cyber Shields */}
            <polygon
              points="116,136 184,164 184,244 116,288 48,244 48,164"
              fill="#120D26"
              fillOpacity="0.52"
            />
            <polygon points="116,160 162,180 162,234 116,264 70,234 70,180" />
            <polygon
              points="1084,136 1152,164 1152,244 1084,288 1016,244 1016,164"
              fill="#120D26"
              fillOpacity="0.52"
            />
            <line x1="1050" y1="210" x2="1118" y2="210" strokeDasharray="5 5" />
          </g>
        )}
      </svg>

      {/* Subtle GPU-Only Ambient Floating Light Motes (Active During Playback) */}
      <div className="absolute inset-0 overflow-hidden">
        {AMBIENT_PARTICLES.map((p, idx) => (
          <span
            key={idx}
            className={`absolute rounded-full will-change-transform ${
              isPlaying ? 'theater-particle-float' : 'opacity-30'
            }`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.r * 2.4}px`,
              height: `${p.r * 2.4}px`,
              backgroundColor: theme.particleHex,
              boxShadow: `0 0 12px ${theme.accentHex}`,
              animationDelay: p.delay,
              animationDuration: p.dur,
            }}
          />
        ))}
      </div>

      {/* Subtle Bottom Horizon Vignette for Diagram Focus */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 92% 84% at 50% 45%, transparent 48%, rgba(2, 5, 12, 0.72) 100%)',
        }}
      />
    </div>
  );
}
