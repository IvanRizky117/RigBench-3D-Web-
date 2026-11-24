import * as THREE from 'three';
import type { DioramaResourceTracker } from './theaterDioramaCore';

function makeCanvasLabel(
  tracker: DioramaResourceTracker,
  maxAniso: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 256,
  h = 96
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

function makeDialTexture(
  tracker: DioramaResourceTracker,
  maxAniso: number
): THREE.CanvasTexture {
  return makeCanvasLabel(
    tracker,
    maxAniso,
    (ctx, w, h) => {
      ctx.fillStyle = '#FEF3C7';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w / 2 - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#92400E';
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.fillStyle = '#1E293B';
      ctx.font = '900 22px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let d = 0; d < 10; d++) {
        const ang = (d / 10) * Math.PI * 2 - Math.PI / 2;
        const rx = w / 2 + Math.cos(ang) * (w * 0.33);
        const ry = h / 2 + Math.sin(ang) * (h * 0.33);
        ctx.fillText(String(d), rx, ry);
      }

      ctx.fillStyle = '#B45309';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 18, 0, Math.PI * 2);
      ctx.fill();
    },
    160,
    160
  );
}

export interface BuiltZone2Machinery {
  pascalGears: THREE.Group[];
  pascalCrank: THREE.Group;
  arithCrank: THREE.Group;
  arithSliders: THREE.Mesh[];
  arithDrum: THREE.Group;
  update: (animT: number) => void;
}

/**
 * Builds detailed, recognizable Zone 2 mechanical calculators on the workshop bench:
 * 1) Blaise Pascal's 1642 Pascaline (8 toothed gear dials 0-9, result window, crank, "CUMA TAMBAH (+)" badge)
 * 2) Leibniz (1694) & Thomas de Colmar's Arithometer (stepped drum, 4 sliders, crank, "4 OPERASI: + - x /")
 */
export function buildDetailedZone2Machinery(
  tracker: DioramaResourceTracker,
  maxAniso: number,
  z2: THREE.Group
): BuiltZone2Machinery {
  const brassMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.25, metalness: 0.78 })
  );
  const darkBrassMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.36, metalness: 0.65 })
  );
  const steelMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.28, metalness: 0.75 })
  );
  const walnutMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x5c3419, roughness: 0.78, metalness: 0.04 })
  );
  const ivoryMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.55, metalness: 0.05 })
  );

  // =========================================================================
  // 1. PASCALINE 1642 (LEFT SIDE OF BENCH: x = -0.36, y = 0.66, z = 0.0)
  // =========================================================================
  const pascalGroup = new THREE.Group();
  pascalGroup.position.set(-0.36, 0.66, 0.02);
  pascalGroup.rotation.x = 0.16; // Tilted slightly forward toward camera!
  z2.add(pascalGroup);

  // Wooden base trim + brass casing
  const pascWoodBase = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(1.38, 0.07, 0.64)),
    walnutMat
  );
  pascWoodBase.position.y = 0.035;
  pascWoodBase.castShadow = true;
  pascalGroup.add(pascWoodBase);

  const pascBrassBody = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(1.3, 0.2, 0.56)),
    brassMat
  );
  pascBrassBody.position.y = 0.17;
  pascBrassBody.castShadow = true;
  pascalGroup.add(pascBrassBody);

  // Front result window strip showing digits "0 0 1 6 4 2"
  const winTex = makeCanvasLabel(
    tracker,
    maxAniso,
    (ctx, w, h) => {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, w - 6, h - 6);
      const digits = ['0', '0', '1', '6', '4', '2', '0', '8'];
      const cellW = (w - 24) / digits.length;
      digits.forEach((d, idx) => {
        const cx = 12 + idx * cellW;
        ctx.fillStyle = '#FEF9C3';
        ctx.fillRect(cx + 3, 14, cellW - 6, h - 28);
        ctx.fillStyle = '#1E293B';
        ctx.font = '900 32px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d, cx + cellW / 2, h / 2 + 1);
      });
    },
    384,
    72
  );
  const winMesh = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(1.16, 0.12)),
    tracker.mat(new THREE.MeshStandardMaterial({ map: winTex, roughness: 0.35 }))
  );
  winMesh.position.set(0, 0.275, 0.18);
  winMesh.rotation.x = -Math.PI / 2 + 0.15;
  pascalGroup.add(winMesh);

  // Educational badge mounted on Pascaline front face: "CUMA TAMBAH (+)"
  const pascBadgeTex = makeCanvasLabel(
    tracker,
    maxAniso,
    (ctx, w, h) => {
      ctx.fillStyle = '#7F1D1D';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 7;
      ctx.strokeRect(3, 3, w - 6, h - 6);
      ctx.fillStyle = '#FEF08A';
      ctx.font = '900 28px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PASCALINE · CUMA TAMBAH (+)', w / 2, h / 2);
    },
    420,
    68
  );
  const pascBadge = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(1.2, 0.15)),
    tracker.mat(new THREE.MeshStandardMaterial({ map: pascBadgeTex, roughness: 0.36 }))
  );
  pascBadge.position.set(0, 0.16, 0.285);
  pascalGroup.add(pascBadge);

  // 6 Detailed Toothed Gear Dials (0-9 canvas face + visible teeth spokes)
  const dialTex = makeDialTexture(tracker, maxAniso);
  const dialFaceMat = tracker.mat(
    new THREE.MeshStandardMaterial({ map: dialTex, roughness: 0.38, metalness: 0.2 })
  );
  const toothGeo = tracker.geo(new THREE.BoxGeometry(0.025, 0.032, 0.04));
  const rimGeo = tracker.geo(new THREE.CylinderGeometry(0.088, 0.088, 0.03, 14));
  const faceGeo = tracker.geo(new THREE.CylinderGeometry(0.078, 0.078, 0.036, 16));
  const pascalGears: THREE.Group[] = [];

  for (let i = 0; i < 6; i++) {
    const gGroup = new THREE.Group();
    gGroup.position.set(-0.48 + i * 0.192, 0.285, -0.05);

    const rim = new THREE.Mesh(rimGeo, i % 2 === 0 ? steelMat : darkBrassMat);
    gGroup.add(rim);

    const face = new THREE.Mesh(faceGeo, dialFaceMat);
    face.position.y = 0.006;
    gGroup.add(face);

    // 8 gear teeth around circumference
    for (let t = 0; t < 8; t++) {
      const ang = (t / 8) * Math.PI * 2;
      const tooth = new THREE.Mesh(toothGeo, steelMat);
      tooth.position.set(Math.cos(ang) * 0.095, 0, Math.sin(ang) * 0.095);
      tooth.rotation.y = -ang;
      gGroup.add(tooth);
    }

    pascalGroup.add(gGroup);
    pascalGears.push(gGroup);
  }

  // Side Hand Crank on Pascaline right edge
  const pascalCrank = new THREE.Group();
  pascalCrank.position.set(0.67, 0.18, 0);
  const pShaft = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 8)),
    steelMat
  );
  pShaft.rotation.z = Math.PI / 2;
  pShaft.position.x = 0.05;
  pascalCrank.add(pShaft);
  const pArm = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.03, 0.16, 0.03)), steelMat);
  pArm.position.set(0.11, 0.07, 0);
  pascalCrank.add(pArm);
  const pKnob = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.028, 0.028, 0.09, 8)),
    walnutMat
  );
  pKnob.rotation.z = Math.PI / 2;
  pKnob.position.set(0.16, 0.14, 0);
  pascalCrank.add(pKnob);
  pascalGroup.add(pascalCrank);

  // =========================================================================
  // 2. ARITHOMETER THOMAS DE COLMAR / LEIBNIZ (RIGHT SIDE: x = 0.66, y = 0.66)
  // =========================================================================
  const arithGroup = new THREE.Group();
  arithGroup.position.set(0.68, 0.66, 0.04);
  arithGroup.rotation.x = 0.14;
  z2.add(arithGroup);

  // Rich walnut cabinet + angled brass calculation plate
  const arithBoxBase = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.68, 0.22, 0.56)),
    walnutMat
  );
  arithBoxBase.position.y = 0.11;
  arithBoxBase.castShadow = true;
  arithGroup.add(arithBoxBase);

  const brassDeck = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.6, 0.04, 0.48)),
    brassMat
  );
  brassDeck.position.y = 0.23;
  arithGroup.add(brassDeck);

  // Front crisp badge: "ARITHOMETER COLMAR | 4 OPERASI: + - x ÷"
  const arithBadgeTex = makeCanvasLabel(
    tracker,
    maxAniso,
    (ctx, w, h) => {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 7;
      ctx.strokeRect(3, 3, w - 6, h - 6);
      ctx.fillStyle = '#BAE6FD';
      ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ARITHOMETER COLMAR', w / 2, 32);
      ctx.fillStyle = '#FEF08A';
      ctx.font = '900 30px "JetBrains Mono", monospace';
      ctx.fillText('+   −   ×   ÷', w / 2, 70);
    },
    320,
    96
  );
  const arithFrontSign = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(0.6, 0.18)),
    tracker.mat(new THREE.MeshStandardMaterial({ map: arithBadgeTex, roughness: 0.34 }))
  );
  arithFrontSign.position.set(0, 0.11, 0.285);
  arithGroup.add(arithFrontSign);

  // Upper carriage accumulator display strip
  const carriageStrip = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.54, 0.06, 0.12)),
    darkBrassMat
  );
  carriageStrip.position.set(0, 0.27, -0.15);
  arithGroup.add(carriageStrip);

  const arithWinTex = makeCanvasLabel(
    tracker,
    maxAniso,
    (ctx, w, h) => {
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#38BDF8';
      ctx.font = '900 30px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('12 × 4 = 48', w / 2, h / 2);
    },
    220,
    56
  );
  const arithWin = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(0.46, 0.085)),
    tracker.mat(new THREE.MeshStandardMaterial({ map: arithWinTex, roughness: 0.3 }))
  );
  arithWin.position.set(0, 0.305, -0.15);
  arithWin.rotation.x = -Math.PI / 2 + 0.15;
  arithGroup.add(arithWin);

  // 4 Stepped-drum slider tracks + movable ivory slider knobs
  const arithSliders: THREE.Mesh[] = [];
  const slotGeo = tracker.geo(new THREE.BoxGeometry(0.035, 0.02, 0.22));
  const knobGeo = tracker.geo(new THREE.BoxGeometry(0.065, 0.05, 0.055));
  for (let s = 0; s < 4; s++) {
    const sx = -0.195 + s * 0.13;
    const slot = new THREE.Mesh(
      slotGeo,
      tracker.mat(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 }))
    );
    slot.position.set(sx, 0.25, 0.08);
    arithGroup.add(slot);

    const sliderKnob = new THREE.Mesh(knobGeo, ivoryMat);
    sliderKnob.position.set(sx, 0.275, 0.05 + (s % 2) * 0.06);
    sliderKnob.castShadow = true;
    arithGroup.add(sliderKnob);
    arithSliders.push(sliderKnob);
  }

  // Visible miniature Leibniz stepped drum cylinder peeking at the left rear corner
  const arithDrum = new THREE.Group();
  arithDrum.position.set(-0.22, 0.31, -0.02);
  const drumCore = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 10)),
    steelMat
  );
  drumCore.rotation.z = Math.PI / 2;
  arithDrum.add(drumCore);
  for (let r = 0; r < 4; r++) {
    const rib = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(0.03 + r * 0.02, 0.12, 0.02)),
      brassMat
    );
    rib.position.x = -0.04 + r * 0.025;
    arithDrum.add(rib);
  }
  arithGroup.add(arithDrum);

  // Right-side turning crank on Arithometer
  const arithCrank = new THREE.Group();
  arithCrank.position.set(0.34, 0.14, 0.04);
  const aShaft = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 8)),
    steelMat
  );
  aShaft.rotation.z = Math.PI / 2;
  aShaft.position.x = 0.05;
  arithCrank.add(aShaft);
  const aArm = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.03, 0.16, 0.03)), brassMat);
  aArm.position.set(0.11, 0.07, 0);
  arithCrank.add(aArm);
  const aKnob = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.028, 0.028, 0.09, 8)),
    walnutMat
  );
  aKnob.rotation.z = Math.PI / 2;
  aKnob.position.set(0.16, 0.14, 0);
  arithCrank.add(aKnob);
  arithGroup.add(arithCrank);

  return {
    pascalGears,
    pascalCrank,
    arithCrank,
    arithSliders,
    arithDrum,
    update(animT: number) {
      pascalGears.forEach((g, i) => {
        g.rotation.y = animT * (i % 2 === 0 ? 1.8 : -1.8);
      });
      pascalCrank.rotation.x = animT * 2.6;

      arithCrank.rotation.x = animT * 3.1;
      arithDrum.rotation.x = animT * 3.1;
      arithSliders.forEach((sl, i) => {
        sl.position.z = 0.08 + Math.sin(animT * 1.6 + i * 1.1) * 0.065;
      });
    },
  };
}
