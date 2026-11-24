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
  buildStylizedPrinter,
  createOsWallBoardTexture,
} from './storyPropsKit';
import {
  buildStorySignPlate,
  buildStylizedBurger,
  type BuiltBurgerItem,
} from './storyLabelKit';
import {
  buildActorStatusBubble,
  buildDynamicBannerBoard,
  buildMathAndMhzAct,
  buildRiscSpecAct,
} from './storyArchPerfActs';

type A2ActKind = 'os' | 'math' | 'burger' | 'risc';

function resolveActFromAction(mechAction: string | undefined): A2ActKind {
  if (!mechAction) return 'os';
  if (mechAction.startsWith('arch-math') || mechAction.startsWith('arch-mhz')) return 'math';
  if (
    mechAction.startsWith('arch-burger') ||
    mechAction === 'arch-pipeline' ||
    mechAction === 'arch-superscalar'
  ) {
    return 'burger';
  }
  if (mechAction.startsWith('arch-risc') || mechAction.startsWith('arch-spec')) return 'risc';
  return 'os';
}

export function buildStoryArchPerfScene(
  maxAniso: number,
  textureScale: number
): BuiltTheaterDiorama {
  const tracker = new DioramaResourceTracker(textureScale);
  const rootGroup = new THREE.Group();

  const backdrop = buildStoryBackdrop(tracker, rootGroup, 'cozy-day', 0x76bf63);
  const warmCue = buildWarmStoryCue(tracker, rootGroup);

  // =========================================================================
  // ACT 1 (VIDEO 1/4): KANTOR MANAJER OS — ZERO COLLISION + BEAT-DRIVEN t0-t5
  // =========================================================================
  const osGroup = new THREE.Group();
  rootGroup.add(osGroup);

  const office = buildCutawayRoom(tracker, {
    width: 10.6,
    depth: 5.6,
    wallHeight: 2.95,
    floorHex: 0xc9a67c,
    wallHex: 0xe6d8c3,
    trimHex: 0x7c5836,
    rugHex: 0x93c5fd,
    hasWindow: false,
  });
  office.position.set(0, 0, -0.35);
  osGroup.add(office);

  // Wide, centered, unclipped Wall Schedule Board (t0 -> t5)
  const boardTex = createOsWallBoardTexture(tracker);
  const wallBoard = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(4.5, 1.65, 0.08)),
    tracker.mat(new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.42 }))
  );
  wallBoard.position.set(0.05, 2.02, -2.92);
  osGroup.add(wallBoard);

  const needle = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.075, 1.48, 0.14)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xef4444,
        emissiveIntensity: 0.65,
        roughness: 0.3,
      })
    )
  );
  needle.position.set(-1.75, 2.0, -2.84);
  osGroup.add(needle);

  const plantA = buildPottedPlant(tracker);
  plantA.position.set(-4.75, 0.16, -2.45);
  osGroup.add(plantA);

  // Left Station: Compiler Clerk (zero overlap)
  const compDesk = buildStylizedDeskPc(tracker, { deskHex: 0xa5b4fc, screenHex: 0x38bdf8 });
  compDesk.group.position.set(-3.55, 0.16, -1.35);
  compDesk.group.rotation.y = 0.22;
  compDesk.chair.position.set(-0.25, 0, 0.56);
  osGroup.add(compDesk.group);

  const compSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'COMPILER',
    subtitle: 'PENERJEMAH KODE',
    bgHex: '#0C4A6E',
    fgHex: '#E0F2FE',
    borderHex: '#38BDF8',
    width: 1.55,
    height: 0.48,
  });
  compSign.position.set(-3.55, 0.4, -0.22);
  osGroup.add(compSign);

  const compActor = buildRobloxActor(tracker, {
    shirtHex: 0x0ea5e9,
    pantsHex: 0x1e293b,
    hat: 'glasses',
    scale: 0.95,
  });
  compActor.root.position.set(-2.35, 0.16, -0.45);
  compActor.root.rotation.y = -0.35;
  osGroup.add(compActor.root);

  const codeBlock = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.32, 0.24, 0.24)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.45,
      })
    )
  );
  codeBlock.position.set(-2.1, 1.05, -1.0);
  osGroup.add(codeBlock);

  // Center Station: CPU Manager (mathematically separated: desk, chair left, front sign clear, actor right!)
  const cpuDesk = buildStylizedDeskPc(tracker, {
    deskHex: 0xd9a066,
    screenHex: 0x10b981,
    dualMonitor: true,
  });
  cpuDesk.group.position.set(-0.55, 0.16, -1.42);
  cpuDesk.group.rotation.y = 0;
  // Tuck chair cleanly to the left-front of desk, well behind the floor sign
  cpuDesk.chair.position.set(-0.36, 0, 0.54);
  cpuDesk.chair.rotation.y = 0.32;
  osGroup.add(cpuDesk.group);

  // Sign sits cleanly in front of desk with 0.35m clearance from chair & 0.55m from actor!
  const cpuSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'MANAJER OS · CPU',
    subtitle: 'PENGATUR JADWAL',
    bgHex: '#064E3B',
    fgHex: '#D1FAE5',
    borderHex: '#10B981',
    width: 1.66,
    height: 0.46,
  });
  cpuSign.position.set(-0.55, 0.39, -0.18);
  osGroup.add(cpuSign);

  // Dedicated side pedestal for TUGAS 2 (clear of dual monitors!)
  const prog2Pedestal = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.68, 0.54, 0.56)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.55 }))
  );
  prog2Pedestal.position.set(0.66, 0.43, -1.38);
  prog2Pedestal.castShadow = true;
  osGroup.add(prog2Pedestal);

  const prog2Group = new THREE.Group();
  prog2Group.position.set(0.66, 0.94, -1.38);
  const prog2Box = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.46, 0.42, 0.36)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x9333ea,
        emissiveIntensity: 0.38,
        roughness: 0.35,
      })
    )
  );
  prog2Group.add(prog2Box);
  const prog2Tag = buildStorySignPlate(tracker, maxAniso, {
    title: 'TUGAS 2',
    bgHex: '#581C87',
    fgHex: '#F3E8FF',
    borderHex: '#C084FC',
    width: 0.64,
    height: 0.22,
    texW: 192,
    texH: 64,
    titlePx: 32,
  });
  prog2Tag.position.set(0, 0.34, 0.08);
  prog2Group.add(prog2Tag);
  osGroup.add(prog2Group);

  // CPU Manager stands cleanly to the right of desk & sign, angled 3/4 toward camera
  const cpuManager = buildRobloxActor(tracker, {
    shirtHex: 0x10b981,
    pantsHex: 0x0f172a,
    hat: 'headset',
    hatHex: 0x38bdf8,
    scale: 1.0,
  });
  cpuManager.root.position.set(1.05, 0.16, -0.35);
  cpuManager.root.rotation.y = -0.38;
  osGroup.add(cpuManager.root);

  // Floating status bubble right above CPU Manager's head (Zzz vs Aktif Tugas 2)
  const osStatusBubble = buildActorStatusBubble(tracker, maxAniso);
  osStatusBubble.mesh.position.set(1.05, 1.98, -0.35);
  osGroup.add(osStatusBubble.mesh);

  // Right Station: Disk Cabinet, OS Courier & Slow Printer (clear aisle x >= 2.2)
  const diskCab = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(1.0, 1.48, 0.74)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.45 }))
  );
  diskCab.position.set(3.45, 0.9, -1.85);
  diskCab.castShadow = true;
  osGroup.add(diskCab);

  const diskSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'DISK BERKAS',
    bgHex: '#78350F',
    fgHex: '#FEF3C7',
    borderHex: '#F59E0B',
    width: 1.18,
    height: 0.34,
    texW: 256,
    texH: 72,
    titlePx: 28,
  });
  diskSign.position.set(3.45, 1.92, -1.7);
  osGroup.add(diskSign);

  const osCourier = buildRobloxActor(tracker, {
    shirtHex: 0xf59e0b,
    pantsHex: 0x334155,
    hat: 'cap',
    hatHex: 0xf59e0b,
    prop: 'parcel',
    propHex: 0xfde047,
    scale: 0.94,
  });
  osCourier.root.position.set(2.55, 0.16, -1.1);
  osGroup.add(osCourier.root);

  const osPrinter = buildStylizedPrinter(tracker);
  osPrinter.group.position.set(3.55, 0.16, 0.58);
  osPrinter.group.rotation.y = -0.52;
  osGroup.add(osPrinter.group);

  const printerSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'PRINTER PELAN',
    bgHex: '#991B1B',
    fgHex: '#FEE2E2',
    borderHex: '#F87171',
    width: 1.28,
    height: 0.34,
    texW: 280,
    texH: 72,
    titlePx: 26,
  });
  printerSign.position.set(3.55, 1.42, 0.52);
  printerSign.rotation.y = -0.45;
  osGroup.add(printerSign);

  // =========================================================================
  // ACT 2 (VIDEO 2/4): MTK SD 10-PARCEL WORKBENCH & 900 vs 700 MHz FOOTRACE
  // =========================================================================
  const mathAct = buildMathAndMhzAct(tracker, maxAniso);
  rootGroup.add(mathAct.group);

  // =========================================================================
  // ACT 3 (VIDEO 3/4): DAPUR BURGER — 1 KOKI LAMBAT → 4 KOKI ESTAFET → 2 JALUR
  // =========================================================================
  const burgerGroup = new THREE.Group();
  rootGroup.add(burgerGroup);

  const kitchenDeck = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(11.8, 0.2, 6.4)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xd9c2a3, roughness: 0.78 }))
  );
  kitchenDeck.position.set(0, 0.04, -0.35);
  kitchenDeck.receiveShadow = true;
  burgerGroup.add(kitchenDeck);

  const burgerBanner = buildDynamicBannerBoard(
    tracker,
    maxAniso,
    [
      {
        title: 'CARA BIASA (LAMBAT): 1 KOKI KERJA SENDIRIAN',
        subtitle: 'SATU BURGER HARUS SELESAI DULU BARU BIKIN BERIKUTNYA',
        bgHex: '#7F1D1D',
        borderHex: '#F87171',
      },
      {
        title: 'PIPELINING: ESTAFET 4 KOKI TANPA SALING TUNGGU!',
        subtitle: '1. POTONG ROTI → 2. ISI DAGING → 3. SAYUR KEJU → 4. BUNGKUS (S ≈ 1)',
        bgHex: '#0C4A6E',
        borderHex: '#38BDF8',
      },
      {
        title: 'SUPERSCALAR: 2 JALUR DAPUR BERJALAN BARENGAN!',
        subtitle: '2 BURGER MATANG SEKALIGUS DALAM 1 DETAK (S < 1)',
        bgHex: '#064E3B',
        borderHex: '#34D399',
      },
    ],
    6.4,
    1.12
  );
  burgerBanner.mesh.position.set(0, 2.75, -2.65);
  burgerGroup.add(burgerBanner.mesh);

  const postGeo = tracker.geo(new THREE.CylinderGeometry(0.06, 0.06, 2.65, 8));
  const postMat = tracker.mat(new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 }));
  for (const px of [-2.8, 2.8]) {
    const p = new THREE.Mesh(postGeo, postMat);
    p.position.set(px, 1.4, -2.68);
    burgerGroup.add(p);
  }

  const beltMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.62, metalness: 0.24 })
  );
  const belt1 = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(7.6, 0.36, 0.9)), beltMat);
  belt1.position.set(0, 0.32, -1.15);
  belt1.castShadow = true;
  belt1.receiveShadow = true;
  burgerGroup.add(belt1);

  const stationSpecs = [
    { label: '1. POTONG ROTI', bg: '#0C4A6E', border: '#38BDF8', shirt: 0x0ea5e9 },
    { label: '2. ISI DAGING', bg: '#7C2D12', border: '#FB923C', shirt: 0xf97316 },
    { label: '3. SAYUR KEJU', bg: '#14532D', border: '#4ADE80', shirt: 0x10b981 },
    { label: '4. BUNGKUS', bg: '#7F1D1D', border: '#F87171', shirt: 0xef4444 },
  ];
  const chefs: BuiltRobloxActor[] = [];
  const stationSigns: THREE.Object3D[] = [];
  stationSpecs.forEach((st, i) => {
    const sx = -2.55 + i * 1.7;
    const chef = buildRobloxActor(tracker, {
      shirtHex: st.shirt,
      pantsHex: 0x1e293b,
      hat: 'cap',
      hatHex: 0xffffff,
      scale: 0.94,
    });
    chef.root.position.set(sx, 0.14, -2.02);
    burgerGroup.add(chef.root);
    chefs.push(chef);

    const sign = buildStorySignPlate(tracker, maxAniso, {
      title: st.label,
      bgHex: st.bg,
      fgHex: '#FFFFFF',
      borderHex: st.border,
      width: 1.5,
      height: 0.35,
      texW: 280,
      texH: 72,
      titlePx: 26,
    });
    sign.position.set(sx, 0.34, -0.66);
    burgerGroup.add(sign);
    stationSigns.push(sign);
  });

  // Single slow solo-mode burger + 4 relay burgers on Belt 1
  const soloBurger = buildStylizedBurger(tracker);
  soloBurger.group.position.set(-2.55, 0.52, -1.15);
  burgerGroup.add(soloBurger.group);

  const burgers1: BuiltBurgerItem[] = [];
  for (let i = 0; i < 4; i++) {
    const b = buildStylizedBurger(tracker);
    b.group.position.set(-3.2 + i * 1.85, 0.52, -1.15);
    burgerGroup.add(b.group);
    burgers1.push(b);
  }

  // Conveyor Belt #2 (Superscalar parallel kitchen line)
  const belt2Group = new THREE.Group();
  belt2Group.position.set(0, 0.14, 0.55);
  burgerGroup.add(belt2Group);

  const belt2 = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(7.6, 0.34, 0.84)), beltMat);
  belt2.position.y = 0.18;
  belt2.castShadow = true;
  belt2Group.add(belt2);

  const superSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'JALUR 2 · SUPERSCALAR (2 BURGER BARENGAN!)',
    bgHex: '#064E3B',
    fgHex: '#FEF08A',
    borderHex: '#34D399',
    width: 4.8,
    height: 0.38,
    texW: 660,
    texH: 72,
    titlePx: 27,
  });
  superSign.position.set(0, 0.22, 0.46);
  belt2Group.add(superSign);

  const burgers2: BuiltBurgerItem[] = [];
  for (let i = 0; i < 4; i++) {
    const b = buildStylizedBurger(tracker);
    b.group.position.set(-3.2 + i * 1.85, 0.36, 0);
    belt2Group.add(b.group);
    burgers2.push(b);
  }

  // =========================================================================
  // ACT 4 (VIDEO 4/4): KURIR MOTOR RISC vs TRUK CISC & PODIUM SPEC
  // =========================================================================
  const riscSpecAct = buildRiscSpecAct(tracker, maxAniso);
  rootGroup.add(riscSpecAct.group);

  // Beat-tracking state (resets beatElapsed cleanly whenever keyframeId changes!)
  let lastKeyframeId = '';
  let beatElapsed = 0;
  let superscalarLift = 0;
  const actWeights: Record<A2ActKind, number> = { os: 1, math: 0, burger: 0, risc: 0 };

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
      story?: TheaterStoryContext
    ) {
      const animT = isPlaying ? elapsed : elapsed * 0.25;
      backdrop.update(animT, dt);

      const kfId = story?.keyframeId ?? '';
      if (kfId !== lastKeyframeId) {
        lastKeyframeId = kfId;
        beatElapsed = 0;
      } else if (isPlaying) {
        beatElapsed += dt;
      }

      const activeAct = resolveActFromAction(mechAction);
      const actGroups: Record<A2ActKind, THREE.Group> = {
        os: osGroup,
        math: mathAct.group,
        burger: burgerGroup,
        risc: riscSpecAct.group,
      };
      for (const k of ['os', 'math', 'burger', 'risc'] as const) {
        actWeights[k] = THREE.MathUtils.damp(actWeights[k], activeAct === k ? 1 : 0, 8.5, dt);
        const g = actGroups[k];
        g.visible = actWeights[k] > 0.02;
        g.scale.setScalar(Math.max(0.01, actWeights[k]));
        g.position.y = (1 - actWeights[k]) * -1.3;
      }

      // --- ACT 1: Beat-driven Office Story (NO blind looping!) ---
      if (osGroup.visible) {
        let needleTargetX = -1.75;
        let showProg2 = false;
        let printerSpeed = 0;

        if (kfId === 'a2-compiler') {
          animateRobloxActor(compActor, 'typing', animT, 0);
          animateRobloxActor(cpuManager, 'idle-wave', animT, 0.5);
          animateRobloxActor(osCourier, 'idle-wave', animT, 1.0);
          osStatusBubble.setMode('hidden');
          // Code block slides deliberately from Compiler -> CPU desk
          const u = Math.min(1, beatElapsed / 3.2);
          codeBlock.visible = true;
          codeBlock.position.set(
            THREE.MathUtils.lerp(-2.3, -0.7, u),
            1.05 + Math.sin(u * Math.PI) * 0.42,
            -1.0
          );
          codeBlock.rotation.y = animT * 2.2;
          needleTargetX = -1.65;
        } else if (kfId === 'a2-os-traffic') {
          animateRobloxActor(compActor, 'idle-wave', animT, 0);
          animateRobloxActor(cpuManager, 'idle-wave', animT, 0.2);
          animateRobloxActor(osCourier, 'walk-carry', animT, 0.4);
          osStatusBubble.setMode('hidden');
          codeBlock.visible = false;
          needleTargetX = -0.9;
        } else if (kfId === 'a2-wallboard') {
          // Needle steps deliberately across t0 -> t1 -> t2 -> t3 -> t4 -> t5!
          const stepU = Math.min(1, beatElapsed / 5.5);
          needleTargetX = THREE.MathUtils.lerp(-1.65, 1.8, stepU);
          animateRobloxActor(cpuManager, 'typing', animT, 0.2);
          animateRobloxActor(osCourier, 'walk-carry', animT, 0.5);
          osStatusBubble.setMode('hidden');
          codeBlock.visible = false;
        } else if (kfId === 'a2-disk-printer') {
          // Printer prints slowly while CPU Manager sits idle with Zzz bubble!
          needleTargetX = 1.65;
          printerSpeed = 0.45;
          const u = Math.min(1, beatElapsed / 3.8);
          osCourier.root.position.set(
            THREE.MathUtils.lerp(2.75, 2.35, u),
            0.16,
            THREE.MathUtils.lerp(-1.35, 0.35, u)
          );
          osCourier.root.rotation.y = 0.25;
          animateRobloxActor(osCourier, u < 0.95 ? 'walk-carry' : 'idle-wave', animT, 0.4);
          animateRobloxActor(cpuManager, 'confused', animT, 0.8);
          osStatusBubble.setMode('zzz');
          codeBlock.visible = false;
        } else {
          // Multiprogramming! Task 2 drops onto side pedestal & CPU Manager works actively!
          needleTargetX = 1.75;
          showProg2 = true;
          printerSpeed = 0.55;
          osStatusBubble.setMode('active');
          animateRobloxActor(cpuManager, 'typing', animT, 0.3);
          animateRobloxActor(compActor, 'typing', animT, 0.7);
          const u = Math.min(1, beatElapsed / 4.2);
          osCourier.root.position.set(
            THREE.MathUtils.lerp(2.35, 2.85, u),
            0.16,
            THREE.MathUtils.lerp(0.25, -1.25, u)
          );
          osCourier.root.rotation.y = -2.6;
          animateRobloxActor(osCourier, 'walk-carry', animT, 0.3);
          codeBlock.visible = false;
        }

        needle.position.x = THREE.MathUtils.damp(needle.position.x, needleTargetX, 6.5, dt);
        const p2Scale = THREE.MathUtils.damp(prog2Group.scale.x, showProg2 ? 1 : 0.01, 7.5, dt);
        prog2Group.scale.setScalar(p2Scale);
        prog2Group.visible = p2Scale > 0.05;
        prog2Group.position.y = showProg2 ? 0.94 + Math.sin(animT * 3) * 0.03 : 1.4;

        osStatusBubble.mesh.position.y = 1.98 + Math.sin(animT * 3.2) * 0.035;
        if (printerSpeed > 0) {
          osPrinter.paper.position.z = 0.22 + ((animT * printerSpeed) % 1) * 0.34;
        } else {
          osPrinter.paper.position.z = 0.22;
        }
      }

      // --- ACT 2: MTK SD 10-Parcel Counter & 900 vs 700 MHz Footrace ---
      if (mathAct.group.visible) {
        mathAct.update(animT, dt, kfId, beatElapsed);
      }

      // --- ACT 3: Burger Kitchen (Solo Slow -> Station Spotlight -> 4-Chef Relay -> Superscalar) ---
      if (burgerGroup.visible) {
        const isSolo = kfId === 'a2b-solo-slow';
        const isStationHighlight = kfId === 'a2b-pipe-intro' || kfId === 'a2b-pipe-stations';
        const isSuper = kfId === 'a2b-super-open' || kfId === 'a2b-super-exam';

        burgerBanner.setSlide(isSolo ? 0 : isSuper ? 2 : 1);

        if (isSolo) {
          // 1 Solo Chef walks slowly across all 4 stations building 1 single burger!
          soloBurger.group.visible = true;
          burgers1.forEach((b) => {
            b.group.visible = false;
          });
          const u = Math.min(1, beatElapsed / 6.5);
          const soloX = THREE.MathUtils.lerp(-2.55, 2.55, u);
          const stageIdx = Math.min(3, Math.floor(u * 4));
          soloBurger.group.position.set(soloX, 0.52, -1.15);
          soloBurger.setStage(stageIdx);

          // Chef 0 follows the single burger while Chefs 1-3 wait idly in the back!
          chefs[0].root.position.x = THREE.MathUtils.damp(chefs[0].root.position.x, soloX, 5, dt);
          chefs[0].root.position.z = THREE.MathUtils.damp(chefs[0].root.position.z, -1.95, 6, dt);
          animateRobloxActor(chefs[0], 'factory-work', animT * 0.85, 0);
          for (let i = 1; i < 4; i++) {
            chefs[i].root.position.x = THREE.MathUtils.damp(chefs[i].root.position.x, -2.55 + i * 1.7, 5, dt);
            chefs[i].root.position.z = THREE.MathUtils.damp(chefs[i].root.position.z, -2.55, 5, dt);
            animateRobloxActor(chefs[i], 'confused', animT * 0.5, i);
          }
        } else {
          // 4 Chefs step forward to their stations!
          soloBurger.group.visible = false;
          const activeStation = isStationHighlight
            ? Math.min(3, Math.floor(beatElapsed / 1.45))
            : -1;

          chefs.forEach((c, i) => {
            c.root.position.x = THREE.MathUtils.damp(c.root.position.x, -2.55 + i * 1.7, 6, dt);
            const targetZ = activeStation === i ? -1.85 : -2.02;
            c.root.position.z = THREE.MathUtils.damp(c.root.position.z, targetZ, 6, dt);
            const act =
              isStationHighlight && activeStation !== i ? 'idle-wave' : 'factory-work';
            animateRobloxActor(c, act, animT, i * 0.7);

            const signScale = activeStation === i ? 1.12 : 1.0;
            stationSigns[i].scale.setScalar(
              THREE.MathUtils.damp(stationSigns[i].scale.x, signScale, 8, dt)
            );
          });

          const speed = isStationHighlight ? 0.55 : isSuper ? 2.15 : 1.55;
          burgers1.forEach((b, i) => {
            b.group.visible = true;
            const offset = (animT * speed + i * 1.9) % 7.6;
            b.group.position.set(-3.8 + offset, 0.52 + Math.abs(Math.sin(animT * 4 + i)) * 0.02, -1.15);
            b.setStage(Math.min(3, Math.floor((offset / 7.6) * 4)));
          });
        }

        superscalarLift = THREE.MathUtils.damp(superscalarLift, isSuper ? 1 : 0, 6.5, dt);
        belt2Group.visible = superscalarLift > 0.03;
        belt2Group.scale.set(1, Math.max(0.01, superscalarLift), 1);
        if (belt2Group.visible) {
          burgers2.forEach((b, i) => {
            const offset = (animT * 2.15 + i * 1.9 + 0.95) % 7.6;
            b.group.position.x = -3.8 + offset;
            b.setStage(Math.min(3, Math.floor((offset / 7.6) * 4)));
          });
        }
      }

      // --- ACT 4: RISC vs CISC Start-to-Finish Race & Progressive SPEC Podium ---
      if (riscSpecAct.group.visible) {
        riscSpecAct.update(animT, dt, kfId, beatElapsed);
      }

      warmCue.update(animT, dt, anchor, true);
    },
    dispose() {
      tracker.disposeAll();
    },
  };
}
