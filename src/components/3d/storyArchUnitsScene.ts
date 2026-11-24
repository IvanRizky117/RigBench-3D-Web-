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
  buildServerRack,
  buildStylizedDeskPc,
  buildStylizedPrinter,
} from './storyPropsKit';
import {
  buildDetailedAluStation,
  buildDetailedMemoryCabinet,
  buildDetailedRegisterBufferBridge,
} from './archUnitsDetailedProps';

export function buildStoryArchUnitsScene(
  maxAniso: number,
  textureScale: number
): BuiltTheaterDiorama {
  const tracker = new DioramaResourceTracker(textureScale);
  const rootGroup = new THREE.Group();

  const backdrop = buildStoryBackdrop(tracker, rootGroup, 'sunny-campus', 0x6cb85d);
  const warmCue = buildWarmStoryCue(tracker, rootGroup);

  // =========================================================================
  // ACT A: PARADE 5 RUANGAN MINI (5 TIPE KOMPUTER: PC -> SUPERCOMPUTER)
  // =========================================================================
  const paradeGroup = new THREE.Group();
  rootGroup.add(paradeGroup);

  const terrace = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(15.2, 0.14, 3.8)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.78 }))
  );
  terrace.position.set(0, 0.01, -0.2);
  terrace.receiveShadow = true;
  paradeGroup.add(terrace);

  const paradeActors: BuiltRobloxActor[] = [];
  const paradeLeds: THREE.MeshStandardMaterial[] = [];
  let weatherGlobe: THREE.Mesh | null = null;

  const roomSpecs = [
    { x: -5.6, floor: 0xd9b38c, wall: 0xedd5be, rug: 0x3b82f6, shirt: 0x2563eb },
    { x: -2.8, floor: 0xcbd5e1, wall: 0xd1ebd9, rug: 0x10b981, shirt: 0x059669 },
    { x: 0.0, floor: 0xc2bab2, wall: 0xede0c4, rug: 0xd97706, shirt: 0xd97706 },
    { x: 2.8, floor: 0xbac7d6, wall: 0xd2e5f5, rug: 0x0284c7, shirt: 0x0284c7 },
    { x: 5.6, floor: 0xcbd5e1, wall: 0xded4f5, rug: 0x9333ea, shirt: 0x7c3aed },
  ];

  roomSpecs.forEach((spec, idx) => {
    const rm = buildCutawayRoom(tracker, {
      width: 2.45,
      depth: 2.55,
      wallHeight: 2.15,
      floorHex: spec.floor,
      wallHex: spec.wall,
      trimHex: 0x7c5838,
      rugHex: spec.rug,
      hasWindow: true,
    });
    rm.position.set(spec.x, 0.08, -0.35);
    paradeGroup.add(rm);

    if (idx === 0) {
      const desk = buildStylizedDeskPc(tracker, { screenHex: 0x38bdf8 });
      desk.group.position.set(-0.2, 0.16, -0.38);
      rm.add(desk.group);
      const plant = buildPottedPlant(tracker);
      plant.position.set(0.86, 0.16, -0.82);
      rm.add(plant);
      const kid = buildRobloxActor(tracker, {
        shirtHex: spec.shirt,
        pantsHex: 0x1e3a8a,
        hat: 'cap',
        hatHex: 0xef4444,
        scale: 0.88,
      });
      kid.root.position.set(0.62, 0.16, 0.42);
      kid.root.rotation.y = -0.55;
      rm.add(kid.root);
      paradeActors.push(kid);
    } else if (idx === 1) {
      const desk = buildStylizedDeskPc(tracker, {
        deskHex: 0xd6d3d1,
        screenHex: 0x10b981,
        dualMonitor: true,
      });
      desk.group.position.set(-0.15, 0.16, -0.35);
      rm.add(desk.group);
      const designer = buildRobloxActor(tracker, {
        shirtHex: spec.shirt,
        pantsHex: 0x334155,
        hat: 'glasses',
        scale: 0.88,
      });
      designer.root.position.set(0.66, 0.16, 0.45);
      designer.root.rotation.y = -0.5;
      rm.add(designer.root);
      paradeActors.push(designer);
    } else if (idx === 2) {
      const r1 = buildServerRack(tracker, 1.65, 0xf59e0b);
      r1.group.position.set(-0.55, 0.16, -0.62);
      rm.add(r1.group);
      const r2 = buildServerRack(tracker, 1.65, 0xf59e0b);
      r2.group.position.set(0.45, 0.16, -0.62);
      rm.add(r2.group);
      paradeLeds.push(...r1.leds, ...r2.leds);

      const analyst = buildRobloxActor(tracker, {
        shirtHex: spec.shirt,
        pantsHex: 0x1e293b,
        prop: 'clipboard',
        propHex: 0xfef3c7,
        scale: 0.88,
      });
      analyst.root.position.set(0.55, 0.16, 0.48);
      analyst.root.rotation.y = -0.4;
      rm.add(analyst.root);
      paradeActors.push(analyst);
    } else if (idx === 3) {
      for (let s = -1; s <= 1; s++) {
        const rack = buildServerRack(tracker, 1.72, 0x38bdf8);
        rack.group.position.set(s * 0.72, 0.16, -0.64);
        rm.add(rack.group);
        paradeLeds.push(...rack.leds);
      }
      const admin = buildRobloxActor(tracker, {
        shirtHex: spec.shirt,
        pantsHex: 0x0f172a,
        hat: 'hardhat',
        hatHex: 0x38bdf8,
        prop: 'wrench',
        propHex: 0x94a3b8,
        scale: 0.88,
      });
      admin.root.position.set(0.58, 0.16, 0.48);
      admin.root.rotation.y = -0.45;
      rm.add(admin.root);
      paradeActors.push(admin);
    } else {
      for (const sx of [-0.75, 0.75]) {
        const tower = buildServerRack(tracker, 1.85, 0xa855f7);
        tower.group.position.set(sx, 0.16, -0.6);
        rm.add(tower.group);
        paradeLeds.push(...tower.leds);
      }
      const ped = new THREE.Mesh(
        tracker.geo(new THREE.CylinderGeometry(0.32, 0.38, 0.34, 14)),
        tracker.mat(new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.4 }))
      );
      ped.position.set(0, 0.33, -0.15);
      rm.add(ped);

      weatherGlobe = new THREE.Mesh(
        tracker.geo(new THREE.IcosahedronGeometry(0.34, 1)),
        tracker.mat(
          new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x6366f1,
            emissiveIntensity: 0.6,
            wireframe: true,
          })
        )
      );
      weatherGlobe.position.set(0, 0.96, -0.15);
      rm.add(weatherGlobe);

      const sci = buildRobloxActor(tracker, {
        shirtHex: 0x7c3aed,
        pantsHex: 0x334155,
        labCoat: true,
        hat: 'headset',
        hatHex: 0xa855f7,
        scale: 0.88,
      });
      sci.root.position.set(0.62, 0.16, 0.52);
      sci.root.rotation.y = -0.5;
      rm.add(sci.root);
      paradeActors.push(sci);
    }
  });

  // =========================================================================
  // ACT B: KANTOR POS DIGITAL (HIGH-CONTRAST WARM ROOM + DETAILED MACHINES)
  // =========================================================================
  const postOfficeGroup = new THREE.Group();
  rootGroup.add(postOfficeGroup);

  // Richer warm sand-latte walls + oak wood floor + darker trim so bright props POP cleanly!
  const hall = buildCutawayRoom(tracker, {
    width: 12.6,
    depth: 5.6,
    wallHeight: 2.9,
    floorHex: 0xc9a074,
    wallHex: 0xe6d7c3,
    trimHex: 0x8a613c,
    rugHex: 0x94b8db,
    hasWindow: true,
    windowSkyHex: 0x93c5fd,
  });
  hall.position.set(0, 0, -0.35);
  postOfficeGroup.add(hall);

  const pLeft = buildPottedPlant(tracker);
  pLeft.position.set(-5.75, 0.16, -2.55);
  postOfficeGroup.add(pLeft);
  const pRight = buildPottedPlant(tracker);
  pRight.position.set(5.75, 0.16, -2.55);
  postOfficeGroup.add(pRight);

  // --- STATION 1 (x = -4.65): UNIT INPUT DESK + SMILING 3/4 CLERK ---
  const inputDesk = buildStylizedDeskPc(tracker, { deskHex: 0xb9824f, screenHex: 0x38bdf8 });
  inputDesk.group.position.set(-4.65, 0.16, -1.65);
  inputDesk.group.rotation.y = 0.2;
  postOfficeGroup.add(inputDesk.group);

  const inputClerk = buildRobloxActor(tracker, {
    shirtHex: 0x0284c7,
    pantsHex: 0x1e293b,
    hat: 'cap',
    hatHex: 0x38bdf8,
    scale: 0.92,
  });
  // Positioned slightly to the left-side angled 3/4 toward camera (zero occlusion!)
  inputClerk.root.position.set(-5.35, 0.16, -0.82);
  inputClerk.root.rotation.y = 0.65;
  postOfficeGroup.add(inputClerk.root);

  // --- STATION 2 (x = -2.05): DETAILED 3-TIER MEMORY CABINET (CACHE + RAM 0x01–0x08 + HDD) ---
  const memoryCabinet = buildDetailedMemoryCabinet(tracker, maxAniso);
  memoryCabinet.group.position.set(-2.05, 0.16, -1.85);
  postOfficeGroup.add(memoryCabinet.group);

  const memClerk = buildRobloxActor(tracker, {
    shirtHex: 0x7c3aed,
    pantsHex: 0x1e293b,
    hat: 'glasses',
    prop: 'parcel',
    propHex: 0xfef08a,
    scale: 0.9,
  });
  // Stands cleanly to the LEFT of the Memory Cabinet facing 3/4 toward camera!
  memClerk.root.position.set(-3.28, 0.16, -1.05);
  memClerk.root.rotation.y = 0.58;
  postOfficeGroup.add(memClerk.root);

  // --- STATION 3 (x = 0.72): DETAILED GIANT ALU CALCULATOR + R1/R2/ACC REGISTER SLOTS ---
  const aluStation = buildDetailedAluStation(tracker, maxAniso);
  aluStation.group.position.set(0.72, 0.16, -1.78);
  postOfficeGroup.add(aluStation.group);

  const aluWorker = buildRobloxActor(tracker, {
    shirtHex: 0x059669,
    pantsHex: 0x1e293b,
    labCoat: true,
    scale: 0.9,
  });
  // Stands cleanly beside ALU on the LEFT angled 3/4 toward camera so face + calculator + R1/R2/ACC are all crystal clear!
  aluWorker.root.position.set(-0.52, 0.16, -1.08);
  aluWorker.root.rotation.y = 0.62;
  postOfficeGroup.add(aluWorker.root);

  // --- STATION 4 (x = 2.95, z = -0.35): DETAILED GLASS-PIPED REGISTER BUFFER -> PRINTER ---
  const bufferBridge = buildDetailedRegisterBufferBridge(tracker, maxAniso);
  bufferBridge.group.position.set(2.95, 0.16, -0.35);
  postOfficeGroup.add(bufferBridge.group);

  const printer = buildStylizedPrinter(tracker);
  // Placed right at the end of the Buffer outtake glass chute (x = 2.95 + 1.65 = 4.6)
  printer.group.position.set(4.65, 0.16, -0.45);
  printer.group.rotation.y = -0.18;
  postOfficeGroup.add(printer.group);

  // --- STATION 5 (x = 4.45, z = -1.95): UNIT KONTROL BALCONY + CONDUCTOR ---
  const ctrlBalcony = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(1.5, 0.92, 0.95)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.52 }))
  );
  ctrlBalcony.position.set(4.45, 0.62, -2.05);
  ctrlBalcony.castShadow = true;
  postOfficeGroup.add(ctrlBalcony);

  const conductor = buildRobloxActor(tracker, {
    shirtHex: 0xd97706,
    pantsHex: 0x1e293b,
    hat: 'cap',
    hatHex: 0xef4444,
    prop: 'baton',
    propHex: 0x38bdf8,
    scale: 0.9,
  });
  conductor.root.position.set(4.45, 1.08, -1.92);
  conductor.root.rotation.y = -0.22;
  postOfficeGroup.add(conductor.root);

  // --- FOREGROUND 3-LANE BUS HIGHWAY (DATA, ADDRESS, CONTROL) + COURIERS ---
  const laneColors = [0x0284c7, 0x7c3aed, 0xd97706];
  const laneZ = [0.85, 1.38, 1.91];
  const laneMats: THREE.MeshStandardMaterial[] = [];
  const couriers: Array<{ actor: BuiltRobloxActor; laneIdx: number; phase: number }> = [];

  laneZ.forEach((z, idx) => {
    const mat = tracker.mat(
      new THREE.MeshStandardMaterial({
        color: laneColors[idx],
        emissive: laneColors[idx],
        emissiveIntensity: 0.18,
        roughness: 0.48,
      })
    );
    laneMats.push(mat);
    const track = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(11.0, 0.09, 0.36)), mat);
    track.position.set(0, 0.2, z);
    track.receiveShadow = true;
    postOfficeGroup.add(track);

    const runner = buildRobloxActor(tracker, {
      shirtHex: laneColors[idx],
      pantsHex: 0x1e293b,
      hat: 'cap',
      hatHex: laneColors[idx],
      prop: 'parcel',
      propHex: 0xfef08a,
      scale: 0.78,
    });
    runner.root.position.set(-4.4 + idx * 2.5, 0.24, z);
    runner.root.rotation.y = Math.PI / 2;
    postOfficeGroup.add(runner.root);
    couriers.push({ actor: runner, laneIdx: idx, phase: idx * 2.1 });
  });

  let paradeWeight = 1;

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
      const animT = isPlaying ? elapsed : elapsed * 0.22;
      backdrop.update(animT, dt);

      const showParade = Boolean(mechAction && mechAction.startsWith('arch-type-'));
      paradeWeight = THREE.MathUtils.damp(paradeWeight, showParade ? 1 : 0, 7.5, dt);

      paradeGroup.visible = paradeWeight > 0.02;
      paradeGroup.scale.setScalar(Math.max(0.01, paradeWeight));
      paradeGroup.position.y = (1 - paradeWeight) * -1.4;

      const postWeight = 1 - paradeWeight;
      postOfficeGroup.visible = postWeight > 0.02;
      postOfficeGroup.scale.setScalar(Math.max(0.01, postWeight));
      postOfficeGroup.position.y = (1 - postWeight) * -1.4;

      if (paradeGroup.visible) {
        if (paradeActors[0]) animateRobloxActor(paradeActors[0], 'idle-wave', animT, 0);
        if (paradeActors[1]) animateRobloxActor(paradeActors[1], 'idle-wave', animT, 1.2);
        if (paradeActors[2]) animateRobloxActor(paradeActors[2], 'write-board', animT, 0.5);
        if (paradeActors[3]) animateRobloxActor(paradeActors[3], 'crank-gear', animT, 1.8);
        if (paradeActors[4]) animateRobloxActor(paradeActors[4], 'celebrate', animT, 2.2);
        if (weatherGlobe) {
          weatherGlobe.rotation.y = animT * 1.1;
          weatherGlobe.position.y = 0.96 + Math.sin(animT * 2.5) * 0.07;
        }
        for (let i = 0; i < paradeLeds.length; i++) {
          paradeLeds[i].emissiveIntensity = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(animT * 5 + i));
        }
      }

      if (postOfficeGroup.visible) {
        animateRobloxActor(inputClerk, 'typing', animT, 0);
        animateRobloxActor(memClerk, 'idle-wave', animT, 0.8);
        animateRobloxActor(aluWorker, 'write-board', animT, 1.4);
        animateRobloxActor(conductor, 'conduct-baton', animT, 0.3);

        // Drive all 3 detailed interactive machines!
        memoryCabinet.update(animT, dt);
        aluStation.update(animT, dt);
        bufferBridge.update(animT, dt);

        const isMultiBus = mechAction === 'arch-multi-bus';
        const isBufferFocus = mechAction === 'arch-buffer';
        couriers.forEach((c, idx) => {
          const laneActive = isMultiBus || idx === 0;
          laneMats[idx].emissiveIntensity = laneActive ? 0.35 : 0.03;
          c.actor.root.visible = laneActive;
          if (laneActive) {
            const speed = isMultiBus ? 2.8 : isBufferFocus ? 3.2 : 2.1;
            const span = isBufferFocus ? 6.6 : 9.2;
            const startX = isBufferFocus ? -4.2 : -4.8;
            const u = ((animT * speed + c.phase) % span) / span;
            const goingRight = u < 0.5;
            const frac = goingRight ? u * 2 : (1 - u) * 2;
            c.actor.root.position.x = startX + frac * span;
            c.actor.root.rotation.y = goingRight ? Math.PI / 2 : -Math.PI / 2;
            animateRobloxActor(
              c.actor,
              isMultiBus || isBufferFocus ? 'sprint-courier' : 'walk-carry',
              animT,
              c.phase
            );
          }
        });

        const printProg = (animT * 0.42) % 1;
        printer.paper.position.z = 0.22 + printProg * 0.36;
        printer.statusMat.emissiveIntensity = 0.4 + 0.5 * Math.sin(animT * 7);
      }

      warmCue.update(animT, dt, anchor, true);
    },
    dispose() {
      tracker.disposeAll();
    },
  };
}
