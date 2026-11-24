import * as THREE from 'three';
import type { DioramaResourceTracker } from './theaterDioramaCore';
import {
  animateRobloxActor,
  buildRobloxActor,
  type BuiltRobloxActor,
} from './robloxActorBuilder';
import {
  buildHeavyCargoTruck,
  buildMotorbikeCourier,
  buildStorySignPlate,
} from './storyLabelKit';

export type OsBubbleMode = 'hidden' | 'zzz' | 'active';

export interface BuiltStatusBubble {
  mesh: THREE.Mesh;
  setMode: (mode: OsBubbleMode) => void;
}

/**
 * Floating status badge above the OS Manager's head (Zzz waiting vs Active Task 2).
 * Redraws canvas only when mode changes (zero per-frame canvas overhead).
 */
export function buildActorStatusBubble(
  tracker: DioramaResourceTracker,
  maxAniso: number
): BuiltStatusBubble {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 112;
  const ctx = canvas.getContext('2d');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(4, maxAniso);
  tracker.tex(tex, true);

  const mat = tracker.mat(
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
  );
  const mesh = new THREE.Mesh(tracker.geo(new THREE.PlaneGeometry(1.55, 0.45)), mat);
  mesh.visible = false;

  let lastMode: OsBubbleMode = 'hidden';

  const draw = (mode: OsBubbleMode) => {
    if (!ctx || mode === 'hidden') return;
    ctx.clearRect(0, 0, 384, 112);

    const isZzz = mode === 'zzz';
    const bg = isZzz ? '#7C2D12' : '#064E3B';
    const border = isZzz ? '#FBBF24' : '#34D399';
    const title = isZzz ? 'Zzz... BENGONG' : 'AKTIF KERJA!';
    const sub = isZzz ? 'TUNGGU PRINTER PELAN' : 'GARAP TUGAS 2 BARENGAN';

    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(8, 8, 368, 96, 20);
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 7;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FEF08A';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(title, 192, 42);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(sub, 192, 78);
    tex.needsUpdate = true;
  };

  return {
    mesh,
    setMode(mode: OsBubbleMode) {
      if (mode === lastMode) return;
      lastMode = mode;
      mesh.visible = mode !== 'hidden';
      if (mode !== 'hidden') draw(mode);
    },
  };
}

export interface BuiltDynamicBanner {
  mesh: THREE.Mesh;
  setSlide: (idx: number) => void;
}

export interface BannerSlideSpec {
  title: string;
  subtitle: string;
  bgHex: string;
  borderHex: string;
  titleHex?: string;
}

/**
 * Reusable dynamic 3D overhead scoreboard that updates its sRGB texture only when
 * the narrative phase index changes (used for MTK SD step-by-step math & Burger mode).
 */
export function buildDynamicBannerBoard(
  tracker: DioramaResourceTracker,
  maxAniso: number,
  slides: BannerSlideSpec[],
  width = 5.8,
  height = 1.1
): BuiltDynamicBanner {
  const canvas = document.createElement('canvas');
  canvas.width = 896;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(4, maxAniso);
  tracker.tex(tex, true);

  const frontMat = tracker.mat(new THREE.MeshBasicMaterial({ map: tex }));
  const frameMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.2 })
  );
  const mesh = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(width, height, 0.1)),
    [frameMat, frameMat, frameMat, frameMat, frontMat, frameMat]
  );

  let currentIdx = -1;

  const setSlide = (idx: number) => {
    const safeIdx = Math.max(0, Math.min(slides.length - 1, idx));
    if (safeIdx === currentIdx || !ctx) return;
    currentIdx = safeIdx;
    const s = slides[safeIdx];

    ctx.fillStyle = s.bgHex;
    ctx.fillRect(0, 0, 896, 180);
    ctx.strokeStyle = s.borderHex;
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, 882, 166);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = s.titleHex ?? '#FEF08A';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(s.title, 448, 66);

    ctx.fillStyle = '#E0F2FE';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(s.subtitle, 448, 128);
    tex.needsUpdate = true;
  };

  setSlide(0);
  return { mesh, setSlide };
}

export interface BuiltMathMhzAct {
  group: THREE.Group;
  update: (animT: number, dt: number, keyframeId: string, beatElapsed: number) => void;
}

/**
 * ACT 2 (Video 2/4): MTK SD 10-Parcel Counter Workbench + 900 MHz vs 700 MHz Footrace.
 */
export function buildMathAndMhzAct(
  tracker: DioramaResourceTracker,
  maxAniso: number
): BuiltMathMhzAct {
  const group = new THREE.Group();

  const deck = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(12.2, 0.2, 7.0)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xd9c2a3, roughness: 0.78 }))
  );
  deck.position.set(0, 0.04, 0);
  deck.receiveShadow = true;
  group.add(deck);

  // Live Overhead MTK SD Formula Board (updates dynamically per math step!)
  const board = buildDynamicBannerBoard(
    tracker,
    maxAniso,
    [
      {
        title: 'LANGKAH 1 · BANYAK PAKET (N) = 10 KOTAK',
        subtitle: 'HITUNG PELAN SATU PER SATU: 1, 2, 3 ... 10',
        bgHex: '#0C4A6E',
        borderHex: '#38BDF8',
      },
      {
        title: 'LANGKAH 2 · 10 PAKET × 2 LANGKAH (S) = 20',
        subtitle: 'TIAP PAKET: LIPAT KARDUS + TEMPEL LAKBAN',
        bgHex: '#78350F',
        borderHex: '#FBBF24',
      },
      {
        title: 'LANGKAH 3 · 20 LANGKAH ÷ KECEPATAN 2 (R) = 10 DETIK',
        subtitle: 'WAKTU SELESAI (T) = 10 DETIK!',
        bgHex: '#064E3B',
        borderHex: '#34D399',
      },
      {
        title: 'RUMUS UJIAN:  T  =  ( N  ×  S )  /  R',
        subtitle: 'N = TUGAS (10)  ·  S = LANGKAH (2)  ·  R = KECEPATAN (2)',
        bgHex: '#3B0764',
        borderHex: '#C084FC',
      },
      {
        title: 'JEBAKAN: 900 MHz (RIBET) vs 700 MHz (RAPI)',
        subtitle: 'LANGKAH PENDEK & LURUS JUSTRU FINIS DULUAN!',
        bgHex: '#7F1D1D',
        borderHex: '#F87171',
      },
    ],
    6.4,
    1.18
  );
  board.mesh.position.set(-0.6, 2.72, -2.55);
  group.add(board.mesh);

  const postGeo = tracker.geo(new THREE.CylinderGeometry(0.06, 0.06, 2.65, 8));
  const postMat = tracker.mat(new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 }));
  for (const px of [-3.3, 2.1]) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(px, 1.4, -2.58);
    group.add(post);
  }

  // Warm Oak Packing Table holding 10 numbered parcels (2 rows of 5)
  const tableMat = tracker.mat(new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.65 }));
  const tableTop = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(5.6, 0.16, 2.15)), tableMat);
  tableTop.position.set(-1.35, 0.86, -1.2);
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  group.add(tableTop);

  const legGeo = tracker.geo(new THREE.BoxGeometry(0.14, 0.78, 0.14));
  for (const [lx, lz] of [
    [-3.95, -2.1],
    [1.25, -2.1],
    [-3.95, -0.3],
    [1.25, -0.3],
  ] as const) {
    const leg = new THREE.Mesh(legGeo, postMat);
    leg.position.set(lx, 0.45, lz);
    group.add(leg);
  }

  const parcels: { group: THREE.Group; tape: THREE.Mesh }[] = [];
  const boxMat = tracker.mat(new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 }));
  const tapeMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.3,
      roughness: 0.35,
    })
  );
  for (let i = 0; i < 10; i++) {
    const row = Math.floor(i / 5);
    const col = i % 5;
    const pg = new THREE.Group();
    pg.position.set(-3.35 + col * 1.0, 1.18, -1.65 + row * 0.9);
    const box = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.56, 0.44, 0.56)), boxMat);
    box.castShadow = true;
    pg.add(box);

    const numPlate = buildStorySignPlate(tracker, maxAniso, {
      title: `${i + 1}`,
      bgHex: '#0F172A',
      fgHex: '#FEF08A',
      borderHex: '#38BDF8',
      width: 0.3,
      height: 0.24,
      texW: 96,
      texH: 80,
      titlePx: 44,
    });
    numPlate.position.set(0, 0.02, 0.29);
    pg.add(numPlate);

    const tape = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.59, 0.05, 0.14)), tapeMat);
    tape.position.set(0, 0.23, 0);
    tape.scale.setScalar(0.01);
    pg.add(tape);

    pg.scale.setScalar(0.01);
    group.add(pg);
    parcels.push({ group: pg, tape });
  }

  // Friendly Packing Worker standing beside table at 3/4 view
  const packer = buildRobloxActor(tracker, {
    shirtHex: 0x0ea5e9,
    pantsHex: 0x1e293b,
    hat: 'cap',
    hatHex: 0xfacc15,
    scale: 0.98,
  });
  packer.root.position.set(2.25, 0.14, -1.1);
  packer.root.rotation.y = -0.52;
  group.add(packer.root);

  // Front Footrace Track: 900 MHz (Zig-Zag Ribet) vs 700 MHz (Short & Clean)
  const track = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(9.2, 0.06, 2.3)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 }))
  );
  track.position.set(-0.2, 0.17, 1.55);
  track.receiveShadow = true;
  group.add(track);

  const laneLine = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(9.0, 0.02, 0.08)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.6 }))
  );
  laneLine.position.set(-0.2, 0.21, 1.55);
  group.add(laneLine);

  // Orange detour cones ONLY on the 900 MHz lane so beginners SEE why its steps are longer!
  const coneMat = tracker.mat(new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 }));
  const coneGeo = tracker.geo(new THREE.ConeGeometry(0.14, 0.36, 8));
  for (const cx of [-2.0, -0.3, 1.4]) {
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(cx, 0.38, 0.96);
    group.add(cone);
  }

  // Finish Line Flag Arch
  const finishPostMat = tracker.mat(new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 }));
  for (const fz of [0.45, 2.65]) {
    const fp = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.06, 0.06, 1.85, 8)), finishPostMat);
    fp.position.set(3.55, 1.1, fz);
    group.add(fp);
  }
  const finishSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'GARIS FINIS',
    bgHex: '#064E3B',
    fgHex: '#FEF08A',
    borderHex: '#34D399',
    width: 1.5,
    height: 0.38,
    texW: 280,
    texH: 72,
    titlePx: 30,
  });
  finishSign.position.set(3.55, 2.02, 1.55);
  finishSign.rotation.y = -Math.PI / 2;
  group.add(finishSign);

  const sign900 = buildStorySignPlate(tracker, maxAniso, {
    title: '900 MHz · RIBET',
    bgHex: '#991B1B',
    fgHex: '#FEE2E2',
    borderHex: '#F87171',
    width: 1.9,
    height: 0.34,
    texW: 300,
    texH: 64,
    titlePx: 26,
  });
  sign900.position.set(-3.45, 0.38, 0.35);
  group.add(sign900);

  const sign700 = buildStorySignPlate(tracker, maxAniso, {
    title: '700 MHz · RAPI',
    bgHex: '#065F46',
    fgHex: '#D1FAE5',
    borderHex: '#34D399',
    width: 1.9,
    height: 0.34,
    texW: 300,
    texH: 64,
    titlePx: 26,
  });
  sign700.position.set(-3.45, 0.38, 2.82);
  group.add(sign700);

  const runner900 = buildRobloxActor(tracker, {
    shirtHex: 0xef4444,
    pantsHex: 0x1e293b,
    hat: 'headband',
    hatHex: 0xfef08a,
    scale: 0.82,
  });
  runner900.root.position.set(-3.9, 0.2, 0.96);
  runner900.root.rotation.y = Math.PI / 2;
  group.add(runner900.root);

  const runner700 = buildRobloxActor(tracker, {
    shirtHex: 0x10b981,
    pantsHex: 0x1e293b,
    hat: 'cap',
    hatHex: 0x38bdf8,
    scale: 0.82,
  });
  runner700.root.position.set(-3.9, 0.2, 2.12);
  runner700.root.rotation.y = Math.PI / 2;
  group.add(runner700.root);

  return {
    group,
    update(animT: number, dt: number, keyframeId: string, beatElapsed: number) {
      // 1. Dynamic overhead board phase & progressive parcel counting
      let visibleCount = 10;
      let sealedCount = 0;

      if (keyframeId === 'a2m-intro-10') {
        board.setSlide(0);
        // Parcels pop in one-by-one 1..10 over ~5.5 seconds!
        visibleCount = Math.min(10, Math.max(1, Math.floor(beatElapsed * 1.8) + 1));
        sealedCount = 0;
        animateRobloxActor(packer, 'idle-wave', animT, 0);
      } else if (keyframeId === 'a2m-steps-s') {
        board.setSlide(1);
        visibleCount = 10;
        // Golden tape seals snap onto parcels 1..10 sequentially!
        sealedCount = Math.min(10, Math.floor(beatElapsed * 2.1) + 1);
        animateRobloxActor(packer, 'factory-work', animT, 0.2);
      } else if (keyframeId === 'a2m-divide-r') {
        board.setSlide(2);
        visibleCount = 10;
        sealedCount = 10;
        animateRobloxActor(packer, 'celebrate', animT, 0);
      } else if (keyframeId === 'a2m-formula-exam') {
        board.setSlide(3);
        visibleCount = 10;
        sealedCount = 10;
        animateRobloxActor(packer, 'idle-wave', animT, 0.5);
      } else {
        board.setSlide(4);
        visibleCount = 10;
        sealedCount = 10;
        animateRobloxActor(packer, 'idle-wave', animT, 0.5);
      }

      parcels.forEach((p, idx) => {
        const targetBox = idx < visibleCount ? 1 : 0.01;
        const s = THREE.MathUtils.damp(p.group.scale.x, targetBox, 8, dt);
        p.group.scale.setScalar(s);
        p.group.visible = s > 0.04;

        const targetTape = idx < sealedCount ? 1 : 0.01;
        const ts = THREE.MathUtils.damp(p.tape.scale.x, targetTape, 9, dt);
        p.tape.scale.setScalar(ts);
      });

      // 2. Dynamic Start-to-Finish 900 MHz vs 700 MHz Footrace (NO mindless loop!)
      if (keyframeId === 'a2m-mhz-900') {
        const u = Math.min(1, beatElapsed / 5.5);
        // 900 MHz weaves slowly around cones; 700 MHz starts accelerating smoothly
        const x900 = -3.9 + u * 4.2;
        const z900 = 0.96 + Math.sin(u * Math.PI * 4) * 0.34;
        runner900.root.position.set(x900, 0.2, z900);
        runner700.root.position.set(-3.9 + u * 5.2, 0.2, 2.12);
        animateRobloxActor(runner900, 'sprint-courier', animT * 1.4, 0);
        animateRobloxActor(runner700, 'walk-carry', animT, 0.5);
      } else if (keyframeId === 'a2m-mhz-700-win') {
        const u = Math.min(1, beatElapsed / 3.8);
        // 700 MHz crosses finish line (x = 3.55) first & celebrates!
        const x700 = THREE.MathUtils.lerp(1.3, 3.65, u);
        const x900 = THREE.MathUtils.lerp(0.3, 2.35, u);
        runner700.root.position.set(x700, 0.2, 2.12);
        runner900.root.position.set(x900, 0.2, 0.96 + Math.sin(u * Math.PI * 3) * 0.28);
        if (u >= 0.95) {
          runner700.root.rotation.y = 0;
          animateRobloxActor(runner700, 'celebrate', animT, 0);
          animateRobloxActor(runner900, 'confused', animT, 0.4);
        } else {
          runner700.root.rotation.y = Math.PI / 2;
          animateRobloxActor(runner700, 'sprint-courier', animT, 0);
          animateRobloxActor(runner900, 'sprint-courier', animT * 1.4, 0.2);
        }
      } else {
        // Resting ready at the starting line until the MHz beat begins
        runner900.root.position.set(-3.9, 0.2, 0.96);
        runner700.root.position.set(-3.9, 0.2, 2.12);
        runner900.root.rotation.y = Math.PI / 2;
        runner700.root.rotation.y = Math.PI / 2;
        animateRobloxActor(runner900, 'idle-wave', animT, 0);
        animateRobloxActor(runner700, 'idle-wave', animT, 0.8);
      }
    },
  };
}

export interface BuiltRiscSpecAct {
  group: THREE.Group;
  update: (animT: number, dt: number, keyframeId: string, beatElapsed: number) => void;
}

/**
 * ACT 4 (Video 4/4): Start-to-Finish RISC Motorbike vs CISC Cargo Truck & Progressive SPEC Podium.
 */
export function buildRiscSpecAct(
  tracker: DioramaResourceTracker,
  maxAniso: number
): BuiltRiscSpecAct {
  const group = new THREE.Group();

  const deck = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(12.6, 0.2, 6.8)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xd9c2a3, roughness: 0.78 }))
  );
  deck.position.set(0, 0.04, 0);
  deck.receiveShadow = true;
  group.add(deck);

  // Two-lane paved road with clear Start & Finish gates
  const road = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(8.8, 0.06, 2.7)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 }))
  );
  road.position.set(-1.35, 0.17, 0.25);
  road.receiveShadow = true;
  group.add(road);

  const divider = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(8.6, 0.02, 0.09)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.6 }))
  );
  divider.position.set(-1.35, 0.21, 0.25);
  group.add(divider);

  // Start & Finish banners
  const startSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'START',
    bgHex: '#0F172A',
    fgHex: '#FEF08A',
    borderHex: '#38BDF8',
    width: 1.25,
    height: 0.36,
    texW: 220,
    texH: 68,
    titlePx: 32,
  });
  startSign.position.set(-5.25, 1.85, 0.25);
  startSign.rotation.y = Math.PI / 2;
  group.add(startSign);

  const finSign = buildStorySignPlate(tracker, maxAniso, {
    title: 'FINIS',
    bgHex: '#064E3B',
    fgHex: '#FEF08A',
    borderHex: '#34D399',
    width: 1.25,
    height: 0.36,
    texW: 220,
    texH: 68,
    titlePx: 32,
  });
  finSign.position.set(2.45, 1.85, 0.25);
  finSign.rotation.y = -Math.PI / 2;
  group.add(finSign);

  const poleGeo = tracker.geo(new THREE.CylinderGeometry(0.055, 0.055, 1.75, 8));
  const poleMat = tracker.mat(new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.45 }));
  for (const gx of [-5.25, 2.45]) {
    for (const gz of [-1.05, 1.55]) {
      const p = new THREE.Mesh(poleGeo, poleMat);
      p.position.set(gx, 1.0, gz);
      group.add(p);
    }
  }

  const riscLabel = buildStorySignPlate(tracker, maxAniso, {
    title: 'RISC · KURIR MOTOR LINCAH',
    bgHex: '#065F46',
    fgHex: '#D1FAE5',
    borderHex: '#34D399',
    width: 3.1,
    height: 0.4,
    texW: 420,
    texH: 72,
    titlePx: 28,
  });
  riscLabel.position.set(-1.35, 0.42, -1.35);
  group.add(riscLabel);

  const ciscLabel = buildStorySignPlate(tracker, maxAniso, {
    title: 'CISC · TRUK KARGO BESAR',
    bgHex: '#4C1D95',
    fgHex: '#EDE9FE',
    borderHex: '#A78BFA',
    width: 3.1,
    height: 0.4,
    texW: 420,
    texH: 72,
    titlePx: 28,
  });
  ciscLabel.position.set(-1.35, 0.42, 1.85);
  group.add(ciscLabel);

  // RISC Motorbike + Rider
  const riscBike = buildMotorbikeCourier(tracker, 0x10b981);
  riscBike.position.set(-4.6, 0.2, -0.45);
  group.add(riscBike);

  const riscRider: BuiltRobloxActor = buildRobloxActor(tracker, {
    shirtHex: 0x10b981,
    pantsHex: 0x1e293b,
    hat: 'cap',
    hatHex: 0xfacc15,
    scale: 0.66,
  });
  riscRider.root.position.set(0.02, 0.26, 0);
  riscRider.root.rotation.y = Math.PI / 2;
  riscBike.add(riscRider.root);

  // CISC Heavy Cargo Truck
  const ciscTruck = buildHeavyCargoTruck(tracker, 0x7c3aed);
  ciscTruck.position.set(-4.5, 0.2, 0.95);
  group.add(ciscTruck);

  // Right Side: Progressive SPEC Real-Work Benchmark Podium
  const specGroup = new THREE.Group();
  specGroup.position.set(4.55, 0.14, -0.25);
  group.add(specGroup);

  const specHeader = buildStorySignPlate(tracker, maxAniso, {
    title: 'TES KERJA NYATA',
    subtitle: 'STANDAR SPEC',
    bgHex: '#3B0764',
    fgHex: '#FEF08A',
    subHex: '#E9D5FF',
    borderHex: '#C084FC',
    width: 2.3,
    height: 0.66,
    texW: 340,
    texH: 112,
    titlePx: 30,
    subPx: 25,
  });
  specHeader.position.set(0, 0.42, 0.65);
  specGroup.add(specHeader);

  const specBars: { mesh: THREE.Mesh; fullH: number }[] = [];
  const barSpecs = [
    { x: -0.78, h: 1.15, col: 0x0284c7 },
    { x: 0.0, h: 2.0, col: 0x9333ea },
    { x: 0.78, h: 1.52, col: 0x059669 },
  ];
  for (const bs of barSpecs) {
    const bar = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(0.6, bs.h, 0.6)),
      tracker.mat(
        new THREE.MeshStandardMaterial({
          color: bs.col,
          emissive: bs.col,
          emissiveIntensity: 0.24,
          roughness: 0.35,
        })
      )
    );
    bar.position.set(bs.x, bs.h / 2, 0);
    bar.castShadow = true;
    specGroup.add(bar);
    specBars.push({ mesh: bar, fullH: bs.h });
  }

  const referee = buildRobloxActor(tracker, {
    shirtHex: 0xa855f7,
    pantsHex: 0x1e293b,
    hat: 'headset',
    hatHex: 0xfacc15,
    scale: 0.92,
  });
  referee.root.position.set(0, 2.02, 0);
  specGroup.add(referee.root);

  return {
    group,
    update(animT: number, dt: number, keyframeId: string, beatElapsed: number) {
      // Dynamic Start-to-Finish movement instead of blind constant looping!
      if (keyframeId === 'a2r-start-line') {
        riscBike.position.x = THREE.MathUtils.damp(riscBike.position.x, -4.6, 6, dt);
        ciscTruck.position.x = THREE.MathUtils.damp(ciscTruck.position.x, -4.5, 6, dt);
        riscBike.position.y = 0.2 + Math.abs(Math.sin(animT * 10)) * 0.02; // engine rev!
        animateRobloxActor(riscRider, 'sit-use-pc', animT, 0);
      } else if (keyframeId === 'a2r-risc-bike') {
        // Motorbike zips cleanly from start (-4.6) to finish (+2.1)
        const u = Math.min(1, beatElapsed / 3.6);
        riscBike.position.x = THREE.MathUtils.lerp(-4.6, 2.1, u);
        riscBike.position.y = 0.2 + Math.abs(Math.sin(animT * 14)) * 0.025;
        ciscTruck.position.x = THREE.MathUtils.damp(ciscTruck.position.x, -4.2, 4, dt);
        animateRobloxActor(riscRider, 'sit-use-pc', animT * 1.6, 0);
      } else if (keyframeId === 'a2r-cisc-truck') {
        // Heavy truck rumbles steadily from start (-4.2) toward finish (+1.5)
        const u = Math.min(1, beatElapsed / 5.5);
        ciscTruck.position.x = THREE.MathUtils.lerp(-4.2, 1.5, u);
        ciscTruck.position.y = 0.2 + Math.abs(Math.sin(animT * 6)) * 0.015;
        riscBike.position.x = THREE.MathUtils.damp(riscBike.position.x, 2.1, 5, dt);
        animateRobloxActor(riscRider, 'idle-wave', animT, 0);
      } else {
        riscBike.position.x = THREE.MathUtils.damp(riscBike.position.x, 2.1, 5, dt);
        ciscTruck.position.x = THREE.MathUtils.damp(ciscTruck.position.x, 1.2, 5, dt);
        animateRobloxActor(riscRider, 'idle-wave', animT, 0);
      }

      // SPEC bars grow progressively one-by-one when entering SPEC beats!
      const isSpec = keyframeId === 'a2r-spec-intro' || keyframeId === 'a2r-spec-podium';
      specBars.forEach((b, i) => {
        const reveal = isSpec ? Math.min(1, Math.max(0.08, (beatElapsed - i * 0.65) * 1.4)) : 0.28;
        const nextScale = THREE.MathUtils.damp(b.mesh.scale.y, reveal, 6.5, dt);
        b.mesh.scale.y = nextScale;
        b.mesh.position.y = (b.fullH * nextScale) / 2;
      });
      referee.root.position.y = specBars[1].fullH * specBars[1].mesh.scale.y + 0.02;
      animateRobloxActor(
        referee,
        keyframeId === 'a2r-spec-podium' ? 'celebrate' : 'idle-wave',
        animT,
        0.4
      );
    },
  };
}
