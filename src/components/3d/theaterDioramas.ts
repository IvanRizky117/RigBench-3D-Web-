import * as THREE from 'three';
import { createLga775PinGridTexture } from '../../utils/pcbTextureGenerator';
import {
  addStudioWorkbench,
  createAnalogScaleTexture,
  createCanvasLabelTexture,
  createStudioAccentLight,
  DioramaResourceTracker,
  updateStudioAccentLight,
  type BuiltTheaterDiorama,
} from './theaterDioramaCore';

/**
 * Helper to create an accurate RAM module with metallic gold fingers and physical notch cutout(s).
 */
function createAccurateRamStick(
  tracker: DioramaResourceTracker,
  pcbColor: number,
  label: string,
  subLabel: string,
  notches: number[], // normalized 0..1 along width
  accentHex: string
): THREE.Group {
  const group = new THREE.Group();
  const width = 4.6;
  const height = 1.02;
  const depth = 0.08;

  const pcbMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: pcbColor, roughness: 0.42, metalness: 0.15 })
  );
  const goldMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xf5c542, roughness: 0.25, metalness: 0.9 })
  );
  const icMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.35, metalness: 0.2 })
  );

  // Upper PCB body
  const upper = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(width, height * 0.78, depth)), pcbMat);
  upper.position.y = height * 0.61;
  upper.castShadow = true;
  group.add(upper);

  // Segmented gold-finger bottom edge leaving TRUE physical gaps at notch positions
  const notchHalf = 0.1;
  const sortedNotches = [...notches].sort((a, b) => a - b);
  let cursorX = -width / 2;
  const segments: Array<[number, number]> = [];
  for (const frac of sortedNotches) {
    const nx = -width / 2 + frac * width;
    segments.push([cursorX, Math.max(cursorX + 0.08, nx - notchHalf)]);
    cursorX = nx + notchHalf;
  }
  segments.push([cursorX, width / 2]);

  for (const [x0, x1] of segments) {
    const segW = x1 - x0;
    if (segW <= 0.05) continue;
    const cx = (x0 + x1) / 2;
    const toothPcb = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(segW, height * 0.22, depth)),
      pcbMat
    );
    toothPcb.position.set(cx, height * 0.11, 0);
    group.add(toothPcb);

    const goldEdge = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(segW - 0.03, height * 0.17, depth + 0.015)),
      goldMat
    );
    goldEdge.position.set(cx, height * 0.09, 0);
    group.add(goldEdge);
  }

  // Highlighted notch markers (glowing cyan arrows pointing at physical gap)
  const notchGlowMat = tracker.mat(
    new THREE.MeshBasicMaterial({ color: accentHex })
  );
  for (const frac of sortedNotches) {
    const nx = -width / 2 + frac * width;
    const marker = new THREE.Mesh(tracker.geo(new THREE.ConeGeometry(0.08, 0.18, 4)), notchGlowMat);
    marker.position.set(nx, -0.1, 0);
    group.add(marker);
  }

  // 8 Black DRAM IC chips on front & back
  for (let i = 0; i < 8; i++) {
    const ic = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.38, 0.42, depth + 0.045)), icMat);
    ic.position.set(-1.85 + i * 0.525, height * 0.62, 0);
    group.add(ic);
  }

  // Label sticker on top center
  const stickerTex = createCanvasLabelTexture(
    tracker,
    [
      { text: label, color: '#F8FAFC', font: 'bold 46px "JetBrains Mono", monospace', y: 66 },
      { text: subLabel, color: accentHex, font: 'bold 28px "JetBrains Mono", monospace', y: 128 },
    ],
    '#060D1E',
    accentHex,
    512,
    180
  );
  const sticker = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(1.75, 0.56)),
    tracker.mat(new THREE.MeshBasicMaterial({ map: stickerTex }))
  );
  sticker.position.set(0, height * 0.63, depth / 2 + 0.028);
  group.add(sticker);

  return group;
}

/**
 * CLUSTER 2 · SUB-BAB 1: 3D RAM Notch Comparison (SDRAM 2-Notch vs DDR1/DDR2/DDR3) + ROM BIOS
 */
export function buildRamDiorama(maxAniso: number, textureScale: number): BuiltTheaterDiorama {
  const tracker = new DioramaResourceTracker(textureScale);
  const rootGroup = new THREE.Group();
  addStudioWorkbench(tracker, rootGroup, maxAniso, textureScale);

  const accentLight = createStudioAccentLight(rootGroup);

  // Non-Volatile ROM BIOS DIP Chip on left side of bench
  const romGroup = new THREE.Group();
  romGroup.position.set(-3.5, 0.2, 0.8);
  const romBody = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(1.3, 0.28, 0.72)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.4, metalness: 0.25 }))
  );
  romBody.castShadow = true;
  romGroup.add(romBody);

  const romLabelTex = createCanvasLabelTexture(
    tracker,
    [
      { text: 'ROM BIOS', color: '#FDE68A', font: 'bold 44px "JetBrains Mono", monospace', y: 66 },
      { text: 'NON-VOLATILE', color: '#F59E0B', font: 'bold 28px "JetBrains Mono", monospace', y: 128 },
    ],
    '#111827',
    '#F59E0B',
    384,
    180
  );
  const romLabel = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(1.1, 0.52)),
    tracker.mat(new THREE.MeshBasicMaterial({ map: romLabelTex }))
  );
  romLabel.rotation.x = -Math.PI / 2;
  romLabel.position.y = 0.145;
  romGroup.add(romLabel);

  const pinMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.28, metalness: 0.9 })
  );
  for (let i = 0; i < 8; i++) {
    for (const sz of [-0.4, 0.4]) {
      const leg = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.05, 0.22, 0.06)), pinMat);
      leg.position.set(-0.5 + i * 0.142, -0.04, sz);
      romGroup.add(leg);
    }
  }
  rootGroup.add(romGroup);

  // 4 Accurate DIMM Stands & RAM Modules (SDRAM, DDR1, DDR2, DDR3)
  const slotMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.2 })
  );
  const latchMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.15 })
  );

  const specs = [
    { z: 1.45, color: 0x155e3b, name: 'SDRAM · 168 PIN', sub: '2 NOTCH · MAKS 512MB', notches: [0.34, 0.64], accent: '#10B981' },
    { z: 0.62, color: 0x14532d, name: 'DDR1 · 184 PIN', sub: '1 NOTCH · MAKS 1GB', notches: [0.54], accent: '#38BDF8' },
    { z: -0.22, color: 0x1e3a5f, name: 'DDR2 · 240 PIN', sub: 'NOTCH AGAK KIRI · 2GB', notches: [0.48], accent: '#60A5FA' },
    { z: -1.05, color: 0x1e1b4b, name: 'DDR3 · 240 PIN', sub: 'NOTCH LEBIH KIRI · 4GB', notches: [0.40], accent: '#A855F7' },
  ];

  const sticks: THREE.Group[] = [];
  for (const s of specs) {
    const slotBase = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(4.8, 0.22, 0.24)), slotMat);
    slotBase.position.set(0.4, 0.11, s.z);
    slotBase.receiveShadow = true;
    rootGroup.add(slotBase);

    for (const lx of [-2.05, 2.85]) {
      const latch = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.14, 0.36, 0.22)), latchMat);
      latch.position.set(lx, 0.22, s.z);
      rootGroup.add(latch);
    }

    const stick = createAccurateRamStick(tracker, s.color, s.name, s.sub, s.notches, s.accent);
    stick.position.set(0.4, 0.26, s.z);
    rootGroup.add(stick);
    sticks.push(stick);
  }

  return {
    rootGroup,
    update(elapsed, dt, mechAction, anchor, domainColor, isPlaying) {
      updateStudioAccentLight(accentLight, elapsed, dt, anchor, domainColor);
      // Mechanical seating animation on DDR3 or focused stick
      const activeIdx =
        mechAction === 'highlight-sdram'
          ? 0
          : mechAction === 'highlight-ddr2'
            ? 2
            : 3;

      sticks.forEach((stick, idx) => {
        let targetY = 0.26;
        if (mechAction === 'seat-ram' && idx === activeIdx) {
          const cycle = isPlaying ? Math.sin(elapsed * 2.2) : 0.4;
          targetY = 0.26 + Math.max(0, cycle) * 0.58;
        } else if (
          (mechAction === 'highlight-sdram' && idx === 0) ||
          (mechAction === 'highlight-ddr2' && (idx === 1 || idx === 2))
        ) {
          targetY = 0.42 + Math.sin(elapsed * 2.8) * 0.08;
        }
        stick.position.y = THREE.MathUtils.damp(stick.position.y, targetY, 6, dt);
      });
    },
    dispose: () => tracker.disposeAll(),
  };
}

/**
 * CLUSTER 2 · SUB-BAB 2: Macro LGA 775 Socket + Gold Pins + Intel vs AMD Pedestal
 */
export function buildCpuDiorama(maxAniso: number, textureScale: number): BuiltTheaterDiorama {
  const tracker = new DioramaResourceTracker(textureScale);
  const rootGroup = new THREE.Group();
  addStudioWorkbench(tracker, rootGroup, maxAniso, textureScale);

  const accentLight = createStudioAccentLight(rootGroup);

  // Macro LGA 775 Socket on left
  const socketGroup = new THREE.Group();
  socketGroup.position.set(-1.4, 0.08, 0.2);

  const pcbPlate = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(3.2, 0.16, 3.2)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x0b3b2e, roughness: 0.5, metalness: 0.15 }))
  );
  pcbPlate.receiveShadow = true;
  socketGroup.add(pcbPlate);

  const frameMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.88 })
  );
  const frameBase = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(2.3, 0.18, 2.3)), frameMat);
  frameBase.position.y = 0.14;
  socketGroup.add(frameBase);

  const pinTex = tracker.tex(createLga775PinGridTexture(maxAniso));
  const pinBed = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(1.9, 1.9)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        map: pinTex,
        roughness: 0.3,
        metalness: 0.85,
      })
    )
  );
  pinBed.rotation.x = -Math.PI / 2;
  pinBed.position.y = 0.235;
  socketGroup.add(pinBed);

  // Steel ZIF Lever
  const lever = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 10)), frameMat);
  lever.rotation.x = Math.PI / 2;
  lever.position.set(1.26, 0.22, 0);
  socketGroup.add(lever);

  // Hovering CPU Package (Green substrate + Nickel IHS + Golden Alignment Triangle)
  const cpuGroup = new THREE.Group();
  cpuGroup.position.set(0, 0.72, 0);
  const substrate = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(1.75, 0.09, 1.75)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4, metalness: 0.25 }))
  );
  cpuGroup.add(substrate);

  const ihs = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(1.38, 0.13, 1.38)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.2, metalness: 0.92 }))
  );
  ihs.position.y = 0.11;
  ihs.castShadow = true;
  cpuGroup.add(ihs);

  const cpuTex = createCanvasLabelTexture(
    tracker,
    [
      { text: 'LGA 775 CPU', color: '#0F172A', font: 'bold 40px "JetBrains Mono", monospace', y: 68 },
      { text: 'CORE · PENTIUM 4', color: '#1E40AF', font: 'bold 26px "JetBrains Mono", monospace', y: 124 },
    ],
    '#CBD5E1',
    '#64748B',
    384,
    180
  );
  const ihsTop = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(1.24, 1.24)),
    tracker.mat(new THREE.MeshBasicMaterial({ map: cpuTex }))
  );
  ihsTop.rotation.x = -Math.PI / 2;
  ihsTop.position.y = 0.178;
  cpuGroup.add(ihsTop);

  // Golden Triangle alignment marker at corner
  const tri = new THREE.Mesh(
    tracker.geo(new THREE.ConeGeometry(0.14, 0.04, 3)),
    tracker.mat(new THREE.MeshBasicMaterial({ color: 0xfacc15 }))
  );
  tri.position.set(-0.72, 0.06, 0.72);
  cpuGroup.add(tri);

  socketGroup.add(cpuGroup);
  rootGroup.add(socketGroup);

  // Dual Timeline Columns on right: Intel (Cyan) vs AMD (Amber)
  const intelMilestones = [
    { x: 1.0, h: 0.5, label: 'i386', yr: '1985' },
    { x: 1.85, h: 0.8, label: 'P4', yr: '2000' },
    { x: 2.7, h: 1.15, label: 'Core2', yr: '2007' },
    { x: 3.55, h: 1.5, label: 'Core i7', yr: '2011' },
  ];
  const amdMilestones = [
    { x: 1.0, h: 0.5, label: 'Am386', yr: '1991' },
    { x: 1.85, h: 0.8, label: 'Athlon', yr: '2000' },
    { x: 2.7, h: 1.15, label: 'Phenom', yr: '2010' },
    { x: 3.55, h: 1.5, label: 'APU/FX', yr: '2011' },
  ];

  const intelMeshes: THREE.Mesh[] = [];
  const amdMeshes: THREE.Mesh[] = [];

  const buildRow = (
    items: typeof intelMilestones,
    zPos: number,
    baseColor: number,
    hex: string,
    out: THREE.Mesh[]
  ) => {
    for (const item of items) {
      const mat = tracker.mat(
        new THREE.MeshStandardMaterial({
          color: baseColor,
          emissive: baseColor,
          emissiveIntensity: 0.2,
          roughness: 0.32,
          metalness: 0.65,
        })
      );
      const bar = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.62, item.h, 0.62)), mat);
      bar.position.set(item.x, item.h / 2, zPos);
      bar.castShadow = true;
      rootGroup.add(bar);
      out.push(bar);

      const capTex = createCanvasLabelTexture(
        tracker,
        [
          { text: item.label, color: '#F8FAFC', font: 'bold 42px "JetBrains Mono", monospace', y: 66 },
          { text: item.yr, color: hex, font: 'bold 34px "JetBrains Mono", monospace', y: 128 },
        ],
        '#060D1E',
        hex,
        256,
        180
      );
      const cap = new THREE.Mesh(
        tracker.geo(new THREE.PlaneGeometry(0.64, 0.44)),
        tracker.mat(new THREE.MeshBasicMaterial({ map: capTex }))
      );
      cap.position.set(item.x, item.h + 0.28, zPos);
      rootGroup.add(cap);
    }
  };

  buildRow(intelMilestones, -0.85, 0x0284c7, '#38BDF8', intelMeshes);
  buildRow(amdMilestones, 1.2, 0xd97706, '#F59E0B', amdMeshes);

  return {
    rootGroup,
    update(elapsed, dt, mechAction, anchor, domainColor, isPlaying) {
      updateStudioAccentLight(accentLight, elapsed, dt, anchor, domainColor);
      const hoverY =
        mechAction === 'seat-cpu'
          ? 0.34 + (isPlaying ? (Math.sin(elapsed * 2.1) * 0.5 + 0.5) * 0.68 : 0.42)
          : 0.34;
      cpuGroup.position.y = THREE.MathUtils.damp(cpuGroup.position.y, hoverY, 5, dt);

      const intelGlow = mechAction === 'pulse-intel' ? 0.55 + Math.sin(elapsed * 4) * 0.2 : 0.16;
      const amdGlow = mechAction === 'pulse-amd' ? 0.55 + Math.sin(elapsed * 4) * 0.2 : 0.16;
      intelMeshes.forEach((m) => {
        (m.material as THREE.MeshStandardMaterial).emissiveIntensity = intelGlow;
      });
      amdMeshes.forEach((m) => {
        (m.material as THREE.MeshStandardMaterial).emissiveIntensity = amdGlow;
      });
    },
    dispose: () => tracker.disposeAll(),
  };
}

/**
 * CLUSTER 3 · SUB-BAB 1: SMPS PSU (EMI Metal Casing + Fan + Grounding + ATX 24-Pin Jumper + Stavolt/UPS)
 */
export function buildPsuDiorama(maxAniso: number, textureScale: number): BuiltTheaterDiorama {
  const tracker = new DioramaResourceTracker(textureScale);
  const rootGroup = new THREE.Group();
  addStudioWorkbench(tracker, rootGroup, maxAniso, textureScale);

  const accentLight = createStudioAccentLight(rootGroup);

  // Main Steel EMI PSU Chassis
  const psuGroup = new THREE.Group();
  psuGroup.position.set(-1.3, 0.9, 0.0);

  const steelMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.34, metalness: 0.85 })
  );
  const psuBox = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(3.2, 1.75, 2.7)), steelMat);
  psuBox.castShadow = true;
  psuGroup.add(psuBox);

  // Top Cutaway Recess + Spinning 120mm Fan
  const fanWell = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(1.06, 1.06, 0.08, 28)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.8 }))
  );
  fanWell.position.set(0, 0.88, 0);
  psuGroup.add(fanWell);

  const fanRotor = new THREE.Group();
  fanRotor.position.set(0, 0.92, 0);
  const bladeMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.3 })
  );
  const hub = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.28, 0.28, 0.09, 18)), bladeMat);
  fanRotor.add(hub);
  for (let i = 0; i < 7; i++) {
    const blade = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.76, 0.03, 0.24)), bladeMat);
    const a = (i / 7) * Math.PI * 2;
    blade.position.set(Math.cos(a) * 0.56, 0, Math.sin(a) * 0.56);
    blade.rotation.y = -a;
    blade.rotation.x = 0.36;
    fanRotor.add(blade);
  }
  psuGroup.add(fanRotor);

  // Protective Wire Fan Grille Rings
  const grilleMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.9 })
  );
  for (const r of [0.42, 0.72, 1.02]) {
    const ring = new THREE.Mesh(tracker.geo(new THREE.TorusGeometry(r, 0.022, 8, 28)), grilleMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.98;
    psuGroup.add(ring);
  }

  // Rear AC-IN 3-Pin Socket (Left face) + Glowing Green-Yellow Ground Pin
  const acSocket = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.18, 0.54, 0.72)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 }))
  );
  acSocket.position.set(-1.62, 0.05, 0);
  psuGroup.add(acSocket);

  const groundProng = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.24, 0.08, 0.14)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x10b981,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.7,
      })
    )
  );
  groundProng.position.set(-1.68, 0.16, 0);
  psuGroup.add(groundProng);

  // EMI Label Plaque on Front Side
  const psuTex = createCanvasLabelTexture(
    tracker,
    [
      { text: 'SMPS 500W · EMI SHIELD', color: '#F8FAFC', font: 'bold 34px "JetBrains Mono", monospace', y: 62 },
      { text: '+3.3V · +5V · +12V · +5VSB', color: '#38BDF8', font: 'bold 26px "JetBrains Mono", monospace', y: 124 },
    ],
    '#0B1221',
    '#38BDF8',
    512,
    180
  );
  const psuPlate = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(2.6, 0.92)),
    tracker.mat(new THREE.MeshBasicMaterial({ map: psuTex }))
  );
  psuPlate.position.set(0, 0, 1.36);
  psuGroup.add(psuPlate);
  rootGroup.add(psuGroup);

  // Accurate ATX 24-Pin Connector Block on right front with color-coded wires!
  const atxGroup = new THREE.Group();
  atxGroup.position.set(1.75, 0.42, 1.3);
  const atxBody = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(2.3, 0.58, 0.56)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x1e2430, roughness: 0.52, metalness: 0.12 }))
  );
  atxBody.castShadow = true;
  atxGroup.add(atxBody);

  // 24 recessed dark hollow square pin wells visible on top & bottom rim of ATX plug
  const cellMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x05070b, roughness: 0.92 })
  );
  const cellGeo = tracker.geo(new THREE.BoxGeometry(0.11, 0.08, 0.11));
  for (let i = 0; i < 12; i++) {
    const cx = -0.98 + i * 0.178;
    for (const cz of [-0.11, 0.11]) {
      const well = new THREE.Mesh(cellGeo, cellMat);
      well.position.set(cx, 0.27, cz);
      atxGroup.add(well);
    }
  }

  // Top 12 pins & bottom 12 pins color palette matching STMIK AKI PDF
  const row1Colors = [0xf97316, 0xf97316, 0x111827, 0xef4444, 0x111827, 0xef4444, 0x111827, 0x9ca3af, 0xa855f7, 0xeab308, 0xeab308, 0xf97316];
  const row2Colors = [0xd97706, 0x3b82f6, 0x111827, 0x10b981, 0x111827, 0x111827, 0x111827, 0x4b5563, 0xef4444, 0xef4444, 0xef4444, 0x111827];

  for (let i = 0; i < 12; i++) {
    const x = -0.98 + i * 0.178;
    const wire1 = new THREE.Mesh(
      tracker.geo(new THREE.CylinderGeometry(0.036, 0.036, 0.55, 8)),
      tracker.mat(
        new THREE.MeshStandardMaterial({
          color: row1Colors[i],
          emissive: i === 8 ? 0xa855f7 : 0x000000, // Pin 9 Purple +5VSB
          emissiveIntensity: i === 8 ? 0.65 : 0,
          roughness: 0.45,
        })
      )
    );
    wire1.position.set(x, 0.5, -0.11);
    atxGroup.add(wire1);

    const wire2 = new THREE.Mesh(
      tracker.geo(new THREE.CylinderGeometry(0.036, 0.036, 0.55, 8)),
      tracker.mat(
        new THREE.MeshStandardMaterial({
          color: row2Colors[i],
          emissive: i === 3 ? 0x10b981 : 0x000000, // Pin 16 Green PS_ON
          emissiveIntensity: i === 3 ? 0.75 : 0,
          roughness: 0.45,
        })
      )
    );
    wire2.position.set(x, 0.5, 0.11);
    atxGroup.add(wire2);
  }

  // Animated Metallic Jumper Wire arching between Pin 16 (Green, i=3) and Pin 15/17 (Black GND)
  const jumperCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.98 + 2 * 0.178, 0.75, 0.11),
    new THREE.Vector3(-0.98 + 2.5 * 0.178, 1.15, 0.18),
    new THREE.Vector3(-0.98 + 3 * 0.178, 0.75, 0.11),
  ]);
  const jumperWire = new THREE.Mesh(
    tracker.geo(new THREE.TubeGeometry(jumperCurve, 18, 0.032, 8, false)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x10b981,
        emissiveIntensity: 0.85,
        roughness: 0.2,
        metalness: 0.9,
      })
    )
  );
  atxGroup.add(jumperWire);
  rootGroup.add(atxGroup);

  // Mini Stavolt (AVR) & UPS Comparison Units on Back Right
  const makeUnit = (x: number, z: number, color: number, title: string, sub: string, hex: string) => {
    const unit = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(1.4, 1.05, 1.15)),
      tracker.mat(new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.4 }))
    );
    unit.position.set(x, 0.525, z);
    unit.castShadow = true;
    rootGroup.add(unit);

    const tex = createCanvasLabelTexture(
      tracker,
      [
        { text: title, color: '#F8FAFC', font: 'bold 42px "JetBrains Mono", monospace', y: 64 },
        { text: sub, color: hex, font: 'bold 26px "JetBrains Mono", monospace', y: 126 },
      ],
      '#091020',
      hex,
      320,
      180
    );
    const face = new THREE.Mesh(
      tracker.geo(new THREE.PlaneGeometry(1.22, 0.7)),
      tracker.mat(new THREE.MeshBasicMaterial({ map: tex }))
    );
    face.position.set(x, 0.55, z + 0.585);
    rootGroup.add(face);
  };

  makeUnit(1.9, -1.6, 0x3b2f16, 'STAVOLT', 'STABILIZER 220V', '#F59E0B');
  makeUnit(3.55, -1.6, 0x16253b, 'UPS', 'BATERAI CADANGAN', '#38BDF8');

  let fanSpeed = 0;

  return {
    rootGroup,
    update(elapsed, dt, mechAction, anchor, domainColor, isPlaying) {
      updateStudioAccentLight(accentLight, elapsed, dt, anchor, domainColor);
      const jumped = mechAction === 'jumper-atx';
      jumperWire.visible = jumped;
      const targetSpeed = jumped ? (isPlaying ? 13 : 6) : 0.4;
      fanSpeed = THREE.MathUtils.damp(fanSpeed, targetSpeed, 3.5, dt);
      fanRotor.rotation.y -= fanSpeed * dt;
    },
    dispose: () => tracker.disposeAll(),
  };
}

/**
 * CLUSTER 4 · SUB-BAB 1: Open-Lid 3.5" HDD (Spinning Platter + Moving Head) + IDE 40-Wire vs SATA 3
 */
export function buildHddDiorama(maxAniso: number, textureScale: number): BuiltTheaterDiorama {
  const tracker = new DioramaResourceTracker(textureScale);
  const rootGroup = new THREE.Group();
  addStudioWorkbench(tracker, rootGroup, maxAniso, textureScale);

  const accentLight = createStudioAccentLight(rootGroup);

  // Open-lid 3.5" Harddisk Chassis on left
  const hddGroup = new THREE.Group();
  hddGroup.position.set(-1.7, 0.3, 0.0);

  const chassis = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(3.2, 0.54, 4.3)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.78 }))
  );
  chassis.castShadow = true;
  hddGroup.add(chassis);

  // Dark inner cavity
  const cavity = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(2.85, 0.14, 3.92)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.8 }))
  );
  cavity.position.y = 0.24;
  hddGroup.add(cavity);

  // Mirror-Metallic Magnetic Platter with concentric track groove rings
  const platterGroup = new THREE.Group();
  platterGroup.position.set(0, 0.34, -0.52);

  const platterDisk = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(1.26, 1.26, 0.05, 42)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.12, metalness: 0.96 }))
  );
  platterGroup.add(platterDisk);

  // Subtle colored MBR/GPT track rings on platter
  const outerRingMat = tracker.mat(
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
  );
  const trackRing = new THREE.Mesh(tracker.geo(new THREE.RingGeometry(0.95, 1.04, 36)), outerRingMat);
  trackRing.rotation.x = -Math.PI / 2;
  trackRing.position.y = 0.032;
  platterGroup.add(trackRing);

  const spindle = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 20)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.9 }))
  );
  spindle.position.y = 0.04;
  platterGroup.add(spindle);

  // Visual rotation index notch on spindle
  const dot = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.18, 0.04, 0.06)),
    tracker.mat(new THREE.MeshBasicMaterial({ color: 0x38bdf8 }))
  );
  dot.position.set(0.18, 0.105, 0);
  platterGroup.add(dot);
  hddGroup.add(platterGroup);

  // Pivoting Actuator Arm + Read/Write Head
  const armPivot = new THREE.Group();
  armPivot.position.set(0.75, 0.42, 1.15);

  const pivotHub = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 18)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.28, metalness: 0.9 }))
  );
  armPivot.add(pivotHub);

  const armBeam = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.18, 0.06, 1.75)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.22, metalness: 0.92 }))
  );
  armBeam.position.set(-0.34, 0.04, -0.78);
  armBeam.rotation.y = 0.42;
  armPivot.add(armBeam);

  const headTip = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.12, 0.05, 0.18)),
    tracker.mat(new THREE.MeshBasicMaterial({ color: 0x38bdf8 }))
  );
  headTip.position.set(-0.72, 0.02, -1.52);
  armPivot.add(headTip);
  hddGroup.add(armPivot);
  rootGroup.add(hddGroup);

  // Wide Grey 40-Wire PATA / IDE Ribbon Cable with Bold Red Pin-1 Stripe (Front Right)
  const ideGroup = new THREE.Group();
  ideGroup.position.set(1.75, 0.16, 1.35);

  const ribbon = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(3.1, 0.06, 1.38)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.72 }))
  );
  ribbon.castShadow = true;
  ideGroup.add(ribbon);

  const redStripe = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(3.11, 0.07, 0.11)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 }))
  );
  redStripe.position.set(0, 0.005, 0.64);
  ideGroup.add(redStripe);

  for (const cx of [-1.45, 1.45]) {
    const plug = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(0.28, 0.28, 1.44)),
      tracker.mat(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }))
    );
    plug.position.set(cx, 0.08, 0);
    ideGroup.add(plug);
  }
  rootGroup.add(ideGroup);

  // Slim Red SATA 3 Cable (Back Right) + Flowing Data Light Pulses
  const sataGroup = new THREE.Group();
  sataGroup.position.set(1.75, 0.16, -1.25);

  const sataRibbon = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(3.1, 0.07, 0.34)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.38, metalness: 0.15 }))
  );
  sataRibbon.castShadow = true;
  sataGroup.add(sataRibbon);

  for (const cx of [-1.48, 1.48]) {
    const plug = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(0.32, 0.24, 0.44)),
      tracker.mat(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45 }))
    );
    plug.position.set(cx, 0.06, 0);
    sataGroup.add(plug);
  }

  // Flowing data light beads along SATA cable
  const sataPulses: THREE.Mesh[] = [];
  const pulseMat = tracker.mat(new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
  for (let i = 0; i < 4; i++) {
    const bead = new THREE.Mesh(tracker.geo(new THREE.SphereGeometry(0.07, 10, 10)), pulseMat);
    bead.position.set(-1.3 + i * 0.85, 0.1, 0);
    sataGroup.add(bead);
    sataPulses.push(bead);
  }
  rootGroup.add(sataGroup);

  return {
    rootGroup,
    update(elapsed, dt, mechAction, anchor, domainColor, isPlaying) {
      updateStudioAccentLight(accentLight, elapsed, dt, anchor, domainColor);
      const rpmSpeed = isPlaying ? 9.5 : 3.5;
      platterGroup.rotation.y += rpmSpeed * dt;

      // Sweep read/write head across platter tracks
      const sweepTarget =
        mechAction === 'sweep-head' || mechAction === 'show-sectors'
          ? Math.sin(elapsed * 2.8) * 0.28
          : Math.sin(elapsed * 1.1) * 0.1;
      armPivot.rotation.y = THREE.MathUtils.damp(armPivot.rotation.y, sweepTarget, 6, dt);

      // Animate fast SATA light pulses
      const flowRate = mechAction === 'pulse-sata' ? 1.45 : 0.75;
      sataPulses.forEach((bead, i) => {
        const t = ((elapsed * flowRate + i * 0.25) % 1);
        bead.position.x = -1.35 + t * 2.7;
      });
    },
    dispose: () => tracker.disposeAll(),
  };
}

/**
 * CLUSTER 6 · SUB-BAB 1: 4-Band Resistor (1000Ω ±10%), Ceramic Cap 103, ELCO & Analog Multitester
 */
export function buildElectronicsDiorama(maxAniso: number, textureScale: number): BuiltTheaterDiorama {
  const tracker = new DioramaResourceTracker(textureScale);
  const rootGroup = new THREE.Group();
  addStudioWorkbench(tracker, rootGroup, maxAniso, textureScale);

  const accentLight = createStudioAccentLight(rootGroup);

  const wireMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.25, metalness: 0.92 })
  );

  // 1. Enlarged Accurate 4-Band Resistor (Brown - Black - Red - Silver = 1000 Ω ±10%)
  const resGroup = new THREE.Group();
  resGroup.position.set(-2.2, 0.56, 0.95);

  const resBody = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.28, 0.28, 1.5, 24)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xe6c89c, roughness: 0.45 }))
  );
  resBody.rotation.z = Math.PI / 2;
  resBody.castShadow = true;
  resGroup.add(resBody);

  const bandColors = [0x78350f, 0x0f172a, 0xdc2626, 0xcbd5e1]; // Coklat, Hitam, Merah, Perak
  const bandPositions = [-0.46, -0.18, 0.1, 0.48];
  bandColors.forEach((hex, idx) => {
    const band = new THREE.Mesh(
      tracker.geo(new THREE.CylinderGeometry(0.292, 0.292, 0.14, 24)),
      tracker.mat(new THREE.MeshStandardMaterial({ color: hex, roughness: 0.35, metalness: idx === 3 ? 0.85 : 0.1 }))
    );
    band.rotation.z = Math.PI / 2;
    band.position.x = bandPositions[idx];
    resGroup.add(band);
  });

  // Axial metal leads
  for (const lx of [-1.05, 1.05]) {
    const lead = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.04, 0.04, 0.65, 10)), wireMat);
    lead.rotation.z = Math.PI / 2;
    lead.position.x = lx;
    resGroup.add(lead);
  }
  rootGroup.add(resGroup);

  // 2. Ceramic Disc Capacitor printed "103" (10,000 pF = 10 nF = 0.01 uF)
  const capGroup = new THREE.Group();
  capGroup.position.set(-2.6, 0.68, -0.95);
  const disc = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.46, 0.46, 0.16, 26)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.42 }))
  );
  disc.rotation.x = Math.PI / 2;
  disc.castShadow = true;
  capGroup.add(disc);

  const capTex = createCanvasLabelTexture(
    tracker,
    [
      { text: '103', color: '#0F172A', font: 'bold 74px "JetBrains Mono", monospace', y: 74 },
      { text: '0.01 µF', color: '#1E293B', font: 'bold 30px "JetBrains Mono", monospace', y: 136 },
    ],
    '#E08A1E',
    '#B45309',
    256,
    180
  );
  const capFace = new THREE.Mesh(
    tracker.geo(new THREE.CircleGeometry(0.38, 24)),
    tracker.mat(new THREE.MeshBasicMaterial({ map: capTex }))
  );
  capFace.position.z = 0.085;
  capGroup.add(capFace);

  for (const lx of [-0.16, 0.16]) {
    const leg = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.03, 0.03, 0.56, 8)), wireMat);
    leg.position.set(lx, -0.45, 0);
    capGroup.add(leg);
  }
  rootGroup.add(capGroup);

  // 3. Polarized Blue ELCO Capacitor with White Negative Stripe
  const elcoGroup = new THREE.Group();
  elcoGroup.position.set(-1.35, 0.66, -0.95);
  const elcoCan = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.36, 0.36, 0.96, 24)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35, metalness: 0.35 }))
  );
  elcoCan.castShadow = true;
  elcoGroup.add(elcoCan);

  const negStripe = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.14, 0.94, 0.06)),
    tracker.mat(new THREE.MeshBasicMaterial({ color: 0xf8fafc }))
  );
  negStripe.position.set(0.24, 0, 0.25);
  elcoGroup.add(negStripe);

  const elcoTop = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 24)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.2, metalness: 0.95 }))
  );
  elcoTop.position.y = 0.49;
  elcoGroup.add(elcoTop);
  rootGroup.add(elcoGroup);

  // 4. Authentic Analog Multitester (AVO Meter) with Animated Pivoting Needle!
  const meterGroup = new THREE.Group();
  meterGroup.position.set(1.7, 0.32, -0.2);
  meterGroup.rotation.x = -0.32;

  const meterBody = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(2.6, 0.46, 3.4)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.2 }))
  );
  meterBody.castShadow = true;
  meterGroup.add(meterBody);

  const scaleTex = createAnalogScaleTexture(tracker);
  const scaleFace = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(2.26, 1.4)),
    tracker.mat(new THREE.MeshBasicMaterial({ map: scaleTex }))
  );
  scaleFace.rotation.x = -Math.PI / 2;
  scaleFace.position.set(0, 0.238, -0.78);
  meterGroup.add(scaleFace);

  // Pivoting Red Indicator Needle over the Ohm Scale
  const needlePivot = new THREE.Group();
  needlePivot.position.set(0, 0.26, -0.18);
  const needle = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.038, 0.02, 1.08)),
    tracker.mat(new THREE.MeshBasicMaterial({ color: 0xef4444 }))
  );
  needle.position.z = -0.54;
  needlePivot.add(needle);
  meterGroup.add(needlePivot);

  // Range Selector Knob + Zero Ohm Adj Knob
  const rangeKnob = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.46, 0.5, 0.2, 24)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.3 }))
  );
  rangeKnob.position.set(0, 0.3, 0.72);
  meterGroup.add(rangeKnob);

  const zeroKnob = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.22, 0.24, 0.16, 20)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.35 }))
  );
  zeroKnob.position.set(0.84, 0.29, 0.24);
  meterGroup.add(zeroKnob);
  rootGroup.add(meterGroup);

  return {
    rootGroup,
    update(elapsed, dt, mechAction, anchor, domainColor, isPlaying) {
      updateStudioAccentLight(accentLight, elapsed, dt, anchor, domainColor);

      // Needle rotation: +0.62 rad = ∞ (left), 0 = mid-scale, -0.62 rad = 0 Ω (right)
      let targetAngle = 0.56;
      if (mechAction === 'deflect-zero' || mechAction === 'deflect-short') {
        targetAngle = -0.6;
      } else if (mechAction === 'deflect-mid') {
        targetAngle = -0.05 + (isPlaying ? Math.sin(elapsed * 2.5) * 0.08 : 0);
      } else if (mechAction === 'deflect-good') {
        // Capacitor charging kick right toward 0 Ω then smoothly returning left to ∞!
        const phase = (elapsed * 0.45) % 1;
        targetAngle = phase < 0.28 ? -0.42 : THREE.MathUtils.lerp(-0.42, 0.56, (phase - 0.28) / 0.72);
      }
      needlePivot.rotation.y = THREE.MathUtils.damp(needlePivot.rotation.y, targetAngle, 5.5, dt);
    },
    dispose: () => tracker.disposeAll(),
  };
}
