import type { TheaterVisualType } from '../../../types/rigbench';

interface TheaterDiagramSvgProps {
  visualType: TheaterVisualType;
  progress: number;
  isPlaying: boolean;
}

/**
 * Computes active sequential stage index (0..count-1) synced to voice narration progress.
 */
function activeStepIndex(progress: number, count: number): number {
  if (count <= 1) return 0;
  return Math.min(count - 1, Math.floor((Math.max(0, Math.min(99.9, progress)) / 100) * count));
}

/**
 * Sapphire Blue & Midnight Navy interactive vector diagrams for all 7 STMIK AKI clusters.
 * Elements illuminate sequentially in sync with local Web Speech narration progress.
 */
export function TheaterDiagramSvg({
  visualType,
  progress,
  isPlaying,
}: TheaterDiagramSvgProps) {
  const pulseOpacity = isPlaying ? 0.98 : 0.72;
  const dashAnimClass = isPlaying ? 'theater-flow-dash' : '';

  switch (visualType) {
    case 'ipo-cycle': {
      const step = activeStepIndex(progress, 4);
      const isLit = (idx: number) => progress === 0 || step === idx;
      return (
        <svg viewBox="0 0 760 270" className="h-full w-full">
          <path
            d="M160 135 H265"
            stroke="#38BDF8"
            strokeWidth={step === 1 ? '3.6' : '2.6'}
            strokeDasharray="6 6"
            opacity={pulseOpacity}
            className={dashAnimClass}
          />
          <path
            d="M475 135 H560"
            stroke="#34D399"
            strokeWidth={step === 2 ? '3.6' : '2.6'}
            strokeDasharray="6 6"
            opacity={pulseOpacity}
            className={dashAnimClass}
          />
          <path
            d="M370 190 V225 H560"
            stroke="#60A5FA"
            strokeWidth={step === 3 ? '3.4' : '2.4'}
            strokeDasharray="5 5"
            opacity={pulseOpacity}
            className={dashAnimClass}
          />

          <g opacity={isLit(0) ? 1 : 0.48}>
            <rect
              x="28"
              y="88"
              width="132"
              height="94"
              rx="12"
              fill={step === 0 ? '#0E244D' : '#0A162D'}
              stroke={step === 0 ? '#38BDF8' : '#1E3A5F'}
              strokeWidth={step === 0 ? '2.8' : '1.8'}
            />
            <text x="94" y="122" textAnchor="middle" fill="#38BDF8" fontSize="13" fontWeight="700" fontFamily="JetBrains Mono">01. INPUT</text>
            <text x="94" y="145" textAnchor="middle" fill="#CBD5E1" fontSize="11">Keyboard · Mouse</text>
            <text x="94" y="162" textAnchor="middle" fill="#94A3B8" fontSize="11">Scanner</text>
          </g>

          <g opacity={isLit(1) ? 1 : 0.48}>
            <rect
              x="265"
              y="72"
              width="210"
              height="118"
              rx="14"
              fill={step === 1 ? '#122D61' : '#0E2044'}
              stroke={step === 1 ? '#38BDF8' : '#2563EB'}
              strokeWidth={step === 1 ? '3' : '2'}
            />
            <text x="370" y="106" textAnchor="middle" fill="#F8FAFC" fontSize="14" fontWeight="700" fontFamily="JetBrains Mono">02. PROCESS</text>
            <text x="370" y="129" textAnchor="middle" fill="#38BDF8" fontSize="12">CPU (Aritmatika &amp; Logika)</text>
            <text x="370" y="150" textAnchor="middle" fill="#CBD5E1" fontSize="11">+ RAM (Memori Kerja)</text>
            <text x="370" y="170" textAnchor="middle" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono">via Jalur Motherboard</text>
          </g>

          <g opacity={isLit(2) ? 1 : 0.48}>
            <rect
              x="560"
              y="60"
              width="172"
              height="82"
              rx="12"
              fill={step === 2 ? '#0B2B2C' : '#0A162D'}
              stroke={step === 2 ? '#34D399' : '#1E3A5F'}
              strokeWidth={step === 2 ? '2.8' : '1.8'}
            />
            <text x="646" y="92" textAnchor="middle" fill="#34D399" fontSize="13" fontWeight="700" fontFamily="JetBrains Mono">03. OUTPUT</text>
            <text x="646" y="114" textAnchor="middle" fill="#CBD5E1" fontSize="11">Monitor · Speaker · Printer</text>
          </g>

          <g opacity={isLit(3) ? 1 : 0.48}>
            <rect
              x="560"
              y="168"
              width="172"
              height="82"
              rx="12"
              fill={step === 3 ? '#0F254E' : '#0A162D'}
              stroke={step === 3 ? '#60A5FA' : '#1E3A5F'}
              strokeWidth={step === 3 ? '2.8' : '1.8'}
            />
            <text x="646" y="200" textAnchor="middle" fill="#60A5FA" fontSize="13" fontWeight="700" fontFamily="JetBrains Mono">04. STORAGE</text>
            <text x="646" y="222" textAnchor="middle" fill="#CBD5E1" fontSize="11">Harddisk · SSD · DVD-ROM</text>
          </g>
        </svg>
      );
    }

    case 'chipset-bridge': {
      const nbFocus = progress === 0 || progress < 56;
      const sbFocus = progress === 0 || progress >= 52;
      return (
        <svg viewBox="0 0 760 270" className="h-full w-full">
          <line x1="380" y1="62" x2="380" y2="96" stroke="#38BDF8" strokeWidth={nbFocus ? '3.4' : '2'} strokeDasharray="5 4" className={dashAnimClass} />
          <line x1="295" y1="126" x2="188" y2="126" stroke="#38BDF8" strokeWidth={nbFocus ? '3.4' : '2'} strokeDasharray="5 4" className={dashAnimClass} />
          <line x1="465" y1="126" x2="572" y2="126" stroke="#38BDF8" strokeWidth={nbFocus ? '3.4' : '2'} strokeDasharray="5 4" className={dashAnimClass} />
          <line x1="380" y1="158" x2="380" y2="188" stroke="#60A5FA" strokeWidth="2.6" strokeDasharray="4 4" className={dashAnimClass} />
          <line x1="295" y1="218" x2="188" y2="218" stroke="#F59E0B" strokeWidth={sbFocus ? '3.2' : '2'} strokeDasharray="5 4" className={dashAnimClass} />
          <line x1="465" y1="218" x2="572" y2="218" stroke="#F59E0B" strokeWidth={sbFocus ? '3.2' : '2'} strokeDasharray="5 4" className={dashAnimClass} />

          <g opacity={nbFocus ? 1 : 0.45}>
            <rect x="285" y="16" width="190" height="46" rx="10" fill="#0E2044" stroke="#38BDF8" strokeWidth="2.2" />
            <text x="380" y="44" textAnchor="middle" fill="#F8FAFC" fontSize="13" fontWeight="700" fontFamily="JetBrains Mono">CPU (FSB 6.4 GB/s)</text>

            <rect x="28" y="98" width="160" height="56" rx="10" fill="#0A162D" stroke="#38BDF8" strokeWidth="2" />
            <text x="108" y="122" textAnchor="middle" fill="#38BDF8" fontSize="12" fontWeight="700">PCIe x16 / AGP</text>
            <text x="108" y="140" textAnchor="middle" fill="#CBD5E1" fontSize="10.5">VGA Grafis (8.0 GB/s)</text>

            <rect x="295" y="96" width="170" height="62" rx="12" fill="#102C5C" stroke="#38BDF8" strokeWidth="2.8" />
            <text x="380" y="123" textAnchor="middle" fill="#38BDF8" fontSize="13" fontWeight="700" fontFamily="JetBrains Mono">NORTHBRIDGE</text>
            <text x="380" y="143" textAnchor="middle" fill="#DBEAFE" fontSize="10.5">MCH · Jalur Cepat</text>

            <rect x="572" y="98" width="160" height="56" rx="10" fill="#0A162D" stroke="#38BDF8" strokeWidth="2" />
            <text x="652" y="122" textAnchor="middle" fill="#38BDF8" fontSize="12" fontWeight="700">Main Memory</text>
            <text x="652" y="140" textAnchor="middle" fill="#CBD5E1" fontSize="10.5">DDR / DDR2 (8.5 GB/s)</text>
          </g>

          <g opacity={sbFocus ? 1 : 0.45}>
            <rect x="295" y="188" width="170" height="62" rx="12" fill="#261D12" stroke="#F59E0B" strokeWidth="2.8" />
            <text x="380" y="215" textAnchor="middle" fill="#FCD34D" fontSize="13" fontWeight="700" fontFamily="JetBrains Mono">SOUTHBRIDGE</text>
            <text x="380" y="235" textAnchor="middle" fill="#FDE68A" fontSize="10.5">ICH · I/O &amp; Periferal</text>

            <rect x="28" y="188" width="160" height="62" rx="10" fill="#0A162D" stroke="#F59E0B" strokeWidth="1.9" />
            <text x="108" y="213" textAnchor="middle" fill="#FCD34D" fontSize="11.5" fontWeight="700">USB · Audio · LAN</text>
            <text x="108" y="233" textAnchor="middle" fill="#CBD5E1" fontSize="10.5">Keyboard · Mouse · PCIe x1</text>

            <rect x="572" y="188" width="160" height="62" rx="10" fill="#0A162D" stroke="#F59E0B" strokeWidth="1.9" />
            <text x="652" y="213" textAnchor="middle" fill="#FCD34D" fontSize="11.5" fontWeight="700">SATA · IDE · PCI</text>
            <text x="652" y="233" textAnchor="middle" fill="#CBD5E1" fontSize="10.5">ROM BIOS · Floppy</text>
          </g>
        </svg>
      );
    }

    case 'back-panel-map': {
      const ports = [
        { x: 56, y: 84, w: 62, h: 46, c: '#22C55E', id: '#16', label: 'PS/2 M' },
        { x: 56, y: 142, w: 62, h: 46, c: '#A855F7', id: '#17', label: 'PS/2 KB' },
        { x: 138, y: 84, w: 128, h: 46, c: '#EC4899', id: '#18', label: 'Paralel 8-bit' },
        { x: 138, y: 142, w: 92, h: 46, c: '#14B8A6', id: '#19', label: 'Serial' },
        { x: 286, y: 142, w: 78, h: 46, c: '#F59E0B', id: '#20', label: 'SPDIF' },
        { x: 382, y: 84, w: 92, h: 46, c: '#94A3B8', id: '#21', label: 'Firewire' },
        { x: 492, y: 84, w: 92, h: 46, c: '#2563EB', id: '#22', label: 'RJ45 LAN' },
        { x: 492, y: 142, w: 92, h: 46, c: '#38BDF8', id: '#23', label: 'USB 2.0' },
        { x: 604, y: 84, w: 102, h: 104, c: '#10B981', id: '#24', label: 'Audio 3.5mm' },
      ];
      // Intro occupies 0..14%, then each of the 9 ports illuminates in order
      const activePortIdx =
        progress <= 12 ? -1 : activeStepIndex(((progress - 12) / 88) * 100, ports.length);

      return (
        <svg viewBox="0 0 760 270" className="h-full w-full">
          <rect x="34" y="64" width="692" height="142" rx="14" fill="#081329" stroke="#1E3A5F" strokeWidth="2" />
          {ports.map((p, idx) => {
            const highlighted = activePortIdx === -1 || activePortIdx === idx;
            const current = activePortIdx === idx;
            return (
              <g key={p.id} opacity={highlighted ? 1 : 0.42}>
                <rect
                  x={p.x}
                  y={p.y}
                  width={p.w}
                  height={p.h}
                  rx="8"
                  fill={current ? '#0F2246' : '#050B18'}
                  stroke={p.c}
                  strokeWidth={current ? '3' : '1.9'}
                />
                <text
                  x={p.x + p.w / 2}
                  y={p.y + p.h / 2 - 4}
                  textAnchor="middle"
                  fill={p.c}
                  fontSize="11.5"
                  fontWeight="700"
                  fontFamily="JetBrains Mono"
                >
                  {p.id}
                </text>
                <text
                  x={p.x + p.w / 2}
                  y={p.y + p.h / 2 + 12}
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize="10.5"
                >
                  {p.label}
                </text>
              </g>
            );
          })}
          <text x="380" y="42" textAnchor="middle" fill="#94A3B8" fontSize="12" fontFamily="JetBrains Mono">
            BLOK #15 BACK PANEL I/O — 9 PORT EKSTERNAL WAJIB HAFAL TTS
          </text>
        </svg>
      );
    }

    case 'ram-notch-evolution': {
      const step = activeStepIndex(progress, 4);
      const rows = [
        { y: 26, name: 'SDRAM · 168 Pin · 2 Notch', notches: [255, 435], color: '#F59E0B', cap: 'Maks 512 MB' },
        { y: 86, name: 'DDR1 · 184 Pin · 1 Notch', notches: [380], color: '#60A5FA', cap: 'Maks 1 GB' },
        { y: 146, name: 'DDR2 · 240 Pin · 1 Notch (Agak Kiri)', notches: [345], color: '#38BDF8', cap: 'Maks 2 GB' },
        { y: 206, name: 'DDR3 · 240 Pin · 1 Notch (Lebih Kiri)', notches: [302], color: '#10B981', cap: 'Maks 4 GB' },
      ];
      return (
        <svg viewBox="0 0 760 270" className="h-full w-full">
          {rows.map((ram, idx) => {
            const active = progress === 0 || step === idx;
            return (
              <g key={ram.name} opacity={active ? 1 : 0.45}>
                <text x="30" y={ram.y + 18} fill="#F8FAFC" fontSize="11.5" fontWeight="600">{ram.name}</text>
                <text x="730" y={ram.y + 18} textAnchor="end" fill={ram.color} fontSize="11" fontFamily="JetBrains Mono">{ram.cap}</text>
                <rect
                  x="190"
                  y={ram.y + 24}
                  width="380"
                  height="22"
                  rx="4"
                  fill={step === idx && progress > 0 ? '#0E3A34' : '#0B2A26'}
                  stroke={ram.color}
                  strokeWidth={step === idx && progress > 0 ? '2.4' : '1.5'}
                />
                <rect x="190" y={ram.y + 40} width="380" height="6" fill="#EAB308" />
                {ram.notches.map((nx) => (
                  <rect key={nx} x={nx} y={ram.y + 34} width="12" height="14" fill="#040812" />
                ))}
              </g>
            );
          })}
        </svg>
      );
    }

    case 'cpu-timeline': {
      const intelActive = progress === 0 || progress < 54;
      const amdActive = progress === 0 || progress >= 50;
      const nodes = [
        { x: 95, y: 84, label: 'i386', yr: '1985', c: '#38BDF8', isIntel: true },
        { x: 225, y: 84, label: 'Pentium 1', yr: '1992', c: '#38BDF8', isIntel: true },
        { x: 375, y: 84, label: 'Pentium 4', yr: '2000', c: '#38BDF8', isIntel: true },
        { x: 525, y: 84, label: 'Core 2 Duo', yr: '2007', c: '#38BDF8', isIntel: true },
        { x: 660, y: 84, label: 'Core i7', yr: '2011', c: '#38BDF8', isIntel: true },
        { x: 185, y: 184, label: 'Am386', yr: '1991', c: '#F59E0B', isIntel: false },
        { x: 305, y: 184, label: 'K6 / K6-2', yr: '1997', c: '#F59E0B', isIntel: false },
        { x: 420, y: 184, label: 'Athlon', yr: '2000', c: '#F59E0B', isIntel: false },
        { x: 550, y: 184, label: 'Opteron', yr: '2008', c: '#F59E0B', isIntel: false },
        { x: 660, y: 184, label: 'AMD FX', yr: '2011', c: '#F59E0B', isIntel: false },
      ];
      return (
        <svg viewBox="0 0 760 270" className="h-full w-full">
          <line x1="60" y1="135" x2="700" y2="135" stroke="#1E3A5F" strokeWidth="2.4" />
          <line
            x1="60"
            y1="135"
            x2={60 + (640 * Math.max(8, progress)) / 100}
            y2="135"
            stroke="#38BDF8"
            strokeWidth="2.6"
          />
          <text x="60" y="42" fill="#38BDF8" fontSize="12" fontWeight="700" fontFamily="JetBrains Mono" opacity={intelActive ? 1 : 0.45}>
            LINI INTEL (1985–2011)
          </text>
          <text x="60" y="236" fill="#F59E0B" fontSize="12" fontWeight="700" fontFamily="JetBrains Mono" opacity={amdActive ? 1 : 0.45}>
            LINI AMD (1991–2011)
          </text>
          {nodes.map((n) => {
            const lit = n.isIntel ? intelActive : amdActive;
            return (
              <g key={`${n.label}-${n.yr}`} opacity={lit ? 1 : 0.38}>
                <circle cx={n.x} cy={135} r="5" fill={n.c} />
                <line x1={n.x} y1={135} x2={n.x} y2={n.y > 135 ? n.y - 16 : n.y + 12} stroke={n.c} strokeWidth="1.5" opacity="0.7" />
                <text x={n.x} y={n.y} textAnchor="middle" fill="#F8FAFC" fontSize="11.5" fontWeight="600">{n.label}</text>
                <text x={n.x} y={n.y + 14} textAnchor="middle" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono">{n.yr}</text>
              </g>
            );
          })}
        </svg>
      );
    }

    case 'psu-smps-flow': {
      const step = activeStepIndex(progress, 3);
      return (
        <svg viewBox="0 0 760 270" className="h-full w-full">
          <g opacity={progress === 0 || step === 0 ? 1 : 0.48}>
            <rect x="28" y="88" width="142" height="94" rx="12" fill={step === 0 ? '#1F180D' : '#0A162D'} stroke="#F59E0B" strokeWidth={step === 0 ? '2.8' : '1.8'} />
            <text x="99" y="120" textAnchor="middle" fill="#FCD34D" fontSize="12.5" fontWeight="700" fontFamily="JetBrains Mono">AC-IN 220V</text>
            <text x="99" y="142" textAnchor="middle" fill="#CBD5E1" fontSize="10.5">2 Pin AC + 1 Ground</text>
            <text x="99" y="160" textAnchor="middle" fill="#10B981" fontSize="10">Netralisir Bocor SMPS</text>
          </g>

          <line x1="170" y1="135" x2="232" y2="135" stroke="#38BDF8" strokeWidth="2.8" strokeDasharray="5 5" className={dashAnimClass} />

          <g opacity={progress === 0 || step === 1 ? 1 : 0.48}>
            <rect x="232" y="56" width="248" height="158" rx="14" fill={step === 1 ? '#112752' : '#0E2044'} stroke="#38BDF8" strokeWidth={step === 1 ? '2.8' : '2'} />
            <text x="356" y="84" textAnchor="middle" fill="#38BDF8" fontSize="13" fontWeight="700" fontFamily="JetBrains Mono">MODUL SMPS (Casing EMI)</text>
            <rect x="252" y="98" width="208" height="44" rx="8" fill="#171A3D" stroke="#818CF8" strokeWidth="1.6" />
            <text x="356" y="118" textAnchor="middle" fill="#E0E7FF" fontSize="11" fontWeight="700">Stand-by PSU (+5VSB · Ungu)</text>
            <text x="356" y="134" textAnchor="middle" fill="#A5B4FC" fontSize="9.5">Aktif langsung saat colok PLN</text>
            <rect x="252" y="152" width="208" height="48" rx="8" fill="#0B2926" stroke="#10B981" strokeWidth="1.6" />
            <text x="356" y="173" textAnchor="middle" fill="#6EE7B7" fontSize="11" fontWeight="700">Main PSU (Trigger PS_ON Hijau)</text>
            <text x="356" y="190" textAnchor="middle" fill="#A7F3D0" fontSize="9.5">+3.3V · +5V · +12V · -12V</text>
          </g>

          <line x1="480" y1="135" x2="544" y2="135" stroke="#10B981" strokeWidth="2.8" strokeDasharray="5 5" className={dashAnimClass} />

          <g opacity={progress === 0 || step === 2 ? 1 : 0.48}>
            <rect x="544" y="72" width="188" height="126" rx="12" fill={step === 2 ? '#0A2724' : '#0A162D'} stroke="#10B981" strokeWidth={step === 2 ? '2.8' : '1.8'} />
            <text x="638" y="102" textAnchor="middle" fill="#34D399" fontSize="12.5" fontWeight="700" fontFamily="JetBrains Mono">UJI JUMPER PSU</text>
            <text x="638" y="128" textAnchor="middle" fill="#F8FAFC" fontSize="11">Pin 16 (Hijau · PS_ON)</text>
            <text x="638" y="148" textAnchor="middle" fill="#38BDF8" fontSize="12" fontWeight="700">+</text>
            <text x="638" y="168" textAnchor="middle" fill="#F8FAFC" fontSize="11">Pin 15/17 (Hitam · GND)</text>
          </g>
        </svg>
      );
    }

    case 'hdd-mbr-gpt': {
      const mbrLit = progress === 0 || progress < 65;
      const gptLit = progress === 0 || progress >= 55;
      return (
        <svg viewBox="0 0 760 270" className="h-full w-full">
          <g opacity={mbrLit ? 1 : 0.46}>
            <rect x="34" y="42" width="326" height="186" rx="14" fill="#0A162D" stroke={progress > 0 && progress < 65 ? '#F59E0B' : '#334155'} strokeWidth="2.2" />
            <text x="56" y="76" fill="#CBD5E1" fontSize="14" fontWeight="700" fontFamily="JetBrains Mono">MBR (Legacy BIOS)</text>
            <text x="56" y="106" fill="#94A3B8" fontSize="12">• Kapasitas maks: 2 TB</text>
            <text x="56" y="132" fill="#94A3B8" fontSize="12">• Maks 4 Partisi Primer (3 + 1 Extended)</text>
            <text x="56" y="158" fill="#94A3B8" fontSize="12">• 1 sektor tabel partisi (rawan rusak)</text>
            <text x="56" y="186" fill="#F59E0B" fontSize="11.5">FAT32: batas 1 file maks 4 GB</text>
          </g>

          <g opacity={gptLit ? 1 : 0.46}>
            <rect x="400" y="42" width="326" height="186" rx="14" fill="#0D2246" stroke="#38BDF8" strokeWidth={progress >= 55 ? '2.8' : '2'} />
            <text x="422" y="76" fill="#38BDF8" fontSize="14" fontWeight="700" fontFamily="JetBrains Mono">GPT (UEFI Modern)</text>
            <text x="422" y="106" fill="#F8FAFC" fontSize="12">• Kapasitas: &gt;2 TB hingga 18 Exabyte</text>
            <text x="422" y="132" fill="#F8FAFC" fontSize="12">• Hingga 128 Partisi Primer mandiri</text>
            <text x="422" y="158" fill="#F8FAFC" fontSize="12">• Cadangan tabel akhir disk (CRC32)</text>
            <text x="422" y="186" fill="#34D399" fontSize="11.5">NTFS: Permissions · Enkripsi · Journaling</text>
          </g>
        </svg>
      );
    }

    case 'os-boot-pipeline': {
      const step = activeStepIndex(progress, 5);
      const stages = [
        { x: 30, title: '1. BIOS', sub: 'Del/F2 → F10' },
        { x: 174, title: '2. EULA', sub: 'Tekan F8' },
        { x: 318, title: '3. NTFS', sub: 'Format Quick' },
        { x: 462, title: '4. Key 25', sub: 'GMT+07:00' },
        { x: 606, title: '5. Driver', sub: 'VGA/LAN/Chip' },
      ];
      return (
        <svg viewBox="0 0 760 270" className="h-full w-full">
          {stages.map((st, idx) => {
            const active = progress === 0 || idx === step;
            const passed = progress > 0 && idx < step;
            return (
              <g key={st.title} opacity={active || passed ? 1 : 0.45}>
                {idx > 0 && (
                  <line
                    x1={st.x - 18}
                    y1="135"
                    x2={st.x}
                    y2="135"
                    stroke={idx <= step ? '#38BDF8' : '#1E3A5F'}
                    strokeWidth="2.8"
                    strokeDasharray="4 4"
                    className={dashAnimClass}
                  />
                )}
                <rect
                  x={st.x}
                  y="92"
                  width="126"
                  height="86"
                  rx="12"
                  fill={idx === step && progress > 0 ? '#112A58' : '#0A162D'}
                  stroke={idx === step && progress > 0 ? '#38BDF8' : passed ? '#34D399' : '#1E3A5F'}
                  strokeWidth={idx === step && progress > 0 ? '2.8' : '1.9'}
                />
                <text x={st.x + 63} y="128" textAnchor="middle" fill="#38BDF8" fontSize="13" fontWeight="700" fontFamily="JetBrains Mono">{st.title}</text>
                <text x={st.x + 63} y="152" textAnchor="middle" fill="#CBD5E1" fontSize="11">{st.sub}</text>
              </g>
            );
          })}
        </svg>
      );
    }

    case 'troubleshooting-matrix': {
      const step = activeStepIndex(progress, 6);
      const boxes = [
        { x: 36, y: 34, title: '1. MaTot', desc: 'Jumper PSU Hijau-Hitam · Cek Elko', c: '#F43F5E' },
        { x: 274, y: 34, title: '2. Blank', desc: 'Gosok Pin RAM Karet · Reset CMOS · Beep', c: '#F59E0B' },
        { x: 512, y: 34, title: '3. Hang', desc: 'NumLock Beku · Overheat · Bad Sector', c: '#38BDF8' },
        { x: 36, y: 146, title: '4. Restart', desc: 'Cek CMOS < 2V · Pasta CPU · PSU', c: '#60A5FA' },
        { x: 274, y: 146, title: '5. Lambat', desc: 'Defrag C: · Buffer 20-30% · Upgrade RAM', c: '#10B981' },
        { x: 512, y: 146, title: '6. Virus', desc: 'Safe Mode · Fresh Install · Off Autorun', c: '#F43F5E' },
      ];
      return (
        <svg viewBox="0 0 760 270" className="h-full w-full">
          {boxes.map((box, idx) => {
            const active = progress === 0 || step === idx;
            return (
              <g key={box.title} opacity={active ? 1 : 0.45}>
                <rect
                  x={box.x}
                  y={box.y}
                  width="212"
                  height="90"
                  rx="12"
                  fill={step === idx && progress > 0 ? '#10213F' : '#0A162D'}
                  stroke={box.c}
                  strokeWidth={step === idx && progress > 0 ? '2.8' : '1.8'}
                />
                <text x={box.x + 16} y={box.y + 34} fill={box.c} fontSize="13.5" fontWeight="700" fontFamily="JetBrains Mono">{box.title}</text>
                <text x={box.x + 16} y={box.y + 60} fill="#E2E8F0" fontSize="10.5">{box.desc}</text>
              </g>
            );
          })}
        </svg>
      );
    }

    case 'electronics-bench': {
      const step = activeStepIndex(progress, 3);
      return (
        <svg viewBox="0 0 760 270" className="h-full w-full">
          <g opacity={progress === 0 || step === 0 ? 1 : 0.45}>
            <line x1="60" y1="88" x2="360" y2="88" stroke="#94A3B8" strokeWidth="4" />
            <rect x="115" y="64" width="190" height="48" rx="18" fill="#D6C29F" stroke={step === 0 && progress > 0 ? '#38BDF8' : '#78350F'} strokeWidth="2.4" />
            <rect x="142" y="64" width="16" height="48" fill="#78350F" />
            <rect x="176" y="64" width="16" height="48" fill="#18181B" />
            <rect x="210" y="64" width="16" height="48" fill="#DC2626" />
            <rect x="262" y="64" width="16" height="48" fill="#94A3B8" />
            <text x="210" y="138" textAnchor="middle" fill="#38BDF8" fontSize="12" fontWeight="700" fontFamily="JetBrains Mono">1.000 Ω ±10% (900–1.100 Ω)</text>
          </g>

          <g opacity={progress === 0 || step === 1 ? 1 : 0.45}>
            <circle cx="560" cy="86" r="34" fill="#B45309" stroke={step === 1 && progress > 0 ? '#38BDF8' : '#F59E0B'} strokeWidth="2.6" />
            <text x="560" y="92" textAnchor="middle" fill="#FEF3C7" fontSize="16" fontWeight="700" fontFamily="JetBrains Mono">103</text>
            <text x="560" y="142" textAnchor="middle" fill="#FCD34D" fontSize="11.5" fontFamily="JetBrains Mono">10.000 pF = 10 nF = 0,01 µF</text>
          </g>

          <g opacity={progress === 0 || step === 2 ? 1 : 0.45}>
            <rect x="52" y="176" width="656" height="62" rx="12" fill={step === 2 && progress > 0 ? '#0F254A' : '#0A162D'} stroke="#38BDF8" strokeWidth={step === 2 && progress > 0 ? '2.5' : '1.6'} />
            <text x="380" y="202" textAnchor="middle" fill="#F8FAFC" fontSize="12" fontWeight="700">OHMMETER ELCO: Gerak &amp; Kembali = BAIK · Tidak Kembali = BOCOR</text>
            <text x="380" y="222" textAnchor="middle" fill="#CBD5E1" fontSize="11.5">Diam = PUTUS · Menunjuk Nol = SHORT · MOSFET Kiri→Kanan: Gate – Drain – Source</text>
          </g>
        </svg>
      );
    }

    case 'eula-legal-shield': {
      const step = activeStepIndex(progress, 5);
      const clauses = [
        { y: 40, t: '1. Pantau Aktivitas Internet', c: '#38BDF8' },
        { y: 90, t: '2. Telemetri & Data Pribadi', c: '#38BDF8' },
        { y: 140, t: '3. Pakai CPU / RAM / Bandwidth', c: '#F59E0B' },
        { y: 190, t: '4. Buka Port Firewall (Rawan Backdoor/Trojan)', c: '#F43F5E' },
      ];
      return (
        <svg viewBox="0 0 760 270" className="h-full w-full">
          <g opacity={progress === 0 || step === 0 ? 1 : 0.55}>
            <rect x="34" y="40" width="236" height="190" rx="14" fill="#0D2246" stroke="#38BDF8" strokeWidth={step === 0 ? '2.8' : '1.8'} />
            <text x="56" y="74" fill="#38BDF8" fontSize="14" fontWeight="700" fontFamily="JetBrains Mono">HAKIKAT EULA</text>
            <text x="56" y="106" fill="#F8FAFC" fontSize="11.5">Membeli software legal =</text>
            <text x="56" y="126" fill="#34D399" fontSize="12.5" fontWeight="700">Hak Izin Pakai (Lisensi)</text>
            <text x="56" y="150" fill="#94A3B8" fontSize="11">Bukan kepemilikan kode.</text>
            <text x="56" y="180" fill="#FCD34D" fontSize="11">Sah terikat saat: klik I Accept,</text>
            <text x="56" y="198" fill="#FCD34D" fontSize="11">buka segel CD, instal, aktivasi.</text>
          </g>

          {clauses.map((cl, idx) => {
            const active = progress === 0 || step === idx + 1;
            return (
              <g key={cl.t} opacity={active ? 1 : 0.45}>
                <rect
                  x="298"
                  y={cl.y}
                  width="428"
                  height="40"
                  rx="10"
                  fill={step === idx + 1 && progress > 0 ? '#112548' : '#0A162D'}
                  stroke={cl.c}
                  strokeWidth={step === idx + 1 && progress > 0 ? '2.6' : '1.6'}
                />
                <text x="316" y={cl.y + 25} fill="#F8FAFC" fontSize="12" fontWeight="600">{cl.t}</text>
              </g>
            );
          })}
        </svg>
      );
    }

    case 'crack-threat-vector': {
      const step = activeStepIndex(progress, 5);
      const tools = [
        { x: 34, title: 'PATCH', desc: 'Timpa byte .exe/.dll (JNZ→JZ)', c: '#38BDF8' },
        { x: 214, title: 'KEYGEN', desc: 'Replikasi algoritma serial', c: '#60A5FA' },
        { x: 394, title: 'LOADER', desc: 'Injeksi di RAM (file utuh)', c: '#F59E0B' },
        { x: 574, title: 'NO-DISC', desc: 'Bypass cek CD / Dongle USB', c: '#94A3B8' },
      ];
      return (
        <svg viewBox="0 0 760 270" className="h-full w-full">
          {tools.map((tool, idx) => {
            const active = progress === 0 || step === idx;
            return (
              <g key={tool.title} opacity={active ? 1 : 0.45}>
                <rect
                  x={tool.x}
                  y="30"
                  width="160"
                  height="78"
                  rx="10"
                  fill={step === idx && progress > 0 ? '#102447' : '#0A162D'}
                  stroke={tool.c}
                  strokeWidth={step === idx && progress > 0 ? '2.8' : '1.8'}
                />
                <text x={tool.x + 80} y="60" textAnchor="middle" fill={tool.c} fontSize="12.5" fontWeight="700" fontFamily="JetBrains Mono">{tool.title}</text>
                <text x={tool.x + 80} y="84" textAnchor="middle" fill="#E2E8F0" fontSize="10">{tool.desc}</text>
              </g>
            );
          })}
          <g opacity={progress === 0 || step === 4 ? 1 : 0.55}>
            <rect x="34" y="136" width="700" height="104" rx="14" fill="#1F101A" stroke="#F43F5E" strokeWidth={step === 4 && progress > 0 ? '2.8' : '2'} />
            <text x="384" y="166" textAnchor="middle" fill="#FDA4AF" fontSize="13.5" fontWeight="700" fontFamily="JetBrains Mono">
              4 PILAR BAHAYA SOFTWARE BAJAKAN (CRACK)
            </text>
            <text x="384" y="194" textAnchor="middle" fill="#F8FAFC" fontSize="11.5">
              1. Malware / Trojan Backdoor / Spyware Keylogger / Ransomware  ·  2. Tanpa Security Update &amp; Crash
            </text>
            <text x="384" y="218" textAnchor="middle" fill="#F8FAFC" fontSize="11.5">
              3. Sanksi Pidana &amp; Perdata UU Hak Cipta  ·  4. Pelanggaran Etika &amp; Merusak Ekosistem Inovasi
            </text>
          </g>
        </svg>
      );
    }
  }
}
