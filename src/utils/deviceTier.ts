export type GraphicsQualityMode = 'auto' | 'low' | 'ultra';
export type DevicePerformanceTier = 'low' | 'medium' | 'high';

export interface ResolvedRenderProfile {
  mode: GraphicsQualityMode;
  effectiveTier: DevicePerformanceTier;
  isMobileViewport: boolean;
  maxDpr: number;
  antialias: boolean;
  precision: 'mediump' | 'highp';
  targetFps: 30 | 60;
  enableBumpMaps: boolean;
  shadowsEnabled: boolean;
  shadowMapSize: 512 | 1024 | 2048;
  anisotropyCap: number;
  pinSyncIntervalMs: number;
  textureScale: 0.5 | 0.75 | 1;
  label: string;
}

const QUALITY_STORAGE_KEY = 'rigbench_graphics_quality_v1';

const ENTRY_GPU_PATTERN =
  /Mali-G5[127]|Mali-G31|Mali-T|PowerVR|IMG|Adreno \(TM\) [345]\d\d|Adreno \(TM\) 61[0-9]|SwiftShader|llvmpipe|softpipe/i;

const SOFTWARE_GL_PATTERN = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i;

export interface DetectedDeviceTier {
  tier: DevicePerformanceTier;
  isMobileViewport: boolean;
  isLowEndMobile: boolean;
  isSoftwareGl: boolean;
}

let cachedTierResult: DetectedDeviceTier | null = null;

export function isTouchPrimaryDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const hasTouch = (navigator.maxTouchPoints ?? 0) > 0;
  return coarse || (hasTouch && window.innerWidth < 1024);
}

export function loadGraphicsQualityMode(): GraphicsQualityMode {
  if (typeof window === 'undefined') return 'auto';
  try {
    const raw = window.localStorage.getItem(QUALITY_STORAGE_KEY);
    if (raw === 'low' || raw === 'ultra' || raw === 'auto') {
      return raw;
    }
  } catch {
    // Ignore storage read errors in private browsing
  }
  return 'auto';
}

export function saveGraphicsQualityMode(mode: GraphicsQualityMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(QUALITY_STORAGE_KEY, mode);
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Probes GPU renderer string and hardware hints (cached once per session)
 * to classify devices such as Infinix Hot/Smart/Note budget Android phones
 * without degrading 3D model geometry.
 */
export function detectDeviceTier(): DetectedDeviceTier {
  if (typeof window === 'undefined') {
    return { tier: 'high', isMobileViewport: false, isLowEndMobile: false, isSoftwareGl: false };
  }

  if (cachedTierResult) {
    const isCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const isMobileViewport = window.innerWidth < 768 || isCoarsePointer;
    return {
      ...cachedTierResult,
      isMobileViewport,
      isLowEndMobile: cachedTierResult.tier === 'low' && isMobileViewport,
    };
  }

  const isCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const isMobileViewport = window.innerWidth < 768 || isCoarsePointer;
  const cores = navigator.hardwareConcurrency ?? 8;
  const deviceMem =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;

  let gpuName = '';
  let webglAvailable = false;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      (canvas.getContext('webgl') as WebGLRenderingContext | null);
    if (gl) {
      webglAvailable = true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      gpuName = String(gl.getParameter(param) ?? '');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch {
    gpuName = '';
  }

  const isSoftwareGl = !webglAvailable || SOFTWARE_GL_PATTERN.test(gpuName);
  const isEntryGpu = ENTRY_GPU_PATTERN.test(gpuName);
  const isMemoryConstrained = deviceMem <= 4;
  const isCoreConstrained = cores <= 4;

  let tier: DevicePerformanceTier = 'high';
  if (isEntryGpu || (isMobileViewport && (isMemoryConstrained || isCoreConstrained))) {
    tier = 'low';
  } else if (isMobileViewport || deviceMem <= 6 || cores <= 6) {
    tier = 'medium';
  }

  cachedTierResult = {
    tier,
    isMobileViewport,
    isLowEndMobile: tier === 'low' && isMobileViewport,
    isSoftwareGl,
  };
  return cachedTierResult;
}

export function isSoftwareWebGLCached(): boolean {
  return detectDeviceTier().isSoftwareGl;
}

/**
 * Applies a lightweight CSS root class on low-tier entry GPUs so glass cards
 * and bars swap expensive backdrop-filter blur for crisp opaque sapphire gradients.
 */
export function applyDeviceTierDomClass(): void {
  if (typeof document === 'undefined') return;
  const { tier } = detectDeviceTier();
  document.documentElement.classList.toggle('gpu-low-tier', tier === 'low');
}

export function resolveRenderProfile(
  mode: GraphicsQualityMode,
  isSoftwareGl: boolean
): ResolvedRenderProfile {
  const { tier: detectedTier, isMobileViewport } = detectDeviceTier();

  if (isSoftwareGl) {
    return {
      mode,
      effectiveTier: 'low',
      isMobileViewport,
      maxDpr: 1,
      antialias: false,
      precision: 'mediump',
      targetFps: 30,
      enableBumpMaps: false,
      shadowsEnabled: false,
      shadowMapSize: 512,
      anisotropyCap: 2,
      pinSyncIntervalMs: 85,
      textureScale: 0.5,
      label: 'Hemat (SW)',
    };
  }

  const effectiveTier: DevicePerformanceTier =
    mode === 'low' ? 'low' : mode === 'ultra' ? 'high' : detectedTier;

  if (effectiveTier === 'low') {
    return {
      mode,
      effectiveTier,
      isMobileViewport,
      maxDpr: isMobileViewport ? 1 : 1.2,
      antialias: false,
      precision: 'mediump',
      targetFps: isMobileViewport ? 30 : 60,
      enableBumpMaps: false,
      shadowsEnabled: false,
      shadowMapSize: 512,
      anisotropyCap: 2,
      pinSyncIntervalMs: 60,
      textureScale: 0.5,
      label: mode === 'auto' ? 'Auto · Hemat' : 'Hemat',
    };
  }

  if (effectiveTier === 'medium') {
    return {
      mode,
      effectiveTier,
      isMobileViewport,
      maxDpr: 1.4,
      antialias: true,
      precision: 'highp',
      targetFps: 60,
      enableBumpMaps: true,
      shadowsEnabled: true,
      shadowMapSize: 512,
      anisotropyCap: 4,
      pinSyncIntervalMs: 45,
      textureScale: 0.75,
      label: mode === 'auto' ? 'Auto · Seimbang' : 'Seimbang',
    };
  }

  return {
    mode,
    effectiveTier,
    isMobileViewport,
    maxDpr: isMobileViewport ? 1.65 : 2,
    antialias: true,
    precision: 'highp',
    targetFps: 60,
    enableBumpMaps: true,
    shadowsEnabled: true,
    shadowMapSize: isMobileViewport ? 1024 : 2048,
    anisotropyCap: 8,
    pinSyncIntervalMs: 32,
    textureScale: 1,
    label: mode === 'auto' ? 'Auto · Ultra' : 'Ultra',
  };
}
