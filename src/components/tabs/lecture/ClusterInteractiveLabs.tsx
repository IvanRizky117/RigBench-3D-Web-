import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle,
  Cpu,
  Fan,
  Lightning,
  ShieldWarning,
  Warning,
  Wrench,
} from '@phosphor-icons/react';
import {
  ATX_24_PINS,
  CPU_TIMELINE,
  CRACK_TOOLS,
  EULA_CLAUSES,
  MBR_VS_GPT_COMPARISON,
  PIRACY_PILLARS,
  RAM_GENERATIONS,
  SEMICONDUCTOR_REFERENCE,
  TROUBLESHOOTING_CASES,
} from '../../../data/curriculumData';
import { MAINBOARD_COMPONENTS } from '../../../data/mainboardData';
import type { ClusterId } from '../../../types/rigbench';
import {
  calculateResistor,
  decodeCeramicCapacitor,
  RESISTOR_COLORS,
} from '../../../utils/electronicsCalc';
import { ArchitectureLabs } from './ArchitectureLabs';
import { HistoryLabs } from './HistoryLabs';
import { ClusterQuickQuiz } from './ClusterQuickQuiz';

interface ClusterInteractiveLabsProps {
  clusterId: ClusterId;
  onJumpTo3DComponent: (componentId: string) => void;
  onNotify: (title: string, description: string, variant?: 'info' | 'success' | 'warning') => void;
}

export function ClusterInteractiveLabs({
  clusterId,
  onJumpTo3DComponent,
  onNotify,
}: ClusterInteractiveLabsProps) {
  // Cluster 2 state
  const [cpuFilter, setCpuFilter] = useState<'Semua' | 'Intel' | 'AMD'>('Semua');
  const [selectedRamId, setSelectedRamId] = useState<string>('ddr2');

  // Cluster 3 ATX 24-Pin Jumper Simulator state
  const [selectedPins, setSelectedPins] = useState<number[]>([]);
  const [inspectedPin, setInspectedPin] = useState<number>(16);

  // Cluster 5 Troubleshooting Explorer state
  const [activeTsId, setActiveTsId] = useState<string>('ts-blank');

  // Cluster 6 Electronics Calculators state
  const [bandCount, setBandCount] = useState<4 | 5 | 6>(4);
  const [band1Id, setBand1Id] = useState('brown');
  const [band2Id, setBand2Id] = useState('black');
  const [band3Id, setBand3Id] = useState('black');
  const [multiplierId, setMultiplierId] = useState('red');
  const [toleranceId, setToleranceId] = useState('silver');
  const [tempCoeffId, setTempCoeffId] = useState('brown');
  const [capCode, setCapCode] = useState('103');

  // Cluster 7 EULA Clause Inspector state
  const [activeClauseId, setActiveClauseId] = useState<string>('eula-4');

  const resistorResult = useMemo(
    () =>
      calculateResistor({
        bandCount,
        band1Id,
        band2Id,
        band3Id,
        multiplierId,
        toleranceId,
        tempCoeffId,
      }),
    [bandCount, band1Id, band2Id, band3Id, multiplierId, toleranceId, tempCoeffId]
  );

  const capacitorResult = useMemo(() => decodeCeramicCapacitor(capCode), [capCode]);

  // Determine PSU Jumper state
  const hasPsOn = selectedPins.includes(16);
  const hasGround = selectedPins.some((pinNum) => ATX_24_PINS.find((p) => p.pin === pinNum)?.isGround);
  const psuFanRunning = hasPsOn && hasGround;

  const toggleAtxPin = (pinNumber: number) => {
    setInspectedPin(pinNumber);
    setSelectedPins((prev) => {
      if (prev.includes(pinNumber)) {
        return prev.filter((p) => p !== pinNumber);
      }
      const next = prev.length >= 2 ? [prev[1], pinNumber] : [...prev, pinNumber];
      const nextHasPsOn = next.includes(16);
      const nextHasGnd = next.some((pn) => ATX_24_PINS.find((p) => p.pin === pn)?.isGround);
      if (nextHasPsOn && nextHasGnd) {
        onNotify(
          'Kipas PSU Berputar Normal!',
          'Jumper Pin 16 (Hijau PS_ON) + Ground (Hitam) berhasil mengaktifkan Main Power Supply.',
          'success'
        );
      }
      return next;
    });
  };

  // --- SUB-TAB 2: MODUL 1 — ARSITEKTUR KOMPUTER (A1–A3) + CONTOH SOAL INSTAN ---
  if (clusterId.startsWith('arch-')) {
    return (
      <div className="space-y-6">
        <ArchitectureLabs clusterId={clusterId} onNotify={onNotify} />
        <ClusterQuickQuiz clusterId={clusterId} />
      </div>
    );
  }

  // --- SUB-TAB 3: MODUL 6 — SEJARAH KOMPUTER (S1–S3) + CONTOH SOAL INSTAN ---
  if (clusterId.startsWith('hist-')) {
    return (
      <div className="space-y-6">
        <HistoryLabs clusterId={clusterId} />
        <ClusterQuickQuiz clusterId={clusterId} />
      </div>
    );
  }

  // --- KLASTER 1: 24 Titik Mainboard + Quick 3D Jump ---
  if (clusterId === 'cluster-1') {
    const boardPts = MAINBOARD_COMPONENTS.filter((c) => c.category === 'mainboard');
    const backPts = MAINBOARD_COMPONENTS.filter((c) => c.category === 'back-panel');

    return (
      <div className="space-y-6">
        <div className="workbench-card rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
            <div>
              <h4 className="text-base font-semibold text-[#F3F4F6]">
                Referensi Cepat 24 Titik Mainboard STMIK AKI
              </h4>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">
                Klik komponen mana pun untuk langsung melakukan zoom-in di Lab PC 3D.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-3 font-mono text-xs font-semibold text-[#06B6D4]">
                15 KOMPONEN PAPAN UTAMA (#01 – #15)
              </p>
              <div className="divide-y divide-white/[0.06]">
                {boardPts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onJumpTo3DComponent(item.id)}
                    className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:bg-white/[0.03] px-2 rounded-md transition-colors"
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-semibold text-[#06B6D4] mr-2">
                        {item.pinNumber}
                      </span>
                      <span className="text-sm font-medium text-[#F3F4F6]">{item.shortName}</span>
                      <p className="mt-0.5 truncate text-xs text-[#9CA3AF]">{item.functionEssay}</p>
                    </div>
                    <ArrowRight size={14} className="shrink-0 text-[#9CA3AF]" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 font-mono text-xs font-semibold text-[#F59E0B]">
                9 PORT BACK PANEL I/O (#16 – #24)
              </p>
              <div className="divide-y divide-white/[0.06]">
                {backPts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onJumpTo3DComponent(item.id)}
                    className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:bg-white/[0.03] px-2 rounded-md transition-colors"
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-semibold text-[#F59E0B] mr-2">
                        {item.pinNumber}
                      </span>
                      <span className="text-sm font-medium text-[#F3F4F6]">{item.shortName}</span>
                      <p className="mt-0.5 truncate text-xs text-[#9CA3AF]">{item.functionEssay}</p>
                    </div>
                    <ArrowRight size={14} className="shrink-0 text-[#9CA3AF]" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- KLASTER 2: RAM Notch Explorer + Intel vs AMD Timeline (1985-2011) ---
  if (clusterId === 'cluster-2') {
    const activeRam = RAM_GENERATIONS.find((r) => r.id === selectedRamId) ?? RAM_GENERATIONS[2];
    const filteredCpus = CPU_TIMELINE.filter((c) => cpuFilter === 'Semua' || c.vendor === cpuFilter);

    return (
      <div className="space-y-6">
        {/* Interactive RAM Notch & Pin Comparison */}
        <div className="workbench-card rounded-xl p-6 space-y-5">
          <div>
            <h4 className="text-base font-semibold text-[#F3F4F6]">
              Inspektor Generasi RAM (Jumlah Pin, Posisi Notch &amp; Kapasitas)
            </h4>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              Pilih generasi memori untuk memeriksa letak celah kunci (notch) yang sering keluar di soal ABC.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {RAM_GENERATIONS.map((ram) => (
              <button
                key={ram.id}
                type="button"
                onClick={() => setSelectedRamId(ram.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium press-feedback ${
                  selectedRamId === ram.id
                    ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/40'
                    : 'bg-[#0B0E14] text-[#9CA3AF] border border-white/[0.08] hover:text-[#F3F4F6]'
                }`}
              >
                {ram.name}
              </button>
            ))}
          </div>

          {/* Visual PCB Notch Stick */}
          <div className="rounded-xl bg-[#0B0E14] p-5 border border-white/[0.06]">
            <div className="relative mx-auto max-w-2xl">
              <div className="h-14 w-full rounded-md bg-[#113A28] border border-[#10B981]/30 flex items-center justify-around px-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((chip) => (
                  <div key={chip} className="h-8 w-8 rounded-xs bg-[#0E131D] border border-white/10" />
                ))}
              </div>
              {/* Gold contact edge with exact notch cutouts */}
              <div className="relative h-3.5 w-full bg-[#EAB308]/90 rounded-b-sm overflow-hidden">
                <div
                  style={{ left: `${activeRam.notchOffsetPercent}%` }}
                  className="absolute top-0 h-full w-3 -translate-x-1/2 bg-[#0B0E14]"
                />
                {activeRam.secondNotchPercent && (
                  <div
                    style={{ left: `${activeRam.secondNotchPercent}%` }}
                    className="absolute top-0 h-full w-3 -translate-x-1/2 bg-[#0B0E14]"
                  />
                )}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
              <div>
                <p className="text-[#9CA3AF]">Jumlah Pin</p>
                <p className="mt-1 font-mono text-sm font-semibold text-[#06B6D4] tabular-nums">
                  {activeRam.pins} Pin ({activeRam.moduleType})
                </p>
              </div>
              <div>
                <p className="text-[#9CA3AF]">Celah Notch</p>
                <p className="mt-1 font-medium text-[#F3F4F6]">{activeRam.notches}</p>
              </div>
              <div>
                <p className="text-[#9CA3AF]">Kecepatan Clock</p>
                <p className="mt-1 font-mono text-[#F3F4F6]">{activeRam.speeds}</p>
              </div>
              <div>
                <p className="text-[#9CA3AF]">Kapasitas Maks</p>
                <p className="mt-1 font-medium text-[#10B981]">{activeRam.maxCapacity}</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[#9CA3AF]">{activeRam.note}</p>
          </div>
        </div>

        {/* Grafik Garis Waktu Evolusi Processor Intel vs AMD (1985-2011) */}
        <div className="workbench-card rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-semibold text-[#F3F4F6]">
                Grafik Garis Waktu Evolusi Processor Intel vs AMD (1985–2011)
              </h4>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">
                Data kronologis lengkap sesuai halaman 10–11 E-Book Praktikum HW-SW STMIK AKI.
              </p>
            </div>
            <div className="inline-flex rounded-lg bg-[#0B0E14] p-1 border border-white/[0.08]">
              {(['Semua', 'Intel', 'AMD'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setCpuFilter(v)}
                  className={`rounded-md px-3 py-1 text-xs font-medium press-feedback ${
                    cpuFilter === v
                      ? 'bg-[#06B6D4]/20 text-[#06B6D4]'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCpus.map((item) => {
              const isIntel = item.vendor === 'Intel';
              return (
                <div
                  key={`${item.vendor}-${item.year}-${item.model}`}
                  className="flex items-start gap-3 rounded-lg bg-[#0B0E14] px-3.5 py-3 border border-white/[0.06]"
                >
                  <span
                    className={`font-mono text-xs font-bold tabular-nums shrink-0 ${
                      isIntel ? 'text-[#06B6D4]' : 'text-[#F59E0B]'
                    }`}
                  >
                    {item.year}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#F3F4F6]">
                      {item.vendor} {item.model}
                    </p>
                    <p className="mt-0.5 text-xs text-[#9CA3AF]">{item.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- KLASTER 3: Simulator Interaktif Pinout ATX 24-Pin ---
  if (clusterId === 'cluster-3') {
    const leftPins = ATX_24_PINS.slice(0, 12);
    const rightPins = ATX_24_PINS.slice(12, 24);
    const activePinObj = ATX_24_PINS.find((p) => p.pin === inspectedPin) ?? ATX_24_PINS[15];

    return (
      <div className="workbench-card rounded-xl p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h4 className="text-base font-semibold text-[#F3F4F6]">
              Simulator Interaktif Pinout ATX 24-Pin (Uji Jumper PSU)
            </h4>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Klik dua pin untuk menjumper: hubungkan <span className="font-semibold text-[#10B981]">Pin 16 Hijau (PS_ON#)</span> dengan salah satu <span className="font-semibold text-[#F3F4F6]">Pin Hitam (COM/Ground)</span> untuk menyalakan kipas PSU!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedPins([16, 15]);
                setInspectedPin(16);
                onNotify('Jumper Otomatis Terpasang', 'Pin 16 (Hijau) terhubung ke Pin 15 (Hitam Ground).', 'success');
              }}
              className="rounded-lg bg-[#06B6D4]/15 px-3 py-1.5 text-xs font-semibold text-[#06B6D4] border border-[#06B6D4]/30 hover:bg-[#06B6D4]/25 press-feedback"
            >
              Demo Jumper Hijau–Hitam
            </button>
            <button
              type="button"
              onClick={() => setSelectedPins([])}
              className="rounded-lg bg-[#0B0E14] px-3 py-1.5 text-xs text-[#9CA3AF] border border-white/10 hover:text-[#F3F4F6]"
            >
              Lepas Jumper
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* 24-Pin Visual Connector Grid */}
          <div className="lg:col-span-7 rounded-xl bg-[#0B0E14] p-4 border border-white/[0.06]">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-center font-mono text-[11px] text-[#9CA3AF] mb-2">BARIS PIN 01 – 12</p>
                {leftPins.map((p) => {
                  const chosen = selectedPins.includes(p.pin);
                  return (
                    <button
                      key={p.pin}
                      type="button"
                      onClick={() => toggleAtxPin(p.pin)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors ${
                        chosen
                          ? 'bg-[#06B6D4]/20 border border-[#06B6D4]'
                          : 'bg-[#141923] border border-white/[0.06] hover:border-white/25'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-3.5 w-3.5 rounded-xs border border-white/25 shrink-0"
                          style={{ backgroundColor: p.colorHex }}
                        />
                        <span className="font-mono font-semibold text-[#F3F4F6] tabular-nums">
                          #{String(p.pin).padStart(2, '0')}
                        </span>
                        <span className="text-[#9CA3AF]">{p.colorName}</span>
                      </span>
                      <span className="font-mono text-[11px] text-[#E5E7EB]">{p.signal}</span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <p className="text-center font-mono text-[11px] text-[#9CA3AF] mb-2">BARIS PIN 13 – 24</p>
                {rightPins.map((p) => {
                  const chosen = selectedPins.includes(p.pin);
                  return (
                    <button
                      key={p.pin}
                      type="button"
                      onClick={() => toggleAtxPin(p.pin)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors ${
                        chosen
                          ? 'bg-[#06B6D4]/20 border border-[#06B6D4]'
                          : 'bg-[#141923] border border-white/[0.06] hover:border-white/25'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-3.5 w-3.5 rounded-xs border border-white/25 shrink-0"
                          style={{ backgroundColor: p.colorHex }}
                        />
                        <span className="font-mono font-semibold text-[#F3F4F6] tabular-nums">
                          #{String(p.pin).padStart(2, '0')}
                        </span>
                        <span className="text-[#9CA3AF]">{p.colorName}</span>
                      </span>
                      <span className={`font-mono text-[11px] ${p.isPsOn ? 'text-[#10B981] font-bold' : 'text-[#E5E7EB]'}`}>
                        {p.signal}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live PSU Fan & Rail Telemetry */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            <div className="rounded-xl bg-[#0B0E14] p-5 border border-white/[0.06] text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-[#141923]">
                <Fan
                  size={52}
                  weight="duotone"
                  className={
                    psuFanRunning
                      ? 'text-[#10B981] animate-spin'
                      : 'text-[#64748B]'
                  }
                  style={psuFanRunning ? { animationDuration: '1.1s' } : undefined}
                />
              </div>
              <p className={`mt-4 text-sm font-semibold ${psuFanRunning ? 'text-[#10B981]' : 'text-[#9CA3AF]'}`}>
                {psuFanRunning ? 'MAIN POWER SUPPLY AKTIF (KIPAS BERPUTAR)' : 'MODE STAND-BY (+5VSB AKTIF)'}
              </p>
              <p className="mt-1 font-mono text-xs text-[#9CA3AF]">
                Jumper terpilih:{' '}
                {selectedPins.length === 0
                  ? 'Belum ada'
                  : selectedPins.map((n) => `Pin #${n}`).join(' ↔ ')}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-left font-mono text-xs">
                <div className="rounded-lg bg-[#141923] px-3 py-2">
                  <span className="text-[#A855F7]">+5VSB:</span>{' '}
                  <span className="text-[#10B981]">5.04V</span>
                </div>
                <div className="rounded-lg bg-[#141923] px-3 py-2">
                  <span className="text-[#F97316]">+3.3V:</span>{' '}
                  <span className={psuFanRunning ? 'text-[#10B981]' : 'text-[#64748B]'}>
                    {psuFanRunning ? '3.31V' : '0.00V'}
                  </span>
                </div>
                <div className="rounded-lg bg-[#141923] px-3 py-2">
                  <span className="text-[#EF4444]">+5.0V:</span>{' '}
                  <span className={psuFanRunning ? 'text-[#10B981]' : 'text-[#64748B]'}>
                    {psuFanRunning ? '5.02V' : '0.00V'}
                  </span>
                </div>
                <div className="rounded-lg bg-[#141923] px-3 py-2">
                  <span className="text-[#EAB308]">+12.0V:</span>{' '}
                  <span className={psuFanRunning ? 'text-[#10B981]' : 'text-[#64748B]'}>
                    {psuFanRunning ? '12.08V' : '0.00V'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#0B0E14] p-4 border border-white/[0.06] space-y-1.5">
              <p className="font-mono text-xs text-[#06B6D4]">
                INSPEKSI PIN #{String(activePinObj.pin).padStart(2, '0')} · {activePinObj.signal}
              </p>
              <p className="text-sm font-semibold text-[#F3F4F6]">
                Kabel {activePinObj.colorName} ({activePinObj.voltage})
              </p>
              <p className="text-xs leading-relaxed text-[#9CA3AF]">{activePinObj.role}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- KLASTER 4: Grafik Komparasi MBR vs GPT + NTFS vs FAT32 ---
  if (clusterId === 'cluster-4') {
    return (
      <div className="space-y-6">
        <div className="workbench-card rounded-xl p-6 space-y-5">
          <div>
            <h4 className="text-base font-semibold text-[#F3F4F6]">
              Grafik &amp; Tabel Komparasi Skema Partisi: MBR vs GPT
            </h4>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              Indeks kapabilitas arsitektur standar CompTIA A+ &amp; Panduan Praktikum TTS STMIK AKI.
            </p>
          </div>

          <div className="space-y-4">
            {MBR_VS_GPT_COMPARISON.map((row) => (
              <div key={row.parameter} className="space-y-2 pb-4 border-b border-white/[0.06] last:border-none last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#F3F4F6]">{row.parameter}</span>
                  <span className="font-mono text-xs text-[#9CA3AF]">
                    MBR {row.mbrScore}% · GPT {row.gptScore}%
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                  <div className="space-y-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#0B0E14]">
                      <div className="h-full rounded-full bg-[#64748B]" style={{ width: `${row.mbrScore}%` }} />
                    </div>
                    <p className="text-[#9CA3AF]">
                      <strong className="text-[#CBD5E1]">MBR:</strong> {row.mbr}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#0B0E14]">
                      <div className="h-full rounded-full bg-[#06B6D4]" style={{ width: `${row.gptScore}%` }} />
                    </div>
                    <p className="text-[#E5E7EB]">
                      <strong className="text-[#06B6D4]">GPT:</strong> {row.gpt}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- KLASTER 5: Bedah 6 Kasus Troubleshooting Hardware ---
  if (clusterId === 'cluster-5') {
    const activeCase = TROUBLESHOOTING_CASES.find((c) => c.id === activeTsId) ?? TROUBLESHOOTING_CASES[1];
    return (
      <div className="workbench-card rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-semibold text-[#F3F4F6]">
              Bedah 6 Kasus Troubleshooting PC (Gejala → Penyebab → Perbaikan)
            </h4>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              Pilih kasus untuk menghafal alur diagnosa sistematis ujian Essay TTS.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {TROUBLESHOOTING_CASES.map((tc) => (
            <button
              key={tc.id}
              type="button"
              onClick={() => setActiveTsId(tc.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium press-feedback ${
                activeTsId === tc.id
                  ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/40'
                  : 'bg-[#0B0E14] text-[#9CA3AF] border border-white/[0.08] hover:text-[#F3F4F6]'
              }`}
            >
              {tc.number}. {tc.shortLabel}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-4">
            <div>
              <p className="font-mono text-xs font-semibold text-[#F59E0B] mb-2">GEJALA TERAMATI</p>
              <ul className="space-y-1.5 text-sm text-[#E5E7EB]">
                {activeCase.symptoms.map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#F59E0B] shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-mono text-xs font-semibold text-[#F43F5E] mb-2">KEMUNGKINAN PENYEBAB</p>
              <ol className="space-y-1.5 text-sm text-[#9CA3AF] list-decimal list-inside">
                {activeCase.causes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ol>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <p className="font-mono text-xs font-semibold text-[#10B981]">PROSEDUR PERBAIKAN BERTAHAP</p>
            <div className="divide-y divide-white/[0.06] rounded-xl bg-[#0B0E14] border border-white/[0.06]">
              {activeCase.steps.map((st) => (
                <div key={st.area} className="p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold text-[#06B6D4]">
                    <Wrench size={14} weight="duotone" />
                    {st.area}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs leading-relaxed text-[#E5E7EB]">
                    {st.actions.map((a) => (
                      <li key={a}>• {a}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-[#10B981]/10 px-3.5 py-2.5 text-xs text-[#A7F3D0] border border-[#10B981]/25">
              <CheckCircle size={15} weight="fill" className="mt-0.5 shrink-0 text-[#10B981]" />
              <span>{activeCase.essayKeyTip}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- KLASTER 6: Kalkulator Resistor (4/5/6 gelang) + Dekoder Kapasitor + Semikonduktor ---
  if (clusterId === 'cluster-6') {
    const digitColors = RESISTOR_COLORS.filter((c) => c.digit !== null);
    const multColors = RESISTOR_COLORS.filter((c) => c.multiplier !== null);
    const tolColors = RESISTOR_COLORS.filter((c) => c.tolerance !== null);
    const ppmColors = RESISTOR_COLORS.filter((c) => c.tempCoeffPpm !== null);
    const getHex = (id: string) => RESISTOR_COLORS.find((c) => c.id === id)?.hex ?? '#78350F';

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Resistor Color Code Calculator */}
          <div className="workbench-card rounded-xl p-6 lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-semibold text-[#F3F4F6]">
                  Kalkulator Gelang Warna Resistor
                </h4>
                <p className="text-xs text-[#9CA3AF]">Default contoh modul: Coklat–Hitam–Merah–Perak = 1 kΩ ±10%</p>
              </div>
              <div className="inline-flex rounded-lg bg-[#0B0E14] p-0.5 border border-white/[0.08]">
                {([4, 5, 6] as const).map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setBandCount(cnt)}
                    className={`rounded-md px-2.5 py-1 font-mono text-xs press-feedback ${
                      bandCount === cnt ? 'bg-[#06B6D4]/20 text-[#06B6D4]' : 'text-[#9CA3AF]'
                    }`}
                  >
                    {cnt} Gelang
                  </button>
                ))}
              </div>
            </div>

            {/* Live Resistor Visual */}
            <div className="flex items-center justify-center rounded-xl bg-[#0B0E14] py-6 px-4 border border-white/[0.06]">
              <div className="h-1.5 w-12 bg-[#94A3B8]" />
              <div className="flex h-14 w-64 items-center justify-evenly rounded-2xl bg-[#D6C29F] px-5 border-2 border-[#92400E]/40">
                <div className="h-full w-3.5" style={{ backgroundColor: getHex(band1Id) }} />
                <div className="h-full w-3.5" style={{ backgroundColor: getHex(band2Id) }} />
                {bandCount >= 5 && (
                  <div className="h-full w-3.5" style={{ backgroundColor: getHex(band3Id) }} />
                )}
                <div className="h-full w-3.5" style={{ backgroundColor: getHex(multiplierId) }} />
                <div className="h-full w-3.5 ml-3" style={{ backgroundColor: getHex(toleranceId) }} />
                {bandCount === 6 && (
                  <div className="h-full w-3.5" style={{ backgroundColor: getHex(tempCoeffId) }} />
                )}
              </div>
              <div className="h-1.5 w-12 bg-[#94A3B8]" />
            </div>

            {/* Band Selectors */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 text-xs">
              <label className="space-y-1">
                <span className="text-[#9CA3AF]">Gelang 1 (Digit I)</span>
                <select
                  value={band1Id}
                  onChange={(e) => setBand1Id(e.target.value)}
                  className="w-full rounded-lg bg-[#0B0E14] px-2.5 py-2 text-[#F3F4F6] border border-white/10"
                >
                  {digitColors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} ({c.digit})
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-[#9CA3AF]">Gelang 2 (Digit II)</span>
                <select
                  value={band2Id}
                  onChange={(e) => setBand2Id(e.target.value)}
                  className="w-full rounded-lg bg-[#0B0E14] px-2.5 py-2 text-[#F3F4F6] border border-white/10"
                >
                  {digitColors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} ({c.digit})
                    </option>
                  ))}
                </select>
              </label>

              {bandCount >= 5 && (
                <label className="space-y-1">
                  <span className="text-[#9CA3AF]">Gelang 3 (Digit III)</span>
                  <select
                    value={band3Id}
                    onChange={(e) => setBand3Id(e.target.value)}
                    className="w-full rounded-lg bg-[#0B0E14] px-2.5 py-2 text-[#F3F4F6] border border-white/10"
                  >
                    {digitColors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label} ({c.digit})
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="space-y-1">
                <span className="text-[#9CA3AF]">Pengali (Multiplier)</span>
                <select
                  value={multiplierId}
                  onChange={(e) => setMultiplierId(e.target.value)}
                  className="w-full rounded-lg bg-[#0B0E14] px-2.5 py-2 text-[#F3F4F6] border border-white/10"
                >
                  {multColors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} (×{c.multiplier})
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-[#9CA3AF]">Toleransi</span>
                <select
                  value={toleranceId}
                  onChange={(e) => setToleranceId(e.target.value)}
                  className="w-full rounded-lg bg-[#0B0E14] px-2.5 py-2 text-[#F3F4F6] border border-white/10"
                >
                  {tolColors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} (±{c.tolerance}%)
                    </option>
                  ))}
                </select>
              </label>

              {bandCount === 6 && (
                <label className="space-y-1">
                  <span className="text-[#9CA3AF]">Koefisien Suhu</span>
                  <select
                    value={tempCoeffId}
                    onChange={(e) => setTempCoeffId(e.target.value)}
                    className="w-full rounded-lg bg-[#0B0E14] px-2.5 py-2 text-[#F3F4F6] border border-white/10"
                  >
                    {ppmColors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label} ({c.tempCoeffPpm} ppm)
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className="rounded-xl bg-[#0B0E14] p-4 border border-[#06B6D4]/30 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-[#9CA3AF]">Nilai Nominal Resistor</p>
                <p className="font-mono text-2xl font-bold text-[#06B6D4] tabular-nums">
                  {resistorResult.formatted} ±{resistorResult.tolerancePercent}%
                </p>
              </div>
              <div className="text-right font-mono text-xs">
                <p className="text-[#9CA3AF]">Rentang Valid Ohmmeter</p>
                <p className="mt-0.5 text-sm font-semibold text-[#10B981] tabular-nums">
                  {resistorResult.minFormatted} – {resistorResult.maxFormatted}
                </p>
                {resistorResult.tempCoeffPpm && (
                  <p className="text-[#F59E0B]">{resistorResult.tempCoeffPpm} ppm/K</p>
                )}
              </div>
            </div>
          </div>

          {/* Ceramic Capacitor Code Decoder */}
          <div className="workbench-card rounded-xl p-6 lg:col-span-5 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-semibold text-[#F3F4F6]">Dekoder Kapasitor Keramik</h4>
                <p className="mt-0.5 text-xs text-[#9CA3AF]">
                  Masukkan 3 digit kode badan kapasitor (contoh modul: 103).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={3}
                  value={capCode}
                  onChange={(e) => setCapCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  className="w-28 rounded-lg bg-[#0B0E14] px-3 py-2.5 text-center font-mono text-lg font-bold text-[#F59E0B] border border-white/15 focus:border-[#06B6D4] focus:outline-none"
                />
                <div className="flex flex-wrap gap-1.5">
                  {['103', '104', '472', '223'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCapCode(preset)}
                      className="rounded-md bg-[#0B0E14] px-2.5 py-1.5 font-mono text-xs text-[#9CA3AF] border border-white/10 hover:border-[#06B6D4] hover:text-[#F3F4F6]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {capacitorResult.valid ? (
                <div className="space-y-2 rounded-xl bg-[#0B0E14] p-4 border border-white/[0.06] font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Piko Farad (pF)</span>
                    <span className="font-semibold text-[#F3F4F6] tabular-nums">
                      {capacitorResult.picofarads.toLocaleString('id-ID')} pF
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Nano Farad (nF)</span>
                    <span className="font-semibold text-[#06B6D4] tabular-nums">
                      {Number(capacitorResult.nanofarads.toFixed(4))} nF
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Mikro Farad (µF)</span>
                    <span className="font-semibold text-[#10B981] tabular-nums">
                      {Number(capacitorResult.microfarads.toFixed(6))} µF
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#F59E0B]">{capacitorResult.breakdownText}</p>
              )}
            </div>

            <div className="rounded-xl bg-[#0B0E14] p-4 border border-white/[0.06] space-y-1.5 text-xs">
              <p className="font-semibold text-[#F3F4F6]">Kesimpulan Uji ELCO dengan Ohmmeter</p>
              <p className="text-[#10B981]">• Gerak lalu kembali ke semula → ELCO Baik</p>
              <p className="text-[#F59E0B]">• Gerak tidak kembali ke semula → ELCO Bocor</p>
              <p className="text-[#9CA3AF]">• Jarum diam tidak bergerak → ELCO Putus</p>
              <p className="text-[#F43F5E]">• Jarum menunjuk nol (0 Ω) → ELCO Short</p>
            </div>
          </div>
        </div>

        {/* Semiconductor & Transformer Reference Flat Rows */}
        <div className="workbench-card rounded-xl p-6">
          <h4 className="text-base font-semibold text-[#F3F4F6] mb-4">
            Referensi Semikonduktor, IC &amp; Transformator (Multitester)
          </h4>
          <div className="divide-y divide-white/[0.06]">
            {SEMICONDUCTOR_REFERENCE.map((item) => (
              <div key={item.name} className="py-3.5 grid grid-cols-1 gap-2 lg:grid-cols-12">
                <div className="lg:col-span-3">
                  <p className="text-sm font-semibold text-[#06B6D4]">{item.name}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-[#9CA3AF]">{item.spec}</p>
                </div>
                <p className="lg:col-span-4 text-xs leading-relaxed text-[#E5E7EB]">{item.principle}</p>
                <p className="lg:col-span-5 text-xs leading-relaxed text-[#9CA3AF]">{item.multitester}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- KLASTER 7: Bedah 4 Klausul EULA + 4 Alat Crack + 4 Pilar Bahaya ---
  const activeClause = EULA_CLAUSES.find((c) => c.id === activeClauseId) ?? EULA_CLAUSES[0];

  return (
    <div className="space-y-6">
      {/* Interactive 4 Critical EULA Clauses */}
      <div className="workbench-card rounded-xl p-6 space-y-5">
        <div>
          <h4 className="text-base font-semibold text-[#F3F4F6]">
            Bedah Interaktif 4 Klausul Kritis EULA (Analisis Edward Desautels)
          </h4>
          <p className="mt-0.5 text-xs text-[#9CA3AF]">
            Pilih tiap klausul untuk mempelajari mekanisme, risiko keamanan, dan sikap pengguna bijak.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-2">
            {EULA_CLAUSES.map((clause) => (
              <button
                key={clause.id}
                type="button"
                onClick={() => setActiveClauseId(clause.id)}
                className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                  activeClauseId === clause.id
                    ? 'bg-[#06B6D4]/15 text-[#F3F4F6] border border-[#06B6D4]/40'
                    : 'bg-[#0B0E14] text-[#9CA3AF] border border-white/[0.06] hover:text-[#F3F4F6]'
                }`}
              >
                <span className="font-medium">
                  <span className="font-mono text-[#06B6D4] mr-2">0{clause.number}</span>
                  {clause.title}
                </span>
                <ShieldWarning size={16} weight={activeClauseId === clause.id ? 'fill' : 'regular'} className="text-[#F59E0B] shrink-0" />
              </button>
            ))}
          </div>

          <div className="lg:col-span-7 rounded-xl bg-[#0B0E14] p-5 border border-white/[0.06] space-y-4">
            <h5 className="text-base font-semibold text-[#F3F4F6]">
              Klausul 0{activeClause.number}: {activeClause.title}
            </h5>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-mono text-[11px] text-[#06B6D4]">MEKANISME DI DOKUMEN EULA</p>
                <p className="mt-1 text-[#E5E7EB] leading-relaxed">{activeClause.mechanism}</p>
              </div>
              <div>
                <p className="font-mono text-[11px] text-[#F43F5E]">DAMPAK &amp; CELAH KEAMANAN</p>
                <p className="mt-1 text-[#FDA4AF] leading-relaxed">{activeClause.risk}</p>
              </div>
              <div>
                <p className="font-mono text-[11px] text-[#10B981]">MITIGASI PENGGUNA BIJAK</p>
                <p className="mt-1 text-[#A7F3D0] leading-relaxed">{activeClause.mitigation}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Cracking Tools Matrix */}
      <div className="workbench-card rounded-xl p-6 space-y-4">
        <h4 className="text-base font-semibold text-[#F3F4F6]">
          Anatomi 4 Alat Software Cracking (Reverse Engineering)
        </h4>
        <div className="divide-y divide-white/[0.06]">
          {CRACK_TOOLS.map((tool) => (
            <div key={tool.id} className="py-3.5 grid grid-cols-1 gap-2 lg:grid-cols-12">
              <div className="lg:col-span-3 flex items-center gap-2">
                <Cpu size={16} weight="duotone" className="text-[#06B6D4] shrink-0" />
                <span className="text-sm font-semibold text-[#F3F4F6]">{tool.name}</span>
              </div>
              <p className="lg:col-span-4 text-xs leading-relaxed text-[#E5E7EB]">{tool.mechanism}</p>
              <p className="lg:col-span-5 text-xs leading-relaxed text-[#9CA3AF]">
                <span className="text-[#F59E0B] font-medium">Ciri khas:</span> {tool.characteristic}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4 Pillars of Piracy Danger */}
      <div className="workbench-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Lightning size={18} weight="duotone" className="text-[#F43F5E]" />
          <h4 className="text-base font-semibold text-[#F3F4F6]">
            4 Pilar Bahaya Penggunaan Software Bajakan &amp; Crack
          </h4>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PIRACY_PILLARS.map((pillar) => (
            <div key={pillar.id} className="rounded-xl bg-[#0B0E14] p-4 border border-white/[0.06] space-y-2">
              <p className="text-sm font-semibold text-[#F3F4F6]">
                <span className="font-mono text-[#F43F5E] mr-2">0{pillar.number}</span>
                {pillar.title}
              </p>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">{pillar.summary}</p>
              <ul className="space-y-1 pt-1 text-xs text-[#E5E7EB]">
                {pillar.details.map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <Warning size={13} className="mt-0.5 shrink-0 text-[#F59E0B]" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
