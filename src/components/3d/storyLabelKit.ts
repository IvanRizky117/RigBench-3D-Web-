import * as THREE from 'three';
import type { DioramaResourceTracker } from './theaterDioramaCore';

export interface StorySignOptions {
  title: string;
  subtitle?: string;
  bgHex: string;
  fgHex: string;
  borderHex: string;
  subHex?: string;
  width: number;
  height: number;
  texW?: number;
  texH?: number;
  titlePx?: number;
  subPx?: number;
}

/**
 * Builds a crisp, high-contrast sRGB diegetic sign plate that sits cleanly on
 * diorama machines, walls, kitchen booths, or museum pedestals without glare.
 */
export function buildStorySignPlate(
  tracker: DioramaResourceTracker,
  maxAniso: number,
  opts: StorySignOptions
): THREE.Mesh {
  const tw = opts.texW ?? 384;
  const th = opts.texH ?? (opts.subtitle ? 128 : 88);
  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = opts.bgHex;
    ctx.fillRect(0, 0, tw, th);
    ctx.strokeStyle = opts.borderHex;
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, tw - 8, th - 8);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = opts.fgHex;
    const tPx = opts.titlePx ?? (opts.subtitle ? 34 : 36);
    ctx.font = `900 ${tPx}px "Plus Jakarta Sans", "JetBrains Mono", sans-serif`;
    ctx.fillText(opts.title, tw / 2, opts.subtitle ? th * 0.36 : th * 0.52);

    if (opts.subtitle) {
      ctx.fillStyle = opts.subHex ?? '#E2E8F0';
      const sPx = opts.subPx ?? 24;
      ctx.font = `700 ${sPx}px "JetBrains Mono", sans-serif`;
      ctx.fillText(opts.subtitle, tw / 2, th * 0.72);
    }
  }
  const tex = tracker.tex(new THREE.CanvasTexture(canvas));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  tex.needsUpdate = true;

  const plate = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(opts.width, opts.height, 0.04)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.36,
        metalness: 0.08,
      })
    )
  );
  plate.castShadow = true;
  return plate;
}

/**
 * Stylized 3D burger assembly unit whose visible layers progress smoothly across
 * the 4 kitchen stations: 0=Bun -> 1=+Patty -> 2=+Lettuce/Cheese/TopBun -> 3=Boxed!
 */
export interface BuiltBurgerItem {
  group: THREE.Group;
  bunBottom: THREE.Mesh;
  patty: THREE.Mesh;
  veggieCheese: THREE.Group;
  bunTop: THREE.Mesh;
  boxWrap: THREE.Mesh;
  setStage: (stage: number) => void;
}

export function buildStylizedBurger(
  tracker: DioramaResourceTracker
): BuiltBurgerItem {
  const group = new THREE.Group();
  const bunMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xe69f45, roughness: 0.72 })
  );
  const pattyMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x6b321c, roughness: 0.82 })
  );
  const lettuceMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.65 })
  );
  const cheeseMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.55 })
  );
  const boxMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.45 })
  );

  // Tray plate
  const tray = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.24, 0.21, 0.03, 14)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 }))
  );
  tray.position.y = 0.015;
  group.add(tray);

  const bunBottom = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.18, 0.17, 0.08, 14)),
    bunMat
  );
  bunBottom.position.y = 0.07;
  bunBottom.castShadow = true;
  group.add(bunBottom);

  const patty = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.19, 0.19, 0.075, 14)),
    pattyMat
  );
  patty.position.y = 0.145;
  patty.castShadow = true;
  group.add(patty);

  const veggieCheese = new THREE.Group();
  const cheese = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.32, 0.025, 0.32)), cheeseMat);
  cheese.position.y = 0.195;
  cheese.rotation.y = 0.35;
  veggieCheese.add(cheese);
  const lettuce = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.2, 0.18, 0.035, 10)),
    lettuceMat
  );
  lettuce.position.y = 0.22;
  veggieCheese.add(lettuce);
  group.add(veggieCheese);

  const bunTop = new THREE.Mesh(
    tracker.geo(new THREE.SphereGeometry(0.185, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)),
    bunMat
  );
  bunTop.position.y = 0.235;
  bunTop.castShadow = true;
  group.add(bunTop);

  const boxWrap = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.42, 0.34, 0.42)), boxMat);
  boxWrap.position.y = 0.2;
  boxWrap.castShadow = true;
  group.add(boxWrap);

  return {
    group,
    bunBottom,
    patty,
    veggieCheese,
    bunTop,
    boxWrap,
    setStage(stage: number) {
      const boxed = stage >= 3;
      bunBottom.visible = !boxed;
      patty.visible = !boxed && stage >= 1;
      veggieCheese.visible = !boxed && stage >= 2;
      bunTop.visible = !boxed && stage >= 2;
      boxWrap.visible = boxed;
    },
  };
}

/**
 * Nimble cute 3D Motorbike Courier (RISC analogy: carries small parcel fast!).
 */
export function buildMotorbikeCourier(
  tracker: DioramaResourceTracker,
  accentHex = 0x10b981
): THREE.Group {
  const bike = new THREE.Group();
  const bodyMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: accentHex, roughness: 0.36, metalness: 0.18 })
  );
  const darkMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65, metalness: 0.2 })
  );
  const wheelGeo = tracker.geo(new THREE.CylinderGeometry(0.16, 0.16, 0.09, 14));

  for (const wx of [-0.32, 0.34]) {
    const wheel = new THREE.Mesh(wheelGeo, darkMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(wx, 0.16, 0);
    wheel.castShadow = true;
    bike.add(wheel);
  }

  const chassis = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.72, 0.2, 0.24)), bodyMat);
  chassis.position.set(0, 0.26, 0);
  chassis.castShadow = true;
  bike.add(chassis);

  // Front scooter shield & headlight
  const front = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.16, 0.42, 0.26)), bodyMat);
  front.position.set(0.3, 0.42, 0);
  front.rotation.z = -0.18;
  bike.add(front);

  const lamp = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.06, 0.1, 0.14)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xfacc15,
        emissiveIntensity: 0.8,
      })
    )
  );
  lamp.position.set(0.39, 0.5, 0);
  bike.add(lamp);

  // Small nimble courier parcel box on rear rack
  const box = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.3, 0.26, 0.28)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.55 }))
  );
  box.position.set(-0.28, 0.48, 0);
  box.castShadow = true;
  bike.add(box);

  return bike;
}

/**
 * Chunky stylized 3D Heavy Cargo Truck (CISC analogy: carries huge load slowly).
 */
export function buildHeavyCargoTruck(
  tracker: DioramaResourceTracker,
  cabHex = 0x7c3aed
): THREE.Group {
  const truck = new THREE.Group();
  const cabMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: cabHex, roughness: 0.42, metalness: 0.16 })
  );
  const cargoMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.52, metalness: 0.12 })
  );
  const darkMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 })
  );
  const glassMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.2, metalness: 0.25 })
  );

  const wheelGeo = tracker.geo(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 14));
  for (const wx of [-0.52, -0.1, 0.46]) {
    for (const wz of [-0.32, 0.32]) {
      const w = new THREE.Mesh(wheelGeo, darkMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(wx, 0.18, wz);
      w.castShadow = true;
      truck.add(w);
    }
  }

  // Huge heavy container box
  const cargo = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(1.02, 0.78, 0.68)), cargoMat);
  cargo.position.set(-0.24, 0.64, 0);
  cargo.castShadow = true;
  truck.add(cargo);

  // Heavy cab
  const cab = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.48, 0.62, 0.64)), cabMat);
  cab.position.set(0.54, 0.56, 0);
  cab.castShadow = true;
  truck.add(cab);

  const windshield = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.05, 0.26, 0.52)), glassMat);
  windshield.position.set(0.77, 0.66, 0);
  truck.add(windshield);

  return truck;
}

/**
 * Cute stylized 3D Mini Car for S3 Analogy: Hardware = Mobil, Software = Peta, Brainware = Supir!
 */
export function buildMiniCarProp(
  tracker: DioramaResourceTracker,
  carHex = 0x0284c7
): THREE.Group {
  const car = new THREE.Group();
  const paintMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: carHex, roughness: 0.34, metalness: 0.24 })
  );
  const glassMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.18, metalness: 0.25 })
  );
  const wheelMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.72 })
  );

  const body = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(1.38, 0.38, 0.76)), paintMat);
  body.position.y = 0.34;
  body.castShadow = true;
  car.add(body);

  const cabin = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.78, 0.34, 0.66)), glassMat);
  cabin.position.set(-0.06, 0.66, 0);
  car.add(cabin);

  const roof = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.74, 0.07, 0.68)), paintMat);
  roof.position.set(-0.06, 0.85, 0);
  car.add(roof);

  const wheelGeo = tracker.geo(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 14));
  for (const wx of [-0.42, 0.42]) {
    for (const wz of [-0.38, 0.38]) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, 0.18, wz);
      wheel.castShadow = true;
      car.add(wheel);
    }
  }
  return car;
}

/**
 * Builds a crisp circular Analog Clock dial with a sweeping needle (for S3 Analog = Jarum Halus).
 */
export function buildAnalogClockProp(
  tracker: DioramaResourceTracker,
  maxAniso: number
): { group: THREE.Group; handPivot: THREE.Group } {
  const group = new THREE.Group();
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FFFBEB';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(128, 128, 114, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#78350F';
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const x = 128 + Math.cos(ang) * 90;
      const y = 128 + Math.sin(ang) * 90;
      ctx.beginPath();
      ctx.arc(x, y, i % 3 === 0 ? 8 : 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = '900 22px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#B45309';
    ctx.fillText('ANALOG', 128, 186);
  }
  const tex = tracker.tex(new THREE.CanvasTexture(canvas));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;

  const rim = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.46, 0.46, 0.12, 24)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.4, metalness: 0.3 }))
  );
  rim.rotation.x = Math.PI / 2;
  rim.castShadow = true;
  group.add(rim);

  const dial = new THREE.Mesh(
    tracker.geo(new THREE.CircleGeometry(0.41, 24)),
    tracker.mat(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35 }))
  );
  dial.position.z = 0.065;
  group.add(dial);

  const handPivot = new THREE.Group();
  handPivot.position.z = 0.085;
  const hand = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.04, 0.3, 0.025)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 }))
  );
  hand.position.y = 0.12;
  handPivot.add(hand);
  group.add(handPivot);

  return { group, handPivot };
}
