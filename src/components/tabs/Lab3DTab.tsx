import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowCounterClockwise,
  ArrowLeft,
  Circuitry,
  Cube,
  Eye,
  EyeSlash,
  FlowArrow,
  Gauge,
  GlobeHemisphereWest,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  SpeakerHigh,
  SpeakerSlash,
  UploadSimple,
  Wrench,
} from '@phosphor-icons/react';
import { MAINBOARD_COMPONENTS } from '../../data/mainboardData';
import {
  FPANEL_ALL_ZONES,
  FPANEL_CORRECT_ZONE_BY_WIRE,
  FPANEL_STEP_BY_WIRE_KEY,
  FPANEL_WIRE_KEY_BY_STEP,
  FPANEL_ZONE_LABELS,
  getPracticeTargetGuideLabel,
  STRICT_ASSEMBLY_ITEMS,
} from '../../data/assemblyGameData';
import type {
  AssemblyDifficulty,
  AssemblyReport,
  AssemblyStepId,
  CPanelWireId,
  FPanelWireAssignment,
  FPanelZoneId,
  HddJumperMode,
  Lab3DMode,
  ModelSourceMode,
  ToastVariant,
} from '../../types/rigbench';
import { labSfx } from '../../utils/sfxAudio';
import { MAX_GLB_FILE_BYTES, verifyGlbBinaryHeader } from '../../utils/inputSanitizer';
import {
  isTouchPrimaryDevice,
  loadGraphicsQualityMode,
  resolveRenderProfile,
  saveGraphicsQualityMode,
  type GraphicsQualityMode,
} from '../../utils/deviceTier';
import {
  FullMotherboardLabCanvas,
  type AssembleAutoFocusTarget,
  type DragValidationCheck,
} from '../3d/FullMotherboardLabCanvas';
import type { DragTintState } from '../3d/dragPreviewFactory';
import { OptionalGlbErrorBoundary } from '../3d/OptionalGlbLoader';
import { InspectPopupCard } from './lab3d/InspectPopupCard';
import { AssemblyBottomDock } from './lab3d/AssemblyBottomDock';
import { AssemblyPostReportModal } from './lab3d/AssemblyPostReportModal';
import { TouchRotateFloatingPill } from './lab3d/TouchRotateFloatingPill';

interface Lab3DTabProps {
  initialComponentId: string | null;
  onClearInitialComponent: () => void;
  inspectedComponents: string[];
  assemblyHistory: AssemblyReport[];
  onInspectComponent: (id: string) => void;
  onRecordAssemblyReport: (report: AssemblyReport) => void;
  onExitLab: () => void;
  onNotify: (title: string, description: string, variant?: ToastVariant) => void;
}

const JUMPER_SOCKET_TO_MODE: Record<string, HddJumperMode> = {
  'hdd-jumper-master': 'master',
  'hdd-jumper-slave': 'slave',
  'hdd-jumper-cs': 'cs',
};

const JUMPER_MODE_LABEL: Record<HddJumperMode, string> = {
  master: 'MASTER (Kiri)',
  slave: 'SLAVE (Tengah)',
  cs: 'CABLE SELECT (Kanan)',
};

const WIRE_DISPLAY_LABEL: Record<CPanelWireId, string> = {
  'hdd-led': 'HDD LED (Merah-Putih)',
  'p-led-pos': '+P LED (Hijau)',
  'p-led-neg': '-P LED (Putih)',
  'reset-sw': 'RESET SW (Biru-Putih)',
  'power-sw': 'POWER SW (Oranye-Putih)',
};

const FPANEL_ZONE_SET = new Set<string>(FPANEL_ALL_ZONES);

function isFPanelZoneId(socketId: string): socketId is FPanelZoneId {
  return FPANEL_ZONE_SET.has(socketId);
}

function getHeatsinkPinIndex(socketId: string): number {
  if (!socketId.startsWith('heatsink-pin-')) return -1;
  const idx = Number(socketId.slice('heatsink-pin-'.length));
  return Number.isInteger(idx) && idx >= 0 && idx <= 3 ? idx : -1;
}

function needsPartRotation(itemId: AssemblyStepId | null): boolean {
  return (
    itemId === 'install-cpu' ||
    itemId === 'install-ram-1' ||
    itemId === 'install-ram-2' ||
    itemId === 'install-ide-cable' ||
    itemId === 'wire-hdd-led' ||
    itemId === 'wire-pled-pos' ||
    itemId === 'wire-pled-neg'
  );
}

function getInitialRotationForPart(itemId: AssemblyStepId | null): number {
  if (needsPartRotation(itemId)) return 1; // Intentionally rotated/reversed so student checks with [R]
  return 0;
}

function isPartOrientationValid(itemId: AssemblyStepId, rotationStep: number): boolean {
  const norm = ((rotationStep % 4) + 4) % 4;
  if (
    itemId === 'install-cpu' ||
    itemId === 'install-ram-1' ||
    itemId === 'install-ram-2'
  ) {
    return norm === 0;
  }
  if (
    itemId === 'install-ide-cable' ||
    itemId === 'wire-hdd-led' ||
    itemId === 'wire-pled-pos' ||
    itemId === 'wire-pled-neg'
  ) {
    return rotationStep % 2 === 0;
  }
  return true;
}

function doesSimpleSocketMatch(targetSocketId: string, clickedSocketId: string): boolean {
  return clickedSocketId === targetSocketId;
}

// Top-most uninstall priority when clicking installed 3D hardware in Free Roam mode
const SOCKET_UNINSTALL_PRIORITY: Record<string, AssemblyStepId[]> = {
  'cpu-socket': [
    'lock-heatsink-pins',
    'install-heatsink',
    'apply-thermal-paste',
    'close-cpu-lever',
    'install-cpu',
    'open-cpu-lever',
  ],
  'heatsink-pin-0': ['lock-heatsink-pins'],
  'heatsink-pin-1': ['lock-heatsink-pins'],
  'heatsink-pin-2': ['lock-heatsink-pins'],
  'heatsink-pin-3': ['lock-heatsink-pins'],
  'ram-slot-1': ['install-ram-1'],
  'ram-slot-2': ['install-ram-2'],
  'ram-slots': ['install-ram-2', 'install-ram-1'],
  'cmos-battery': ['install-cmos'],
  'pcie-x16': ['lock-vga-screw', 'install-vga'],
  'vga-screw': ['lock-vga-screw'],
  'hdd-jumper-master': ['install-hdd-jumper'],
  'hdd-jumper-slave': ['install-hdd-jumper'],
  'hdd-jumper-cs': ['install-hdd-jumper'],
  'hdd-bay': ['install-hdd-unit'],
  'ide-port': ['install-ide-cable'],
  'hdd-ide-port': ['install-ide-cable'],
  'hdd-molex-port': ['install-hdd-molex'],
  'atx-power': ['install-atx-24pin'],
  'atx-4pin': ['install-atx-4pin'],
};

function resolveFocusTargetForStep(
  stepId: AssemblyStepId | null,
  ideBoardConnected: boolean
): AssembleAutoFocusTarget {
  if (!stepId) return null;
  if (
    stepId === 'open-cpu-lever' ||
    stepId === 'install-cpu' ||
    stepId === 'close-cpu-lever' ||
    stepId === 'apply-thermal-paste' ||
    stepId === 'install-heatsink'
  ) {
    return 'cpu-socket';
  }
  if (stepId === 'lock-heatsink-pins') return 'heatsink-pins';
  if (stepId === 'install-ram-1' || stepId === 'install-ram-2') return 'ram-slots';
  if (stepId === 'install-cmos') return 'cmos-battery';
  if (stepId === 'install-vga') return 'pcie-x16';
  if (stepId === 'lock-vga-screw') return 'vga-screw';
  if (stepId === 'install-hdd-jumper') return 'hdd-jumper';
  if (stepId === 'install-hdd-unit') return 'hdd-bay';
  if (stepId === 'install-ide-cable') return ideBoardConnected ? 'hdd-ide-port' : 'ide-board';
  if (stepId === 'install-hdd-molex') return 'hdd-molex-port';
  if (stepId.startsWith('wire-')) return 'f-panel-header';
  if (stepId === 'install-atx-24pin') return 'atx-24pin';
  if (stepId === 'install-atx-4pin') return 'atx-4pin';
  return null;
}

export function Lab3DTab({
  initialComponentId,
  onClearInitialComponent,
  inspectedComponents,
  assemblyHistory,
  onInspectComponent,
  onRecordAssemblyReport,
  onExitLab,
  onNotify,
}: Lab3DTabProps) {
  const [mode, setMode] = useState<Lab3DMode>('inspect');
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    initialComponentId ?? null
  );
  const [showPins, setShowPins] = useState(true);
  const [showDataFlow, setShowDataFlow] = useState(true);
  const [inspection360, setInspection360] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQualityMode>(() =>
    loadGraphicsQualityMode()
  );
  const [modelSource, setModelSource] = useState<ModelSourceMode>('procedural');
  const [localGlbUrl, setLocalGlbUrl] = useState<string | null>(null);
  const [cameraResetNonce, setCameraResetNonce] = useState(0);

  const activeQualityLabel = useMemo(
    () => resolveRenderProfile(graphicsQuality, false).label,
    [graphicsQuality]
  );

  const handleCycleGraphicsQuality = useCallback(() => {
    const next: GraphicsQualityMode =
      graphicsQuality === 'auto' ? 'low' : graphicsQuality === 'low' ? 'ultra' : 'auto';
    setGraphicsQuality(next);
    saveGraphicsQualityMode(next);
    const nextProfile = resolveRenderProfile(next, false);
    onNotify(
      `Grafis 3D: ${nextProfile.label}`,
      next === 'low'
        ? 'Mode Hemat aktif (DPR & bayangan ringan, detail motherboard tetap penuh).'
        : next === 'ultra'
          ? 'Mode Ultra aktif (bayangan tajam & DPR maksimal).'
          : 'Deteksi otomatis menyesuaikan kemampuan GPU perangkatmu.',
      'info'
    );
  }, [graphicsQuality, onNotify]);

  // Mode 2: Real-World 22-Step STMIK AKI Pure IDE Assembly + Free Roam Sandbox State
  const [difficulty, setDifficulty] = useState<AssemblyDifficulty>('practice');
  const [completedSteps, setCompletedSteps] = useState<AssemblyStepId[]>([]);
  const [heatsinkPinsLocked, setHeatsinkPinsLocked] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);
  const [vgaScrewLocked, setVgaScrewLocked] = useState(false);
  const [ideEndsConnected, setIdeEndsConnected] = useState<{ board: boolean; hdd: boolean }>({
    board: false,
    hdd: false,
  });
  const [hddJumperColumn, setHddJumperColumn] = useState<HddJumperMode | null>(null);
  const [fPanelWiring, setFPanelWiring] = useState<
    Partial<Record<CPanelWireId, FPanelWireAssignment>>
  >({});

  const [selectedItemId, setSelectedItemId] = useState<AssemblyStepId | null>('open-cpu-lever');
  const [draggingItemId, setDraggingItemId] = useState<AssemblyStepId | null>(null);
  const [dragInitialClientPos, setDragInitialClientPos] = useState<{
    x: number;
    y: number;
    pointerId?: number;
  } | null>(null);
  const [rotationStep, setRotationStep] = useState<number>(0);
  const [dockHeightPx, setDockHeightPx] = useState<number>(190);
  const [isTouchInput, setIsTouchInput] = useState<boolean>(() => isTouchPrimaryDevice());
  const [dragFeedback, setDragFeedback] = useState<{
    socketId: string | null;
    state: DragTintState;
    reason?: string;
  }>({ socketId: null, state: 'free' });

  const [zoomPinActive, setZoomPinActive] = useState(false);
  const [manualZoomTarget, setManualZoomTarget] = useState<AssembleAutoFocusTarget>(null);
  const [zoomPinNonce, setZoomPinNonce] = useState(0);

  const [psuVoltage, setPsuVoltage] = useState<'115V' | '220V'>('115V');
  const [isPoweredOn, setIsPoweredOn] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeReport, setActiveReport] = useState<AssemblyReport | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialComponentId) {
      setMode('inspect');
      setSelectedComponentId(initialComponentId);
      onInspectComponent(initialComponentId);
      onClearInitialComponent();
    }
  }, [initialComponentId, onClearInitialComponent, onInspectComponent]);

  useEffect(() => {
    const syncTouch = () => setIsTouchInput(isTouchPrimaryDevice());
    window.addEventListener('resize', syncTouch);
    return () => {
      window.removeEventListener('resize', syncTouch);
      labSfx.stopFanHum();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (localGlbUrl) URL.revokeObjectURL(localGlbUrl);
    };
  }, [localGlbUrl]);

  useEffect(() => {
    if (mode !== 'assemble' || isPoweredOn) return;
    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, isPoweredOn]);

  // Keyboard [R] to rotate held/dragged CPU, RAM, IDE Pin-1, or flip F_PANEL LED polarity
  const handleRotatePart = useCallback(() => {
    const activeId = draggingItemId ?? selectedItemId;
    if (!needsPartRotation(activeId)) return;
    setRotationStep((prev) => (prev + 1) % 4);
    labSfx.playMechanicalClick();
  }, [draggingItemId, selectedItemId]);

  useEffect(() => {
    if (mode !== 'assemble') return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeId = draggingItemId ?? selectedItemId;
        if (needsPartRotation(activeId)) {
          e.preventDefault();
          handleRotatePart();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mode, draggingItemId, selectedItemId, handleRotatePart]);

  const selectedComponent = useMemo(
    () =>
      selectedComponentId
        ? MAINBOARD_COMPONENTS.find((c) => c.id === selectedComponentId) ?? null
        : null,
    [selectedComponentId]
  );

  const nextRequiredStep = useMemo(() => {
    const done = new Set(completedSteps);
    return STRICT_ASSEMBLY_ITEMS.find((item) => !done.has(item.id)) ?? null;
  }, [completedSteps]);

  const allPartsInstalled = completedSteps.length >= STRICT_ASSEMBLY_ITEMS.length;
  const heatsinkLockedCount = useMemo(
    () => heatsinkPinsLocked.filter(Boolean).length,
    [heatsinkPinsLocked]
  );

  const activeHeldId = draggingItemId ?? selectedItemId;

  const isHeldPartAligned = useMemo(() => {
    if (!activeHeldId) return true;
    return isPartOrientationValid(activeHeldId, rotationStep);
  }, [activeHeldId, rotationStep]);

  const canRotateActive = useMemo(
    () =>
      mode === 'assemble' &&
      needsPartRotation(activeHeldId) &&
      (difficulty === 'freeroam' || !allPartsInstalled),
    [mode, activeHeldId, difficulty, allPartsInstalled]
  );

  // Adaptive Practice target socket / pin indicator across ALL 22 steps
  const practiceGuideSocketId = useMemo(() => {
    if (mode !== 'assemble' || difficulty !== 'practice') return null;
    if (allPartsInstalled && !isPoweredOn) return 'fpanel-red-68';
    if (!nextRequiredStep) return null;

    if (nextRequiredStep.id === 'lock-heatsink-pins') {
      const firstUnlocked = heatsinkPinsLocked.findIndex((locked) => !locked);
      return firstUnlocked >= 0 ? `heatsink-pin-${firstUnlocked}` : null;
    }
    if (nextRequiredStep.id === 'install-ide-cable') {
      return ideEndsConnected.board ? 'hdd-ide-port' : 'ide-port';
    }
    return nextRequiredStep.targetSocketId;
  }, [
    mode,
    difficulty,
    allPartsInstalled,
    isPoweredOn,
    nextRequiredStep,
    heatsinkPinsLocked,
    ideEndsConnected.board,
  ]);

  // Projected 2D floating arrow & mini target label (Practice mode only)
  const practiceGuideLabel = useMemo(() => {
    if (mode !== 'assemble' || difficulty !== 'practice' || isPoweredOn) return null;
    return getPracticeTargetGuideLabel(
      nextRequiredStep?.id ?? null,
      ideEndsConnected.board,
      heatsinkLockedCount,
      allPartsInstalled
    );
  }, [
    mode,
    difficulty,
    isPoweredOn,
    nextRequiredStep,
    ideEndsConnected.board,
    heatsinkLockedCount,
    allPartsInstalled,
  ]);

  // Smooth auto-focus macro target for rear HDD ports, 2-end IDE flow, F_PANEL & fasteners
  const autoFocusTarget: AssembleAutoFocusTarget = useMemo(() => {
    if (mode !== 'assemble') return null;
    const focusId =
      draggingItemId ??
      selectedItemId ??
      (difficulty === 'practice' ? nextRequiredStep?.id ?? null : null);
    if (!focusId) return null;

    if (focusId === 'install-hdd-jumper') return 'hdd-jumper';
    if (focusId === 'install-ide-cable') {
      if (!ideEndsConnected.board) {
        return difficulty === 'practice' ? 'ide-board' : null;
      }
      if (!ideEndsConnected.hdd) {
        return 'hdd-ide-port';
      }
      return null;
    }
    if (focusId === 'install-hdd-molex') return 'hdd-molex-port';
    if (focusId.startsWith('wire-')) return 'f-panel-header';
    if (focusId === 'lock-heatsink-pins') return 'heatsink-pins';
    if (focusId === 'lock-vga-screw') return 'vga-screw';
    if (focusId === 'install-atx-4pin') return 'atx-4pin';
    return null;
  }, [
    mode,
    draggingItemId,
    selectedItemId,
    difficulty,
    nextRequiredStep,
    ideEndsConnected,
  ]);

  const assembleFocusTarget: AssembleAutoFocusTarget = manualZoomTarget ?? autoFocusTarget;

  // Keep HUD Zoom Pin button state synchronized when auto-focus engages
  useEffect(() => {
    if (autoFocusTarget) {
      setManualZoomTarget(null);
      setZoomPinActive(true);
    } else if (!manualZoomTarget) {
      setZoomPinActive(false);
    }
  }, [autoFocusTarget, manualZoomTarget]);

  const handleFocusActiveTarget = useCallback(() => {
    const activeStepId = nextRequiredStep?.id ?? selectedItemId;
    const target = resolveFocusTargetForStep(activeStepId, ideEndsConnected.board);
    if (!target) return;
    setManualZoomTarget(target);
    setZoomPinActive(true);
    setZoomPinNonce((n) => n + 1);
  }, [nextRequiredStep, selectedItemId, ideEndsConnected.board]);

  const handleToggleZoomPin = useCallback(() => {
    if (zoomPinActive) {
      setZoomPinActive(false);
      setManualZoomTarget(null);
      setCameraResetNonce((n) => n + 1);
      return;
    }
    const targetToZoom: AssembleAutoFocusTarget =
      autoFocusTarget ??
      resolveFocusTargetForStep(nextRequiredStep?.id ?? selectedItemId, ideEndsConnected.board) ??
      'f-panel-header';
    setManualZoomTarget(targetToZoom);
    setZoomPinActive(true);
    setZoomPinNonce((n) => n + 1);
  }, [zoomPinActive, autoFocusTarget, nextRequiredStep, selectedItemId, ideEndsConnected.board]);

  // Helper to advance practice selection cleanly after completing a step
  const advanceAfterStepComplete = useCallback(
    (nextCompleted: AssemblyStepId[]) => {
      if (difficulty === 'practice') {
        const upcoming = STRICT_ASSEMBLY_ITEMS.find((it) => !nextCompleted.includes(it.id));
        const nextSelected = upcoming ? upcoming.id : null;
        setSelectedItemId(nextSelected);
        setRotationStep(getInitialRotationForPart(nextSelected));
      } else {
        setSelectedItemId(null);
        setRotationStep(0);
      }
    },
    [difficulty]
  );

  const handleSelectInventoryItem = useCallback(
    (id: AssemblyStepId) => {
      if (difficulty === 'freeroam' && selectedItemId === id) {
        setSelectedItemId(null);
        setRotationStep(0);
        return;
      }
      setSelectedItemId(id);
      setRotationStep(getInitialRotationForPart(id));
    },
    [difficulty, selectedItemId]
  );

  const handleStartDragItem = useCallback(
    (id: AssemblyStepId, clientX: number, clientY: number, pointerId?: number) => {
      setSelectedItemId(id);
      setRotationStep((prev) => (selectedItemId === id ? prev : getInitialRotationForPart(id)));
      setDragInitialClientPos({ x: clientX, y: clientY, pointerId });
      setDraggingItemId(id);
    },
    [selectedItemId]
  );

  // Uninstall / unplug handler (all parts in Free Roam; F_PANEL wires in Exam mode too so miswiring can be fixed!)
  const handleUninstallItem = useCallback(
    (itemId: AssemblyStepId) => {
      const isWireStep = itemId.startsWith('wire-');
      if (difficulty !== 'freeroam' && !(difficulty === 'exam' && isWireStep && !isPoweredOn)) {
        return;
      }

      const item = STRICT_ASSEMBLY_ITEMS.find((it) => it.id === itemId);
      const idsToRemove = new Set<AssemblyStepId>([itemId]);

      if (itemId === 'install-heatsink') {
        idsToRemove.add('lock-heatsink-pins');
        setHeatsinkPinsLocked([false, false, false, false]);
      } else if (itemId === 'lock-heatsink-pins') {
        setHeatsinkPinsLocked([false, false, false, false]);
      } else if (itemId === 'install-vga') {
        idsToRemove.add('lock-vga-screw');
        setVgaScrewLocked(false);
      } else if (itemId === 'lock-vga-screw') {
        setVgaScrewLocked(false);
      } else if (itemId === 'install-hdd-jumper') {
        setHddJumperColumn(null);
      } else if (itemId === 'install-ide-cable') {
        setIdeEndsConnected({ board: false, hdd: false });
      } else if (isWireStep) {
        const wireKey = FPANEL_WIRE_KEY_BY_STEP[itemId];
        if (wireKey) {
          setFPanelWiring((prev) => {
            const next = { ...prev };
            delete next[wireKey];
            return next;
          });
        }
      }

      setCompletedSteps((prev) => prev.filter((id) => !idsToRemove.has(id)));
      if (isPoweredOn) {
        setIsPoweredOn(false);
        labSfx.stopFanHum();
      }
      if (difficulty === 'exam' && isWireStep) {
        setSelectedItemId(itemId);
        setRotationStep(getInitialRotationForPart(itemId));
      }
      labSfx.playMechanicalClick();
      onNotify(
        `Dicabut: ${item?.shortLabel ?? itemId}`,
        difficulty === 'exam'
          ? 'Kabel F_PANEL dicabut! Pasang kembali pada blok warna & polaritas yang benar.'
          : 'Komponen berhasil dilepas dari motherboard (Free Roam).',
        'info'
      );
    },
    [difficulty, isPoweredOn, onNotify]
  );

  const handleToggleMute = () => {
    const next = !sfxMuted;
    setSfxMuted(next);
    labSfx.setMuted(next);
  };

  const resetAssemblyGame = useCallback(
    (showToast = true) => {
      labSfx.stopFanHum();
      setCompletedSteps([]);
      setHeatsinkPinsLocked([false, false, false, false]);
      setVgaScrewLocked(false);
      setIdeEndsConnected({ board: false, hdd: false });
      setHddJumperColumn(null);
      setFPanelWiring({});
      setSelectedItemId(difficulty === 'practice' ? 'open-cpu-lever' : null);
      setDraggingItemId(null);
      setDragInitialClientPos(null);
      setRotationStep(0);
      setManualZoomTarget(null);
      setZoomPinActive(false);
      setPsuVoltage('115V');
      setIsPoweredOn(false);
      setMistakes(0);
      setElapsedSeconds(0);
      setActiveReport(null);
      setCameraResetNonce((n) => n + 1);
      if (showToast) {
        onNotify(
          'Meja Rakit TAS Dikosongkan',
          difficulty === 'freeroam'
            ? 'Mode Free Roam siap — pilih atau seret komponen mana saja secara bebas.'
            : 'Klik langsung tuas Soket LGA 775 (#01) atau seret komponen dari Bottom Bar.',
          'info'
        );
      }
    },
    [difficulty, onNotify]
  );

  const handleSwitchMode = (nextMode: Lab3DMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setDraggingItemId(null);
    if (nextMode === 'assemble') {
      setSelectedComponentId(null);
      setShowDataFlow(false);
      setInspection360(false);
      if (completedSteps.length === 0 && difficulty === 'practice') {
        setSelectedItemId('open-cpu-lever');
      }
    } else {
      labSfx.stopFanHum();
      setShowDataFlow(true);
    }
  };

  const handleSelectInspectComponent = useCallback(
    (id: string) => {
      setSelectedComponentId(id);
      onInspectComponent(id);
    },
    [onInspectComponent]
  );

  // Real-World Hardware & Pinout POST Verification (Exam + Free Roam + Practice)
  const buildHardwareDiagnostics = useCallback((): string[] => {
    const done = new Set(completedSteps);
    const issues: string[] = [];

    if (psuVoltage !== '220V') {
      issues.push(
        'Saklar PSU masih di posisi 115V — wajib dipindahkan ke 220V (PLN) agar PSU tidak korslet.'
      );
    }
    if (!done.has('install-cpu')) {
      issues.push('Prosesor Intel LGA 775 belum terpasang pada #01 Soket CPU.');
    } else if (!done.has('close-cpu-lever')) {
      issues.push('Tuas penahan baja Soket LGA 775 belum dikunci.');
    }
    if (!done.has('apply-thermal-paste')) {
      issues.push('Thermal Paste belum dioleskan pada IHS CPU (risiko overheat).');
    }
    if (!done.has('install-heatsink')) {
      issues.push('Heatsink & Fan CPU belum terpasang di atas prosesor.');
    } else if (heatsinkPinsLocked.filter(Boolean).length < 4) {
      issues.push(
        `Push-pin Heatsink CPU baru terkunci ${heatsinkPinsLocked.filter(Boolean).length}/4 — klik semua 4 sudut push-pin hingga terkunci rapat.`
      );
    }
    if (!done.has('install-ram-1') && !done.has('install-ram-2')) {
      issues.push(
        'Memori RAM DDR2 belum terpasang (minimal 1 keping pada DIMM 1 atau DIMM 2 agar POST lolos).'
      );
    }
    if (!done.has('install-cmos')) {
      issues.push('Baterai CMOS CR2032 (#10) belum terpasang.');
    }
    if (!done.has('install-vga')) {
      issues.push('Kartu grafis VGA PCIe x16 (#05) belum terpasang — tidak ada sinyal tampilan.');
    } else if (!vgaScrewLocked) {
      issues.push('Baut braket logam belakang VGA Card belum dikencangkan.');
    }
    if (!done.has('install-hdd-jumper') || !hddJumperColumn) {
      issues.push('Jumper 8-Pin Harddisk 3.5" belum dipasang (E-Book Hal. 17–18).');
    } else if (hddJumperColumn !== 'master') {
      issues.push(
        `Jumper HDD tertancap di kolom ${JUMPER_MODE_LABEL[hddJumperColumn]} — wajib kolom kiri MASTER untuk drive OS utama.`
      );
    }
    if (!done.has('install-hdd-unit')) {
      issues.push('Unit Harddisk 3.5" belum didudukkan pada braket meja anti-statis.');
    }
    const ideComplete = ideEndsConnected.board && ideEndsConnected.hdd;
    if (!ideComplete) {
      if (ideEndsConnected.board && !ideEndsConnected.hdd) {
        issues.push('Ujung 2 kabel pita IDE 40-Wire belum ditancapkan ke port IDE 40-Pin di belakang Harddisk.');
      } else {
        issues.push('Kabel pita data IDE 40-Wire belum tersambung 2 ujung (#12 Port IDE motherboard -> belakang HDD IDE).');
      }
    }
    if (!done.has('install-hdd-molex')) {
      issues.push(
        'Kabel daya PSU Molex 4-Pin (12V/5V) belum ditancapkan ke belakang Harddisk 3.5" — motor HDD tidak berputar.'
      );
    }
    if (!done.has('install-atx-24pin')) {
      issues.push('Kabel daya utama ATX 24-Pin (#14) belum terpasang ke motherboard.');
    }
    if (!done.has('install-atx-4pin')) {
      issues.push('Kabel daya CPU ATX 4-Pin 12V (dekat VRM CPU) belum terpasang — prosesor tidak mendapat daya.');
    }

    // F_PANEL 9-Pin Real-World Pinout & Polarity Verification
    const pwrAssign = fPanelWiring['power-sw'];
    if (!pwrAssign) {
      issues.push('Kabel F_PANEL POWER SW belum terpasang — tombol daya tidak merespons.');
    } else if (pwrAssign.zoneId !== FPANEL_CORRECT_ZONE_BY_WIRE['power-sw']) {
      issues.push(
        `Kabel POWER SW salah colok di ${FPANEL_ZONE_LABELS[pwrAssign.zoneId]} (seharusnya Blok Merah Pin 6–8)!`
      );
    }

    const rstAssign = fPanelWiring['reset-sw'];
    if (rstAssign && rstAssign.zoneId !== FPANEL_CORRECT_ZONE_BY_WIRE['reset-sw']) {
      issues.push(
        `Kabel RESET SW salah colok di ${FPANEL_ZONE_LABELS[rstAssign.zoneId]} (seharusnya Blok Biru Pin 5–7)!`
      );
    }

    const hddLedAssign = fPanelWiring['hdd-led'];
    if (hddLedAssign) {
      if (hddLedAssign.zoneId !== FPANEL_CORRECT_ZONE_BY_WIRE['hdd-led']) {
        issues.push(
          `Kabel HDD LED salah colok di ${FPANEL_ZONE_LABELS[hddLedAssign.zoneId]} (seharusnya Blok Oranye Pin 1–3)!`
        );
      } else if (!hddLedAssign.polarityValid) {
        issues.push(
          isTouchInput
            ? 'Polaritas (+)/(-) kabel HDD LED terbalik — ketuk tombol Putar sebelum memasang agar LED menyala!'
            : 'Polaritas (+)/(-) kabel HDD LED terbalik — tekan [R] sebelum memasang agar LED menyala!'
        );
      }
    }

    const pLedPosAssign = fPanelWiring['p-led-pos'];
    if (pLedPosAssign) {
      if (pLedPosAssign.zoneId !== FPANEL_CORRECT_ZONE_BY_WIRE['p-led-pos']) {
        issues.push(
          `Kabel +P LED salah colok di ${FPANEL_ZONE_LABELS[pLedPosAssign.zoneId]} (seharusnya Blok Hijau Atas Pin 2)!`
        );
      } else if (!pLedPosAssign.polarityValid) {
        issues.push('Polaritas kabel +P LED (Pin 2) terbalik — lampu indikator Power tidak menyala!');
      }
    }

    const pLedNegAssign = fPanelWiring['p-led-neg'];
    if (pLedNegAssign) {
      if (pLedNegAssign.zoneId !== FPANEL_CORRECT_ZONE_BY_WIRE['p-led-neg']) {
        issues.push(
          `Kabel -P LED salah colok di ${FPANEL_ZONE_LABELS[pLedNegAssign.zoneId]} (seharusnya Blok Hijau Bawah Pin 4)!`
        );
      } else if (!pLedNegAssign.polarityValid) {
        issues.push('Polaritas kabel -P LED (Pin 4) terbalik — sirkuit Power LED tidak lengkap!');
      }
    }

    // Explicit warning if any cable was mistakenly plugged onto Black Pin 9 Key (NC)
    for (const [wireKey, assignment] of Object.entries(fPanelWiring)) {
      if (assignment?.zoneId === 'fpanel-black-9') {
        issues.push(
          `${WIRE_DISPLAY_LABEL[wireKey as CPanelWireId]} tertancap di Pin 9 Hitam (Key / Kosong) — Pin 9 tidak boleh diisi kabel!`
        );
      }
    }

    return issues;
  }, [
    completedSteps,
    psuVoltage,
    heatsinkPinsLocked,
    vgaScrewLocked,
    hddJumperColumn,
    ideEndsConnected,
    fPanelWiring,
    isTouchInput,
  ]);

  const handleTriggerPowerTest = useCallback(() => {
    const totalSteps = STRICT_ASSEMBLY_ITEMS.length;

    // Free Roam: Anytime full hardware diagnostic check (isolated from localStorage TAS history)
    if (difficulty === 'freeroam') {
      const diagnosticIssues = buildHardwareDiagnostics();
      if (diagnosticIssues.length > 0) {
        setIsPoweredOn(false);
        labSfx.stopFanHum();
        labSfx.playRuleWarning();
        setActiveReport({
          id: `freeroam-diag-${Date.now()}`,
          completedAtIso: new Date().toISOString(),
          difficulty: 'freeroam',
          elapsedSeconds,
          mistakes: diagnosticIssues.length,
          totalSteps,
          accuracyPercent: Math.round((completedSteps.length / totalSteps) * 100),
          hddJumperSelected: hddJumperColumn ?? 'slave',
          postPassed: false,
          diagnosticIssues,
        });
        onNotify(
          `Power Test Gagal (${diagnosticIssues.length} temuan)`,
          'Buka laporan diagnosa untuk melihat komponen atau pin F_PANEL yang salah.',
          'error'
        );
        return;
      }

      setIsPoweredOn(true);
      labSfx.playPostBeep();
      if (!sfxMuted) labSfx.startFanHum();
      setActiveReport({
        id: `freeroam-ok-${Date.now()}`,
        completedAtIso: new Date().toISOString(),
        difficulty: 'freeroam',
        elapsedSeconds,
        mistakes: 0,
        totalSteps,
        accuracyPercent: 100,
        hddJumperSelected: hddJumperColumn ?? 'master',
        postPassed: true,
      });
      onNotify(
        'POST Lolos — Mode Free Roam!',
        'Kipas CPU berputar normal. Hasil Free Roam tidak memengaruhi skor resmi Latihan/Ujian.',
        'success'
      );
      return;
    }

    // Strict Latihan / Ujian Mode
    if (isPoweredOn) return;
    if (psuVoltage !== '220V') {
      setMistakes((m) => m + 1);
      labSfx.playRuleWarning();
      onNotify(
        'BAHAYA TEGANGAN 115V!',
        'Listrik PLN Indonesia menggunakan 220V–230V. Pindahkan saklar PSU ke 220V terlebih dahulu agar PSU tidak korslet!',
        'error'
      );
      return;
    }

    // Run authentic F_PANEL pinout/polarity & hardware check (catches Exam mode miswiring!)
    const diagnosticIssues = buildHardwareDiagnostics();
    if (diagnosticIssues.length > 0) {
      setMistakes((m) => m + diagnosticIssues.length);
      setIsPoweredOn(false);
      labSfx.stopFanHum();
      labSfx.playRuleWarning();
      setActiveReport({
        id: `tas-fail-${Date.now()}`,
        completedAtIso: new Date().toISOString(),
        difficulty,
        elapsedSeconds,
        mistakes: mistakes + diagnosticIssues.length,
        totalSteps,
        accuracyPercent: Math.max(
          0,
          Math.round((totalSteps / (totalSteps + mistakes + diagnosticIssues.length)) * 100)
        ),
        hddJumperSelected: hddJumperColumn ?? 'master',
        postPassed: false,
        diagnosticIssues,
      });
      onNotify(
        `POST Gagal (${diagnosticIssues.length} kesalahan pinout)`,
        'Tutup laporan, cabut kabel F_PANEL yang salah colok/polaritas, lalu uji Power kembali!',
        'error'
      );
      return;
    }

    setIsPoweredOn(true);
    labSfx.playPostBeep();
    if (!sfxMuted) labSfx.startFanHum();

    const accuracyPercent = Math.max(
      0,
      Math.round((totalSteps / (totalSteps + mistakes)) * 100)
    );
    const report: AssemblyReport = {
      id: `tas-${Date.now()}`,
      completedAtIso: new Date().toISOString(),
      difficulty,
      elapsedSeconds,
      mistakes,
      totalSteps,
      accuracyPercent,
      hddJumperSelected: hddJumperColumn ?? 'master',
      postPassed: true,
    };
    setActiveReport(report);
    onRecordAssemblyReport(report);
    onNotify(
      'POST Lolos — 1 Short Beep!',
      `Kipas CPU berputar normal & semua pin presisi. Rapor TAS (${accuracyPercent}%) tersimpan.`,
      'success'
    );
  }, [
    buildHardwareDiagnostics,
    completedSteps.length,
    difficulty,
    elapsedSeconds,
    hddJumperColumn,
    isPoweredOn,
    mistakes,
    onNotify,
    onRecordAssemblyReport,
    psuVoltage,
    sfxMuted,
  ]);

  // Shared placement validator for 3D Drag-and-Drop & Hybrid Click-to-Install
  const attemptInstall = useCallback(
    (itemId: AssemblyStepId, clickedSocketId: string, currentRotation: number) => {
      const targetItem = STRICT_ASSEMBLY_ITEMS.find((it) => it.id === itemId);
      if (!targetItem || completedSteps.includes(itemId)) return;

      const isFreeRoam = difficulty === 'freeroam';
      const isExam = difficulty === 'exam';

      if (!isFreeRoam) {
        if (!nextRequiredStep) return;
        if (itemId !== nextRequiredStep.id) {
          setMistakes((m) => m + 1);
          labSfx.playRuleWarning();
          onNotify('Urutan Melanggar E-Book STMIK AKI', nextRequiredStep.wrongOrderHint, 'warning');
          return;
        }
      }

      // 1. Special Mechanical Fastener: 4 Clickable Heatsink Push-Pins
      if (itemId === 'lock-heatsink-pins') {
        if (!completedSteps.includes('install-heatsink')) {
          labSfx.playRuleWarning();
          onNotify('Heatsink Belum Terpasang', 'Pasang Heatsink Fan terlebih dahulu sebelum mengunci 4 push-pin.', 'warning');
          return;
        }
        const pinIdx = getHeatsinkPinIndex(clickedSocketId);
        if (pinIdx < 0) {
          if (!isFreeRoam) setMistakes((m) => m + 1);
          labSfx.playRuleWarning();
          onNotify('Klik Push-Pin Heatsink', targetItem.wrongSocketHint, 'warning');
          return;
        }
        if (heatsinkPinsLocked[pinIdx]) {
          onNotify('Push-Pin Sudah Terkunci', 'Klik sudut push-pin Heatsink lain yang masih naik.', 'info');
          return;
        }
        const nextPins = heatsinkPinsLocked.map((v, i) => (i === pinIdx ? true : v));
        setHeatsinkPinsLocked(nextPins);
        labSfx.playLeverLatch();
        const lockedNow = nextPins.filter(Boolean).length;
        if (lockedNow < 4) {
          onNotify(
            `Push-Pin Heatsink ${lockedNow}/4 Terkunci`,
            `Lanjutkan klik ${4 - lockedNow} kaki push-pin tersisa di sudut Heatsink CPU (secara menyilang).`,
            'info'
          );
          return;
        }
        const nextCompleted = [...completedSteps, itemId];
        setCompletedSteps(nextCompleted);
        advanceAfterStepComplete(nextCompleted);
        onNotify(`Terpasang: ${targetItem.label}`, targetItem.successNote, 'success');
        return;
      }

      // 2. Special Mechanical Fastener: Clickable VGA Bracket Screw
      if (itemId === 'lock-vga-screw') {
        if (!completedSteps.includes('install-vga')) {
          labSfx.playRuleWarning();
          onNotify('VGA Belum Terpasang', 'Pasang VGA Card di slot PCIe x16 terlebih dahulu.', 'warning');
          return;
        }
        if (clickedSocketId !== 'vga-screw') {
          if (!isFreeRoam) setMistakes((m) => m + 1);
          labSfx.playRuleWarning();
          onNotify('Klik Baut Braket VGA', targetItem.wrongSocketHint, 'warning');
          return;
        }
        setVgaScrewLocked(true);
        labSfx.playLeverLatch();
        const nextCompleted = [...completedSteps, itemId];
        setCompletedSteps(nextCompleted);
        advanceAfterStepComplete(nextCompleted);
        onNotify(`Terpasang: ${targetItem.label}`, targetItem.successNote, 'success');
        return;
      }

      // 3. Single Physical HDD Jumper Shunt -> 3D Master / Slave / Cable Select Pin Columns
      if (itemId === 'install-hdd-jumper') {
        const chosenMode = JUMPER_SOCKET_TO_MODE[clickedSocketId];
        if (!chosenMode) {
          if (!isFreeRoam) setMistakes((m) => m + 1);
          labSfx.playRuleWarning();
          onNotify('Arahkan ke Blok 8-Pin HDD', targetItem.wrongSocketHint, 'warning');
          return;
        }
        if (!isFreeRoam && chosenMode !== 'master') {
          setMistakes((m) => m + 1);
          labSfx.playRuleWarning();
          onNotify(
            `Salah Kolom Pin (${JUMPER_MODE_LABEL[chosenMode]})`,
            'Untuk drive OS utama (E-Book Hal. 17–18), tancapkan Jumper pada kolom kiri (MASTER), bukan Slave atau Cable Select!',
            'warning'
          );
          return;
        }
        setHddJumperColumn(chosenMode);
        labSfx.playMechanicalClick();
        const nextCompleted = [...completedSteps, itemId];
        setCompletedSteps(nextCompleted);
        advanceAfterStepComplete(nextCompleted);
        if (isFreeRoam && chosenMode !== 'master') {
          onNotify(
            `Jumper Terpasang di ${JUMPER_MODE_LABEL[chosenMode]}`,
            'Posisi non-Master diperbolehkan di Free Roam — coba tekan Power Test untuk melihat diagnosanya!',
            'warning'
          );
        } else {
          onNotify(`Terpasang: ${targetItem.label}`, targetItem.successNote, 'success');
        }
        return;
      }

      // 4. Two-End IDE 40-Wire Ribbon Data Cable with [R] Pin-1 Red Stripe
      if (itemId === 'install-ide-cable') {
        if (!ideEndsConnected.board) {
          if (clickedSocketId !== 'ide-port') {
            if (!isFreeRoam) setMistakes((m) => m + 1);
            labSfx.playRuleWarning();
            onNotify(
              'Pasang Ujung 1 di Motherboard Dulu',
              'Pasang ujung pertama kabel pita IDE ke #12 Port IDE biru di motherboard terlebih dahulu!',
              'warning'
            );
            return;
          }
          if (!isPartOrientationValid(itemId, currentRotation)) {
            if (!isFreeRoam) setMistakes((m) => m + 1);
            labSfx.playRuleWarning();
            onNotify(
              'Garis Merah Pin-1 IDE Terbalik!',
              isTouchInput
                ? 'Ketuk tombol Putar kanan (atau tap 2 jari) hingga garis merah Pin-1 sejajar sisi Pin-1 soket!'
                : 'Tekan tombol [R] hingga garis merah Pin-1 pada kabel pita IDE sejajar sisi Pin-1 soket!',
              'warning'
            );
            return;
          }
          setIdeEndsConnected({ board: true, hdd: false });
          setSelectedItemId(itemId);
          labSfx.playMechanicalClick();
          onNotify(
            'Ujung 1 Terpasang (#12 Port IDE)',
            'Kamera mengarah ke belakang HDD — sambungkan Ujung 2 kabel pita IDE ke port IDE 40-Pin di belakang Harddisk 3.5"!',
            'info'
          );
          return;
        }

        // End 2: rear HDD IDE 40-Pin port
        if (clickedSocketId !== 'hdd-ide-port') {
          if (!isFreeRoam) setMistakes((m) => m + 1);
          labSfx.playRuleWarning();
          onNotify(
            'Sambungkan Ujung 2 ke Port IDE HDD',
            'Arahkan ujung kedua kabel pita IDE ke port IDE 40-Pin (hitam lebar) di belakang Harddisk 3.5"!',
            'warning'
          );
          return;
        }
        setIdeEndsConnected({ board: true, hdd: true });
        labSfx.playMechanicalClick();
        const nextCompleted = [...completedSteps, itemId];
        setCompletedSteps(nextCompleted);
        advanceAfterStepComplete(nextCompleted);
        onNotify(`Terpasang: ${targetItem.label}`, targetItem.successNote, 'success');
        return;
      }

      // 5. Real-World 6-Zone Color-Coded F_PANEL 9-Pin + [R] LED Polarity
      const wireKey = FPANEL_WIRE_KEY_BY_STEP[itemId];
      if (wireKey) {
        if (!isFPanelZoneId(clickedSocketId)) {
          if (!isFreeRoam) setMistakes((m) => m + 1);
          labSfx.playRuleWarning();
          onNotify('Arahkan ke Pin F_PANEL 9-Pin', targetItem.wrongSocketHint, 'warning');
          return;
        }

        // Check if another wire already occupies this exact color zone
        const occupyingWireEntry = Object.entries(fPanelWiring).find(
          ([k, v]) => k !== wireKey && v?.zoneId === clickedSocketId
        );
        if (occupyingWireEntry) {
          labSfx.playRuleWarning();
          onNotify(
            'Blok Pin Sudah Terisi',
            `${FPANEL_ZONE_LABELS[clickedSocketId]} sudah ditempati ${WIRE_DISPLAY_LABEL[occupyingWireEntry[0] as CPanelWireId]}. Cabut dulu jika ingin memindahkan!`,
            'warning'
          );
          return;
        }

        const correctZone = FPANEL_CORRECT_ZONE_BY_WIRE[wireKey];
        const polarityValid = isPartOrientationValid(itemId, currentRotation);

        if (difficulty === 'practice') {
          if (clickedSocketId !== correctZone) {
            setMistakes((m) => m + 1);
            labSfx.playRuleWarning();
            onNotify('Salah Blok Warna F_PANEL!', targetItem.wrongSocketHint, 'warning');
            return;
          }
          if (!polarityValid) {
            setMistakes((m) => m + 1);
            labSfx.playRuleWarning();
            onNotify(
              'Polaritas LED Terbalik!',
              isTouchInput
                ? 'Ketuk tombol Putar kanan (atau tap 2 jari) hingga kutub (+)/(-) sejajar!'
                : 'Tekan tombol [R] (atau tombol Balik Polaritas di Bottom Bar) hingga kutub (+)/(-) sejajar!',
              'warning'
            );
            return;
          }
        }

        // In Practice (verified), Exam & Free Roam (any unoccupied zone & polarity seated -> tested at POST!)
        setFPanelWiring((prev) => ({
          ...prev,
          [wireKey]: { zoneId: clickedSocketId, polarityValid },
        }));
        labSfx.playMechanicalClick();
        const nextCompleted = [...completedSteps, itemId];
        setCompletedSteps(nextCompleted);
        advanceAfterStepComplete(nextCompleted);

        if (isExam) {
          onNotify(
            `Tertancap: ${targetItem.shortLabel}`,
            `Kabel ditancapkan di ${FPANEL_ZONE_LABELS[clickedSocketId]}. Ketepatan warna & polaritas akan diuji saat Power Test!`,
            'info'
          );
        } else if (isFreeRoam && (clickedSocketId !== correctZone || !polarityValid)) {
          onNotify(
            `Tertancap (Perlu Cek): ${targetItem.shortLabel}`,
            `Dipasang di ${FPANEL_ZONE_LABELS[clickedSocketId]}${!polarityValid ? ' (polaritas terbalik)' : ''}. Coba tekan Power Test!`,
            'warning'
          );
        } else {
          onNotify(`Terpasang: ${targetItem.label}`, targetItem.successNote, 'success');
        }
        return;
      }

      // 6. Standard Hardware Parts (CPU Lever, CPU, Paste, Heatsink, RAM 1/2, CMOS, VGA, HDD Unit, Molex, ATX 24P & 4P)
      if (!doesSimpleSocketMatch(targetItem.targetSocketId, clickedSocketId)) {
        if (!isFreeRoam) setMistakes((m) => m + 1);
        labSfx.playRuleWarning();
        onNotify('Soket Tujuan Salah', targetItem.wrongSocketHint, 'warning');
        return;
      }

      if (!isPartOrientationValid(itemId, currentRotation)) {
        if (!isFreeRoam) setMistakes((m) => m + 1);
        labSfx.playRuleWarning();
        const isFlipped180 = ((currentRotation % 4) + 4) % 4 === 2;
        onNotify(
          itemId === 'install-cpu'
            ? 'Orientasi Segitiga CPU Belum Cocok'
            : isFlipped180
              ? 'Celah Notch RAM Terbalik 180°'
              : 'Posisi RAM Belum Sejajar',
          itemId === 'install-cpu'
            ? isTouchInput
              ? 'Ketuk tombol Putar kanan (atau tap 2 jari) hingga panah segitiga emas sejajar sudut Pin-1 soket LGA 775!'
              : 'Tekan tombol [R] hingga panah segitiga emas sejajar sudut Pin-1 soket LGA 775!'
            : isTouchInput
              ? 'Ketuk tombol Putar kanan (atau tap 2 jari) hingga panah notch DDR2 tepat di atas tonjolan slot DIMM!'
              : 'Tekan tombol [R] hingga panah notch DDR2 tepat sejajar di atas tonjolan slot DIMM!',
          'warning'
        );
        return;
      }

      if (targetItem.id === 'open-cpu-lever' || targetItem.id === 'close-cpu-lever') {
        labSfx.playLeverLatch();
      } else if (targetItem.id === 'apply-thermal-paste') {
        labSfx.playThermalPaste();
      } else {
        labSfx.playMechanicalClick();
      }

      const nextCompleted = [...completedSteps, targetItem.id];
      setCompletedSteps(nextCompleted);
      advanceAfterStepComplete(nextCompleted);
      onNotify(`Terpasang: ${targetItem.label}`, targetItem.successNote, 'success');
    },
    [
      advanceAfterStepComplete,
      completedSteps,
      difficulty,
      fPanelWiring,
      heatsinkPinsLocked,
      ideEndsConnected,
      isTouchInput,
      nextRequiredStep,
      onNotify,
    ]
  );

  // Live Ghost Tint Evaluator for 3D Drag-and-Drop Magnetic Snap
  const evaluateDragTarget = useCallback(
    (itemId: AssemblyStepId, socketId: string | null, rot: number): DragValidationCheck => {
      if (!socketId) return { state: 'free' };
      const targetItem = STRICT_ASSEMBLY_ITEMS.find((it) => it.id === itemId);
      if (!targetItem) return { state: 'free' };

      const isFreeRoam = difficulty === 'freeroam';
      const isExam = difficulty === 'exam';

      if (!isFreeRoam) {
        if (!nextRequiredStep) return { state: 'free' };
        if (itemId !== nextRequiredStep.id) {
          return { state: 'invalid', reason: 'Urutan salah — selesaikan langkah sebelumnya dulu' };
        }
      }

      if (itemId === 'lock-heatsink-pins') {
        const pinIdx = getHeatsinkPinIndex(socketId);
        if (pinIdx < 0) return { state: 'invalid', reason: 'Arahkan ke salah satu dari 4 push-pin Heatsink' };
        if (heatsinkPinsLocked[pinIdx]) return { state: 'invalid', reason: 'Push-pin ini sudah terkunci' };
        return { state: 'valid', reason: `Klik / lepas untuk mengunci Push-Pin #${pinIdx + 1}` };
      }

      if (itemId === 'lock-vga-screw') {
        if (socketId !== 'vga-screw') return { state: 'invalid', reason: 'Arahkan ke baut braket belakang VGA' };
        return { state: 'valid', reason: 'Lepas untuk mengencangkan baut braket VGA!' };
      }

      if (itemId === 'install-hdd-jumper') {
        const col = JUMPER_SOCKET_TO_MODE[socketId];
        if (!col) return { state: 'invalid', reason: 'Arahkan ke kolom pin Master/Slave/CS di belakang HDD' };
        if (!isFreeRoam && col !== 'master') {
          return { state: 'invalid', reason: `Kolom ${JUMPER_MODE_LABEL[col]} ditolak — tancapkan di MASTER (kiri)!` };
        }
        return {
          state: 'valid',
          reason: `Kolom ${JUMPER_MODE_LABEL[col]} — lepas mouse untuk menancapkan Jumper!`,
        };
      }

      if (itemId === 'install-ide-cable') {
        const expectedSocket = !ideEndsConnected.board ? 'ide-port' : 'hdd-ide-port';
        if (socketId !== expectedSocket) {
          return {
            state: 'invalid',
            reason: !ideEndsConnected.board
              ? 'Pasang Ujung 1 di #12 Port IDE biru motherboard dulu'
              : 'Sambungkan Ujung 2 ke port IDE 40-Pin di belakang HDD',
          };
        }
        if (!ideEndsConnected.board && !isPartOrientationValid(itemId, rot)) {
          return {
            state: 'invalid',
            reason: isTouchInput
              ? 'Garis merah Pin-1 IDE terbalik — tap 2 jari atau ketuk Putar!'
              : 'Garis merah Pin-1 IDE terbalik — tekan [R]!',
          };
        }
        return {
          state: 'valid',
          reason: !ideEndsConnected.board
            ? 'Ujung 1 presisi — lepas untuk memasang di motherboard!'
            : 'Ujung 2 di Port IDE HDD presisi — lepas untuk mengunci!',
        };
      }

      const wireKey = FPANEL_WIRE_KEY_BY_STEP[itemId];
      if (wireKey) {
        if (!isFPanelZoneId(socketId)) {
          return { state: 'invalid', reason: 'Arahkan tepat ke salah satu blok pin warna F_PANEL 9-Pin' };
        }
        const occupiedBy = Object.entries(fPanelWiring).find(
          ([k, v]) => k !== wireKey && v?.zoneId === socketId
        );
        if (occupiedBy) {
          return { state: 'invalid', reason: `${FPANEL_ZONE_LABELS[socketId]} sudah terisi kabel lain` };
        }
        if (difficulty === 'practice') {
          if (socketId !== FPANEL_CORRECT_ZONE_BY_WIRE[wireKey]) {
            return { state: 'invalid', reason: `Salah blok warna! Anda menunjuk ${FPANEL_ZONE_LABELS[socketId]}` };
          }
          if (!isPartOrientationValid(itemId, rot)) {
            return {
              state: 'invalid',
              reason: isTouchInput
                ? 'Polaritas LED terbalik — tap 2 jari atau ketuk Putar!'
                : 'Polaritas LED terbalik — tekan [R] untuk membalik (+)/(-)!'
            };
          }
          return { state: 'valid', reason: `${FPANEL_ZONE_LABELS[socketId]} presisi — lepas untuk menancapkan!` };
        }
        // Exam & Free Roam: allow any unoccupied zone without spoiling Exam correctness
        return {
          state: 'valid',
          reason: isExam
            ? `Lepas untuk menancapkan di ${FPANEL_ZONE_LABELS[socketId]}`
            : `${FPANEL_ZONE_LABELS[socketId]} — lepas untuk menancapkan`,
        };
      }

      if (!doesSimpleSocketMatch(targetItem.targetSocketId, socketId)) {
        if (itemId === 'install-ram-1' || itemId === 'install-ram-2') {
          return {
            state: 'invalid',
            reason:
              itemId === 'install-ram-1'
                ? 'Salah slot — arahkan tepat ke Slot DIMM 1 (cyan pertama)'
                : 'Salah slot — arahkan tepat ke Slot DIMM 2 (cyan kedua)',
          };
        }
        return { state: 'invalid', reason: 'Soket tidak cocok untuk komponen ini' };
      }
      if (!isPartOrientationValid(itemId, rot)) {
        const isRam = itemId === 'install-ram-1' || itemId === 'install-ram-2';
        const isFlipped180 = ((rot % 4) + 4) % 4 === 2;
        return {
          state: 'invalid',
          reason:
            isRam && isFlipped180
              ? isTouchInput
                ? 'Notch RAM terbalik 180° — ketuk Putar hingga titik notch sejajar!'
                : 'Notch RAM terbalik 180° — tekan [R] hingga titik notch sejajar!'
              : isTouchInput
                ? 'Orientasi belum sejajar — tap 2 jari atau ketuk Putar!'
                : 'Orientasi belum sejajar — tekan tombol [R] untuk memutar!',
        };
      }
      return {
        state: 'valid',
        reason: isTouchInput
          ? 'Posisi presisi — lepas jari untuk memasang!'
          : 'Posisi presisi — lepas mouse untuk memasang!',
      };
    },
    [difficulty, fPanelWiring, heatsinkPinsLocked, ideEndsConnected, isTouchInput, nextRequiredStep]
  );

  // Direct 3D Socket / Pin / Fastener Click Handler
  const handleSocketClickInAssemble = useCallback(
    (clickedSocketId: string) => {
      const isFreeRoam = difficulty === 'freeroam';
      const isExam = difficulty === 'exam';

      // Direct unplug of an occupied F_PANEL zone in Exam or Free Roam when NOT holding a wire to install
      if (isFPanelZoneId(clickedSocketId) && (!selectedItemId || completedSteps.includes(selectedItemId))) {
        const pluggedWireEntry = Object.entries(fPanelWiring).find(
          ([, v]) => v?.zoneId === clickedSocketId
        );
        if (pluggedWireEntry && (isFreeRoam || (isExam && !isPoweredOn))) {
          const stepId = FPANEL_STEP_BY_WIRE_KEY[pluggedWireEntry[0] as CPanelWireId];
          handleUninstallItem(stepId);
          return;
        }
      }

      // Free Roam: Direct fastener clicks, install selected item, OR click installed 3D part directly to uninstall
      if (isFreeRoam) {
        const pinIdx = getHeatsinkPinIndex(clickedSocketId);
        if (
          pinIdx >= 0 &&
          completedSteps.includes('install-heatsink') &&
          !completedSteps.includes('lock-heatsink-pins')
        ) {
          attemptInstall('lock-heatsink-pins', clickedSocketId, 0);
          return;
        }
        if (
          clickedSocketId === 'vga-screw' &&
          completedSteps.includes('install-vga') &&
          !completedSteps.includes('lock-vga-screw')
        ) {
          attemptInstall('lock-vga-screw', clickedSocketId, 0);
          return;
        }
        if (selectedItemId && !completedSteps.includes(selectedItemId)) {
          attemptInstall(selectedItemId, clickedSocketId, rotationStep);
          return;
        }

        const removableCandidates = SOCKET_UNINSTALL_PRIORITY[clickedSocketId] ?? [];
        const installedTarget = removableCandidates.find((stepId) =>
          completedSteps.includes(stepId)
        );
        if (installedTarget) {
          handleUninstallItem(installedTarget);
          return;
        }

        onNotify(
          'Mode Free Roam',
          'Pilih atau seret kartu komponen dari Bottom Bar ke soket, atau klik komponen terpasang untuk melepas.',
          'info'
        );
        return;
      }

      // Strict Latihan / Ujian: Direct click on 3D C-Panel Power Button when all 23 steps are installed
      if (
        allPartsInstalled &&
        (clickedSocketId === 'c-panel' || (difficulty === 'practice' && clickedSocketId === 'fpanel-red-68'))
      ) {
        handleTriggerPowerTest();
        return;
      }

      if (!nextRequiredStep) return;

      // Direct click on 3D LGA 775 Lever without needing to pick Bottom Bar card
      if (
        (nextRequiredStep.id === 'open-cpu-lever' || nextRequiredStep.id === 'close-cpu-lever') &&
        clickedSocketId === 'cpu-socket'
      ) {
        attemptInstall(nextRequiredStep.id, clickedSocketId, 0);
        return;
      }

      // Direct click on 4 Heatsink Push-Pins without needing to drag a card
      if (nextRequiredStep.id === 'lock-heatsink-pins' && getHeatsinkPinIndex(clickedSocketId) >= 0) {
        attemptInstall('lock-heatsink-pins', clickedSocketId, 0);
        return;
      }

      // Direct click on VGA Bracket Thumbscrew without needing to drag a card
      if (nextRequiredStep.id === 'lock-vga-screw' && clickedSocketId === 'vga-screw') {
        attemptInstall('lock-vga-screw', clickedSocketId, 0);
        return;
      }

      if (!selectedItemId) {
        onNotify(
          'Seret atau Pilih Komponen',
          'Seret kartu komponen dari Bottom Bar ke soket 3D, atau klik kartunya dulu lalu klik soket/pin tujuan.',
          'info'
        );
        return;
      }

      attemptInstall(selectedItemId, clickedSocketId, rotationStep);
    },
    [
      allPartsInstalled,
      attemptInstall,
      completedSteps,
      difficulty,
      fPanelWiring,
      handleTriggerPowerTest,
      handleUninstallItem,
      isPoweredOn,
      nextRequiredStep,
      onNotify,
      rotationStep,
      selectedItemId,
    ]
  );

  const handleDropOnSocket = useCallback(
    (itemId: AssemblyStepId, socketId: string, rot: number) => {
      setDraggingItemId(null);
      setDragInitialClientPos(null);
      attemptInstall(itemId, socketId, rot);
    },
    [attemptInstall]
  );

  const handleLocalGlbFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/\.(glb|gltf)$/i.test(file.name)) {
      onNotify('Format Tidak Didukung', 'Unggah model Blender .glb atau .gltf.', 'warning');
      return;
    }
    if (file.size <= 0 || file.size > MAX_GLB_FILE_BYTES) {
      onNotify(
        'Ukuran Berkas Ditolak',
        'Ukuran maksimum berkas 3D adalah 25 MB agar perangkat tetap aman dan stabil.',
        'warning'
      );
      return;
    }
    if (/\.glb$/i.test(file.name)) {
      const validHeader = await verifyGlbBinaryHeader(file);
      if (!validHeader) {
        onNotify(
          'Header Berkas Tidak Valid',
          'Berkas .glb gagal validasi signature biner glTF dan diblokir demi keamanan.',
          'error'
        );
        return;
      }
    }
    if (localGlbUrl) URL.revokeObjectURL(localGlbUrl);
    setLocalGlbUrl(URL.createObjectURL(file));
    setModelSource('local-glb');
  };

  return (
    <div className="fixed inset-0 z-50 h-[100dvh] w-full overflow-hidden bg-[#0B0E14]">
      {/* 100% Fullscreen 3D Viewport */}
      <OptionalGlbErrorBoundary
        onResetToProcedural={() => {
          setModelSource('procedural');
          onNotify('Viewport Dipulihkan', 'Kembali ke Procedural PBR Studio.', 'info');
        }}
      >
        <FullMotherboardLabCanvas
          mode={mode}
          completedAssemblySteps={completedSteps}
          heatsinkPinsLocked={heatsinkPinsLocked}
          vgaScrewLocked={vgaScrewLocked}
          ideEndsConnected={ideEndsConnected}
          hddJumperColumn={hddJumperColumn}
          fPanelWiring={fPanelWiring}
          isPoweredOn={isPoweredOn}
          selectedComponentId={selectedComponentId}
          practiceGuideSocketId={practiceGuideSocketId}
          practiceGuideLabel={practiceGuideLabel}
          assembleFocusTarget={assembleFocusTarget}
          zoomPinNonce={zoomPinNonce}
          draggingItemId={draggingItemId}
          dragInitialClientPos={dragInitialClientPos}
          dragRotationStep={rotationStep}
          isHeldPartAligned={isHeldPartAligned}
          dockHeightPx={dockHeightPx}
          canRotateActive={canRotateActive}
          onRotateActivePart={handleRotatePart}
          evaluateDragTarget={evaluateDragTarget}
          onDropOnSocket={handleDropOnSocket}
          onCancelDrag={() => {
            setDraggingItemId(null);
            setDragInitialClientPos(null);
          }}
          onDragFeedbackChange={setDragFeedback}
          onSelectComponent={handleSelectInspectComponent}
          onSocketClickInAssemble={handleSocketClickInAssemble}
          showPins={showPins}
          showDataFlow={showDataFlow}
          inspection360={inspection360}
          graphicsQuality={graphicsQuality}
          modelSource={modelSource}
          localGlbUrl={localGlbUrl}
          cameraResetNonce={cameraResetNonce}
          onModelFallback={(reason) => {
            setModelSource('procedural');
            onNotify('Fallback Procedural PBR', reason, 'warning');
          }}
          onGlbLoaded={(label) => onNotify('Model .GLB Aktif', label, 'success')}
        />
      </OptionalGlbErrorBoundary>

      {/* Minimalist Floating Top HUD Bar (Zero backdrop-filter over WebGL, 360px + safe-area friendly) */}
      <div className="pointer-events-none absolute inset-x-2.5 sm:inset-x-3 top-[calc(0.625rem+env(safe-area-inset-top,0px))] z-30 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => {
            labSfx.stopFanHum();
            onExitLab();
          }}
          className="pointer-events-auto inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#3B82F6]/25 bg-[#070E1F]/94 px-3 py-1.5 text-xs font-medium text-[#F8FAFC] hover:border-[#38BDF8] press-feedback"
        >
          <ArrowLeft size={14} weight="bold" />
          <span>Keluar Lab 3D</span>
        </button>

        <div className="pointer-events-auto inline-flex rounded-lg border border-[#3B82F6]/25 bg-[#070E1F]/94 p-0.5">
          <button
            type="button"
            onClick={() => handleSwitchMode('inspect')}
            className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium transition-colors ${
              mode === 'inspect'
                ? 'bg-[#2563EB] text-white shadow-[0_0_16px_rgba(37,99,235,0.4)]'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Circuitry size={14} weight={mode === 'inspect' ? 'fill' : 'regular'} />
            <span className="sm:hidden">Inspeksi ({inspectedComponents.length}/25)</span>
            <span className="hidden sm:inline">1. Inspeksi 24 Titik ({inspectedComponents.length}/25)</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('assemble')}
            className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium transition-colors ${
              mode === 'assemble'
                ? 'bg-[#2563EB] text-white shadow-[0_0_16px_rgba(37,99,235,0.4)]'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Wrench size={14} weight={mode === 'assemble' ? 'fill' : 'regular'} />
            <span className="sm:hidden">Rakit TAS</span>
            <span className="hidden sm:inline">2. Game Rakit TAS</span>
          </button>
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center gap-1 rounded-lg border border-[#3B82F6]/25 bg-[#070E1F]/94 p-1">
          {mode === 'inspect' ? (
            <button
              type="button"
              onClick={() => setShowPins((p) => !p)}
              title="Tampilkan / Sembunyikan Pin #01–#24"
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${
                showPins ? 'bg-[#2563EB]/25 text-[#38BDF8]' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              {showPins ? <Eye size={13} /> : <EyeSlash size={13} />}
              Pin
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleZoomPin}
              title={zoomPinActive ? 'Kembali ke Sudut Penuh Motherboard' : 'Zoom Makro ke Area Pin / Baut Aktif'}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                zoomPinActive
                  ? 'bg-[#2563EB]/30 text-[#38BDF8] border border-[#38BDF8]/40'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] border border-transparent'
              }`}
            >
              {zoomPinActive ? (
                <MagnifyingGlassMinus size={13} weight="bold" />
              ) : (
                <MagnifyingGlassPlus size={13} weight="bold" />
              )}
              Zoom Pin
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDataFlow((p) => !p)}
            title="Animasi Jalur Chipset Northbridge / Southbridge"
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${
              showDataFlow ? 'bg-[#2563EB]/25 text-[#38BDF8]' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <FlowArrow size={13} />
            Chipset
          </button>

          <button
            type="button"
            onClick={() => setInspection360((p) => !p)}
            title="Toggle Meja Anti-Statis / Inspeksi 360°"
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${
              inspection360 ? 'bg-[#10B981]/20 text-[#34D399]' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <GlobeHemisphereWest size={13} />
            {inspection360 ? '360°' : 'Meja'}
          </button>

          <button
            type="button"
            onClick={handleToggleMute}
            title={sfxMuted ? 'Aktifkan Efek Suara' : 'Bisukan Efek Suara'}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${
              sfxMuted ? 'text-[#F43F5E]' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            {sfxMuted ? <SpeakerSlash size={13} /> : <SpeakerHigh size={13} />}
            SFX
          </button>

          <button
            type="button"
            onClick={handleCycleGraphicsQuality}
            title={`Kualitas Grafis 3D: ${activeQualityLabel} (Ketuk untuk ganti Auto / Hemat / Ultra)`}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
              graphicsQuality === 'low'
                ? 'bg-[#10B981]/20 text-[#34D399]'
                : graphicsQuality === 'ultra'
                  ? 'bg-[#2563EB]/25 text-[#38BDF8]'
                  : 'text-[#CBD5E1] hover:text-[#F8FAFC]'
            }`}
          >
            <Gauge size={13} weight="bold" />
            <span>{graphicsQuality === 'auto' ? 'Auto' : graphicsQuality === 'low' ? 'Hemat' : 'Ultra'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setZoomPinActive(false);
              setManualZoomTarget(null);
              setCameraResetNonce((n) => n + 1);
            }}
            title="Reset Sudut Kamera"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#94A3B8] hover:text-[#F8FAFC]"
          >
            <ArrowCounterClockwise size={13} />
          </button>

          <span className="h-4 w-px bg-[#3B82F6]/20" />

          <button
            type="button"
            onClick={() => setModelSource(modelSource === 'procedural' ? 'public-glb' : 'procedural')}
            title="Beralih Procedural PBR vs public/models/motherboard.glb"
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${
              modelSource !== 'procedural'
                ? 'bg-[#2563EB]/25 text-[#38BDF8]'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Cube size={13} />
            {modelSource === 'procedural' ? 'PBR' : '.GLB'}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Unggah file model 3D Blender .glb lokal"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#94A3B8] hover:text-[#38BDF8]"
          >
            <UploadSimple size={13} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf"
            onChange={handleLocalGlbFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Live Drag Snap Status Banner */}
      {draggingItemId && (
        <div
          className={`pointer-events-none absolute top-[calc(5.25rem+env(safe-area-inset-top,0px))] sm:top-14 left-1/2 z-30 w-max max-w-[calc(100vw-1.5rem)] -translate-x-1/2 rounded-lg border px-3 py-1.5 text-center text-[11px] sm:text-xs font-medium shadow-lg ${
            dragFeedback.state === 'valid'
              ? 'border-[#10B981]/60 bg-[#040812]/95 text-[#34D399]'
              : dragFeedback.state === 'invalid'
                ? 'border-[#F43F5E]/60 bg-[#040812]/95 text-[#FDA4AF]'
                : 'border-[#38BDF8]/50 bg-[#040812]/95 text-[#38BDF8]'
          }`}
        >
          {dragFeedback.reason ??
            (isTouchInput
              ? 'Seret ke soket/pin tujuan · Tap 2 jari atau ketuk Putar kanan'
              : 'Seret ke atas soket/pin tujuan · Tekan [R] untuk memutar orientasi atau polaritas')}
        </div>
      )}

      {/* Compact WASD + Q/E + Orbit Camera Legend */}
      <div className="pointer-events-none absolute top-13 left-3 z-20 hidden sm:flex items-center gap-2 rounded-lg border border-[#3B82F6]/20 bg-[#070E1F]/88 px-2.5 py-1 font-mono text-[10px] text-[#94A3B8]">
        <span className="text-[#38BDF8] font-semibold">WASD</span> Geser
        <span>·</span>
        <span className="text-[#38BDF8] font-semibold">Q/E</span> Tinggi
        <span>·</span>
        <span className="text-[#CBD5E1]">Mouse</span> Orbit
        {mode === 'assemble' && (
          <>
            <span>·</span>
            <span className="text-[#F59E0B] font-semibold">R</span> Putar / Polaritas
          </>
        )}
      </div>

      {/* Mode 1: Right-Side Floating Inspection Popup Card */}
      {mode === 'inspect' && selectedComponent && (
        <InspectPopupCard
          component={selectedComponent}
          isInspected={inspectedComponents.includes(selectedComponent.id)}
          onClose={() => setSelectedComponentId(null)}
        />
      )}

      {/* Mode 2 Floating Right Touch Rotate Pill + Cancel Drag Affordance */}
      {mode === 'assemble' && (
        <TouchRotateFloatingPill
          activeHeldId={activeHeldId}
          rotationStep={rotationStep}
          isFreeRoam={difficulty === 'freeroam'}
          allPartsInstalled={allPartsInstalled}
          isDragging={Boolean(draggingItemId)}
          isTouchInput={isTouchInput}
          dockHeightPx={dockHeightPx}
          onRotatePart={handleRotatePart}
          onCancelDrag={() => {
            setDraggingItemId(null);
            setDragInitialClientPos(null);
          }}
        />
      )}

      {/* Mode 2: Visual Hardware Component Cards & Hybrid 3D Drag-and-Drop Dock */}
      {mode === 'assemble' && (
        <AssemblyBottomDock
          difficulty={difficulty}
          onChangeDifficulty={(nextDiff) => {
            setDifficulty(nextDiff);
            if (nextDiff === 'practice' && nextRequiredStep) {
              setSelectedItemId(nextRequiredStep.id);
              setRotationStep(getInitialRotationForPart(nextRequiredStep.id));
            } else {
              setSelectedItemId(null);
              setRotationStep(0);
            }
          }}
          completedSteps={completedSteps}
          heatsinkLockedCount={heatsinkLockedCount}
          ideBoardConnected={ideEndsConnected.board}
          fPanelWiring={fPanelWiring}
          selectedItemId={selectedItemId}
          draggingItemId={draggingItemId}
          rotationStep={rotationStep}
          isTouchInput={isTouchInput}
          onRotatePart={handleRotatePart}
          onFocusActiveTarget={handleFocusActiveTarget}
          onSelectItem={handleSelectInventoryItem}
          onStartDragItem={handleStartDragItem}
          onCancelDrag={() => {
            setDraggingItemId(null);
            setDragInitialClientPos(null);
          }}
          onUninstallItem={handleUninstallItem}
          onDockHeightChange={setDockHeightPx}
          onNotify={onNotify}
          psuVoltage={psuVoltage}
          onChangePsuVoltage={setPsuVoltage}
          isPoweredOn={isPoweredOn}
          onTriggerPowerTest={handleTriggerPowerTest}
          onOpenReport={() => {
            if (assemblyHistory[0]) setActiveReport(assemblyHistory[0]);
          }}
          onResetAssembly={() => resetAssemblyGame(true)}
          mistakes={mistakes}
          elapsedSeconds={elapsedSeconds}
        />
      )}

      {/* Mode 2 Final Modal: BIOS POST + Rapor Praktik TAS / Hardware Diagnostics */}
      {activeReport && (
        <AssemblyPostReportModal
          report={activeReport}
          history={assemblyHistory}
          onClose={() => setActiveReport(null)}
          onPlayAgain={() => resetAssemblyGame(true)}
        />
      )}
    </div>
  );
}
