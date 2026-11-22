import type { TheaterCardVariant, TheaterDomainColor } from '../../../data/theaterDirectorTimeline';

interface TheaterCardMicroVisualProps {
  variant: TheaterCardVariant;
  microKey: string;
  accentColor: TheaterDomainColor;
  compact?: boolean;
}

function IpoFlowMicro({ microKey, accentColor }: { microKey: string; accentColor: string }) {
  const steps = [
    { id: 'input', label: 'INPUT' },
    { id: 'process', label: 'PROCESS' },
    { id: 'output', label: 'OUTPUT' },
    { id: 'storage', label: 'STORAGE' },
  ];
  return (
    <div className="grid grid-cols-4 gap-1" aria-label="Diagram alur siklus IPO-S">
      {steps.map((step, i) => {
        const active = microKey === 'overview' || microKey === step.id;
        return (
          <div
            key={step.id}
            className="flex flex-col items-center gap-1 rounded border px-1 py-1.5 text-center transition-colors"
            style={{
              borderColor: active ? `${accentColor}66` : 'rgba(255,255,255,0.08)',
              backgroundColor: active ? `${accentColor}16` : 'rgba(255,255,255,0.02)',
            }}
          >
            <span
              className="font-mono text-[9px] font-bold tabular-nums"
              style={{ color: active ? accentColor : '#64748B' }}
            >
              0{i + 1}
            </span>
            <span
              className="text-[9px] font-semibold tracking-wider"
              style={{ color: active ? '#F8FAFC' : '#64748B' }}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HardwareBusMicro({ microKey, accentColor }: { microKey: string; accentColor: string }) {
  const isNb = microKey === 'northbridge' || microKey === 'dual-chipset';
  const isSb = microKey === 'southbridge' || microKey === 'dual-chipset';
  const isIo = microKey === 'io';
  const isPwr = microKey === 'power';

  return (
    <svg viewBox="0 0 240 54" className="h-[52px] w-full" aria-label="Diagram jalur bus motherboard">
      {/* Bus connector trace */}
      <line x1="68" y1="27" x2="104" y2="27" stroke={isNb ? accentColor : '#334155'} strokeWidth="1.6" />
      <line x1="142" y1="27" x2="176" y2="27" stroke={isSb || isIo ? accentColor : '#334155'} strokeWidth="1.6" />

      {/* Node 1: CPU/RAM/VGA */}
      <rect
        x="4"
        y="9"
        width="64"
        height="36"
        rx="4"
        fill={isNb ? `${accentColor}1E` : '#0B1222'}
        stroke={isNb ? accentColor : '#334155'}
        strokeWidth="1.2"
      />
      <text x="36" y="24" textAnchor="middle" fill={isNb ? '#F8FAFC' : '#94A3B8'} fontSize="8" fontWeight="700">
        CPU · RAM
      </text>
      <text x="36" y="36" textAnchor="middle" fill={isNb ? accentColor : '#64748B'} fontSize="7">
        PCIe x16
      </text>

      {/* Node 2: Chipset Bridge */}
      <rect
        x="104"
        y="6"
        width="38"
        height="42"
        rx="4"
        fill={isNb || isSb || isPwr ? `${accentColor}22` : '#0B1222'}
        stroke={isNb || isSb || isPwr ? accentColor : '#334155'}
        strokeWidth="1.2"
      />
      <text x="123" y="23" textAnchor="middle" fill="#F8FAFC" fontSize="8" fontWeight="700">
        {isPwr ? 'ATX' : isNb && !isSb ? 'MCH' : isSb && !isNb ? 'ICH' : 'BUS'}
      </text>
      <text x="123" y="36" textAnchor="middle" fill={accentColor} fontSize="7">
        {isPwr ? '24-PIN' : isNb && !isSb ? 'HIGH' : 'DMI'}
      </text>

      {/* Node 3: Peripherals / I/O */}
      <rect
        x="176"
        y="9"
        width="60"
        height="36"
        rx="4"
        fill={isSb || isIo ? `${accentColor}1E` : '#0B1222'}
        stroke={isSb || isIo ? accentColor : '#334155'}
        strokeWidth="1.2"
      />
      <text x="206" y="24" textAnchor="middle" fill={isSb || isIo ? '#F8FAFC' : '#94A3B8'} fontSize="8" fontWeight="700">
        {isIo ? 'BACK I/O' : 'SATA·PCI'}
      </text>
      <text x="206" y="36" textAnchor="middle" fill={isSb || isIo ? accentColor : '#64748B'} fontSize="7">
        {isIo ? '#16–#24' : 'BIOS·I/O'}
      </text>
    </svg>
  );
}

function MemoryCpuMicro({ microKey, accentColor }: { microKey: string; accentColor: string }) {
  const isCpu = microKey.startsWith('cpu-') || microKey.startsWith('intel-') || microKey.startsWith('amd-');

  if (isCpu) {
    const eras = [
      { id: 'early', label: '1985–00', intel: 'i386→P4', amd: 'Am386→Athlon' },
      { id: 'mid', label: '2007–10', intel: 'Core 2/i5', amd: 'Phenom' },
      { id: 'late', label: '2011', intel: 'Core i7', amd: 'APU & FX' },
    ];
    const activeCol =
      microKey === 'intel-early' || microKey === 'amd-early'
        ? 0
        : microKey === 'cpu-lga'
          ? 1
          : 2;
    const isAmd = microKey.startsWith('amd-');
    return (
      <div className="grid grid-cols-3 gap-1" aria-label="Linimasa evolusi prosesor Intel dan AMD">
        {eras.map((era, idx) => {
          const active = idx === activeCol;
          return (
            <div
              key={era.id}
              className="rounded border px-1.5 py-1 text-left"
              style={{
                borderColor: active ? `${accentColor}66` : 'rgba(255,255,255,0.08)',
                backgroundColor: active ? `${accentColor}14` : 'rgba(255,255,255,0.02)',
              }}
            >
              <div className="font-mono text-[9px] font-bold" style={{ color: active ? accentColor : '#64748B' }}>
                {era.label}
              </div>
              <div className="truncate text-[9px] font-medium text-[#E2E8F0]">
                {isAmd ? era.amd : era.intel}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // RAM Notch geometry micro-diagram
  const isSdram = microKey === 'sdram';
  const isDdr3 = microKey === 'ddr3';
  const isRom = microKey === 'rom';

  if (isRom) {
    return (
      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
        <div
          className="rounded border px-2 py-1.5"
          style={{ borderColor: `${accentColor}70`, backgroundColor: `${accentColor}18` }}
        >
          <div className="font-mono font-bold text-[#FDE68A]">ROM BIOS</div>
          <div className="text-[9px] text-[#CBD5E1]">Non-Volatile · Permanen</div>
        </div>
        <div className="rounded border border-white/10 bg-white/[0.02] px-2 py-1.5">
          <div className="font-mono font-bold text-[#94A3B8]">RAM DIMM</div>
          <div className="text-[9px] text-[#64748B]">Volatile · Sementara</div>
        </div>
      </div>
    );
  }

  return (
    <svg viewBox="0 0 240 44" className="h-[44px] w-full" aria-label="Posisi celah notch keping memori RAM">
      <rect x="6" y="6" width="228" height="24" rx="3" fill="#0B1626" stroke={accentColor} strokeWidth="1.2" />
      {[28, 66, 104, 142, 180].map((cx) => (
        <rect key={cx} x={cx} y="11" width="22" height="12" rx="1.5" fill="#1E293B" stroke="#334155" strokeWidth="0.8" />
      ))}
      {/* Gold contact pins strip */}
      <rect x="12" y="30" width="216" height="6" rx="1" fill="#D97706" opacity="0.85" />
      {/* Physical notch cutout(s) */}
      {isSdram ? (
        <>
          <rect x="92" y="28" width="8" height="10" fill="#070D1B" />
          <rect x="152" y="28" width="8" height="10" fill="#070D1B" />
        </>
      ) : (
        <rect x={isDdr3 ? '98' : '124'} y="28" width="9" height="10" fill="#070D1B" />
      )}
      <text x="120" y="42" textAnchor="middle" fill="#94A3B8" fontSize="7.5" fontFamily="monospace">
        {isSdram
          ? 'SDRAM 168-PIN · 2 CELAH NOTCH'
          : isDdr3
            ? 'DDR3 240-PIN · NOTCH GESER KIRI'
            : 'DIMM 240-PIN · DUAL-SIDED'}
      </text>
    </svg>
  );
}

function PowerStorageMicro({ microKey, accentColor }: { microKey: string; accentColor: string }) {
  if (microKey.startsWith('psu-')) {
    const rails = [
      { id: 'psu-ac', label: 'AC 220V', sub: 'GND' },
      { id: 'psu-5vsb', label: '+5VSB', sub: 'Pin 9' },
      { id: 'psu-jumper', label: 'PS_ON', sub: 'Pin 16' },
      { id: 'psu-emi', label: '+12V', sub: 'EMI' },
    ];
    return (
      <div className="grid grid-cols-4 gap-1" aria-label="Strip jalur daya PSU ATX">
        {rails.map((r) => {
          const active = microKey === r.id || (microKey === 'psu-ups' && r.id === 'psu-ac');
          return (
            <div
              key={r.id}
              className="rounded border px-1 py-1 text-center"
              style={{
                borderColor: active ? `${accentColor}70` : 'rgba(255,255,255,0.08)',
                backgroundColor: active ? `${accentColor}1A` : 'rgba(255,255,255,0.02)',
              }}
            >
              <div className="font-mono text-[9px] font-bold" style={{ color: active ? accentColor : '#94A3B8' }}>
                {r.label}
              </div>
              <div className="text-[8px] text-[#64748B]">{r.sub}</div>
            </div>
          );
        })}
      </div>
    );
  }

  // Storage MBR vs GPT or SATA speed gauge
  if (microKey === 'hdd-mbr-gpt' || microKey === 'hdd-ntfs') {
    const isNtfs = microKey === 'hdd-ntfs';
    return (
      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
        <div className="rounded border border-white/10 bg-white/[0.02] px-2 py-1.5">
          <div className="font-mono font-bold text-[#94A3B8]">{isNtfs ? 'FAT32' : 'MBR (BIOS)'}</div>
          <div className="text-[9px] text-[#64748B]">{isNtfs ? 'Maks 4 GB / file' : 'Maks 2 TB · 4 primer'}</div>
        </div>
        <div
          className="rounded border px-2 py-1.5"
          style={{ borderColor: `${accentColor}70`, backgroundColor: `${accentColor}16` }}
        >
          <div className="font-mono font-bold" style={{ color: accentColor }}>
            {isNtfs ? 'NTFS (Wajib C:)' : 'GPT (UEFI)'}
          </div>
          <div className="text-[9px] text-[#E2E8F0]">{isNtfs ? '> 4 GB · Enkripsi' : '> 2 TB · 128 primer'}</div>
        </div>
      </div>
    );
  }

  const tiers = [
    { label: 'PATA IDE', val: '133 MB/s', active: microKey === 'hdd-ide' },
    { label: 'SATA 1–2', val: '1.5–3 GB/s', active: microKey === 'hdd-platter' },
    { label: 'SATA 3', val: '6 GB/s', active: microKey === 'hdd-sata' },
  ];
  return (
    <div className="grid grid-cols-3 gap-1">
      {tiers.map((t) => (
        <div
          key={t.label}
          className="rounded border px-1.5 py-1 text-center"
          style={{
            borderColor: t.active ? `${accentColor}70` : 'rgba(255,255,255,0.08)',
            backgroundColor: t.active ? `${accentColor}16` : 'rgba(255,255,255,0.02)',
          }}
        >
          <div className="font-mono text-[9px] font-bold" style={{ color: t.active ? accentColor : '#94A3B8' }}>
            {t.label}
          </div>
          <div className="text-[8px] text-[#CBD5E1] tabular-nums">{t.val}</div>
        </div>
      ))}
    </div>
  );
}

function OsPipelineMicro({ microKey, accentColor }: { microKey: string; accentColor: string }) {
  const stepMap: Record<string, number> = {
    'os-step-1': 0,
    'os-step-2': 1,
    'os-step-3': 2,
    'os-step-4': 3,
  };
  const current = stepMap[microKey] ?? 0;
  const labels = ['BIOS F10', 'EULA·NTFS', 'Key·WIB', 'Driver'];

  return (
    <div className="grid grid-cols-4 gap-1" aria-label="Tahapan instalasi sistem operasi">
      {labels.map((lbl, idx) => {
        const done = idx < current;
        const active = idx === current;
        return (
          <div
            key={lbl}
            className="rounded border px-1 py-1 text-center"
            style={{
              borderColor: active
                ? `${accentColor}88`
                : done
                  ? 'rgba(16,185,129,0.4)'
                  : 'rgba(255,255,255,0.08)',
              backgroundColor: active
                ? `${accentColor}1C`
                : done
                  ? 'rgba(16,185,129,0.08)'
                  : 'rgba(255,255,255,0.02)',
            }}
          >
            <div
              className="font-mono text-[8px] font-bold"
              style={{ color: active ? accentColor : done ? '#10B981' : '#64748B' }}
            >
              {done ? 'OK' : `0${idx + 1}`}
            </div>
            <div className="truncate text-[8.5px] font-medium text-[#E2E8F0]">{lbl}</div>
          </div>
        );
      })}
    </div>
  );
}

function TroubleshootMicro({ microKey, accentColor }: { microKey: string; accentColor: string }) {
  const metrics: Record<string, { label: string; severity: number; check: string }> = {
    'ts-matot': { label: 'Daya PSU / ATX', severity: 96, check: 'Jumper Pin 16' },
    'ts-blank': { label: 'Kontak Pin RAM', severity: 74, check: 'Bersihkan Pin' },
    'ts-cmos': { label: 'Baterai CR2032', severity: 62, check: 'Ukur < 2V' },
    'ts-overheat': { label: 'Suhu CPU / Pasta', severity: 92, check: 'Cek Heatsink' },
    'ts-hdd': { label: 'Sektor Disk / OS', severity: 70, check: 'HBCD & Safe Mode' },
  };
  const info = metrics[microKey] ?? metrics['ts-matot'];

  return (
    <div className="space-y-1.5 rounded border border-white/10 bg-white/[0.02] px-2.5 py-2">
      <div className="flex items-center justify-between text-[10px]">
        <span className="font-medium text-[#CBD5E1]">{info.label}</span>
        <span className="font-mono font-bold" style={{ color: accentColor }}>
          {info.check}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${info.severity}%`, backgroundColor: accentColor }}
        />
      </div>
    </div>
  );
}

function ElectronicsMicro({ microKey, accentColor }: { microKey: string; accentColor: string }) {
  if (microKey === 'elec-resistor') {
    const bands = [
      { label: '1', color: '#92400E' },
      { label: '0', color: '#0F172A' },
      { label: '×100', color: '#DC2626' },
      { label: '±10%', color: '#CBD5E1' },
    ];
    return (
      <div className="space-y-1">
        <div className="flex h-7 items-center justify-center rounded border border-white/10 bg-[#0B1222] px-3">
          <div className="h-0.5 w-5 bg-[#94A3B8]" />
          <div className="flex h-5 flex-1 items-center justify-evenly rounded-sm bg-[#D6B98C] px-2">
            {bands.map((b) => (
              <span
                key={b.label}
                className="h-full w-2.5 border-x border-black/20"
                style={{ backgroundColor: b.color }}
                title={b.label}
              />
            ))}
          </div>
          <div className="h-0.5 w-5 bg-[#94A3B8]" />
        </div>
        <div className="flex justify-between font-mono text-[9px] text-[#CBD5E1] tabular-nums">
          <span>Coklat·Hitam·Merah·Perak</span>
          <span style={{ color: accentColor }}>900–1100 Ω</span>
        </div>
      </div>
    );
  }

  // Analog Ohmmeter needle arc (∞ left -> 0 Ω right)
  const angleMap: Record<string, { deg: number; status: string }> = {
    'elec-zero': { deg: 52, status: 'KALIBRASI TEPAT 0 Ω' },
    'elec-cap': { deg: -24, status: '103 = 10.000 pF (0,01 µF)' },
    'elec-good': { deg: -36, status: 'NAIK → KEMBALI KE ∞ (BAIK)' },
    'elec-short': { deg: 54, status: 'MENTOK 0 Ω (SHORT!)' },
  };
  const cfg = angleMap[microKey] ?? angleMap['elec-zero'];

  return (
    <div className="rounded border border-white/10 bg-[#080F1E] px-2.5 py-1.5">
      <svg viewBox="0 0 180 46" className="h-[40px] w-full" aria-label="Skala jarum ohmmeter analog">
        <path d="M 24 40 A 66 66 0 0 1 156 40" fill="none" stroke="#334155" strokeWidth="3" />
        <path d="M 122 14 A 66 66 0 0 1 156 40" fill="none" stroke={accentColor} strokeWidth="3" />
        <text x="16" y="42" fill="#94A3B8" fontSize="9" fontFamily="monospace">∞</text>
        <text x="159" y="42" fill={accentColor} fontSize="9" fontFamily="monospace">0Ω</text>
        <g transform={`translate(90, 42) rotate(${cfg.deg})`}>
          <line x1="0" y1="0" x2="0" y2="-34" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
          <circle cx="0" cy="0" r="3" fill="#F8FAFC" />
        </g>
      </svg>
      <div className="text-center font-mono text-[9px] font-semibold" style={{ color: accentColor }}>
        {cfg.status}
      </div>
    </div>
  );
}

function LegalCyberMicro({ microKey, accentColor }: { microKey: string; accentColor: string }) {
  const isCrack = microKey.startsWith('crack-');
  const items = isCrack
    ? [
        { id: 'crack-patch', label: 'Patch', sub: 'Ubah .exe' },
        { id: 'crack-loader', label: 'Loader', sub: 'Bypass RAM' },
        { id: 'crack-malware', label: 'Malware', sub: 'Trojan/AV' },
        { id: 'crack-legal', label: 'UU HC', sub: 'Pidana' },
      ]
    : [
        { id: 'eula-license', label: 'Lisensi', sub: 'Izin Pakai' },
        { id: 'eula-telemetry', label: 'Telemetri', sub: 'Data/HWID' },
        { id: 'eula-firewall', label: 'Firewall', sub: 'Port/CPU' },
      ];

  return (
    <div
      className={`grid gap-1 ${isCrack ? 'grid-cols-4' : 'grid-cols-3'}`}
      aria-label="Indikator risiko hukum dan keamanan siber"
    >
      {items.map((item) => {
        const active = microKey === item.id;
        return (
          <div
            key={item.id}
            className="rounded border px-1 py-1 text-center"
            style={{
              borderColor: active ? `${accentColor}78` : 'rgba(255,255,255,0.08)',
              backgroundColor: active ? `${accentColor}1C` : 'rgba(255,255,255,0.02)',
            }}
          >
            <div className="font-mono text-[9px] font-bold" style={{ color: active ? accentColor : '#94A3B8' }}>
              {item.label}
            </div>
            <div className="truncate text-[8px] text-[#CBD5E1]">{item.sub}</div>
          </div>
        );
      })}
    </div>
  );
}

export function TheaterCardMicroVisual({
  variant,
  microKey,
  accentColor,
}: TheaterCardMicroVisualProps) {
  switch (variant) {
    case 'ipo-flow':
      return <IpoFlowMicro microKey={microKey} accentColor={accentColor} />;
    case 'hardware-anatomy':
      return <HardwareBusMicro microKey={microKey} accentColor={accentColor} />;
    case 'memory-cpu':
      return <MemoryCpuMicro microKey={microKey} accentColor={accentColor} />;
    case 'power-storage':
      return <PowerStorageMicro microKey={microKey} accentColor={accentColor} />;
    case 'os-pipeline':
      return <OsPipelineMicro microKey={microKey} accentColor={accentColor} />;
    case 'troubleshoot-meter':
      return <TroubleshootMicro microKey={microKey} accentColor={accentColor} />;
    case 'electronics':
      return <ElectronicsMicro microKey={microKey} accentColor={accentColor} />;
    case 'legal-cyber':
      return <LegalCyberMicro microKey={microKey} accentColor={accentColor} />;
  }
}
