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

/**
 * Builds a recognizable glass vacuum tube with glowing inner filament,
 * dark anode cage, and metal pin base.
 */
function buildVacuumTubeUnit(
  tracker: DioramaResourceTracker,
  scale = 1
): { group: THREE.Group; filamentMat: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  group.scale.setScalar(scale);

  const metalMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.85 })
  );
  const baseMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.35 })
  );
  const filamentMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0xfb923c,
      emissive: 0xf97316,
      emissiveIntensity: 1.25,
      roughness: 0.2,
    })
  );
  const glassMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.34,
      roughness: 0.08,
      metalness: 0.1,
      depthWrite: false,
    })
  );

  // Bottom metal pins + socket collar (flush at y=0)
  const pinGeo = tracker.geo(new THREE.CylinderGeometry(0.014, 0.014, 0.07, 6));
  for (const [px, pz] of [
    [-0.06, 0],
    [0.06, 0],
    [0, -0.06],
    [0, 0.06],
  ] as const) {
    const pin = new THREE.Mesh(pinGeo, metalMat);
    pin.position.set(px, 0.035, pz);
    group.add(pin);
  }

  const collar = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.12, 0.13, 0.12, 14)),
    baseMat
  );
  collar.position.y = 0.13;
  group.add(collar);

  // Open anode cage (2 thin vertical side struts + top/bottom rings) so glowing filament shines clearly!
  const strutGeo = tracker.geo(new THREE.CylinderGeometry(0.012, 0.012, 0.25, 6));
  for (const sx of [-0.075, 0.075]) {
    const strut = new THREE.Mesh(strutGeo, metalMat);
    strut.position.set(sx, 0.32, 0);
    group.add(strut);
  }
  const ringMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.35, metalness: 0.75 })
  );
  const cageRingGeo = tracker.geo(new THREE.TorusGeometry(0.075, 0.012, 6, 14));
  for (const ry of [0.22, 0.43]) {
    const cr = new THREE.Mesh(cageRingGeo, ringMat);
    cr.rotation.x = Math.PI / 2;
    cr.position.y = ry;
    group.add(cr);
  }

  // Bright glowing orange filament core + heater glow halo
  const filament = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.036, 0.036, 0.24, 10)),
    filamentMat
  );
  filament.position.y = 0.33;
  group.add(filament);

  const glowTip = new THREE.Mesh(tracker.geo(new THREE.SphereGeometry(0.052, 10, 8)), filamentMat);
  glowTip.position.y = 0.44;
  group.add(glowTip);

  // Outer glass bulb + dome tip
  const glassBody = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.135, 0.125, 0.36, 14)),
    glassMat
  );
  glassBody.position.y = 0.36;
  group.add(glassBody);

  const glassTip = new THREE.Mesh(
    tracker.geo(new THREE.SphereGeometry(0.135, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5)),
    glassMat
  );
  glassTip.position.y = 0.54;
  group.add(glassTip);

  return { group, filamentMat };
}

export interface BuiltGen1Hardware {
  tubeMats: THREE.MeshStandardMaterial[];
  tapeReels: THREE.Mesh[];
  meterNeedle: THREE.Group;
  heatRings: THREE.Mesh[];
  update: (animT: number) => void;
}

/**
 * Populates S2 Gen 1 (ENIAC 18.000 Vacuum Tubes + 160kW Power/Heat Meter + EDVAC Console).
 */
export function buildDetailedGen1Hardware(
  tracker: DioramaResourceTracker,
  maxAniso: number,
  g1: THREE.Group
): BuiltGen1Hardware {
  const cabMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.48, metalness: 0.35 })
  );
  const trimMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.38, metalness: 0.55 })
  );
  const copperMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.32, metalness: 0.65 })
  );

  const tubeMats: THREE.MeshStandardMaterial[] = [];
  const tapeReels: THREE.Mesh[] = [];
  const heatRings: THREE.Mesh[] = [];

  // 5 Detailed ENIAC Racks
  for (let i = 0; i < 5; i++) {
    const cx = -3.2 + i * 1.6;
    const rack = new THREE.Group();
    rack.position.set(cx, 0.16, -2.15);
    g1.add(rack);

    const cab = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(1.38, 2.25, 0.88)), cabMat);
    cab.position.y = 1.125;
    cab.castShadow = true;
    rack.add(cab);

    // Recessed metal shelf bay displaying 3 glowing glass vacuum tubes per rack
    const bay = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(1.16, 0.66, 0.14)),
      tracker.mat(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 }))
    );
    bay.position.set(0, 1.72, 0.41);
    rack.add(bay);

    for (let t = 0; t < 3; t++) {
      const vt = buildVacuumTubeUnit(tracker, 0.82);
      vt.group.position.set(-0.34 + t * 0.34, 1.44, 0.46);
      rack.add(vt.group);
      tubeMats.push(vt.filamentMat);
    }

    // Lower patchbay switches / tape reels
    if (i === 1 || i === 3) {
      for (const rx of [-0.3, 0.3]) {
        const reel = new THREE.Mesh(
          tracker.geo(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 14)),
          tracker.mat(new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 }))
        );
        reel.rotation.x = Math.PI / 2;
        reel.position.set(rx, 0.92, 0.47);
        rack.add(reel);
        tapeReels.push(reel);
      }
    } else {
      for (let sw = 0; sw < 4; sw++) {
        const knob = new THREE.Mesh(
          tracker.geo(new THREE.CylinderGeometry(0.055, 0.055, 0.08, 8)),
          sw % 2 === 0 ? copperMat : trimMat
        );
        knob.rotation.x = Math.PI / 2;
        knob.position.set(-0.36 + sw * 0.24, 0.96, 0.46);
        rack.add(knob);
      }
    }

    // Subtle rising heat-haze rings above the 2 outer/inner tube racks
    if (i % 2 === 0) {
      const ring = new THREE.Mesh(
        tracker.geo(new THREE.TorusGeometry(0.32, 0.025, 6, 16)),
        tracker.mat(
          new THREE.MeshBasicMaterial({
            color: 0xfb923c,
            transparent: true,
            opacity: 0.42,
            depthWrite: false,
          })
        )
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(cx, 2.55, -2.0);
      g1.add(ring);
      heatRings.push(ring);
    }
  }

  // Analog "160 kW · PANAS OVEN" Power Meter mounted prominently on center rack
  const gaugeTex = makeCanvasTex(tracker, maxAniso, 256, 192, (ctx, w, h) => {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    // Red danger arc
    ctx.beginPath();
    ctx.arc(128, 118, 72, Math.PI, Math.PI * 2);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 18;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(128, 118, 72, Math.PI * 1.55, Math.PI * 2);
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 18;
    ctx.stroke();

    ctx.fillStyle = '#FEF08A';
    ctx.font = '900 28px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('160 kW', 128, 152);
    ctx.fillStyle = '#FCA5A5';
    ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('DAYA & PANAS EKSTREM', 128, 178);
  });
  const gaugePlate = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(0.95, 0.72)),
    tracker.mat(new THREE.MeshStandardMaterial({ map: gaugeTex, roughness: 0.3 }))
  );
  gaugePlate.position.set(0, 0.92, -1.67);
  g1.add(gaugePlate);

  const meterNeedle = new THREE.Group();
  meterNeedle.position.set(0, 0.84, -1.65);
  const needleArm = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.03, 0.24, 0.02)),
    tracker.mat(
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.7 })
    )
  );
  needleArm.position.y = 0.1;
  meterNeedle.add(needleArm);
  g1.add(meterNeedle);

  // Detailed EDVAC (Von Neumann) Central Console instead of plain brown box
  const edvacGroup = new THREE.Group();
  edvacGroup.position.set(0, 0.16, 0.3);
  g1.add(edvacGroup);

  const edvacDesk = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(1.7, 0.66, 0.9)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.55 }))
  );
  edvacDesk.position.y = 0.33;
  edvacDesk.castShadow = true;
  edvacGroup.add(edvacDesk);

  const edvacPanel = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(1.56, 0.36, 0.36)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.35 }))
  );
  edvacPanel.position.set(0, 0.78, -0.14);
  edvacPanel.rotation.x = 0.24;
  edvacGroup.add(edvacPanel);

  // Diagram screen on EDVAC console showing "STORED PROGRAM: CPU <-> MEMORI"
  const edvacTex = makeCanvasTex(tracker, maxAniso, 384, 128, (ctx, w, h) => {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.fillStyle = '#FEF08A';
    ctx.font = '900 24px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ARSITEKTUR VON NEUMANN', w / 2, 34);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(28, 56, 130, 50);
    ctx.fillStyle = '#10B981';
    ctx.fillRect(226, 56, 130, 50);
    ctx.fillStyle = '#0F172A';
    ctx.font = '900 22px "JetBrains Mono", monospace';
    ctx.fillText('CPU', 93, 89);
    ctx.fillText('MEMORI', 291, 89);
    ctx.fillStyle = '#FEF08A';
    ctx.font = '900 26px sans-serif';
    ctx.fillText('⇄', 192, 89);
  });
  const edvacScreen = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(1.38, 0.3)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        map: edvacTex,
        emissiveMap: edvacTex,
        emissive: 0xffffff,
        emissiveIntensity: 0.25,
      })
    )
  );
  edvacScreen.position.set(0, 0.8, 0.045);
  edvacScreen.rotation.x = -0.35;
  edvacGroup.add(edvacScreen);

  const edvacSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'EDVAC · VON NEUMANN (1945)',
    subtitle: 'PROGRAM & DATA DI MEMORI · UNIVAC I (1951)',
    bgHex: '#0F172A',
    fgHex: '#FEF08A',
    subHex: '#FDE68A',
    borderHex: '#F59E0B',
    width: 1.66,
    height: 0.46,
    texW: 400,
    texH: 100,
    titlePx: 23,
    subPx: 17,
  });
  edvacSign.position.set(0, 0.34, 0.475);
  edvacGroup.add(edvacSign);

  return {
    tubeMats,
    tapeReels,
    meterNeedle,
    heatRings,
    update(animT: number) {
      tubeMats.forEach((m, i) => {
        m.emissiveIntensity = 0.8 + 0.55 * Math.sin(animT * 5.2 + i);
      });
      tapeReels.forEach((r, i) => {
        r.rotation.y = animT * (i % 2 === 0 ? 3.2 : -3.2);
      });
      meterNeedle.rotation.z = -1.15 + Math.sin(animT * 9.5) * 0.14;
      heatRings.forEach((hr, i) => {
        const u = (animT * 0.7 + i * 0.35) % 1;
        hr.position.y = 2.48 + u * 0.65;
        hr.scale.setScalar(0.85 + u * 0.45);
      });
    },
  };
}

export interface BuiltGen2Hardware {
  ibmTapeReels: THREE.Mesh[];
  ibmLeds: THREE.MeshStandardMaterial[];
  punchCardFeed: THREE.Mesh;
  compTurntable: THREE.Group;
  update: (animT: number) => void;
}

/**
 * Populates S2 Gen 2 (Detailed IBM 1401 system + Vacuum Tube vs 3-Pin Transistor Comparison Podium).
 */
export function buildDetailedGen2Hardware(
  tracker: DioramaResourceTracker,
  maxAniso: number,
  g2: THREE.Group
): BuiltGen2Hardware {
  const blueCabinetMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.38, metalness: 0.25 })
  );
  const darkMetalMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.45 })
  );
  const silverMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.22, metalness: 0.85 })
  );
  const glassMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.28,
      roughness: 0.08,
      depthWrite: false,
    })
  );

  // 1) Detailed IBM 1401 Business System (Left side)
  const ibmGroup = new THREE.Group();
  ibmGroup.position.set(-1.35, 0.16, -1.28);
  g2.add(ibmGroup);

  // Main CPU console cabinet + left Magnetic Tape Unit
  const mainCab = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(1.35, 1.38, 0.82)), blueCabinetMat);
  mainCab.position.set(0.32, 0.69, 0);
  mainCab.castShadow = true;
  ibmGroup.add(mainCab);

  const tapeCab = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.82, 1.62, 0.78)), darkMetalMat);
  tapeCab.position.set(-0.82, 0.81, -0.02);
  tapeCab.castShadow = true;
  ibmGroup.add(tapeCab);

  // Twin spinning tape reels behind glass door
  const ibmTapeReels: THREE.Mesh[] = [];
  for (const rx of [-0.98, -0.66]) {
    const reel = new THREE.Mesh(
      tracker.geo(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 14)),
      silverMat
    );
    reel.rotation.x = Math.PI / 2;
    reel.position.set(rx, 1.18, 0.39);
    ibmGroup.add(reel);
    ibmTapeReels.push(reel);
  }
  const tapeWindow = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.72, 0.62, 0.04)), glassMat);
  tapeWindow.position.set(-0.82, 1.18, 0.42);
  ibmGroup.add(tapeWindow);

  // Console indicator lights + COBOL / FORTRAN / ASSEMBLY plate
  const ibmLeds: THREE.MeshStandardMaterial[] = [];
  for (let i = 0; i < 6; i++) {
    const ledMat = tracker.mat(
      new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x38bdf8 : 0xfef08a,
        emissive: i % 2 === 0 ? 0x38bdf8 : 0xf59e0b,
        emissiveIntensity: 0.75,
      })
    );
    const led = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.11, 0.06, 0.03)), ledMat);
    led.position.set(-0.15 + i * 0.19, 1.02, 0.42);
    ibmGroup.add(led);
    ibmLeds.push(ledMat);
  }

  const ibmSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'IBM 1401 · BISNIS',
    subtitle: 'ASSEMBLY · COBOL · FORTRAN',
    bgHex: '#0F172A',
    fgHex: '#38BDF8',
    subHex: '#A7F3D0',
    borderHex: '#0EA5E9',
    width: 1.24,
    height: 0.36,
    texW: 320,
    texH: 84,
    titlePx: 25,
    subPx: 18,
  });
  ibmSign.position.set(0.32, 1.24, 0.43);
  ibmGroup.add(ibmSign);

  // Front-attached Punch Card Hopper feeding cards into IBM 1401
  const hopper = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.86, 0.56, 0.44)), darkMetalMat);
  hopper.position.set(0.32, 0.28, 0.62);
  hopper.castShadow = true;
  ibmGroup.add(hopper);

  const punchCardFeed = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.42, 0.025, 0.28)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.75 }))
  );
  punchCardFeed.position.set(0.32, 0.58, 0.62);
  ibmGroup.add(punchCardFeed);

  // 2) Side-by-Side Comparison Podium: GIANT HOT VACUUM TUBE vs TINY 3-PIN TRANSISTOR!
  const compPodium = new THREE.Group();
  compPodium.position.set(1.75, 0.16, -0.78);
  g2.add(compPodium);

  const pedBase = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.95, 1.05, 0.42, 20)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.48 }))
  );
  pedBase.position.y = 0.21;
  pedBase.castShadow = true;
  compPodium.add(pedBase);

  const compSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'TABUNG VAKUM VS TRANSISTOR',
    subtitle: '1/10 UKURAN · DINGIN & HEMAT DAYA',
    bgHex: '#064E3B',
    fgHex: '#FEF08A',
    subHex: '#A7F3D0',
    borderHex: '#34D399',
    width: 1.72,
    height: 0.36,
    texW: 400,
    texH: 88,
    titlePx: 22,
    subPx: 18,
  });
  compSign.position.set(0, 0.24, 1.02);
  compPodium.add(compSign);

  const compTurntable = new THREE.Group();
  compTurntable.position.set(0, 0.42, 0);
  compPodium.add(compTurntable);

  // Left: Oversized hot Vacuum Tube for clear contrast (seated flush at y=0)
  const oldTube = buildVacuumTubeUnit(tracker, 1.35);
  oldTube.group.position.set(-0.44, 0.02, 0);
  compTurntable.add(oldTube.group);

  // Right: Detailed 3-pin Semiconductor Transistor on mini green stand
  const trStand = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.24, 0.28, 0.14, 12)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 }))
  );
  trStand.position.set(0.42, 0.07, 0);
  compTurntable.add(trStand);

  const trGroup = new THREE.Group();
  trGroup.position.set(0.42, 0.14, 0);
  compTurntable.add(trGroup);

  // Solid TO-92 D-shaped package: flat front face cleanly at z = +0.06 facing camera!
  const to92Shape = new THREE.Shape();
  to92Shape.moveTo(-0.18, 0);
  to92Shape.lineTo(0.18, 0);
  to92Shape.absarc(0, 0, 0.18, 0, Math.PI, false);
  const trBodyGeo = tracker.geo(
    new THREE.ExtrudeGeometry(to92Shape, {
      depth: 0.28,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      bevelSegments: 2,
    })
  );
  trBodyGeo.rotateX(Math.PI / 2);
  const trBody = new THREE.Mesh(trBodyGeo, darkMetalMat);
  trBody.position.set(0, 0.62, 0.06);
  trBody.castShadow = true;
  trGroup.add(trBody);

  const trFaceTex = makeCanvasTex(tracker, maxAniso, 200, 140, (ctx, w, h) => {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = '#34D399';
    ctx.font = '900 23px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TRANSISTOR', w / 2, 46);
    ctx.fillStyle = '#FEF08A';
    ctx.font = '900 28px "JetBrains Mono", monospace';
    ctx.fillText('E · B · C', w / 2, 98);
  });
  const trFace = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(0.32, 0.23)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        map: trFaceTex,
        roughness: 0.35,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    )
  );
  trFace.position.set(0, 0.48, 0.076);
  trGroup.add(trFace);

  const legGeo = tracker.geo(new THREE.CylinderGeometry(0.024, 0.024, 0.36, 8));
  for (const lx of [-0.1, 0, 0.1]) {
    const leg = new THREE.Mesh(legGeo, silverMat);
    leg.position.set(lx, 0.18, 0.01);
    trGroup.add(leg);
  }

  return {
    ibmTapeReels,
    ibmLeds,
    punchCardFeed,
    compTurntable,
    update(animT: number) {
      ibmTapeReels.forEach((r, i) => {
        r.rotation.y = animT * (i % 2 === 0 ? 3.5 : -3.5);
      });
      const step = Math.floor(animT * 4.5);
      ibmLeds.forEach((m, i) => {
        m.emissiveIntensity = ((step >> i) & 1) === 1 ? 1.15 : 0.12;
      });
      const cardU = (animT * 1.1) % 1;
      punchCardFeed.position.z = 0.72 - cardU * 0.28;
      compTurntable.rotation.y = Math.sin(animT * 0.7) * 0.45;
    },
  };
}
