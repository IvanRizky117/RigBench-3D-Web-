import * as THREE from 'three';
import type { DioramaResourceTracker, TheaterStageAtmosphere } from './theaterDioramaCore';

export type StorySkyMood =
  | 'sunny-campus'
  | 'cozy-day'
  | 'warm-workshop'
  | 'retro-lab'
  | 'future-ai'
  | 'ancient-market';

export const STORY_ATMOSPHERE_PRESETS: Record<StorySkyMood, TheaterStageAtmosphere> = {
  'sunny-campus': {
    backgroundHex: 0x8ecdf8,
    fogHex: 0xcfe9fb,
    fogNear: 18,
    fogFar: 52,
    hemiSkyHex: 0xb7e2ff,
    hemiGroundHex: 0x9b8468,
    hemiIntensity: 0.78,
    keyHex: 0xfff0d4,
    keyIntensity: 1.24,
    rimHex: 0x60a5fa,
    rimIntensity: 0.42,
    envIntensity: 0.58,
  },
  'cozy-day': {
    backgroundHex: 0x91d1fc,
    fogHex: 0xd6ecfc,
    fogNear: 18,
    fogFar: 52,
    hemiSkyHex: 0xc2e6ff,
    hemiGroundHex: 0xaa8f6f,
    hemiIntensity: 0.78,
    keyHex: 0xfff0d2,
    keyIntensity: 1.22,
    rimHex: 0x60a5fa,
    rimIntensity: 0.4,
    envIntensity: 0.56,
  },
  'warm-workshop': {
    backgroundHex: 0xf0be86,
    fogHex: 0xf7d8b4,
    fogNear: 17,
    fogFar: 50,
    hemiSkyHex: 0xffddb0,
    hemiGroundHex: 0x8a6544,
    hemiIntensity: 0.82,
    keyHex: 0xffcf8e,
    keyIntensity: 1.32,
    rimHex: 0xf59e0b,
    rimIntensity: 0.42,
    envIntensity: 0.6,
  },
  'retro-lab': {
    backgroundHex: 0xa0c7e0,
    fogHex: 0xcbe2f0,
    fogNear: 18,
    fogFar: 52,
    hemiSkyHex: 0xc8dff5,
    hemiGroundHex: 0x8c7b65,
    hemiIntensity: 0.8,
    keyHex: 0xfff0d4,
    keyIntensity: 1.24,
    rimHex: 0xf59e0b,
    rimIntensity: 0.38,
    envIntensity: 0.58,
  },
  'future-ai': {
    backgroundHex: 0x9fc2f7,
    fogHex: 0xd1dffa,
    fogNear: 18,
    fogFar: 54,
    hemiSkyHex: 0xc0ccf8,
    hemiGroundHex: 0x7b88c9,
    hemiIntensity: 0.84,
    keyHex: 0xf1f5f9,
    keyIntensity: 1.26,
    rimHex: 0xa855f7,
    rimIntensity: 0.52,
    envIntensity: 0.64,
  },
  'ancient-market': {
    backgroundHex: 0x8fd3ff,
    fogHex: 0xf6e6c9,
    fogNear: 17,
    fogFar: 50,
    hemiSkyHex: 0xdaf0ff,
    hemiGroundHex: 0xd6b07a,
    hemiIntensity: 1.04,
    keyHex: 0xffe8b8,
    keyIntensity: 1.6,
    rimHex: 0xfde68a,
    rimIntensity: 0.45,
    envIntensity: 0.8,
  },
};

const SKY_GRADIENT_COLORS: Record<StorySkyMood, [string, string, string]> = {
  'sunny-campus': ['#3B9EFF', '#96D6FF', '#F2FAFF'],
  'cozy-day': ['#54AEFF', '#AEDDFF', '#FFF7EC'],
  'warm-workshop': ['#E07A5F', '#F7B267', '#FFF0D6'],
  'retro-lab': ['#6096BA', '#A3CEF1', '#EEF6FB'],
  'future-ai': ['#6366F1', '#93C5FD', '#F5E8FF'],
  'ancient-market': ['#3898EC', '#9AD9FF', '#FCE9C8'],
};

export interface BuiltStoryBackdrop {
  skyMesh: THREE.Mesh;
  clouds: Array<{ group: THREE.Group; baseX: number; speed: number; range: number; bobPhase: number }>;
  trees: THREE.Group[];
  setMoodTint: (targetHex: number, dt: number) => void;
  update: (elapsed: number, dt: number) => void;
}

const _skyTintTarget = new THREE.Color();

function createSkyGradientTexture(
  tracker: DioramaResourceTracker,
  mood: StorySkyMood
): THREE.CanvasTexture {
  const [top, mid, horizon] = SKY_GRADIENT_COLORS[mood];
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, top);
    grad.addColorStop(0.46, mid);
    grad.addColorStop(0.62, horizon);
    grad.addColorStop(1.0, horizon);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tracker.tex(tex);
}

/**
 * Adds a bright stylized Roblox/Pixar-mini sky dome, drifting low-poly clouds,
 * rolling sunlit hills, and natural trees surrounding the diorama stage.
 */
export function buildStoryBackdrop(
  tracker: DioramaResourceTracker,
  rootGroup: THREE.Group,
  mood: StorySkyMood,
  groundHex = 0x7bc96f
): BuiltStoryBackdrop {
  const skyMat = tracker.mat(
    new THREE.MeshBasicMaterial({
      map: createSkyGradientTexture(tracker, mood),
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      color: 0xffffff,
    })
  );
  const skyMesh = new THREE.Mesh(tracker.geo(new THREE.SphereGeometry(42, 24, 16)), skyMat);
  skyMesh.position.set(0, 2, 0);
  rootGroup.add(skyMesh);

  // Extended sunlit outdoor meadow/sand ground so zero void is ever visible
  const groundMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: groundHex,
      roughness: 0.92,
      metalness: 0.02,
    })
  );
  const ground = new THREE.Mesh(tracker.geo(new THREE.CircleGeometry(40, 40)), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.06;
  ground.receiveShadow = true;
  rootGroup.add(ground);

  // Soft low-poly rolling hills around perimeter
  const hillMatA = tracker.mat(
    new THREE.MeshStandardMaterial({ color: groundHex, roughness: 0.9, metalness: 0.02 })
  );
  const hillMatB = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(groundHex).multiplyScalar(0.88),
      roughness: 0.92,
      metalness: 0.02,
    })
  );
  const hillGeo = tracker.geo(new THREE.SphereGeometry(1, 14, 10));
  const hillSpecs: Array<[number, number, number, number, number, boolean]> = [
    [-14, -13, 8.5, 2.7, 5.5, true],
    [-4, -15.5, 9.5, 3.2, 5.8, false],
    [8, -14.5, 8.8, 2.9, 5.4, true],
    [16, -11.5, 7.6, 2.5, 5.2, false],
    [-17, -4, 6.2, 2.0, 6.0, false],
    [17, -3.5, 6.5, 2.1, 6.0, true],
  ];
  for (const [x, z, sx, sy, sz, alt] of hillSpecs) {
    const hill = new THREE.Mesh(hillGeo, alt ? hillMatA : hillMatB);
    hill.position.set(x, -0.35, z);
    hill.scale.set(sx, sy, sz);
    hill.receiveShadow = true;
    rootGroup.add(hill);
  }

  // Stylized low-poly trees framing the back horizon
  const trunkMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x8d5b3a, roughness: 0.85, metalness: 0.03 })
  );
  const leafMatA = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x45b66b, roughness: 0.78, metalness: 0.02 })
  );
  const leafMatB = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x56c778, roughness: 0.76, metalness: 0.02 })
  );
  const trunkGeo = tracker.geo(new THREE.CylinderGeometry(0.14, 0.2, 0.95, 7));
  const puffGeo = tracker.geo(new THREE.DodecahedronGeometry(0.62, 0));

  const trees: THREE.Group[] = [];
  const treeCoords: Array<[number, number, number]> = [
    [-9.2, -7.2, 1.05],
    [-7.1, -8.5, 0.88],
    [-3.2, -9.2, 1.12],
    [2.6, -9.0, 0.94],
    [7.4, -8.2, 1.15],
    [9.6, -6.6, 0.9],
    [-10.4, -2.5, 0.85],
    [10.4, -2.2, 0.92],
  ];
  treeCoords.forEach(([tx, tz, sc], idx) => {
    const tree = new THREE.Group();
    tree.position.set(tx, -0.05, tz);
    tree.scale.setScalar(sc);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.48;
    trunk.castShadow = true;
    tree.add(trunk);

    const c1 = new THREE.Mesh(puffGeo, idx % 2 === 0 ? leafMatA : leafMatB);
    c1.position.set(0, 1.25, 0);
    c1.scale.set(1.1, 0.95, 1.1);
    c1.castShadow = true;
    tree.add(c1);

    const c2 = new THREE.Mesh(puffGeo, idx % 2 === 0 ? leafMatB : leafMatA);
    c2.position.set(0.32, 1.05, 0.16);
    c2.scale.set(0.76, 0.72, 0.76);
    tree.add(c2);

    const c3 = new THREE.Mesh(puffGeo, leafMatA);
    c3.position.set(-0.28, 1.08, -0.14);
    c3.scale.set(0.72, 0.68, 0.72);
    tree.add(c3);

    rootGroup.add(tree);
    trees.push(tree);
  });

  // Fluffy drifting stylized clouds
  const cloudMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0,
      emissive: 0xffffff,
      emissiveIntensity: 0.14,
    })
  );
  const cloudSphereGeo = tracker.geo(new THREE.SphereGeometry(0.68, 10, 8));
  const clouds: BuiltStoryBackdrop['clouds'] = [];
  const cloudSpecs: Array<[number, number, number, number, number]> = [
    [-11, 7.6, -13, 1.2, 0.24],
    [-2, 8.8, -15, 1.45, 0.18],
    [8.5, 7.2, -12.5, 1.15, 0.27],
    [15, 8.3, -16, 1.3, 0.2],
    [-16, 6.9, -11, 1.0, 0.22],
  ];
  cloudSpecs.forEach(([cx, cy, cz, sc, speed], idx) => {
    const cg = new THREE.Group();
    cg.position.set(cx, cy, cz);
    cg.scale.setScalar(sc);
    const offsets: Array<[number, number, number, number]> = [
      [0, 0, 0, 1.0],
      [-0.68, -0.12, 0.08, 0.75],
      [0.72, -0.1, -0.05, 0.78],
      [0.18, 0.25, -0.12, 0.68],
    ];
    for (const [ox, oy, oz, r] of offsets) {
      const puff = new THREE.Mesh(cloudSphereGeo, cloudMat);
      puff.position.set(ox, oy, oz);
      puff.scale.set(r * 1.15, r * 0.75, r * 0.9);
      cg.add(puff);
    }
    rootGroup.add(cg);
    clouds.push({ group: cg, baseX: cx, speed, range: 20, bobPhase: idx * 1.3 });
  });

  return {
    skyMesh,
    clouds,
    trees,
    setMoodTint(targetHex: number, dt: number) {
      _skyTintTarget.setHex(targetHex);
      skyMat.color.lerp(_skyTintTarget, Math.min(1, dt * 2.5));
    },
    update(elapsed: number, dt: number) {
      for (const c of clouds) {
        c.group.position.x += c.speed * dt;
        if (c.group.position.x > c.range) {
          c.group.position.x = -c.range;
        }
        c.group.position.y += Math.sin(elapsed * 0.65 + c.bobPhase) * 0.0018;
      }
      for (let i = 0; i < trees.length; i++) {
        trees[i].rotation.z = Math.sin(elapsed * 1.1 + i * 0.9) * 0.028;
      }
    },
  };
}

export interface CutawayRoomOptions {
  width: number;
  depth: number;
  wallHeight: number;
  floorHex: number;
  wallHex: number;
  trimHex?: number;
  rugHex?: number;
  hasWindow?: boolean;
  windowSkyHex?: number;
}

/**
 * Builds a warm, tactile stylized cutaway diorama room (floor slab, baseboard,
 * back & left walls with optional sunlit window frame, plus cozy rug).
 */
export function buildCutawayRoom(
  tracker: DioramaResourceTracker,
  opts: CutawayRoomOptions
): THREE.Group {
  const room = new THREE.Group();
  const {
    width,
    depth,
    wallHeight,
    floorHex,
    wallHex,
    trimHex = 0xf8fafc,
    rugHex,
    hasWindow = true,
    windowSkyHex = 0xbae6fd,
  } = opts;

  const floorMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: floorHex, roughness: 0.72, metalness: 0.05 })
  );
  const wallMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: wallHex, roughness: 0.86, metalness: 0.02 })
  );
  const trimMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: trimHex, roughness: 0.52, metalness: 0.08 })
  );

  // Thick stylized miniature base slab
  const slab = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(width, 0.16, depth)), floorMat);
  slab.position.set(0, 0.08, 0);
  slab.receiveShadow = true;
  slab.castShadow = true;
  room.add(slab);

  // Back wall
  const backWall = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(width, wallHeight, 0.14)),
    wallMat
  );
  backWall.position.set(0, 0.16 + wallHeight / 2, -depth / 2 + 0.07);
  backWall.receiveShadow = true;
  backWall.castShadow = true;
  room.add(backWall);

  // Left cutaway half-wall
  const leftWall = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.14, wallHeight, depth)),
    wallMat
  );
  leftWall.position.set(-width / 2 + 0.07, 0.16 + wallHeight / 2, 0);
  leftWall.receiveShadow = true;
  leftWall.castShadow = true;
  room.add(leftWall);

  // Crisp baseboard trim along back & left walls
  const backTrim = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(width - 0.14, 0.12, 0.05)),
    trimMat
  );
  backTrim.position.set(0.06, 0.22, -depth / 2 + 0.16);
  room.add(backTrim);

  const leftTrim = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.05, 0.12, depth - 0.14)),
    trimMat
  );
  leftTrim.position.set(-width / 2 + 0.16, 0.22, 0.06);
  room.add(leftTrim);

  // Sunlit framed window on back wall
  if (hasWindow && width >= 2.2) {
    const winW = Math.min(1.45, width * 0.36);
    const winH = Math.min(1.05, wallHeight * 0.46);
    const winY = 0.16 + wallHeight * 0.56;
    const winZ = -depth / 2 + 0.16;

    const frame = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(winW + 0.16, winH + 0.16, 0.08)),
      trimMat
    );
    frame.position.set(0, winY, winZ);
    room.add(frame);

    const glassMat = tracker.mat(
      new THREE.MeshStandardMaterial({
        color: windowSkyHex,
        emissive: windowSkyHex,
        emissiveIntensity: 0.42,
        roughness: 0.18,
        metalness: 0.1,
      })
    );
    const glass = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(winW, winH, 0.04)), glassMat);
    glass.position.set(0, winY, winZ + 0.035);
    room.add(glass);

    // Cross muntin bars
    const barV = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.055, winH, 0.06)), trimMat);
    barV.position.set(0, winY, winZ + 0.05);
    room.add(barV);
    const barH = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(winW, 0.055, 0.06)), trimMat);
    barH.position.set(0, winY, winZ + 0.05);
    room.add(barH);
  }

  // Optional cozy rug offset +0.02 above floor to avoid Z-fighting
  if (rugHex !== undefined) {
    const rugMat = tracker.mat(
      new THREE.MeshStandardMaterial({ color: rugHex, roughness: 0.94, metalness: 0.0 })
    );
    const rug = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(width * 0.58, 0.025, depth * 0.52)),
      rugMat
    );
    rug.position.set(0.08, 0.175, 0.18);
    rug.receiveShadow = true;
    room.add(rug);
  }

  return room;
}

export interface WarmStoryCue {
  group: THREE.Group;
  update: (
    elapsed: number,
    dt: number,
    anchor: [number, number, number],
    visible: boolean
  ) => void;
}

/**
 * Replaces the harsh dark technical Focus Ring on story scenes with a gentle
 * warm golden bouncing pointer arrow + subtle sunlit floor glow.
 */
export function buildWarmStoryCue(
  tracker: DioramaResourceTracker,
  rootGroup: THREE.Group
): WarmStoryCue {
  const group = new THREE.Group();

  const goldMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.52,
      roughness: 0.28,
      metalness: 0.35,
    })
  );

  // Cute chunky downward pointer arrow hovering gently above active actor/zone
  const arrowGroup = new THREE.Group();
  const cone = new THREE.Mesh(tracker.geo(new THREE.ConeGeometry(0.18, 0.28, 6)), goldMat);
  cone.rotation.x = Math.PI;
  cone.position.y = 0;
  arrowGroup.add(cone);

  const stem = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 6)), goldMat);
  stem.position.y = 0.2;
  arrowGroup.add(stem);

  group.add(arrowGroup);

  // Soft warm sunlit floor ring
  const haloMat = tracker.mat(
    new THREE.MeshBasicMaterial({
      color: 0xfde68a,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  const halo = new THREE.Mesh(tracker.geo(new THREE.RingGeometry(0.45, 0.62, 28)), haloMat);
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.04;
  group.add(halo);

  rootGroup.add(group);

  return {
    group,
    update(elapsed, dt, anchor, visible) {
      group.visible = visible;
      if (!visible) return;
      group.position.x = THREE.MathUtils.damp(group.position.x, anchor[0], 7.5, dt);
      group.position.z = THREE.MathUtils.damp(group.position.z, anchor[2], 7.5, dt);
      group.position.y = THREE.MathUtils.damp(group.position.y, Math.max(0.14, anchor[1] - 0.55), 7.5, dt);

      arrowGroup.position.y = 1.65 + Math.sin(elapsed * 4.2) * 0.14;
      arrowGroup.rotation.y = elapsed * 1.4;
      const pulse = 1 + Math.sin(elapsed * 3.2) * 0.08;
      halo.scale.set(pulse, pulse, 1);
    },
  };
}
