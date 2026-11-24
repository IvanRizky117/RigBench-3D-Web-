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
  type BuiltRobloxActor,
} from './robloxActorBuilder';
import { buildPottedPlant } from './storyPropsKit';
import { buildStorySignPlate } from './storyLabelKit';

export function buildStoryArchParallelScene(
  maxAniso: number,
  textureScale: number
): BuiltTheaterDiorama {
  const tracker = new DioramaResourceTracker(textureScale);
  const rootGroup = new THREE.Group();

  const backdrop = buildStoryBackdrop(tracker, rootGroup, 'sunny-campus', 0x76bf63);
  const warmCue = buildWarmStoryCue(tracker, rootGroup);

  // Central stone walkway dividing Left Wing & Right Wing
  const path = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(1.1, 0.08, 6.2)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.85 }))
  );
  path.position.set(0, 0.01, 0.1);
  path.receiveShadow = true;
  rootGroup.add(path);

  // =========================================================================
  // LEFT WING: MULTIPROSESOR (4 KOKI BACA 1 PAPAN RESEP BERSAMA · SHARED-MEMORY)
  // =========================================================================
  const mpGroup = new THREE.Group();
  mpGroup.position.set(-3.15, 0, 0.05);
  rootGroup.add(mpGroup);

  const mpFloor = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(4.9, 0.16, 4.9)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xcfe8dc, roughness: 0.78 }))
  );
  mpFloor.position.y = 0.08;
  mpFloor.receiveShadow = true;
  mpFloor.castShadow = true;
  mpGroup.add(mpFloor);

  const mpBorder = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(5.05, 0.12, 5.05)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.5 }))
  );
  mpBorder.position.y = 0.06;
  mpGroup.add(mpBorder);

  // Front Wing Banner
  const mpTitleSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'MULTIPROSESOR · SHARED-MEMORY',
    subtitle: '4 KOKI · 1 PAPAN RESEP BERSAMA',
    bgHex: '#064E3B',
    fgHex: '#FEF08A',
    subHex: '#A7F3D0',
    borderHex: '#10B981',
    width: 4.3,
    height: 0.65,
    texW: 512,
    texH: 108,
    titlePx: 28,
    subPx: 22,
  });
  mpTitleSign.position.set(0, 0.45, 2.52);
  mpGroup.add(mpTitleSign);

  // Giant Central Shared Recipe Board Island (replaces plain cylinder!)
  const boardStand = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(1.65, 0.52, 0.95)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 }))
  );
  boardStand.position.y = 0.42;
  boardStand.castShadow = true;
  mpGroup.add(boardStand);

  const recipeBoard = buildStorySignPlate(tracker, maxAniso, {
    title: '1 PAPAN RESEP',
    subtitle: 'MEMORI BERSAMA',
    bgHex: '#052E16',
    fgHex: '#FEF08A',
    subHex: '#6EE7B7',
    borderHex: '#34D399',
    width: 1.75,
    height: 1.05,
    texW: 320,
    texH: 192,
    titlePx: 34,
    subPx: 26,
  });
  recipeBoard.position.set(0, 1.32, 0);
  mpGroup.add(recipeBoard);

  const cableSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'KABEL RUMIT & MAHAL',
    bgHex: '#78350F',
    fgHex: '#FEF08A',
    borderHex: '#F59E0B',
    width: 2.25,
    height: 0.34,
    texW: 360,
    texH: 64,
    titlePx: 24,
  });
  cableSign.position.set(0, 2.38, 0);
  mpGroup.add(cableSign);

  const mpActors: BuiltRobloxActor[] = [];
  const mpPulses: THREE.Mesh[] = [];
  const cableMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.35,
      roughness: 0.32,
      metalness: 0.45,
    })
  );

  // 4 Roblox Chefs positioned cleanly at 3/4 camera-friendly angles around the shared recipe board!
  const mpPositions: Array<[number, number, number]> = [
    [-1.65, -1.35, 0.35],
    [1.65, -1.35, -0.35],
    [-1.72, 1.1, 0.72],
    [1.72, 1.1, -0.72],
  ];

  mpPositions.forEach(([px, pz, rotY], idx) => {
    const stove = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(0.74, 0.44, 0.74)),
      tracker.mat(new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.48 }))
    );
    stove.position.set(px * 0.72, 0.38, pz * 0.72);
    stove.castShadow = true;
    mpGroup.add(stove);

    const chef = buildRobloxActor(tracker, {
      shirtHex: 0x10b981,
      pantsHex: 0x1e293b,
      hat: idx % 2 === 0 ? 'cap' : 'glasses',
      hatHex: 0xffffff,
      scale: 0.88,
    });
    chef.root.position.set(px, 0.16, pz);
    chef.root.rotation.y = rotY;
    mpGroup.add(chef.root);
    mpActors.push(chef);

    const archCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(px * 0.72, 0.65, pz * 0.72),
      new THREE.Vector3(px * 0.36, 2.25, pz * 0.36),
      new THREE.Vector3(0, 1.88, 0),
    ]);
    const tube = new THREE.Mesh(
      tracker.geo(new THREE.TubeGeometry(archCurve, 14, 0.048, 6, false)),
      cableMat
    );
    mpGroup.add(tube);

    const pulse = new THREE.Mesh(
      tracker.geo(new THREE.SphereGeometry(0.11, 10, 10)),
      tracker.mat(
        new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.85,
        })
      )
    );
    mpGroup.add(pulse);
    mpPulses.push(pulse);
  });

  // =========================================================================
  // RIGHT WING: MULTIKOMPUTER (4 DAPUR TERPISAH + CHAT WA · MESSAGE-PASSING)
  // =========================================================================
  const mcGroup = new THREE.Group();
  mcGroup.position.set(3.15, 0, 0.05);
  rootGroup.add(mcGroup);

  const mcFloor = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(4.9, 0.16, 4.9)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xe6d3b8, roughness: 0.78 }))
  );
  mcFloor.position.y = 0.08;
  mcFloor.receiveShadow = true;
  mcGroup.add(mcFloor);

  const mcBorder = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(5.05, 0.12, 5.05)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 }))
  );
  mcBorder.position.y = 0.06;
  mcGroup.add(mcBorder);

  const mcTitleSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'MULTIKOMPUTER · MESSAGE-PASSING',
    subtitle: '4 DAPUR TERPISAH · KIRIM CHAT WA',
    bgHex: '#78350F',
    fgHex: '#FEF08A',
    subHex: '#FDE68A',
    borderHex: '#F59E0B',
    width: 4.3,
    height: 0.65,
    texW: 512,
    texH: 108,
    titlePx: 27,
    subPx: 22,
  });
  mcTitleSign.position.set(0, 0.45, 2.52);
  mcGroup.add(mcTitleSign);

  const boothColors = [0xfde68a, 0xbae6fd, 0xfbcfe8, 0xc7d2fe];
  const boothAccents = [0xd97706, 0x0284c7, 0xdb2777, 0x4f46e5];
  const mcCoords: Array<[number, number]> = [
    [-1.45, -1.38],
    [1.45, -1.38],
    [-1.45, 1.35],
    [1.45, 1.35],
  ];
  const mcWorkers: BuiltRobloxActor[] = [];

  mcCoords.forEach(([bx, bz], idx) => {
    const booth = new THREE.Group();
    booth.position.set(bx, 0.16, bz);

    const bBase = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(1.65, 0.1, 1.65)),
      tracker.mat(new THREE.MeshStandardMaterial({ color: boothColors[idx], roughness: 0.72 }))
    );
    bBase.position.y = 0.05;
    bBase.receiveShadow = true;
    booth.add(bBase);

    const wallBack = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(1.65, 1.15, 0.1)),
      tracker.mat(new THREE.MeshStandardMaterial({ color: boothAccents[idx], roughness: 0.62 }))
    );
    wallBack.position.set(0, 0.62, -0.78);
    wallBack.castShadow = true;
    booth.add(wallBack);

    const boothSign = buildStorySignPlate(tracker, maxAniso, {
      title: `DAPUR ${idx + 1} · LOKAL`,
      bgHex: '#0F172A',
      fgHex: '#F8FAFC',
      borderHex: '#F59E0B',
      width: 1.45,
      height: 0.28,
      texW: 256,
      texH: 56,
      titlePx: 24,
    });
    boothSign.position.set(0, 1.02, -0.7);
    booth.add(boothSign);

    // Personal Local Recipe Shelf inside each kitchen
    const localShelf = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(0.45, 0.78, 0.34)),
      tracker.mat(new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 }))
    );
    localShelf.position.set(-0.5, 0.48, -0.42);
    localShelf.castShadow = true;
    booth.add(localShelf);

    const desk = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(0.68, 0.44, 0.42)),
      tracker.mat(new THREE.MeshStandardMaterial({ color: 0x9a6b41, roughness: 0.7 }))
    );
    desk.position.set(0.32, 0.3, -0.35);
    desk.castShadow = true;
    booth.add(desk);

    // 3/4 forward-facing kitchen worker (never back-turned!)
    const worker = buildRobloxActor(tracker, {
      shirtHex: boothAccents[idx],
      pantsHex: 0x1e293b,
      hat: idx === 0 ? 'cap' : 'none',
      hatHex: 0xffffff,
      scale: 0.78,
    });
    worker.root.position.set(0.18, 0.1, 0.28);
    worker.root.rotation.y = idx % 2 === 0 ? 0.35 : -0.35;
    booth.add(worker.root);
    mcWorkers.push(worker);

    mcGroup.add(booth);
  });

  // Wooden Network Bridges connecting the 4 separate kitchens
  const bridgeMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x9a5b25, roughness: 0.68 })
  );
  const bTop = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(2.8, 0.08, 0.42)), bridgeMat);
  bTop.position.set(0, 0.22, -1.38);
  mcGroup.add(bTop);
  const bBot = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(2.8, 0.08, 0.42)), bridgeMat);
  bBot.position.set(0, 0.22, 1.35);
  mcGroup.add(bBot);
  const bLeft = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.42, 0.08, 2.75)), bridgeMat);
  bLeft.position.set(-1.45, 0.22, 0);
  mcGroup.add(bLeft);
  const bRight = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.42, 0.08, 2.75)), bridgeMat);
  bRight.position.set(1.45, 0.22, 0);
  mcGroup.add(bRight);

  // Cute Messenger Courier + Flying Green "CHAT WA" Message Bubbles!
  const messenger = buildRobloxActor(tracker, {
    shirtHex: 0xf59e0b,
    pantsHex: 0x1e293b,
    hat: 'cap',
    hatHex: 0xef4444,
    prop: 'parcel',
    propHex: 0x22c55e,
    scale: 0.76,
  });
  messenger.root.position.set(0, 0.26, 0);
  mcGroup.add(messenger.root);

  const chatBubbleA = buildStorySignPlate(tracker, maxAniso, {
    title: 'CHAT WA ✓✓',
    bgHex: '#15803D',
    fgHex: '#FFFFFF',
    borderHex: '#4ADE80',
    width: 0.82,
    height: 0.34,
    texW: 200,
    texH: 80,
    titlePx: 26,
  });
  const chatBubbleB = buildStorySignPlate(tracker, maxAniso, {
    title: 'KIRIM DATA ✓✓',
    bgHex: '#15803D',
    fgHex: '#FFFFFF',
    borderHex: '#4ADE80',
    width: 0.92,
    height: 0.34,
    texW: 224,
    texH: 80,
    titlePx: 24,
  });
  mcGroup.add(chatBubbleA, chatBubbleB);

  const plantCenter = buildPottedPlant(tracker);
  plantCenter.position.set(0, 0.05, -2.5);
  rootGroup.add(plantCenter);

  return {
    rootGroup,
    stageTheme: 'story-bright',
    initialAtmosphere: STORY_ATMOSPHERE_PRESETS['sunny-campus'],
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

      const mpHot = mechAction === 'parallel-mp' || mechAction === 'parallel-tradeoff';
      const mcHot = mechAction === 'parallel-mc' || mechAction === 'parallel-msg';

      recipeBoard.position.y = 1.32 + Math.sin(animT * 2.2) * 0.04;
      cableMat.emissiveIntensity = mpHot ? 0.72 : 0.28;

      mpActors.forEach((a, i) => animateRobloxActor(a, 'write-board', animT, i * 0.9));
      mpPositions.forEach(([px, pz], i) => {
        const u = (animT * (mpHot ? 1.5 : 0.95) + i * 0.25) % 1;
        const frac = u < 0.5 ? u * 2 : (1 - u) * 2;
        const pulse = mpPulses[i];
        pulse.position.set(
          THREE.MathUtils.lerp(px * 0.72, 0, frac),
          0.65 + Math.sin(frac * Math.PI) * 1.55,
          THREE.MathUtils.lerp(pz * 0.72, 0, frac)
        );
      });

      mcWorkers.forEach((w, i) => animateRobloxActor(w, 'typing', animT, i * 0.8));

      const loop = (animT * (mcHot ? 0.42 : 0.28)) % 4;
      const side = Math.floor(loop);
      const frac = loop - side;
      if (side === 0) {
        messenger.root.position.set(THREE.MathUtils.lerp(-1.45, 1.45, frac), 0.26, 1.35);
        messenger.root.rotation.y = Math.PI / 2;
      } else if (side === 1) {
        messenger.root.position.set(1.45, 0.26, THREE.MathUtils.lerp(1.35, -1.38, frac));
        messenger.root.rotation.y = Math.PI;
      } else if (side === 2) {
        messenger.root.position.set(THREE.MathUtils.lerp(1.45, -1.45, frac), 0.26, -1.38);
        messenger.root.rotation.y = -Math.PI / 2;
      } else {
        messenger.root.position.set(-1.45, 0.26, THREE.MathUtils.lerp(-1.38, 1.35, frac));
        messenger.root.rotation.y = 0;
      }
      animateRobloxActor(messenger, 'sprint-courier', animT, 0);

      // Flying green WA chat bubbles arcing between separate kitchens!
      const eU = (animT * 0.75) % 1;
      chatBubbleA.position.set(
        THREE.MathUtils.lerp(-1.35, 1.35, eU),
        1.45 + Math.sin(eU * Math.PI) * 0.85,
        -1.35
      );
      const eV = (animT * 0.75 + 0.5) % 1;
      chatBubbleB.position.set(
        THREE.MathUtils.lerp(1.35, -1.35, eV),
        1.45 + Math.sin(eV * Math.PI) * 0.85,
        1.35
      );

      warmCue.update(animT, dt, anchor, true);
    },
    dispose() {
      tracker.disposeAll();
    },
  };
}
