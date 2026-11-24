import * as THREE from 'three';
import { createStudioFloorTexture } from './studioMotherboardTextures';

export interface TheaterStoryContext {
  progressPct: number;
  keyframeId: string;
  keyframeIndex: number;
  reducedMotion: boolean;
}

export interface TheaterStageAtmosphere {
  backgroundHex: number;
  fogHex: number;
  fogNear: number;
  fogFar: number;
  hemiSkyHex: number;
  hemiGroundHex: number;
  hemiIntensity: number;
  keyHex: number;
  keyIntensity: number;
  rimHex: number;
  rimIntensity: number;
  envIntensity: number;
}

export interface BuiltTheaterDiorama {
  rootGroup: THREE.Group;
  stageTheme?: 'studio-dark' | 'story-bright';
  initialAtmosphere?: TheaterStageAtmosphere;
  update: (
    elapsed: number,
    dt: number,
    mechAction: string | undefined,
    anchor: [number, number, number],
    domainColor: string,
    isPlaying: boolean,
    story?: TheaterStoryContext
  ) => void;
  dispose: () => void;
}

export class DioramaResourceTracker {
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly materials: THREE.Material[] = [];
  private readonly textures: THREE.Texture[] = [];
  readonly textureScale: number;

  constructor(textureScale = 1) {
    this.textureScale = Math.max(0.25, Math.min(1, textureScale));
  }

  geo<T extends THREE.BufferGeometry>(g: T): T {
    this.geometries.push(g);
    return g;
  }

  mat<T extends THREE.Material>(m: T): T {
    this.materials.push(m);
    return m;
  }

  tex<T extends THREE.Texture>(t: T, isDynamic = false): T {
    if (
      !isDynamic &&
      this.textureScale < 0.99 &&
      t instanceof THREE.CanvasTexture &&
      t.image instanceof HTMLCanvasElement
    ) {
      const src = t.image;
      if (src.width >= 96 && src.height >= 48) {
        const dst = document.createElement('canvas');
        dst.width = Math.max(64, Math.round(src.width * this.textureScale));
        dst.height = Math.max(32, Math.round(src.height * this.textureScale));
        const ctx = dst.getContext('2d');
        if (ctx) {
          ctx.drawImage(src, 0, 0, dst.width, dst.height);
          t.image = dst;
          t.needsUpdate = true;
          // Release full-res temporary canvas memory immediately
          src.width = 0;
          src.height = 0;
        }
      }
    }
    this.textures.push(t);
    return t;
  }

  disposeAll(): void {
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
    this.geometries.length = 0;
    this.materials.length = 0;
    this.textures.length = 0;
  }
}

/**
 * Adds the sleek dark reflective keynote studio floor shared by all Teater Materi 3D dioramas.
 */
export function addStudioWorkbench(
  tracker: DioramaResourceTracker,
  rootGroup: THREE.Group,
  maxAniso: number,
  textureScale: number
): THREE.Mesh {
  const floorTex = tracker.tex(createStudioFloorTexture(maxAniso, textureScale));
  const floor = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(30, 30)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.42,
        metalness: 0.35,
      })
    )
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 0);
  floor.receiveShadow = true;
  rootGroup.add(floor);
  return floor;
}

const _accentColor = new THREE.Color();

export function createStudioAccentLight(rootGroup: THREE.Group): THREE.PointLight {
  const light = new THREE.PointLight(0x38bdf8, 1.5, 4.8, 2.0);
  light.position.set(0, 1.4, 0.8);
  rootGroup.add(light);
  return light;
}

export function updateStudioAccentLight(
  light: THREE.PointLight,
  elapsed: number,
  dt: number,
  anchor: [number, number, number],
  domainColor: string
): void {
  light.position.x = THREE.MathUtils.damp(light.position.x, anchor[0], 6.5, dt);
  light.position.y = THREE.MathUtils.damp(light.position.y, Math.max(1.05, anchor[1] + 0.85), 6.5, dt);
  light.position.z = THREE.MathUtils.damp(light.position.z, anchor[2] + 0.55, 6.5, dt);
  _accentColor.set(domainColor);
  light.color.lerp(_accentColor, Math.min(1, dt * 8));
  light.intensity = 1.6 + Math.sin(elapsed * 2.4) * 0.18;
}

export function createCanvasLabelTexture(
  tracker: DioramaResourceTracker,
  lines: Array<{ text: string; color?: string; font?: string; y: number }>,
  bgColor = '#0A1324',
  borderColor = '#38BDF8',
  width = 512,
  height = 192
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, width - 12, height - 12);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const line of lines) {
      ctx.fillStyle = line.color ?? '#F8FAFC';
      ctx.font = line.font ?? 'bold 34px "JetBrains Mono", monospace';
      ctx.fillText(line.text, width / 2, line.y);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tracker.tex(tex);
}

export function createAnalogScaleTexture(
  tracker: DioramaResourceTracker
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(0, 0, 512, 320);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 502, 310);

    const cx = 256;
    const cy = 288;
    const radius = 210;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI * 1.15, Math.PI * 1.85);
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, radius - 36, Math.PI * 1.15, Math.PI * 1.85);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.stroke();

    const ohmLabels = [
      { frac: 0.0, text: '∞' },
      { frac: 0.18, text: '2K' },
      { frac: 0.36, text: '1K' },
      { frac: 0.54, text: '200' },
      { frac: 0.72, text: '50' },
      { frac: 0.86, text: '10' },
      { frac: 1.0, text: '0 Ω' },
    ];

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= 24; i++) {
      const f = i / 24;
      const angle = Math.PI * (1.15 + f * 0.7);
      const r1 = radius - (i % 4 === 0 ? 18 : 10);
      const r2 = radius + 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
      ctx.strokeStyle = '#047857';
      ctx.lineWidth = i % 4 === 0 ? 3 : 1.5;
      ctx.stroke();
    }

    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    for (const lbl of ohmLabels) {
      const angle = Math.PI * (1.15 + lbl.frac * 0.7);
      const lr = radius + 24;
      ctx.fillStyle = lbl.text === '0 Ω' ? '#DC2626' : '#065F46';
      ctx.fillText(lbl.text, cx + Math.cos(angle) * lr, cy + Math.sin(angle) * lr);
    }

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.fillText('OHM ×10 / ×1K', cx, 192);
    ctx.fillStyle = '#475569';
    ctx.font = '600 17px sans-serif';
    ctx.fillText('ANALOG MULTITESTER · AVO', cx, 224);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tracker.tex(tex);
}
