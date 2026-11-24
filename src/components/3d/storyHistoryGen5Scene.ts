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
} from './robloxActorBuilder';
import { buildPottedPlant } from './storyPropsKit';
import { buildStorySignPlate } from './storyLabelKit';
import {
  buildDetailedGen1Hardware,
  buildDetailedGen2Hardware,
} from './historyGen12DetailedProps';
import {
  buildDetailedGen3Hardware,
  buildDetailedGen4Hardware,
  buildDetailedGen5Hardware,
} from './historyGen345DetailedProps';

export function buildStoryHistoryGen5Scene(
  maxAniso: number,
  textureScale: number
): BuiltTheaterDiorama {
  const tracker = new DioramaResourceTracker(textureScale);
  const rootGroup = new THREE.Group();

  const backdrop = buildStoryBackdrop(tracker, rootGroup, 'retro-lab', 0x76bf63);
  const warmCue = buildWarmStoryCue(tracker, rootGroup);

  const eraGroups: THREE.Group[] = [];

  // =========================================================================
  // GEN 1 (1946–1959): RUANG ENIAC RAKSASA — TABUNG VAKUM, METER 160 kW & EDVAC
  // =========================================================================
  const g1 = new THREE.Group();
  rootGroup.add(g1);
  eraGroups.push(g1);

  const eniacRoom = buildCutawayRoom(tracker, {
    width: 9.2,
    depth: 5.4,
    wallHeight: 3.15,
    floorHex: 0xb8b2a8,
    wallHex: 0xd6cfc5,
    trimHex: 0x57534e,
    rugHex: 0xd97706,
    hasWindow: false,
  });
  eniacRoom.position.set(0, 0, -0.35);
  g1.add(eniacRoom);

  const g1Meter = buildStorySignPlate(tracker, maxAniso, {
    title: 'GEN 1 · TABUNG VAKUM (ENIAC)',
    subtitle: 'LISTRIK 160 kW · PANAS KAYAK OVEN!',
    bgHex: '#7F1D1D',
    fgHex: '#FEF08A',
    subHex: '#FECACA',
    borderHex: '#F97316',
    width: 4.4,
    height: 0.78,
    texW: 540,
    texH: 120,
    titlePx: 30,
    subPx: 24,
  });
  g1Meter.position.set(0, 2.88, -2.9);
  g1.add(g1Meter);

  const gen1Hw = buildDetailedGen1Hardware(tracker, maxAniso, g1);

  const g1TechA = buildRobloxActor(tracker, {
    shirtHex: 0x0284c7,
    pantsHex: 0x1e293b,
    labCoat: true,
    prop: 'wrench',
    propHex: 0x94a3b8,
    scale: 0.96,
  });
  g1TechA.root.position.set(-2.05, 0.16, -0.55);
  g1TechA.root.rotation.y = 0.55;
  g1.add(g1TechA.root);

  const g1TechB = buildRobloxActor(tracker, {
    shirtHex: 0xf59e0b,
    pantsHex: 0x1e293b,
    labCoat: true,
    prop: 'clipboard',
    propHex: 0xfef3c7,
    scale: 0.96,
  });
  g1TechB.root.position.set(1.85, 0.16, 0.35);
  g1TechB.root.rotation.y = -0.55;
  g1.add(g1TechB.root);

  // =========================================================================
  // GEN 2 (1959–1964): KANTOR IBM 1401 + PERBANDINGAN TABUNG VS TRANSISTOR
  // =========================================================================
  const g2 = new THREE.Group();
  rootGroup.add(g2);
  eraGroups.push(g2);

  const g2Room = buildCutawayRoom(tracker, {
    width: 7.6,
    depth: 4.7,
    wallHeight: 2.85,
    floorHex: 0xc9c2b8,
    wallHex: 0xcbe5d8,
    trimHex: 0x065f46,
    rugHex: 0x34d399,
    hasWindow: false,
  });
  g2Room.position.set(0, 0, -0.3);
  g2.add(g2Room);

  const g2Meter = buildStorySignPlate(tracker, maxAniso, {
    title: 'GEN 2 · TRANSISTOR (IBM 1401)',
    subtitle: 'LEBIH KECIL · HEMAT LISTRIK · COBOL',
    bgHex: '#064E3B',
    fgHex: '#FEF08A',
    subHex: '#A7F3D0',
    borderHex: '#10B981',
    width: 4.3,
    height: 0.74,
    texW: 520,
    texH: 112,
    titlePx: 28,
    subPx: 22,
  });
  g2Meter.position.set(0, 2.5, -2.47);
  g2.add(g2Meter);

  const gen2Hw = buildDetailedGen2Hardware(tracker, maxAniso, g2);

  const g2Prog = buildRobloxActor(tracker, {
    shirtHex: 0x10b981,
    pantsHex: 0x1e293b,
    hat: 'glasses',
    prop: 'punchcard',
    propHex: 0xfef3c7,
    scale: 0.96,
  });
  g2Prog.root.position.set(0.05, 0.16, 0.15);
  g2Prog.root.rotation.y = -0.3;
  g2.add(g2Prog.root);

  // =========================================================================
  // GEN 3 (1964–1970): LAB CHIP IC DIP BERKAKI + LAYAR OS MULTI-JENDELA
  // =========================================================================
  const g3 = new THREE.Group();
  rootGroup.add(g3);
  eraGroups.push(g3);

  const g3Room = buildCutawayRoom(tracker, {
    width: 6.8,
    depth: 4.4,
    wallHeight: 2.75,
    floorHex: 0xcbd5e1,
    wallHex: 0xc3ddf0,
    trimHex: 0x0369a1,
    rugHex: 0x38bdf8,
    hasWindow: false,
  });
  g3Room.position.set(0, 0, -0.25);
  g3.add(g3Room);

  const g3Meter = buildStorySignPlate(tracker, maxAniso, {
    title: 'GEN 3 · CHIP IC (JACK KILBY)',
    subtitle: 'ATASI PANAS · LAHIR SISTEM OPERASI',
    bgHex: '#0C4A6E',
    fgHex: '#FEF08A',
    subHex: '#BAE6FD',
    borderHex: '#38BDF8',
    width: 4.1,
    height: 0.72,
    texW: 520,
    texH: 112,
    titlePx: 28,
    subPx: 22,
  });
  g3Meter.position.set(0, 2.42, -2.27);
  g3.add(g3Meter);

  const gen3Hw = buildDetailedGen3Hardware(tracker, maxAniso, g3);

  const g3User = buildRobloxActor(tracker, {
    shirtHex: 0x0284c7,
    pantsHex: 0x334155,
    hat: 'glasses',
    scale: 0.96,
  });
  g3User.root.position.set(0.32, 0.16, -0.05);
  g3User.root.rotation.y = 0.42;
  g3.add(g3User.root);

  // =========================================================================
  // GEN 4 (1979–KINI): INTEL 4004 VLSI BERPIN EMAS + IBM PC & MAC GUI
  // =========================================================================
  const g4 = new THREE.Group();
  rootGroup.add(g4);
  eraGroups.push(g4);

  const g4Room = buildCutawayRoom(tracker, {
    width: 6.2,
    depth: 4.3,
    wallHeight: 2.7,
    floorHex: 0xc9a67c,
    wallHex: 0xe6d3b8,
    trimHex: 0x92400e,
    rugHex: 0xf59e0b,
    hasWindow: false,
  });
  g4Room.position.set(0, 0, -0.2);
  g4.add(g4Room);

  const g4Meter = buildStorySignPlate(tracker, maxAniso, {
    title: 'GEN 4 · MIKROPROSESOR (VLSI)',
    subtitle: 'INTEL 4004 · IBM PC · MAC GUI & MOUSE',
    bgHex: '#78350F',
    fgHex: '#FEF08A',
    subHex: '#FDE68A',
    borderHex: '#F59E0B',
    width: 4.15,
    height: 0.72,
    texW: 520,
    texH: 112,
    titlePx: 27,
    subPx: 21,
  });
  g4Meter.position.set(0, 2.38, -2.19);
  g4.add(g4Meter);

  const gen4Hw = buildDetailedGen4Hardware(tracker, maxAniso, g4);

  const plant4 = buildPottedPlant(tracker);
  plant4.position.set(-2.35, 0.16, -1.55);
  g4.add(plant4);

  const g4User = buildRobloxActor(tracker, {
    shirtHex: 0xf59e0b,
    pantsHex: 0x1e3a8a,
    hat: 'cap',
    hatHex: 0xef4444,
    scale: 0.96,
  });
  g4User.root.position.set(0.35, 0.16, 0.08);
  g4User.root.rotation.y = -0.45;
  g4.add(g4User.root);

  // =========================================================================
  // GEN 5 (AI & PARALEL): KUBAH KACA + 5 NODE PARALEL + PENDINGIN SUPERKONDUKTOR
  // =========================================================================
  const g5 = new THREE.Group();
  rootGroup.add(g5);
  eraGroups.push(g5);

  const gen5Hw = buildDetailedGen5Hardware(tracker, maxAniso, g5);

  const g5Meter = buildStorySignPlate(tracker, maxAniso, {
    title: 'GEN 5 · AI & PEMROSESAN PARALEL',
    subtitle: 'KUBAH CERDAS · SUPERKONDUKTOR · ICOT',
    bgHex: '#3B0764',
    fgHex: '#FEF08A',
    subHex: '#E9D5FF',
    borderHex: '#C084FC',
    width: 4.3,
    height: 0.74,
    texW: 540,
    texH: 112,
    titlePx: 26,
    subPx: 21,
  });
  g5Meter.position.set(0.25, 3.32, -1.9);
  g5.add(g5Meter);

  const g5User = buildRobloxActor(tracker, {
    shirtHex: 0x7c3aed,
    pantsHex: 0x1e293b,
    hat: 'headset',
    hatHex: 0x38bdf8,
    scale: 1.0,
  });
  g5User.root.position.set(-2.05, 0.24, 1.35);
  g5User.root.rotation.y = 0.52;
  g5.add(g5User.root);

  const weights = [1, 0, 0, 0, 0];

  return {
    rootGroup,
    stageTheme: 'story-bright',
    initialAtmosphere: STORY_ATMOSPHERE_PRESETS['retro-lab'],
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

      let activeIdx = 0;
      if (mechAction === 'gen-2') activeIdx = 1;
      else if (mechAction === 'gen-3') activeIdx = 2;
      else if (mechAction === 'gen-4' || mechAction === 'gen-4-pc') activeIdx = 3;
      else if (mechAction === 'gen-5') activeIdx = 4;

      const skyTints = [0xffe4c4, 0xe2f7ed, 0xe0f2fe, 0xfdf0d8, 0xe5d8ff];
      backdrop.setMoodTint(skyTints[activeIdx], dt);

      for (let i = 0; i < eraGroups.length; i++) {
        weights[i] = THREE.MathUtils.damp(weights[i], i === activeIdx ? 1 : 0, 7.2, dt);
        const grp = eraGroups[i];
        grp.visible = weights[i] > 0.02;
        const s = Math.max(0.01, weights[i]);
        grp.scale.setScalar(s);
        grp.position.y = (1 - weights[i]) * -1.1;
      }

      if (g1.visible) {
        animateRobloxActor(g1TechA, 'crank-gear', animT, 0);
        animateRobloxActor(g1TechB, 'write-board', animT, 0.7);
        gen1Hw.update(animT);
      }
      if (g2.visible) {
        animateRobloxActor(g2Prog, 'factory-work', animT, 0.3);
        gen2Hw.update(animT);
      }
      if (g3.visible) {
        animateRobloxActor(g3User, 'typing', animT, 0.2);
        gen3Hw.update(animT);
      }
      if (g4.visible) {
        animateRobloxActor(g4User, 'typing', animT, 0);
        gen4Hw.update(animT);
      }
      if (g5.visible) {
        animateRobloxActor(g5User, 'celebrate', animT, 0.4);
        gen5Hw.update(animT);
      }

      warmCue.update(animT, dt, anchor, true);
    },
    dispose() {
      tracker.disposeAll();
    },
  };
}
