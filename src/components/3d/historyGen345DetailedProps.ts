import * as THREE from 'three';
import type { DioramaResourceTracker } from './theaterDioramaCore';
import { buildStorySignPlate } from './storyLabelKit';

function makeCanvasTex(
  tracker: DioramaResourceTracker,
  maxAniso: number,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx, w, h);
  const tex = tracker.tex(new THREE.CanvasTexture(canvas));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  tex.needsUpdate = true;
  return tex;
}

export interface BuiltGen3Hardware {
  wafer: THREE.Mesh;
  dipGroup: THREE.Group;
  update: (animT: number) => void;
}

/**
 * Gen 3: Jack Kilby's DIP IC with real metallic legs on PCB + Quartz-to-Silicon wafer,
 * plus an animated Multi-Window Operating System (OS) monitor!
 */
export function buildDetailedGen3Hardware(
  tracker: DioramaResourceTracker,
  maxAniso: number,
  g3: THREE.Group
): BuiltGen3Hardware {
  const darkEpoxyMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.36, metalness: 0.12 })
  );
  const pcbMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.48, metalness: 0.15 })
  );
  const silverPinMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.18, metalness: 0.9 })
  );
  const goldMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.24, metalness: 0.85 })
  );

  // 1) IC Pedestal + Quartz Sand Crystal + Silicon Wafer + Real 12-Pin DIP IC
  const icStand = new THREE.Group();
  icStand.position.set(-1.5, 0.16, -0.78);
  g3.add(icStand);

  const ped = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(1.36, 0.64, 0.96)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }))
  );
  ped.position.y = 0.32;
  ped.castShadow = true;
  icStand.add(ped);

  const icSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'CHIP IC · JACK KILBY (1958)',
    subtitle: 'PASIR KUARSA → WAFER SILIKON',
    bgHex: '#0C4A6E',
    fgHex: '#FEF08A',
    subHex: '#BAE6FD',
    borderHex: '#38BDF8',
    width: 1.28,
    height: 0.36,
    texW: 360,
    texH: 88,
    titlePx: 22,
    subPx: 18,
  });
  icSign.position.set(0, 0.32, 0.495);
  icStand.add(icSign);

  // Tiny quartz crystal cluster on corner to show "dari pasir kuarsa"
  const quartzMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.25,
      roughness: 0.15,
      metalness: 0.2,
    })
  );
  for (let q = 0; q < 3; q++) {
    const crys = new THREE.Mesh(tracker.geo(new THREE.ConeGeometry(0.06, 0.18, 6)), quartzMat);
    crys.position.set(-0.5 + q * 0.07, 0.72, 0.26);
    crys.rotation.z = (q - 1) * 0.22;
    icStand.add(crys);
  }

  // Gleaming etched Silicon Wafer base
  const waferTex = makeCanvasTex(tracker, maxAniso, 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 2;
    for (let g = 16; g < w; g += 24) {
      ctx.beginPath();
      ctx.moveTo(g, 0);
      ctx.lineTo(g, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, g);
      ctx.lineTo(w, g);
      ctx.stroke();
    }
  });
  const wafer = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.46, 0.46, 0.045, 24)),
    tracker.mat(new THREE.MeshStandardMaterial({ map: waferTex, roughness: 0.18, metalness: 0.75 }))
  );
  wafer.position.set(0.08, 0.67, -0.02);
  icStand.add(wafer);

  // Green PCB Socket Board + Real 12-Pin DIP Integrated Circuit
  const dipGroup = new THREE.Group();
  dipGroup.position.set(0.08, 0.76, -0.02);
  icStand.add(dipGroup);

  const pcb = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.82, 0.05, 0.56)), pcbMat);
  pcb.position.y = 0.025;
  dipGroup.add(pcb);

  const icBody = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.62, 0.14, 0.3)), darkEpoxyMat);
  icBody.position.y = 0.16;
  icBody.castShadow = true;
  dipGroup.add(icBody);

  const icTopTex = makeCanvasTex(tracker, maxAniso, 256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#38BDF8';
    ctx.font = '900 28px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('IC SILIKON', w / 2, 56);
    ctx.fillStyle = '#FEF08A';
    ctx.font = '800 20px "JetBrains Mono", monospace';
    ctx.fillText('JACK KILBY · 58', w / 2, 94);
  });
  const icTop = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(0.58, 0.26)),
    tracker.mat(new THREE.MeshStandardMaterial({ map: icTopTex, roughness: 0.3 }))
  );
  icTop.rotation.x = -Math.PI / 2;
  icTop.position.y = 0.232;
  dipGroup.add(icTop);

  // 12 Bent metallic DIP legs (6 front + 6 back) with gold solder pads on PCB
  const legUpperGeo = tracker.geo(new THREE.BoxGeometry(0.032, 0.03, 0.055));
  const legDownGeo = tracker.geo(new THREE.BoxGeometry(0.026, 0.13, 0.024));
  const padGeo = tracker.geo(new THREE.CylinderGeometry(0.028, 0.028, 0.015, 8));
  for (let p = 0; p < 6; p++) {
    const px = -0.22 + p * 0.088;
    for (const side of [-1, 1] as const) {
      const shoulder = new THREE.Mesh(legUpperGeo, silverPinMat);
      shoulder.position.set(px, 0.14, side * 0.165);
      dipGroup.add(shoulder);

      const leg = new THREE.Mesh(legDownGeo, silverPinMat);
      leg.position.set(px, 0.09, side * 0.19);
      dipGroup.add(leg);

      const pad = new THREE.Mesh(padGeo, goldMat);
      pad.position.set(px, 0.052, side * 0.19);
      dipGroup.add(pad);
    }
  }

  // 2) Live Multi-Program Operating System (OS) Monitor Station (Right side)
  const osDeskGroup = new THREE.Group();
  osDeskGroup.position.set(1.25, 0.16, -0.85);
  osDeskGroup.rotation.y = -0.35;
  g3.add(osDeskGroup);

  const woodMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xb48456, roughness: 0.72, metalness: 0.05 })
  );
  const legMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.42, metalness: 0.45 })
  );
  const deskTop = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(1.45, 0.08, 0.78)), woodMat);
  deskTop.position.y = 0.62;
  deskTop.castShadow = true;
  osDeskGroup.add(deskTop);
  for (const [lx, lz] of [
    [-0.62, -0.3],
    [0.62, -0.3],
    [-0.62, 0.3],
    [0.62, 0.3],
  ] as const) {
    const leg = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.07, 0.6, 0.07)), legMat);
    leg.position.set(lx, 0.3, lz);
    osDeskGroup.add(leg);
  }

  // Dynamic OS Multi-Tasking Canvas Screen
  const osCanvas = document.createElement('canvas');
  osCanvas.width = 360;
  osCanvas.height = 220;
  const osCtx = osCanvas.getContext('2d');
  const osTex = tracker.tex(new THREE.CanvasTexture(osCanvas), true);
  osTex.colorSpace = THREE.SRGBColorSpace;
  osTex.anisotropy = maxAniso;

  const drawOsScreen = (phase: number) => {
    if (!osCtx) return;
    osCtx.fillStyle = '#0F172A';
    osCtx.fillRect(0, 0, 360, 220);
    // Top OS Taskbar
    osCtx.fillStyle = '#0284C7';
    osCtx.fillRect(0, 0, 360, 34);
    osCtx.fillStyle = '#FEF08A';
    osCtx.font = '900 18px "JetBrains Mono", monospace';
    osCtx.textAlign = 'left';
    osCtx.fillText('SISTEM OPERASI · MULTI-PROGRAM', 12, 23);

    const tasks = [
      { name: '1. HITUNG', col: '#38BDF8', y: 46, p: (phase * 0.45) % 1 },
      { name: '2. DATA', col: '#10B981', y: 102, p: (phase * 0.32 + 0.35) % 1 },
      { name: '3. PRINT', col: '#F59E0B', y: 158, p: (phase * 0.25 + 0.7) % 1 },
    ];
    for (const t of tasks) {
      osCtx.fillStyle = '#1E293B';
      osCtx.fillRect(14, t.y, 332, 46);
      osCtx.strokeStyle = t.col;
      osCtx.lineWidth = 3;
      osCtx.strokeRect(14, t.y, 332, 46);
      osCtx.fillStyle = '#F8FAFC';
      osCtx.font = '800 16px "JetBrains Mono", monospace';
      osCtx.fillText(t.name, 24, t.y + 20);
      osCtx.fillStyle = '#334155';
      osCtx.fillRect(24, t.y + 28, 308, 10);
      osCtx.fillStyle = t.col;
      osCtx.fillRect(24, t.y + 28, Math.max(18, 308 * t.p), 10);
    }
    osTex.needsUpdate = true;
  };
  drawOsScreen(0);

  const monStand = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.16, 0.16, 0.14)), legMat);
  monStand.position.set(0, 0.74, -0.18);
  osDeskGroup.add(monStand);
  const monBezel = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(1.1, 0.68, 0.12)), darkEpoxyMat);
  monBezel.position.set(0, 1.12, -0.18);
  monBezel.castShadow = true;
  osDeskGroup.add(monBezel);
  const monScreen = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(0.98, 0.58)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        map: osTex,
        emissiveMap: osTex,
        emissive: 0xffffff,
        emissiveIntensity: 0.42,
      })
    )
  );
  monScreen.position.set(0, 1.12, -0.115);
  osDeskGroup.add(monScreen);

  const kb = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.56, 0.04, 0.2)), legMat);
  kb.position.set(0, 0.68, 0.15);
  osDeskGroup.add(kb);

  const osDeskSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'SISTEM OPERASI (OS)',
    subtitle: 'ATUR BANYAK PROGRAM BARENGAN',
    bgHex: '#0F172A',
    fgHex: '#38BDF8',
    subHex: '#E2E8F0',
    borderHex: '#38BDF8',
    width: 1.32,
    height: 0.34,
    texW: 340,
    texH: 84,
    titlePx: 23,
    subPx: 17,
  });
  osDeskSign.position.set(0, 0.34, 0.36);
  osDeskGroup.add(osDeskSign);

  let lastFrame = -1;

  return {
    wafer,
    dipGroup,
    update(animT: number) {
      wafer.rotation.y = animT * 0.7;
      dipGroup.position.y = 0.77 + Math.sin(animT * 2.2) * 0.03;
      const osFps = tracker.textureScale < 1 ? 3 : 8;
      const step = Math.floor(animT * osFps);
      if (step !== lastFrame) {
        lastFrame = step;
        drawOsScreen(animT);
      }
    },
  };
}

export interface BuiltGen4Hardware {
  chipTurntable: THREE.Group;
  update: (animT: number) => void;
}

/**
 * Gen 4: Detailed Intel 4004 VLSI Microprocessor seated on a motherboard socket pedestal
 * (with 16 gold pins!) + Home PC / Apple Macintosh GUI screen & Mouse.
 */
export function buildDetailedGen4Hardware(
  tracker: DioramaResourceTracker,
  maxAniso: number,
  g4: THREE.Group
): BuiltGen4Hardware {
  const goldMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.22, metalness: 0.88 })
  );
  const ceramicMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.36, metalness: 0.08 })
  );
  const pcbMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.45, metalness: 0.18 })
  );

  // 1) Intel 4004 Microprocessor Pedestal (Right side: replaces floating yellow square!)
  const cpuPed = new THREE.Group();
  cpuPed.position.set(1.52, 0.16, -0.68);
  g4.add(cpuPed);

  const pedBox = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(1.22, 0.62, 0.92)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.55 }))
  );
  pedBox.position.y = 0.31;
  pedBox.castShadow = true;
  cpuPed.add(pedBox);

  const cpuSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'INTEL 4004 · 1971',
    subtitle: 'MIKROPROSESOR VLSI · 16 PIN EMAS',
    bgHex: '#78350F',
    fgHex: '#FEF08A',
    subHex: '#FDE68A',
    borderHex: '#F59E0B',
    width: 1.18,
    height: 0.35,
    texW: 340,
    texH: 88,
    titlePx: 23,
    subPx: 17,
  });
  cpuSign.position.set(0, 0.31, 0.475);
  cpuPed.add(cpuSign);

  const chipTurntable = new THREE.Group();
  chipTurntable.position.set(0, 0.63, 0);
  cpuPed.add(chipTurntable);

  // Green Motherboard Socket Platform
  const moboTile = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.92, 0.06, 0.68)), pcbMat);
  moboTile.position.y = 0.03;
  chipTurntable.add(moboTile);

  const socket = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.76, 0.07, 0.38)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }))
  );
  socket.position.y = 0.09;
  chipTurntable.add(socket);

  // Classic White-Ceramic + Gold-Cap Intel 4004 Package + 16 Gold Pins!
  const pkg = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.68, 0.1, 0.3)), ceramicMat);
  pkg.position.y = 0.22;
  pkg.castShadow = true;
  chipTurntable.add(pkg);

  const lidTex = makeCanvasTex(tracker, maxAniso, 256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = '#1E293B';
    ctx.font = '900 28px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('INTEL 4004', w / 2, 54);
    ctx.fillStyle = '#451A03';
    ctx.font = '800 18px "JetBrains Mono", monospace';
    ctx.fillText('CPU + MEM + I/O', w / 2, 92);
  });
  const goldCap = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.5, 0.03, 0.22)),
    tracker.mat(new THREE.MeshStandardMaterial({ map: lidTex, roughness: 0.26, metalness: 0.55 }))
  );
  goldCap.position.y = 0.285;
  chipTurntable.add(goldCap);

  const pinGeo = tracker.geo(new THREE.BoxGeometry(0.025, 0.13, 0.025));
  for (let i = 0; i < 8; i++) {
    const px = -0.28 + i * 0.08;
    for (const pz of [-0.17, 0.17]) {
      const pin = new THREE.Mesh(pinGeo, goldMat);
      pin.position.set(px, 0.15, pz);
      chipTurntable.add(pin);
    }
  }

  // 2) Home PC Desk with Live GUI Screen & Retro Mouse (Left side)
  const desk = new THREE.Group();
  desk.position.set(-0.72, 0.16, -0.82);
  desk.rotation.y = 0.24;
  g4.add(desk);

  const woodMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x9a6b41, roughness: 0.72, metalness: 0.05 })
  );
  const creamPlastic = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xe7e5e4, roughness: 0.42, metalness: 0.06 })
  );
  const darkSlate = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.3 })
  );

  const top = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(1.52, 0.08, 0.8)), woodMat);
  top.position.y = 0.62;
  top.castShadow = true;
  desk.add(top);
  for (const [lx, lz] of [
    [-0.66, -0.32],
    [0.66, -0.32],
    [-0.66, 0.32],
    [0.66, 0.32],
  ] as const) {
    const leg = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.07, 0.6, 0.07)), darkSlate);
    leg.position.set(lx, 0.3, lz);
    desk.add(leg);
  }

  // Classic Desktop Tower + CRT/LCD GUI Monitor
  const tower = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.24, 0.48, 0.42)), creamPlastic);
  tower.position.set(0.55, 0.9, -0.1);
  tower.castShadow = true;
  desk.add(tower);

  const monStand = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.24, 0.12, 0.2)), creamPlastic);
  monStand.position.set(-0.12, 0.72, -0.14);
  desk.add(monStand);

  const monBody = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.86, 0.64, 0.38)), creamPlastic);
  monBody.position.set(-0.12, 1.08, -0.18);
  monBody.castShadow = true;
  desk.add(monBody);

  // Dynamic Macintosh/PC GUI Canvas with animated pointer arrow!
  const guiCanvas = document.createElement('canvas');
  guiCanvas.width = 320;
  guiCanvas.height = 220;
  const guiCtx = guiCanvas.getContext('2d');
  const guiTex = tracker.tex(new THREE.CanvasTexture(guiCanvas), true);
  guiTex.colorSpace = THREE.SRGBColorSpace;
  guiTex.anisotropy = maxAniso;

  const drawGui = (t: number) => {
    if (!guiCtx) return;
    guiCtx.fillStyle = '#93C5FD';
    guiCtx.fillRect(0, 0, 320, 220);
    // Top menu bar
    guiCtx.fillStyle = '#F8FAFC';
    guiCtx.fillRect(0, 0, 320, 26);
    guiCtx.fillStyle = '#0F172A';
    guiCtx.font = '900 15px sans-serif';
    guiCtx.fillText('File   Edit   View   GUI', 12, 18);

    // Classic Window
    guiCtx.fillStyle = '#FFFFFF';
    guiCtx.fillRect(24, 42, 196, 152);
    guiCtx.strokeStyle = '#0F172A';
    guiCtx.lineWidth = 4;
    guiCtx.strokeRect(24, 42, 196, 152);
    guiCtx.fillStyle = '#1E293B';
    guiCtx.fillRect(24, 42, 196, 24);
    guiCtx.fillStyle = '#FEF08A';
    guiCtx.font = '800 13px "JetBrains Mono", monospace';
    guiCtx.fillText('IBM PC / MAC GUI', 34, 59);

    // Folder icons on desktop
    for (let f = 0; f < 2; f++) {
      const fy = 52 + f * 66;
      guiCtx.fillStyle = '#FACC15';
      guiCtx.fillRect(246, fy, 46, 36);
      guiCtx.strokeStyle = '#78350F';
      guiCtx.lineWidth = 2;
      guiCtx.strokeRect(246, fy, 46, 36);
      guiCtx.fillStyle = '#0F172A';
      guiCtx.font = '700 12px sans-serif';
      guiCtx.fillText(f === 0 ? 'Docs' : 'Apps', 253, fy + 50);
    }

    // Animated cursor arrow
    const cx = 110 + Math.sin(t * 2.2) * 58;
    const cy = 120 + Math.cos(t * 1.7) * 32;
    guiCtx.fillStyle = '#0F172A';
    guiCtx.beginPath();
    guiCtx.moveTo(cx, cy);
    guiCtx.lineTo(cx, cy + 22);
    guiCtx.lineTo(cx + 16, cy + 16);
    guiCtx.closePath();
    guiCtx.fill();
    guiTex.needsUpdate = true;
  };
  drawGui(0);

  const guiScreen = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(0.72, 0.48)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        map: guiTex,
        emissiveMap: guiTex,
        emissive: 0xffffff,
        emissiveIntensity: 0.32,
      })
    )
  );
  guiScreen.position.set(-0.12, 1.08, 0.015);
  desk.add(guiScreen);

  // Keyboard + oversized readable Mouse + Mousepad
  const kb = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.62, 0.04, 0.2)), creamPlastic);
  kb.position.set(-0.18, 0.68, 0.16);
  desk.add(kb);

  const pad = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.28, 0.015, 0.24)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7 }))
  );
  pad.position.set(0.32, 0.668, 0.16);
  desk.add(pad);

  const mouse = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.12, 0.055, 0.17)), creamPlastic);
  mouse.position.set(0.32, 0.7, 0.16);
  mouse.castShadow = true;
  desk.add(mouse);

  const pcSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'IBM PC & MAC GUI',
    subtitle: 'KOMPUTER MEJA RUMAHAN + MOUSE',
    bgHex: '#1E293B',
    fgHex: '#FEF08A',
    subHex: '#BAE6FD',
    borderHex: '#F59E0B',
    width: 1.38,
    height: 0.34,
    texW: 360,
    texH: 84,
    titlePx: 23,
    subPx: 17,
  });
  pcSign.position.set(0, 0.34, 0.42);
  desk.add(pcSign);

  let lastGuiStep = -1;

  return {
    chipTurntable,
    update(animT: number) {
      chipTurntable.rotation.y = Math.sin(animT * 0.75) * 0.45;
      const guiFps = tracker.textureScale < 1 ? 3.5 : 10;
      const step = Math.floor(animT * guiFps);
      if (step !== lastGuiStep) {
        lastGuiStep = step;
        drawGui(animT);
      }
      mouse.position.x = 0.32 + Math.sin(animT * 2.2) * 0.04;
      mouse.position.z = 0.16 + Math.cos(animT * 1.7) * 0.03;
    },
  };
}

export interface BuiltGen5Hardware {
  aiCore: THREE.Mesh;
  aiRingA: THREE.Mesh;
  aiRingB: THREE.Mesh;
  update: (animT: number) => void;
}

/**
 * Gen 5: Futuristik Glass AI Dome + 5 Parallel CPU Nodes sending concurrent pulses
 * + Cryogenic Superconductor Cooling Pipes + ICOT Japan Badge.
 */
export function buildDetailedGen5Hardware(
  tracker: DioramaResourceTracker,
  maxAniso: number,
  g5: THREE.Group
): BuiltGen5Hardware {
  const aiStage = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(3.3, 3.6, 0.24, 32)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.34, metalness: 0.25 }))
  );
  aiStage.position.y = 0.12;
  aiStage.receiveShadow = true;
  g5.add(aiStage);

  // Cryogenic Superconductor Cooling Ring & Frost Pipes around stage floor
  const cryoMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.55,
      roughness: 0.18,
      metalness: 0.45,
    })
  );
  const cryoRing = new THREE.Mesh(tracker.geo(new THREE.TorusGeometry(2.65, 0.1, 10, 40)), cryoMat);
  cryoRing.rotation.x = Math.PI / 2;
  cryoRing.position.set(0.25, 0.3, -0.35);
  g5.add(cryoRing);

  // Futuristic Glass Geodesic Dome enclosing the AI Core + Parallel CPUs
  const domeMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.18,
      roughness: 0.08,
      metalness: 0.1,
      depthWrite: false,
    })
  );
  const glassDome = new THREE.Mesh(
    tracker.geo(new THREE.SphereGeometry(2.65, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5)),
    domeMat
  );
  glassDome.position.set(0.25, 0.24, -0.35);
  g5.add(glassDome);

  const ribMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.78 })
  );
  for (let r = 0; r < 6; r++) {
    const rib = new THREE.Mesh(
      tracker.geo(new THREE.TorusGeometry(2.67, 0.032, 6, 32, Math.PI)),
      ribMat
    );
    rib.position.set(0.25, 0.24, -0.35);
    rib.rotation.y = (r / 6) * Math.PI;
    g5.add(rib);
  }

  // Central AI Brain Core + Rings
  const aiCore = new THREE.Mesh(
    tracker.geo(new THREE.IcosahedronGeometry(0.56, 1)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x7c3aed,
        emissiveIntensity: 0.75,
        roughness: 0.18,
        metalness: 0.4,
      })
    )
  );
  aiCore.position.set(0.25, 1.48, -0.35);
  g5.add(aiCore);

  const aiRingA = new THREE.Mesh(
    tracker.geo(new THREE.TorusGeometry(0.88, 0.048, 8, 28)),
    tracker.mat(
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.65 })
    )
  );
  aiRingA.position.set(0.25, 1.48, -0.35);
  g5.add(aiRingA);

  const aiRingB = new THREE.Mesh(
    tracker.geo(new THREE.TorusGeometry(1.12, 0.04, 8, 28)),
    tracker.mat(
      new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0xec4899, emissiveIntensity: 0.55 })
    )
  );
  aiRingB.position.set(0.25, 1.48, -0.35);
  g5.add(aiRingB);

  // 4 Cryogenic Cooling Tanks with icy-blue radiator fins along outer superconductor ring
  const tankCapMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.85 })
  );
  const tankCoreMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      emissive: 0x0284c7,
      emissiveIntensity: 0.75,
      roughness: 0.15,
      metalness: 0.3,
    })
  );
  const tankAngles = [Math.PI * 0.22, Math.PI * 0.78, Math.PI * 1.22, Math.PI * 1.78];
  for (const ta of tankAngles) {
    const tx = 0.25 + Math.cos(ta) * 2.65;
    const tz = -0.35 + Math.sin(ta) * 2.65;
    const tank = new THREE.Group();
    tank.position.set(tx, 0.24, tz);

    const core = new THREE.Mesh(
      tracker.geo(new THREE.CylinderGeometry(0.14, 0.14, 0.68, 12)),
      tankCoreMat
    );
    core.position.y = 0.34;
    tank.add(core);

    const topCap = new THREE.Mesh(
      tracker.geo(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 12)),
      tankCapMat
    );
    topCap.position.y = 0.7;
    tank.add(topCap);

    for (let f = 0; f < 4; f++) {
      const fin = new THREE.Mesh(
        tracker.geo(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 12)),
        cryoMat
      );
      fin.position.y = 0.18 + f * 0.13;
      tank.add(fin);
    }
    g5.add(tank);
  }

  // 5 Parallel CPU Satellite Nodes (PCB + Gold Pins + Heatsink + CPU 1..5 Label)
  const dataCurves: THREE.CatmullRomCurve3[] = [];
  const dataPulses: THREE.Mesh[] = [];
  const nodeBaseMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.45, metalness: 0.2 })
  );
  const goldPinMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.22, metalness: 0.85 })
  );
  const heatsinkMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.65 })
  );
  const pulseMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 0.9 })
  );

  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const nx = 0.25 + Math.cos(ang) * 1.85;
    const nz = -0.35 + Math.sin(ang) * 1.85;

    const cpuMod = new THREE.Group();
    cpuMod.position.set(nx, 0.24, nz);
    g5.add(cpuMod);

    const pcb = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.56, 0.1, 0.56)), nodeBaseMat);
    pcb.position.y = 0.05;
    pcb.castShadow = true;
    cpuMod.add(pcb);

    const goldRim = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(0.46, 0.08, 0.46)),
      goldPinMat
    );
    goldRim.position.y = 0.14;
    cpuMod.add(goldRim);

    const heatBlock = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(0.4, 0.16, 0.4)),
      heatsinkMat
    );
    heatBlock.position.y = 0.26;
    heatBlock.castShadow = true;
    cpuMod.add(heatBlock);

    for (let r = -1; r <= 1; r++) {
      const fin = new THREE.Mesh(
        tracker.geo(new THREE.BoxGeometry(0.42, 0.05, 0.04)),
        tankCapMat
      );
      fin.position.set(0, 0.36, r * 0.12);
      cpuMod.add(fin);
    }

    const cpuTex = makeCanvasTex(tracker, maxAniso, 160, 88, (ctx, w, h) => {
      ctx.fillStyle = '#3B0764';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#C084FC';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, w - 6, h - 6);
      ctx.fillStyle = '#FEF08A';
      ctx.font = '900 36px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`CPU ${i + 1}`, w / 2, h / 2 + 2);
    });
    const cpuCap = new THREE.Mesh(
      tracker.geo(new THREE.PlaneGeometry(0.38, 0.2)),
      tracker.mat(new THREE.MeshStandardMaterial({ map: cpuTex, roughness: 0.3 }))
    );
    cpuCap.position.set(0, 0.28, 0.21);
    cpuMod.add(cpuCap);

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(nx, 0.64, nz),
      new THREE.Vector3((nx + 0.25) * 0.5, 1.15, (nz - 0.35) * 0.5),
      new THREE.Vector3(0.25, 1.48, -0.35),
    ]);
    dataCurves.push(curve);

    const pipe = new THREE.Mesh(
      tracker.geo(new THREE.TubeGeometry(curve, 12, 0.032, 6, false)),
      cryoMat
    );
    g5.add(pipe);

    const pulse = new THREE.Mesh(tracker.geo(new THREE.SphereGeometry(0.085, 8, 8)), pulseMat);
    g5.add(pulse);
    dataPulses.push(pulse);
  }

  // Educational Badges at base: Parallel CPU + Superkonduktor + ICOT Jepang
  const badgeLeft = buildStorySignPlate(tracker, maxAniso, {
    title: 'PEMROSESAN PARALEL',
    subtitle: '5 CPU BEKERJA SERENTAK',
    bgHex: '#3B0764',
    fgHex: '#FEF08A',
    subHex: '#E9D5FF',
    borderHex: '#C084FC',
    width: 1.56,
    height: 0.38,
    texW: 340,
    texH: 88,
    titlePx: 23,
    subPx: 18,
  });
  badgeLeft.position.set(-1.35, 0.44, 2.22);
  badgeLeft.rotation.y = 0.28;
  g5.add(badgeLeft);

  const badgeRight = buildStorySignPlate(tracker, maxAniso, {
    title: 'SUPERKONDUKTOR · ICOT',
    subtitle: 'SUPER DINGIN · RISET AI JEPANG',
    bgHex: '#0C4A6E',
    fgHex: '#BAE6FD',
    subHex: '#FEF08A',
    borderHex: '#38BDF8',
    width: 1.66,
    height: 0.38,
    texW: 360,
    texH: 88,
    titlePx: 22,
    subPx: 18,
  });
  badgeRight.position.set(1.55, 0.44, 2.22);
  badgeRight.rotation.y = -0.28;
  g5.add(badgeRight);

  const _tmpPos = new THREE.Vector3();

  return {
    aiCore,
    aiRingA,
    aiRingB,
    update(animT: number) {
      aiCore.rotation.y = animT * 0.9;
      aiCore.position.y = 1.48 + Math.sin(animT * 2.4) * 0.08;
      aiRingA.rotation.x = animT * 1.1;
      aiRingA.rotation.y = animT * 0.7;
      aiRingB.rotation.y = -animT * 0.9;
      aiRingB.rotation.z = animT * 0.65;

      const u = (animT * 1.25) % 1;
      dataPulses.forEach((pulse, i) => {
        dataCurves[i].getPointAt(u, _tmpPos);
        pulse.position.copy(_tmpPos);
      });
    },
  };
}
