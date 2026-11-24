import * as THREE from 'three';
import type { DioramaResourceTracker } from './theaterDioramaCore';
import { buildStorySignPlate } from './storyLabelKit';

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

/**
 * Unrolled 3D road-map scroll for Analogy: Software = Peta Jalan & Petunjuk Arah.
 */
export function buildDetailedMapScroll(
  tracker: DioramaResourceTracker,
  maxAniso: number
): THREE.Group {
  const group = new THREE.Group();
  const woodMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.65 })
  );
  const knobMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.65 })
  );

  for (const sx of [-0.66, 0.66]) {
    const rod = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.045, 0.045, 0.92, 10)), woodMat);
    rod.position.set(sx, 0, 0);
    group.add(rod);
    for (const ky of [-0.48, 0.48]) {
      const knob = new THREE.Mesh(tracker.geo(new THREE.SphereGeometry(0.058, 8, 8)), knobMat);
      knob.position.set(sx, ky, 0);
      group.add(knob);
    }
  }

  const mapTex = makeTex(tracker, maxAniso, 320, 220, (ctx, w, h) => {
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#065F46';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    // Header band
    ctx.fillStyle = '#065F46';
    ctx.fillRect(10, 10, w - 20, 44);
    ctx.fillStyle = '#FEF08A';
    ctx.font = '900 22px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SOFTWARE · PETA JALAN', w / 2, 39);

    // Winding road route
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(42, 182);
    ctx.bezierCurveTo(105, 175, 110, 95, 168, 128);
    ctx.bezierCurveTo(222, 160, 238, 82, 276, 86);
    ctx.stroke();

    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);

    // Start green dot & destination red GPS pin
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(42, 182, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(276, 86, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(276, 86, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  const scrollBody = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(1.24, 0.84, 0.04)),
    tracker.mat(new THREE.MeshStandardMaterial({ map: mapTex, roughness: 0.45 }))
  );
  scrollBody.castShadow = true;
  group.add(scrollBody);

  return group;
}

/**
 * Adds headlights, bumper, and badge to the Hardware mini-car so it reads unmistakably as a car.
 */
export function enhanceCarHardware(
  tracker: DioramaResourceTracker,
  car: THREE.Group
): void {
  const lampMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 0.85,
    })
  );
  const bumperMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.28, metalness: 0.72 })
  );
  for (const lz of [-0.24, 0.24]) {
    const lamp = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.06, 0.1, 0.14)), lampMat);
    lamp.position.set(0.69, 0.36, lz);
    car.add(lamp);
  }
  const frontBumper = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.08, 0.09, 0.78)), bumperMat);
  frontBumper.position.set(0.7, 0.2, 0);
  car.add(frontBumper);
}

/**
 * Builds a live Digital 0-9 + Binary texture applied directly onto the Digital PC monitor screen.
 */
export function buildDigitalNumberScreenMesh(
  tracker: DioramaResourceTracker,
  maxAniso: number
): THREE.Mesh {
  const tex = makeTex(tracker, maxAniso, 256, 160, (ctx, w, h) => {
    ctx.fillStyle = '#0C4A6E';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.fillStyle = '#BAE6FD';
    ctx.font = '800 18px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DATA KUANTITATIF', w / 2, 34);
    ctx.fillStyle = '#FEF08A';
    ctx.font = '900 32px "JetBrains Mono", monospace';
    ctx.fillText('0 1 2 3 4', w / 2, 82);
    ctx.fillText('5 6 7 8 9', w / 2, 124);
  });
  const mesh = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(0.58, 0.34)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        map: tex,
        emissiveMap: tex,
        emissive: 0xffffff,
        emissiveIntensity: 0.45,
      })
    )
  );
  mesh.position.set(0, 1.0, -0.14);
  return mesh;
}

/**
 * Detailed Hybrid Fax Machine with paper hopper, keypad, LCD strip, handset receiver,
 * and animated printed fax sheet emerging from the front slot.
 */
export function buildDetailedFaxMachine(
  tracker: DioramaResourceTracker,
  maxAniso: number
): { group: THREE.Group; outSheet: THREE.Mesh } {
  const group = new THREE.Group();
  const ped = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(1.36, 0.72, 0.96)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.45 }))
  );
  ped.position.y = 0.36;
  ped.castShadow = true;
  group.add(ped);

  const faxSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'HYBRID · MESIN FAX',
    subtitle: 'ANALOG + DIGITAL',
    bgHex: '#3B0764',
    fgHex: '#FEF08A',
    subHex: '#E9D5FF',
    borderHex: '#C084FC',
    width: 1.24,
    height: 0.38,
    texW: 280,
    texH: 80,
    titlePx: 23,
    subPx: 18,
  });
  faxSign.position.set(0, 0.36, 0.5);
  group.add(faxSign);

  const bodyMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.36, metalness: 0.08 })
  );
  const darkMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.3 })
  );

  // Main sloped fax chassis
  const baseBody = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.96, 0.24, 0.66)), bodyMat);
  baseBody.position.y = 0.84;
  baseBody.castShadow = true;
  group.add(baseBody);

  // Top paper input tray + standing input page
  const tray = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.56, 0.24, 0.06)), darkMat);
  tray.position.set(0.08, 1.06, -0.22);
  tray.rotation.x = -0.35;
  group.add(tray);
  const inPage = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.46, 0.26, 0.02)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }))
  );
  inPage.position.set(0.08, 1.09, -0.18);
  inPage.rotation.x = -0.35;
  group.add(inPage);

  // Numeric Keypad buttons + green LCD display strip
  const lcdTex = makeTex(tracker, maxAniso, 192, 64, (ctx, w, h) => {
    ctx.fillStyle = '#052E16';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#4ADE80';
    ctx.font = '900 22px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FAX SENDING..', w / 2, h / 2);
  });
  const lcd = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(0.32, 0.09)),
    tracker.mat(new THREE.MeshStandardMaterial({ map: lcdTex, emissiveMap: lcdTex, emissive: 0xffffff, emissiveIntensity: 0.4 }))
  );
  lcd.rotation.x = -Math.PI / 2 + 0.15;
  lcd.position.set(0.06, 0.968, 0.06);
  group.add(lcd);

  const keyGeo = tracker.geo(new THREE.BoxGeometry(0.055, 0.025, 0.045));
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const k = new THREE.Mesh(keyGeo, darkMat);
      k.position.set(0.26 + c * 0.07, 0.968, 0.03 + r * 0.06);
      group.add(k);
    }
  }

  // Contoured telephone handset resting on left cradle
  const cradle = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.18, 0.05, 0.52)), darkMat);
  cradle.position.set(-0.34, 0.97, 0);
  group.add(cradle);
  const handle = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.11, 0.08, 0.48)), darkMat);
  handle.position.set(-0.34, 1.04, 0);
  group.add(handle);
  for (const hz of [-0.19, 0.19]) {
    const ear = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.065, 0.065, 0.07, 10)), darkMat);
    ear.position.set(-0.34, 1.0, hz);
    group.add(ear);
  }

  // Outgoing animated fax document sheet
  const sheetTex = makeTex(tracker, maxAniso, 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#7C3AED';
    ctx.fillRect(14, 16, 100, 14);
    ctx.fillStyle = '#64748B';
    for (let i = 0; i < 4; i++) ctx.fillRect(14, 44 + i * 18, 92 - i * 10, 8);
  });
  const outSheet = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.42, 0.015, 0.34)),
    tracker.mat(new THREE.MeshStandardMaterial({ map: sheetTex, roughness: 0.75 }))
  );
  outSheet.position.set(0.08, 0.82, 0.38);
  group.add(outSheet);

  return { group, outSheet };
}

/**
 * Replaces the 6 plain colored bricks with 6 unmistakable miniature 3D computer form factors
 * (Tower, Desktop, Portable, Notebook, Subnotebook, Palmtop) each with its own front name plate!
 */
export function buildSixComputerForms(
  tracker: DioramaResourceTracker,
  maxAniso: number,
  classGroup: THREE.Group
): void {
  const shelf = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(3.45, 0.54, 1.06)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 }))
  );
  shelf.position.set(4.15, 0.4, -0.48);
  shelf.castShadow = true;
  classGroup.add(shelf);

  const formSign = buildStorySignPlate(tracker, maxAniso, {
    title: '6 BENTUK FISIK: TOWER → PALMTOP',
    bgHex: '#78350F',
    fgHex: '#FEF08A',
    borderHex: '#F59E0B',
    width: 3.3,
    height: 0.34,
    texW: 480,
    texH: 64,
    titlePx: 24,
  });
  formSign.position.set(4.15, 0.4, 0.07);
  classGroup.add(formSign);

  const darkCase = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.35 })
  );
  const silverMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.4 })
  );
  const screenMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55,
      roughness: 0.2,
    })
  );

  const topY = 0.67;
  const xs = [2.8, 3.35, 3.92, 4.46, 4.96, 5.44];
  const labels = ['TOWER', 'DESKTOP', 'PORTABLE', 'NOTEBOOK', 'SUBNOTE', 'PALMTOP'];

  labels.forEach((lbl, idx) => {
    const tag = buildStorySignPlate(tracker, maxAniso, {
      title: lbl,
      bgHex: '#0F172A',
      fgHex: '#FEF08A',
      borderHex: '#FBBF24',
      width: 0.48,
      height: 0.16,
      texW: 160,
      texH: 52,
      titlePx: 24,
    });
    tag.position.set(xs[idx], topY + 0.08, -0.02);
    tag.rotation.x = -0.35;
    classGroup.add(tag);
  });

  // 1. TOWER: Vertical PC tower with drive bays & LED
  const tower = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.28, 0.68, 0.44)), darkCase);
  tower.position.set(xs[0], topY + 0.34, -0.45);
  tower.castShadow = true;
  classGroup.add(tower);
  const tBay = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.22, 0.1, 0.03)), silverMat);
  tBay.position.set(xs[0], topY + 0.54, -0.22);
  classGroup.add(tBay);

  // 2. DESKTOP: Horizontal flat PC chassis + CRT monitor sitting on top
  const dBase = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.46, 0.14, 0.38)), silverMat);
  dBase.position.set(xs[1], topY + 0.07, -0.45);
  classGroup.add(dBase);
  const dMon = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.36, 0.28, 0.24)), darkCase);
  dMon.position.set(xs[1], topY + 0.28, -0.45);
  classGroup.add(dMon);
  const dScr = new THREE.Mesh(tracker.geo(new THREE.PlaneGeometry(0.28, 0.2)), screenMat);
  dScr.position.set(xs[1], topY + 0.28, -0.325);
  classGroup.add(dScr);

  // 3. PORTABLE: Luggable suitcase computer with top carry handle
  const pBox = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.4, 0.32, 0.26)), darkCase);
  pBox.position.set(xs[2], topY + 0.16, -0.45);
  classGroup.add(pBox);
  const pScr = new THREE.Mesh(tracker.geo(new THREE.PlaneGeometry(0.2, 0.15)), screenMat);
  pScr.position.set(xs[2] - 0.06, topY + 0.18, -0.315);
  classGroup.add(pScr);
  const pHandle = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.18, 0.06, 0.05)), silverMat);
  pHandle.position.set(xs[2], topY + 0.35, -0.45);
  classGroup.add(pHandle);

  // 4. NOTEBOOK: Open clamshell laptop
  const nDeck = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.36, 0.04, 0.26)), darkCase);
  nDeck.position.set(xs[3], topY + 0.02, -0.4);
  classGroup.add(nDeck);
  const nLid = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.36, 0.24, 0.03)), darkCase);
  nLid.position.set(xs[3], topY + 0.14, -0.53);
  nLid.rotation.x = -0.18;
  classGroup.add(nLid);
  const nScr = new THREE.Mesh(tracker.geo(new THREE.PlaneGeometry(0.3, 0.18)), screenMat);
  nScr.position.set(xs[3], topY + 0.14, -0.51);
  nScr.rotation.x = -0.18;
  classGroup.add(nScr);

  // 5. SUBNOTEBOOK: Extra slim mini laptop
  const sDeck = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.28, 0.03, 0.2)), silverMat);
  sDeck.position.set(xs[4], topY + 0.015, -0.4);
  classGroup.add(sDeck);
  const sLid = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.28, 0.18, 0.025)), silverMat);
  sLid.position.set(xs[4], topY + 0.11, -0.5);
  sLid.rotation.x = -0.18;
  classGroup.add(sLid);
  const sScr = new THREE.Mesh(tracker.geo(new THREE.PlaneGeometry(0.22, 0.13)), screenMat);
  sScr.position.set(xs[4], topY + 0.11, -0.484);
  sScr.rotation.x = -0.18;
  classGroup.add(sScr);

  // 6. PALMTOP: Pocket-sized handheld organizer
  const palm = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.18, 0.22, 0.06)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 }))
  );
  palm.position.set(xs[5], topY + 0.14, -0.44);
  palm.rotation.x = -0.25;
  classGroup.add(palm);
  const palmScr = new THREE.Mesh(tracker.geo(new THREE.PlaneGeometry(0.13, 0.1)), screenMat);
  palmScr.position.set(xs[5], topY + 0.18, -0.405);
  palmScr.rotation.x = -0.25;
  classGroup.add(palmScr);
}
