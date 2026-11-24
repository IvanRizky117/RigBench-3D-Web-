import * as THREE from 'three';
import type { DioramaResourceTracker } from './theaterDioramaCore';
import { buildStorySignPlate } from './storyLabelKit';
import { buildStylizedDeskPc } from './storyPropsKit';

function makeTex(
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

export interface BuiltSwErasProps {
  movingCard: THREE.Mesh;
  dbRings: THREE.Mesh[];
  orbitDevices: THREE.Group[];
  update: (animT: number) => void;
}

/**
 * Populates the 4 Software Eras Staircase (Act C of S3) with unmistakable real-world props
 * and era year headers:
 * 1) Era Pioner (1950-an): Punched card reader + perforated cards + patch cables + print-out paper
 * 2) Era Stabil (1960-70-an): Multi-platter glowing Database tower + 2 Multi-User CRT monitors
 * 3) Era Mikro (1980-an): Home PC desk + separate "SW SISTEM" & "SW APLIKASI" package boxes
 * 4) Era Modern (1990+): OOP/Expert module + high-orbiting Smartphone, Smart TV, Smart AC, Mic & Camera
 */
export function buildDetailedSwErasProps(
  tracker: DioramaResourceTracker,
  maxAniso: number,
  swErasGroup: THREE.Group,
  eraX: number[],
  eraHeights: number[]
): BuiltSwErasProps {
  const yearLabels = [
    { text: 'ERA 1 · 1950-AN', bg: '#78350F', border: '#FBBF24' },
    { text: 'ERA 2 · 1960–70-AN', bg: '#064E3B', border: '#34D399' },
    { text: 'ERA 3 · 1980-AN', bg: '#0C4A6E', border: '#38BDF8' },
    { text: 'ERA 4 · 1990–KINI', bg: '#3B0764', border: '#C084FC' },
  ];

  // Year header plate perched clearly on top-front edge of each stair platform
  eraX.forEach((sx, i) => {
    const yl = yearLabels[i];
    const plate = buildStorySignPlate(tracker, maxAniso, {
      title: yl.text,
      bgHex: yl.bg,
      fgHex: '#FEF08A',
      borderHex: yl.border,
      width: 1.85,
      height: 0.3,
      texW: 300,
      texH: 60,
      titlePx: 26,
    });
    plate.position.set(sx, eraHeights[i] + 0.16, 1.02);
    plate.rotation.x = -0.22;
    swErasGroup.add(plate);
  });

  // =========================================================================
  // TANGGA 1 (ERA PIONER 1950-AN): KARTU LUBANG + PAPAN KABEL + PRINT-OUT
  // =========================================================================
  const x1 = eraX[0];
  const y1 = eraHeights[0];
  const darkMetal = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.4 })
  );

  // Punched card reader box + patchboard
  const readerBase = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.84, 0.38, 0.56)), darkMetal);
  readerBase.position.set(x1 - 0.45, y1 + 0.19, -0.58);
  readerBase.castShadow = true;
  swErasGroup.add(readerBase);

  // Pegboard with 3 colorful curved patch cables
  const patchBoard = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.68, 0.52, 0.08)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 }))
  );
  patchBoard.position.set(x1 - 0.45, y1 + 0.64, -0.78);
  swErasGroup.add(patchBoard);

  const cableCols = [0xef4444, 0xfacc15, 0x38bdf8];
  for (let c = 0; c < 3; c++) {
    const cx = x1 - 0.64 + c * 0.18;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(cx, y1 + 0.8, -0.72),
      new THREE.Vector3(cx + 0.08, y1 + 0.64, -0.54),
      new THREE.Vector3(cx + 0.12, y1 + 0.46, -0.72),
    ]);
    const wire = new THREE.Mesh(
      tracker.geo(new THREE.TubeGeometry(curve, 10, 0.022, 6, false)),
      tracker.mat(new THREE.MeshStandardMaterial({ color: cableCols[c], roughness: 0.4 }))
    );
    swErasGroup.add(wire);
  }

  // Punched card texture with visible dark hole grid
  const punchTex = makeTex(tracker, maxAniso, 192, 112, (ctx, w, h) => {
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    ctx.fillStyle = '#1E293B';
    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 9; col++) {
        if ((r + col) % 2 === 0 || (r * col) % 3 === 1) {
          ctx.fillRect(16 + col * 18, 22 + r * 20, 10, 12);
        }
      }
    }
  });
  const cardMat = tracker.mat(new THREE.MeshStandardMaterial({ map: punchTex, roughness: 0.72 }));

  const cardStack = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.46, 0.12, 0.28)), cardMat);
  cardStack.position.set(x1 - 0.62, y1 + 0.44, -0.45);
  swErasGroup.add(cardStack);

  const movingCard = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.42, 0.02, 0.26)), cardMat);
  movingCard.position.set(x1 - 0.24, y1 + 0.4, -0.42);
  swErasGroup.add(movingCard);

  // Continuous fanfold print-out paper sheet coming out front
  const printOut = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.44, 0.02, 0.36)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }))
  );
  printOut.position.set(x1 - 0.45, y1 + 0.16, -0.2);
  printOut.rotation.x = 0.28;
  swErasGroup.add(printOut);

  // =========================================================================
  // TANGGA 2 (ERA STABIL 1960–70-AN): MENARA DATABASE + 2 MONITOR MULTI-USER
  // =========================================================================
  const x2 = eraX[1];
  const y2 = eraHeights[1];
  const dbGroup = new THREE.Group();
  dbGroup.position.set(x2 - 0.56, y2, -0.66);
  swErasGroup.add(dbGroup);

  const dbRings: THREE.Mesh[] = [];
  const platterMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.55 })
  );
  const dbRingMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 0.75,
      roughness: 0.25,
    })
  );
  for (let tier = 0; tier < 4; tier++) {
    const disc = new THREE.Mesh(
      tracker.geo(new THREE.CylinderGeometry(0.32, 0.34, 0.14, 18)),
      platterMat
    );
    disc.position.y = 0.08 + tier * 0.2;
    disc.castShadow = true;
    dbGroup.add(disc);

    const glowRing = new THREE.Mesh(
      tracker.geo(new THREE.CylinderGeometry(0.335, 0.335, 0.035, 18)),
      dbRingMat
    );
    glowRing.position.y = 0.15 + tier * 0.2;
    dbGroup.add(glowRing);
    dbRings.push(glowRing);
  }
  const dbPlate = buildStorySignPlate(tracker, maxAniso, {
    title: 'DATABASE',
    bgHex: '#064E3B',
    fgHex: '#FEF08A',
    borderHex: '#34D399',
    width: 0.64,
    height: 0.2,
    texW: 192,
    texH: 56,
    titlePx: 26,
  });
  dbPlate.position.set(0, 0.9, 0.05);
  dbGroup.add(dbPlate);

  // Two side-by-side Multi-User green CRT terminals wired to Database
  const crtTex = makeTex(tracker, maxAniso, 160, 112, (ctx, w, h) => {
    ctx.fillStyle = '#052E16';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#4ADE80';
    ctx.font = '900 18px "JetBrains Mono", monospace';
    ctx.fillText('> USER ONLINE', 12, 34);
    ctx.fillText('> REAL-TIME OK', 12, 66);
    ctx.fillText('> DB QUERY...', 12, 96);
  });
  for (const [ux, rot] of [
    [-0.25, 0.2],
    [0.25, -0.2],
  ] as const) {
    const term = new THREE.Group();
    term.position.set(x2 + ux - 0.18, y2, 0.08);
    term.rotation.y = rot;
    const body = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.38, 0.32, 0.3)), darkMetal);
    body.position.y = 0.16;
    term.add(body);
    const scr = new THREE.Mesh(
      tracker.geo(new THREE.PlaneGeometry(0.3, 0.22)),
      tracker.mat(new THREE.MeshStandardMaterial({ map: crtTex, emissiveMap: crtTex, emissive: 0xffffff, emissiveIntensity: 0.45 }))
    );
    scr.position.set(0, 0.17, 0.155);
    term.add(scr);
    swErasGroup.add(term);
  }

  // =========================================================================
  // TANGGA 3 (ERA MIKRO 1980-AN): PC + KOTAK "SW SISTEM" VS "SW APLIKASI"
  // =========================================================================
  const x3 = eraX[2];
  const y3 = eraHeights[2];
  const miniPc = buildStylizedDeskPc(tracker, { screenHex: 0x38bdf8 });
  miniPc.group.scale.setScalar(0.76);
  miniPc.group.position.set(x3 - 0.38, y3, -0.52);
  swErasGroup.add(miniPc.group);

  const sysBox = buildStorySignPlate(tracker, maxAniso, {
    title: 'SW SISTEM',
    subtitle: 'OS PENGATUR',
    bgHex: '#0C4A6E',
    fgHex: '#FEF08A',
    subHex: '#BAE6FD',
    borderHex: '#38BDF8',
    width: 0.66,
    height: 0.4,
    texW: 192,
    texH: 96,
    titlePx: 25,
    subPx: 18,
  });
  sysBox.position.set(x3 - 0.68, y3 + 0.22, 0.32);
  sysBox.rotation.y = 0.22;
  swErasGroup.add(sysBox);

  const appBox = buildStorySignPlate(tracker, maxAniso, {
    title: 'SW APLIKASI',
    subtitle: 'WORD · GAME',
    bgHex: '#78350F',
    fgHex: '#FEF08A',
    subHex: '#FDE68A',
    borderHex: '#F59E0B',
    width: 0.66,
    height: 0.4,
    texW: 192,
    texH: 96,
    titlePx: 24,
    subPx: 18,
  });
  appBox.position.set(x3 + 0.02, y3 + 0.22, 0.36);
  appBox.rotation.y = -0.15;
  swErasGroup.add(appBox);

  // =========================================================================
  // TANGGA 4 (ERA MODERN 1990+): MODUL OOP/PAKAR + ORBIT TINGGI HP/TV/AC/AI
  // =========================================================================
  const x4 = eraX[3];
  const y4 = eraHeights[3];

  // On-stage OOP & Expert System module
  const oopBase = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.84, 0.44, 0.56)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x3b0764, roughness: 0.45 }))
  );
  oopBase.position.set(x4 - 0.46, y4 + 0.22, -0.52);
  oopBase.castShadow = true;
  swErasGroup.add(oopBase);

  const oopSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'OOP & SISTEM PAKAR',
    subtitle: 'TEKNOLOGI OBJEK MODERN',
    bgHex: '#1E1B4B',
    fgHex: '#FEF08A',
    subHex: '#E9D5FF',
    borderHex: '#C084FC',
    width: 0.88,
    height: 0.34,
    texW: 280,
    texH: 88,
    titlePx: 22,
    subPx: 17,
  });
  oopSign.position.set(x4 - 0.46, y4 + 0.52, -0.22);
  swErasGroup.add(oopSign);

  // 5 High-Orbiting Iconic Models (well above character's head so face is NEVER covered!)
  const orbitDevices: THREE.Group[] = [];

  // 1) Smartphone (HP)
  const phoneGrp = new THREE.Group();
  const phoneBody = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.28, 0.5, 0.06)), darkMetal);
  phoneGrp.add(phoneBody);
  const phoneTex = makeTex(tracker, maxAniso, 128, 192, (ctx, w, h) => {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);
    const cols = ['#38BDF8', '#10B981', '#F59E0B', '#EC4899'];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        ctx.fillStyle = cols[r * 2 + c];
        ctx.fillRect(18 + c * 50, 28 + r * 52, 38, 38);
      }
    }
    ctx.fillStyle = '#FEF08A';
    ctx.font = '900 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HP', w / 2, 168);
  });
  const phoneScr = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(0.24, 0.42)),
    tracker.mat(new THREE.MeshStandardMaterial({ map: phoneTex, emissiveMap: phoneTex, emissive: 0xffffff, emissiveIntensity: 0.45 }))
  );
  phoneScr.position.z = 0.032;
  phoneGrp.add(phoneScr);
  swErasGroup.add(phoneGrp);
  orbitDevices.push(phoneGrp);

  // 2) Smart TV
  const tvGrp = new THREE.Group();
  const tvBody = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.64, 0.4, 0.06)), darkMetal);
  tvGrp.add(tvBody);
  const tvTex = makeTex(tracker, maxAniso, 224, 140, (ctx, w, h) => {
    ctx.fillStyle = '#1E1B4B';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#EC4899';
    ctx.fillRect(18, 18, 188, 66);
    ctx.fillStyle = '#FEF08A';
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SMART TV', w / 2, 118);
  });
  const tvScr = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(0.58, 0.34)),
    tracker.mat(new THREE.MeshStandardMaterial({ map: tvTex, emissiveMap: tvTex, emissive: 0xffffff, emissiveIntensity: 0.4 }))
  );
  tvScr.position.z = 0.032;
  tvGrp.add(tvScr);
  swErasGroup.add(tvGrp);
  orbitDevices.push(tvGrp);

  // 3) Smart AC Unit
  const acGrp = new THREE.Group();
  const acBody = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.64, 0.24, 0.18)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }))
  );
  acGrp.add(acBody);
  const acVent = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.54, 0.06, 0.04)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.65 }))
  );
  acVent.position.set(0, -0.07, 0.085);
  acGrp.add(acVent);
  const acBadge = buildStorySignPlate(tracker, maxAniso, {
    title: 'AC PINTAR',
    bgHex: '#0C4A6E',
    fgHex: '#BAE6FD',
    borderHex: '#38BDF8',
    width: 0.44,
    height: 0.12,
    texW: 160,
    texH: 48,
    titlePx: 22,
  });
  acBadge.position.set(0, 0.04, 0.095);
  acGrp.add(acBadge);
  swErasGroup.add(acGrp);
  orbitDevices.push(acGrp);

  // 4) Voice Recognition (Mikrofon Suara)
  const micGrp = new THREE.Group();
  const micSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'SUARA (MIC)',
    bgHex: '#064E3B',
    fgHex: '#FEF08A',
    borderHex: '#34D399',
    width: 0.56,
    height: 0.24,
    texW: 200,
    texH: 80,
    titlePx: 24,
  });
  micGrp.add(micSign);
  const micHead = new THREE.Mesh(
    tracker.geo(new THREE.SphereGeometry(0.11, 10, 8)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 0.55 }))
  );
  micHead.position.set(0, 0.22, 0);
  micGrp.add(micHead);
  swErasGroup.add(micGrp);
  orbitDevices.push(micGrp);

  // 5) Image Recognition (Kamera Gambar)
  const camGrp = new THREE.Group();
  const camSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'GAMBAR (AI)',
    bgHex: '#78350F',
    fgHex: '#FEF08A',
    borderHex: '#FBBF24',
    width: 0.58,
    height: 0.24,
    texW: 200,
    texH: 80,
    titlePx: 24,
  });
  camGrp.add(camSign);
  const lens = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.09, 0.09, 0.09, 12)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.7 }))
  );
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 0.2, 0);
  camGrp.add(lens);
  swErasGroup.add(camGrp);
  orbitDevices.push(camGrp);

  return {
    movingCard,
    dbRings,
    orbitDevices,
    update(animT: number) {
      const cardU = (animT * 0.9) % 1;
      movingCard.position.x = x1 - 0.58 + cardU * 0.36;

      dbRings.forEach((r, idx) => {
        const s = 1 + Math.sin(animT * 4 + idx * 0.8) * 0.04;
        r.scale.set(s, 1, s);
      });

      const orbitCenterY = y4 + 1.92; // Clearly above character's head!
      orbitDevices.forEach((dev, i) => {
        const ang = animT * 0.95 + (i * Math.PI * 2) / orbitDevices.length;
        dev.position.set(
          x4 + Math.cos(ang) * 1.15,
          orbitCenterY + Math.sin(animT * 2.4 + i) * 0.09,
          -0.25 + Math.sin(ang) * 0.85
        );
        dev.rotation.y = -ang * 0.25;
      });
    },
  };
}
