import * as THREE from 'three';
import type { DioramaResourceTracker } from './theaterDioramaCore';

function makeBadgeTexture(
  tracker: DioramaResourceTracker,
  maxAniso: number,
  text: string,
  bgHex: string,
  fgHex: string,
  borderHex: string,
  w = 256,
  h = 64,
  fontPx = 28
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = borderHex;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.fillStyle = fgHex;
    ctx.font = `800 ${fontPx}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  tex.needsUpdate = true;
  return tracker.tex(tex);
}

function makeDocumentPageTexture(
  tracker: DioramaResourceTracker,
  maxAniso: number,
  accentHex = '#0284C7'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 128, 160);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 122, 154);

    // Header bar
    ctx.fillStyle = accentHex;
    ctx.fillRect(16, 16, 96, 18);

    // Printed text lines
    ctx.fillStyle = '#64748B';
    for (let i = 0; i < 6; i++) {
      const lw = i === 5 ? 58 : i % 2 === 0 ? 92 : 76;
      ctx.fillRect(16, 48 + i * 16, lw, 7);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  tex.needsUpdate = true;
  return tracker.tex(tex);
}

// =========================================================================
// 1. DETAILED 3-TIER MEMORY CABINET (CACHE + RAM 0x01–0x08 + SPINNING HDD)
// =========================================================================
export interface BuiltMemoryCabinet {
  group: THREE.Group;
  update: (animT: number, dt: number) => void;
}

export function buildDetailedMemoryCabinet(
  tracker: DioramaResourceTracker,
  maxAniso: number
): BuiltMemoryCabinet {
  const group = new THREE.Group();

  const housingMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x312e59, roughness: 0.52, metalness: 0.18 })
  );
  const darkRecessMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x1e1b3a, roughness: 0.72, metalness: 0.12 })
  );
  const goldMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.3, metalness: 0.55 })
  );
  const silverMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.22, metalness: 0.82 })
  );
  const handleMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.7 })
  );

  // Main sturdy 3-tier cabinet chassis (1.84 wide x 2.02 tall x 0.78 deep)
  const chassis = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(1.84, 2.02, 0.72)), housingMat);
  chassis.position.set(0, 1.01, -0.04);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  group.add(chassis);

  // Recessed dark interior bay backing for crisp depth contrast
  const bayBack = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(1.66, 1.84, 0.08)), darkRecessMat);
  bayBack.position.set(0, 1.01, 0.3);
  group.add(bayBack);

  // --- TIER 1 (TOP): GOLDEN FAST CACHE LOCKER ---
  const cacheHeader = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(1.62, 0.22)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        map: makeBadgeTexture(tracker, maxAniso, '⚡ CACHE · CEPAT', '#78350F', '#FEF08A', '#F59E0B', 320, 56, 26),
        roughness: 0.35,
      })
    )
  );
  cacheHeader.position.set(0, 1.9, 0.345);
  group.add(cacheHeader);

  const cacheTrays: THREE.Group[] = [];
  const cacheLabels = ['L1 CACHE', 'L2 CACHE'];
  for (let i = 0; i < 2; i++) {
    const tray = new THREE.Group();
    tray.position.set(i === 0 ? -0.4 : 0.4, 1.62, 0.32);

    const box = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.72, 0.26, 0.44)), goldMat);
    box.position.z = -0.14;
    box.castShadow = true;
    tray.add(box);

    const face = new THREE.Mesh(
      tracker.geo(new THREE.PlaneGeometry(0.64, 0.2)),
      tracker.mat(
        new THREE.MeshStandardMaterial({
          map: makeBadgeTexture(tracker, maxAniso, cacheLabels[i], '#92400E', '#FEF9C3', '#FBBF24', 192, 56, 24),
          roughness: 0.3,
        })
      )
    );
    face.position.set(0, 0, 0.085);
    tray.add(face);

    const knob = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.18, 0.04, 0.06)), handleMat);
    knob.position.set(0, -0.07, 0.11);
    tray.add(knob);

    group.add(tray);
    cacheTrays.push(tray);
  }

  // --- TIER 2 (MIDDLE): RAM 0x01–0x08 ADDRESSABLE WORD DRAWERS ---
  const ramHeader = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(1.62, 0.2)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        map: makeBadgeTexture(tracker, maxAniso, 'RAM PRIMER · 0x01–0x08', '#3B0764', '#E9D5FF', '#A855F7', 360, 52, 24),
        roughness: 0.38,
      })
    )
  );
  ramHeader.position.set(0, 1.35, 0.345);
  group.add(ramHeader);

  const ramDrawers: Array<{ group: THREE.Group; baseZ: number }> = [];
  const drawerBodyMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x6d28d9, roughness: 0.45, metalness: 0.15 })
  );
  const chipInsideMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.65,
      roughness: 0.25,
    })
  );

  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      const idx = r * 4 + c + 1;
      const dGroup = new THREE.Group();
      const dx = -0.58 + c * 0.39;
      const dy = 1.1 - r * 0.28;
      dGroup.position.set(dx, dy, 0.32);

      const box = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.35, 0.22, 0.42)), drawerBodyMat);
      box.position.z = -0.14;
      box.castShadow = true;
      dGroup.add(box);

      const chip = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.22, 0.09, 0.22)), chipInsideMat);
      chip.position.set(0, 0.08, -0.05);
      dGroup.add(chip);

      const face = new THREE.Mesh(
        tracker.geo(new THREE.PlaneGeometry(0.31, 0.18)),
        tracker.mat(
          new THREE.MeshStandardMaterial({
            map: makeBadgeTexture(tracker, maxAniso, `0x0${idx}`, '#1E1B4B', '#38BDF8', '#7C3AED', 128, 64, 34),
            roughness: 0.35,
          })
        )
      );
      face.position.set(0, 0, 0.075);
      dGroup.add(face);

      const pull = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.11, 0.03, 0.05)), handleMat);
      pull.position.set(0, -0.06, 0.095);
      dGroup.add(pull);

      group.add(dGroup);
      ramDrawers.push({ group: dGroup, baseZ: 0.32 });
    }
  }

  // --- TIER 3 (BOTTOM): SPINNING SECONDARY STORAGE HDD BAY ---
  const hddHeader = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(1.62, 0.18)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        map: makeBadgeTexture(tracker, maxAniso, 'DISK SEKUNDER · HDD', '#0F172A', '#CBD5E1', '#64748B', 360, 48, 22),
        roughness: 0.4,
      })
    )
  );
  hddHeader.position.set(0, 0.61, 0.345);
  group.add(hddHeader);

  const hddBay = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(1.56, 0.44, 0.44)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.48, metalness: 0.45 }))
  );
  hddBay.position.set(0, 0.28, 0.15);
  group.add(hddBay);

  // Spinning silver platter tilted slightly forward so camera sees it clearly!
  const platterPivot = new THREE.Group();
  platterPivot.position.set(-0.22, 0.28, 0.38);
  platterPivot.rotation.x = 0.25;
  const platter = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.19, 0.19, 0.03, 20)), silverMat);
  platter.rotation.x = Math.PI / 2;
  platterPivot.add(platter);
  const stripe = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.34, 0.025, 0.035)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.5 }))
  );
  platterPivot.add(stripe);
  const spindle = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 12)), goldMat);
  spindle.rotation.x = Math.PI / 2;
  platterPivot.add(spindle);
  group.add(platterPivot);

  // Oscillating HDD read/write actuator arm
  const armPivot = new THREE.Group();
  armPivot.position.set(0.32, 0.24, 0.4);
  const armBar = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.46, 0.045, 0.03)), silverMat);
  armBar.position.set(-0.22, 0, 0);
  armPivot.add(armBar);
  group.add(armPivot);

  // Flying Word Packet Cube leaping between open RAM drawer and open Golden Cache tray!
  const flyingWord = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.2, 0.16, 0.16)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.75,
        roughness: 0.2,
      })
    )
  );
  group.add(flyingWord);

  return {
    group,
    update(animT: number, dt: number) {
      // Spin HDD platter & sweep read/write arm
      platterPivot.rotation.z = -animT * 5.2;
      armPivot.rotation.z = -0.2 + Math.sin(animT * 3.8) * 0.28;

      // Cycle which RAM drawer slides open & sends a word packet up to Cache!
      const activeDrawerIdx = Math.floor(animT * 0.85) % ramDrawers.length;
      const activeCacheIdx = activeDrawerIdx % 2;

      ramDrawers.forEach((d, idx) => {
        const targetZ = idx === activeDrawerIdx ? d.baseZ + 0.26 : d.baseZ;
        d.group.position.z = THREE.MathUtils.damp(d.group.position.z, targetZ, 7.5, dt);
      });
      cacheTrays.forEach((tray, idx) => {
        const targetZ = idx === activeCacheIdx ? 0.56 : 0.32;
        tray.position.z = THREE.MathUtils.damp(tray.position.z, targetZ, 7.5, dt);
      });

      // Flying data word arcs cleanly from active RAM drawer -> active golden Cache tray
      const src = ramDrawers[activeDrawerIdx].group.position;
      const dst = cacheTrays[activeCacheIdx].position;
      const frac = (animT * 0.85) % 1;
      const arc = Math.sin(frac * Math.PI);
      flyingWord.position.set(
        THREE.MathUtils.lerp(src.x, dst.x, frac),
        THREE.MathUtils.lerp(src.y, dst.y, frac) + arc * 0.12,
        0.58 + arc * 0.34
      );
      flyingWord.rotation.y = animT * 4.5;
    },
  };
}

// =========================================================================
// 2. DETAILED ALU GIANT CALCULATOR + 3 FAST REGISTER SLOTS (R1, R2, ACC)
// =========================================================================
export interface BuiltAluStation {
  group: THREE.Group;
  update: (animT: number, dt: number) => void;
}

const ALU_EQUATIONS = [
  { mode: 'ARITMATIKA · ADD', expr: '12 + 8 = 20' },
  { mode: 'ARITMATIKA · MUL', expr: '6 × 4 = 24' },
  { mode: 'LOGIKA · COMPARE', expr: '15 > 9 : OK' },
  { mode: 'LOGIKA · AND BIT', expr: '1 AND 1 = 1' },
];

export function buildDetailedAluStation(
  tracker: DioramaResourceTracker,
  maxAniso: number
): BuiltAluStation {
  const group = new THREE.Group();

  const deskWoodMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x9a6b41, roughness: 0.72, metalness: 0.05 })
  );
  const legMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.45 })
  );
  const aluBodyMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.38, metalness: 0.32 })
  );
  const emeraldMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.36, metalness: 0.25 })
  );
  const goldMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.28,
      roughness: 0.26,
      metalness: 0.72,
    })
  );

  // Workbench table (1.92 wide x 0.64 tall)
  const tabletop = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(1.96, 0.09, 1.06)), deskWoodMat);
  tabletop.position.set(0.1, 0.62, 0);
  tabletop.castShadow = true;
  tabletop.receiveShadow = true;
  group.add(tabletop);

  const legGeo = tracker.geo(new THREE.BoxGeometry(0.08, 0.6, 0.08));
  for (const [lx, lz] of [
    [-0.78, -0.42],
    [0.98, -0.42],
    [-0.78, 0.42],
    [0.98, 0.42],
  ] as const) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(lx, 0.3, lz);
    leg.castShadow = true;
    group.add(leg);
  }

  // --- GIANT STYLIZED ALU CALCULATOR CONSOLE (LEFT-CENTER OF BENCH) ---
  const calcGroup = new THREE.Group();
  calcGroup.position.set(-0.28, 0.66, -0.02);
  group.add(calcGroup);

  const baseCase = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(1.02, 0.56, 0.78)), aluBodyMat);
  baseCase.position.set(0, 0.28, 0);
  baseCase.castShadow = true;
  calcGroup.add(baseCase);

  const emeraldTrim = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(1.06, 0.1, 0.82)), emeraldMat);
  emeraldTrim.position.set(0, 0.06, 0);
  calcGroup.add(emeraldTrim);

  // Tilted upper display hood showing live "12 + 8 = 20"
  const screenHood = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.98, 0.58, 0.24)), aluBodyMat);
  screenHood.position.set(0, 0.74, -0.18);
  screenHood.rotation.x = -0.22;
  screenHood.castShadow = true;
  calcGroup.add(screenHood);

  // Dynamic live ALU LCD canvas
  const lcdCanvas = document.createElement('canvas');
  lcdCanvas.width = 320;
  lcdCanvas.height = 160;
  const lcdCtx = lcdCanvas.getContext('2d');
  const lcdTex = tracker.tex(new THREE.CanvasTexture(lcdCanvas), true);
  lcdTex.colorSpace = THREE.SRGBColorSpace;
  lcdTex.anisotropy = maxAniso;

  const drawLcd = (eqIdx: number) => {
    if (!lcdCtx) return;
    const eq = ALU_EQUATIONS[eqIdx % ALU_EQUATIONS.length];
    lcdCtx.fillStyle = '#052E16';
    lcdCtx.fillRect(0, 0, 320, 160);
    lcdCtx.strokeStyle = '#10B981';
    lcdCtx.lineWidth = 8;
    lcdCtx.strokeRect(4, 4, 312, 152);
    lcdCtx.fillStyle = '#6EE7B7';
    lcdCtx.font = 'bold 22px "JetBrains Mono", monospace';
    lcdCtx.textAlign = 'center';
    lcdCtx.fillText(`ALU · ${eq.mode}`, 160, 44);
    lcdCtx.fillStyle = '#FEF08A';
    lcdCtx.font = '900 44px "JetBrains Mono", monospace';
    lcdCtx.fillText(eq.expr, 160, 114);
    lcdTex.needsUpdate = true;
  };
  drawLcd(0);

  const lcdMesh = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(0.86, 0.44)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        map: lcdTex,
        emissiveMap: lcdTex,
        emissive: 0xffffff,
        emissiveIntensity: 0.45,
        roughness: 0.18,
      })
    )
  );
  lcdMesh.position.set(0, 0.74, -0.055);
  lcdMesh.rotation.x = -0.22;
  calcGroup.add(lcdMesh);

  // 4 Chunky Tactile 3D Operator Buttons (+, -, ×, ÷) on front sloped deck
  const opSymbols = ['+', '−', '×', '÷'];
  const opColors = ['#0284C7', '#7C3AED', '#059669', '#D97706'];
  const opButtons: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const btnTex = makeBadgeTexture(tracker, maxAniso, opSymbols[i], opColors[i], '#FFFFFF', '#F8FAFC', 96, 96, 56);
    const btn = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(0.19, 0.1, 0.2)),
      tracker.mat(new THREE.MeshStandardMaterial({ map: btnTex, roughness: 0.3 }))
    );
    btn.position.set(-0.33 + i * 0.22, 0.59, 0.2);
    btn.castShadow = true;
    calcGroup.add(btn);
    opButtons.push(btn);
  }

  // Input Data Funnel (top-left) & Output Chute (front-left) with animated operand cube
  const funnel = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.18, 0.08, 0.22, 10)),
    emeraldMat
  );
  funnel.position.set(-0.34, 1.14, -0.18);
  calcGroup.add(funnel);

  const operandCube = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.16, 0.16, 0.16)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.6,
      })
    )
  );
  calcGroup.add(operandCube);

  // --- 3 FAST REGISTER SLOTS (R1, R2, ACC) BOLTED DIRECTLY TO ALU SIDE ---
  const regDock = new THREE.Group();
  regDock.position.set(0.64, 0.66, -0.02);
  group.add(regDock);

  // Thick glowing copper busbars connecting ALU directly to Register slots!
  for (const bz of [-0.14, 0.12]) {
    const bar = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.45, 0.06, 0.06)), goldMat);
    bar.position.set(-0.42, 0.24, bz);
    regDock.add(bar);
  }

  const regBase = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.76, 0.34, 0.72)), aluBodyMat);
  regBase.position.y = 0.17;
  regBase.castShadow = true;
  regDock.add(regBase);

  const regHeader = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(0.7, 0.17)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        map: makeBadgeTexture(tracker, maxAniso, 'REGISTER', '#78350F', '#FEF08A', '#F59E0B', 200, 52, 28),
        roughness: 0.3,
      })
    )
  );
  regHeader.position.set(0, 0.18, 0.365);
  regDock.add(regHeader);

  const regNames = ['R1', 'R2', 'ACC'];
  const regChips: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const rx = -0.23 + i * 0.23;
    const slotBase = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(0.18, 0.08, 0.44)),
      tracker.mat(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 }))
    );
    slotBase.position.set(rx, 0.36, -0.02);
    regDock.add(slotBase);

    const chipTex = makeBadgeTexture(tracker, maxAniso, regNames[i], '#B45309', '#FEF9C3', '#FDE047', 96, 128, 34);
    const chip = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(0.15, 0.4, 0.08)),
      tracker.mat(
        new THREE.MeshStandardMaterial({
          map: chipTex,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.25,
          roughness: 0.25,
          metalness: 0.4,
        })
      )
    );
    chip.position.set(rx, 0.54, -0.02);
    chip.castShadow = true;
    regDock.add(chip);
    regChips.push(chip);
  }

  let lastEqIdx = 0;

  return {
    group,
    update(animT: number, dt: number) {
      const eqIdx = Math.floor(animT * 0.55) % ALU_EQUATIONS.length;
      if (eqIdx !== lastEqIdx) {
        lastEqIdx = eqIdx;
        drawLcd(eqIdx);
      }

      // Depress active operator button matching equation!
      opButtons.forEach((btn, idx) => {
        const pressed = idx === eqIdx;
        btn.position.y = THREE.MathUtils.damp(btn.position.y, pressed ? 0.55 : 0.6, 12, dt);
      });

      // Operand cube drops into top funnel cleanly
      const dropU = (animT * 1.1) % 1;
      operandCube.position.set(-0.34, 1.58 - dropU * 0.52, -0.18);
      operandCube.rotation.y = animT * 3.2;
      operandCube.scale.setScalar(dropU > 0.85 ? 1 - (dropU - 0.85) * 6 : 1);

      // Register chips R1 -> R2 -> ACC bounce swiftly when accessed by ALU
      const activeReg = Math.floor(animT * 2.2) % 3;
      regChips.forEach((chip, idx) => {
        const targetY = idx === activeReg ? 0.64 : 0.52;
        chip.position.y = THREE.MathUtils.damp(chip.position.y, targetY, 10, dt);
      });
    },
  };
}

// =========================================================================
// 3. DETAILED REGISTER BUFFER: GLASS BUS PIPE -> DOCUMENT TANK -> PRINTER FEED
// =========================================================================
export interface BuiltRegisterBufferBridge {
  group: THREE.Group;
  update: (animT: number, dt: number) => void;
}

export function buildDetailedRegisterBufferBridge(
  tracker: DioramaResourceTracker,
  maxAniso: number
): BuiltRegisterBufferBridge {
  const group = new THREE.Group();

  const frameMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.35 })
  );
  const amberMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.38, metalness: 0.28 })
  );
  const glassMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.34,
      roughness: 0.08,
      metalness: 0.1,
      depthWrite: false,
    })
  );
  const ringMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3, metalness: 0.72 })
  );

  // Base industrial-cute pedestal
  const base = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(1.18, 0.34, 0.94)), frameMat);
  base.position.y = 0.17;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Crisp front badge "REGISTER BUFFER"
  const badge = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(1.06, 0.24)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        map: makeBadgeTexture(tracker, maxAniso, 'REGISTER BUFFER', '#78350F', '#FEF08A', '#F59E0B', 320, 64, 28),
        roughness: 0.3,
      })
    )
  );
  badge.position.set(0, 0.17, 0.476);
  group.add(badge);

  // 4 Corner structural pillars framing the glass document chamber
  const pillarGeo = tracker.geo(new THREE.BoxGeometry(0.08, 1.06, 0.08));
  for (const [px, pz] of [
    [-0.5, -0.38],
    [0.5, -0.38],
    [-0.5, 0.38],
    [0.5, 0.38],
  ] as const) {
    const p = new THREE.Mesh(pillarGeo, amberMat);
    p.position.set(px, 0.87, pz);
    p.castShadow = true;
    group.add(p);
  }

  // Top frame lid
  const lid = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(1.12, 0.1, 0.88)), frameMat);
  lid.position.y = 1.44;
  lid.castShadow = true;
  group.add(lid);

  // Clear glass walls
  const chamberGlass = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.96, 1.02, 0.72)), glassMat);
  chamberGlass.position.y = 0.87;
  group.add(chamberGlass);

  // --- LEFT INTAKE GLASS PIPE (COMING FROM BUS HIGHWAY AT FRONT-LEFT!) ---
  const intakeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.95, 0.1, 1.0),
    new THREE.Vector3(-0.95, 1.05, 0.55),
    new THREE.Vector3(-0.52, 1.32, 0.0),
  ]);
  const intakePipe = new THREE.Mesh(
    tracker.geo(new THREE.TubeGeometry(intakeCurve, 18, 0.14, 10, false)),
    glassMat
  );
  group.add(intakePipe);

  // Metallic intake collar ring
  const inCollar = new THREE.Mesh(tracker.geo(new THREE.TorusGeometry(0.16, 0.035, 8, 16)), ringMat);
  inCollar.rotation.y = Math.PI / 2;
  inCollar.position.set(-0.54, 1.32, 0);
  group.add(inCollar);

  // Fast glowing data capsules zipping up the intake pipe from Bus into Buffer!
  const fastCapsules: THREE.Mesh[] = [];
  const capMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.75,
      roughness: 0.2,
    })
  );
  for (let i = 0; i < 3; i++) {
    const cap = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.17, 0.13, 0.17)), capMat);
    group.add(cap);
    fastCapsules.push(cap);
  }

  // --- QUEUED PRINTED DOCUMENTS INSIDE BUFFER CHAMBER ---
  const docTex = makeDocumentPageTexture(tracker, maxAniso, '#0284C7');
  const docMat = tracker.mat(new THREE.MeshStandardMaterial({ map: docTex, roughness: 0.72 }));
  const docSideMat = tracker.mat(new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 }));
  const docMats = [docSideMat, docSideMat, docMat, docSideMat, docSideMat, docSideMat];
  const queuedDocs: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const sheet = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.66, 0.07, 0.5)), docMats);
    sheet.position.set(0, 0.44 + i * 0.17, 0);
    sheet.castShadow = true;
    group.add(sheet);
    queuedDocs.push(sheet);
  }

  // Side fill-level LED bars (4 segments)
  const gaugeMats: THREE.MeshStandardMaterial[] = [];
  for (let i = 0; i < 4; i++) {
    const gMat = tracker.mat(
      new THREE.MeshStandardMaterial({
        color: i >= 3 ? 0xef4444 : 0x10b981,
        emissive: i >= 3 ? 0xef4444 : 0x10b981,
        emissiveIntensity: 0.7,
      })
    );
    const seg = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.06, 0.14, 0.12)), gMat);
    seg.position.set(-0.55, 0.52 + i * 0.2, 0.36);
    group.add(seg);
    gaugeMats.push(gMat);
  }

  // --- RIGHT OUTTAKE GLASS CHUTE DIRECTLY INTO PRINTER! ---
  const outCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.52, 0.56, 0.0),
    new THREE.Vector3(1.02, 0.62, -0.05),
    new THREE.Vector3(1.42, 0.66, -0.1),
  ]);
  const outPipe = new THREE.Mesh(
    tracker.geo(new THREE.TubeGeometry(outCurve, 12, 0.15, 10, false)),
    glassMat
  );
  group.add(outPipe);

  const outCollar = new THREE.Mesh(tracker.geo(new THREE.TorusGeometry(0.17, 0.035, 8, 16)), ringMat);
  outCollar.rotation.y = Math.PI / 2;
  outCollar.position.set(0.54, 0.56, 0);
  group.add(outCollar);

  // Single slow document sheet being sucked out of Buffer -> Printer!
  const feedSheet = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.32, 0.03, 0.24)), docMats);
  group.add(feedSheet);

  const _tmpPos = new THREE.Vector3();

  return {
    group,
    update(animT: number, dt: number) {
      // Fast bursts arriving from Bus up the left glass pipe!
      fastCapsules.forEach((cap, i) => {
        const u = (animT * 1.35 + i * 0.33) % 1;
        intakeCurve.getPointAt(u, _tmpPos);
        cap.position.copy(_tmpPos);
        cap.rotation.y = animT * 4;
      });

      // Queued documents gently shift down as Printer slowly consumes 1 sheet at a time
      const queueCount = 2 + Math.floor(2.9 * (0.5 + 0.5 * Math.sin(animT * 1.1)));
      queuedDocs.forEach((doc, i) => {
        const active = i < queueCount;
        doc.scale.y = THREE.MathUtils.damp(doc.scale.y, active ? 1 : 0.04, 8, dt);
        doc.visible = doc.scale.y > 0.08;
      });

      gaugeMats.forEach((m, i) => {
        const lit = i < queueCount - 1;
        m.emissiveIntensity = lit ? 0.85 : 0.06;
      });

      // Slow steady document moving through right chute into Printer
      const slowU = (animT * 0.42) % 1;
      outCurve.getPointAt(slowU, _tmpPos);
      feedSheet.position.copy(_tmpPos);
    },
  };
}
