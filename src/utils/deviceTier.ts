export type GraphicsQualityMode = 'auto' | 'low' | 'ultra';
export type DevicePerformanceTier = 'low' | 'medium' | 'high';

export interface ResolvedRenderProfile {
  mode: GraphicsQualityMode;
  effectiveTier: DevicePerformanceTier;
  isMobileViewport: boolean;
  maxDpr: number;
  antialias: boolean;
  shadowsEnabled: boolean;
  shadowMapSize: 512 | 1024 | 2048;
  anisotropyCap: number;
  pinSyncIntervalMs: number;
  label: string;
}

const QUALITY_STORAGE_KEY = 'rigbench_graphics_quality_v1';

const ENTRY_GPU_PATTERN =
  /Mali-G5[127]|Mali-G31|Mali-T|PowerVR|IMG|Adreno \(TM\) [345]\d\d|Adreno \(TM\) 61[0-9]|SwiftShader|llvmpipe|softpipe/i;

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
 * Probes GPU renderer string and hardware hints to classify devices such as
 * Infinix Hot/Smart/Note budget Android phones without degrading 3D model geometry.
 */
export function detectDeviceTier(): {
  tier: DevicePerformanceTier;
  isMobileViewport: boolean;
  isLowEndMobile: boolean;
} {
  if (typeof window === 'undefined') {
    return { tier: 'high', isMobileViewport: false, isLowEndMobile: false };
  }

  const isCoarsePointer =
    window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const isMobileViewport = window.innerWidth < 768 || isCoarsePointer;
  const cores = navigator.hardwareConcurrency ?? 8;
  const deviceMem =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;

  let gpuName = '';
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      (canvas.getContext('webgl') as WebGLRenderingContext | null);
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      gpuName = String(gl.getParameter(param) ?? '');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch {
    gpuName = '';
  }

  const isEntryGpu = ENTRY_GPU_PATTERN.test(gpuName);
  const isMemoryConstrained = deviceMem <= 4;
  const isCoreConstrained = cores <= 4;

  if (isEntryGpu || (isMobileViewport && (isMemoryConstrained || isCoreConstrained))) {
    return { tier: 'low', isMobileViewport, isLowEndMobile: isMobileViewport };
  }
  if (isMobileViewport || deviceMem <= 6 || cores <= 6) {
    return { tier: 'medium', isMobileViewport, isLowEndMobile: false };
  }
  return { tier: 'high', isMobileViewport, isLowEndMobile: false };
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
      shadowsEnabled: false,
      shadowMapSize: 512,
      anisotropyCap: 2,
      pinSyncIntervalMs: 85,
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
      maxDpr: isMobileViewport ? 1.15 : 1.25,
      antialias: false,
      shadowsEnabled: false,
      shadowMapSize: 512,
      anisotropyCap: 2,
      pinSyncIntervalMs: 55,
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
      shadowsEnabled: true,
      shadowMapSize: 512,
      anisotropyCap: 4,
      pinSyncIntervalMs: 45,
      label: mode === 'auto' ? 'Auto · Seimbang' : 'Seimbang',
    };
  }

  return {
    mode,
    effectiveTier,
    isMobileViewport,
    maxDpr: isMobileViewport ? 1.65 : 2,
    antialias: true,
    shadowsEnabled: true,
    shadowMapSize: isMobileViewport ? 1024 : 2048,
    anisotropyCap: 8,
    pinSyncIntervalMs: 32,
    label: mode === 'auto' ? 'Auto · Ultra' : 'Ultra',
  };
}
