import * as THREE from 'three';
import {
  DioramaResourceTracker,
  type BuiltTheaterDiorama,
  type TheaterStoryContext,
} from './theaterDioramaCore';
import {
  STORY_ATMOSPHERE_PRESETS,
  buildCutawayRoom,
  buildStoryBackdrop,
  buildWarmStoryCue,
} from './storyEnvironmentKit';
import {
  animateRobloxActor,
  buildRobloxActor,
  type BuiltRobloxActor,
} from './robloxActorBuilder';
import {
  buildPottedPlant,
  buildStylizedDeskPc,
} from './storyPropsKit';
import {
  buildAnalogClockProp,
  buildMiniCarProp,
  buildStorySignPlate,
} from './storyLabelKit';
import {
  buildDetailedFaxMachine,
  buildDetailedMapScroll,
  buildDigitalNumberScreenMesh,
  buildSixComputerForms,
  enhanceCarHardware,
} from './historyClassS3DetailedProps';
import { buildDetailedSwErasProps } from './historySwErasDetailedProps';

export function buildStoryHistoryClassScene(
  maxAniso: number,
  textureScale: number
): BuiltTheaterDiorama {
  const tracker = new DioramaResourceTracker(textureScale);
  const rootGroup = new THREE.Group();

  const backdrop = buildStoryBackdrop(tracker, rootGroup, 'cozy-day', 0x76bf63);
  const warmCue = buildWarmStoryCue(tracker, rootGroup);

  // =========================================================================
  // ACT A: ANALOGI 3 ELEMEN (MOBIL=HARDWARE · PETA GULUNGAN=SOFTWARE · SUPIR=BRAINWARE)
  // =========================================================================
  const skitGroup = new THREE.Group();
  rootGroup.add(skitGroup);

  const skitRoom = buildCutawayRoom(tracker, {
    width: 7.4,
    depth: 4.6,
    wallHeight: 2.65,
    floorHex: 0xc9a67c,
    wallHex: 0xe6d6bf,
    trimHex: 0x7c5836,
    rugHex: 0x93c5fd,
    hasWindow: false,
  });
  skitRoom.position.set(0, 0, -0.25);
  skitGroup.add(skitRoom);

  const skitBanner = buildStorySignPlate(tracker, maxAniso, {
    title: '3 UNSUR KOMPUTER = NAIK MOBIL',
    subtitle: 'MOBIL (HARDWARE) · PETA (SOFTWARE) · SUPIR (BRAINWARE)',
    bgHex: '#0F172A',
    fgHex: '#FEF08A',
    subHex: '#7DD3FC',
    borderHex: '#38BDF8',
    width: 5.4,
    height: 0.78,
    texW: 680,
    texH: 120,
    titlePx: 30,
    subPx: 21,
  });
  skitBanner.position.set(0, 2.28, -2.35);
  skitGroup.add(skitBanner);

  // Left: Detailed Mini Car (Hardware = Mobil Fisik with headlights & bumper!)
  const carProp = buildMiniCarProp(tracker, 0x0284c7);
  enhanceCarHardware(tracker, carProp);
  carProp.position.set(-1.95, 0.16, -0.45);
  carProp.rotation.y = 0.42;
  skitGroup.add(carProp);

  const hwSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'HARDWARE · MOBIL',
    bgHex: '#0C4A6E',
    fgHex: '#E0F2FE',
    borderHex: '#38BDF8',
    width: 1.55,
    height: 0.34,
    texW: 280,
    texH: 64,
    titlePx: 24,
  });
  hwSign.position.set(-1.95, 0.4, 0.38);
  skitGroup.add(hwSign);

  // Right-Center: PC Desk (turns bright ON when Brainware operates it!)
  const skitDesk = buildStylizedDeskPc(tracker, {
    deskHex: 0x9a6b41,
    screenHex: 0x38bdf8,
    screenOn: false,
  });
  skitDesk.group.position.set(1.25, 0.16, -0.82);
  skitDesk.group.rotation.y = -0.25;
  skitGroup.add(skitDesk.group);

  const skitPlant = buildPottedPlant(tracker);
  skitPlant.position.set(-3.05, 0.16, -1.78);
  skitGroup.add(skitPlant);

  // Unrolled 3D Road-Map Scroll (SOFTWARE · PETA JALAN)
  const swMapScroll = buildDetailedMapScroll(tracker, maxAniso);
  swMapScroll.position.set(0.0, 1.55, -0.65);
  skitGroup.add(swMapScroll);

  const sparkles: THREE.Mesh[] = [];
  const sparkleCols = [0x38bdf8, 0x34d399, 0xfbbf24, 0xf472b6];
  for (let i = 0; i < 4; i++) {
    const sp = new THREE.Mesh(
      tracker.geo(new THREE.OctahedronGeometry(0.11, 0)),
      tracker.mat(
        new THREE.MeshStandardMaterial({
          color: sparkleCols[i],
          emissive: sparkleCols[i],
          emissiveIntensity: 0.85,
        })
      )
    );
    sp.position.set(0.8 + i * 0.3, 1.58, -0.92);
    sp.visible = false;
    skitGroup.add(sp);
    sparkles.push(sp);
  }

  const brainwareHero = buildRobloxActor(tracker, {
    shirtHex: 0x10b981,
    pantsHex: 0x1e3a8a,
    hat: 'cap',
    hatHex: 0xf59e0b,
    scale: 1.0,
  });
  brainwareHero.root.position.set(-0.35, 0.16, 0.55);
  brainwareHero.root.rotation.y = 0.35;
  skitGroup.add(brainwareHero.root);

  // =========================================================================
  // ACT B: JAM ANALOG, LAYAR DIGITAL (0-9), MESIN FAX & 6 BENTUK FISIK
  // =========================================================================
  const classGroup = new THREE.Group();
  rootGroup.add(classGroup);

  const showFloor = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(12.2, 0.18, 5.2)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xd8c8b4, roughness: 0.78 }))
  );
  showFloor.position.set(0.4, 0.04, -0.2);
  showFloor.receiveShadow = true;
  classGroup.add(showFloor);

  // 1. ANALOG: Big Circular Sweeping Clock Dial
  const analogPod = new THREE.Group();
  analogPod.position.set(-3.45, 0.13, -0.5);
  const aStand = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(1.65, 0.7, 1.05)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.45 }))
  );
  aStand.position.y = 0.35;
  aStand.castShadow = true;
  analogPod.add(aStand);

  const analogSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'ANALOG · JARUM HALUS',
    subtitle: 'DATA KUALITATIF',
    bgHex: '#064E3B',
    fgHex: '#FEF08A',
    borderHex: '#34D399',
    width: 1.56,
    height: 0.48,
    texW: 320,
    texH: 96,
    titlePx: 23,
    subPx: 20,
  });
  analogSign.position.set(0, 0.36, 0.55);
  analogPod.add(analogSign);

  const analogClock = buildAnalogClockProp(tracker, maxAniso);
  analogClock.group.position.set(0, 1.24, 0);
  analogPod.add(analogClock.group);
  classGroup.add(analogPod);

  // 2. DIGITAL: PC with Crisp "0 1 2 3 4 5 6 7 8 9" Directly on Monitor Screen!
  const digDesk = buildStylizedDeskPc(tracker, { deskHex: 0x93c5fd, screenHex: 0x38bdf8 });
  digDesk.group.position.set(-0.65, 0.13, -0.5);
  digDesk.group.add(buildDigitalNumberScreenMesh(tracker, maxAniso));
  classGroup.add(digDesk.group);

  const digDigitsBoard = buildStorySignPlate(tracker, maxAniso, {
    title: '0 1 2 3 4 5 6 7 8 9',
    subtitle: 'DIGITAL · KUANTITATIF',
    bgHex: '#0C4A6E',
    fgHex: '#FEF08A',
    subHex: '#7DD3FC',
    borderHex: '#38BDF8',
    width: 1.75,
    height: 0.56,
    texW: 340,
    texH: 108,
    titlePx: 28,
    subPx: 21,
  });
  digDigitsBoard.position.set(-0.65, 1.82, -0.78);
  classGroup.add(digDigitsBoard);

  // 3. HYBRID: Detailed Facsimile Machine with keypad, LCD, handset, & printed sheet
  const faxBuilt = buildDetailedFaxMachine(tracker, maxAniso);
  faxBuilt.group.position.set(1.45, 0.13, -0.5);
  classGroup.add(faxBuilt.group);

  // 4. 6 Unmistakable Miniature Computer Form Factors (Tower -> Palmtop)
  buildSixComputerForms(tracker, maxAniso, classGroup);

  const presenter = buildRobloxActor(tracker, {
    shirtHex: 0x0ea5e9,
    pantsHex: 0x1e293b,
    hat: 'glasses',
    scale: 0.96,
  });
  presenter.root.position.set(0.3, 0.13, 1.12);
  classGroup.add(presenter.root);

  // =========================================================================
  // ACT C: TANGGA 4 ERA SOFTWARE (PIONER -> STABIL -> MIKRO -> MODERN)
  // =========================================================================
  const swErasGroup = new THREE.Group();
  rootGroup.add(swErasGroup);

  const eraSteps = [
    {
      x: -3.9,
      h: 0.55,
      col: 0xd97706,
      shirt: 0xf59e0b,
      hat: 'hardhat' as const,
      title: '1. ERA PIONER',
      sub: 'KARTU LUBANG · BATCH',
      bg: '#78350F',
      border: '#FBBF24',
    },
    {
      x: -1.3,
      h: 1.0,
      col: 0x059669,
      shirt: 0x10b981,
      hat: 'glasses' as const,
      title: '2. ERA STABIL',
      sub: 'MULTI-USER · DATABASE',
      bg: '#064E3B',
      border: '#34D399',
    },
    {
      x: 1.3,
      h: 1.45,
      col: 0x0284c7,
      shirt: 0x0ea5e9,
      hat: 'cap' as const,
      title: '3. ERA MIKRO',
      sub: 'PC MURAH · SISTEM/APP',
      bg: '#0C4A6E',
      border: '#38BDF8',
    },
    {
      x: 3.9,
      h: 1.9,
      col: 0x7c3aed,
      shirt: 0xa855f7,
      hat: 'headset' as const,
      title: '4. ERA MODERN',
      sub: 'HP · TV · SUARA & AI',
      bg: '#3B0764',
      border: '#C084FC',
    },
  ];
  const eraActors: BuiltRobloxActor[] = [];

  eraSteps.forEach((st, idx) => {
    const block = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(2.38, st.h, 2.6)),
      tracker.mat(new THREE.MeshStandardMaterial({ color: st.col, roughness: 0.55 }))
    );
    block.position.set(st.x, st.h / 2, -0.2);
    block.castShadow = true;
    block.receiveShadow = true;
    swErasGroup.add(block);

    const stepSign = buildStorySignPlate(tracker, maxAniso, {
      title: st.title,
      subtitle: st.sub,
      bgHex: st.bg,
      fgHex: '#FEF08A',
      borderHex: st.border,
      width: 2.18,
      height: 0.48,
      texW: 340,
      texH: 92,
      titlePx: 26,
      subPx: 20,
    });
    stepSign.position.set(st.x, Math.max(0.28, st.h - 0.3), 1.13);
    swErasGroup.add(stepSign);

    const actor = buildRobloxActor(tracker, {
      shirtHex: st.shirt,
      pantsHex: 0x1e293b,
      hat: st.hat,
      hatHex: idx === 3 ? 0x38bdf8 : 0xfef08a,
      scale: 0.9,
    });
    actor.root.position.set(st.x + 0.45, st.h, 0.35);
    actor.root.rotation.y = -0.22;
    swErasGroup.add(actor.root);
    eraActors.push(actor);
  });

  const swErasProps = buildDetailedSwErasProps(
    tracker,
    maxAniso,
    swErasGroup,
    eraSteps.map((s) => s.x),
    eraSteps.map((s) => s.h)
  );

  let skitW = 1;
  let classW = 0;
  let swW = 0;

  return {
    rootGroup,
    stageTheme: 'story-bright',
    initialAtmosphere: STORY_ATMOSPHERE_PRESETS['cozy-day'],
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

      const isSkit =
        !mechAction ||
        mechAction === 'class-elements' ||
        mechAction === 'class-hw-only' ||
        mechAction === 'class-sw-drop' ||
        mechAction === 'class-brainware-boot';
      const isClass = mechAction === 'class-data' || mechAction === 'class-form';
      const isSw = Boolean(mechAction && mechAction.startsWith('sw-era-'));

      skitW = THREE.MathUtils.damp(skitW, isSkit ? 1 : 0, 7.5, dt);
      classW = THREE.MathUtils.damp(classW, isClass ? 1 : 0, 7.5, dt);
      swW = THREE.MathUtils.damp(swW, isSw ? 1 : 0, 7.5, dt);

      skitGroup.visible = skitW > 0.02;
      skitGroup.scale.setScalar(Math.max(0.01, skitW));
      skitGroup.position.y = (1 - skitW) * -1.2;

      classGroup.visible = classW > 0.02;
      classGroup.scale.setScalar(Math.max(0.01, classW));
      classGroup.position.y = (1 - classW) * -1.2;

      swErasGroup.visible = swW > 0.02;
      swErasGroup.scale.setScalar(Math.max(0.01, swW));
      swErasGroup.position.y = (1 - swW) * -1.2;

      if (skitGroup.visible) {
        const hwOnly = mechAction === 'class-hw-only';
        const swDrop = mechAction === 'class-sw-drop';
        const booted = mechAction === 'class-brainware-boot' || mechAction === 'class-elements';

        const targetSwY = hwOnly ? 3.2 : swDrop ? 1.48 + Math.sin(animT * 3.8) * 0.08 : 1.38;
        swMapScroll.position.y = THREE.MathUtils.damp(swMapScroll.position.y, targetSwY, 5.5, dt);
        swMapScroll.rotation.y = Math.sin(animT * 1.4) * 0.1;
        swMapScroll.visible = !hwOnly;

        const targetHeroX = booted ? 0.45 : swDrop ? -0.35 : -0.95;
        const targetHeroZ = booted ? -0.15 : 0.45;
        brainwareHero.root.position.x = THREE.MathUtils.damp(brainwareHero.root.position.x, targetHeroX, 5.2, dt);
        brainwareHero.root.position.z = THREE.MathUtils.damp(brainwareHero.root.position.z, targetHeroZ, 5.2, dt);
        brainwareHero.root.rotation.y = THREE.MathUtils.damp(
          brainwareHero.root.rotation.y,
          booted ? 0.55 : 0.25,
          6,
          dt
        );

        animateRobloxActor(
          brainwareHero,
          hwOnly ? 'confused' : swDrop ? 'walk-carry' : 'typing',
          animT,
          0
        );

        skitDesk.screenMat.color.setHex(booted ? 0x38bdf8 : 0x1e293b);
        skitDesk.screenMat.emissive.setHex(booted ? 0x38bdf8 : 0x000000);
        skitDesk.screenMat.emissiveIntensity = booted ? 0.72 + Math.sin(animT * 5) * 0.12 : 0;

        sparkles.forEach((sp, i) => {
          sp.visible = booted;
          if (booted) {
            sp.position.y = 1.56 + Math.sin(animT * 4.5 + i * 1.4) * 0.16;
            sp.rotation.y = animT * 3;
          }
        });
      }

      if (classGroup.visible) {
        analogClock.handPivot.rotation.z = -animT * 1.65;
        faxBuilt.outSheet.position.z = 0.26 + ((animT * 0.55) % 1) * 0.22;
        animateRobloxActor(presenter, 'idle-wave', animT, 0.5);
        const px = mechAction === 'class-form' ? 2.15 : -0.4;
        presenter.root.position.x = THREE.MathUtils.damp(presenter.root.position.x, px, 4.5, dt);
      }

      if (swErasGroup.visible) {
        eraActors.forEach((a, i) => {
          const act = i === 3 ? 'celebrate' : i === 2 ? 'typing' : i === 1 ? 'write-board' : 'factory-work';
          animateRobloxActor(a, act, animT, i * 0.7);
        });
        swErasProps.update(animT);
      }

      warmCue.update(animT, dt, anchor, true);
    },
    dispose() {
      tracker.disposeAll();
    },
  };
}
