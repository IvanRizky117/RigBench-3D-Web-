import * as THREE from 'three';

export interface ProceduralPcbMaps {
  albedoMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  dispose: () => void;
}

/**
 * Generates ultra-detailed 2048x1720 Blender-grade procedural PCB solder-mask,
 * fine 45-degree copper traces, gold mounting standoffs, SMD footprints, crisp
 * white technical silkscreen, bump, and roughness maps (100% client-side, zero 404).
 */
export function createProceduralPcbMaps(maxAnisotropy: number): ProceduralPcbMaps {
  const width = 2048;
  const height = 1720;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = width;
  albedoCanvas.height = height;
  const ctx = albedoCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d')!;

  // 1. Deep midnight-indigo / obsidian PCB resin solder mask
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0E1724');
  bgGrad.addColorStop(0.5, '#131D2E');
  bgGrad.addColorStop(1, '#0C1420');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  bCtx.fillStyle = '#6E6E6E';
  bCtx.fillRect(0, 0, width, height);

  // Solder mask glossy resin roughness (~0.35 -> rgb ~90)
  rCtx.fillStyle = 'rgb(92, 92, 92)';
  rCtx.fillRect(0, 0, width, height);

  // Subtle FR-4 fiberglass weave micro-texture
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.016)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 12) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 2. Dense copper trace routing (45-degree bus lanes)
  const drawTrace = (points: Array<[number, number]>, lineW: number, bright = false) => {
    ctx.strokeStyle = bright ? 'rgba(56, 189, 208, 0.36)' : 'rgba(34, 86, 114, 0.52)';
    ctx.lineWidth = lineW;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.stroke();

    bCtx.strokeStyle = '#C4C4C4';
    bCtx.lineWidth = lineW + 1.5;
    bCtx.beginPath();
    points.forEach(([x, y], i) => (i === 0 ? bCtx.moveTo(x, y) : bCtx.lineTo(x, y)));
    bCtx.stroke();

    rCtx.strokeStyle = 'rgb(58, 58, 58)';
    rCtx.lineWidth = lineW;
    rCtx.beginPath();
    points.forEach(([x, y], i) => (i === 0 ? rCtx.moveTo(x, y) : rCtx.lineTo(x, y)));
    rCtx.stroke();
  };

  // CPU <-> Northbridge high-speed Front Side Bus traces
  for (let i = 0; i < 24; i++) {
    const off = i * 14;
    drawTrace(
      [
        [1440, 340 + off],
        [1190, 340 + off],
        [1060, 460 + off * 0.65],
        [1060, 720],
      ],
      3.2,
      i % 4 === 0
    );
  }

  // Northbridge <-> Dual Channel DDR2 RAM bus traces
  for (let i = 0; i < 22; i++) {
    const off = i * 14;
    drawTrace(
      [
        [1060 + off * 0.55, 840],
        [1160 + off * 0.55, 960],
        [1160 + off * 0.55, 1210],
        [1420, 1210 + off * 0.45],
      ],
      3.0,
      i % 3 === 0
    );
  }

  // Northbridge <-> PCIe x16 & AGP traces
  for (let i = 0; i < 18; i++) {
    const off = i * 15;
    drawTrace(
      [
        [960, 620 + off * 0.6],
        [810, 620 + off * 0.6],
        [720, 500 + off * 0.78],
        [580, 500 + off * 0.78],
      ],
      2.8,
      i % 4 === 0
    );
  }

  // Southbridge <-> SATA / IDE / PCI / BIOS / F_PANEL traces
  for (let i = 0; i < 20; i++) {
    const off = i * 17;
    drawTrace(
      [
        [720, 1020 + off * 0.3],
        [530, 1100 + off * 0.6],
        [260, 1100 + off * 0.6],
      ],
      2.6,
      false
    );
  }
  for (let i = 0; i < 16; i++) {
    const off = i * 18;
    drawTrace(
      [
        [740 + off * 0.5, 1140],
        [740 + off * 0.5, 1460],
        [920 + off * 0.5, 1520],
      ],
      2.6,
      false
    );
  }
  for (let i = 0; i < 10; i++) {
    const off = i * 16;
    drawTrace(
      [
        [1200 + off, 1520],
        [1680 + off * 0.4, 1520],
        [1820, 1560 + off * 0.3],
      ],
      2.4,
      i % 3 === 0
    );
  }

  // 3. Gold solder vias, SMD resistor pads & 9 ATX gold mounting standoffs
  const drawVia = (x: number, y: number, r = 5.2) => {
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#070B12';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.44, 0, Math.PI * 2);
    ctx.fill();

    rCtx.fillStyle = 'rgb(28, 28, 28)';
    rCtx.beginPath();
    rCtx.arc(x, y, r, 0, Math.PI * 2);
    rCtx.fill();
  };

  for (let i = 0; i < 260; i++) {
    const vx = 76 + ((i * 149) % (width - 152));
    const vy = 76 + ((i * 277) % (height - 152));
    drawVia(vx, vy, 4.5);
  }

  // Tiny SMD component pads scattered across board
  ctx.fillStyle = 'rgba(203, 213, 225, 0.38)';
  for (let i = 0; i < 120; i++) {
    const sx = 110 + ((i * 193) % (width - 220));
    const sy = 110 + ((i * 311) % (height - 220));
    ctx.fillRect(sx, sy, 8, 4);
    ctx.fillRect(sx + 12, sy, 8, 4);
  }

  // 9 ATX Mounting standoffs with ringed copper pads
  const mountCoords: Array<[number, number]> = [
    [82, 82],
    [1024, 82],
    [1966, 82],
    [82, 860],
    [1024, 860],
    [1966, 860],
    [82, 1638],
    [1024, 1638],
    [1966, 1638],
  ];
  for (const [mx, my] of mountCoords) {
    ctx.strokeStyle = '#EAB308';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(mx, my, 24, 0, Math.PI * 2);
    ctx.stroke();

    // 8 radial solder teeth on standoff ring
    ctx.fillStyle = '#FACC15';
    for (let t = 0; t < 8; t++) {
      const a = (t * Math.PI * 2) / 8;
      ctx.beginPath();
      ctx.arc(mx + Math.cos(a) * 28, my + Math.sin(a) * 28, 3.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#06090F';
    ctx.beginPath();
    ctx.arc(mx, my, 13, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Razor-sharp high-contrast technical white silkscreen labels
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.34)';
  ctx.lineWidth = 4;
  ctx.strokeRect(26, 26, width - 52, height - 52);

  ctx.fillStyle = 'rgba(248, 250, 252, 0.92)';
  ctx.font = 'bold 34px "JetBrains Mono", monospace';
  ctx.fillText('RIGBENCH AKI-915P PRO REV 3.2', 1015, 972);

  ctx.font = 'bold 28px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(241, 245, 249, 0.88)';
  ctx.fillText('LGA775 SOCKET', 1320, 224);
  ctx.fillText('DIMM1', 1020, 1086);
  ctx.fillText('DIMM2', 1240, 1086);
  ctx.fillText('DIMM3', 1460, 1086);
  ctx.fillText('DIMM4', 1680, 1086);
  ctx.fillText('IDE1 40-PIN', 725, 1485);
  ctx.fillText('SATA1-4', 355, 1245);
  ctx.fillText('F_PANEL 9-PIN', 1630, 1475);

  ctx.font = 'bold 23px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(226, 232, 240, 0.8)';
  ctx.fillText('CPU_FAN', 1710, 286);
  ctx.fillText('ATX_12V', 1760, 412);
  ctx.fillText('NB_MCH', 918, 574);
  ctx.fillText('SB_ICH', 604, 986);
  ctx.fillText('PCIEX16', 636, 300);
  ctx.fillText('PCIE_X1', 460, 222);
  ctx.fillText('AGP_8X', 416, 364);
  ctx.fillText('PCI_1  PCI_2  PCI_3', 128, 364);
  ctx.fillText('ROM_BIOS', 170, 1026);
  ctx.fillText('BAT1 CR2032 3V', 636, 1245);
  ctx.fillText('FDD1 34-PIN', 96, 1265);
  ctx.fillText('ATX_PWR 24-PIN', 1235, 1485);

  const albedoMap = new THREE.CanvasTexture(albedoCanvas);
  albedoMap.colorSpace = THREE.SRGBColorSpace;
  albedoMap.anisotropy = maxAnisotropy;
  albedoMap.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.anisotropy = maxAnisotropy;
  bumpMap.needsUpdate = true;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.anisotropy = maxAnisotropy;
  roughnessMap.needsUpdate = true;

  return {
    albedoMap,
    bumpMap,
    roughnessMap,
    dispose: () => {
      albedoMap.dispose();
      bumpMap.dispose();
      roughnessMap.dispose();
    },
  };
}

/**
 * Generates an ultra-crisp 512x512 LGA 775 socket micro-pin contact array texture
 * so inspecting or assembling the empty CPU socket shows 775 gold lands + Pin-1 triangle.
 */
export function createLga775PinGridTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1E242E';
  ctx.fillRect(0, 0, size, size);

  // Subtle gold pin contact matrix with hollow center SMD capacitor cavity
  const step = 14;
  for (let x = 26; x < size - 26; x += step) {
    for (let y = 26; y < size - 26; y += step) {
      const inCenterCavity = x > 180 && x < 332 && y > 180 && y < 332;
      if (inCenterCavity) continue;
      ctx.fillStyle = (x + y) % 28 === 0 ? '#FACC15' : '#CA8A04';
      ctx.fillRect(x, y, 7, 7);
    }
  }

  // Center cavity SMD decoupling capacitors
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(184, 184, 144, 144);
  ctx.fillStyle = '#94A3B8';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      ctx.fillRect(202 + i * 30, 202 + j * 30, 14, 8);
    }
  }

  // Pin-1 Golden Alignment Triangle on bottom-left corner
  ctx.fillStyle = '#FACC15';
  ctx.beginPath();
  ctx.moveTo(22, size - 22);
  ctx.lineTo(84, size - 22);
  ctx.lineTo(22, size - 84);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates an ESD Anti-Static Technician Workbench Mat texture with crisp metric grid lines.
 */
export function createWorkbenchMatTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0D121B';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= size; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(6, 182, 212, 0.11)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= size; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(6, 182, 212, 0.24)';
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, size - 48, size - 48);

  ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.font = '600 18px "JetBrains Mono", monospace';
  ctx.fillText('ESD SAFE ANTI-STATIC MAT  ·  STMIK AKI LAB BENCH', 44, size - 42);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a realistic brushed-label top sticker for the 3.5" PATA/IDE Harddisk unit
 * including clear Jumper Diagram (MA / SL / CS) and 2-cable (IDE Data + Molex Power) callout.
 */
export function createHddLabelTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 320;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(0, 0, w, h);

  // Top dark accent band
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, w, 68);

  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 26px "JetBrains Mono", monospace';
  ctx.fillText('RIGBENCH BARRACUDA 7200.10', 22, 42);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.fillText('160 GB · PATA / IDE ATA-133', 22, 108);

  ctx.fillStyle = '#334155';
  ctx.font = '600 14px "JetBrains Mono", monospace';
  ctx.fillText('DATA: KABEL PITA IDE 40-PIN (PIN-1 MERAH)', 22, 138);
  ctx.fillText('DAYA: KABEL POWER MOLEX 4-PIN (+12V / +5V)', 22, 162);

  // Jumper pinout diagram box
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 3;
  ctx.strokeRect(22, 184, w - 44, 114);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 15px "JetBrains Mono", monospace';
  ctx.fillText('TUTUP PLASTIK JUMPER 2-PIN (BELAKANG):', 34, 212);

  // Draw 4x2 pin schematic
  const labels = ['MA (OS)', 'SLAVE', 'CS', 'LIMIT'];
  labels.forEach((lbl, idx) => {
    const px = 64 + idx * 102;
    ctx.fillStyle = idx === 0 ? '#EAB308' : '#64748B';
    ctx.fillRect(px - 11, 226, 22, 34);
    ctx.fillStyle = idx === 0 ? '#0F172A' : '#FACC15';
    ctx.beginPath();
    ctx.arc(px, 235, 4, 0, Math.PI * 2);
    ctx.arc(px, 251, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = idx === 0 ? '#0284C7' : '#334155';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(lbl, px, 282);
  });
  ctx.textAlign = 'left';

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a high-contrast rear silkscreen plate mounted directly above the 3 rear HDD ports:
 * [IDE 40-PIN DATA]  [MA  SL  CS]  [MOLEX 4-PIN POWER]
 */
export function createHddRearLegendTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 1024;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0B1220';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, w - 8, h - 8);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Left: Molex (note: viewed from -Z facing +Z, +X is to the left on screen! Flip X layout cleanly)
  // On a PlaneGeometry facing -Z (rotation.y = Math.PI), texture U=0 is at local +X, U=1 is at local -X!
  // Local +X = Molex (+0.96), Center-Right = Jumper (+0.14..+0.42), Local -X = IDE (-0.58)
  // So U=0.13 -> Molex, U=0.38 -> CS/SL/MA, U=0.73 -> IDE 40-PIN!
  ctx.fillStyle = '#FACC15';
  ctx.font = 'bold 28px "JetBrains Mono", monospace';
  ctx.fillText('MOLEX 4-PIN', w * 0.14, 44);
  ctx.fillStyle = '#E2E8F0';
  ctx.font = '600 20px "JetBrains Mono", monospace';
  ctx.fillText('POWER (12V/5V)', w * 0.14, 86);

  // Jumper columns (facing -Z: local +0.42 CS is left of +0.28 SL is left of +0.14 MA)
  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 24px "JetBrains Mono", monospace';
  ctx.fillText('CS', w * 0.34, 46);
  ctx.fillStyle = '#F59E0B';
  ctx.fillText('SL', w * 0.4, 46);
  ctx.fillStyle = '#34D399';
  ctx.fillText('MA', w * 0.455, 46);
  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 18px "JetBrains Mono", monospace';
  ctx.fillText('JUMPER 2-PIN', w * 0.4, 88);

  // IDE 40-Pin Data port (local -0.58 -> right side when looking at rear from -Z)
  ctx.fillStyle = '#60A5FA';
  ctx.font = 'bold 28px "JetBrains Mono", monospace';
  ctx.fillText('IDE 40-PIN (DATA)', w * 0.74, 44);
  ctx.fillStyle = '#F87171';
  ctx.font = '600 20px "JetBrains Mono", monospace';
  ctx.fillText('◄ PIN-1 MERAH', w * 0.62, 86);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a crisp color-coded 9-pin F_PANEL silkscreen legend plaque placed beside the header.
 */
export function createFPanelLegendTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#09111F';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 5;
  ctx.strokeRect(6, 6, w - 12, h - 12);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 26px "JetBrains Mono", monospace';
  ctx.fillText('F_PANEL 9-PIN', 20, 38);

  const rows: Array<[string, string, string]> = [
    ['#F97316', '1-3', 'HDD LED (Merah/Putih)'],
    ['#22C55E', '2 / 4', '+P LED (Hj) / -P LED (Pt)'],
    ['#3B82F6', '5-7', 'RESET SW (Biru/Putih)'],
    ['#EF4444', '6-8', 'POWER SW (Oranye/Putih)'],
    ['#475569', '9', 'KEY / NC (Pin 10 Kosong)'],
  ];

  rows.forEach(([col, pin, txt], idx) => {
    const y = 78 + idx * 36;
    ctx.fillStyle = col;
    ctx.fillRect(20, y - 18, 22, 22);
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText(pin, 52, y);
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '600 18px "JetBrains Mono", monospace';
    ctx.fillText(txt, 130, y);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}
