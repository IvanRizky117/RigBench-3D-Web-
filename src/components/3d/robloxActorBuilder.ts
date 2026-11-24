import * as THREE from 'three';
import type { DioramaResourceTracker } from './theaterDioramaCore';

export type RobloxHatKind =
  | 'none'
  | 'cap'
  | 'hardhat'
  | 'tophat'
  | 'beret'
  | 'headband'
  | 'ribbon'
  | 'headset'
  | 'glasses';

export type RobloxPropKind =
  | 'none'
  | 'parcel'
  | 'clipboard'
  | 'punchcard'
  | 'baton'
  | 'wrench';

export type RobloxAction =
  | 'idle-wave'
  | 'typing'
  | 'walk-carry'
  | 'sprint-courier'
  | 'crank-gear'
  | 'abacus-slide'
  | 'factory-work'
  | 'sit-use-pc'
  | 'write-board'
  | 'celebrate'
  | 'confused'
  | 'conduct-baton';

export interface RobloxActorConfig {
  shirtHex: number;
  pantsHex: number;
  skinHex?: number;
  hairHex?: number;
  hat?: RobloxHatKind;
  hatHex?: number;
  prop?: RobloxPropKind;
  propHex?: number;
  labCoat?: boolean;
  scale?: number;
}

export interface BuiltRobloxActor {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  headPivot: THREE.Group;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  heldProp: THREE.Group | null;
}

let cachedFaceCanvas: HTMLCanvasElement | null = null;

function createCuteRobloxFaceTexture(
  tracker: DioramaResourceTracker,
  skinHex: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const col = new THREE.Color(skinHex);
    ctx.fillStyle = `#${col.getHexString()}`;
    ctx.fillRect(0, 0, 128, 128);

    // Cute soft rosy cheeks
    ctx.fillStyle = 'rgba(244, 114, 142, 0.34)';
    ctx.beginPath();
    ctx.ellipse(28, 72, 11, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(100, 72, 11, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute simple black dot eyes with tiny sparkle
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(42, 54, 8.5, 0, Math.PI * 2);
    ctx.arc(86, 54, 8.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(45, 51, 2.8, 0, Math.PI * 2);
    ctx.arc(89, 51, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Simple happy Roblox smile arc
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(64, 67, 17, Math.PI * 0.16, Math.PI * 0.84);
    ctx.stroke();
  }
  cachedFaceCanvas = canvas;
  void cachedFaceCanvas;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tracker.tex(tex);
}

/**
 * Builds an adorable blocky Roblox R6-style character grounded at bottom-center (y = 0)
 * with dot eyes, happy smile, role costumes/hats, and articulated limbs for storytelling.
 */
export function buildRobloxActor(
  tracker: DioramaResourceTracker,
  cfg: RobloxActorConfig
): BuiltRobloxActor {
  const skinHex = cfg.skinHex ?? 0xffdbac;
  const hairHex = cfg.hairHex ?? 0x3b2f2f;
  const scale = cfg.scale ?? 1.0;

  const root = new THREE.Group();
  root.scale.setScalar(scale);

  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const skinMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.62, metalness: 0.02 })
  );
  const faceMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      map: createCuteRobloxFaceTexture(tracker, skinHex),
      roughness: 0.56,
      metalness: 0.02,
    })
  );
  const shirtMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: cfg.labCoat ? 0xf8fafc : cfg.shirtHex,
      roughness: 0.72,
      metalness: 0.04,
    })
  );
  const innerShirtMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: cfg.shirtHex, roughness: 0.7, metalness: 0.04 })
  );
  const pantsMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: cfg.pantsHex, roughness: 0.82, metalness: 0.02 })
  );
  const shoeMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65, metalness: 0.1 })
  );

  // Legs (hip pivot at y = 0.42 so feet rest cleanly at y = 0)
  const legGeo = tracker.geo(new THREE.BoxGeometry(0.18, 0.42, 0.2));
  const shoeGeo = tracker.geo(new THREE.BoxGeometry(0.19, 0.09, 0.24));

  const makeLeg = (x: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.42, 0);
    const leg = new THREE.Mesh(legGeo, pantsMat);
    leg.position.y = -0.21;
    leg.castShadow = true;
    pivot.add(leg);

    const shoe = new THREE.Mesh(shoeGeo, shoeMat);
    shoe.position.set(0, -0.375, 0.02);
    shoe.castShadow = true;
    pivot.add(shoe);
    bodyPivot.add(pivot);
    return pivot;
  };
  const leftLegPivot = makeLeg(-0.11);
  const rightLegPivot = makeLeg(0.11);

  // Blocky R6 Torso
  const torso = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.44, 0.46, 0.24)), shirtMat);
  torso.position.y = 0.65;
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyPivot.add(torso);

  // Optional lab coat inner lapel stripe
  if (cfg.labCoat) {
    const lapel = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(0.13, 0.42, 0.03)),
      innerShirtMat
    );
    lapel.position.set(0, 0.64, 0.118);
    bodyPivot.add(lapel);
  }

  // Arms (shoulder pivot at y = 0.84)
  const armGeo = tracker.geo(new THREE.BoxGeometry(0.15, 0.4, 0.17));
  const handGeo = tracker.geo(new THREE.BoxGeometry(0.145, 0.1, 0.16));

  const makeArm = (x: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.84, 0);
    const sleeve = new THREE.Mesh(armGeo, shirtMat);
    sleeve.position.y = -0.17;
    sleeve.castShadow = true;
    pivot.add(sleeve);

    const hand = new THREE.Mesh(handGeo, skinMat);
    hand.position.y = -0.37;
    hand.castShadow = true;
    pivot.add(hand);
    bodyPivot.add(pivot);
    return pivot;
  };
  const leftArmPivot = makeArm(-0.31);
  const rightArmPivot = makeArm(0.31);

  // Head pivot (cute chunky blocky Roblox head with face on +Z)
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.89, 0);
  bodyPivot.add(headPivot);

  const headMats = [skinMat, skinMat, skinMat, skinMat, faceMat, skinMat];
  const head = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.36, 0.34, 0.34)), headMats);
  head.position.y = 0.18;
  head.castShadow = true;
  headPivot.add(head);

  // Cute blocky hair cap (unless covered by full top hat / hard hat)
  const hairMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: hairHex, roughness: 0.78, metalness: 0.04 })
  );
  if (cfg.hat !== 'hardhat' && cfg.hat !== 'tophat') {
    const hairTop = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.38, 0.09, 0.36)), hairMat);
    hairTop.position.set(0, 0.36, -0.01);
    headPivot.add(hairTop);

    const hairBack = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.38, 0.24, 0.09)), hairMat);
    hairBack.position.set(0, 0.22, -0.16);
    headPivot.add(hairBack);
  }

  // Role hats & accessories
  const hatMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: cfg.hatHex ?? 0x3b82f6,
      roughness: 0.48,
      metalness: 0.12,
    })
  );
  if (cfg.hat === 'cap') {
    const crown = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.39, 0.12, 0.38)), hatMat);
    crown.position.set(0, 0.38, 0);
    headPivot.add(crown);
    const brim = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.38, 0.04, 0.18)), hatMat);
    brim.position.set(0, 0.33, 0.24);
    headPivot.add(brim);
  } else if (cfg.hat === 'hardhat') {
    const dome = new THREE.Mesh(
      tracker.geo(new THREE.SphereGeometry(0.24, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55)),
      hatMat
    );
    dome.position.set(0, 0.32, 0);
    headPivot.add(dome);
    const brim = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.27, 0.28, 0.04, 14)), hatMat);
    brim.position.set(0, 0.33, 0.03);
    headPivot.add(brim);
  } else if (cfg.hat === 'tophat') {
    const brim = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.29, 0.29, 0.04, 14)), hatMat);
    brim.position.set(0, 0.36, 0);
    headPivot.add(brim);
    const cyl = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.19, 0.2, 0.34, 14)), hatMat);
    cyl.position.set(0, 0.54, 0);
    headPivot.add(cyl);
  } else if (cfg.hat === 'beret') {
    const beret = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.24, 0.2, 0.1, 12)), hatMat);
    beret.position.set(0.03, 0.39, -0.02);
    beret.rotation.z = -0.15;
    headPivot.add(beret);
  } else if (cfg.hat === 'headband') {
    const band = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.4, 0.08, 0.38)), hatMat);
    band.position.set(0, 0.32, 0);
    headPivot.add(band);
  } else if (cfg.hat === 'ribbon') {
    const bowL = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.14, 0.09, 0.06)), hatMat);
    bowL.position.set(-0.14, 0.4, 0.06);
    bowL.rotation.z = 0.25;
    headPivot.add(bowL);
    const bowR = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.14, 0.09, 0.06)), hatMat);
    bowR.position.set(0.14, 0.4, 0.06);
    bowR.rotation.z = -0.25;
    headPivot.add(bowR);
  } else if (cfg.hat === 'headset') {
    const hsGroup = new THREE.Group();
    const accentHex = cfg.hatHex ?? 0x38bdf8;
    const shellMat = tracker.mat(
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.36, metalness: 0.38 })
    );
    const padMat = tracker.mat(
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.84, metalness: 0.05 })
    );
    const metalMat = tracker.mat(
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.78 })
    );
    const ledMat = tracker.mat(
      new THREE.MeshStandardMaterial({
        color: accentHex,
        emissive: accentHex,
        emissiveIntensity: 0.75,
        roughness: 0.22,
        metalness: 0.2,
      })
    );

    // Thick arched headband clearing the blocky head & hair cleanly
    const bandArc = new THREE.Mesh(
      tracker.geo(new THREE.TorusGeometry(0.24, 0.036, 10, 22, Math.PI)),
      shellMat
    );
    bandArc.position.set(0, 0.21, -0.005);
    bandArc.scale.set(0.95, 1.05, 1.35);
    hsGroup.add(bandArc);

    // Soft top inner headband cushion + glowing top accent bar
    const topCushion = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(0.26, 0.04, 0.095)),
      padMat
    );
    topCushion.position.set(0, 0.43, -0.005);
    hsGroup.add(topCushion);

    const topLedStrip = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(0.2, 0.018, 0.03)),
      ledMat
    );
    topLedStrip.position.set(0, 0.485, -0.005);
    hsGroup.add(topLedStrip);

    // Left & Right metallic hinges + plush earcups + glowing gaming LED rings
    const cupGeo = tracker.geo(new THREE.CylinderGeometry(0.115, 0.115, 0.068, 16));
    const cushionGeo = tracker.geo(new THREE.CylinderGeometry(0.122, 0.122, 0.032, 16));
    const ledRingGeo = tracker.geo(new THREE.TorusGeometry(0.082, 0.015, 8, 20));
    const sliderGeo = tracker.geo(new THREE.BoxGeometry(0.032, 0.11, 0.048));

    for (const side of [-1, 1] as const) {
      const slider = new THREE.Mesh(sliderGeo, metalMat);
      slider.position.set(side * 0.22, 0.29, -0.005);
      hsGroup.add(slider);

      // Soft inner ear cushion pressing snugly against head side
      const cushion = new THREE.Mesh(cushionGeo, padMat);
      cushion.rotation.z = Math.PI / 2;
      cushion.position.set(side * 0.195, 0.185, 0.0);
      hsGroup.add(cushion);

      // Outer sculpted matte gaming earcup shell
      const cup = new THREE.Mesh(cupGeo, shellMat);
      cup.rotation.z = Math.PI / 2;
      cup.position.set(side * 0.232, 0.185, 0.0);
      cup.castShadow = true;
      hsGroup.add(cup);

      // Glowing outer RGB/LED ring
      const ledRing = new THREE.Mesh(ledRingGeo, ledMat);
      ledRing.rotation.y = Math.PI / 2;
      ledRing.position.set(side * 0.268, 0.185, 0.0);
      hsGroup.add(ledRing);

      // Center metallic badge cap
      const centerCap = new THREE.Mesh(
        tracker.geo(new THREE.CylinderGeometry(0.044, 0.044, 0.016, 12)),
        metalMat
      );
      centerCap.rotation.z = Math.PI / 2;
      centerCap.position.set(side * 0.266, 0.185, 0.0);
      hsGroup.add(centerCap);
    }

    // Flexible side boom microphone from left earcup curving cleanly near left cheek
    const boomCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.235, 0.145, 0.055),
      new THREE.Vector3(-0.245, 0.095, 0.175),
      new THREE.Vector3(-0.125, 0.088, 0.225),
    ]);
    const boomArm = new THREE.Mesh(
      tracker.geo(new THREE.TubeGeometry(boomCurve, 12, 0.013, 8, false)),
      shellMat
    );
    hsGroup.add(boomArm);

    const micTip = new THREE.Mesh(
      tracker.geo(new THREE.CapsuleGeometry(0.022, 0.036, 6, 10)),
      padMat
    );
    micTip.rotation.z = Math.PI / 2;
    micTip.position.set(-0.105, 0.088, 0.228);
    hsGroup.add(micTip);

    const micLed = new THREE.Mesh(
      tracker.geo(new THREE.SphereGeometry(0.012, 8, 8)),
      ledMat
    );
    micLed.position.set(-0.082, 0.088, 0.228);
    hsGroup.add(micLed);

    headPivot.add(hsGroup);
  }

  if (cfg.hat === 'glasses' || cfg.labCoat) {
    const glassFrameMat = tracker.mat(
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.5 })
    );
    const leftLens = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.12, 0.09, 0.03)), glassFrameMat);
    leftLens.position.set(-0.08, 0.2, 0.18);
    headPivot.add(leftLens);
    const rightLens = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.12, 0.09, 0.03)), glassFrameMat);
    rightLens.position.set(0.08, 0.2, 0.18);
    headPivot.add(rightLens);
  }

  // Optional handheld prop attached cleanly to torso/arms
  let heldProp: THREE.Group | null = null;
  if (cfg.prop && cfg.prop !== 'none') {
    heldProp = new THREE.Group();
    const pHex = cfg.propHex ?? 0x38bdf8;
    const pMat = tracker.mat(
      new THREE.MeshStandardMaterial({
        color: pHex,
        emissive: pHex,
        emissiveIntensity: cfg.prop === 'parcel' || cfg.prop === 'baton' ? 0.32 : 0.06,
        roughness: 0.35,
        metalness: 0.12,
      })
    );
    if (cfg.prop === 'parcel') {
      const box = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.32, 0.26, 0.28)), pMat);
      box.castShadow = true;
      heldProp.add(box);
      const tape = new THREE.Mesh(
        tracker.geo(new THREE.BoxGeometry(0.33, 0.06, 0.07)),
        tracker.mat(new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 }))
      );
      heldProp.add(tape);
      heldProp.position.set(0, 0.62, 0.34);
      bodyPivot.add(heldProp);
    } else if (cfg.prop === 'punchcard') {
      const card = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.24, 0.14, 0.02)), pMat);
      heldProp.add(card);
      heldProp.position.set(0, -0.34, 0.14);
      rightArmPivot.add(heldProp);
    } else if (cfg.prop === 'baton') {
      const stick = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 8)), pMat);
      stick.rotation.x = Math.PI * 0.4;
      heldProp.add(stick);
      heldProp.position.set(0, -0.36, 0.18);
      rightArmPivot.add(heldProp);
    } else if (cfg.prop === 'clipboard') {
      const board = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.2, 0.26, 0.03)), pMat);
      heldProp.add(board);
      heldProp.position.set(0, -0.32, 0.14);
      leftArmPivot.add(heldProp);
    } else if (cfg.prop === 'wrench') {
      const bar = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.06, 0.3, 0.04)), pMat);
      heldProp.add(bar);
      heldProp.position.set(0, -0.36, 0.1);
      rightArmPivot.add(heldProp);
    }
  }

  return {
    root,
    bodyPivot,
    headPivot,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    heldProp,
  };
}

/**
 * Zero-allocation procedural R6 animation state machine so Roblox characters
 * walk, type, carry data boxes, crank gears, work conveyors, and celebrate smoothly.
 */
export function animateRobloxActor(
  actor: BuiltRobloxActor,
  action: RobloxAction,
  elapsed: number,
  phase = 0
): void {
  const t = elapsed + phase;
  // Reset baseline smoothly
  actor.bodyPivot.position.y = 0;
  actor.bodyPivot.rotation.set(0, 0, 0);
  actor.headPivot.rotation.set(0, 0, 0);
  actor.leftArmPivot.rotation.set(0, 0, 0);
  actor.rightArmPivot.rotation.set(0, 0, 0);
  actor.leftLegPivot.rotation.set(0, 0, 0);
  actor.rightLegPivot.rotation.set(0, 0, 0);

  if (action === 'idle-wave') {
    actor.bodyPivot.position.y = Math.abs(Math.sin(t * 2.2)) * 0.03;
    actor.rightArmPivot.rotation.z = 2.4 + Math.sin(t * 6.5) * 0.32;
    actor.leftArmPivot.rotation.z = -0.15;
    actor.headPivot.rotation.y = Math.sin(t * 1.5) * 0.22;
  } else if (action === 'typing' || action === 'sit-use-pc') {
    actor.bodyPivot.position.y = action === 'sit-use-pc' ? -0.16 : 0;
    actor.leftLegPivot.rotation.x = action === 'sit-use-pc' ? -1.35 : 0;
    actor.rightLegPivot.rotation.x = action === 'sit-use-pc' ? -1.35 : 0;
    actor.leftArmPivot.rotation.x = -1.1 + Math.sin(t * 14) * 0.2;
    actor.rightArmPivot.rotation.x = -1.1 + Math.cos(t * 14) * 0.2;
    actor.headPivot.rotation.x = 0.12 + Math.sin(t * 3.2) * 0.05;
  } else if (action === 'walk-carry' || action === 'sprint-courier') {
    const speed = action === 'sprint-courier' ? 11.5 : 7.2;
    const swing = action === 'sprint-courier' ? 0.78 : 0.55;
    actor.bodyPivot.position.y = Math.abs(Math.sin(t * speed)) * 0.075;
    actor.bodyPivot.rotation.x = action === 'sprint-courier' ? 0.14 : 0.06;
    actor.leftLegPivot.rotation.x = Math.sin(t * speed) * swing;
    actor.rightLegPivot.rotation.x = -Math.sin(t * speed) * swing;
    actor.leftArmPivot.rotation.x = -1.15;
    actor.rightArmPivot.rotation.x = -1.15;
    actor.headPivot.rotation.y = Math.sin(t * 2.5) * 0.14;
  } else if (action === 'crank-gear') {
    actor.rightArmPivot.rotation.x = -1.0 + Math.sin(t * 6.2) * 0.55;
    actor.rightArmPivot.rotation.z = 0.25 + Math.cos(t * 6.2) * 0.22;
    actor.leftArmPivot.rotation.x = -0.6;
    actor.headPivot.rotation.x = 0.2;
    actor.bodyPivot.rotation.y = Math.sin(t * 3.1) * 0.08;
  } else if (action === 'abacus-slide') {
    actor.leftArmPivot.rotation.x = -1.05 + Math.sin(t * 5.2) * 0.25;
    actor.rightArmPivot.rotation.x = -1.05 + Math.cos(t * 5.2) * 0.25;
    actor.leftArmPivot.rotation.y = Math.sin(t * 4.5) * 0.24;
    actor.rightArmPivot.rotation.y = -Math.cos(t * 4.5) * 0.24;
    actor.headPivot.rotation.x = 0.18;
  } else if (action === 'factory-work') {
    const cyc = Math.sin(t * 5.4);
    actor.bodyPivot.position.y = Math.abs(cyc) * 0.04;
    actor.leftArmPivot.rotation.x = -0.95 + cyc * 0.45;
    actor.rightArmPivot.rotation.x = -0.95 - cyc * 0.45;
    actor.headPivot.rotation.y = cyc * 0.28;
  } else if (action === 'write-board') {
    actor.rightArmPivot.rotation.x = -1.65 + Math.sin(t * 7.5) * 0.24;
    actor.rightArmPivot.rotation.y = Math.cos(t * 4.2) * 0.35;
    actor.leftArmPivot.rotation.x = -0.5;
    actor.headPivot.rotation.x = -0.1;
  } else if (action === 'celebrate') {
    const jump = Math.abs(Math.sin(t * 5.8));
    actor.bodyPivot.position.y = jump * 0.24;
    actor.leftArmPivot.rotation.z = -2.55 - Math.sin(t * 11) * 0.22;
    actor.rightArmPivot.rotation.z = 2.55 + Math.sin(t * 11) * 0.22;
    actor.leftLegPivot.rotation.x = -jump * 0.32;
    actor.rightLegPivot.rotation.x = jump * 0.32;
  } else if (action === 'confused') {
    actor.rightArmPivot.rotation.z = 2.25;
    actor.rightArmPivot.rotation.x = -0.35 + Math.sin(t * 7) * 0.15;
    actor.headPivot.rotation.z = Math.sin(t * 2.2) * 0.2;
    actor.headPivot.rotation.y = Math.cos(t * 1.8) * 0.26;
  } else if (action === 'conduct-baton') {
    actor.rightArmPivot.rotation.x = -1.25 + Math.sin(t * 6.0) * 0.55;
    actor.rightArmPivot.rotation.z = 0.4 + Math.cos(t * 6.0) * 0.45;
    actor.leftArmPivot.rotation.x = -1.0 + Math.cos(t * 4.0) * 0.35;
    actor.bodyPivot.position.y = Math.abs(Math.sin(t * 3.0)) * 0.04;
  }
}
