import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  X,
} from '@phosphor-icons/react';
import {
  FPANEL_STEP_BY_WIRE_KEY,
  STRICT_ASSEMBLY_ITEMS,
} from '../../../data/assemblyGameData';
import { useDockRailScroll } from '../../../hooks/useDockRailScroll';
import type {
  AssemblyDifficulty,
  AssemblyStepId,
  CPanelWireId,
  FPanelWireAssignment,
  ToastVariant,
} from '../../../types/rigbench';
import { formatCountdown } from '../../../utils/formatters';
import { HardwareCardArtwork } from './HardwareCardArtwork';
import { getRotateToolMeta } from './TouchRotateFloatingPill';

type DockCategoryFilter = 'all' | 'core' | 'storage' | 'c-panel';

type PendingRailScroll =
  | { mode: 'start' }
  | { mode: 'end' }
  | { mode: 'center'; itemId: AssemblyStepId };

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
  isTouchInput: boolean;
  onRotatePart: () => void;
  onFocusActiveTarget: () => void;
  onSelectItem: (id: AssemblyStepId) => void;
  onStartDragItem: (
    id: AssemblyStepId,
    clientX: number,
    clientY: number,
    pointerId?: number
  ) => void;
  onCancelDrag: () => void;
  onUninstallItem: (id: AssemblyStepId) => void;
  onDockHeightChange?: (heightPx: number) => void;
  onNotify?: (title: string, description: string, variant?: ToastVariant) => void;
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

const CATEGORY_TAB_LABEL: Record<DockCategoryFilter, string> = {
  all: 'Semua',
  core: 'Utama',
  storage: 'Storage',
  'c-panel': 'C-Panel',
};

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

function getDockCategoryForItem(
  category: (typeof STRICT_ASSEMBLY_ITEMS)[number]['category']
): Exclude<DockCategoryFilter, 'all'> {
  if (category === 'storage') return 'storage';
  if (category === 'c-panel') return 'c-panel';
  return 'core';
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
  isTouchInput,
  onRotatePart,
  onFocusActiveTarget,
  onSelectItem,
  onStartDragItem,
  onCancelDrag,
  onUninstallItem,
  onDockHeightChange,
  onNotify,
  psuVoltage,
  onChangePsuVoltage,
  isPoweredOn,
  onTriggerPowerTest,
  onOpenReport,
  onResetAssembly,
  mistakes,
  elapsedSeconds,
}: AssemblyBottomDockProps) {
  const dockRef = useRef<HTMLDivElement | null>(null);
  const scrollRailRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Map<AssemblyStepId, HTMLButtonElement>>(new Map());
  const pendingScrollRef = useRef<PendingRailScroll | null>(null);
  const onDockHeightChangeRef = useRef(onDockHeightChange);
  onDockHeightChangeRef.current = onDockHeightChange;
  const onNotifyRef = useRef(onNotify);
  onNotifyRef.current = onNotify;

  const [collapsed, setCollapsed] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<DockCategoryFilter>('all');
  const [tabFlashId, setTabFlashId] = useState<DockCategoryFilter | null>(null);
  const tabFlashTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (tabFlashTimerRef.current !== null) {
        window.clearTimeout(tabFlashTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const el = dockRef.current;
    if (!el) return;

    const reportHeight = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h > 0) {
        onDockHeightChangeRef.current?.(h);
      }
    };

    reportHeight();
    const ro = new ResizeObserver(reportHeight);
    ro.observe(el);
    window.addEventListener('resize', reportHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', reportHeight);
    };
  }, [collapsed]);

  const isFreeRoam = difficulty === 'freeroam';
  const isExam = difficulty === 'exam';
  const totalSteps = STRICT_ASSEMBLY_ITEMS.length;
  const completedSet = useMemo(() => new Set(completedSteps), [completedSteps]);
  const allPartsInstalled = completedSteps.length >= totalSteps;

  const nextRequiredStep = STRICT_ASSEMBLY_ITEMS.find((item) => !completedSet.has(item.id)) ?? null;
  const activeHeldId = draggingItemId ?? selectedItemId;

  const rotateMeta = getRotateToolMeta(activeHeldId, rotationStep);

  const visibleItems = STRICT_ASSEMBLY_ITEMS.filter((item) =>
    matchesCategory(item.category, categoryFilter)
  );

  const isCardsRailVisible = !collapsed && (isFreeRoam || !allPartsInstalled);

  const centerCardInRail = useCallback((itemId: AssemblyStepId, smooth = true) => {
    const rail = scrollRailRef.current;
    const cardEl = cardRefs.current.get(itemId);
    if (!rail || !cardEl) return false;
    const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const targetLeft =
      cardEl.offsetLeft - Math.max(0, (rail.clientWidth - cardEl.clientWidth) / 2);
    const clampedLeft = Math.max(0, Math.min(maxScroll, targetLeft));
    rail.scrollTo({ left: clampedLeft, behavior: smooth ? 'smooth' : 'auto' });
    return true;
  }, []);

  const flashCategoryTab = useCallback((tabId: DockCategoryFilter) => {
    setTabFlashId(tabId);
    if (tabFlashTimerRef.current !== null) {
      window.clearTimeout(tabFlashTimerRef.current);
    }
    tabFlashTimerRef.current = window.setTimeout(() => {
      tabFlashTimerRef.current = null;
      setTabFlashId((prev) => (prev === tabId ? null : prev));
    }, 520);
  }, []);

  const handleStepCategory = useCallback(
    (dir: -1 | 1) => {
      const currentIdx = CATEGORY_TABS.findIndex((t) => t.id === categoryFilter);
      const baseIdx = currentIdx >= 0 ? currentIdx : 0;

      // Special forward jump from end of C-Panel: focus #21 ATX 24-Pin inside Utama when power steps remain
      const atxRemaining =
        !completedSet.has('install-atx-24pin') || !completedSet.has('install-atx-4pin');
      let nextTab: DockCategoryFilter;
      if (dir === 1 && categoryFilter === 'c-panel' && atxRemaining) {
        nextTab = 'core';
        pendingScrollRef.current = {
          mode: 'center',
          itemId: !completedSet.has('install-atx-24pin') ? 'install-atx-24pin' : 'install-atx-4pin',
        };
      } else {
        const nextIdx = (baseIdx + dir + CATEGORY_TABS.length) % CATEGORY_TABS.length;
        nextTab = CATEGORY_TABS[nextIdx].id;
        pendingScrollRef.current = { mode: dir === 1 ? 'start' : 'end' };
      }

      setCategoryFilter(nextTab);
      flashCategoryTab(nextTab);
      onNotifyRef.current?.(
        `Tab ${CATEGORY_TAB_LABEL[nextTab]}`,
        nextTab === 'core' && categoryFilter === 'c-panel' && dir === 1
          ? 'Lanjut pemasangan daya #21 ATX 24-Pin & #22 CPU 4-Pin.'
          : dir === 1
            ? `Beralih otomatis ke kategori ${CATEGORY_TAB_LABEL[nextTab]}.`
            : `Kembali ke kategori ${CATEGORY_TAB_LABEL[nextTab]}.`,
        'info'
      );
    },
    [categoryFilter, completedSet, flashCategoryTab]
  );

  const { fadeState, handleCardPointerDown, handleRailMouseDown, syncScrollEdges } =
    useDockRailScroll({
      dockRef,
      scrollRailRef,
      isRailActive: isCardsRailVisible,
      railDependencyKey: `${categoryFilter}|${difficulty}|${completedSteps.length}`,
      onStartDragItem,
      onSelectItem,
      onUninstallItem,
      onStepCategory: handleStepCategory,
    });

  // Execute pending scroll alignment after category filter renders
  useEffect(() => {
    if (!isCardsRailVisible) return;
    const pending = pendingScrollRef.current;
    if (!pending) return;

    const raf = window.requestAnimationFrame(() => {
      pendingScrollRef.current = null;
      const rail = scrollRailRef.current;
      if (!rail) return;

      if (pending.mode === 'center') {
        centerCardInRail(pending.itemId, true);
      } else if (pending.mode === 'end') {
        rail.scrollTo({ left: rail.scrollWidth, behavior: 'auto' });
      } else {
        rail.scrollTo({ left: 0, behavior: 'auto' });
      }
      window.requestAnimationFrame(syncScrollEdges);
    });

    return () => window.cancelAnimationFrame(raf);
  }, [categoryFilter, isCardsRailVisible, centerCardInRail, syncScrollEdges]);

  // Tutorial Mode (Latihan): Auto-center next active card & auto-switch category tab on completion
  const prevTutorialStepIdRef = useRef<AssemblyStepId | null>(
    difficulty === 'practice' ? nextRequiredStep?.id ?? null : null
  );
  const prevDifficultyRef = useRef<AssemblyDifficulty>(difficulty);

  useEffect(() => {
    const nextStepId = difficulty === 'practice' ? nextRequiredStep?.id ?? null : null;
    const enteredPractice = prevDifficultyRef.current !== 'practice' && difficulty === 'practice';
    const stepChanged = nextStepId !== null && nextStepId !== prevTutorialStepIdRef.current;

    prevDifficultyRef.current = difficulty;
    prevTutorialStepIdRef.current = nextStepId;

    if (difficulty !== 'practice' || !nextRequiredStep) return;
    if (!enteredPractice && !stepChanged) return;

    const neededTab = getDockCategoryForItem(nextRequiredStep.category);
    if (categoryFilter !== 'all' && categoryFilter !== neededTab) {
      pendingScrollRef.current = { mode: 'center', itemId: nextRequiredStep.id };
      setCategoryFilter(neededTab);
      flashCategoryTab(neededTab);
      onNotifyRef.current?.(
        `Lanjut ke Tab ${CATEGORY_TAB_LABEL[neededTab]}`,
        `Langkah #${nextRequiredStep.stepOrder}: ${nextRequiredStep.shortLabel} siap dirakit.`,
        'info'
      );
      return;
    }

    if (isCardsRailVisible) {
      const raf = window.requestAnimationFrame(() => {
        centerCardInRail(nextRequiredStep.id, true);
        window.requestAnimationFrame(syncScrollEdges);
      });
      return () => window.cancelAnimationFrame(raf);
    }

    pendingScrollRef.current = { mode: 'center', itemId: nextRequiredStep.id };
  }, [
    difficulty,
    nextRequiredStep,
    categoryFilter,
    isCardsRailVisible,
    centerCardInRail,
    flashCategoryTab,
    syncScrollEdges,
  ]);

  const scrollRail = (dir: -1 | 1) => {
    const rail = scrollRailRef.current;
    if (!rail) return;
    const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
    if (
      (dir === 1 && (maxScroll <= 2 || rail.scrollLeft >= maxScroll - 4)) ||
      (dir === -1 && (maxScroll <= 2 || rail.scrollLeft <= 4))
    ) {
      handleStepCategory(dir);
      return;
    }
    rail.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  const handleChangeFilter = (next: DockCategoryFilter) => {
    if (next === categoryFilter) return;
    pendingScrollRef.current =
      difficulty === 'practice' &&
      nextRequiredStep &&
      (next === 'all' || next === getDockCategoryForItem(nextRequiredStep.category))
        ? { mode: 'center', itemId: nextRequiredStep.id }
        : { mode: 'start' };
    setCategoryFilter(next);
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
        : isTouchInput
          ? 'Mode Ujian TAS: Urutan ketat. Ketuk tombol Putar / 2-jari untuk orientasi & cocokkan warna pin F_PANEL!'
          : 'Mode Ujian TAS: Urutan ketat tanpa sorotan. Cek [R] orientasi/polaritas & cocokan warna pin F_PANEL!';

  return (
    <div
      ref={dockRef}
      data-cancel-drag="true"
      className="absolute inset-x-2 sm:inset-x-3 bottom-[calc(0.625rem+env(safe-area-inset-bottom,0px))] z-30 rounded-xl border border-[#3B82F6]/25 bg-[#070E1F]/95 px-2.5 sm:px-3 py-2 shadow-2xl space-y-1.5"
    >
      {/* Row 1: Clean 2-Row Split on 360px Mobile, Single-Row Bar on >= 640px */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        {/* Sub-row 1A: Stats + Inline Rotate (Desktop) + Quick Controls on Mobile */}
        <div className="min-w-0 flex-1 flex items-center justify-between sm:justify-start gap-2 text-[11px]">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
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
          </div>

          {/* Mobile Compact Reset & Collapse on Row 1A Right */}
          <div className="flex shrink-0 items-center gap-1 sm:hidden">
            <button
              type="button"
              onClick={onResetAssembly}
              title="Ulangi Perakitan"
              aria-label="Ulangi Perakitan"
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#3B82F6]/20 bg-[#040812] px-2 text-[10px] font-medium text-[#94A3B8] hover:border-[#38BDF8]/40 hover:text-[#F8FAFC]"
            >
              <ArrowCounterClockwise size={12} />
            </button>

            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? 'Tampilkan Kartu Komponen' : 'Perkecil Dock'}
              aria-label={collapsed ? 'Tampilkan dock komponen' : 'Lipat dock komponen'}
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#3B82F6]/25 bg-[#0A162D] px-2 text-[10px] font-medium text-[#38BDF8] hover:border-[#38BDF8]/60"
            >
              {collapsed ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />}
              <span>{collapsed ? 'Buka' : 'Lipat'}</span>
            </button>
          </div>

          {/* Inline Rotate / Polarity Tool (Desktop/Tablet inline; mobile uses floating right pill) */}
          {rotateMeta.show && (isFreeRoam || !allPartsInstalled) && (
            <button
              type="button"
              onClick={onRotatePart}
              className={`hidden sm:inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors ${
                rotateMeta.aligned
                  ? 'border-[#10B981]/50 bg-[#10B981]/15 text-[#34D399]'
                  : 'border-[#F59E0B]/60 bg-[#F59E0B]/15 text-[#FDE68A]'
              }`}
            >
              <ArrowClockwise size={11} weight="bold" />
              {isTouchInput ? '' : '[R] '}
              {rotateMeta.aligned ? rotateMeta.alignedLabel : rotateMeta.actionLabel}
            </button>
          )}

          {/* Quick Focus Camera on Active Target (Desktop inline) */}
          {difficulty === 'practice' && !allPartsInstalled && (
            <button
              type="button"
              onClick={onFocusActiveTarget}
              title="Arahkan kamera langsung ke lokasi pemasangan langkah aktif"
              className="hidden sm:inline-flex shrink-0 items-center gap-1 rounded-md border border-[#38BDF8]/45 bg-[#0A1D3A] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#38BDF8] transition-colors hover:border-[#38BDF8] hover:bg-[#102A52]"
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

        {/* Sub-row 1B: 3-Mode Switcher + Mobile Fokus/Batal Drag + Desktop Reset/Collapse */}
        <div className="flex shrink-0 items-center justify-between sm:justify-end gap-1.5">
          <div className="inline-flex shrink-0 rounded-lg border border-[#3B82F6]/20 bg-[#040812] p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => onChangeDifficulty('practice')}
              className={`whitespace-nowrap rounded-md px-2 py-0.5 font-medium transition-colors ${
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
              className={`whitespace-nowrap rounded-md px-2 py-0.5 font-medium transition-colors ${
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
              className={`whitespace-nowrap rounded-md px-2 py-0.5 font-medium transition-colors ${
                difficulty === 'freeroam'
                  ? 'bg-[#10B981] text-[#040812] font-semibold'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              Free Roam
            </button>
          </div>

          {/* Mobile Quick Action: Cancel Drag when dragging, else Fokus Target */}
          <div className="flex shrink-0 items-center gap-1 sm:hidden">
            {draggingItemId ? (
              <button
                type="button"
                onClick={onCancelDrag}
                className="inline-flex items-center gap-1 rounded-md border border-[#F43F5E]/60 bg-[#1B0912] px-2 py-1 font-mono text-[10px] font-semibold text-[#FDA4AF]"
              >
                <X size={11} weight="bold" />
                Batal
              </button>
            ) : (
              difficulty === 'practice' &&
              !allPartsInstalled && (
                <button
                  type="button"
                  onClick={onFocusActiveTarget}
                  title="Arahkan kamera ke target aktif"
                  className="inline-flex items-center gap-1 rounded-md border border-[#38BDF8]/45 bg-[#0A1D3A] px-2 py-1 font-mono text-[10px] font-semibold text-[#38BDF8]"
                >
                  <Crosshair size={11} weight="bold" />
                  Fokus
                </button>
              )
            )}
          </div>

          {/* Desktop Reset & Collapse */}
          <button
            type="button"
            onClick={onResetAssembly}
            title="Ulangi Perakitan"
            className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-[#3B82F6]/20 bg-[#040812] px-2 py-1 text-[10px] font-medium text-[#94A3B8] hover:border-[#38BDF8]/40 hover:text-[#F8FAFC]"
          >
            <ArrowCounterClockwise size={12} />
            <span>Ulangi</span>
          </button>

          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Tampilkan Kartu Komponen' : 'Perkecil Dock'}
            aria-label={collapsed ? 'Tampilkan dock komponen' : 'Lipat dock komponen'}
            className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-[#3B82F6]/25 bg-[#0A162D] px-2 py-1 text-[10px] font-medium text-[#38BDF8] hover:border-[#38BDF8]/60"
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
              <div className="flex w-full sm:w-auto items-center gap-1 overflow-x-auto rounded-lg border border-[#3B82F6]/15 bg-[#040812] p-0.5 text-[10px]">
                {CATEGORY_TABS.map((tab) => {
                  const catItems = STRICT_ASSEMBLY_ITEMS.filter((it) =>
                    matchesCategory(it.category, tab.id)
                  );
                  const doneInCat = catItems.filter((it) => completedSet.has(it.id)).length;
                  const active = categoryFilter === tab.id;
                  const flashed = tabFlashId === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleChangeFilter(tab.id)}
                      className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium transition-all ${
                        active
                          ? flashed
                            ? 'bg-[#2563EB]/45 text-[#E0F2FE] border border-[#38BDF8] ring-1 ring-[#38BDF8]/60'
                            : 'bg-[#2563EB]/30 text-[#38BDF8] border border-[#38BDF8]/35'
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
                aria-label="Geser kartu ke kiri atau tab sebelumnya"
                title="Geser kiri (klik lagi di ujung untuk tab sebelumnya)"
                className="hidden sm:flex h-[74px] w-6 shrink-0 items-center justify-center rounded-lg border border-[#3B82F6]/20 bg-[#040812] text-[#94A3B8] hover:border-[#38BDF8] hover:text-[#F8FAFC]"
              >
                <CaretLeft size={14} weight="bold" />
              </button>

              <div className="relative flex-1 min-w-0">
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-6 rounded-l-lg bg-gradient-to-r transition-opacity duration-200 ${
                    fadeState.overscrollDir === -1
                      ? 'from-[#38BDF8]/35 via-[#070E1F]/75 to-transparent opacity-100'
                      : fadeState.canScrollLeft
                        ? 'from-[#070E1F] via-[#070E1F]/75 to-transparent opacity-100'
                        : 'from-[#070E1F] via-[#070E1F]/75 to-transparent opacity-0'
                  }`}
                />
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-6 rounded-r-lg bg-gradient-to-l transition-opacity duration-200 ${
                    fadeState.overscrollDir === 1
                      ? 'from-[#38BDF8]/35 via-[#070E1F]/75 to-transparent opacity-100'
                      : fadeState.canScrollRight
                        ? 'from-[#070E1F] via-[#070E1F]/75 to-transparent opacity-100'
                        : 'from-[#070E1F] via-[#070E1F]/75 to-transparent opacity-0'
                  }`}
                />

                <div
                  ref={scrollRailRef}
                  onPointerDown={handleRailMouseDown}
                  className="flex gap-1.5 overflow-x-auto touch-pan-x overscroll-x-contain pb-1"
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
                        ref={(el) => {
                          if (el) {
                            cardRefs.current.set(item.id, el);
                          } else {
                            cardRefs.current.delete(item.id);
                          }
                        }}
                        type="button"
                        aria-disabled={isDone && !canUnplug}
                        onPointerDown={(e) => handleCardPointerDown(e, item.id, isDone, canUnplug)}
                        title={
                          isDone && canUnplug
                            ? `Klik untuk melepas ${item.label}`
                            : `${item.label} · Tarik ke atas untuk pasang ke 3D, geser samping untuk scroll`
                        }
                        className={`group relative shrink-0 w-[108px] rounded-lg border px-1.5 py-1 text-left transition-all select-none touch-pan-x ${
                          isDone
                            ? canUnplug
                              ? 'border-[#10B981]/40 bg-[#10B981]/12 hover:border-[#F43F5E]/60 hover:bg-[#F43F5E]/12 cursor-pointer'
                              : 'border-[#10B981]/30 bg-[#10B981]/10 opacity-60 cursor-grab'
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
                                      ? isTouchInput
                                        ? 'PUTAR'
                                        : '[R]'
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
              </div>

              <button
                type="button"
                onClick={() => scrollRail(1)}
                aria-label="Geser kartu ke kanan atau tab berikutnya"
                title="Geser kanan (klik lagi di ujung untuk tab berikutnya)"
                className="hidden sm:flex h-[74px] w-6 shrink-0 items-center justify-center rounded-lg border border-[#3B82F6]/20 bg-[#040812] text-[#94A3B8] hover:border-[#38BDF8] hover:text-[#F8FAFC]"
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
