import * as THREE from 'three';
import type { AssemblyStepId } from '../../types/rigbench';
import {
  buildNotchedCpuChip,
  buildNotchedRamStick,
  type GeometryTracker,
} from './hardwareHollowGeometry';

export type DragTintState = 'free' | 'valid' | 'invalid';

export interface DragPreviewSystem {
  group: THREE.Group;
  setActiveItem: (itemId: AssemblyStepId | null) => void;
  setTint: (state: DragTintState) => void;
  setTransform: (
    pos: THREE.Vector3,
    rotationQuarterTurns: number,
    delta: number,
    isAligned: boolean
  ) => void;
  triggerRejectBounce: (
    itemId: AssemblyStepId,
    worldPos: THREE.Vector3,
    rotationQuarterTurns: number
  ) => void;
  updateReject: (delta: number) => boolean;
  cancelReject: () => void;
  dispose: () => void;
}

type RotMode = 'none' | '4way-y' | '2way-y' | '2way-z';

const TINT_HEX: Record<DragTintState, number> = {
  free: 0x06b6d4,
  valid: 0x10b981,
  invalid: 0xf43f5e,
};

const REJECT_DURATION = 0.48;
const _rejectBasePos = new THREE.Vector3();

function dampAngle(current: number, target: number, lambda: number, delta: number): number {
  const diff = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + diff * (1 - Math.exp(-lambda * delta));
}

function resolveTargetAngle(mode: RotMode, quarterTurns: number): number {
  if (mode === '4way-y') {
    const norm = ((quarterTurns % 4) + 4) % 4;
    return norm * (Math.PI / 2);
  }
  if (mode === '2way-y' || mode === '2way-z') {
    return (Math.abs(quarterTurns) % 2) * Math.PI;
  }
  return 0;
}

/**
 * Builds floating 3D component preview meshes + compact magnetic snap halo
 * + 3D orientation/polarity indicator arrows + 3D physical rejection bounce animation
 * for CPU, RAM 1/2, IDE Pin-1, ATX 24/4-Pin clips, Molex D-bevel, & F_PANEL LEDs.
 */
export function createDragPreviewSystem(): DragPreviewSystem {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };
  const tracker: GeometryTracker = { geo: trackGeo, mat: trackMat };

  const group = new THREE.Group();
  group.visible = false;

  // Compact magnetic snap status ring underneath dragged 3D object
  const haloMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: TINT_HEX.free,
      transparent: true,
      opacity: 0.62,
      side: THREE.DoubleSide,
      depthTest: false,
    })
  );
  const haloRing = new THREE.Mesh(trackGeo(new THREE.RingGeometry(0.65, 0.82, 28)), haloMat);
  haloRing.rotation.x = -Math.PI / 2;
  haloRing.position.y = -0.12;
  haloRing.renderOrder = 15;
  group.add(haloRing);

  const ghostMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: TINT_HEX.free,
      emissive: TINT_HEX.free,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    })
  );

  // Shared 3D orientation/polarity arrow material (Amber misaligned -> Emerald aligned)
  const alignArrowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.4,
      roughness: 0.25,
    })
  );

  const createOrientationArrow = (x: number, y: number, z: number, scale = 1): THREE.Group => {
    const arrow = new THREE.Group();
    arrow.position.set(x, y, z);
    const tip = new THREE.Mesh(
      trackGeo(new THREE.ConeGeometry(0.13 * scale, 0.26 * scale, 12)),
      alignArrowMat
    );
    tip.rotation.x = Math.PI;
    tip.position.y = 0.13 * scale;
    const shaft = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.042 * scale, 0.042 * scale, 0.24 * scale, 10)),
      alignArrowMat
    );
    shaft.position.y = 0.34 * scale;
    arrow.add(tip, shaft);
    return arrow;
  };

  const pcbGreen = trackMat(new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.42 }));
  const pcbRed = trackMat(new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.42 }));
  const alumMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xd8e0eb, metalness: 0.88, roughness: 0.24 })
  );
  const goldMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.94, roughness: 0.18 })
  );
  const copperMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.88, roughness: 0.25 })
  );
  const darkMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55 }));
  const icBlackMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.46 }));
  const ivoryMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.55 }));
  const clipWhiteMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.42 }));
  const redMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.48 }));
  const yellowMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.45 }));
  const greyMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.65 }));
  const cyanMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.4 }));

  const meshesById = new Map<AssemblyStepId, THREE.Group>();
  const arrowsToPulse: THREE.Group[] = [];

  const register = (
    id: AssemblyStepId,
    build: (holder: THREE.Group) => void,
    haloScale = 1,
    rotMode: RotMode = 'none'
  ) => {
    const holder = new THREE.Group();
    holder.visible = false;
    holder.userData.haloScale = haloScale;
    holder.userData.rotMode = rotMode;
    build(holder);
    group.add(holder);
    meshesById.set(id, holder);
  };

  // CPU LGA 775 with real asymmetric side keying notches + Golden Pin-1 Corner Triangle + 3D Arrow
  register(
    'install-cpu',
    (h) => {
      const cpuMesh = buildNotchedCpuChip(tracker, {
        pcbMat: pcbGreen,
        ihsMat: alumMat,
        triMat: goldMat,
      });
      const arrow = createOrientationArrow(-0.58, 0.22, 0.58, 1);
      arrow.userData.baseY = 0.22;
      arrowsToPulse.push(arrow);
      const ghost = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.6, 0.22, 1.6)), ghostMat);
      ghost.position.y = 0.08;
      h.add(cpuMesh, arrow, ghost);
    },
    1.3,
    '4way-y'
  );

  // Thermal Paste Syringe
  register(
    'apply-thermal-paste',
    (h) => {
      const barrel = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 1.1, 16)),
        ivoryMat
      );
      barrel.rotation.z = Math.PI / 5;
      barrel.position.y = 0.52;
      const tip = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.03, 0.09, 0.28, 12)),
        darkMat
      );
      tip.rotation.z = Math.PI / 5;
      tip.position.set(-0.32, 0.12, 0);
      const dab = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.14, 14, 14)), greyMat);
      dab.position.set(-0.38, -0.02, 0);
      h.add(barrel, tip, dab);
    },
    0.85
  );

  // Heatsink & Fan CPU
  register(
    'install-heatsink',
    (h) => {
      const core = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.45, 0.45, 0.58, 18)),
        copperMat
      );
      core.position.y = 0.28;
      const fins = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.92, 0.92, 0.52, 20)),
        alumMat
      );
      fins.position.y = 0.28;
      const shroud = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.96, 0.96, 0.22, 22)),
        darkMat
      );
      shroud.position.y = 0.65;
      const ghost = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(1.06, 1.06, 0.85, 22)),
        ghostMat
      );
      ghost.position.y = 0.36;
      h.add(core, fins, shroud, ghost);
    },
    1.45
  );

  // Push-pin / Screw fallback preview (normally direct click on 3D fasteners)
  register(
    'lock-heatsink-pins',
    (h) => {
      const cap = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.15, 0.15, 0.14, 14)),
        ivoryMat
      );
      cap.position.y = 0.14;
      h.add(cap);
    },
    0.3
  );

  // Physically Notched RAM DDR2 Keping 1 & Keping 2 (true open U-cutout at x = -0.35!) + Notch Arrow
  const buildRamStickPreview = (h: THREE.Group, spreaderTint: THREE.Material) => {
    const stick = buildNotchedRamStick(tracker, {
      length: 4.04,
      height: 0.62,
      notchX: -0.35,
      pcbMat: pcbGreen,
      spreaderMat: spreaderTint,
      goldMat,
      icMat: icBlackMat,
    });
    const arrow = createOrientationArrow(-0.35, 0.68, 0, 1);
    arrow.userData.baseY = 0.68;
    arrowsToPulse.push(arrow);
    const ghost = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.18, 0.66, 0.22)), ghostMat);
    ghost.position.y = 0.34;
    h.add(stick, arrow, ghost);
  };

  register('install-ram-1', (h) => buildRamStickPreview(h, alumMat), 2.0, '4way-y');
  register('install-ram-2', (h) => buildRamStickPreview(h, cyanMat), 2.0, '4way-y');

  // CMOS CR2032 Coin Battery
  register(
    'install-cmos',
    (h) => {
      const coin = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 24)),
        alumMat
      );
      coin.position.y = 0.06;
      const ghost = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.48, 0.48, 0.18, 24)),
        ghostMat
      );
      ghost.position.y = 0.06;
      h.add(coin, ghost);
    },
    0.72
  );

  // Collision-Free VGA Card PCIe x16 with split gold edge fingers & real notch cutout at z = -0.76
  register(
    'install-vga',
    (h) => {
      const pcb = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 0.88, 2.86)), pcbRed);
      pcb.position.y = 0.54;
      // Split PCIe x16 gold edge fingers matching hollow PCIe x16 slot divider at z = -0.76
      const goldFront = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.07, 0.14, 0.48)), goldMat);
      goldFront.position.set(0, 0.07, -1.09);
      const goldRear = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.07, 0.14, 1.94)), goldMat);
      goldRear.position.set(0, 0.07, 0.32);

      const shroud = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.22, 0.68, 2.25)), darkMat);
      shroud.position.set(0.13, 0.54, 0.08);
      const fan = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.28, 0.28, 0.07, 18)),
        alumMat
      );
      fan.rotation.z = Math.PI / 2;
      fan.position.set(0.245, 0.54, 0.18);
      const bracket = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.26, 1.04, 0.05)), alumMat);
      bracket.position.set(0.04, 0.55, -1.46);
      const ghost = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.4, 1.02, 2.98)), ghostMat);
      ghost.position.set(0.07, 0.55, 0);
      h.add(pcb, goldFront, goldRear, shroud, fan, bracket, ghost);
    },
    1.5
  );

  // VGA Bracket Thumbscrew
  register(
    'lock-vga-screw',
    (h) => {
      const screw = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 14)),
        alumMat
      );
      screw.position.y = 0.12;
      h.add(screw);
    },
    0.26
  );

  // 1 High-Contrast Tiny 2-Pin Plastic HDD Jumper Shunt Cap (Yellow/Black, NOT a cable!)
  register(
    'install-hdd-jumper',
    (h) => {
      const cap = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.115, 0.23, 0.16)), yellowMat);
      cap.position.y = 0.12;
      const grip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.125, 0.055, 0.18)), darkMat);
      grip.position.y = 0.255;
      const ghost = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.28, 0.22)), ghostMat);
      ghost.position.y = 0.15;
      h.add(cap, grip, ghost);
    },
    0.22
  );

  // 3.5" IDE Harddisk Unit
  register(
    'install-hdd-unit',
    (h) => {
      const chassis = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.5, 0.42, 1.65)), darkMat);
      chassis.position.y = 0.21;
      const plate = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.18, 0.04, 1.32)), alumMat);
      plate.position.y = 0.43;
      const molex = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.46, 0.18, 0.12)), ivoryMat);
      molex.position.set(0.9, 0.2, -0.84);
      const ghost = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.68, 0.56, 1.82)), ghostMat);
      ghost.position.y = 0.24;
      h.add(chassis, plate, molex, ghost);
    },
    1.55
  );

  // IDE 40-Wire Ribbon Connector + Front Central Key Bump + Red Pin-1 Stripe + 3D Alignment Arrow ([R])
  register(
    'install-ide-cable',
    (h) => {
      const plug = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.66, 0.24, 0.26)), darkMat);
      plug.position.y = 0.12;
      // Physical central keying lug on front (+Z) face matching the hollow IDE shroud cutout
      const keyBump = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.21, 0.06)), clipWhiteMat);
      keyBump.position.set(0, 0.12, 0.145);
      const ribbon = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.58, 0.05, 0.85)), greyMat);
      ribbon.position.set(0, 0.28, 0.4);
      const redEdge = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.15, 0.07, 0.86)), redMat);
      redEdge.position.set(0.72, 0.28, 0.4);
      const arrow = createOrientationArrow(0.72, 0.42, 0.12, 0.85);
      arrow.userData.baseY = 0.42;
      arrowsToPulse.push(arrow);
      const ghost = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.8, 0.36, 0.44)), ghostMat);
      ghost.position.y = 0.16;
      h.add(plug, keyBump, ribbon, redEdge, arrow, ghost);
    },
    0.95,
    '2way-y'
  );

  // Authentic 4-Pin Molex Power Connector (Centered Z-flip pivot + Top Trapezoidal D-Bevel + Yellow/Black/Black/Red + Arrow)
  register(
    'install-hdd-molex',
    (h) => {
      const pivot = new THREE.Group();
      pivot.position.y = 0.18;
      h.userData.flipPivot = pivot;

      // Extruded D-shape chamfered Molex plug silhouette (beveled top corners!)
      const dShape = new THREE.Shape();
      dShape.moveTo(-0.27, -0.12);
      dShape.lineTo(0.27, -0.12);
      dShape.lineTo(0.27, 0.05);
      dShape.lineTo(0.19, 0.13);
      dShape.lineTo(-0.19, 0.13);
      dShape.lineTo(-0.27, 0.05);
      dShape.closePath();
      const plugGeo = trackGeo(new THREE.ExtrudeGeometry(dShape, { depth: 0.28, bevelEnabled: false }));
      plugGeo.translate(0, 0, -0.14);
      const plug = new THREE.Mesh(plugGeo, ivoryMat);
      pivot.add(plug);

      // High-contrast top ridge highlighting the beveled D-Shape side
      const bevelRidge = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.36, 0.03, 0.26)), clipWhiteMat);
      bevelRidge.position.y = 0.14;
      pivot.add(bevelRidge);

      const wireCols = [yellowMat, darkMat, darkMat, redMat];
      wireCols.forEach((m, idx) => {
        const w = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.036, 0.036, 0.6, 8)), m);
        w.rotation.x = Math.PI / 2;
        w.position.set(-0.165 + idx * 0.11, 0, 0.4);
        pivot.add(w);
      });

      const arrow = createOrientationArrow(0, 0.22, 0, 0.72);
      arrow.userData.baseY = 0.22;
      arrowsToPulse.push(arrow);
      pivot.add(arrow);

      const ghost = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.64, 0.34, 0.42)), ghostMat);
      pivot.add(ghost);

      h.add(pivot);
    },
    0.45,
    '2way-z'
  );

  // 5 Color-Coded C-Panel DuPont Wires (ultra-compact halo + 2-way Polarity Arrow on LED wires!)
  const wireSpecs: Array<{
    id: AssemblyStepId;
    col1: number;
    col2?: number;
    hasPolarity?: boolean;
  }> = [
    { id: 'wire-hdd-led', col1: 0xef4444, col2: 0xf8fafc, hasPolarity: true },
    { id: 'wire-pled-pos', col1: 0x22c55e, hasPolarity: true },
    { id: 'wire-pled-neg', col1: 0xf8fafc, hasPolarity: true },
    { id: 'wire-reset-sw', col1: 0x2563eb, col2: 0xf8fafc },
    { id: 'wire-power-sw', col1: 0xf97316, col2: 0xf8fafc },
  ];
  wireSpecs.forEach(({ id, col1, col2, hasPolarity }) => {
    const mat1 = trackMat(new THREE.MeshStandardMaterial({ color: col1, roughness: 0.42 }));
    const mat2 = col2 ? trackMat(new THREE.MeshStandardMaterial({ color: col2, roughness: 0.45 })) : null;
    register(
      id,
      (h) => {
        const isPair = Boolean(mat2);
        const dupont = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.18, 0.32, isPair ? 0.34 : 0.16)),
          darkMat
        );
        dupont.position.y = 0.16;
        const colorBand = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.19, 0.06, isPair ? 0.3 : 0.14)),
          mat1
        );
        colorBand.position.y = 0.29;
        const strand1 = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.034, 0.034, 0.56, 8)),
          mat1
        );
        strand1.rotation.z = -0.45;
        strand1.position.set(0.16, 0.48, isPair ? -0.06 : 0);
        h.add(dupont, colorBand, strand1);
        if (mat2) {
          const strand2 = new THREE.Mesh(
            trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 0.56, 8)),
            mat2
          );
          strand2.rotation.z = -0.45;
          strand2.position.set(0.2, 0.46, 0.07);
          h.add(strand2);
        }
        if (hasPolarity) {
          const polArrow = createOrientationArrow(0, 0.38, isPair ? -0.1 : -0.04, 0.52);
          polArrow.userData.baseY = 0.38;
          arrowsToPulse.push(polArrow);
          h.add(polArrow);
        }
        const ghost = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.24, 0.38, isPair ? 0.4 : 0.22)),
          ghostMat
        );
        ghost.position.y = 0.18;
        h.add(ghost);
      },
      0.24,
      hasPolarity ? '2way-y' : 'none'
    );
  });

  // Split ATX 24-Pin Mainboard Power Harness + Prominent Front (+Z) Locking Clip + Clip Arrow ([R])
  register(
    'install-atx-24pin',
    (h) => {
      const plug = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.88, 0.36, 0.4)), ivoryMat);
      plug.position.y = 0.18;
      // Front side retention clip matching the socket latch hook on +Z
      const clipBody = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.3, 0.08)), clipWhiteMat);
      clipBody.position.set(0, 0.22, 0.235);
      const clipHook = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.26, 0.06, 0.06)), darkMat);
      clipHook.position.set(0, 0.08, 0.26);
      const cols = [0xf97316, 0xef4444, 0xeab308, 0x10b981, 0x111827, 0xa855f7];
      cols.forEach((c, idx) => {
        const w = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.048, 0.048, 0.62, 8)),
          trackMat(new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }))
        );
        w.position.set(-0.7 + idx * 0.28, 0.58, 0);
        h.add(w);
      });
      const arrow = createOrientationArrow(0, 0.42, 0.26, 0.85);
      arrow.userData.baseY = 0.42;
      arrowsToPulse.push(arrow);
      const ghost = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.02, 0.52, 0.56)), ghostMat);
      ghost.position.y = 0.22;
      h.add(plug, clipBody, clipHook, arrow, ghost);
    },
    1.25,
    '2way-y'
  );

  // Split ATX 4-Pin 12V CPU Power Plug + Prominent Front (+Z) Locking Clip + Clip Arrow ([R])
  register(
    'install-atx-4pin',
    (h) => {
      const plug = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.42, 0.32, 0.42)), ivoryMat);
      plug.position.y = 0.16;
      const clipBody = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.2, 0.28, 0.08)), clipWhiteMat);
      clipBody.position.set(0, 0.19, 0.24);
      const clipHook = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.16, 0.055, 0.055)), darkMat);
      clipHook.position.set(0, 0.065, 0.265);
      [
        [-0.09, -0.09, yellowMat],
        [0.09, -0.09, yellowMat],
        [-0.09, 0.09, darkMat],
        [0.09, 0.09, darkMat],
      ].forEach(([wx, wz, mat]) => {
        const w = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 0.52, 8)),
          mat as THREE.Material
        );
        w.position.set(wx as number, 0.52, wz as number);
        h.add(w);
      });
      const arrow = createOrientationArrow(0, 0.4, 0.25, 0.68);
      arrow.userData.baseY = 0.4;
      arrowsToPulse.push(arrow);
      const ghost = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.56, 0.46, 0.56)), ghostMat);
      ghost.position.y = 0.2;
      h.add(plug, clipBody, clipHook, arrow, ghost);
    },
    0.55,
    '2way-y'
  );

  // Lever open/close fallback ghost
  (['open-cpu-lever', 'close-cpu-lever'] as const).forEach((id) => {
    register(
      id,
      (h) => {
        const bar = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.045, 0.045, 1.5, 10)),
          alumMat
        );
        bar.rotation.x = Math.PI / 2;
        bar.position.y = 0.2;
        const ghost = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.4, 0.4, 1.6)), ghostMat);
        ghost.position.y = 0.2;
        h.add(bar, ghost);
      },
      1.0
    );
  });

  let activeId: AssemblyStepId | null = null;
  let currentAngle = 0;
  let pulsePhase = 0;
  let rejectTimer = 0;

  const applyHolderRotation = (holder: THREE.Group, angle: number) => {
    const mode = (holder.userData.rotMode as RotMode) || 'none';
    if (mode === '2way-z') {
      const pivot = holder.userData.flipPivot as THREE.Group | undefined;
      holder.rotation.y = 0;
      if (pivot) pivot.rotation.z = angle;
    } else {
      holder.rotation.y = angle;
    }
  };

  const readHolderRotation = (holder: THREE.Group): number => {
    const mode = (holder.userData.rotMode as RotMode) || 'none';
    if (mode === '2way-z') {
      const pivot = holder.userData.flipPivot as THREE.Group | undefined;
      return pivot ? pivot.rotation.z : 0;
    }
    return holder.rotation.y;
  };

  const showItemInternal = (itemId: AssemblyStepId | null) => {
    if (activeId === itemId) return;
    activeId = itemId;
    meshesById.forEach((holder, key) => {
      const show = key === itemId;
      holder.visible = show;
      if (show) {
        const s = (holder.userData.haloScale as number) || 1;
        haloRing.scale.setScalar(s);
        currentAngle = readHolderRotation(holder);
      }
    });
    group.visible = itemId !== null && meshesById.has(itemId);
  };

  const setActiveItem = (itemId: AssemblyStepId | null) => {
    if (itemId !== null) {
      rejectTimer = 0;
      haloMat.opacity = 0.62;
    }
    showItemInternal(itemId);
  };

  const setTint = (state: DragTintState) => {
    const hex = TINT_HEX[state];
    haloMat.color.setHex(hex);
    ghostMat.color.setHex(hex);
    ghostMat.emissive.setHex(hex);
    ghostMat.opacity = state === 'free' ? 0.2 : 0.42;
  };

  const setTransform = (
    pos: THREE.Vector3,
    rotationQuarterTurns: number,
    delta: number,
    isAligned: boolean
  ) => {
    group.position.copy(pos);
    pulsePhase += delta * 6.5;
    alignArrowMat.color.setHex(isAligned ? 0x10b981 : 0xfacc15);
    alignArrowMat.emissive.setHex(isAligned ? 0x10b981 : 0xf59e0b);

    const bob = Math.sin(pulsePhase) * 0.05;
    for (const arr of arrowsToPulse) {
      arr.position.y = ((arr.userData.baseY as number) || 0.2) + bob;
    }

    if (activeId) {
      const holder = meshesById.get(activeId);
      if (holder) {
        const mode = (holder.userData.rotMode as RotMode) || 'none';
        const targetAngle = resolveTargetAngle(mode, rotationQuarterTurns);
        currentAngle = dampAngle(currentAngle, targetAngle, 14, delta);
        applyHolderRotation(holder, currentAngle);
      }
    }
  };

  const triggerRejectBounce = (
    itemId: AssemblyStepId,
    worldPos: THREE.Vector3,
    rotationQuarterTurns: number
  ) => {
    if (!meshesById.has(itemId)) return;
    showItemInternal(itemId);
    setTint('invalid');
    alignArrowMat.color.setHex(0xf43f5e);
    alignArrowMat.emissive.setHex(0xf43f5e);
    const holder = meshesById.get(itemId);
    if (holder) {
      const mode = (holder.userData.rotMode as RotMode) || 'none';
      const angle = resolveTargetAngle(mode, rotationQuarterTurns);
      currentAngle = angle;
      applyHolderRotation(holder, angle);
    }
    _rejectBasePos.copy(worldPos);
    rejectTimer = 0.0001;
    group.visible = true;
    group.position.set(_rejectBasePos.x, _rejectBasePos.y + 0.26, _rejectBasePos.z);
  };

  const updateReject = (delta: number): boolean => {
    if (rejectTimer <= 0) return false;
    rejectTimer += delta;
    if (rejectTimer >= REJECT_DURATION) {
      rejectTimer = 0;
      haloMat.opacity = 0.62;
      showItemInternal(null);
      return false;
    }

    const t = rejectTimer;
    if (t < 0.11) {
      // Phase 1: Drops swiftly and hits the physical notch/key ridge ("mentok")
      const p = t / 0.11;
      const eased = p * p;
      group.position.set(
        _rejectBasePos.x,
        _rejectBasePos.y + THREE.MathUtils.lerp(0.26, 0.04, eased),
        _rejectBasePos.z
      );
      haloMat.opacity = 0.72;
      ghostMat.opacity = 0.46;
    } else if (t < 0.30) {
      // Phase 2: Blocked on ridge — crimson glow + rapid horizontal micro-shake
      const shakeT = t - 0.11;
      const decay = 1 - shakeT / 0.19;
      const sx = Math.sin(shakeT * 64) * 0.095 * (0.45 + 0.55 * decay);
      const sz = Math.cos(shakeT * 52) * 0.028 * decay;
      group.position.set(_rejectBasePos.x + sx, _rejectBasePos.y + 0.04, _rejectBasePos.z + sz);
      haloMat.opacity = 0.84;
      ghostMat.opacity = 0.54;
    } else {
      // Phase 3: Springs back upward & vanishes cleanly
      const p = (t - 0.30) / (REJECT_DURATION - 0.30);
      const easeOut = 1 - Math.pow(1 - p, 3);
      group.position.set(
        _rejectBasePos.x,
        _rejectBasePos.y + THREE.MathUtils.lerp(0.04, 0.64, easeOut),
        _rejectBasePos.z
      );
      const fade = 1 - p;
      haloMat.opacity = 0.75 * fade;
      ghostMat.opacity = 0.45 * fade;
    }

    return true;
  };

  const cancelReject = () => {
    if (rejectTimer > 0) {
      rejectTimer = 0;
      haloMat.opacity = 0.62;
      showItemInternal(null);
    }
  };

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };

  return {
    group,
    setActiveItem,
    setTint,
    setTransform,
    triggerRejectBounce,
    updateReject,
    cancelReject,
    dispose,
  };
}
