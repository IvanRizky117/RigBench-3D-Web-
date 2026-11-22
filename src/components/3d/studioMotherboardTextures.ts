import * as THREE from 'three';

export interface StudioPcbTextureSet {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  dispose: () => void;
}

/**
 * Generates ultra-detailed matte-black PCB albedo, bump, and roughness maps
 * with shimmering copper/gold bus traces, micro-vias, and brass mounting rings.
 * Strictly zero giant game-style silkscreen labels.
 */
export function createStudioPcbTextures(
  maxAniso: number,
  textureScale = 1
): StudioPcbTextureSet {
  const size = Math.max(512, Math.round(1024 * textureScale));

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const aCtx = albedoCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d');

  if (aCtx && bCtx && rCtx) {
    // 1. Deep matte-black solder mask base
    aCtx.fillStyle = '#0E1218';
    aCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#505050';
    bCtx.fillRect(0, 0, size, size);

    // Matte fiberglass roughness (~0.68 = #ADADAD)
    rCtx.fillStyle = '#ADADAD';
    rCtx.fillRect(0, 0, size, size);

    // 2. Subtle dark fiberglass micro-weave
    const step = Math.max(4, Math.round(size / 160));
    aCtx.strokeStyle = 'rgba(255,255,255,0.018)';
    aCtx.lineWidth = 1;
    for (let i = 0; i < size; i += step) {
      aCtx.beginPath();
      aCtx.moveTo(i, 0);
      aCtx.lineTo(i, size);
      aCtx.stroke();
      aCtx.beginPath();
      aCtx.moveTo(0, i);
      aCtx.lineTo(size, i);
      aCtx.stroke();
    }

    // Subtle dark copper ground plane islands
    aCtx.fillStyle = '#131922';
    aCtx.fillRect(size * 0.04, size * 0.06, size * 0.92, size * 0.88);
    rCtx.fillStyle = '#9E9E9E';
    rCtx.fillRect(size * 0.04, size * 0.06, size * 0.92, size * 0.88);

    // Helper to convert board world coords (X: -5..5, Z: -4.2..4.2) to canvas UV
    const toX = (wx: number) => ((wx + 5.0) / 10.0) * size;
    const toY = (wz: number) => ((wz + 4.2) / 8.4) * size;

    // Draw parallel copper/gold trace bundles with 45-degree bends
    const drawBusBundle = (
      points: Array<[number, number]>,
      lanes: number,
      spacingPx: number,
      color: string,
      widthPx: number
    ) => {
      for (let l = 0; l < lanes; l++) {
        const offset = (l - (lanes - 1) / 2) * spacingPx;
        const drawPath = (ctx: CanvasRenderingContext2D, stroke: string, lw: number) => {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = lw;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.beginPath();
          points.forEach(([wx, wz], idx) => {
            const px = toX(wx) + offset;
            const py = toY(wz) + offset * 0.45;
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();
        };
        drawPath(aCtx, color, widthPx);
        drawPath(bCtx, '#C8C8C8', widthPx + 0.6);
        // Glossy metallic traces have lower roughness (#363636)
        drawPath(rCtx, '#3A3A3A', widthPx + 0.5);
      }
    };

    const traceWidth = Math.max(1.2, size / 580);
    const traceGap = Math.max(3.0, size / 240);

    // High-speed CPU -> Northbridge FSB traces (shimmering gold-copper)
    drawBusBundle(
      [
        [2.1, -1.55],
        [1.15, -1.55],
        [0.4, -0.8],
        [0.1, -0.8],
      ],
      14,
      traceGap,
      '#7C5E2A',
      traceWidth
    );

    // Northbridge -> RAM DIMM parallel memory channels
    drawBusBundle(
      [
        [0.15, -0.6],
        [0.15, 0.75],
        [1.05, 1.65],
        [2.4, 1.65],
      ],
      16,
      traceGap,
      '#8C6A2E',
      traceWidth
    );

    // Northbridge -> PCIe x16 & AGP lanes
    drawBusBundle(
      [
        [0.05, -0.85],
        [-0.85, -0.85],
        [-1.5, -1.5],
      ],
      10,
      traceGap,
      '#7D602B',
      traceWidth
    );
    drawBusBundle(
      [
        [-0.05, -0.7],
        [-1.4, -0.7],
        [-2.7, -1.2],
      ],
      7,
      traceGap,
      '#6E5427',
      traceWidth
    );

    // Northbridge -> Southbridge DMI Link
    drawBusBundle(
      [
        [0.0, -0.6],
        [-0.65, 0.15],
        [-1.45, 0.95],
      ],
      9,
      traceGap,
      '#846630',
      traceWidth
    );

    // Southbridge -> SATA / IDE / Floppy / PCI / BIOS
    drawBusBundle(
      [
        [-1.5, 1.05],
        [-2.2, 1.75],
        [-2.65, 2.5],
      ],
      6,
      traceGap,
      '#695026',
      traceWidth
    );
    drawBusBundle(
      [
        [-1.35, 1.1],
        [-1.35, 2.75],
        [-0.85, 3.4],
      ],
      8,
      traceGap,
      '#5C4724',
      traceWidth
    );
    drawBusBundle(
      [
        [-1.6, 0.9],
        [-3.1, 0.9],
        [-3.75, 1.2],
      ],
      5,
      traceGap,
      '#634D25',
      traceWidth
    );
    drawBusBundle(
      [
        [-1.6, 0.7],
        [-2.9, -0.3],
        [-3.85, -1.35],
      ],
      7,
      traceGap,
      '#5A4624',
      traceWidth
    );

    // Southbridge -> Back Panel I/O
    drawBusBundle(
      [
        [-1.3, 0.6],
        [-0.55, -1.8],
        [-0.55, -3.55],
      ],
      8,
      traceGap,
      '#685026',
      traceWidth
    );

    // ATX 24-pin -> VRM / CPU Power Rail (thicker copper bus)
    drawBusBundle(
      [
        [1.6, 3.3],
        [3.65, 3.3],
        [3.9, 2.9],
        [3.9, -1.6],
        [3.2, -1.6],
      ],
      6,
      traceGap * 1.4,
      '#9E7733',
      traceWidth * 1.5
    );

    // 3. Micro gold-plated vias scattered neatly in engineering clusters
    const viaR = Math.max(1.8, size / 420);
    const viaSeed = (n: number) => {
      const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return s - Math.floor(s);
    };
    for (let i = 0; i < 240; i++) {
      const vx = (0.06 + viaSeed(i * 2) * 0.88) * size;
      const vy = (0.07 + viaSeed(i * 2 + 1) * 0.86) * size;
      aCtx.fillStyle = '#C89B3C';
      aCtx.beginPath();
      aCtx.arc(vx, vy, viaR, 0, Math.PI * 2);
      aCtx.fill();

      aCtx.fillStyle = '#05070A';
      aCtx.beginPath();
      aCtx.arc(vx, vy, viaR * 0.48, 0, Math.PI * 2);
      aCtx.fill();

      bCtx.fillStyle = '#E0E0E0';
      bCtx.beginPath();
      bCtx.arc(vx, vy, viaR, 0, Math.PI * 2);
      bCtx.fill();

      rCtx.fillStyle = '#282828';
      rCtx.beginPath();
      rCtx.arc(vx, vy, viaR, 0, Math.PI * 2);
      rCtx.fill();
    }

    // 4. 9 Authentic ATX brass mounting screw pads with tiny surrounding ground dots
    const mountCoords: Array<[number, number]> = [
      [-4.65, -3.85],
      [0.0, -3.85],
      [4.65, -3.85],
      [-4.65, 0.0],
      [0.45, 0.25],
      [4.65, 0.0],
      [-4.65, 3.85],
      [0.0, 3.85],
      [4.65, 3.85],
    ];
    const padOuter = size * 0.017;
    const padInner = size * 0.0085;
    for (const [mx, mz] of mountCoords) {
      const cx = toX(mx);
      const cy = toY(mz);

      // Gold/copper ground ring
      aCtx.fillStyle = '#D4A847';
      aCtx.beginPath();
      aCtx.arc(cx, cy, padOuter, 0, Math.PI * 2);
      aCtx.fill();

      // 8 perimeter solder bumps around screw pad
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * Math.PI * 2;
        const bx = cx + Math.cos(ang) * padOuter * 0.78;
        const by = cy + Math.sin(ang) * padOuter * 0.78;
        aCtx.fillStyle = '#E5E7EB';
        aCtx.beginPath();
        aCtx.arc(bx, by, padOuter * 0.14, 0, Math.PI * 2);
        aCtx.fill();
      }

      // Dark drilled screw hole
      aCtx.fillStyle = '#04060A';
      aCtx.beginPath();
      aCtx.arc(cx, cy, padInner, 0, Math.PI * 2);
      aCtx.fill();

      bCtx.fillStyle = '#FFFFFF';
      bCtx.beginPath();
      bCtx.arc(cx, cy, padOuter, 0, Math.PI * 2);
      bCtx.fill();
      bCtx.fillStyle = '#080808';
      bCtx.beginPath();
      bCtx.arc(cx, cy, padInner, 0, Math.PI * 2);
      bCtx.fill();

      rCtx.fillStyle = '#242424';
      rCtx.beginPath();
      rCtx.arc(cx, cy, padOuter, 0, Math.PI * 2);
      rCtx.fill();
    }

    // 5. Hairline technical perimeter border (subtle engineering line, zero giant text)
    aCtx.strokeStyle = 'rgba(200, 155, 60, 0.22)';
    aCtx.lineWidth = Math.max(1.5, size / 512);
    aCtx.strokeRect(size * 0.015, size * 0.015, size * 0.97, size * 0.97);
  }

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAniso;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.anisotropy = maxAniso;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.anisotropy = maxAniso;

  return {
    map,
    bumpMap,
    roughnessMap,
    dispose: () => {
      map.dispose();
      bumpMap.dispose();
      roughnessMap.dispose();
    },
  };
}

/**
 * Generates a sleek dark architectural keynote studio floor texture
 * with subtle slate radial vignette and micro-grain (replaces green Lab mat).
 */
export function createStudioFloorTexture(
  maxAniso: number,
  textureScale = 1
): THREE.CanvasTexture {
  const size = Math.max(512, Math.round(768 * textureScale));
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const grad = ctx.createRadialGradient(
      size * 0.5,
      size * 0.5,
      size * 0.05,
      size * 0.5,
      size * 0.5,
      size * 0.54
    );
    grad.addColorStop(0, '#101827');
    grad.addColorStop(0.55, '#070B14');
    grad.addColorStop(1, '#04070E');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Ultra-subtle architectural radial studio rings (barely perceptible keynote polish)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.045)';
    ctx.lineWidth = 1;
    for (const rFrac of [0.22, 0.34, 0.46]) {
      ctx.beginPath();
      ctx.arc(size * 0.5, size * 0.5, size * rFrac, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

/**
 * Generates brushed anodized aluminum map for heatsinks, EMI shielding cans, and ILM frames.
 */
export function createBrushedMetalTexture(maxAniso: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#9EA7B4';
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y++) {
      const shade = 148 + Math.round(Math.sin(y * 1.7) * 14 + Math.cos(y * 4.3) * 8);
      ctx.fillStyle = `rgb(${shade},${shade + 3},${shade + 8})`;
      ctx.fillRect(0, y, size, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAniso;
  return tex;
}

/**
 * Generates ultra-crisp reflective LGA 775 gold contact pin bed with central SMD cavity.
 */
export function createMacroLga775GoldTexture(maxAniso: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Dark recessed substrate beneath pins
    ctx.fillStyle = '#18130A';
    ctx.fillRect(0, 0, size, size);

    const grid = 28;
    const pad = 26;
    const step = (size - pad * 2) / grid;

    for (let gx = 0; gx < grid; gx++) {
      for (let gy = 0; gy < grid; gy++) {
        // Central rectangular SMD capacitor island inside LGA 775
        if (gx >= 10 && gx <= 17 && gy >= 10 && gy <= 17) continue;
        // Corner orientation notch (bottom-left)
        if (gx <= 1 && gy >= grid - 2) continue;

        const px = pad + gx * step;
        const py = pad + gy * step;

        // Angled micro-pin metallic highlight
        ctx.fillStyle = '#EAB308';
        ctx.fillRect(px + 2, py + 2, step * 0.56, step * 0.56);
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(px + 2, py + 2, step * 0.28, step * 0.28);
      }
    }

    // Central SMD cavity (dark green PCB island + micro ceramic caps)
    const cx0 = pad + 10 * step;
    const cy0 = pad + 10 * step;
    const cw = 8 * step;
    ctx.fillStyle = '#0D1E17';
    ctx.fillRect(cx0, cy0, cw, cw);
    ctx.strokeStyle = '#3F341A';
    ctx.lineWidth = 3;
    ctx.strokeRect(cx0, cy0, cw, cw);

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        const sx = cx0 + 14 + i * (cw / 4.4);
        const sy = cy0 + 18 + j * (cw / 3.4);
        ctx.fillStyle = '#D1D5DB';
        ctx.fillRect(sx, sy, 14, 7);
        ctx.fillStyle = '#92400E';
        ctx.fillRect(sx + 3, sy, 8, 7);
      }
    }

    // Golden corner orientation triangle
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.moveTo(16, size - 16);
    ctx.lineTo(54, size - 16);
    ctx.lineTo(16, size - 54);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

/**
 * Etched brushed chrome CR2032 3V coin battery top texture.
 */
export function createCmosCoinTexture(maxAniso: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(110, 100, 10, 128, 128, 128);
    grad.addColorStop(0, '#F1F5F9');
    grad.addColorStop(0.65, '#CBD5E1');
    grad.addColorStop(1, '#94A3B8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(128, 128, 110, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 48px "JetBrains Mono", monospace';
    ctx.fillText('+', 128, 72);
    ctx.font = 'bold 34px "JetBrains Mono", monospace';
    ctx.fillText('CR2032', 128, 134);
    ctx.font = '600 22px "JetBrains Mono", monospace';
    ctx.fillText('LITHIUM 3V', 128, 182);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}
