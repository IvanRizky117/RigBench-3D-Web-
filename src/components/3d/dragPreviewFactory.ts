import * as THREE from 'three';
import type { AssemblyStepId } from '../../types/rigbench';

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
  dispose: () => void;
}

const TINT_HEX: Record<DragTintState, number> = {
  free: 0x06b6d4,
  valid: 0x10b981,
  invalid: 0xf43f5e,
};

/**
 * Builds floating 3D component preview meshes + compact magnetic snap halo
 * + 3D orientation/polarity indicator arrows for CPU, RAM 1/2, IDE Pin-1, & F_PANEL LEDs.
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
  const alumMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xd8e0eb, metalness: 0.88, roughness: 0.24 }));
  const goldMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.94, roughness: 0.18 }));
  const copperMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.88, roughness: 0.25 }));
  const darkMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55 }));
  const ivoryMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.55 }));
  const redMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.48 }));
  const yellowMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.45 }));
  const greyMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.65 }));
  const cyanMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.4 }));

  const meshesById = new Map<AssemblyStepId, THREE.Group>();
  const arrowsToPulse: THREE.Group[] = [];

  const register = (id: AssemblyStepId, build: (holder: THREE.Group) => void, haloScale = 1) => {
    const holder = new THREE.Group();
    holder.visible = false;
    holder.userData.haloScale = haloScale;
    build(holder);
    group.add(holder);
    meshesById.set(id, holder);
  };

  // CPU LGA 775 + Golden Pin-1 Corner Triangle + 3D Arrow
  register(
    'install-cpu',
    (h) => {
      const sub = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.48, 0.06, 1.48)), pcbGreen);
      const ihs = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.18, 0.1, 1.18)), alumMat);
      ihs.position.y = 0.07;
      const tri = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.2, 0.06, 3)), goldMat);
      tri.position.set(-0.56, 0.06, 0.56);
      const arrow = createOrientationArrow(-0.56, 0.2, 0.56, 1);
      arrow.userData.baseY = 0.2;
      arrowsToPulse.push(arrow);
      const ghost = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.62, 0.24, 1.62)), ghostMat);
      ghost.position.y = 0.06;
      h.add(sub, ihs, tri, arrow, ghost);
    },
    1.3
  );

  // Thermal Paste Syringe
  register(
    'apply-thermal-paste',
    (h) => {
      const barrel = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 1.1, 16)), ivoryMat);
      barrel.rotation.z = Math.PI / 5;
      barrel.position.y = 0.52;
      const tip = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.03, 0.09, 0.28, 12)), darkMat);
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
      const core = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.45, 0.45, 0.58, 18)), copperMat);
      core.position.y = 0.28;
      const fins = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.92, 0.92, 0.52, 20)), alumMat);
      fins.position.y = 0.28;
      const shroud = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.96, 0.96, 0.22, 22)), darkMat);
      shroud.position.y = 0.65;
      const ghost = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(1.06, 1.06, 0.85, 22)), ghostMat);
      ghost.position.y = 0.36;
      h.add(core, fins, shroud, ghost);
    },
    1.45
  );

  // Push-pin / Screw fallback preview (normally direct click on 3D fasteners)
  register(
    'lock-heatsink-pins',
    (h) => {
      const cap = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.15, 0.15, 0.14, 14)), ivoryMat);
      cap.position.y = 0.14;
      h.add(cap);
    },
    0.3
  );

  // Single-Stick RAM DDR2 Keping 1 & Keping 2 + Notch Arrow
  const buildRamStickPreview = (h: THREE.Group, spreaderTint: THREE.Material) => {
    const body = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.06, 0.56, 0.08)), pcbGreen);
    body.position.y = 0.3;
    const spreader = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.08, 0.12, 0.11)), spreaderTint);
    spreader.position.y = 0.55;
    const gLeft = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.62, 0.12, 0.095)), goldMat);
    gLeft.position.set(-1.22, 0.05, 0);
    const gRight = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.3, 0.12, 0.095)), goldMat);
    gRight.position.set(0.86, 0.05, 0);
    const notchMarker = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.16, 0.24, 0.15)), ivoryMat);
    notchMarker.position.set(-0.35, 0.06, 0);
    const arrow = createOrientationArrow(-0.35, 0.68, 0, 1);
    arrow.userData.baseY = 0.68;
    arrowsToPulse.push(arrow);
    const ghost = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.2, 0.68, 0.24)), ghostMat);
    ghost.position.y = 0.32;
    h.add(body, spreader, gLeft, gRight, notchMarker, arrow, ghost);
  };

  register('install-ram-1', (h) => buildRamStickPreview(h, alumMat), 2.0);
  register('install-ram-2', (h) => buildRamStickPreview(h, cyanMat), 2.0);

  // CMOS CR2032 Coin Battery
  register(
    'install-cmos',
    (h) => {
      const coin = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 24)), alumMat);
      coin.position.y = 0.06;
      const ghost = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.48, 0.48, 0.18, 24)), ghostMat);
      ghost.position.y = 0.06;
      h.add(coin, ghost);
    },
    0.72
  );

  // Collision-Free VGA Card PCIe x16
  register(
    'install-vga',
    (h) => {
      const pcb = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 0.9, 2.86)), pcbRed);
      pcb.position.y = 0.45;
      const shroud = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.22, 0.68, 2.25)), darkMat);
      shroud.position.set(0.13, 0.44, 0.08);
      const fan = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.28, 0.28, 0.07, 18)), alumMat);
      fan.rotation.z = Math.PI / 2;
      fan.position.set(0.245, 0.44, 0.18);
      const bracket = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.26, 1.04, 0.05)), alumMat);
      bracket.position.set(0.04, 0.46, -1.46);
      const ghost = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.4, 1.02, 2.98)), ghostMat);
      ghost.position.set(0.07, 0.46, 0);
      h.add(pcb, shroud, fan, bracket, ghost);
    },
    1.5
  );

  // VGA Bracket Thumbscrew
  register(
    'lock-vga-screw',
    (h) => {
      const screw = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 14)), alumMat);
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

  // IDE 40-Wire Ribbon Connector + Red Pin-1 Stripe + 3D Alignment Arrow ([R])
  register(
    'install-ide-cable',
    (h) => {
      const plug = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.66, 0.24, 0.26)), darkMat);
      plug.position.y = 0.12;
      const ribbon = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.58, 0.05, 0.85)), greyMat);
      ribbon.position.set(0, 0.28, 0.4);
      const redEdge = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.15, 0.07, 0.86)), redMat);
      redEdge.position.set(0.72, 0.28, 0.4);
      const arrow = createOrientationArrow(0.72, 0.42, 0.12, 0.85);
      arrow.userData.baseY = 0.42;
      arrowsToPulse.push(arrow);
      const ghost = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.8, 0.36, 0.44)), ghostMat);
      ghost.position.y = 0.16;
      h.add(plug, ribbon, redEdge, arrow, ghost);
    },
    0.95
  );

  // Authentic 4-Pin Molex Power Connector (White D-Shape Plug + Yellow 12V, Black, Black, Red 5V)
  register(
    'install-hdd-molex',
    (h) => {
      const plug = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.54, 0.24, 0.26)), ivoryMat);
      plug.position.y = 0.12;
      const bevelTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.42, 0.05, 0.24)), ivoryMat);
      bevelTop.position.y = 0.25;
      const wireCols = [yellowMat, darkMat, darkMat, redMat];
      wireCols.forEach((m, idx) => {
        const w = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.036, 0.036, 0.62, 8)), m);
        w.rotation.x = Math.PI / 2;
        w.position.set(-0.165 + idx * 0.11, 0.13, 0.42);
        h.add(w);
      });
      const ghost = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.64, 0.36, 0.42)), ghostMat);
      ghost.position.y = 0.15;
      h.add(plug, bevelTop, ghost);
    },
    0.45
  );

  // 5 Color-Coded C-Panel DuPont Wires (ultra-compact halo + Polarity Arrow on LED wires!)
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
        const strand1 = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.034, 0.034, 0.56, 8)), mat1);
        strand1.rotation.z = -0.45;
        strand1.position.set(0.16, 0.48, isPair ? -0.06 : 0);
        h.add(dupont, colorBand, strand1);
        if (mat2) {
          const strand2 = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 0.56, 8)), mat2);
          strand2.rotation.z = -0.45;
          strand2.position.set(0.2, 0.46, 0.07);
          h.add(strand2);
        }
        if (hasPolarity) {
          // Miniature polarity indicator arrow on the positive (+) pin side
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
      0.24
    );
  });

  // Split ATX 24-Pin Mainboard Power Harness
  register(
    'install-atx-24pin',
    (h) => {
      const plug = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.88, 0.36, 0.4)), ivoryMat);
      plug.position.y = 0.18;
      const cols = [0xf97316, 0xef4444, 0xeab308, 0x10b981, 0x111827, 0xa855f7];
      cols.forEach((c, idx) => {
        const w = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.048, 0.048, 0.62, 8)),
          trackMat(new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }))
        );
        w.position.set(-0.7 + idx * 0.28, 0.58, 0);
        h.add(w);
      });
      const ghost = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.02, 0.52, 0.56)), ghostMat);
      ghost.position.y = 0.22;
      h.add(plug, ghost);
    },
    1.25
  );

  // Split ATX 4-Pin 12V CPU Power Plug
  register(
    'install-atx-4pin',
    (h) => {
      const plug = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.42, 0.32, 0.42)), ivoryMat);
      plug.position.y = 0.16;
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
      const ghost = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.56, 0.46, 0.56)), ghostMat);
      ghost.position.y = 0.2;
      h.add(plug, ghost);
    },
    0.55
  );

  // Lever open/close fallback ghost
  (['open-cpu-lever', 'close-cpu-lever'] as const).forEach((id) => {
    register(
      id,
      (h) => {
        const bar = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.045, 0.045, 1.5, 10)), alumMat);
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

  const setActiveItem = (itemId: AssemblyStepId | null) => {
    if (activeId === itemId) return;
    activeId = itemId;
    meshesById.forEach((holder, key) => {
      const show = key === itemId;
      holder.visible = show;
      if (show) {
        const s = (holder.userData.haloScale as number) || 1;
        haloRing.scale.setScalar(s);
        currentAngle = holder.rotation.y;
      }
    });
    group.visible = itemId !== null && meshesById.has(itemId);
  };

  const setTint = (state: DragTintState) => {
    const hex = TINT_HEX[state];
    haloMat.color.setHex(hex);
    ghostMat.color.setHex(hex);
    ghostMat.emissive.setHex(hex);
    ghostMat.opacity = state === 'free' ? 0.2 : 0.4;
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
        const targetAngle = rotationQuarterTurns * (Math.PI / 2);
        currentAngle = THREE.MathUtils.damp(currentAngle, targetAngle, 14, delta);
        holder.rotation.y = currentAngle;
      }
    }
  };

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };

  return { group, setActiveItem, setTint, setTransform, dispose };
}
