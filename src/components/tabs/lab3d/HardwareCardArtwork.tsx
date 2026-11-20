import type { AssemblyStepId } from '../../../types/rigbench';

interface HardwareCardArtworkProps {
  itemId: AssemblyStepId;
  compact?: boolean;
}

/**
 * Ultra-crisp vector hardware illustrations (SVG) for all 23 Real-World Assembly Cards.
 * Zero extra WebGL contexts (anti-context-loss) and razor sharp at every DPI.
 */
export function HardwareCardArtwork({ itemId, compact = false }: HardwareCardArtworkProps) {
  const sizeClass = compact ? 'h-8 w-full' : 'h-14 w-full';
  switch (itemId) {
    case 'open-cpu-lever':
    case 'close-cpu-lever': {
      const isOpening = itemId === 'open-cpu-lever';
      return (
        <svg viewBox="0 0 112 64" className={sizeClass} aria-hidden="true">
          <rect x="26" y="8" width="48" height="48" rx="4" fill="#1E293B" stroke="#94A3B8" strokeWidth="2.5" />
          <rect x="34" y="16" width="32" height="32" rx="2" fill="#0F172A" stroke="#EAB308" strokeWidth="1" strokeDasharray="2 2" />
          <polygon points="36,46 44,46 36,38" fill="#EAB308" />
          <path
            d={isOpening ? 'M78 12 L84 36 L94 22' : 'M78 12 L78 50 L68 54'}
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={isOpening ? 'M94 42 L94 18 M88 24 L94 18 L100 24' : 'M94 18 L94 42 M88 36 L94 42 L100 36'}
            fill="none"
            stroke={isOpening ? '#06B6D4' : '#10B981'}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    case 'install-cpu':
      return (
        <svg viewBox="0 0 112 64" className={sizeClass} aria-hidden="true">
          <defs>
            <linearGradient id="ihsGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="50%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
          </defs>
          <rect x="30" y="6" width="52" height="52" rx="3" fill="#14532D" stroke="#22C55E" strokeWidth="1.2" />
          <polygon points="32,56 44,56 32,44" fill="#FACC15" />
          <rect x="37" y="13" width="38" height="38" rx="4" fill="url(#ihsGrad)" stroke="#64748B" strokeWidth="1.2" />
          <circle cx="30" cy="24" r="2.2" fill="#0B0E14" />
          <circle cx="82" cy="24" r="2.2" fill="#0B0E14" />
          <text x="56" y="31" textAnchor="middle" fill="#1E293B" fontSize="6.5" fontFamily="monospace" fontWeight="700">
            LGA 775
          </text>
          <text x="56" y="40" textAnchor="middle" fill="#334155" fontSize="5" fontFamily="monospace">
            [R] PUTAR
          </text>
        </svg>
      );

    case 'apply-thermal-paste':
      return (
        <svg viewBox="0 0 112 64" className={sizeClass} aria-hidden="true">
          <g transform="rotate(-24 56 32)">
            <rect x="26" y="26" width="46" height="12" rx="2" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.2" />
            <rect x="34" y="28" width="24" height="8" fill="#64748B" />
            <rect x="14" y="29" width="12" height="6" fill="#94A3B8" />
            <rect x="10" y="24" width="4" height="16" rx="1" fill="#38BDF8" />
            <polygon points="72,29 88,31 88,33 72,35" fill="#475569" />
          </g>
          <ellipse cx="86" cy="48" rx="8" ry="5" fill="#9CA3AF" stroke="#E5E7EB" strokeWidth="1" />
        </svg>
      );

    case 'install-heatsink':
      return (
        <svg viewBox="0 0 112 64" className={sizeClass} aria-hidden="true">
          <circle cx="56" cy="32" r="26" fill="#94A3B8" stroke="#E2E8F0" strokeWidth="1.5" />
          <circle cx="56" cy="32" r="22" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
          {[0, 51, 102, 154, 205, 257, 308].map((deg) => (
            <path
              key={deg}
              d="M56 32 Q66 18 75 24 Q68 32 56 32"
              fill="#334155"
              stroke="#64748B"
              strokeWidth="0.7"
              transform={`rotate(${deg} 56 32)`}
            />
          ))}
          <circle cx="56" cy="32" r="8" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
          {[
            [33, 11],
            [79, 11],
            [33, 53],
            [79, 53],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="3.4" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.4" />
          ))}
        </svg>
      );

    case 'lock-heatsink-pins':
      return (
        <svg viewBox="0 0 112 64" className={sizeClass} aria-hidden="true">
          <circle cx="56" cy="32" r="20" fill="#1E293B" stroke="#475569" strokeWidth="1.4" />
          <line x1="34" y1="12" x2="78" y2="52" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 2" />
          <line x1="78" y1="12" x2="34" y2="52" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 2" />
          {[
            [34, 12],
            [78, 12],
            [34, 52],
            [78, 52],
          ].map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="6.5" fill="#0F172A" stroke="#10B981" strokeWidth="2" />
              <line x1={cx - 3.5} y1={cy} x2={cx + 3.5} y2={cy} stroke="#E2E8F0" strokeWidth="1.6" />
            </g>
          ))}
          <text x="56" y="35" textAnchor="middle" fill="#38BDF8" fontSize="6.5" fontFamily="monospace" fontWeight="700">
            4× KLIK
          </text>
        </svg>
      );

    case 'install-ram-1':
    case 'install-ram-2': {
      const isSecond = itemId === 'install-ram-2';
      return (
        <svg viewBox="0 0 112 64" className={sizeClass} aria-hidden="true">
          <rect x="6" y="18" width="100" height="28" rx="2" fill="#14532D" stroke="#22C55E" strokeWidth="1" />
          <rect x="6" y="14" width="100" height="6" rx="1" fill={isSecond ? '#38BDF8' : '#CBD5E1'} />
          {[11, 22, 33, 44, 57, 68, 79, 90].map((x) => (
            <rect key={x} x={x} y="24" width="8" height="14" rx="1" fill="#0F172A" stroke="#334155" strokeWidth="0.8" />
          ))}
          <rect x="9" y="42" width="38" height="5" fill="#EAB308" />
          <rect x="52" y="42" width="51" height="5" fill="#EAB308" />
          <rect x="47" y="41" width="5" height="7" fill="#0B0E14" />
          <text x="56" y="57" textAnchor="middle" fill={isSecond ? '#38BDF8' : '#CBD5E1'} fontSize="7" fontFamily="monospace" fontWeight="700">
            {isSecond ? 'DIMM 2 · #2' : 'DIMM 1 · #1'}
          </text>
        </svg>
      );
    }

    case 'install-cmos':
      return (
        <svg viewBox="0 0 112 64" className={sizeClass} aria-hidden="true">
          <defs>
            <radialGradient id="coinGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="65%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#64748B" />
            </radialGradient>
          </defs>
          <circle cx="56" cy="32" r="24" fill="url(#coinGrad)" stroke="#E2E8F0" strokeWidth="2" />
          <circle cx="56" cy="32" r="19" fill="none" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 2" />
          <text x="56" y="28" textAnchor="middle" fill="#1E293B" fontSize="7.5" fontFamily="monospace" fontWeight="700">
            CR2032
          </text>
          <text x="56" y="38" textAnchor="middle" fill="#334155" fontSize="7" fontFamily="monospace" fontWeight="700">
            + 3V
          </text>
        </svg>
      );

    case 'install-vga':
      return (
        <svg viewBox="0 0 112 64" className={sizeClass} aria-hidden="true">
          <rect x="10" y="10" width="5" height="44" rx="1" fill="#CBD5E1" />
          <rect x="15" y="14" width="86" height="32" rx="2" fill="#991B1B" stroke="#EF4444" strokeWidth="1" />
          <rect x="24" y="17" width="66" height="24" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          <circle cx="62" cy="29" r="10" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.5" />
          <circle cx="62" cy="29" r="3.5" fill="#38BDF8" />
          <line x1="22" y1="15" x2="94" y2="15" stroke="#D97706" strokeWidth="2.5" />
          <rect x="26" y="46" width="52" height="4.5" fill="#EAB308" />
          <rect x="37" y="46" width="3" height="5" fill="#0B0E14" />
        </svg>
      );

    case 'lock-vga-screw':
      return (
        <svg viewBox="0 0 112 64" className={sizeClass} aria-hidden="true">
          <rect x="20" y="24" width="22" height="32" rx="2" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.4" />
          <rect x="42" y="28" width="44" height="24" rx="2" fill="#991B1B" />
          <circle cx="56" cy="22" r="13" fill="#E2E8F0" stroke="#38BDF8" strokeWidth="2" />
          <path d="M51 22 L61 22 M56 17 L56 27" stroke="#0F172A" strokeWidth="2.4" strokeLinecap="round" />
          <text x="86" y="24" textAnchor="middle" fill="#38BDF8" fontSize="6.5" fontFamily="monospace" fontWeight="700">
            BAUT
          </text>
        </svg>
      );

    case 'install-hdd-jumper':
      return (
        <svg viewBox="0 0 112 64" className={sizeClass} aria-hidden="true">
          {/* 1 High-Contrast Tiny 2-Pin Plastic Jumper Shunt Cap */}
          <rect x="38" y="8" width="36" height="36" rx="4" fill="#FACC15" stroke="#0F172A" strokeWidth="2.2" />
          <rect x="44" y="14" width="9" height="11" rx="1.5" fill="#0F172A" />
          <rect x="59" y="14" width="9" height="11" rx="1.5" fill="#0F172A" />
          <rect x="44" y="30" width="24" height="6" rx="1.5" fill="#CA8A04" />
          <text x="56" y="56" textAnchor="middle" fill="#FDE047" fontSize="6.6" fontFamily="monospace" fontWeight="700">
            JUMPER 2-PIN
          </text>
        </svg>
      );

    case 'install-hdd-unit':
      return (
        <svg viewBox="0 0 112 64" className={sizeClass} aria-hidden="true">
          <rect x="16" y="10" width="80" height="44" rx="4" fill="#1E293B" stroke="#64748B" strokeWidth="1.6" />
          <rect x="22" y="15" width="68" height="34" rx="2" fill="#CBD5E1" />
          <rect x="22" y="15" width="68" height="9" rx="1" fill="#0F172A" />
          <circle cx="26" cy="45" r="2.2" fill="#475569" />
          <circle cx="86" cy="45" r="2.2" fill="#475569" />
          <text x="56" y="22" textAnchor="middle" fill="#38BDF8" fontSize="5.8" fontFamily="monospace" fontWeight="700">
            HDD 3.5&quot; IDE
          </text>
          <text x="56" y="36" textAnchor="middle" fill="#0F172A" fontSize="6.2" fontFamily="monospace" fontWeight="700">
            PATA ATA-133
          </text>
        </svg>
      );

    case 'install-ide-cable':
      return (
        <svg viewBox="0 0 112 64" className={sizeClass} aria-hidden="true">
          <rect x="20" y="8" width="68" height="34" rx="2" fill="#94A3B8" stroke="#64748B" strokeWidth="1" />
          {[28, 36, 44, 52, 60, 68, 76].map((x) => (
            <line key={x} x1={x} y1="8" x2={x} y2="42" stroke="#475569" strokeWidth="1.1" />
          ))}
          <rect x="80" y="8" width="8" height="34" fill="#EF4444" />
          <rect x="18" y="42" width="72" height="14" rx="2" fill="#0F172A" stroke="#334155" strokeWidth="1.2" />
          <text x="54" y="52" textAnchor="middle" fill="#F8FAFC" fontSize="6.1" fontFamily="monospace" fontWeight="700">
            IDE DATA [R]
          </text>
        </svg>
      );

    case 'install-hdd-molex':
      return (
        <svg viewBox="0 0 112 64" className={sizeClass} aria-hidden="true">
          {[
            { y: 16, col: '#EAB308' },
            { y: 24, col: '#111827' },
            { y: 32, col: '#334155' },
            { y: 40, col: '#EF4444' },
          ].map((w, idx) => (
            <line key={idx} x1="12" y1={w.y} x2="54" y2={w.y} stroke={w.col} strokeWidth="4.6" strokeLinecap="round" />
          ))}
          <rect x="52" y="11" width="44" height="36" rx="4" fill="#F1F5F9" stroke="#64748B" strokeWidth="1.6" />
          {[18, 26, 34, 42].map((cy) => (
            <circle key={cy} cx="74" cy={cy} r="2.7" fill="#D97706" />
          ))}
          <text x="56" y="58" textAnchor="middle" fill="#FDE047" fontSize="6.4" fontFamily="monospace" fontWeight="700">
            MOLEX 4P 12V/5V
          </text>
        </svg>
      );

    case 'wire-hdd-led':
    case 'wire-pled-pos':
    case 'wire-pled-neg':
    case 'wire-reset-sw':
    case 'wire-power-sw': {
      const wireMap: Record<
        string,
        { wire1: string; wire2?: string; pinBg: string; label: string; sub: string }
      > = {
        'wire-hdd-led': { wire1: '#EF4444', wire2: '#F8FAFC', pinBg: '#F97316', label: 'HDD LED', sub: 'PIN 1-3' },
        'wire-pled-pos': { wire1: '#22C55E', pinBg: '#16A34A', label: '+P LED', sub: 'PIN 2' },
        'wire-pled-neg': { wire1: '#F8FAFC', pinBg: '#16A34A', label: '-P LED', sub: 'PIN 4' },
        'wire-reset-sw': { wire1: '#2563EB', wire2: '#F8FAFC', pinBg: '#2563EB', label: 'RST SW', sub: 'PIN 5-7' },
        'wire-power-sw': { wire1: '#F97316', wire2: '#F8FAFC', pinBg: '#DC2626', label: 'PWR SW', sub: 'PIN 6-8' },
      };
      const meta = wireMap[itemId];
      return (
        <svg viewBox="0 0 112 64" className={sizeClass} aria-hidden="true">
          <path
            d={meta.wire2 ? 'M10 23 Q28 15 44 25' : 'M10 31 Q28 29 44 31'}
            fill="none"
            stroke={meta.wire1}
            strokeWidth="4.2"
            strokeLinecap="round"
          />
          {meta.wire2 && (
            <path
              d="M10 39 Q28 47 44 37"
              fill="none"
              stroke={meta.wire2}
              strokeWidth="3.8"
              strokeLinecap="round"
            />
          )}
          <rect x="44" y="14" width="46" height="34" rx="3" fill="#0F172A" stroke={meta.pinBg} strokeWidth="2" />
          <rect x="90" y="21" width="9" height="6" rx="1" fill={meta.pinBg} />
          {meta.wire2 && <rect x="90" y="34" width="9" height="6" rx="1" fill={meta.pinBg} />}
          <text x="67" y="29" textAnchor="middle" fill="#F8FAFC" fontSize="7.4" fontFamily="monospace" fontWeight="700">
            {meta.label}
          </text>
          <text x="67" y="40" textAnchor="middle" fill={meta.pinBg} fontSize="6.4" fontFamily="monospace" fontWeight="700">
            {meta.sub}
          </text>
        </svg>
      );
    }

    case 'install-atx-24pin':
      return (
        <svg viewBox="0 0 112 64" className={sizeClass} aria-hidden="true">
          {[
            { y: 12, col: '#F97316' },
            { y: 18, col: '#EF4444' },
            { y: 24, col: '#EAB308' },
            { y: 30, col: '#10B981' },
            { y: 36, col: '#111827' },
            { y: 42, col: '#A855F7' },
          ].map((w, idx) => (
            <path
              key={idx}
              d={`M12 ${w.y + 4} C30 ${w.y}, 42 ${w.y + 6}, 62 ${w.y + 4}`}
              fill="none"
              stroke={w.col}
              strokeWidth="4.2"
              strokeLinecap="round"
            />
          ))}
          <rect x="60" y="11" width="38" height="40" rx="3" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
          {[16, 22, 28, 34, 40, 46].map((y) => (
            <g key={y}>
              <rect x="66" y={y} width="5" height="3.5" fill="#1E293B" />
              <rect x="75" y={y} width="5" height="3.5" fill="#1E293B" />
            </g>
          ))}
          <text x="89" y="34" textAnchor="middle" fill="#0F172A" fontSize="6" fontFamily="monospace" fontWeight="700">
            24P
          </text>
        </svg>
      );

    case 'install-atx-4pin':
      return (
        <svg viewBox="0 0 112 64" className={sizeClass} aria-hidden="true">
          <path d="M16 20 C34 18, 44 22, 56 22" fill="none" stroke="#EAB308" strokeWidth="5" strokeLinecap="round" />
          <path d="M16 32 C34 30, 44 34, 56 34" fill="none" stroke="#EAB308" strokeWidth="5" strokeLinecap="round" />
          <path d="M16 44 C34 42, 44 42, 56 42" fill="none" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
          <rect x="56" y="13" width="38" height="36" rx="4" fill="#F1F5F9" stroke="#64748B" strokeWidth="1.6" />
          <rect x="64" y="20" width="9" height="9" rx="1" fill="#1E293B" />
          <rect x="77" y="20" width="9" height="9" rx="1" fill="#1E293B" />
          <rect x="64" y="33" width="9" height="9" rx="1" fill="#1E293B" />
          <rect x="77" y="33" width="9" height="9" rx="1" fill="#1E293B" />
          <text x="75" y="59" textAnchor="middle" fill="#FDE047" fontSize="6.5" fontFamily="monospace" fontWeight="700">
            CPU 4P 12V
          </text>
        </svg>
      );
  }
}
