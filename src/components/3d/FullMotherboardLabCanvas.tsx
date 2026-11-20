import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MAINBOARD_COMPONENTS } from '../../data/mainboardData';
import { FPANEL_ALL_ZONES, FPANEL_CORRECT_ZONE_BY_WIRE } from '../../data/assemblyGameData';
import type {
  AssemblyStepId,
  CPanelWireId,
  FPanelWireAssignment,
  HddJumperMode,
  Lab3DMode,
  ModelSourceMode,
} from '../../types/rigbench';
import {
  buildProceduralMotherboard,
  detectSoftwareWebGL,
  type BuiltMotherboardScene,
} from './motherboardBuilder';
import { createCameraRigController } from './cameraRigController';
import { createDragPreviewSystem, type DragTintState } from './dragPreviewFactory';
import { loadOptionalGlbModel, type LoadedGlbHandle } from './OptionalGlbLoader';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  resolveRenderProfile,
  type GraphicsQualityMode,
  type ResolvedRenderProfile,
} from '../../utils/deviceTier';

export interface DragValidationCheck {
  state: DragTintState;
  reason?: string;
}

export type AssembleAutoFocusTarget =
  | 'cpu-socket'
  | 'heatsink-pins'
  | 'ram-slots'
  | 'cmos-battery'
  | 'pcie-x16'
  | 'vga-screw'
  | 'hdd-jumper'
  | 'hdd-bay'
  | 'ide-board'
  | 'hdd-ide-port'
  | 'hdd-molex-port'
  | 'f-panel-header'
  | 'atx-24pin'
  | 'atx-4pin'
  | null;

interface FullMotherboardLabCanvasProps {
  mode: Lab3DMode;
  completedAssemblySteps: AssemblyStepId[];
  heatsinkPinsLocked: boolean[];
  vgaScrewLocked: boolean;
  ideEndsConnected: { board: boolean; hdd: boolean };
  hddJumperColumn: HddJumperMode | null;
  fPanelWiring: Partial<Record<CPanelWireId, FPanelWireAssignment>>;
  isPoweredOn: boolean;
  selectedComponentId: string | null;
  practiceGuideSocketId: string | null;
  practiceGuideLabel: string | null;
  assembleFocusTarget: AssembleAutoFocusTarget;
  zoomPinNonce: number;
  draggingItemId: AssemblyStepId | null;
  dragInitialClientPos: { x: number; y: number } | null;
  dragRotationStep: number;
  isHeldPartAligned: boolean;
  evaluateDragTarget: (
    itemId: AssemblyStepId,
    socketId: string | null,
    rotationStep: number
  ) => DragValidationCheck;
  onDropOnSocket: (itemId: AssemblyStepId, socketId: string, rotationStep: number) => void;
  onCancelDrag: () => void;
  onDragFeedbackChange: (info: { socketId: string | null; state: DragTintState; reason?: string }) => void;
  onSelectComponent: (id: string) => void;
  onSocketClickInAssemble: (socketId: string) => void;
  showPins: boolean;
  showDataFlow: boolean;
  inspection360: boolean;
  graphicsQuality?: GraphicsQualityMode;
  modelSource: ModelSourceMode;
  localGlbUrl: string | null;
  cameraResetNonce: number;
  onModelFallback: (reason: string) => void;
  onGlbLoaded: (label: string) => void;
}

interface ProjectedGuideBadge {
  x: number;
  y: number;
  visible: boolean;
  label: string;
}

interface AdaptiveRingProfile {
  scale: number;
  vertical: boolean;
  yOffset: number;
  zOffset: number;
  labelYOffset: number;
}

const DEFAULT_CAM_POS = new THREE.Vector3(7.4, 9.2, 11.4);
const DEFAULT_CAM_TARGET = new THREE.Vector3(0.45, 0.25, 0.55);

const BROAD_SOCKET_SNAP_COORDS: Record<string, [number, number, number]> = {
  'cpu-socket': [2.1, 0.42, -1.6],
  'ram-slot-1': [1.9, 0.52, 1.19],
  'ram-slot-2': [1.9, 0.52, 2.07],
  'cmos-battery': [-1.4, 0.32, 2.35],
  'pcie-x16': [-1.5, 0.44, -1.68],
  'hdd-bay': [-1.35, 0.32, 6.25],
  'ide-port': [-0.85, 0.42, 3.45],
  'atx-power': [1.55, 0.46, 3.45],
  'atx-4pin': [4.1, 0.46, -2.5],
};

// High-precision sub-hitboxes that take raycast priority in Assemble mode
const FINE_ASSEMBLE_PRIORITY = new Set<string>([
  'hdd-jumper-master',
  'hdd-jumper-slave',
  'hdd-jumper-cs',
  'fpanel-orange-13',
  'fpanel-green-2',
  'fpanel-green-4',
  'fpanel-blue-57',
  'fpanel-red-68',
  'fpanel-black-9',
  'heatsink-pin-0',
  'heatsink-pin-1',
  'heatsink-pin-2',
  'heatsink-pin-3',
  'vga-screw',
  'hdd-ide-port',
  'hdd-molex-port',
  'atx-4pin',
  'ram-slot-1',
  'ram-slot-2',
]);

function getAdaptiveRingProfile(guideId: string): AdaptiveRingProfile {
  if (
    guideId === 'hdd-jumper-master' ||
    guideId === 'hdd-jumper-slave' ||
    guideId === 'hdd-jumper-cs'
  ) {
    return { scale: 0.22, vertical: true, yOffset: 0.0, zOffset: -0.08, labelYOffset: 0.34 };
  }
  if (guideId === 'hdd-ide-port') {
    return { scale: 0.58, vertical: true, yOffset: 0.0, zOffset: -0.06, labelYOffset: 0.48 };
  }
  if (guideId === 'hdd-molex-port') {
    return { scale: 0.42, vertical: true, yOffset: 0.0, zOffset: -0.06, labelYOffset: 0.44 };
  }
  if (guideId === 'fpanel-green-2' || guideId === 'fpanel-green-4' || guideId === 'fpanel-black-9') {
    return { scale: 0.17, vertical: false, yOffset: 0.08, zOffset: 0, labelYOffset: 0.32 };
  }
  if (guideId === 'fpanel-orange-13' || guideId === 'fpanel-blue-57' || guideId === 'fpanel-red-68') {
    return { scale: 0.24, vertical: false, yOffset: 0.08, zOffset: 0, labelYOffset: 0.34 };
  }
  if (guideId === 'vga-screw') {
    return { scale: 0.25, vertical: false, yOffset: 0.08, zOffset: 0, labelYOffset: 0.36 };
  }
  if (guideId === 'atx-4pin') {
    return { scale: 0.46, vertical: false, yOffset: 0.14, zOffset: 0, labelYOffset: 0.55 };
  }
  if (guideId === 'cmos-battery') {
    return { scale: 0.68, vertical: false, yOffset: 0.14, zOffset: 0, labelYOffset: 0.55 };
  }
  if (guideId === 'ram-slot-1' || guideId === 'ram-slot-2') {
    return { scale: 0.82, vertical: false, yOffset: 0.08, zOffset: 0, labelYOffset: 0.68 };
  }
  if (guideId === 'ide-port' || guideId === 'atx-power') {
    return { scale: 0.85, vertical: false, yOffset: 0.14, zOffset: 0, labelYOffset: 0.62 };
  }
  return { scale: 1.05, vertical: false, yOffset: 0.14, zOffset: 0, labelYOffset: 0.78 };
}

function mapInspectHitboxId(rawId: string): string {
  if (rawId.startsWith('fpanel-')) return 'c-panel';
  if (rawId === 'ram-slot-1' || rawId === 'ram-slot-2') return 'ram-slots';
  if (rawId.startsWith('heatsink-pin-')) return 'cpu-socket';
  if (rawId === 'vga-screw') return 'pcie-x16';
  if (rawId === 'atx-4pin') return 'atx-power';
  if (rawId.startsWith('hdd-')) return 'ide-port';
  return rawId;
}

export function FullMotherboardLabCanvas({
  mode,
  completedAssemblySteps,
  heatsinkPinsLocked,
  vgaScrewLocked,
  ideEndsConnected,
  hddJumperColumn,
  fPanelWiring,
  isPoweredOn,
  selectedComponentId,
  practiceGuideSocketId,
  practiceGuideLabel,
  assembleFocusTarget,
  zoomPinNonce,
  draggingItemId,
  dragInitialClientPos,
  dragRotationStep,
  isHeldPartAligned,
  evaluateDragTarget,
  onDropOnSocket,
  onCancelDrag,
  onDragFeedbackChange,
  onSelectComponent,
  onSocketClickInAssemble,
  showPins,
  showDataFlow,
  inspection360,
  graphicsQuality = 'auto',
  modelSource,
  localGlbUrl,
  cameraResetNonce,
  onModelFallback,
  onGlbLoaded,
}: FullMotherboardLabCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  const [guideBadge, setGuideBadge] = useState<ProjectedGuideBadge>({
    x: 0,
    y: 0,
    visible: false,
    label: '',
  });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [glbLoading, setGlbLoading] = useState(false);

  const builtRef = useRef<BuiltMotherboardScene | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const glbHandleRef = useRef<LoadedGlbHandle | null>(null);
  const dragPreviewRef = useRef<ReturnType<typeof createDragPreviewSystem> | null>(null);
  const pinBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const isSoftwareGlRef = useRef<boolean>(false);
  const renderProfileRef = useRef<ResolvedRenderProfile | null>(null);
  const graphicsQualityRef = useRef<GraphicsQualityMode>(graphicsQuality);
  graphicsQualityRef.current = graphicsQuality;
  const forcePinSyncRef = useRef<boolean>(true);

  const camTargetPosRef = useRef<THREE.Vector3 | null>(null);
  const camTargetLookRef = useRef<THREE.Vector3 | null>(null);

  // Track precision alignment glow flashes when CPU / RAM1 / RAM2 lock into place
  const lockFlashRef = useRef<{ cpu: number; ram1: number; ram2: number }>({
    cpu: 0,
    ram1: 0,
    ram2: 0,
  });
  const prevStepsRef = useRef<Set<AssemblyStepId>>(new Set(completedAssemblySteps));

  const modeRef = useRef(mode);
  const completedStepsRef = useRef<Set<AssemblyStepId>>(new Set(completedAssemblySteps));
  const heatsinkPinsRef = useRef<boolean[]>(heatsinkPinsLocked);
  const vgaScrewRef = useRef<boolean>(vgaScrewLocked);
  const ideEndsRef = useRef(ideEndsConnected);
  const hddJumperColRef = useRef<HddJumperMode | null>(hddJumperColumn);
  const fPanelWiringRef = useRef(fPanelWiring);
  const isPoweredOnRef = useRef(isPoweredOn);
  const showPinsRef = useRef(showPins);
  const showDataFlowRef = useRef(showDataFlow);
  const practiceGuideRef = useRef(practiceGuideSocketId);
  const practiceGuideLabelRef = useRef(practiceGuideLabel);
  const draggingItemRef = useRef<AssemblyStepId | null>(draggingItemId);
  const dragRotationRef = useRef<number>(dragRotationStep);
  const isHeldPartAlignedRef = useRef<boolean>(isHeldPartAligned);
  const evaluateDragRef = useRef(evaluateDragTarget);
  const onDropRef = useRef(onDropOnSocket);
  const onCancelDragRef = useRef(onCancelDrag);
  const onDragFeedbackRef = useRef(onDragFeedbackChange);
  const onSelectRef = useRef(onSelectComponent);
  const onSocketClickRef = useRef(onSocketClickInAssemble);
  const onFallbackRef = useRef(onModelFallback);
  const onGlbLoadedRef = useRef(onGlbLoaded);

  modeRef.current = mode;
  completedStepsRef.current = new Set(completedAssemblySteps);
  heatsinkPinsRef.current = heatsinkPinsLocked;
  vgaScrewRef.current = vgaScrewLocked;
  ideEndsRef.current = ideEndsConnected;
  hddJumperColRef.current = hddJumperColumn;
  fPanelWiringRef.current = fPanelWiring;
  isPoweredOnRef.current = isPoweredOn;
  showPinsRef.current = showPins;
  showDataFlowRef.current = showDataFlow;
  practiceGuideRef.current = practiceGuideSocketId;
  practiceGuideLabelRef.current = practiceGuideLabel;
  draggingItemRef.current = draggingItemId;
  dragRotationRef.current = dragRotationStep;
  isHeldPartAlignedRef.current = isHeldPartAligned;
  evaluateDragRef.current = evaluateDragTarget;
  onDropRef.current = onDropOnSocket;
  onCancelDragRef.current = onCancelDrag;
  onDragFeedbackRef.current = onDragFeedbackChange;
  onSelectRef.current = onSelectComponent;
  onSocketClickRef.current = onSocketClickInAssemble;
  onFallbackRef.current = onModelFallback;
  onGlbLoadedRef.current = onGlbLoaded;

  const dragClientPosRef = useRef<{ x: number; y: number } | null>(null);
  const dragSnapSocketRef = useRef<string | null>(null);

  // Trigger precision rotate-settle + green glow pulse when CPU, RAM 1, or RAM 2 installs
  useEffect(() => {
    const prev = prevStepsRef.current;
    const next = new Set(completedAssemblySteps);
    const built = builtRef.current;
    if (built) {
      if (next.has('install-cpu') && !prev.has('install-cpu')) {
        built.assemblyParts.cpuChip.rotation.y = 0.55;
        built.assemblyParts.cpuChip.position.y = 1.05;
        lockFlashRef.current.cpu = 1.25;
      }
      if (next.has('install-ram-1') && !prev.has('install-ram-1')) {
        built.assemblyParts.ramStick1.rotation.y = 0.35;
        built.assemblyParts.ramStick1.position.y = 1.35;
        lockFlashRef.current.ram1 = 1.25;
      }
      if (next.has('install-ram-2') && !prev.has('install-ram-2')) {
        built.assemblyParts.ramStick2.rotation.y = -0.35;
        built.assemblyParts.ramStick2.position.y = 1.35;
        lockFlashRef.current.ram2 = 1.25;
      }
    }
    prevStepsRef.current = next;
  }, [completedAssemblySteps]);

  // Mount Three.js WebGLRenderer ONCE
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const isSoftwareGl = detectSoftwareWebGL();
    isSoftwareGlRef.current = isSoftwareGl;
    const initialProfile = resolveRenderProfile(graphicsQualityRef.current, isSoftwareGl);
    renderProfileRef.current = initialProfile;

    const renderer = new THREE.WebGLRenderer({
      antialias: initialProfile.antialias,
      powerPreference: initialProfile.effectiveTier === 'low' ? 'default' : 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, initialProfile.maxDpr));
    renderer.shadowMap.enabled = initialProfile.shadowsEnabled;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    const initW = host.clientWidth || window.innerWidth;
    const initH = host.clientHeight || window.innerHeight;
    renderer.setSize(initW, initH);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0e14);
    scene.fog = new THREE.FogExp2(0x0b0e14, 0.018);
    sceneRef.current = scene;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(42, initW / initH, 0.1, 130);
    camera.position.copy(DEFAULT_CAM_POS);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(DEFAULT_CAM_TARGET);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.minDistance = 1.8;
    controls.maxDistance = 24;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.update();
    controlsRef.current = controls;

    const cancelCameraAutoFocus = () => {
      camTargetPosRef.current = null;
      camTargetLookRef.current = null;
    };
    controls.addEventListener('start', cancelCameraAutoFocus);

    const cameraRig = createCameraRigController(camera, controls, cancelCameraAutoFocus);

    const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x0b0e14, 0.9);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff5e8, 1.65);
    keyLight.position.set(8, 15, 9);
    keyLight.shadow.mapSize.set(initialProfile.shadowMapSize, initialProfile.shadowMapSize);
    keyLight.shadow.camera.left = -12;
    keyLight.shadow.camera.right = 12;
    keyLight.shadow.camera.top = 12;
    keyLight.shadow.camera.bottom = -12;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    keyLight.castShadow = initialProfile.shadowsEnabled;
    keyLightRef.current = keyLight;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x22d3ee, 0.85);
    rimLight.position.set(-10, 7, -9);
    scene.add(rimLight);

    const effectiveAnisotropy = Math.min(
      renderer.capabilities.getMaxAnisotropy(),
      initialProfile.anisotropyCap
    );
    const built = buildProceduralMotherboard(effectiveAnisotropy);
    builtRef.current = built;
    scene.add(built.rootGroup);

    const dragPreview = createDragPreviewSystem();
    dragPreviewRef.current = dragPreview;
    scene.add(dragPreview.group);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.82);
    const dragHitPoint = new THREE.Vector3();
    const dragTargetVec = new THREE.Vector3();

    let pointerDownX = 0;
    let pointerDownY = 0;
    let lastMoveCheck = 0;

    const setPointerFromClient = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    // Quick lookup from componentId -> hitbox Mesh so dynamic child hitboxes snap at exact live world coords
    const hitboxById = new Map<string, THREE.Mesh>();
    built.hitboxes.forEach((hb) => {
      const cid = hb.userData.componentId as string | undefined;
      if (cid) hitboxById.set(cid, hb);
    });

    const pickBestHit = (hits: THREE.Intersection[], preferSpecificAssemble: boolean): string | null => {
      if (hits.length === 0) return null;
      if (preferSpecificAssemble) {
        // First prefer ultra-fine pin/fastener hitboxes over generic parent boxes
        for (const hit of hits) {
          const id = hit.object.userData.componentId as string | undefined;
          if (id && FINE_ASSEMBLE_PRIORITY.has(id)) return id;
        }
        // Next prefer hdd-bay if present
        for (const hit of hits) {
          const id = hit.object.userData.componentId as string | undefined;
          if (id === 'hdd-bay') return id;
        }
      }
      return (hits[0].object.userData.componentId as string | undefined) ?? null;
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (draggingItemRef.current) return;
      const dist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
      if (dist > 6) return;
      setPointerFromClient(e.clientX, e.clientY);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(built.hitboxes, false);
      const compId = pickBestHit(hits, modeRef.current === 'assemble');
      if (!compId) return;
      if (modeRef.current === 'assemble') {
        onSocketClickRef.current(compId);
      } else {
        onSelectRef.current(mapInspectHitboxId(compId));
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (draggingItemRef.current) return;
      const now = performance.now();
      if (now - lastMoveCheck < 50) return;
      lastMoveCheck = now;
      setPointerFromClient(e.clientX, e.clientY);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(built.hitboxes, false);
      const compId = pickBestHit(hits, modeRef.current === 'assemble');
      if (compId) {
        setHoveredId(modeRef.current === 'inspect' ? mapInspectHitboxId(compId) : compId);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredId(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    const _proj = new THREE.Vector3();
    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;
    let isTabHidden = document.hidden;
    let lastPinSync = 0;
    let lastCamSignature = '';
    let lastReportedSnapKey = '';

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 100);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed || isTabHidden) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 8);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 8);
    };

    const tick = () => {
      if (disposed || isTabHidden) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      // 1. WASD + Arrow + Q/E Smooth Camera Rig
      cameraRig.update(delta);

      // 2. Smooth damped camera focus (canceled automatically on manual Orbit/WASD)
      if (camTargetPosRef.current && camTargetLookRef.current) {
        const factor = reducedMotion ? 1 : 1 - Math.exp(-6.5 * delta);
        camera.position.lerp(camTargetPosRef.current, factor);
        controls.target.lerp(camTargetLookRef.current, factor);
        if (
          camera.position.distanceTo(camTargetPosRef.current) < 0.04 &&
          controls.target.distanceTo(camTargetLookRef.current) < 0.04
        ) {
          camera.position.copy(camTargetPosRef.current);
          controls.target.copy(camTargetLookRef.current);
          camTargetPosRef.current = null;
          camTargetLookRef.current = null;
        }
      }

      // 3. 3D Drag-and-Drop Raycast & Precision Snap Ghost Update
      const activeDragId = draggingItemRef.current;
      if (activeDragId && dragClientPosRef.current) {
        dragPreview.setActiveItem(activeDragId);
        setPointerFromClient(dragClientPosRef.current.x, dragClientPosRef.current.y);
        raycaster.setFromCamera(pointer, camera);

        const isPrecisionPinPart =
          activeDragId === 'install-hdd-jumper' || activeDragId.startsWith('wire-');

        let snappedSocket: string | null = null;
        const boxHits = raycaster.intersectObjects(built.hitboxes, false);
        const directHit = pickBestHit(boxHits, true);
        if (directHit) {
          if (directHit === 'ram-slots') {
            snappedSocket = activeDragId === 'install-ram-2' ? 'ram-slot-2' : 'ram-slot-1';
          } else {
            snappedSocket = directHit;
          }
        }

        const planeHit = raycaster.ray.intersectPlane(dragPlane, dragHitPoint);

        // 3D Ray-to-Port Magnetic Snap for Vertical Rear HDD Ports (IDE End-2 & Molex 4-Pin) so dragging never gets stuck!
        if (!snappedSocket && (activeDragId === 'install-hdd-molex' || (activeDragId === 'install-ide-cable' && ideEndsRef.current.board))) {
          const rearCandidate = activeDragId === 'install-hdd-molex' ? 'hdd-molex-port' : 'hdd-ide-port';
          const rearMesh = hitboxById.get(rearCandidate);
          if (rearMesh) {
            rearMesh.getWorldPosition(dragTargetVec);
            if (raycaster.ray.distanceToPoint(dragTargetVec) < 0.78) {
              snappedSocket = rearCandidate;
            }
          }
        }

        // Broad proximity snap for large horizontal board sockets; tiny Jumper/F_PANEL pins require pinpoint aim!
        if (!snappedSocket && !isPrecisionPinPart && planeHit) {
          let closestDist = 1.35;
          for (const [sockId, coords] of Object.entries(BROAD_SOCKET_SNAP_COORDS)) {
            const d = Math.hypot(dragHitPoint.x - coords[0], dragHitPoint.z - coords[2]);
            if (d < closestDist) {
              closestDist = d;
              snappedSocket = sockId;
            }
          }
        }

        dragSnapSocketRef.current = snappedSocket;

        if (snappedSocket && hitboxById.has(snappedSocket)) {
          hitboxById.get(snappedSocket)!.getWorldPosition(dragTargetVec);
          dragTargetVec.y += isPrecisionPinPart ? 0.08 : 0.14;
        } else if (snappedSocket && BROAD_SOCKET_SNAP_COORDS[snappedSocket]) {
          const [sx, sy, sz] = BROAD_SOCKET_SNAP_COORDS[snappedSocket];
          dragTargetVec.set(sx, sy + 0.14, sz);
        } else if (planeHit) {
          dragTargetVec.set(
            THREE.MathUtils.clamp(dragHitPoint.x, -7.5, 8.5),
            isPrecisionPinPart ? 0.62 : 0.95,
            THREE.MathUtils.clamp(dragHitPoint.z, -5.5, 7.5)
          );
        }

        const check = evaluateDragRef.current(activeDragId, snappedSocket, dragRotationRef.current);
        dragPreview.setTint(check.state);
        dragPreview.setTransform(
          dragTargetVec,
          dragRotationRef.current,
          delta,
          isHeldPartAlignedRef.current
        );

        const snapKey = `${snappedSocket ?? 'none'}|${check.state}|${check.reason ?? ''}`;
        if (snapKey !== lastReportedSnapKey) {
          lastReportedSnapKey = snapKey;
          onDragFeedbackRef.current({
            socketId: snappedSocket,
            state: check.state,
            reason: check.reason,
          });
        }
      } else {
        dragPreview.setActiveItem(null);
        dragSnapSocketRef.current = null;
        if (lastReportedSnapKey !== '') {
          lastReportedSnapKey = '';
          onDragFeedbackRef.current({ socketId: null, state: 'free' });
        }
      }

      // 4. Mechanical Assembly Animations + Precision Rotate-Align & Green Lock Flash
      const parts = built.assemblyParts;
      const isAssemble = modeRef.current === 'assemble';
      const done = completedStepsRef.current;

      const leverIsOpen =
        isAssemble && done.has('open-cpu-lever') && !done.has('close-cpu-lever');
      parts.cpuLever.rotation.x = THREE.MathUtils.damp(
        parts.cpuLever.rotation.x,
        leverIsOpen ? -Math.PI * 0.52 : 0,
        8,
        delta
      );
      parts.cpuRetentionPlate.rotation.x = THREE.MathUtils.damp(
        parts.cpuRetentionPlate.rotation.x,
        leverIsOpen ? -Math.PI * 0.44 : 0,
        8,
        delta
      );

      const showCpu = !isAssemble || done.has('install-cpu');
      parts.cpuChip.visible = showCpu;
      parts.cpuChip.position.y = THREE.MathUtils.damp(parts.cpuChip.position.y, showCpu ? 0 : 1.05, 9, delta);
      parts.cpuChip.rotation.y = THREE.MathUtils.damp(parts.cpuChip.rotation.y, 0, 10, delta);

      const showPaste = isAssemble && done.has('apply-thermal-paste') && !done.has('install-heatsink');
      parts.thermalPaste.visible = showPaste;
      parts.thermalPaste.scale.setScalar(
        THREE.MathUtils.damp(parts.thermalPaste.scale.x, showPaste ? 1 : 0.01, 10, delta)
      );

      const showHeatsink = !isAssemble || done.has('install-heatsink');
      parts.cpuHeatsink.visible = showHeatsink;
      parts.cpuHeatsink.position.y = THREE.MathUtils.damp(
        parts.cpuHeatsink.position.y,
        showHeatsink ? 0.29 : 1.9,
        8,
        delta
      );

      // 4 Interactive Heatsink Push-Pins (plunge & rotate 90° individually when clicked!)
      const pinsLocked = heatsinkPinsRef.current;
      const guideId = practiceGuideRef.current;
      const pulseGlow = reducedMotion ? 1.15 : 0.75 + Math.sin(elapsed * 5.2) * 0.55;
      parts.heatsinkPushPins.forEach((pinGroup, idx) => {
        const locked = !isAssemble || Boolean(pinsLocked[idx]);
        pinGroup.position.y = THREE.MathUtils.damp(pinGroup.position.y, locked ? 0.56 : 0.72, 12, delta);
        pinGroup.rotation.y = THREE.MathUtils.damp(pinGroup.rotation.y, locked ? Math.PI / 2 : 0, 12, delta);
        const ringMat = parts.heatsinkPinRingMats[idx];
        if (!isAssemble) {
          ringMat.emissiveIntensity = 0;
        } else if (locked) {
          ringMat.color.setHex(0x10b981);
          ringMat.emissive.setHex(0x10b981);
          ringMat.emissiveIntensity = showHeatsink && !done.has('lock-heatsink-pins') ? 0.9 : 0;
        } else if (showHeatsink && (guideId === `heatsink-pin-${idx}` || guideId?.startsWith('heatsink-pin-'))) {
          ringMat.color.setHex(0x38bdf8);
          ringMat.emissive.setHex(0x38bdf8);
          ringMat.emissiveIntensity = pulseGlow * 1.4;
        } else {
          ringMat.emissiveIntensity = 0;
        }
      });

      // Single-Stick RAM 1 (DIMM 1) + Independent White Clips
      const showRam1 = !isAssemble || done.has('install-ram-1');
      parts.ramStick1.visible = showRam1;
      parts.ramStick1.position.y = THREE.MathUtils.damp(
        parts.ramStick1.position.y,
        showRam1 ? 0.44 : 1.45,
        9,
        delta
      );
      parts.ramStick1.rotation.y = THREE.MathUtils.damp(parts.ramStick1.rotation.y, 0, 10, delta);
      const clip1Angle = showRam1 ? 0 : 0.42;
      parts.ramClips1Left.rotation.z = THREE.MathUtils.damp(parts.ramClips1Left.rotation.z, clip1Angle, 10, delta);
      parts.ramClips1Right.rotation.z = THREE.MathUtils.damp(parts.ramClips1Right.rotation.z, -clip1Angle, 10, delta);

      // Single-Stick RAM 2 (DIMM 2) + Independent White Clips
      const showRam2 = !isAssemble || done.has('install-ram-2');
      parts.ramStick2.visible = showRam2;
      parts.ramStick2.position.y = THREE.MathUtils.damp(
        parts.ramStick2.position.y,
        showRam2 ? 0.44 : 1.45,
        9,
        delta
      );
      parts.ramStick2.rotation.y = THREE.MathUtils.damp(parts.ramStick2.rotation.y, 0, 10, delta);
      const clip2Angle = showRam2 ? 0 : 0.42;
      parts.ramClips2Left.rotation.z = THREE.MathUtils.damp(parts.ramClips2Left.rotation.z, clip2Angle, 10, delta);
      parts.ramClips2Right.rotation.z = THREE.MathUtils.damp(parts.ramClips2Right.rotation.z, -clip2Angle, 10, delta);

      // Emerald Alignment Lock Glow Flash decay
      if (lockFlashRef.current.cpu > 0) {
        lockFlashRef.current.cpu = Math.max(0, lockFlashRef.current.cpu - delta);
        const t = lockFlashRef.current.cpu / 1.25;
        parts.cpuAlignGlowMat.emissiveIntensity = t * 3.4;
      } else {
        parts.cpuAlignGlowMat.emissiveIntensity = 0;
      }
      if (lockFlashRef.current.ram1 > 0) {
        lockFlashRef.current.ram1 = Math.max(0, lockFlashRef.current.ram1 - delta);
        const t = lockFlashRef.current.ram1 / 1.25;
        parts.ram1AlignGlowMat.emissiveIntensity = t * 3.6;
      } else {
        parts.ram1AlignGlowMat.emissiveIntensity = 0;
      }
      if (lockFlashRef.current.ram2 > 0) {
        lockFlashRef.current.ram2 = Math.max(0, lockFlashRef.current.ram2 - delta);
        const t = lockFlashRef.current.ram2 / 1.25;
        parts.ram2AlignGlowMat.emissiveIntensity = t * 3.6;
      } else {
        parts.ram2AlignGlowMat.emissiveIntensity = 0;
      }

      const showCmos = !isAssemble || done.has('install-cmos');
      parts.cmosCoin.visible = showCmos;
      parts.cmosCoin.position.y = THREE.MathUtils.damp(parts.cmosCoin.position.y, showCmos ? 0.135 : 0.75, 9, delta);

      const showVga = !isAssemble || done.has('install-vga');
      parts.vgaCard.visible = showVga;
      parts.vgaCard.position.y = THREE.MathUtils.damp(parts.vgaCard.position.y, showVga ? 0.42 : 1.85, 8, delta);
      parts.pcie16Latch.rotation.x = THREE.MathUtils.damp(parts.pcie16Latch.rotation.x, showVga ? 0 : 0.46, 10, delta);

      // Clickable VGA Bracket Thumbscrew (descends & spins down when tightened!)
      const screwTight = !isAssemble || vgaScrewRef.current;
      parts.vgaBracketScrew.visible = showVga;
      parts.vgaBracketScrew.position.y = THREE.MathUtils.damp(
        parts.vgaBracketScrew.position.y,
        screwTight ? 1.01 : 1.22,
        11,
        delta
      );
      parts.vgaBracketScrew.rotation.y = THREE.MathUtils.damp(
        parts.vgaBracketScrew.rotation.y,
        screwTight ? Math.PI * 2 : 0,
        10,
        delta
      );
      parts.vgaScrewGlowMat.emissiveIntensity =
        isAssemble && showVga && !screwTight && guideId === 'vga-screw' ? pulseGlow * 1.6 : 0;

      // Authentic 3.5" IDE Harddisk Choreography (Roomier z=6.25) + 2-Pin Jumper + 2-End IDE + 4-Wire Molex
      const hddSeated = !isAssemble || done.has('install-hdd-unit');
      parts.hddUnitGroup.position.y = THREE.MathUtils.damp(parts.hddUnitGroup.position.y, hddSeated ? 0.06 : 0.46, 8, delta);
      parts.hddUnitGroup.position.z = THREE.MathUtils.damp(parts.hddUnitGroup.position.z, hddSeated ? 6.25 : 6.62, 8, delta);
      parts.hddUnitGroup.rotation.x = THREE.MathUtils.damp(parts.hddUnitGroup.rotation.x, hddSeated ? 0 : 0.28, 8, delta);

      const activeJumperCol = isAssemble ? hddJumperColRef.current : 'master';
      parts.hddJumperCap.visible = activeJumperCol !== null;
      if (activeJumperCol) {
        const jumperX = activeJumperCol === 'master' ? 0.14 : activeJumperCol === 'slave' ? 0.28 : 0.42;
        parts.hddJumperCap.position.x = THREE.MathUtils.damp(parts.hddJumperCap.position.x, jumperX, 14, delta);
      }

      // Per-column & rear-port emissive glow accents
      (['master', 'slave', 'cs'] as HddJumperMode[]).forEach((colKey) => {
        const isTarget = isAssemble && guideId === `hdd-jumper-${colKey}`;
        parts.hddJumperColMats[colKey].emissiveIntensity = isTarget ? pulseGlow * 1.5 : 0;
      });
      parts.hddRearPortMats.ide.emissiveIntensity =
        isAssemble && guideId === 'hdd-ide-port' ? pulseGlow * 1.4 : 0;
      parts.hddRearPortMats.molex.emissiveIntensity =
        isAssemble && guideId === 'hdd-molex-port' ? pulseGlow * 1.3 : 0;

      // 2-End IDE Data Cable Visibility (Partial = Board #12 only; Complete = Board #12 <-> HDD Rear IDE)
      const ideState = ideEndsRef.current;
      const ideComplete = !isAssemble || (ideState.board && ideState.hdd);
      const idePartial = isAssemble && ideState.board && !ideState.hdd;
      parts.ideRibbonCable.visible = ideComplete;
      parts.ideRibbonPartial.visible = idePartial;

      parts.hddMolexCable.visible = !isAssemble || done.has('install-hdd-molex');

      // Split ATX 24-Pin Mainboard + ATX 4-Pin CPU 12V Power Bundles
      parts.atx24CableBundle.visible = !isAssemble || done.has('install-atx-24pin');
      parts.atx4CableBundle.visible = !isAssemble || done.has('install-atx-4pin');
      parts.atx4PinGlowMat.emissiveIntensity =
        isAssemble && guideId === 'atx-4pin' ? pulseGlow * 1.25 : 0;

      // 6-Zone F_PANEL Emissive Pin-Block Highlight + Dangling Loose Wires vs Dynamically Routed Connected Wires
      for (const zoneId of FPANEL_ALL_ZONES) {
        const isTargetZone = isAssemble && guideId === zoneId;
        parts.fPanelZoneMats[zoneId].emissiveIntensity = isTargetZone ? pulseGlow * 1.2 : 0;
      }

      const wiringMap = fPanelWiringRef.current;
      const allWireIds: CPanelWireId[] = ['hdd-led', 'p-led-pos', 'p-led-neg', 'reset-sw', 'power-sw'];
      for (const wireKey of allWireIds) {
        const connectedGroup = parts.cpanelWiresById[wireKey];
        const looseGroup = parts.cpanelLooseWiresById[wireKey];
        if (!isAssemble) {
          parts.routeCPanelWireToZone(wireKey, FPANEL_CORRECT_ZONE_BY_WIRE[wireKey]);
          connectedGroup.visible = true;
          connectedGroup.position.y = 0;
          looseGroup.visible = false;
        } else {
          const assignment = wiringMap[wireKey];
          if (assignment) {
            parts.routeCPanelWireToZone(wireKey, assignment.zoneId);
            connectedGroup.visible = true;
            connectedGroup.position.y = THREE.MathUtils.damp(connectedGroup.position.y, 0, 11, delta);
            looseGroup.visible = false;
          } else {
            connectedGroup.visible = false;
            connectedGroup.position.y = 0.48;
            looseGroup.visible = true;
          }
        }
      }

      if (isPoweredOnRef.current && showHeatsink && !reducedMotion) {
        parts.cpuFanRotor.rotation.y -= delta * 18;
      }

      // Authentic LED Polarity & Pin-Zone Behavior on Power-On!
      const pLedPosOk =
        wiringMap['p-led-pos']?.zoneId === 'fpanel-green-2' && wiringMap['p-led-pos']?.polarityValid;
      const pLedNegOk =
        wiringMap['p-led-neg']?.zoneId === 'fpanel-green-4' && wiringMap['p-led-neg']?.polarityValid;
      const hddLedOk =
        wiringMap['hdd-led']?.zoneId === 'fpanel-orange-13' && wiringMap['hdd-led']?.polarityValid;

      const pwrLedActive = isPoweredOnRef.current && (!isAssemble || (pLedPosOk && pLedNegOk));
      const hddLedActive = isPoweredOnRef.current && (!isAssemble || hddLedOk);
      parts.powerLedMat.emissiveIntensity = pwrLedActive ? 2.5 : 0.16;
      parts.hddLedMat.emissiveIntensity = hddLedActive
        ? 0.9 + Math.sin(elapsed * 14) * 0.75
        : 0.14;

      // Adaptive Pulsing Cyan Guide Rings across ALL 22 Practice Steps (hidden in Exam & Free Roam!)
      const pulseScaleFactor = reducedMotion ? 1 : 1 + Math.sin(elapsed * 4.8) * 0.13;
      let guideAnchorValid = false;
      const guideAnchorPos = dragTargetVec; // reuse scratch Vector3 cleanly when not dragging

      if (isAssemble && guideId) {
        if (guideId.startsWith('heatsink-pin-')) {
          // Simultaneous mini pulsing ring around EVERY unlocked Heatsink push-pin!
          built.targetGuideRing.visible = false;
          let firstUnlockedAssigned = false;
          for (let pIdx = 0; pIdx < 4; pIdx++) {
            const secRing = built.secondaryGuideRings[pIdx];
            const unlocked = !heatsinkPinsRef.current[pIdx];
            const pinHb = hitboxById.get(`heatsink-pin-${pIdx}`);
            if (secRing && unlocked && pinHb) {
              pinHb.getWorldPosition(_proj);
              secRing.visible = true;
              secRing.position.set(_proj.x, _proj.y + 0.14, _proj.z);
              secRing.scale.setScalar(pulseScaleFactor);
              if (!reducedMotion) secRing.rotation.z = elapsed * 1.4;
              if (!firstUnlockedAssigned) {
                guideAnchorPos.set(_proj.x, _proj.y + 0.56, _proj.z);
                guideAnchorValid = true;
                firstUnlockedAssigned = true;
              }
            } else if (secRing) {
              secRing.visible = false;
            }
          }
        } else {
          for (const secRing of built.secondaryGuideRings) secRing.visible = false;
          const profile = getAdaptiveRingProfile(guideId);
          let hasPos = false;
          const hb = hitboxById.get(guideId);
          if (hb) {
            hb.getWorldPosition(_proj);
            hasPos = true;
          } else if (BROAD_SOCKET_SNAP_COORDS[guideId]) {
            const [gx, gy, gz] = BROAD_SOCKET_SNAP_COORDS[guideId];
            _proj.set(gx, gy, gz);
            hasPos = true;
          }

          if (hasPos) {
            built.targetGuideRing.visible = true;
            built.targetGuideRing.position.set(
              _proj.x,
              _proj.y + profile.yOffset,
              _proj.z + profile.zOffset
            );
            built.targetGuideRing.rotation.set(
              profile.vertical ? 0 : -Math.PI / 2,
              0,
              reducedMotion ? 0 : elapsed * 1.15
            );
            built.targetGuideRing.scale.setScalar(profile.scale * pulseScaleFactor);

            guideAnchorPos.set(
              _proj.x,
              _proj.y + profile.yOffset + profile.labelYOffset,
              _proj.z + profile.zOffset
            );
            guideAnchorValid = true;
          } else {
            built.targetGuideRing.visible = false;
          }
        }
      } else {
        built.targetGuideRing.visible = false;
        for (const secRing of built.secondaryGuideRings) secRing.visible = false;
      }

      built.dataFlow.group.visible = showDataFlowRef.current;
      if (showDataFlowRef.current && !reducedMotion) {
        built.dataFlow.update(elapsed);
      }
      if (built.highlightRing.visible && !reducedMotion) {
        built.highlightRing.rotation.z = elapsed * 0.9;
      }

      controls.update();
      renderer.render(scene, camera);

      const now = performance.now();
      const syncInterval = renderProfileRef.current?.pinSyncIntervalMs ?? 45;
      if (forcePinSyncRef.current || now - lastPinSync > syncInterval) {
        lastPinSync = now;
        const w = host.clientWidth;
        const h = host.clientHeight;

        if (showPinsRef.current && modeRef.current === 'inspect') {
          const camSig = `${w}x${h}|${camera.position.x.toFixed(3)},${camera.position.y.toFixed(3)},${camera.position.z.toFixed(3)}|${controls.target.x.toFixed(3)},${controls.target.y.toFixed(3)},${controls.target.z.toFixed(3)}`;
          if (forcePinSyncRef.current || camSig !== lastCamSignature) {
            lastCamSignature = camSig;
            forcePinSyncRef.current = false;
            const pinMap = pinBtnRefs.current;
            for (let i = 0; i < MAINBOARD_COMPONENTS.length; i++) {
              const comp = MAINBOARD_COMPONENTS[i];
              const btn = pinMap.get(comp.id);
              if (!btn) continue;
              _proj.set(comp.position[0], comp.position[1] + 0.36, comp.position[2]);
              _proj.project(camera);
              const visible =
                _proj.z < 1 && _proj.x >= -1.05 && _proj.x <= 1.05 && _proj.y >= -1.05 && _proj.y <= 1.05;
              if (!visible) {
                if (btn.style.display !== 'none') btn.style.display = 'none';
              } else {
                const px = ((_proj.x + 1) / 2) * w;
                const py = (-(_proj.y - 1) / 2) * h;
                if (btn.style.display === 'none') btn.style.display = 'flex';
                btn.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) translate(-50%, -50%)`;
              }
            }
          }
        }

        // Practice Mode Floating Mini Arrow & Target Label Projection
        const activeLabel = practiceGuideLabelRef.current;
        if (isAssemble && guideAnchorValid && activeLabel && !draggingItemRef.current) {
          _proj.copy(guideAnchorPos).project(camera);
          const inBounds = _proj.z < 1 && _proj.x >= -0.96 && _proj.x <= 0.96 && _proj.y >= -0.82 && _proj.y <= 0.92;
          const nextX = ((_proj.x + 1) / 2) * w;
          const nextY = (-(_proj.y - 1) / 2) * h;
          setGuideBadge((prev) => {
            if (
              prev.visible === inBounds &&
              prev.label === activeLabel &&
              Math.abs(prev.x - nextX) < 1.5 &&
              Math.abs(prev.y - nextY) < 1.5
            ) {
              return prev;
            }
            return { x: nextX, y: nextY, visible: inBounds, label: activeLabel };
          });
        } else {
          setGuideBadge((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        }
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    const handleVisibilityChange = () => {
      if (disposed) return;
      isTabHidden = document.hidden;
      if (isTabHidden) {
        window.cancelAnimationFrame(frameId);
        window.clearTimeout(frameId);
        frameId = 0;
      } else {
        clock.getDelta();
        forcePinSyncRef.current = true;
        if (!frameId) {
          tick();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const resizeObserver = new ResizeObserver(() => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      forcePinSyncRef.current = true;
    });
    resizeObserver.observe(host);

    if (!isTabHidden) {
      tick();
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      resizeObserver.disconnect();
      cameraRig.dispose();
      controls.removeEventListener('start', cancelCameraAutoFocus);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);

      if (glbHandleRef.current) {
        scene.remove(glbHandleRef.current.model);
        glbHandleRef.current.dispose();
        glbHandleRef.current = null;
      }
      dragPreview.dispose();
      built.dispose();
      controls.dispose();
      envRT.dispose();
      renderer.dispose();
      rendererRef.current = null;
      keyLightRef.current = null;
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [reducedMotion]);

  // Live Graphics Quality Toggle without recreating WebGL context or resetting assembly state
  useEffect(() => {
    const renderer = rendererRef.current;
    const keyLight = keyLightRef.current;
    if (!renderer || !keyLight) return;

    const nextProfile = resolveRenderProfile(graphicsQuality, isSoftwareGlRef.current);
    renderProfileRef.current = nextProfile;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, nextProfile.maxDpr));
    renderer.shadowMap.enabled = nextProfile.shadowsEnabled;
    keyLight.castShadow = nextProfile.shadowsEnabled;

    if (
      keyLight.shadow.mapSize.width !== nextProfile.shadowMapSize ||
      keyLight.shadow.mapSize.height !== nextProfile.shadowMapSize
    ) {
      keyLight.shadow.mapSize.set(nextProfile.shadowMapSize, nextProfile.shadowMapSize);
      if (keyLight.shadow.map) {
        keyLight.shadow.map.dispose();
        keyLight.shadow.map = null;
      }
    }
    renderer.shadowMap.needsUpdate = true;
    forcePinSyncRef.current = true;
  }, [graphicsQuality]);

  // Re-project static pin overlay buttons immediately when toggling pins or returning to Inspect mode
  useEffect(() => {
    if (showPins && mode === 'inspect') {
      forcePinSyncRef.current = true;
    }
  }, [showPins, mode]);

  // Window pointer tracking & OrbitControls lock while dragging a 3D component
  useEffect(() => {
    const controls = controlsRef.current;
    if (!draggingItemId) {
      dragClientPosRef.current = null;
      if (controls) controls.enabled = true;
      return;
    }

    if (controls) controls.enabled = false;
    dragClientPosRef.current = dragInitialClientPos;

    const onWindowMove = (e: PointerEvent) => {
      dragClientPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onWindowUp = (e: PointerEvent) => {
      const isOverDock = e.clientY > window.innerHeight - 195;
      const targetSocket = dragSnapSocketRef.current;
      dragClientPosRef.current = null;
      if (controls) controls.enabled = true;

      if (!isOverDock && targetSocket) {
        onDropRef.current(draggingItemId, targetSocket, dragRotationRef.current);
      } else {
        onCancelDragRef.current();
      }
    };

    window.addEventListener('pointermove', onWindowMove);
    window.addEventListener('pointerup', onWindowUp);
    window.addEventListener('pointercancel', onWindowUp);

    return () => {
      window.removeEventListener('pointermove', onWindowMove);
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('pointercancel', onWindowUp);
      if (controls) controls.enabled = true;
    };
  }, [draggingItemId, dragInitialClientPos]);

  useEffect(() => {
    const built = builtRef.current;
    const controls = controlsRef.current;
    if (!built || !controls) return;
    built.workbenchMesh.visible = !inspection360;
    controls.maxPolarAngle = inspection360 ? Math.PI : Math.PI * 0.48;
  }, [inspection360]);

  useEffect(() => {
    const built = builtRef.current;
    if (!built) return;
    if (!selectedComponentId || mode !== 'inspect') {
      built.highlightRing.visible = false;
      return;
    }
    const comp = MAINBOARD_COMPONENTS.find((c) => c.id === selectedComponentId);
    if (!comp) return;

    built.highlightRing.visible = true;
    built.highlightRing.position.set(comp.position[0], comp.position[1] + 0.14, comp.position[2]);
    camTargetLookRef.current = new THREE.Vector3(comp.position[0], comp.position[1], comp.position[2]);
    camTargetPosRef.current = new THREE.Vector3(
      comp.cameraOffset[0],
      comp.cameraOffset[1],
      comp.cameraOffset[2]
    );
  }, [selectedComponentId, mode]);

  // Dedicated Camera Presets for Auto-Focus (IDE 2-Ends, Molex, Jumper, F_PANEL, Fasteners) & "Fokus Target" Button
  useEffect(() => {
    if (mode !== 'assemble' || !assembleFocusTarget) return;
    if (assembleFocusTarget === 'cpu-socket') {
      camTargetLookRef.current = new THREE.Vector3(2.1, 0.3, -1.6);
      camTargetPosRef.current = new THREE.Vector3(4.3, 4.9, 2.2);
    } else if (assembleFocusTarget === 'heatsink-pins') {
      camTargetLookRef.current = new THREE.Vector3(2.1, 0.85, -1.6);
      camTargetPosRef.current = new THREE.Vector3(3.6, 4.7, 1.8);
    } else if (assembleFocusTarget === 'ram-slots') {
      camTargetLookRef.current = new THREE.Vector3(1.9, 0.45, 1.65);
      camTargetPosRef.current = new THREE.Vector3(4.6, 4.8, 5.8);
    } else if (assembleFocusTarget === 'cmos-battery') {
      camTargetLookRef.current = new THREE.Vector3(-1.4, 0.3, 2.35);
      camTargetPosRef.current = new THREE.Vector3(-0.2, 4.2, 6.2);
    } else if (assembleFocusTarget === 'pcie-x16') {
      camTargetLookRef.current = new THREE.Vector3(-1.5, 0.5, -1.68);
      camTargetPosRef.current = new THREE.Vector3(-3.8, 4.6, 2.4);
    } else if (assembleFocusTarget === 'vga-screw') {
      camTargetLookRef.current = new THREE.Vector3(-1.6, 1.35, -3.1);
      camTargetPosRef.current = new THREE.Vector3(-3.3, 3.2, -1.1);
    } else if (assembleFocusTarget === 'hdd-jumper') {
      camTargetLookRef.current = new THREE.Vector3(-1.07, 0.62, 5.58);
      camTargetPosRef.current = new THREE.Vector3(-0.92, 2.25, 2.85);
    } else if (assembleFocusTarget === 'hdd-bay') {
      camTargetLookRef.current = new THREE.Vector3(-1.35, 0.3, 6.25);
      camTargetPosRef.current = new THREE.Vector3(1.4, 5.1, 10.6);
    } else if (assembleFocusTarget === 'ide-board') {
      camTargetLookRef.current = new THREE.Vector3(-0.85, 0.36, 3.45);
      camTargetPosRef.current = new THREE.Vector3(0.4, 4.5, 7.6);
    } else if (assembleFocusTarget === 'hdd-ide-port') {
      // Crystal-clear view directly into the 40-pin IDE rear socket on the HDD (above bottom dock!)
      camTargetLookRef.current = new THREE.Vector3(-1.93, 0.28, 5.32);
      camTargetPosRef.current = new THREE.Vector3(-1.7, 2.35, 2.25);
    } else if (assembleFocusTarget === 'hdd-molex-port') {
      // Dedicated unobstructed view straight into the white 4-Pin Molex port on rear right of HDD!
      camTargetLookRef.current = new THREE.Vector3(-0.39, 0.28, 5.32);
      camTargetPosRef.current = new THREE.Vector3(0.15, 2.35, 2.25);
    } else if (assembleFocusTarget === 'f-panel-header') {
      camTargetLookRef.current = new THREE.Vector3(4.15, 0.34, 3.18);
      camTargetPosRef.current = new THREE.Vector3(4.45, 2.65, 5.45);
    } else if (assembleFocusTarget === 'atx-24pin') {
      camTargetLookRef.current = new THREE.Vector3(1.55, 0.42, 3.45);
      camTargetPosRef.current = new THREE.Vector3(2.8, 4.4, 7.5);
    } else if (assembleFocusTarget === 'atx-4pin') {
      camTargetLookRef.current = new THREE.Vector3(4.1, 0.45, -2.5);
      camTargetPosRef.current = new THREE.Vector3(5.6, 3.6, 0.3);
    }
  }, [assembleFocusTarget, zoomPinNonce, mode]);

  useEffect(() => {
    if (cameraResetNonce === 0) return;
    camTargetPosRef.current = DEFAULT_CAM_POS.clone();
    camTargetLookRef.current = DEFAULT_CAM_TARGET.clone();
  }, [cameraResetNonce]);

  useEffect(() => {
    const scene = sceneRef.current;
    const built = builtRef.current;
    if (!scene || !built) return;

    const cleanupExistingGlb = () => {
      if (glbHandleRef.current) {
        scene.remove(glbHandleRef.current.model);
        glbHandleRef.current.dispose();
        glbHandleRef.current = null;
      }
    };

    if (modelSource === 'procedural') {
      cleanupExistingGlb();
      built.boardGroup.visible = true;
      setGlbLoading(false);
      return;
    }

    const url = modelSource === 'local-glb' ? localGlbUrl : '/models/motherboard.glb';
    if (!url) {
      cleanupExistingGlb();
      built.boardGroup.visible = true;
      return;
    }

    let cancelled = false;
    setGlbLoading(true);

    loadOptionalGlbModel(url)
      .then((handle) => {
        if (cancelled) {
          handle.dispose();
          return;
        }
        cleanupExistingGlb();
        glbHandleRef.current = handle;
        built.boardGroup.visible = false;
        scene.add(handle.model);
        setGlbLoading(false);
        onGlbLoadedRef.current(
          modelSource === 'local-glb'
            ? 'Model .GLB lokal berhasil dimuat'
            : 'public/models/motherboard.glb aktif'
        );
      })
      .catch(() => {
        if (cancelled) return;
        setGlbLoading(false);
        cleanupExistingGlb();
        built.boardGroup.visible = true;
        onFallbackRef.current(
          modelSource === 'public-glb'
            ? 'File public/models/motherboard.glb belum tersedia. Otomatis kembali ke Procedural PBR Studio.'
            : 'File .glb lokal tidak dapat dibaca. Otomatis kembali ke Procedural PBR Studio.'
        );
      });

    return () => {
      cancelled = true;
    };
  }, [modelSource, localGlbUrl]);

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-[#0B0E14] select-none ${
        draggingItemId ? 'cursor-grabbing' : ''
      }`}
    >
      <div ref={hostRef} className="h-full w-full" />

      {glbLoading && (
        <div className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 rounded-lg bg-[#141923] px-4 py-2 text-xs font-medium text-[#06B6D4] border border-[#06B6D4]/30">
          Memuat aset 3D .GLB...
        </div>
      )}

      {showPins && mode === 'inspect' && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {MAINBOARD_COMPONENTS.map((comp) => {
            const isSelected = selectedComponentId === comp.id;
            const isHovered = hoveredId === comp.id;
            const isBackPanel = comp.category === 'back-panel';
            const isCPanel = comp.category === 'c-panel';
            return (
              <button
                key={comp.id}
                ref={(el) => {
                  if (el) {
                    pinBtnRefs.current.set(comp.id, el);
                  } else {
                    pinBtnRefs.current.delete(comp.id);
                  }
                }}
                type="button"
                onClick={() => onSelectComponent(comp.id)}
                title={`${comp.pinNumber} — ${comp.shortName}`}
                style={{ display: 'none' }}
                className={`pointer-events-auto absolute top-0 left-0 items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold transition-colors will-change-transform ${
                  isSelected
                    ? 'z-30 bg-[#06B6D4] text-[#0B0E14] border border-[#67E8F9]'
                    : isHovered
                      ? 'z-20 bg-[#1B2230] text-[#F3F4F6] border border-[#06B6D4]'
                      : isCPanel
                        ? 'z-10 bg-[#1B2230]/95 text-[#10B981] border border-[#10B981]/50 hover:border-[#06B6D4]'
                        : isBackPanel
                          ? 'z-10 bg-[#141923]/95 text-[#F59E0B] border border-[#F59E0B]/40 hover:border-[#06B6D4]'
                          : 'z-10 bg-[#141923]/95 text-[#F3F4F6] border border-white/20 hover:border-[#06B6D4]'
                }`}
              >
                <span>{comp.pinNumber}</span>
                {(isSelected || isHovered || isCPanel) && (
                  <span className="max-w-[110px] truncate font-sans text-[10px] font-medium">
                    {comp.shortName}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {/* Mode 2 Practice Mode Only: Projected Mini Floating Arrow & Target Label */}
      {mode === 'assemble' && guideBadge.visible && !draggingItemId && (
        <div
          style={{
            transform: `translate(${guideBadge.x}px, ${guideBadge.y}px) translate(-50%, -100%)`,
          }}
          className="pointer-events-none absolute top-0 left-0 z-20 flex flex-col items-center"
        >
          <div className="whitespace-nowrap rounded-md border border-[#38BDF8]/80 bg-[#040B1A]/94 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#E0F2FE] shadow-lg">
            {guideBadge.label}
          </div>
          <div className="h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-[#38BDF8]" />
        </div>
      )}
    </div>
  );
}
