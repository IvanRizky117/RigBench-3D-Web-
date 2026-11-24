import * as THREE from 'three';
import type { DioramaResourceTracker } from './theaterDioramaCore';

export interface BuiltStylizedDeskPc {
  group: THREE.Group;
  screenMat: THREE.MeshStandardMaterial;
  chair: THREE.Group;
}

/**
 * Builds a cute stylized Pixar/Roblox miniature computer desk (desk + legs +
 * monitor + keyboard + mouse + swivel chair) with controllable screen power state.
 */
export function buildStylizedDeskPc(
  tracker: DioramaResourceTracker,
  opts?: {
    deskHex?: number;
    caseHex?: number;
    screenHex?: number;
    screenOn?: boolean;
    dualMonitor?: boolean;
  }
): BuiltStylizedDeskPc {
  const deskHex = opts?.deskHex ?? 0xd9a066;
  const caseHex = opts?.caseHex ?? 0x334155;
  const screenHex = opts?.screenHex ?? 0x38bdf8;
  const screenOn = opts?.screenOn ?? true;

  const group = new THREE.Group();
  const woodMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: deskHex, roughness: 0.72, metalness: 0.05 })
  );
  const legMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.42, metalness: 0.45 })
  );
  const caseMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: caseHex, roughness: 0.45, metalness: 0.28 })
  );
  const screenMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: screenOn ? screenHex : 0x1e293b,
      emissive: screenOn ? screenHex : 0x000000,
      emissiveIntensity: screenOn ? 0.65 : 0.0,
      roughness: 0.16,
      metalness: 0.12,
    })
  );

  // Desk tabletop & 4 legs
  const top = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(1.38, 0.08, 0.74)), woodMat);
  top.position.y = 0.62;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  const legGeo = tracker.geo(new THREE.BoxGeometry(0.07, 0.6, 0.07));
  for (const [lx, lz] of [
    [-0.6, -0.28],
    [0.6, -0.28],
    [-0.6, 0.28],
    [0.6, 0.28],
  ] as const) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(lx, 0.3, lz);
    leg.castShadow = true;
    group.add(leg);
  }

  // Monitor(s)
  const addMonitor = (ox: number, rotY: number) => {
    const mon = new THREE.Group();
    mon.position.set(ox, 0.66, -0.18);
    mon.rotation.y = rotY;
    const stand = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.12, 0.16, 0.1)), legMat);
    stand.position.y = 0.08;
    mon.add(stand);
    const bezel = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.68, 0.44, 0.06)), caseMat);
    bezel.position.y = 0.34;
    bezel.castShadow = true;
    mon.add(bezel);
    const panel = new THREE.Mesh(tracker.geo(new THREE.PlaneGeometry(0.6, 0.36)), screenMat);
    panel.position.set(0, 0.34, 0.034);
    mon.add(panel);
    group.add(mon);
  };

  if (opts?.dualMonitor) {
    addMonitor(-0.32, 0.2);
    addMonitor(0.32, -0.2);
  } else {
    addMonitor(0, 0);
  }

  // Keyboard & mouse
  const kb = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.46, 0.03, 0.16)), caseMat);
  kb.position.set(-0.08, 0.675, 0.14);
  group.add(kb);
  const mouse = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.08, 0.03, 0.12)), caseMat);
  mouse.position.set(0.26, 0.675, 0.14);
  group.add(mouse);

  // Cute mini tower next to monitor
  const tower = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.22, 0.44, 0.4)), caseMat);
  tower.position.set(0.5, 0.88, -0.08);
  tower.castShadow = true;
  group.add(tower);

  // Swivel chair
  const chair = new THREE.Group();
  chair.position.set(0, 0, 0.56);
  const chairMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.72, metalness: 0.05 })
  );
  const seat = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.44, 0.08, 0.42)), chairMat);
  seat.position.y = 0.36;
  seat.castShadow = true;
  chair.add(seat);
  const back = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.44, 0.42, 0.08)), chairMat);
  back.position.set(0, 0.58, 0.18);
  back.castShadow = true;
  chair.add(back);
  const pole = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.04, 0.04, 0.34, 8)), legMat);
  pole.position.y = 0.18;
  chair.add(pole);
  const base = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.22, 0.24, 0.05, 10)), legMat);
  base.position.y = 0.025;
  chair.add(base);
  group.add(chair);

  return { group, screenMat, chair };
}

export interface BuiltPrinterProp {
  group: THREE.Group;
  paper: THREE.Mesh;
  statusMat: THREE.MeshStandardMaterial;
}

/**
 * Cute stylized office printer that animates paper sheets sliding out.
 */
export function buildStylizedPrinter(tracker: DioramaResourceTracker): BuiltPrinterProp {
  const group = new THREE.Group();
  const bodyMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.42, metalness: 0.08 })
  );
  const accentMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5, metalness: 0.22 })
  );
  const statusMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.7,
      roughness: 0.25,
    })
  );

  const stand = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.95, 0.48, 0.72)), accentMat);
  stand.position.y = 0.24;
  stand.castShadow = true;
  stand.receiveShadow = true;
  group.add(stand);

  const housing = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.86, 0.36, 0.64)), bodyMat);
  housing.position.y = 0.66;
  housing.castShadow = true;
  group.add(housing);

  const topTray = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.56, 0.16, 0.12)), accentMat);
  topTray.position.set(0, 0.88, -0.2);
  topTray.rotation.x = -0.22;
  group.add(topTray);

  const led = new THREE.Mesh(tracker.geo(new THREE.SphereGeometry(0.045, 8, 8)), statusMat);
  led.position.set(0.32, 0.76, 0.32);
  group.add(led);

  const paper = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.46, 0.015, 0.38)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 }))
  );
  paper.position.set(0, 0.64, 0.32);
  group.add(paper);

  return { group, paper, statusMat };
}

/**
 * Builds a cute miniature potted plant to make rooms feel alive and cozy.
 */
export function buildPottedPlant(tracker: DioramaResourceTracker): THREE.Group {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.18, 0.13, 0.28, 10)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.78 }))
  );
  pot.position.y = 0.14;
  pot.castShadow = true;
  g.add(pot);

  const leafMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.68 })
  );
  const puffGeo = tracker.geo(new THREE.DodecahedronGeometry(0.18, 0));
  for (const [x, y, z, s] of [
    [0, 0.42, 0, 1.0],
    [-0.12, 0.36, 0.08, 0.72],
    [0.12, 0.38, -0.06, 0.78],
  ] as const) {
    const leaf = new THREE.Mesh(puffGeo, leafMat);
    leaf.position.set(x, y, z);
    leaf.scale.setScalar(s);
    leaf.castShadow = true;
    g.add(leaf);
  }
  return g;
}

/**
 * Builds a glowing stylized server rack cabinet with blinking status LEDs.
 */
export function buildServerRack(
  tracker: DioramaResourceTracker,
  height = 1.65,
  ledHex = 0x38bdf8
): { group: THREE.Group; leds: THREE.MeshStandardMaterial[] } {
  const group = new THREE.Group();
  const cabMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.48 })
  );
  const trimMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.38, metalness: 0.55 })
  );

  const body = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.76, height, 0.68)), cabMat);
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const leds: THREE.MeshStandardMaterial[] = [];
  const rows = Math.max(3, Math.floor(height * 3));
  for (let i = 0; i < rows; i++) {
    const y = 0.22 + i * ((height - 0.36) / rows);
    const blade = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.64, 0.12, 0.04)), trimMat);
    blade.position.set(0, y, 0.34);
    group.add(blade);

    const ledMat = tracker.mat(
      new THREE.MeshStandardMaterial({
        color: ledHex,
        emissive: ledHex,
        emissiveIntensity: 0.75,
        roughness: 0.2,
      })
    );
    const led = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.1, 0.04, 0.03)), ledMat);
    led.position.set(0.22, y, 0.365);
    group.add(led);
    leds.push(ledMat);
  }

  return { group, leds };
}

/**
 * Builds a cute zippy miniature kart (RISC) or heavy cargo truck (CISC) for the
 * Modul 1 instruction-set race track.
 */
export function buildRaceVehicle(
  tracker: DioramaResourceTracker,
  kind: 'risc-kart' | 'cisc-truck'
): { group: THREE.Group; wheels: THREE.Mesh[] } {
  const group = new THREE.Group();
  const wheelMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.82 })
  );
  const wheels: THREE.Mesh[] = [];

  if (kind === 'risc-kart') {
    const bodyMat = tracker.mat(
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.35, metalness: 0.25 })
    );
    const nose = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.92, 0.24, 0.56)), bodyMat);
    nose.position.set(0, 0.24, 0);
    nose.castShadow = true;
    group.add(nose);

    const spoiler = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(0.12, 0.2, 0.58)),
      tracker.mat(new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 }))
    );
    spoiler.position.set(-0.42, 0.4, 0);
    group.add(spoiler);

    const wGeo = tracker.geo(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 12));
    for (const [wx, wz] of [
      [-0.3, -0.32],
      [0.3, -0.32],
      [-0.3, 0.32],
      [0.3, 0.32],
    ] as const) {
      const w = new THREE.Mesh(wGeo, wheelMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(wx, 0.14, wz);
      group.add(w);
      wheels.push(w);
    }
  } else {
    const cabMat = tracker.mat(
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.42, metalness: 0.2 })
    );
    const cargoMat = tracker.mat(
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.62, metalness: 0.1 })
    );
    const cab = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.55, 0.56, 0.72)), cabMat);
    cab.position.set(0.45, 0.46, 0);
    cab.castShadow = true;
    group.add(cab);

    const cargo = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(1.05, 0.76, 0.78)), cargoMat);
    cargo.position.set(-0.36, 0.58, 0);
    cargo.castShadow = true;
    group.add(cargo);

    const wGeo = tracker.geo(new THREE.CylinderGeometry(0.19, 0.19, 0.12, 12));
    for (const [wx, wz] of [
      [-0.62, -0.4],
      [0.02, -0.4],
      [0.48, -0.4],
      [-0.62, 0.4],
      [0.02, 0.4],
      [0.48, 0.4],
    ] as const) {
      const w = new THREE.Mesh(wGeo, wheelMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(wx, 0.19, wz);
      group.add(w);
      wheels.push(w);
    }
  }

  return { group, wheels };
}

/**
 * Builds a clean diegetic wall clock/schedule canvas texture for the OS t0-t5 office wall
 * (small natural wall prop, never a giant floating subtitle-blocking board).
 */
export function createOsWallBoardTexture(
  tracker: DioramaResourceTracker
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FFFDF7';
    ctx.fillRect(0, 0, 768, 320);
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 756, 308);

    // Header band
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(14, 14, 740, 56);
    ctx.fillStyle = '#FEF08A';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAPAN JADWAL KERJA OS   ( t0  →  t5 )', 384, 42);

    // Row guides
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(22, 178, 724, 3);
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ATAS: CPU KERJA', 28, 94);
    ctx.fillText('BAWAH: TUGAS OS', 28, 294);

    const slots = [
      { top: 't0 - t1', bot: 'OS Siap', x: 28, y: 196, w: 130, col: '#D97706' },
      { top: 't1 - t2', bot: 'CPU Kerja', x: 170, y: 108, w: 134, col: '#0284C7' },
      { top: 't2 - t3', bot: 'Ambil Disk', x: 316, y: 196, w: 134, col: '#D97706' },
      { top: 't3 - t4', bot: 'CPU Hitung', x: 462, y: 108, w: 134, col: '#059669' },
      { top: 't4 - t5', bot: 'Cetak Print', x: 608, y: 196, w: 134, col: '#9333EA' },
    ];
    ctx.textAlign = 'center';
    for (const s of slots) {
      ctx.fillStyle = s.col;
      ctx.fillRect(s.x, s.y, s.w, 66);
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 3;
      ctx.strokeRect(s.x, s.y, s.w, 66);

      ctx.fillStyle = '#FEF08A';
      ctx.font = 'bold 19px sans-serif';
      ctx.fillText(s.top, s.x + s.w / 2, s.y + 22);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(s.bot, s.x + s.w / 2, s.y + 48);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tracker.tex(tex);
}
