import * as THREE from 'three';
import {
  DioramaResourceTracker,
  type BuiltTheaterDiorama,
  type TheaterStoryContext,
} from './theaterDioramaCore';
import {
  STORY_ATMOSPHERE_PRESETS,
  buildStoryBackdrop,
  buildWarmStoryCue,
} from './storyEnvironmentKit';
import {
  animateRobloxActor,
  buildRobloxActor,
} from './robloxActorBuilder';
import { buildStorySignPlate } from './storyLabelKit';
import { buildDetailedZone2Machinery } from './historyZone2DetailedProps';

export function buildStoryHistoryMechScene(
  maxAniso: number,
  textureScale: number
): BuiltTheaterDiorama {
  const tracker = new DioramaResourceTracker(textureScale);
  const rootGroup = new THREE.Group();

  const backdrop = buildStoryBackdrop(tracker, rootGroup, 'ancient-market', 0x86bd65);
  const warmCue = buildWarmStoryCue(tracker, rootGroup);

  // Sunlit cobblestone timeline promenade linking all 5 historical zones
  const promenade = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(14.6, 0.16, 4.0)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xdcc5a0, roughness: 0.86 }))
  );
  promenade.position.set(0, 0.02, -0.05);
  promenade.receiveShadow = true;
  rootGroup.add(promenade);

  const woodMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x925e34, roughness: 0.78 })
  );
  const darkWoodMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.82 })
  );
  const brassMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.28, metalness: 0.72 })
  );
  const steelMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.34, metalness: 0.65 })
  );

  // =========================================================================
  // ZONE 1 (x = -5.4): PASAR KUNO — ABACUS (BIJI KAYU MANUAL)
  // =========================================================================
  const z1 = new THREE.Group();
  z1.position.set(-5.4, 0.1, 0.15);
  rootGroup.add(z1);

  const postGeo = tracker.geo(new THREE.CylinderGeometry(0.06, 0.07, 1.95, 8));
  for (const [px, pz] of [
    [-1.0, -0.85],
    [1.0, -0.85],
    [-1.0, 0.65],
    [1.0, 0.65],
  ] as const) {
    const post = new THREE.Mesh(postGeo, darkWoodMat);
    post.position.set(px, 0.98, pz);
    post.castShadow = true;
    z1.add(post);
  }
  const awningColors = [0xd97706, 0xfef3c7];
  for (let i = 0; i < 6; i++) {
    const stripe = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(0.36, 0.09, 1.75)),
      tracker.mat(new THREE.MeshStandardMaterial({ color: awningColors[i % 2], roughness: 0.82 }))
    );
    stripe.position.set(-0.9 + i * 0.36, 1.98, -0.1);
    stripe.rotation.x = 0.16;
    stripe.castShadow = true;
    z1.add(stripe);
  }

  const counter = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(1.6, 0.68, 0.68)), woodMat);
  counter.position.set(0, 0.34, -0.12);
  counter.castShadow = true;
  z1.add(counter);

  const sign1 = buildStorySignPlate(tracker, maxAniso, {
    title: '1. ABACUS (MANUAL)',
    subtitle: 'GESER BIJI KAYU',
    bgHex: '#78350F',
    fgHex: '#FEF08A',
    borderHex: '#F59E0B',
    width: 1.56,
    height: 0.46,
    texW: 300,
    texH: 96,
    titlePx: 26,
    subPx: 22,
  });
  sign1.position.set(0, 0.34, 0.25);
  z1.add(sign1);

  const abacusFrame = new THREE.Group();
  abacusFrame.position.set(0, 1.02, -0.1);
  abacusFrame.rotation.x = -0.25;
  const sideBarGeo = tracker.geo(new THREE.BoxGeometry(0.07, 0.72, 0.09));
  const topBarGeo = tracker.geo(new THREE.BoxGeometry(1.16, 0.07, 0.09));
  const abL = new THREE.Mesh(sideBarGeo, darkWoodMat);
  abL.position.x = -0.55;
  const abR = new THREE.Mesh(sideBarGeo, darkWoodMat);
  abR.position.x = 0.55;
  const abT = new THREE.Mesh(topBarGeo, darkWoodMat);
  abT.position.y = 0.34;
  const abB = new THREE.Mesh(topBarGeo, darkWoodMat);
  abB.position.y = -0.34;
  abacusFrame.add(abL, abR, abT, abB);

  const abacusBeads: THREE.Mesh[] = [];
  const beadColors = [0xef4444, 0xf59e0b, 0x10b981, 0x3b82f6];
  const rodGeo = tracker.geo(new THREE.CylinderGeometry(0.014, 0.014, 1.06, 6));
  const beadGeo = tracker.geo(new THREE.SphereGeometry(0.068, 10, 8));
  for (let r = 0; r < 4; r++) {
    const ry = -0.2 + r * 0.14;
    const rod = new THREE.Mesh(rodGeo, steelMat);
    rod.rotation.z = Math.PI / 2;
    rod.position.y = ry;
    abacusFrame.add(rod);
    const bMat = tracker.mat(
      new THREE.MeshStandardMaterial({ color: beadColors[r], roughness: 0.4 })
    );
    for (let b = 0; b < 4; b++) {
      const bead = new THREE.Mesh(beadGeo, bMat);
      bead.scale.set(0.78, 1.0, 1.0);
      bead.position.set(-0.34 + b * 0.15, ry, 0);
      abacusFrame.add(bead);
      abacusBeads.push(bead);
    }
  }
  z1.add(abacusFrame);

  const merchant = buildRobloxActor(tracker, {
    shirtHex: 0xd97706,
    pantsHex: 0x78350f,
    hat: 'headband',
    hatHex: 0xfef08a,
    scale: 0.94,
  });
  merchant.root.position.set(0, 0, -0.68);
  z1.add(merchant.root);

  // =========================================================================
  // ZONE 2 (x = -2.7): BENGKEL 1642 — PASCALINE (HANYA TAMBAH) & ARITHOMETER
  // =========================================================================
  const z2 = new THREE.Group();
  z2.position.set(-2.7, 0.1, -0.3);
  rootGroup.add(z2);

  const bench2 = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(2.38, 0.66, 1.02)), woodMat);
  bench2.position.set(0.08, 0.33, 0);
  bench2.castShadow = true;
  z2.add(bench2);

  const sign2 = buildStorySignPlate(tracker, maxAniso, {
    title: '2. PASCALINE 1642 & COLMAR',
    subtitle: 'PASCAL CUMA (+) · COLMAR (+ − × ÷)',
    bgHex: '#1E3A8A',
    fgHex: '#FEF08A',
    borderHex: '#60A5FA',
    width: 2.16,
    height: 0.48,
    texW: 400,
    texH: 96,
    titlePx: 25,
    subPx: 20,
  });
  sign2.position.set(0.08, 0.34, 0.54);
  z2.add(sign2);

  const zone2Machinery = buildDetailedZone2Machinery(tracker, maxAniso, z2);

  const pascalActor = buildRobloxActor(tracker, {
    shirtHex: 0x3b82f6,
    pantsHex: 0x1e293b,
    hat: 'beret',
    hatHex: 0x7c2d12,
    scale: 0.94,
  });
  pascalActor.root.position.set(-0.28, 0, -0.82);
  z2.add(pascalActor.root);

  // =========================================================================
  // ZONE 3 (x = 0.0): MESIN UAP — BABBAGE & ADA LOVELACE (ANALYTICAL ENGINE)
  // =========================================================================
  const z3 = new THREE.Group();
  z3.position.set(0.0, 0.1, -0.5);
  rootGroup.add(z3);

  const engBase = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(1.65, 0.42, 1.1)), darkWoodMat);
  engBase.position.y = 0.21;
  engBase.castShadow = true;
  z3.add(engBase);

  const sign3 = buildStorySignPlate(tracker, maxAniso, {
    title: '3. ANALYTICAL ENGINE',
    subtitle: 'BABBAGE & ADA LOVELACE',
    bgHex: '#4C1D95',
    fgHex: '#FEF08A',
    borderHex: '#C084FC',
    width: 1.72,
    height: 0.46,
    texW: 340,
    texH: 96,
    titlePx: 24,
    subPx: 20,
  });
  sign3.position.set(0, 0.24, 0.58);
  z3.add(sign3);

  const engCols: THREE.Group[] = [];
  for (const cx of [-0.42, 0, 0.42]) {
    const colG = new THREE.Group();
    colG.position.set(cx, 0.42, 0);
    const shaft = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.05, 0.05, 1.45, 8)), steelMat);
    shaft.position.y = 0.72;
    colG.add(shaft);
    for (let k = 0; k < 5; k++) {
      const wheel = new THREE.Mesh(
        tracker.geo(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 10)),
        k % 2 === 0 ? brassMat : steelMat
      );
      wheel.position.y = 0.24 + k * 0.25;
      wheel.castShadow = true;
      colG.add(wheel);
    }
    z3.add(colG);
    engCols.push(colG);
  }

  const steamMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.78, roughness: 0.9 })
  );
  const steamPuffs: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const puff = new THREE.Mesh(tracker.geo(new THREE.DodecahedronGeometry(0.18, 0)), steamMat);
    puff.position.set(-0.4, 1.85 + i * 0.35, -0.2);
    z3.add(puff);
    steamPuffs.push(puff);
  }

  const babbage = buildRobloxActor(tracker, {
    shirtHex: 0x334155,
    pantsHex: 0x0f172a,
    hat: 'tophat',
    hatHex: 0x1e293b,
    scale: 0.94,
  });
  babbage.root.position.set(-1.12, 0, 0.15);
  babbage.root.rotation.y = Math.PI * 0.28;
  z3.add(babbage.root);

  const adaLovelace = buildRobloxActor(tracker, {
    shirtHex: 0xec4899,
    pantsHex: 0x831843,
    hat: 'ribbon',
    hatHex: 0xfef08a,
    prop: 'punchcard',
    propHex: 0xfef3c7,
    scale: 0.92,
  });
  adaLovelace.root.position.set(1.12, 0, 0.18);
  adaLovelace.root.rotation.y = -Math.PI * 0.28;
  z3.add(adaLovelace.root);

  // =========================================================================
  // ZONE 4 (x = +2.7): SENSUS AS 1889 — HOLLERITH (KARTU LUBANG -> IBM)
  // =========================================================================
  const z4 = new THREE.Group();
  z4.position.set(2.7, 0.1, -0.3);
  rootGroup.add(z4);

  const tabDesk = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(1.72, 0.72, 0.92)), woodMat);
  tabDesk.position.set(0, 0.36, 0);
  tabDesk.castShadow = true;
  z4.add(tabDesk);

  const sign4 = buildStorySignPlate(tracker, maxAniso, {
    title: '4. KARTU LUBANG 1889',
    subtitle: 'HOLLERITH · CIKAL IBM',
    bgHex: '#0C4A6E',
    fgHex: '#FEF08A',
    borderHex: '#38BDF8',
    width: 1.72,
    height: 0.46,
    texW: 340,
    texH: 96,
    titlePx: 24,
    subPx: 21,
  });
  sign4.position.set(0, 0.36, 0.49);
  z4.add(sign4);

  const tabBody = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.85, 0.65, 0.56)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.45 }))
  );
  tabBody.position.set(0, 1.04, -0.05);
  tabBody.castShadow = true;
  z4.add(tabBody);

  const dialHand = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.04, 0.24, 0.04)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.5 }))
  );
  dialHand.position.set(0, 1.08, 0.25);
  z4.add(dialHand);

  const punchCard = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.46, 0.03, 0.28)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.75 }))
  );
  punchCard.position.set(0, 0.78, 0.32);
  z4.add(punchCard);

  const hollerith = buildRobloxActor(tracker, {
    shirtHex: 0x0284c7,
    pantsHex: 0x1e293b,
    hat: 'glasses',
    prop: 'punchcard',
    propHex: 0xfef3c7,
    scale: 0.94,
  });
  hollerith.root.position.set(0, 0, -0.78);
  z4.add(hollerith.root);

  // =========================================================================
  // ZONE 5 (x = +5.4): LAB LISTRIK 1940 — SAKELAR LAMPU 1 / 0 (BOOLEAN)
  // =========================================================================
  const z5 = new THREE.Group();
  z5.position.set(5.4, 0.1, 0.15);
  rootGroup.add(z5);

  const labBench = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(1.9, 0.68, 0.95)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.55 }))
  );
  labBench.position.set(0, 0.34, 0);
  labBench.castShadow = true;
  z5.add(labBench);

  const sign5 = buildStorySignPlate(tracker, maxAniso, {
    title: '5. SAKELAR 1 / 0 (1940)',
    subtitle: 'LOGIKA BOOLEAN LISTRIK',
    bgHex: '#064E3B',
    fgHex: '#FEF08A',
    borderHex: '#10B981',
    width: 1.84,
    height: 0.46,
    texW: 340,
    texH: 96,
    titlePx: 24,
    subPx: 21,
  });
  sign5.position.set(0, 0.34, 0.5);
  z5.add(sign5);

  const boolBulbs: THREE.MeshStandardMaterial[] = [];
  for (let i = 0; i < 4; i++) {
    const bx = -0.58 + i * 0.38;
    const socket = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.1, 0.12, 0.16, 10)), steelMat);
    socket.position.set(bx, 0.76, 0);
    z5.add(socket);

    const bMat = tracker.mat(
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 0.85,
        roughness: 0.2,
      })
    );
    const bulb = new THREE.Mesh(tracker.geo(new THREE.SphereGeometry(0.13, 12, 10)), bMat);
    bulb.position.set(bx, 0.95, 0);
    z5.add(bulb);
    boolBulbs.push(bMat);
  }

  const atanasoff = buildRobloxActor(tracker, {
    shirtHex: 0x10b981,
    pantsHex: 0x334155,
    labCoat: true,
    scale: 0.94,
  });
  atanasoff.root.position.set(0, 0, -0.8);
  z5.add(atanasoff.root);

  return {
    rootGroup,
    stageTheme: 'story-bright',
    initialAtmosphere: STORY_ATMOSPHERE_PRESETS['ancient-market'],
    update(
      elapsed: number,
      dt: number,
      mechAction: string | undefined,
      anchor: [number, number, number],
      _domainColor: string,
      isPlaying: boolean,
      _story?: TheaterStoryContext
    ) {
      const animT = isPlaying ? elapsed : elapsed * 0.25;
      backdrop.update(animT, dt);

      const skyTint =
        mechAction === 'hist-pascal'
          ? 0xffecd2
          : mechAction === 'hist-boolean'
            ? 0xe8f6ff
            : 0xffffff;
      backdrop.setMoodTint(skyTint, dt);

      animateRobloxActor(merchant, 'abacus-slide', animT, 0);
      abacusBeads.forEach((bead, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        const shift = Math.sin(animT * 2.2 + row * 1.4) > 0.15 && col >= 2 ? 0.22 : 0;
        bead.position.x = -0.34 + col * 0.15 + shift;
      });

      animateRobloxActor(pascalActor, 'crank-gear', animT, 0.6);
      zone2Machinery.update(animT);

      animateRobloxActor(babbage, 'factory-work', animT, 1.1);
      animateRobloxActor(adaLovelace, 'write-board', animT, 0.3);
      engCols.forEach((c, i) => {
        c.rotation.y = animT * (i % 2 === 0 ? 1.6 : -1.6);
      });
      steamPuffs.forEach((puff, i) => {
        const u = (animT * 0.75 + i * 0.33) % 1;
        puff.position.y = 1.75 + u * 1.25;
        puff.position.x = -0.35 + Math.sin(animT * 2 + i) * 0.12;
        const s = 0.55 + u * 0.85;
        puff.scale.setScalar(s);
      });

      animateRobloxActor(hollerith, 'factory-work', animT, 0.4);
      dialHand.rotation.z = -animT * 6.5;
      const cardU = (animT * 1.35) % 1;
      punchCard.position.z = 0.48 - cardU * 0.45;

      animateRobloxActor(atanasoff, 'typing', animT, 0.9);
      const binState = Math.floor(animT * 2.5);
      boolBulbs.forEach((m, i) => {
        const isOn = ((binState >> i) & 1) === 1;
        m.emissiveIntensity = isOn ? 1.15 : 0.06;
        m.color.setHex(isOn ? 0x10b981 : 0x334155);
      });

      warmCue.update(animT, dt, anchor, true);
    },
    dispose() {
      tracker.disposeAll();
    },
  };
}
