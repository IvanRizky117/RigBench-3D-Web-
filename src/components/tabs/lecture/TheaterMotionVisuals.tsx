import {
  Bug,
  CheckCircle,
  Cpu,
  FileText,
  HardDrives,
  LockKey,
  ShieldCheck,
  ShieldWarning,
  TerminalWindow,
  WarningOctagon,
} from '@phosphor-icons/react';
import type { DirectorKeyframe, TheaterSceneKind } from '../../../data/theaterDirectorTimeline';

interface TheaterMotionVisualsProps {
  sceneKind: TheaterSceneKind;
  keyframe: DirectorKeyframe;
  keyframes: DirectorKeyframe[];
  activeIndex: number;
  progress: number;
  isWebglFallback?: boolean;
}

const OS_PIPELINE_STEPS = [
  { num: '01', title: 'BIOS Setup (Del/F2)', detail: '1st Boot: USB / CD-ROM → F10', group: 0 },
  { num: '02', title: 'Boot Media Installer', detail: 'Press any key to boot...', group: 0 },
  { num: '03', title: 'Persetujuan EULA', detail: 'Tekan F8 / I Accept License', group: 1 },
  { num: '04', title: 'Partisi & Format NTFS', detail: 'Drive C: NTFS (Sisakan 20–30%)', group: 1 },
  { num: '05', title: 'Copy Berkas & Reboot', detail: 'Ekstraksi sistem inti OS', group: 2 },
  { num: '06', title: 'Product Key 25 Digit', detail: 'Nama PC + Zona GMT+07:00', group: 2 },
  { num: '07', title: 'Driver Chipset & VGA', detail: 'Chipset · VGA · LAN · Audio', group: 3 },
  { num: '08', title: 'Aplikasi & Siap Pakai', detail: 'Sistem stabil & terverifikasi', group: 3 },
];

const EULA_CLAUSES = [
  {
    idx: '01',
    title: 'Pantau Aktivitas Internet',
    risk: 'Privasi trafik web terekam vendor',
    group: 1,
    color: '#F59E0B',
  },
  {
    idx: '02',
    title: 'Telemetri Data Pribadi',
    risk: 'HWID & log perilaku dikirim berkala',
    group: 1,
    color: '#F59E0B',
  },
  {
    idx: '03',
    title: 'Resource CPU & Bandwidth',
    risk: 'Siklus komputasi & kuota dipakai latar belakang',
    group: 2,
    color: '#F43F5E',
  },
  {
    idx: '04',
    title: 'Buka Port Firewall',
    risk: 'Celah pintu belakang (Backdoor & Trojan)',
    group: 2,
    color: '#F43F5E',
  },
];

const CRACK_VECTORS = [
  {
    badge: 'PATCH',
    target: 'Ubah File Fisik (.exe / .dll)',
    mech: 'Menimpa byte biner: ubah instruksi JNZ → JZ / NOP secara permanen di disk.',
    group: 0,
    color: '#F59E0B',
  },
  {
    badge: 'KEYGEN',
    target: 'Algoritma Serial Palsu',
    mech: 'Mereplikasi rumus matematika pembuat kode aktivasi tanpa lisensi sah.',
    group: 0,
    color: '#F59E0B',
  },
  {
    badge: 'LOADER',
    target: 'Injeksi Memori RAM',
    mech: 'Tidak mengubah file fisik, melainkan memanipulasi validasi lisensi langsung di RAM.',
    group: 1,
    color: '#A855F7',
  },
];

export function TheaterMotionVisuals({
  sceneKind,
  keyframe,
  keyframes,
  activeIndex,
  progress,
  isWebglFallback = false,
}: TheaterMotionVisualsProps) {
  // 1. OS Installation Interactive Animated Pipeline (WebGL Fallback)
  if (sceneKind === 'monitor-os') {
    return (
      <div className="relative flex h-full w-full flex-col justify-end bg-[#040A16] p-4 sm:p-6">
        <div className="mt-auto grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 pt-28 sm:pt-20">
          {OS_PIPELINE_STEPS.map((step, i) => {
            const isActive = step.group === activeIndex;
            const isPast = step.group < activeIndex;
            return (
              <div
                key={step.num}
                className={`rounded-xl border p-2.5 sm:p-3 transition-all duration-300 ${
                  isActive
                    ? 'border-[#38BDF8] bg-[#0B2244] shadow-[0_0_24px_-8px_rgba(56,189,248,0.65)] scale-[1.02]'
                    : isPast
                      ? 'border-[#10B981]/40 bg-[#071A21]'
                      : 'border-[#1E293B] bg-[#071022]/85 opacity-65'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-[10px] font-bold text-[#38BDF8] tabular-nums">
                    TAHAP {step.num}
                  </span>
                  {isPast ? (
                    <CheckCircle size={13} weight="fill" className="text-[#10B981]" />
                  ) : isActive ? (
                    <TerminalWindow size={13} weight="duotone" className="text-[#38BDF8]" />
                  ) : (
                    <span className="font-mono text-[10px] text-[#475569] tabular-nums">{i + 1}/8</span>
                  )}
                </div>
                <p className="mt-1 text-xs font-semibold text-[#F8FAFC] leading-snug">
                  {step.title}
                </p>
                <p className="mt-0.5 text-[11px] text-[#94A3B8] leading-snug">
                  {step.detail}
                </p>
              </div>
            );
          })}
        </div>

        {/* Animated Install Progress Track */}
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-[#1E293B] bg-[#060D1E] px-3 py-2">
          <HardDrives size={15} weight="duotone" className="shrink-0 text-[#38BDF8]" />
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#0F1E3A]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2563EB] via-[#38BDF8] to-[#10B981] transition-all duration-300"
              style={{ width: `${Math.max(8, progress)}%` }}
            />
          </div>
          <span className="font-mono text-[11px] font-semibold text-[#7DD3FC] tabular-nums">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    );
  }

  // 2. EULA Legal Shield & 4 Critical Clauses (WebGL Fallback)
  if (sceneKind === 'monitor-eula') {
    const isContractFocus = activeIndex === 0;
    return (
      <div className="relative flex h-full w-full flex-col justify-end bg-[#040A16] p-4 sm:p-6">
        <div className="mt-auto grid grid-cols-1 gap-3 md:grid-cols-[1fr_1.45fr] pt-28 sm:pt-16">
          <div
            className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-300 ${
              isContractFocus
                ? 'border-[#38BDF8] bg-[#091D3A] shadow-[0_0_24px_-8px_rgba(56,189,248,0.6)]'
                : 'border-[#1E293B] bg-[#071022]'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} weight="duotone" className="text-[#38BDF8]" />
              <span className="font-mono text-xs font-semibold text-[#7DD3FC]">
                KONTRAK HUKUM EULA
              </span>
            </div>
            <div className="my-2 space-y-1.5 text-xs text-[#CBD5E1]">
              <p className="flex items-center gap-1.5">
                <FileText size={14} className="shrink-0 text-[#10B981]" />
                <span>Membeli = <strong className="text-[#F8FAFC]">Hak Izin Pakai (Lisensi)</strong></span>
              </p>
              <p className="flex items-center gap-1.5">
                <LockKey size={14} className="shrink-0 text-[#F59E0B]" />
                <span>Bukan kepemilikan kode sumber program</span>
              </p>
            </div>
            <div className="rounded-lg border border-[#10B981]/40 bg-[#10B981]/12 px-2.5 py-1.5 text-center font-mono text-[11px] font-semibold text-[#34D399]">
              KLIK &quot;I ACCEPT&quot; → KONTRAK MENGIKAT
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {EULA_CLAUSES.map((clause) => {
              const active = clause.group === activeIndex;
              return (
                <div
                  key={clause.idx}
                  className={`rounded-xl border p-2.5 transition-all duration-300 ${
                    active
                      ? 'bg-[#161224] scale-[1.02]'
                      : 'border-[#1E293B] bg-[#071022]/85 opacity-70'
                  }`}
                  style={active ? { borderColor: clause.color } : undefined}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="font-mono text-[10px] font-bold"
                      style={{ color: clause.color }}
                    >
                      KLAUSUL #{clause.idx}
                    </span>
                    <ShieldWarning size={14} style={{ color: clause.color }} />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-[#F8FAFC]">{clause.title}</p>
                  <p className="mt-0.5 text-[11px] text-[#94A3B8] leading-snug">{clause.risk}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 3. Software Cracking Anatomy & 4 Piracy Pillars (WebGL Fallback)
  if (sceneKind === 'monitor-crack') {
    const showDangerPillars = activeIndex >= 2;
    return (
      <div className="relative flex h-full w-full flex-col justify-end bg-[#040A16] p-4 sm:p-6">
        <div className="mt-auto space-y-2.5 pt-28 sm:pt-16">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {CRACK_VECTORS.map((tool) => {
              const active = tool.group === activeIndex;
              return (
                <div
                  key={tool.badge}
                  className={`rounded-xl border p-2.5 sm:p-3 transition-all duration-300 ${
                    active ? 'bg-[#141126] scale-[1.02]' : 'border-[#1E293B] bg-[#071022]/85 opacity-70'
                  }`}
                  style={active ? { borderColor: tool.color } : undefined}
                >
                  <span
                    className="inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#030712]"
                    style={{ backgroundColor: tool.color }}
                  >
                    {tool.badge}
                  </span>
                  <p className="mt-1.5 text-xs font-semibold text-[#F8FAFC]">{tool.target}</p>
                  <p className="mt-0.5 text-[11px] text-[#94A3B8] leading-snug">{tool.mech}</p>
                </div>
              );
            })}
          </div>

          <div
            className={`grid grid-cols-2 gap-2 sm:grid-cols-4 rounded-xl border p-2.5 transition-all duration-300 ${
              showDangerPillars
                ? 'border-[#F43F5E]/65 bg-[#1B0A14]'
                : 'border-[#1E293B] bg-[#060D1E]/90 opacity-75'
            }`}
          >
            {[
              { id: '1', label: 'Trojan & Ransomware', sub: 'Antivirus dimatikan' },
              { id: '2', label: 'Tanpa Security Update', sub: 'Crash & celah rawan' },
              { id: '3', label: 'UU Hak Cipta', sub: 'Sanksi pidana & perdata' },
              { id: '4', label: 'Etika & Inovasi', sub: 'Merugikan developer' },
            ].map((pilar, i) => {
              const hot =
                (activeIndex === 2 && i < 2) || (activeIndex === 3 && i >= 2);
              return (
                <div
                  key={pilar.id}
                  className={`rounded-lg border px-2.5 py-2 ${
                    hot
                      ? 'border-[#F43F5E] bg-[#2C0E1E]'
                      : 'border-[#1E293B] bg-[#081020]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {i < 2 ? (
                      <Bug size={13} className="text-[#FB7185]" />
                    ) : (
                      <WarningOctagon size={13} className="text-[#38BDF8]" />
                    )}
                    <span className="font-mono text-[10px] font-bold text-[#CBD5E1]">
                      PILAR {pilar.id}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] font-semibold text-[#F8FAFC]">{pilar.label}</p>
                  <p className="text-[10px] text-[#94A3B8]">{pilar.sub}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 4. Clean 2D Hardware Schematic Fallback (only used if WebGL is unavailable on a device)
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-end bg-[#040A16] p-4 sm:p-6">
      <div className="mt-auto w-full space-y-3 pt-28 sm:pt-16">
        {isWebglFallback && (
          <p className="text-center font-mono text-[11px] text-[#94A3B8]">
            Mode Ringan 2D Aktif (WebGL tidak tersedia di perangkat ini)
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {keyframes.slice(0, 8).map((kf, idx) => {
            const active = idx === activeIndex;
            return (
              <div
                key={kf.id}
                className={`rounded-xl border p-2.5 transition-all ${
                  active
                    ? 'bg-[#0C1D3A]'
                    : 'border-[#1E293B] bg-[#060D1E]/90 opacity-75'
                }`}
                style={active ? { borderColor: kf.domainColor } : undefined}
              >
                <div className="flex items-center gap-1.5">
                  <Cpu size={13} style={{ color: kf.domainColor }} />
                  <span
                    className="font-mono text-[10px] font-bold"
                    style={{ color: kf.domainColor }}
                  >
                    {kf.pdfBadge}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs font-semibold text-[#F8FAFC]">
                  {kf.shortLabel}
                </p>
              </div>
            );
          })}
        </div>
        <div className="rounded-xl border border-[#1E293B] bg-[#060D1E] p-3 text-xs text-[#CBD5E1]">
          <span className="font-semibold text-[#F8FAFC]">{keyframe.title}:</span>{' '}
          {keyframe.functionSummary}
        </div>
      </div>
    </div>
  );
}
