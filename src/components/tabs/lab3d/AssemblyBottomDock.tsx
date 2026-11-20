import { useRef, useState } from 'react';
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  CheckCircle,
  Crosshair,
  Lightning,
  Plug,
  Power,
  ShieldCheck,
  Trash,
  Warning,
} from '@phosphor-icons/react';
import {
  FPANEL_STEP_BY_WIRE_KEY,
  STRICT_ASSEMBLY_ITEMS,
} from '../../../data/assemblyGameData';
import type {
  AssemblyDifficulty,
  AssemblyStepId,
  CPanelWireId,
  FPanelWireAssignment,
} from '../../../types/rigbench';
import { formatCountdown } from '../../../utils/formatters';
import { HardwareCardArtwork } from './HardwareCardArtwork';

type DockCategoryFilter = 'all' | 'core' | 'storage' | 'c-panel';

interface AssemblyBottomDockProps {
  difficulty: AssemblyDifficulty;
  onChangeDifficulty: (mode: AssemblyDifficulty) => void;
  completedSteps: AssemblyStepId[];
  heatsinkLockedCount: number;
  ideBoardConnected: boolean;
  fPanelWiring: Partial<Record<CPanelWireId, FPanelWireAssignment>>;
  selectedItemId: AssemblyStepId | null;
  draggingItemId: AssemblyStepId | null;
  rotationStep: number;
  onRotatePart: () => void;
  onFocusActiveTarget: () => void;
  onSelectItem: (id: AssemblyStepId) => void;
  onStartDragItem: (id: AssemblyStepId, clientX: number, clientY: number) => void;
  onUninstallItem: (id: AssemblyStepId) => void;
  psuVoltage: '115V' | '220V';
  onChangePsuVoltage: (v: '115V' | '220V') => void;
  isPoweredOn: boolean;
  onTriggerPowerTest: () => void;
  onOpenReport: () => void;
  onResetAssembly: () => void;
  mistakes: number;
  elapsedSeconds: number;
}

const CATEGORY_TABS: { id: DockCategoryFilter; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'core', label: 'Utama' },
  { id: 'storage', label: 'Storage' },
  { id: 'c-panel', label: 'C-Panel' },
];

const QUICK_REWIRE_ITEMS: { wireId: CPanelWireId; label: string; dotColor: string }[] = [
  { wireId: 'hdd-led', label: 'HDD LED', dotColor: '#F97316' },
  { wireId: 'p-led-pos', label: '+P LED', dotColor: '#22C55E' },
  { wireId: 'p-led-neg', label: '-P LED', dotColor: '#E2E8F0' },
  { wireId: 'reset-sw', label: 'RESET', dotColor: '#3B82F6' },
  { wireId: 'power-sw', label: 'POWER', dotColor: '#EF4444' },
];

function matchesCategory(
  category: (typeof STRICT_ASSEMBLY_ITEMS)[number]['category'],
  filter: DockCategoryFilter
): boolean {
  if (filter === 'all') return true;
  if (filter === 'core') {
    return category === 'cpu' || category === 'memory-expansion' || category === 'power';
  }
  return category === filter;
}

function getRotateToolMeta(
  activeHeldId: AssemblyStepId | null,
  rotationStep: number
): { show: boolean; aligned: boolean; actionLabel: string; alignedLabel: string } {
  if (!activeHeldId) {
    return { show: false, aligned: true, actionLabel: '', alignedLabel: '' };
  }
  if (activeHeldId === 'install-cpu') {
    return {
      show: true,
      aligned: rotationStep % 4 === 0,
      actionLabel: 'Putar CPU',
      alignedLabel: 'Pin-1 Sejajar',
    };
  }
  if (activeHeldId === 'install-ram-1' || activeHeldId === 'install-ram-2') {
    return {
      show: true,
      aligned: rotationStep % 2 === 0,
      actionLabel: 'Putar RAM',
      alignedLabel: 'Notch Sejajar',
    };
  }
  if (activeHeldId === 'install-ide-cable') {
    return {
      show: true,
      aligned: rotationStep % 2 === 0,
      actionLabel: 'Balik Pin-1 IDE',
      alignedLabel: 'Merah Pin-1 OK',
    };
  }
  if (
    activeHeldId === 'wire-hdd-led' ||
    activeHeldId === 'wire-pled-pos' ||
    activeHeldId === 'wire-pled-neg'
  ) {
    return {
      show: true,
      aligned: rotationStep % 2 === 0,
      actionLabel: 'Balik Polaritas (+/-)',
      alignedLabel: 'Polaritas (+) OK',
    };
  }
  return { show: false, aligned: true, actionLabel: '', alignedLabel: '' };
}

export function AssemblyBottomDock({
  difficulty,
  onChangeDifficulty,
  completedSteps,
  heatsinkLockedCount,
  ideBoardConnected,
  fPanelWiring,
  selectedItemId,
  draggingItemId,
  rotationStep,
  onRotatePart,
  onFocusActiveTarget,
  onSelectItem,
  onStartDragItem,
  onUninstallItem,
  psuVoltage,
  onChangePsuVoltage,
  isPoweredOn,
  onTriggerPowerTest,
  onOpenReport,
  onResetAssembly,
  mistakes,
  elapsedSeconds,
}: AssemblyBottomDockProps) {
  const scrollRailRef = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<DockCategoryFilter>('all');

  const isFreeRoam = difficulty === 'freeroam';
  const isExam = difficulty === 'exam';
  const totalSteps = STRICT_ASSEMBLY_ITEMS.length;
  const completedSet = new Set(completedSteps);
  const allPartsInstalled = completedSteps.length >= totalSteps;

  const nextRequiredStep = STRICT_ASSEMBLY_ITEMS.find((item) => !completedSet.has(item.id)) ?? null;
  const activeHeldId = draggingItemId ?? selectedItemId;

  const rotateMeta = getRotateToolMeta(activeHeldId, rotationStep);

  const visibleItems = STRICT_ASSEMBLY_ITEMS.filter((item) =>
    matchesCategory(item.category, categoryFilter)
  );

  const scrollRail = (dir: -1 | 1) => {
    scrollRailRef.current?.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  const handleChangeFilter = (next: DockCategoryFilter) => {
    setCategoryFilter(next);
    if (scrollRailRef.current) {
      scrollRailRef.current.scrollLeft = 0;
    }
  };

  // Hybrid Pointer Handler: Move > 8px starts 3D Drag-and-Drop; quick tap selects or uninstalls
  const handleCardPointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    itemId: AssemblyStepId,
    isDone: boolean,
    canUnplug: boolean
  ) => {
    if (e.button !== 0) return;
    if (isDone) {
      if (canUnplug) {
        onUninstallItem(itemId);
      }
      return;
    }

    const startX = e.clientX;
    const startY = e.clientY;
    let dragStarted = false;

    const onMove = (ev: PointerEvent) => {
      if (dragStarted) return;
      const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
      if (dist > 8) {
        dragStarted = true;
        cleanup();
        onStartDragItem(itemId, ev.clientX, ev.clientY);
      }
    };

    const onUp = () => {
      cleanup();
      if (!dragStarted) {
        onSelectItem(itemId);
      }
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const guidanceText = isFreeRoam
    ? 'Mode Free Roam: Bebas pasang/lepas komponen (klik part terpasang untuk melepas) & uji Power Test kapan saja.'
    : allPartsInstalled
      ? isPoweredOn
        ? 'POST lolos! Kipas CPU berputar normal & semua indikator aktif.'
        : isExam
          ? 'Set PSU 220V lalu tekan Power Test. Jika kabel F_PANEL salah pin, cabut kabelnya & pasang ulang!'
          : 'Set PSU 220V lalu tekan Power (atau klik tombol Power 3D di C-Panel).'
      : difficulty === 'practice' && nextRequiredStep
        ? nextRequiredStep.rulePrompt
        : 'Mode Ujian TAS: Urutan ketat tanpa sorotan. Cek [R] orientasi/polaritas & cocokan warna pin F_PANEL!';

  return (
    <div className="absolute inset-x-3 bottom-2.5 z-30 rounded-xl border border-[#3B82F6]/25 bg-[#070E1F]/94 px-3 py-2 shadow-2xl space-y-1.5">
      {/* Row 1: Stats, Rotate/Polarity Tool, Guidance, 3-Mode Switch, Reset & Collapse */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1 flex items-center gap-2 text-[11px]">
          <span className="shrink-0 font-mono font-semibold text-[#38BDF8] tabular-nums">
            {isFreeRoam ? 'FREE' : 'TAS'} {completedSteps.length}/{totalSteps}
          </span>
          <span className="text-[#334155]">·</span>
          <span className="shrink-0 font-mono text-[#CBD5E1] tabular-nums">
            {formatCountdown(elapsedSeconds)}
          </span>
          {!isFreeRoam && (
            <>
              <span className="text-[#334155]">·</span>
              <span
                className={`shrink-0 font-mono font-medium tabular-nums ${
                  mistakes === 0 ? 'text-[#10B981]' : 'text-[#F59E0B]'
                }`}
              >
                Salah: {mistakes}
              </span>
            </>
          )}

          {/* Inline Rotate / Polarity [R] Tool for CPU, RAM, IDE Pin-1, and F_PANEL LEDs */}
          {rotateMeta.show && (isFreeRoam || !allPartsInstalled) && (
            <button
              type="button"
              onClick={onRotatePart}
              className={`shrink-0 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors ${
                rotateMeta.aligned
                  ? 'border-[#10B981]/50 bg-[#10B981]/15 text-[#34D399]'
                  : 'border-[#F59E0B]/60 bg-[#F59E0B]/15 text-[#FDE68A]'
              }`}
            >
              <ArrowClockwise size={11} weight="bold" />
              [R] {rotateMeta.aligned ? rotateMeta.alignedLabel : rotateMeta.actionLabel}
            </button>
          )}

          {/* Quick Focus Camera on Active Target (Practice Mode Only) */}
          {difficulty === 'practice' && !allPartsInstalled && (
            <button
              type="button"
              onClick={onFocusActiveTarget}
              title="Arahkan kamera langsung ke lokasi pemasangan langkah aktif"
              className="shrink-0 inline-flex items-center gap-1 rounded-md border border-[#38BDF8]/45 bg-[#0A1D3A] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#38BDF8] transition-colors hover:border-[#38BDF8] hover:bg-[#102A52]"
            >
              <Crosshair size={11} weight="bold" />
              Fokus Target
            </button>
          )}

          {/* Single-Line Guidance */}
          <span
            title={guidanceText}
            className="hidden lg:inline-block min-w-0 truncate text-[11px] text-[#94A3B8] border-l border-[#3B82F6]/20 pl-2"
          >
            {guidanceText}
          </span>
        </div>

        {/* 3-Mode Switcher (Latihan | Ujian | Free Roam), Reset & Collapse */}
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="inline-flex rounded-lg border border-[#3B82F6]/20 bg-[#040812] p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => onChangeDifficulty('practice')}
              className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
                difficulty === 'practice'
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              Latihan
            </button>
            <button
              type="button"
              onClick={() => onChangeDifficulty('exam')}
              className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
                difficulty === 'exam'
                  ? 'bg-[#F59E0B] text-[#040812] font-semibold'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              Ujian
            </button>
            <button
              type="button"
              onClick={() => onChangeDifficulty('freeroam')}
              className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
                difficulty === 'freeroam'
                  ? 'bg-[#10B981] text-[#040812] font-semibold'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              Free Roam
            </button>
          </div>

          <button
            type="button"
            onClick={onResetAssembly}
            title="Ulangi Perakitan"
            className="inline-flex items-center gap-1 rounded-lg border border-[#3B82F6]/20 bg-[#040812] px-2 py-1 text-[10px] font-medium text-[#94A3B8] hover:border-[#38BDF8]/40 hover:text-[#F8FAFC]"
          >
            <ArrowCounterClockwise size={12} />
            <span className="hidden sm:inline">Ulangi</span>
          </button>

          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Tampilkan Kartu Komponen' : 'Perkecil Dock'}
            aria-label={collapsed ? 'Tampilkan dock komponen' : 'Lipat dock komponen'}
            className="inline-flex items-center gap-1 rounded-lg border border-[#3B82F6]/25 bg-[#0A162D] px-2 py-1 text-[10px] font-medium text-[#38BDF8] hover:border-[#38BDF8]/60"
          >
            {collapsed ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />}
            <span>{collapsed ? 'Buka' : 'Lipat'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Body */}
      {!collapsed && (
        <>
          {/* Compact Category Filter Row + Free Roam Anytime Power Test Controls */}
          {(isFreeRoam || !allPartsInstalled) && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1 rounded-lg border border-[#3B82F6]/15 bg-[#040812] p-0.5 text-[10px]">
                {CATEGORY_TABS.map((tab) => {
                  const catItems = STRICT_ASSEMBLY_ITEMS.filter((it) =>
                    matchesCategory(it.category, tab.id)
                  );
                  const doneInCat = catItems.filter((it) => completedSet.has(it.id)).length;
                  const active = categoryFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleChangeFilter(tab.id)}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium transition-colors ${
                        active
                          ? 'bg-[#2563EB]/30 text-[#38BDF8] border border-[#38BDF8]/35'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC] border border-transparent'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className="font-mono text-[9px] opacity-75">
                        {doneInCat}/{catItems.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Free Roam Anytime PSU Voltage Switch + Power Test Diagnostics */}
              {isFreeRoam && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="inline-flex items-center gap-1 rounded-lg border border-[#3B82F6]/20 bg-[#040812] px-1.5 py-0.5 text-[10px] font-mono">
                    <Lightning size={12} className="text-[#F59E0B]" />
                    <button
                      type="button"
                      onClick={() => onChangePsuVoltage('115V')}
                      className={`rounded px-1.5 py-0.5 font-semibold transition-colors ${
                        psuVoltage === '115V'
                          ? 'bg-[#F43F5E] text-white'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      115V
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangePsuVoltage('220V')}
                      className={`rounded px-1.5 py-0.5 font-semibold transition-colors ${
                        psuVoltage === '220V'
                          ? 'bg-[#10B981] text-[#040812]'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      220V
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={onTriggerPowerTest}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      isPoweredOn
                        ? 'bg-[#10B981] text-[#040812] hover:bg-[#34D399]'
                        : 'sapphire-btn'
                    }`}
                  >
                    <Power size={13} weight="bold" />
                    {isPoweredOn ? 'POST Aktif · Uji Lagi' : 'Power Test'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Strict Mode Final PSU 220V Power Test OR Visual Hardware Component Cards Rail */}
          {!isFreeRoam && allPartsInstalled ? (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#3B82F6]/20 bg-[#040812] px-3 py-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#F8FAFC]">
                    <Lightning size={15} className="text-[#F59E0B]" />
                    Switch PSU:
                  </span>
                  <div className="inline-flex rounded-lg border border-[#3B82F6]/20 bg-[#091122] p-0.5 text-[11px] font-mono">
                    <button
                      type="button"
                      disabled={isPoweredOn}
                      onClick={() => onChangePsuVoltage('115V')}
                      className={`rounded-md px-2.5 py-0.5 font-semibold transition-colors ${
                        psuVoltage === '115V'
                          ? 'bg-[#F43F5E] text-white'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      115V
                    </button>
                    <button
                      type="button"
                      disabled={isPoweredOn}
                      onClick={() => onChangePsuVoltage('220V')}
                      className={`rounded-md px-2.5 py-0.5 font-semibold transition-colors ${
                        psuVoltage === '220V'
                          ? 'bg-[#10B981] text-[#040812]'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      220V (PLN)
                    </button>
                  </div>
                  {psuVoltage === '115V' && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#F59E0B]">
                      <Warning size={12} weight="fill" />
                      Ubah ke 220V dulu
                    </span>
                  )}
                </div>

                {!isPoweredOn ? (
                  <button
                    type="button"
                    onClick={onTriggerPowerTest}
                    className="sapphire-btn inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium"
                  >
                    <Power size={14} weight="bold" />
                    Power &amp; Uji POST
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenReport}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#10B981] px-3.5 py-1.5 text-xs font-semibold text-[#040812] hover:bg-[#34D399] press-feedback"
                  >
                    <ShieldCheck size={14} weight="bold" />
                    Buka Rapor TAS
                  </button>
                )}
              </div>

              {/* Exam Mode: Quick-Unplug Bar for F_PANEL Wires so Students Can Fix Miswiring Before/After Failed POST */}
              {isExam && !isPoweredOn && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#F59E0B]/25 bg-[#040812] px-2.5 py-1.5 text-[10px]">
                  <span className="inline-flex items-center gap-1.5 text-[#CBD5E1]">
                    <Plug size={12} className="text-[#F59E0B]" />
                    Salah colok F_PANEL? Klik kabel untuk mencabut &amp; pasang ulang:
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    {QUICK_REWIRE_ITEMS.map((item) => {
                      const assigned = fPanelWiring[item.wireId];
                      if (!assigned) return null;
                      const stepId = FPANEL_STEP_BY_WIRE_KEY[item.wireId];
                      return (
                        <button
                          key={item.wireId}
                          type="button"
                          onClick={() => onUninstallItem(stepId)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#3B82F6]/25 bg-[#091225] px-2 py-0.5 font-mono text-[10px] text-[#E2E8F0] hover:border-[#F43F5E]/60 hover:text-[#FDA4AF]"
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: item.dotColor }}
                          />
                          {item.label}
                          <Trash size={10} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollRail(-1)}
                aria-label="Geser kartu ke kiri"
                className="flex h-[74px] w-6 shrink-0 items-center justify-center rounded-lg border border-[#3B82F6]/20 bg-[#040812] text-[#94A3B8] hover:border-[#38BDF8] hover:text-[#F8FAFC]"
              >
                <CaretLeft size={14} weight="bold" />
              </button>

              <div
                ref={scrollRailRef}
                className="flex flex-1 gap-1.5 overflow-x-auto pb-0.5 scroll-smooth"
              >
                {visibleItems.map((item) => {
                  const isDone = completedSet.has(item.id);
                  const isSelected = selectedItemId === item.id;
                  const isDragging = draggingItemId === item.id;
                  const isNextHint =
                    difficulty === 'practice' && nextRequiredStep?.id === item.id;
                  const isWireStep = item.id.startsWith('wire-');
                  const canUnplug = isFreeRoam || (isExam && isWireStep && !isPoweredOn);

                  // Compact sub-progress badge for multi-step mechanical/2-end items
                  let subProgressBadge: string | null = null;
                  if (!isDone) {
                    if (item.id === 'lock-heatsink-pins' && heatsinkLockedCount > 0) {
                      subProgressBadge = `${heatsinkLockedCount}/4 Pin`;
                    } else if (item.id === 'install-ide-cable' && ideBoardConnected) {
                      subProgressBadge = '1/2 Ujung';
                    }
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isDone && !canUnplug}
                      onPointerDown={(e) => handleCardPointerDown(e, item.id, isDone, canUnplug)}
                      title={
                        isDone && canUnplug
                          ? `Klik untuk melepas ${item.label}`
                          : item.label
                      }
                      className={`group relative shrink-0 w-[108px] rounded-lg border px-1.5 py-1 text-left transition-all select-none touch-none ${
                        isDone
                          ? canUnplug
                            ? 'border-[#10B981]/40 bg-[#10B981]/12 hover:border-[#F43F5E]/60 hover:bg-[#F43F5E]/12 cursor-pointer'
                            : 'border-[#10B981]/30 bg-[#10B981]/10 opacity-60 cursor-default'
                          : isDragging
                            ? 'border-[#38BDF8] bg-[#2563EB]/30 ring-1 ring-[#38BDF8] cursor-grabbing'
                            : isSelected
                              ? 'border-[#38BDF8] bg-[#2563EB]/20 ring-1 ring-[#38BDF8]/70 cursor-grab'
                              : isNextHint
                                ? 'border-[#38BDF8]/55 bg-[#060E1F] hover:border-[#38BDF8] cursor-grab'
                                : 'border-[#3B82F6]/15 bg-[#040812] hover:border-[#3B82F6]/40 cursor-grab'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] font-semibold text-[#64748B]">
                          #{String(item.stepOrder).padStart(2, '0')}
                        </span>
                        {isDone ? (
                          canUnplug ? (
                            <span className="inline-flex items-center gap-0.5 font-mono text-[8px] font-semibold">
                              <CheckCircle
                                size={11}
                                weight="fill"
                                className="text-[#10B981] group-hover:hidden"
                              />
                              <span className="hidden items-center gap-0.5 text-[#FDA4AF] group-hover:inline-flex">
                                <Trash size={10} weight="bold" />
                                CABUT
                              </span>
                            </span>
                          ) : (
                            <CheckCircle size={12} weight="fill" className="text-[#10B981]" />
                          )
                        ) : (
                          <span
                            className={`font-mono text-[8px] ${
                              subProgressBadge ? 'text-[#F59E0B] font-semibold' : 'text-[#38BDF8]'
                            }`}
                          >
                            {isDragging
                              ? 'DROP'
                              : subProgressBadge
                                ? subProgressBadge
                                : isSelected
                                  ? 'AKTIF'
                                  : item.requiresRotation || item.requiresPolarity
                                    ? '[R]'
                                    : ''}
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5 flex items-center justify-center rounded bg-[#091225] px-1 py-0.5">
                        <HardwareCardArtwork itemId={item.id} compact />
                      </div>

                      <div className="mt-1 truncate text-[10px] font-medium text-[#F8FAFC]">
                        {item.shortLabel.replace(/^\d+\.\s*/, '')}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => scrollRail(1)}
                aria-label="Geser kartu ke kanan"
                className="flex h-[74px] w-6 shrink-0 items-center justify-center rounded-lg border border-[#3B82F6]/20 bg-[#040812] text-[#94A3B8] hover:border-[#38BDF8] hover:text-[#F8FAFC]"
              >
                <CaretRight size={14} weight="bold" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
