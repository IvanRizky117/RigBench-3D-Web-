import * as THREE from 'three';
import {
  createBrushedMetalTexture,
  createCmosCoinTexture,
  createMacroLga775GoldTexture,
  createStudioFloorTexture,
  createStudioPcbTextures,
} from './studioMotherboardTextures';

export interface BuiltStudioMotherboard {
  rootGroup: THREE.Group;
  componentGroups: Record<string, THREE.Object3D>;
  update: (
    elapsed: number,
    dt: number,
    activeHighlightId: string | undefined,
    mechAction: string | undefined,
    domainColor: string,
    isPlaying: boolean,
    reducedMotion: boolean
  ) => void;
  dispose: () => void;
}

class StudioTracker {
  private readonly geos: THREE.BufferGeometry[] = [];
  private readonly mats: THREE.Material[] = [];
  private readonly texs: THREE.Texture[] = [];
  private readonly extraDisposers: Array<() => void> = [];

  geo<T extends THREE.BufferGeometry>(g: T): T {
    this.geos.push(g);
    return g;
  }

  mat<T extends THREE.Material>(m: T): T {
    this.mats.push(m);
    return m;
  }

  tex<T extends THREE.Texture>(t: T): T {
    this.texs.push(t);
    return t;
  }

  onDispose(fn: () => void): void {
    this.extraDisposers.push(fn);
  }

  disposeAll(): void {
    this.extraDisposers.forEach((fn) => fn());
    this.geos.forEach((g) => g.dispose());
    this.mats.forEach((m) => m.dispose());
    this.texs.forEach((t) => t.dispose());
    this.extraDisposers.length = 0;
    this.geos.length = 0;
    this.mats.length = 0;
    this.texs.length = 0;
  }
}

const _dummy = new THREE.Object3D();
const _activeColor = new THREE.Color();
const _zeroColor = new THREE.Color(0x000000);

/**
 * Helper: Builds a true 3D hollow expansion slot (left wall, right wall, end caps,
 * deep dark recessed cavity floor, physical notch divider, internal gold contact pins, and latch).
 */
function buildHollowCardSlot(
  t: StudioTracker,
  opts: {
    length: number;
    width: number;
    height: number;
    wallThickness: number;
    notchFrac: number; // 0..1 along length
    bodyMat: THREE.Material;
    cavityMat: THREE.Material;
    goldMat: THREE.Material;
    latchMat?: THREE.Material;
    dualLatch?: boolean;
    rearTab?: boolean;
    pinCount: number;
    rotateY?: number;
  }
): THREE.Group {
  const g = new THREE.Group();
  const { length, width, height, wallThickness, notchFrac, bodyMat, cavityMat, goldMat } = opts;

  const innerW = Math.max(0.05, width - wallThickness * 2);

  // Deep dark recessed cavity floor (creates crisp dark interior depth)
  const floor = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(length - wallThickness * 1.4, 0.03, innerW)),
    cavityMat
  );
  floor.position.y = 0.016;
  g.add(floor);

  // Front & back hard matte side walls
  const sideGeo = t.geo(new THREE.BoxGeometry(length, height, wallThickness));
  const frontWall = new THREE.Mesh(sideGeo, bodyMat);
  frontWall.position.set(0, height / 2, (innerW + wallThickness) / 2);
  frontWall.castShadow = true;
  frontWall.receiveShadow = true;
  g.add(frontWall);

  const backWall = new THREE.Mesh(sideGeo, bodyMat);
  backWall.position.set(0, height / 2, -(innerW + wallThickness) / 2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  g.add(backWall);

  // Left & right end caps
  const capGeo = t.geo(new THREE.BoxGeometry(wallThickness * 1.5, height, width));
  const leftCap = new THREE.Mesh(capGeo, bodyMat);
  leftCap.position.set(-length / 2 + wallThickness * 0.75, height / 2, 0);
  g.add(leftCap);

  const rightCap = new THREE.Mesh(capGeo, bodyMat);
  rightCap.position.set(length / 2 - wallThickness * 0.75, height / 2, 0);
  g.add(rightCap);

  // Physical notch alignment divider inside the hollow trough
  const notchX = -length / 2 + length * notchFrac;
  const divider = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(0.085, height * 0.88, innerW + 0.01)),
    bodyMat
  );
  divider.position.set(notchX, height * 0.44, 0);
  g.add(divider);

  // Instanced gleaming gold internal contact fingers along both inner walls
  const pinGeo = t.geo(new THREE.BoxGeometry(0.022, height * 0.62, 0.016));
  const totalPins = opts.pinCount * 2;
  const inst = new THREE.InstancedMesh(pinGeo, goldMat, totalPins);
  let idx = 0;
  const usable = length - wallThickness * 4;
  for (let i = 0; i < opts.pinCount; i++) {
    const px = -usable / 2 + (i / Math.max(1, opts.pinCount - 1)) * usable;
    if (Math.abs(px - notchX) < 0.075) continue;
    for (const side of [-1, 1]) {
      _dummy.position.set(px, height * 0.42, side * (innerW * 0.36));
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();
      inst.setMatrixAt(idx++, _dummy.matrix);
    }
  }
  inst.count = idx;
  inst.instanceMatrix.needsUpdate = true;
  g.add(inst);

  // End latches (for RAM DIMM) or rear retention tab (for PCIe x16 / AGP)
  if (opts.dualLatch && opts.latchMat) {
    const towerGeo = t.geo(new THREE.BoxGeometry(0.11, height + 0.14, width + 0.04));
    for (const side of [-1, 1]) {
      const latch = new THREE.Mesh(towerGeo, opts.latchMat);
      latch.position.set(side * (length / 2 + 0.05), (height + 0.14) / 2, 0);
      latch.rotation.z = side * -0.14;
      latch.castShadow = true;
      g.add(latch);
    }
  }
  if (opts.rearTab && opts.latchMat) {
    const tab = new THREE.Mesh(
      t.geo(new THREE.BoxGeometry(0.24, height * 0.95, 0.08)),
      opts.latchMat
    );
    tab.position.set(length / 2 + 0.12, height * 0.56, 0.04);
    tab.rotation.y = 0.22;
    g.add(tab);
  }

  if (opts.rotateY) g.rotation.y = opts.rotateY;
  return g;
}

/**
 * Helper: Builds a true hollow shrouded header (IDE 40-pin / Floppy 34-pin)
 * with 4 hard plastic walls, top key notch cutout, dark recessed floor, and 2 rows of standing brass pins.
 */
function buildHollowShroudedHeader(
  t: StudioTracker,
  opts: {
    cols: number; // 20 for IDE (40-pin), 17 for Floppy (34-pin)
    length: number;
    width: number;
    height: number;
    shroudMat: THREE.Material;
    cavityMat: THREE.Material;
    brassMat: THREE.Material;
  }
): THREE.Group {
  const g = new THREE.Group();
  const { cols, length, width, height, shroudMat, cavityMat, brassMat } = opts;
  const wall = 0.048;
  const innerW = width - wall * 2;
  const innerL = length - wall * 2;

  // Dark inner base
  const floor = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(innerL, 0.03, innerW)),
    cavityMat
  );
  floor.position.y = 0.015;
  g.add(floor);

  // Back continuous wall
  const backWall = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(length, height, wall)),
    shroudMat
  );
  backWall.position.set(0, height / 2, -(innerW + wall) / 2);
  backWall.castShadow = true;
  g.add(backWall);

  // Front wall split in two to create authentic central key notch cutout!
  const notchGap = 0.22;
  const halfFrontL = (length - notchGap) / 2;
  const frontHalfGeo = t.geo(new THREE.BoxGeometry(halfFrontL, height, wall));
  const fLeft = new THREE.Mesh(frontHalfGeo, shroudMat);
  fLeft.position.set(-(notchGap + halfFrontL) / 2, height / 2, (innerW + wall) / 2);
  fLeft.castShadow = true;
  g.add(fLeft);

  const fRight = new THREE.Mesh(frontHalfGeo, shroudMat);
  fRight.position.set((notchGap + halfFrontL) / 2, height / 2, (innerW + wall) / 2);
  fRight.castShadow = true;
  g.add(fRight);

  // Left & right end walls
  const endGeo = t.geo(new THREE.BoxGeometry(wall, height, width));
  for (const side of [-1, 1]) {
    const endW = new THREE.Mesh(endGeo, shroudMat);
    endW.position.set(side * (length / 2 - wall / 2), height / 2, 0);
    g.add(endW);
  }

  // Instanced standing brass pins (2 rows x cols)
  const pinGeo = t.geo(new THREE.BoxGeometry(0.022, height * 0.8, 0.022));
  const pinInst = new THREE.InstancedMesh(pinGeo, brassMat, cols * 2);
  let idx = 0;
  const span = innerL - 0.14;
  for (let c = 0; c < cols; c++) {
    const px = -span / 2 + (c / Math.max(1, cols - 1)) * span;
    for (const r of [-1, 1]) {
      // Pin 20 missing key pin on authentic 40-pin IDE!
      if (cols === 20 && c === 9 && r === 1) continue;
      _dummy.position.set(px, height * 0.44, r * (innerW * 0.24));
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();
      pinInst.setMatrixAt(idx++, _dummy.matrix);
    }
  }
  pinInst.count = idx;
  pinInst.instanceMatrix.needsUpdate = true;
  g.add(pinInst);

  return g;
}

/**
 * Helper: Builds an authentic ATX 24-pin (or 4-pin) connector with individual walled square hollow cells
 * and recessed metallic terminal sleeves inside every single hole.
 */
function buildHollowAtxConnector(
  t: StudioTracker,
  cols: number, // 12 for 24-pin, 2 for 4-pin
  rows: number, // 2
  shellMat: THREE.Material,
  cavityMat: THREE.Material,
  metalMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  const cell = 0.135;
  const wall = 0.026;
  const height = 0.36;
  const totalL = cols * cell + wall;
  const totalW = rows * cell + wall;

  // Deep dark recessed base inside all holes
  const darkCore = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(totalL - wall * 1.4, 0.05, totalW - wall * 1.4)),
    cavityMat
  );
  darkCore.position.y = 0.04;
  g.add(darkCore);

  // Outer perimeter walls (4 pieces)
  const longWallGeo = t.geo(new THREE.BoxGeometry(totalL, height, wall));
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(longWallGeo, shellMat);
    w.position.set(0, height / 2, s * (totalW / 2 - wall / 2));
    w.castShadow = true;
    g.add(w);
  }
  const shortWallGeo = t.geo(new THREE.BoxGeometry(wall, height, totalW));
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(shortWallGeo, shellMat);
    w.position.set(s * (totalL / 2 - wall / 2), height / 2, 0);
    g.add(w);
  }

  // Center longitudinal divider wall separating Row 1 & Row 2
  const midWall = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(totalL - wall, height * 0.96, wall)),
    shellMat
  );
  midWall.position.y = height * 0.48;
  g.add(midWall);

  // Vertical cell dividers creating true 2x12 individual square hollow sockets!
  const divGeo = t.geo(new THREE.BoxGeometry(wall, height * 0.96, totalW - wall));
  const divInst = new THREE.InstancedMesh(divGeo, shellMat, Math.max(1, cols - 1));
  for (let c = 1; c < cols; c++) {
    const dx = -totalL / 2 + wall / 2 + c * cell;
    _dummy.position.set(dx, height * 0.48, 0);
    _dummy.rotation.set(0, 0, 0);
    _dummy.scale.set(1, 1, 1);
    _dummy.updateMatrix();
    divInst.setMatrixAt(c - 1, _dummy.matrix);
  }
  divInst.instanceMatrix.needsUpdate = true;
  if (cols > 1) g.add(divInst);

  // Instanced gleaming brass/tin terminal pins seated deep inside each of the 24 holes
  const pinGeo = t.geo(new THREE.BoxGeometry(0.036, height * 0.65, 0.036));
  const pinInst = new THREE.InstancedMesh(pinGeo, metalMat, cols * rows);
  let idx = 0;
  for (let c = 0; c < cols; c++) {
    const px = -totalL / 2 + wall / 2 + (c + 0.5) * cell;
    for (let r = 0; r < rows; r++) {
      const pz = -totalW / 2 + wall / 2 + (r + 0.5) * cell;
      _dummy.position.set(px, height * 0.36, pz);
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();
      pinInst.setMatrixAt(idx++, _dummy.matrix);
    }
  }
  pinInst.instanceMatrix.needsUpdate = true;
  g.add(pinInst);

  // Side locking catch tab
  const clip = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(0.28, 0.12, 0.05)),
    shellMat
  );
  clip.position.set(0, height * 0.72, totalW / 2 + 0.025);
  g.add(clip);

  return g;
}

/**
 * Helper: Builds an authentic L-shaped hollow SATA port with gold contacts.
 */
function buildHollowSataPort(
  t: StudioTracker,
  shellMat: THREE.Material,
  cavityMat: THREE.Material,
  goldMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  const l = 0.52;
  const w = 0.22;
  const h = 0.24;
  const wall = 0.035;

  const floor = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(l - wall * 2, 0.025, w - wall * 2)),
    cavityMat
  );
  floor.position.y = 0.015;
  g.add(floor);

  const longWall = t.geo(new THREE.BoxGeometry(l, h, wall));
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(longWall, shellMat);
    m.position.set(0, h / 2, s * (w / 2 - wall / 2));
    m.castShadow = true;
    g.add(m);
  }
  const shortWall = t.geo(new THREE.BoxGeometry(wall, h, w));
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(shortWall, shellMat);
    m.position.set(s * (l / 2 - wall / 2), h / 2, 0);
    g.add(m);
  }

  // L-shaped internal contact tongue
  const tongueMain = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(l * 0.66, h * 0.72, 0.032)),
    shellMat
  );
  tongueMain.position.set(-0.02, h * 0.38, -0.01);
  g.add(tongueMain);

  const tongueFoot = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(0.035, h * 0.72, 0.085)),
    shellMat
  );
  tongueFoot.position.set(l * 0.31, h * 0.38, 0.022);
  g.add(tongueFoot);

  // 7 gleaming gold contact strips along the L-tongue
  const contactGeo = t.geo(new THREE.BoxGeometry(0.022, h * 0.62, 0.012));
  for (let i = 0; i < 7; i++) {
    const c = new THREE.Mesh(contactGeo, goldMat);
    c.position.set(-0.15 + i * 0.044, h * 0.4, 0.012);
    g.add(c);
  }

  return g;
}

/**
 * Helper: Builds a macro-authentic Mini-DIN 6-pin PS/2 port with 6 circular holes + key slot.
 */
function buildMacroPs2Port(
  t: StudioTracker,
  colorHex: number,
  metalMat: THREE.Material,
  cavityMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  // Brushed steel EMI outer can
  const can = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.56, 0.34, 0.56)), metalMat);
  can.castShadow = true;
  g.add(can);

  // Colored PC99 hard matte ring collar facing -Z
  const collarMat = t.mat(
    new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.44, metalness: 0.08 })
  );
  const collar = new THREE.Mesh(t.geo(new THREE.CylinderGeometry(0.145, 0.145, 0.07, 24)), collarMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0, -0.27);
  g.add(collar);

  // Deep dark circular socket recess
  const bore = new THREE.Mesh(t.geo(new THREE.CylinderGeometry(0.115, 0.115, 0.04, 22)), cavityMat);
  bore.rotation.x = Math.PI / 2;
  bore.position.set(0, 0, -0.292);
  g.add(bore);

  // Inner colored face plate slightly recessed so 6 holes & key slot read sharply
  const innerFace = new THREE.Mesh(t.geo(new THREE.CylinderGeometry(0.102, 0.102, 0.018, 20)), collarMat);
  innerFace.rotation.x = Math.PI / 2;
  innerFace.position.set(0, 0, -0.295);
  g.add(innerFace);

  // 6 authentic Mini-DIN pin holes arranged around the key slot
  const holeGeo = t.geo(new THREE.CylinderGeometry(0.014, 0.014, 0.03, 10));
  const pinOffsets: Array<[number, number]> = [
    [-0.048, 0.048],
    [0.048, 0.048],
    [-0.068, 0.0],
    [0.068, 0.0],
    [-0.042, -0.052],
    [0.042, -0.052],
  ];
  for (const [hx, hy] of pinOffsets) {
    const h = new THREE.Mesh(holeGeo, cavityMat);
    h.rotation.x = Math.PI / 2;
    h.position.set(hx, hy, -0.302);
    g.add(h);
  }

  // Central rectangular plastic alignment key slot
  const keySlot = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.042, 0.046, 0.032)), cavityMat);
  keySlot.position.set(0, 0.008, -0.302);
  g.add(keySlot);

  return g;
}

/**
 * Helper: Builds a macro-authentic D-Sub port (DB25 Female with 25 recessed holes OR DB9 Male with 9 brass pins).
 */
function buildMacroDSubPort(
  t: StudioTracker,
  opts: {
    width: number;
    height: number;
    colorHex: number;
    topCount: number;
    bottomCount: number;
    isMale: boolean;
    metalMat: THREE.Material;
    cavityMat: THREE.Material;
    brassMat: THREE.Material;
  }
): THREE.Group {
  const g = new THREE.Group();
  const { width, height, colorHex, topCount, bottomCount, isMale, metalMat, cavityMat, brassMat } = opts;

  // Rear EMI box body
  const body = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(width, height, 0.44)),
    metalMat
  );
  body.castShadow = true;
  g.add(body);

  // Flanged metal front plate with 2 hex standoff screw nuts
  const flange = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(width + 0.34, height + 0.05, 0.05)),
    metalMat
  );
  flange.position.set(0, 0, -0.23);
  g.add(flange);

  const nutGeo = t.geo(new THREE.CylinderGeometry(0.055, 0.055, 0.11, 6));
  for (const s of [-1, 1]) {
    const nut = new THREE.Mesh(nutGeo, metalMat);
    nut.rotation.x = Math.PI / 2;
    nut.position.set(s * (width / 2 + 0.09), 0, -0.28);
    g.add(nut);
    const nutHole = new THREE.Mesh(
      t.geo(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 8)),
      cavityMat
    );
    nutHole.rotation.x = Math.PI / 2;
    nutHole.position.set(s * (width / 2 + 0.09), 0, -0.325);
    g.add(nutHole);
  }

  // Raised metal D-Sub rim collar
  const rim = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(width - 0.08, height - 0.04, 0.1)),
    metalMat
  );
  rim.position.set(0, 0, -0.26);
  g.add(rim);

  // Colored PC99 recessed insulator bed
  const faceMat = t.mat(
    new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.45, metalness: 0.08 })
  );
  const face = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(width - 0.16, height - 0.11, 0.03)),
    isMale ? cavityMat : faceMat
  );
  face.position.set(0, 0, -0.305);
  g.add(face);

  if (isMale) {
    // Thin colored collar trim around DB9 male recess
    const trim = new THREE.Mesh(
      t.geo(new THREE.BoxGeometry(width - 0.12, height - 0.07, 0.015)),
      faceMat
    );
    trim.position.set(0, 0, -0.295);
    g.add(trim);
  }

  // Instanced pins (Male DB9 brass needles) or recessed holes (Female DB25 dark sockets)
  const total = topCount + bottomCount;
  const itemGeo = isMale
    ? t.geo(new THREE.CylinderGeometry(0.011, 0.011, 0.095, 8))
    : t.geo(new THREE.CylinderGeometry(0.016, 0.016, 0.032, 8));
  const inst = new THREE.InstancedMesh(itemGeo, isMale ? brassMat : cavityMat, total);
  let idx = 0;
  const spanTop = width - 0.3;
  for (let i = 0; i < topCount; i++) {
    const px = -spanTop / 2 + (i / Math.max(1, topCount - 1)) * spanTop;
    _dummy.position.set(px, 0.042, isMale ? -0.325 : -0.312);
    _dummy.rotation.set(Math.PI / 2, 0, 0);
    _dummy.scale.set(1, 1, 1);
    _dummy.updateMatrix();
    inst.setMatrixAt(idx++, _dummy.matrix);
  }
  const spanBot = spanTop * ((bottomCount - 1) / Math.max(1, topCount - 1));
  for (let i = 0; i < bottomCount; i++) {
    const px = -spanBot / 2 + (i / Math.max(1, bottomCount - 1)) * spanBot;
    _dummy.position.set(px, -0.042, isMale ? -0.325 : -0.312);
    _dummy.rotation.set(Math.PI / 2, 0, 0);
    _dummy.scale.set(1, 1, 1);
    _dummy.updateMatrix();
    inst.setMatrixAt(idx++, _dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
  g.add(inst);

  return g;
}

/**
 * Builds the dedicated Ultra-Detail Studio Edition 3D Motherboard for Teater Materi.
 * Visually distinct from Lab 3D: dark reflective keynote stage, matte-black gold-traced PCB,
 * open LGA 775 socket with dynamic heatsink, half-populated slots (1 RAM + CMOS installed,
 * other slots open to reveal real hollow cavities & brass/gold pins), and macro-authentic Back Panel.
 */
export function buildStudioMotherboard(
  maxAniso: number,
  textureScale: number
): BuiltStudioMotherboard {
  const t = new StudioTracker();
  const rootGroup = new THREE.Group();
  const componentGroups: Record<string, THREE.Object3D> = {};

  const registerGroup = (id: string, obj: THREE.Object3D) => {
    componentGroups[id] = obj;
    rootGroup.add(obj);
  };

  // Shared Studio PBR Materials (tactile, solid, physically credible)
  const brushedTex = t.tex(createBrushedMetalTexture(maxAniso));
  const pcbTexSet = createStudioPcbTextures(maxAniso, textureScale);
  t.onDispose(() => pcbTexSet.dispose());

  const cavityMat = t.mat(
    new THREE.MeshStandardMaterial({ color: 0x030508, roughness: 0.96, metalness: 0.02 })
  );
  const goldMat = t.mat(
    new THREE.MeshStandardMaterial({ color: 0xf4c430, roughness: 0.22, metalness: 0.94 })
  );
  const brassMat = t.mat(
    new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.26, metalness: 0.9 })
  );
  const brushedSteelMat = t.mat(
    new THREE.MeshStandardMaterial({
      color: 0xd4dbe4,
      map: brushedTex,
      roughness: 0.26,
      metalness: 0.92,
    })
  );
  const darkAnodizedMat = t.mat(
    new THREE.MeshStandardMaterial({
      color: 0x262e3d,
      map: brushedTex,
      roughness: 0.34,
      metalness: 0.85,
    })
  );
  const goldAnodizedMat = t.mat(
    new THREE.MeshStandardMaterial({
      color: 0x8f7340,
      map: brushedTex,
      roughness: 0.32,
      metalness: 0.86,
    })
  );
  const hardBlackPlastic = t.mat(
    new THREE.MeshStandardMaterial({ color: 0x161b24, roughness: 0.56, metalness: 0.08 })
  );
  const hardSlateBluePlastic = t.mat(
    new THREE.MeshStandardMaterial({ color: 0x173a5e, roughness: 0.5, metalness: 0.08 })
  );
  const hardIvoryPlastic = t.mat(
    new THREE.MeshStandardMaterial({ color: 0xd8dce3, roughness: 0.5, metalness: 0.06 })
  );
  const hardBrownPlastic = t.mat(
    new THREE.MeshStandardMaterial({ color: 0x6b3f1d, roughness: 0.52, metalness: 0.08 })
  );
  const hardRedPlastic = t.mat(
    new THREE.MeshStandardMaterial({ color: 0x8b1e24, roughness: 0.48, metalness: 0.08 })
  );
  const ferriteMat = t.mat(
    new THREE.MeshStandardMaterial({ color: 0x22262e, roughness: 0.72, metalness: 0.35 })
  );
  const icEpoxyMat = t.mat(
    new THREE.MeshStandardMaterial({ color: 0x10141c, roughness: 0.42, metalness: 0.16 })
  );

  // ── 0. SLEEK DARK KEYNOTE STUDIO FLOOR (No anti-static game workbench!) ──
  const floorTex = t.tex(createStudioFloorTexture(maxAniso, textureScale));
  const studioFloor = new THREE.Mesh(
    t.geo(new THREE.PlaneGeometry(34, 34)),
    t.mat(
      new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.42,
        metalness: 0.35,
      })
    )
  );
  studioFloor.rotation.x = -Math.PI / 2;
  studioFloor.position.y = -0.14;
  studioFloor.receiveShadow = true;
  rootGroup.add(studioFloor);

  // ── 1. ULTRA-DETAIL MATTE-BLACK PCB WITH STANDOFFS & MICRO SMDs ──
  const pcbY = 0.16;
  const pcbMat = t.mat(
    new THREE.MeshStandardMaterial({
      map: pcbTexSet.map,
      bumpMap: pcbTexSet.bumpMap,
      bumpScale: 0.018,
      roughnessMap: pcbTexSet.roughnessMap,
      roughness: 0.72,
      metalness: 0.28,
    })
  );
  const pcbSideMat = t.mat(
    new THREE.MeshStandardMaterial({ color: 0x1b222c, roughness: 0.65, metalness: 0.2 })
  );
  const pcbMesh = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(10.0, 0.16, 8.4)),
    [pcbSideMat, pcbSideMat, pcbMat, pcbSideMat, pcbSideMat, pcbSideMat]
  );
  pcbMesh.position.set(0, 0.08, 0);
  pcbMesh.castShadow = true;
  pcbMesh.receiveShadow = true;
  rootGroup.add(pcbMesh);

  // 9 Brass motherboard standoffs & stainless mounting screws
  const mountCoords: Array<[number, number]> = [
    [-4.65, -3.85],
    [0.0, -3.85],
    [4.65, -3.85],
    [-4.65, 0.0],
    [0.45, 0.25],
    [4.65, 0.0],
    [-4.65, 3.85],
    [0.0, 3.85],
    [4.65, 3.85],
  ];
  const standoffGeo = t.geo(new THREE.CylinderGeometry(0.09, 0.09, 0.14, 6));
  const screwHeadGeo = t.geo(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 16));
  const standInst = new THREE.InstancedMesh(standoffGeo, brassMat, mountCoords.length);
  const screwInst = new THREE.InstancedMesh(screwHeadGeo, brushedSteelMat, mountCoords.length);
  mountCoords.forEach(([mx, mz], i) => {
    _dummy.position.set(mx, -0.07, mz);
    _dummy.rotation.set(0, 0, 0);
    _dummy.scale.set(1, 1, 1);
    _dummy.updateMatrix();
    standInst.setMatrixAt(i, _dummy.matrix);

    _dummy.position.set(mx, pcbY + 0.02, mz);
    _dummy.updateMatrix();
    screwInst.setMatrixAt(i, _dummy.matrix);
  });
  standInst.instanceMatrix.needsUpdate = true;
  screwInst.instanceMatrix.needsUpdate = true;
  rootGroup.add(standInst, screwInst);

  // 120 Instanced Micro SMD Ceramic Capacitors & Resistors along buses
  const smdBodyGeo = t.geo(new THREE.BoxGeometry(0.09, 0.036, 0.048));
  const smdMat = t.mat(
    new THREE.MeshStandardMaterial({ color: 0x8b6239, roughness: 0.4, metalness: 0.25 })
  );
  const smdInst = new THREE.InstancedMesh(smdBodyGeo, smdMat, 110);
  let smdIdx = 0;
  const addSmdRow = (x0: number, z0: number, dx: number, dz: number, count: number, rotY = 0) => {
    for (let i = 0; i < count && smdIdx < 110; i++) {
      _dummy.position.set(x0 + dx * i, pcbY + 0.018, z0 + dz * i);
      _dummy.rotation.set(0, rotY, 0);
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();
      smdInst.setMatrixAt(smdIdx++, _dummy.matrix);
    }
  };
  addSmdRow(0.95, -2.6, 0.16, 0, 14, Math.PI / 2);
  addSmdRow(0.75, 0.45, 0.16, 0, 16, 0);
  addSmdRow(-0.6, -2.2, 0, 0.17, 14, 0);
  addSmdRow(-3.1, 0.2, 0.17, 0, 12, Math.PI / 2);
  addSmdRow(-2.2, 1.85, 0.17, 0, 12, 0);
  addSmdRow(0.25, 2.95, 0.18, 0, 14, Math.PI / 2);
  addSmdRow(-4.1, -2.75, 0.17, 0, 12, 0);
  addSmdRow(3.45, 0.1, 0, 0.18, 12, Math.PI / 2);
  smdInst.count = smdIdx;
  smdInst.instanceMatrix.needsUpdate = true;
  rootGroup.add(smdInst);

  // ── 2. #01 OPEN LGA 775 SOCKET + VRM CHOKES/CAPACITORS + DYNAMIC HEATSINK ──
  const cpuGroup = new THREE.Group();
  cpuGroup.position.set(2.1, pcbY, -1.6);

  // Recessed socket plastic housing (4-sided perimeter walls around recessed gold pin bed)
  const sockSize = 1.92;
  const sockWall = 0.14;
  const sockH = 0.14;
  const sockWallMat = t.mat(
    new THREE.MeshStandardMaterial({ color: 0x20252e, roughness: 0.55, metalness: 0.12 })
  );
  const swX = t.geo(new THREE.BoxGeometry(sockSize, sockH, sockWall));
  const swZ = t.geo(new THREE.BoxGeometry(sockWall, sockH, sockSize - sockWall * 2));
  for (const s of [-1, 1]) {
    const w1 = new THREE.Mesh(swX, sockWallMat);
    w1.position.set(0, sockH / 2, s * (sockSize / 2 - sockWall / 2));
    w1.castShadow = true;
    cpuGroup.add(w1);
    const w2 = new THREE.Mesh(swZ, sockWallMat);
    w2.position.set(s * (sockSize / 2 - sockWall / 2), sockH / 2, 0);
    w2.castShadow = true;
    cpuGroup.add(w2);
  }

  // Deep recessed LGA 775 gold contact pin bed (visible!)
  const lgaTex = t.tex(createMacroLga775GoldTexture(maxAniso));
  const pinBed = new THREE.Mesh(
    t.geo(new THREE.PlaneGeometry(1.62, 1.62)),
    t.mat(
      new THREE.MeshStandardMaterial({
        map: lgaTex,
        roughness: 0.24,
        metalness: 0.88,
      })
    )
  );
  pinBed.rotation.x = -Math.PI / 2;
  pinBed.position.y = 0.045;
  cpuGroup.add(pinBed);

  // Brushed stainless steel ILM retention frame (hollow open window around pin bed!)
  const ilmH = 0.045;
  const ilmBorder = 0.16;
  const ilmSize = 2.04;
  const ilmBarX = t.geo(new THREE.BoxGeometry(ilmSize, ilmH, ilmBorder));
  const ilmBarZ = t.geo(new THREE.BoxGeometry(ilmBorder, ilmH, ilmSize - ilmBorder * 2));
  for (const s of [-1, 1]) {
    const b1 = new THREE.Mesh(ilmBarX, brushedSteelMat);
    b1.position.set(0, sockH + ilmH / 2, s * (ilmSize / 2 - ilmBorder / 2));
    b1.castShadow = true;
    cpuGroup.add(b1);
    const b2 = new THREE.Mesh(ilmBarZ, brushedSteelMat);
    b2.position.set(s * (ilmSize / 2 - ilmBorder / 2), sockH + ilmH / 2, 0);
    b2.castShadow = true;
    cpuGroup.add(b2);
  }

  // Hinged curved stainless steel ZIF Load Lever on side
  const leverCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.12, sockH + 0.03, -0.95),
    new THREE.Vector3(1.12, sockH + 0.04, 0.82),
    new THREE.Vector3(1.18, sockH + 0.09, 1.05),
    new THREE.Vector3(1.36, sockH + 0.11, 1.08),
  ]);
  const loadLever = new THREE.Mesh(
    t.geo(new THREE.TubeGeometry(leverCurve, 22, 0.028, 10, false)),
    brushedSteelMat
  );
  loadLever.castShadow = true;
  cpuGroup.add(loadLever);

  // 4 Heatsink mounting through-holes around LGA 775
  const holeRingGeo = t.geo(new THREE.TorusGeometry(0.085, 0.024, 8, 16));
  for (const [hx, hz] of [
    [-1.22, -1.22],
    [1.22, -1.22],
    [-1.22, 1.22],
    [1.22, 1.22],
  ]) {
    const ring = new THREE.Mesh(holeRingGeo, brassMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(hx, 0.015, hz);
    cpuGroup.add(ring);
    const bore = new THREE.Mesh(t.geo(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12)), cavityMat);
    bore.position.set(hx, 0.012, hz);
    cpuGroup.add(bore);
  }

  // Authentic VRM Power Delivery Bank (6 Ferrite Cube Chokes + 8 Solid Aluminum Polymer Capacitors)
  const chokeGeo = t.geo(new THREE.BoxGeometry(0.32, 0.24, 0.32));
  const chokeCoords: Array<[number, number]> = [
    [1.68, -0.82],
    [1.68, -0.34],
    [1.68, 0.14],
    [1.68, 0.62],
    [0.55, -1.62],
    [0.05, -1.62],
  ];
  for (const [cx, cz] of chokeCoords) {
    const choke = new THREE.Mesh(chokeGeo, ferriteMat);
    choke.position.set(cx, 0.12, cz);
    choke.castShadow = true;
    cpuGroup.add(choke);
  }

  const capBodyGeo = t.geo(new THREE.CylinderGeometry(0.115, 0.115, 0.34, 18));
  const capTopGeo = t.geo(new THREE.CylinderGeometry(0.108, 0.108, 0.02, 18));
  const capBandGeo = t.geo(new THREE.CylinderGeometry(0.118, 0.118, 0.08, 18));
  const capBandMat = t.mat(
    new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35, metalness: 0.3 })
  );
  const capCoords: Array<[number, number]> = [
    [2.16, -0.95],
    [2.16, -0.58],
    [2.16, -0.21],
    [2.16, 0.16],
    [2.16, 0.53],
    [-0.45, -1.62],
    [-0.85, -1.62],
    [1.05, -1.62],
  ];
  for (const [cx, cz] of capCoords) {
    const can = new THREE.Mesh(capBodyGeo, brushedSteelMat);
    can.position.set(cx, 0.17, cz);
    can.castShadow = true;
    cpuGroup.add(can);
    const band = new THREE.Mesh(capBandGeo, capBandMat);
    band.position.set(cx, 0.08, cz);
    cpuGroup.add(band);
    const top = new THREE.Mesh(capTopGeo, brushedSteelMat);
    top.position.set(cx, 0.345, cz);
    cpuGroup.add(top);
  }

  // Dynamic CPU Heatsink + Spinning Fan (ONLY shown during cooling/overheat or IPO CPU processing!)
  const heatsinkGroup = new THREE.Group();
  heatsinkGroup.position.set(0, 0.16, 0);
  const hsBase = new THREE.Mesh(
    t.geo(new THREE.CylinderGeometry(0.96, 0.96, 0.12, 28)),
    brushedSteelMat
  );
  hsBase.position.y = 0.06;
  hsBase.castShadow = true;
  heatsinkGroup.add(hsBase);

  // Radial aluminum cooling fins
  const finGeo = t.geo(new THREE.BoxGeometry(0.032, 0.54, 0.92));
  const finCount = 24;
  const finInst = new THREE.InstancedMesh(finGeo, brushedSteelMat, finCount);
  for (let i = 0; i < finCount; i++) {
    const ang = (i / finCount) * Math.PI * 2;
    _dummy.position.set(Math.cos(ang) * 0.48, 0.38, Math.sin(ang) * 0.48);
    _dummy.rotation.set(0, -ang + Math.PI / 2, 0);
    _dummy.scale.set(1, 1, 1);
    _dummy.updateMatrix();
    finInst.setMatrixAt(i, _dummy.matrix);
  }
  finInst.instanceMatrix.needsUpdate = true;
  heatsinkGroup.add(finInst);

  // Fan shroud & spinning 9-blade matte rotor
  const fanShroud = new THREE.Mesh(
    t.geo(new THREE.TorusGeometry(0.88, 0.07, 10, 28)),
    hardBlackPlastic
  );
  fanShroud.rotation.x = Math.PI / 2;
  fanShroud.position.y = 0.68;
  heatsinkGroup.add(fanShroud);

  const cpuFanRotor = new THREE.Group();
  cpuFanRotor.position.y = 0.68;
  const fanHub = new THREE.Mesh(
    t.geo(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 18)),
    hardBlackPlastic
  );
  cpuFanRotor.add(fanHub);
  const bladeGeo = t.geo(new THREE.BoxGeometry(0.56, 0.025, 0.17));
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const blade = new THREE.Mesh(bladeGeo, hardBlackPlastic);
    blade.position.set(Math.cos(a) * 0.46, 0, Math.sin(a) * 0.46);
    blade.rotation.y = -a;
    blade.rotation.x = 0.38;
    cpuFanRotor.add(blade);
  }
  heatsinkGroup.add(cpuFanRotor);
  heatsinkGroup.visible = false; // Default open socket so gold pins shine!
  cpuGroup.add(heatsinkGroup);

  registerGroup('cpu-socket', cpuGroup);

  // ── 3. #02 4x HOLLOW DIMM RAM SLOTS (1 RAM STICK INSTALLED, 3 SLOTS OPEN!) ──
  const ramGroup = new THREE.Group();
  ramGroup.position.set(1.9, pcbY, 1.85);

  const dimmOffsetsZ = [-0.6, -0.2, 0.2, 0.6];
  dimmOffsetsZ.forEach((dz, i) => {
    const slot = buildHollowCardSlot(t, {
      length: 3.7,
      width: 0.24,
      height: 0.24,
      wallThickness: 0.048,
      notchFrac: 0.46,
      bodyMat: i % 2 === 0 ? hardSlateBluePlastic : hardBlackPlastic,
      cavityMat,
      goldMat,
      latchMat: hardIvoryPlastic,
      dualLatch: true,
      pinCount: 38,
    });
    slot.position.set(0, 0, dz);
    ramGroup.add(slot);
  });

  // 1 Realistic Matte-Black RAM Stick seated in Slot 0 (dz = -0.6), leaving 3 slots open!
  const installedRamStick = new THREE.Group();
  installedRamStick.position.set(0, 0.16, -0.6);
  const ramPcb = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(3.56, 0.68, 0.055)),
    t.mat(new THREE.MeshStandardMaterial({ color: 0x0f1a16, roughness: 0.45, metalness: 0.18 }))
  );
  ramPcb.position.y = 0.36;
  ramPcb.castShadow = true;
  installedRamStick.add(ramPcb);

  // Brushed gunmetal top heatspreader trim
  const ramSpreader = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(3.58, 0.44, 0.085)),
    darkAnodizedMat
  );
  ramSpreader.position.y = 0.48;
  ramSpreader.castShadow = true;
  installedRamStick.add(ramSpreader);

  // Gold edge fingers peeking near slot
  const ramGold = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(3.48, 0.1, 0.062)),
    goldMat
  );
  ramGold.position.y = 0.06;
  installedRamStick.add(ramGold);

  // 8 BGA DRAM IC chips along lower exposed PCB
  const dramGeo = t.geo(new THREE.BoxGeometry(0.28, 0.22, 0.088));
  for (let i = 0; i < 8; i++) {
    const ic = new THREE.Mesh(dramGeo, icEpoxyMat);
    ic.position.set(-1.42 + i * 0.405, 0.22, 0);
    installedRamStick.add(ic);
  }
  ramGroup.add(installedRamStick);
  registerGroup('ram-slots', ramGroup);

  // ── 4. #03 NORTHBRIDGE (MCH) — SCULPTED ANODIZED FIN HEATSINK ──
  const nbGroup = new THREE.Group();
  nbGroup.position.set(0.1, pcbY, -0.8);

  const nbBase = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(1.18, 0.16, 1.18)),
    darkAnodizedMat
  );
  nbBase.position.y = 0.08;
  nbBase.castShadow = true;
  nbGroup.add(nbBase);

  const nbFinGeo = t.geo(new THREE.BoxGeometry(1.12, 0.42, 0.042));
  for (let i = 0; i < 9; i++) {
    const fin = new THREE.Mesh(nbFinGeo, i === 4 ? brushedSteelMat : darkAnodizedMat);
    fin.position.set(0, 0.36, -0.48 + i * 0.12);
    fin.castShadow = true;
    nbGroup.add(fin);
  }
  // Copper heatpipe accent bar
  const nbPipe = new THREE.Mesh(
    t.geo(new THREE.CylinderGeometry(0.055, 0.055, 1.24, 12)),
    brassMat
  );
  nbPipe.rotation.z = Math.PI / 2;
  nbPipe.position.set(0, 0.16, 0.56);
  nbGroup.add(nbPipe);

  registerGroup('northbridge', nbGroup);

  // ── 5. #04 SOUTHBRIDGE (ICH) — LOW-PROFILE GOLD/SLATE RIBBED HEATSINK ──
  const sbGroup = new THREE.Group();
  sbGroup.position.set(-1.45, pcbY, 0.95);

  const sbBase = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(1.06, 0.12, 1.06)),
    goldAnodizedMat
  );
  sbBase.position.y = 0.06;
  sbBase.castShadow = true;
  sbGroup.add(sbBase);

  const sbFinGeo = t.geo(new THREE.BoxGeometry(0.045, 0.24, 1.0));
  for (let i = 0; i < 8; i++) {
    const fin = new THREE.Mesh(sbFinGeo, goldAnodizedMat);
    fin.position.set(-0.42 + i * 0.12, 0.22, 0);
    fin.castShadow = true;
    sbGroup.add(fin);
  }
  registerGroup('southbridge', sbGroup);

  // ── 6. #05 PCIe x16 (OPEN HOLLOW TROUGH + GOLD PINS + LATCH) ──
  const pcie16Group = buildHollowCardSlot(t, {
    length: 2.95,
    width: 0.24,
    height: 0.23,
    wallThickness: 0.048,
    notchFrac: 0.22,
    bodyMat: hardSlateBluePlastic,
    cavityMat,
    goldMat,
    latchMat: hardIvoryPlastic,
    rearTab: true,
    pinCount: 34,
    rotateY: Math.PI / 2,
  });
  pcie16Group.position.set(-1.5, pcbY, -1.65);
  registerGroup('pcie-x16', pcie16Group);

  // ── 7. #06 PCIe x1 (SHORT OPEN HOLLOW TROUGH) ──
  const pcie1Group = buildHollowCardSlot(t, {
    length: 0.92,
    width: 0.22,
    height: 0.22,
    wallThickness: 0.045,
    notchFrac: 0.56,
    bodyMat: hardBlackPlastic,
    cavityMat,
    goldMat,
    pinCount: 12,
    rotateY: Math.PI / 2,
  });
  pcie1Group.position.set(-2.4, pcbY, -2.5);
  registerGroup('pcie-x1', pcie1Group);

  // ── 8. #07 AGP SLOT (BROWN OPEN HOLLOW TROUGH) ──
  const agpGroup = buildHollowCardSlot(t, {
    length: 2.38,
    width: 0.24,
    height: 0.23,
    wallThickness: 0.048,
    notchFrac: 0.36,
    bodyMat: hardBrownPlastic,
    cavityMat,
    goldMat,
    latchMat: hardBrownPlastic,
    rearTab: true,
    pinCount: 28,
    rotateY: Math.PI / 2,
  });
  agpGroup.position.set(-2.7, pcbY, -1.2);
  registerGroup('agp-slot', agpGroup);

  // ── 9. #08 2x PCI SLOTS (MATTE IVORY OPEN HOLLOW TROUGHS) ──
  const pciGroup = new THREE.Group();
  pciGroup.position.set(-3.85, pcbY, -1.35);
  for (const dx of [-0.28, 0.28]) {
    const slot = buildHollowCardSlot(t, {
      length: 2.65,
      width: 0.24,
      height: 0.22,
      wallThickness: 0.048,
      notchFrac: 0.72,
      bodyMat: hardIvoryPlastic,
      cavityMat,
      goldMat,
      pinCount: 30,
      rotateY: Math.PI / 2,
    });
    slot.position.set(dx, 0, 0);
    pciGroup.add(slot);
  }
  registerGroup('pci-slots', pciGroup);

  // ── 10. #09 ROM BIOS (RECESSED SOCKET + EPOXY IC + SILVER LEGS) ──
  const biosGroup = new THREE.Group();
  biosGroup.position.set(-3.75, pcbY, 1.2);
  const biosSocket = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(0.62, 0.1, 0.88)),
    hardBlackPlastic
  );
  biosSocket.position.y = 0.05;
  biosGroup.add(biosSocket);
  const biosChip = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(0.46, 0.1, 0.72)),
    icEpoxyMat
  );
  biosChip.position.y = 0.11;
  biosChip.castShadow = true;
  biosGroup.add(biosChip);
  // Pin-1 gold orientation dot
  const biosDot = new THREE.Mesh(t.geo(new THREE.CylinderGeometry(0.038, 0.038, 0.015, 12)), goldMat);
  biosDot.position.set(-0.14, 0.162, -0.24);
  biosGroup.add(biosDot);
  // Silver gull-wing DIP legs
  const legGeo = t.geo(new THREE.BoxGeometry(0.07, 0.06, 0.025));
  for (let i = 0; i < 8; i++) {
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, brushedSteelMat);
      leg.position.set(s * 0.25, 0.08, -0.28 + i * 0.08);
      biosGroup.add(leg);
    }
  }
  registerGroup('bios-rom', biosGroup);

  // ── 11. #10 CMOS BATTERY (CR2032 3V INSTALLED IN MOLDED HOLDER) ──
  const cmosGroup = new THREE.Group();
  cmosGroup.position.set(-1.4, pcbY, 2.35);

  const holderOuter = new THREE.Mesh(
    t.geo(new THREE.CylinderGeometry(0.44, 0.44, 0.15, 28, 1, true)),
    hardBlackPlastic
  );
  holderOuter.position.y = 0.075;
  cmosGroup.add(holderOuter);
  const holderBase = new THREE.Mesh(
    t.geo(new THREE.CylinderGeometry(0.44, 0.44, 0.04, 28)),
    cavityMat
  );
  holderBase.position.y = 0.02;
  cmosGroup.add(holderBase);

  const coinTex = t.tex(createCmosCoinTexture(maxAniso));
  const coinTopMat = t.mat(
    new THREE.MeshStandardMaterial({ map: coinTex, roughness: 0.18, metalness: 0.94 })
  );
  const coinMesh = new THREE.Mesh(
    t.geo(new THREE.CylinderGeometry(0.37, 0.37, 0.09, 28)),
    [brushedSteelMat, coinTopMat, brushedSteelMat]
  );
  coinMesh.position.y = 0.095;
  coinMesh.castShadow = true;
  cmosGroup.add(coinMesh);

  // Stainless steel spring release clip on rim
  const springClip = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(0.18, 0.04, 0.16)),
    brushedSteelMat
  );
  springClip.position.set(0.36, 0.155, 0);
  cmosGroup.add(springClip);
  registerGroup('cmos-battery', cmosGroup);

  // ── 12. #11 4x HOLLOW L-SHAPED SATA PORTS ──
  const sataGroup = new THREE.Group();
  sataGroup.position.set(-2.65, pcbY, 2.5);
  const sataCoords: Array<[number, number, boolean]> = [
    [-0.32, -0.18, true],
    [0.32, -0.18, true],
    [-0.32, 0.18, false],
    [0.32, 0.18, false],
  ];
  for (const [sx, sz, isRed] of sataCoords) {
    const port = buildHollowSataPort(
      t,
      isRed ? hardRedPlastic : hardBlackPlastic,
      cavityMat,
      goldMat
    );
    port.position.set(sx, 0, sz);
    sataGroup.add(port);
  }
  registerGroup('sata-ports', sataGroup);

  // ── 13. #12 IDE 40-PIN (HOLLOW SHROUD + 40 STANDING BRASS PINS) ──
  const ideGroup = buildHollowShroudedHeader(t, {
    cols: 20,
    length: 2.35,
    width: 0.34,
    height: 0.3,
    shroudMat: hardSlateBluePlastic,
    cavityMat,
    brassMat,
  });
  ideGroup.position.set(-0.85, pcbY, 3.45);
  registerGroup('ide-port', ideGroup);

  // ── 14. #13 FLOPPY 34-PIN (HOLLOW SHROUD + 34 STANDING BRASS PINS) ──
  const floppyGroup = buildHollowShroudedHeader(t, {
    cols: 17,
    length: 1.98,
    width: 0.32,
    height: 0.28,
    shroudMat: hardBlackPlastic,
    cavityMat,
    brassMat,
  });
  floppyGroup.position.set(-4.2, pcbY, 2.55);
  floppyGroup.rotation.y = Math.PI / 2;
  registerGroup('floppy-port', floppyGroup);

  // ── 15. #14 ATX 24-PIN POWER (+ 4-PIN ATX12V) — 24 INDIVIDUAL HOLLOW SQUARE SOCKETS! ──
  const atxGroup = new THREE.Group();
  atxGroup.position.set(1.55, pcbY, 3.45);
  const atx24 = buildHollowAtxConnector(t, 12, 2, hardIvoryPlastic, cavityMat, brassMat);
  atxGroup.add(atx24);

  // Companion ATX12V 4-Pin (2x2 hollow cells) near CPU VRM
  const atx4 = buildHollowAtxConnector(t, 2, 2, hardIvoryPlastic, cavityMat, brassMat);
  atx4.position.set(2.45, 0, -6.55);
  atxGroup.add(atx4);
  registerGroup('atx-power', atxGroup);

  // ── 16. #15–#24 MACRO-AUTHENTIC BACK PANEL I/O PORTS ──
  const bpAnchorGroup = new THREE.Group();
  bpAnchorGroup.position.set(0, pcbY, -3.72);
  // Subtle brushed aluminum I/O shield backplate frame
  const ioPlate = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(7.2, 0.88, 0.04)),
    darkAnodizedMat
  );
  ioPlate.position.set(0.22, 0.44, -0.02);
  bpAnchorGroup.add(ioPlate);
  registerGroup('back-panel-block', bpAnchorGroup);

  // #16 PS/2 Mouse (Green, top) & #17 PS/2 Keyboard (Purple, bottom)
  const ps2Mouse = buildMacroPs2Port(t, 0x10b981, brushedSteelMat, cavityMat);
  ps2Mouse.position.set(3.35, pcbY + 0.56, -3.72);
  registerGroup('ps2-mouse', ps2Mouse);

  const ps2Keyboard = buildMacroPs2Port(t, 0x8b5cf6, brushedSteelMat, cavityMat);
  ps2Keyboard.position.set(3.35, pcbY + 0.2, -3.72);
  registerGroup('ps2-keyboard', ps2Keyboard);

  // #18 Parallel DB25 (Pink, 25 recessed holes + hex nuts)
  const parallelPort = buildMacroDSubPort(t, {
    width: 1.56,
    height: 0.34,
    colorHex: 0xec4899,
    topCount: 13,
    bottomCount: 12,
    isMale: false,
    metalMat: brushedSteelMat,
    cavityMat,
    brassMat,
  });
  parallelPort.position.set(1.85, pcbY + 0.58, -3.72);
  registerGroup('parallel-port', parallelPort);

  // #19 Serial DB9 (Teal, 9 protruding brass male pins + hex nuts)
  const serialPort = buildMacroDSubPort(t, {
    width: 0.84,
    height: 0.3,
    colorHex: 0x14b8a6,
    topCount: 5,
    bottomCount: 4,
    isMale: true,
    metalMat: brushedSteelMat,
    cavityMat,
    brassMat,
  });
  serialPort.position.set(2.15, pcbY + 0.2, -3.72);
  registerGroup('serial-port', serialPort);

  // #20 SPDIF (Gold Coaxial RCA barrel with deep hole + Optical Toslink shutter)
  const spdifGroup = new THREE.Group();
  spdifGroup.position.set(0.65, pcbY + 0.26, -3.72);
  const spdifCan = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.56, 0.44, 0.5)), brushedSteelMat);
  spdifCan.castShadow = true;
  spdifGroup.add(spdifCan);
  const rcaOuter = new THREE.Mesh(
    t.geo(new THREE.CylinderGeometry(0.11, 0.11, 0.14, 20)),
    goldMat
  );
  rcaOuter.rotation.x = Math.PI / 2;
  rcaOuter.position.set(-0.11, 0.0, -0.29);
  spdifGroup.add(rcaOuter);
  const rcaPlastic = new THREE.Mesh(
    t.geo(new THREE.CylinderGeometry(0.082, 0.082, 0.15, 18)),
    t.mat(new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 }))
  );
  rcaPlastic.rotation.x = Math.PI / 2;
  rcaPlastic.position.set(-0.11, 0.0, -0.295);
  spdifGroup.add(rcaPlastic);
  const rcaHole = new THREE.Mesh(
    t.geo(new THREE.CylinderGeometry(0.044, 0.044, 0.08, 16)),
    cavityMat
  );
  rcaHole.rotation.x = Math.PI / 2;
  rcaHole.position.set(-0.11, 0.0, -0.34);
  spdifGroup.add(rcaHole);
  // Optical Toslink recessed square cavity next to coaxial
  const toslink = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.15, 0.15, 0.08)), cavityMat);
  toslink.position.set(0.13, 0, -0.24);
  spdifGroup.add(toslink);
  registerGroup('spdif-port', spdifGroup);

  // #21 Firewire (IEEE 1394 — recessed hollow metal lip + central contact tongue)
  const fwGroup = new THREE.Group();
  fwGroup.position.set(-0.35, pcbY + 0.52, -3.72);
  const fwCan = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.46, 0.34, 0.5)), brushedSteelMat);
  fwCan.castShadow = true;
  fwGroup.add(fwCan);
  const fwHole = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.32, 0.14, 0.08)), cavityMat);
  fwHole.position.set(0, 0, -0.24);
  fwGroup.add(fwHole);
  const fwTongue = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.24, 0.036, 0.06)), hardBlackPlastic);
  fwTongue.position.set(0, 0, -0.245);
  fwGroup.add(fwTongue);
  registerGroup('firewire-port', fwGroup);

  // #22 RJ45 LAN (Stepped T-shaped hollow cavity + 8 angled gold spring pins + Link LEDs)
  const rj45Group = new THREE.Group();
  rj45Group.position.set(-1.45, pcbY + 0.62, -3.72);
  const rjCan = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.62, 0.42, 0.56)), brushedSteelMat);
  rjCan.castShadow = true;
  rj45Group.add(rjCan);
  // Main hollow rectangular chamber + top latch step
  const rjMainHole = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.42, 0.24, 0.14)), cavityMat);
  rjMainHole.position.set(0, -0.02, -0.24);
  rj45Group.add(rjMainHole);
  const rjTopStep = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.18, 0.09, 0.14)), cavityMat);
  rjTopStep.position.set(0, 0.12, -0.24);
  rj45Group.add(rjTopStep);
  // 8 angled gleaming gold spring pins visible inside!
  const rjPinGeo = t.geo(new THREE.BoxGeometry(0.018, 0.11, 0.018));
  const rjPins = new THREE.InstancedMesh(rjPinGeo, goldMat, 8);
  for (let i = 0; i < 8; i++) {
    _dummy.position.set(-0.14 + i * 0.04, -0.07, -0.25);
    _dummy.rotation.set(0.45, 0, 0);
    _dummy.scale.set(1, 1, 1);
    _dummy.updateMatrix();
    rjPins.setMatrixAt(i, _dummy.matrix);
  }
  rjPins.instanceMatrix.needsUpdate = true;
  rj45Group.add(rjPins);
  // Green & Amber Link/Activity LEDs
  const greenLedMat = t.mat(
    new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.9 })
  );
  const amberLedMat = t.mat(
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.7 })
  );
  const ledL = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.065, 0.045, 0.02)), greenLedMat);
  ledL.position.set(-0.22, 0.15, -0.285);
  rj45Group.add(ledL);
  const ledR = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.065, 0.045, 0.02)), amberLedMat);
  ledR.position.set(0.22, 0.15, -0.285);
  rj45Group.add(ledR);
  registerGroup('rj45-port', rj45Group);

  // #23 Dual-Stack USB Ports (Deep dark rectangular hollow cavities + internal plastic tongues + 4 gold pads each)
  const usbGroup = new THREE.Group();
  usbGroup.position.set(-1.45, pcbY + 0.22, -3.72);
  const usbCan = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.62, 0.38, 0.54)), brushedSteelMat);
  usbCan.castShadow = true;
  usbGroup.add(usbCan);
  for (const dy of [-0.085, 0.085]) {
    const hole = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.44, 0.125, 0.14)), cavityMat);
    hole.position.set(0, dy, -0.23);
    usbGroup.add(hole);
    const tongue = new THREE.Mesh(
      t.geo(new THREE.BoxGeometry(0.38, 0.036, 0.11)),
      hardSlateBluePlastic
    );
    tongue.position.set(0, dy + 0.026, -0.235);
    usbGroup.add(tongue);
    for (let p = 0; p < 4; p++) {
      const pad = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.042, 0.014, 0.08)), goldMat);
      pad.position.set(-0.12 + p * 0.08, dy + 0.005, -0.245);
      usbGroup.add(pad);
    }
  }
  registerGroup('usb-ports', usbGroup);

  // #24 3x 3.5mm Audio Jacks (Green Line-Out, Blue Line-In, Pink Mic) with chamfered collars & deep dark holes
  const audioGroup = new THREE.Group();
  audioGroup.position.set(-2.85, pcbY + 0.4, -3.72);
  const audioCan = new THREE.Mesh(t.geo(new THREE.BoxGeometry(1.12, 0.48, 0.52)), brushedSteelMat);
  audioCan.castShadow = true;
  audioGroup.add(audioCan);

  const jackSpecs: Array<{ x: number; color: number }> = [
    { x: -0.34, color: 0x3b82f6 }, // Blue Line-In
    { x: 0.0, color: 0x10b981 },   // Green Line-Out / Speaker
    { x: 0.34, color: 0xec4899 },  // Pink Mic-In
  ];
  for (const jk of jackSpecs) {
    const jMat = t.mat(
      new THREE.MeshStandardMaterial({ color: jk.color, roughness: 0.38, metalness: 0.12 })
    );
    const bezel = new THREE.Mesh(t.geo(new THREE.CylinderGeometry(0.125, 0.135, 0.08, 22)), jMat);
    bezel.rotation.x = Math.PI / 2;
    bezel.position.set(jk.x, 0, -0.275);
    audioGroup.add(bezel);

    const metalRing = new THREE.Mesh(
      t.geo(new THREE.TorusGeometry(0.082, 0.015, 8, 20)),
      brushedSteelMat
    );
    metalRing.position.set(jk.x, 0, -0.315);
    audioGroup.add(metalRing);

    const bore = new THREE.Mesh(t.geo(new THREE.CylinderGeometry(0.068, 0.068, 0.1, 18)), cavityMat);
    bore.rotation.x = Math.PI / 2;
    bore.position.set(jk.x, 0, -0.285);
    audioGroup.add(bore);
  }
  registerGroup('audio-ports', audioGroup);

  // ── 17. SUBTLE FIBER-OPTIC PCB DATA PULSES (Sleek micro-pulses, never game blobs) ──
  const nbPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(2.1, pcbY + 0.028, -1.6),
    new THREE.Vector3(1.1, pcbY + 0.028, -1.55),
    new THREE.Vector3(0.1, pcbY + 0.028, -0.8),
    new THREE.Vector3(0.15, pcbY + 0.028, 0.75),
    new THREE.Vector3(1.8, pcbY + 0.028, 1.55),
  ]);
  const sbPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.1, pcbY + 0.028, -0.8),
    new THREE.Vector3(-0.7, pcbY + 0.028, 0.1),
    new THREE.Vector3(-1.45, pcbY + 0.028, 0.95),
    new THREE.Vector3(-2.65, pcbY + 0.028, 2.5),
  ]);

  const pulseGroup = new THREE.Group();
  const nbPulseMat = t.mat(new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
  const sbPulseMat = t.mat(new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
  const pulseGeo = t.geo(new THREE.SphereGeometry(0.042, 8, 8));
  const nbBeads: THREE.Mesh[] = [];
  const sbBeads: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const b1 = new THREE.Mesh(pulseGeo, nbPulseMat);
    pulseGroup.add(b1);
    nbBeads.push(b1);
    const b2 = new THREE.Mesh(pulseGeo, sbPulseMat);
    pulseGroup.add(b2);
    sbBeads.push(b2);
  }
  rootGroup.add(pulseGroup);

  // ── 18. SUBTLE ACTIVE COMPONENT SHEEN TRACKER (Replaces giant blue ring!) ──
  // Clone per-component accent meshes? Even cleaner: collect standard materials unique per group OR add subtle floating micro-rim accent.
  // Since materials are shared across groups for low draw calls, we add a razor-thin warm/cyan studio light-catch rim plane under/around the active component only? No—user specifically hates rings/boxes!
  // Instead, we use a dedicated moving Three.js PointLight (micro rim fill) inside rootGroup that hugs the active component + Studio SpotLight in Theater3DStageCanvas!
  const localRimLight = new THREE.PointLight(0x38bdf8, 0, 3.6, 2.0);
  localRimLight.position.set(2.1, 1.2, -1.6);
  rootGroup.add(localRimLight);

  let prevHighlightId: string | undefined = undefined;
  const _box = new THREE.Box3();
  const _center = new THREE.Vector3();

  return {
    rootGroup,
    componentGroups,
    update(elapsed, dt, activeHighlightId, mechAction, domainColor, isPlaying, reducedMotion) {
      const isMatot = mechAction === 'fault-matot';
      const isOverheat = mechAction === 'fault-overheat';
      const showHeatsink = mechAction === 'spin-fan' || isOverheat;

      // Smoothly reveal CPU heatsink ONLY when cooling/overheat or IPO process is active
      heatsinkGroup.visible = showHeatsink;
      if (showHeatsink && !reducedMotion && !isMatot) {
        const fanRate = isOverheat ? 1.8 : isPlaying ? 12.5 : 5.5;
        cpuFanRotor.rotation.y -= fanRate * dt;
      }

      // Gentle mechanical seating motion on the 1 installed RAM stick when RAM is discussed
      const targetRamY =
        mechAction === 'seat-ram' && !reducedMotion && isPlaying
          ? 0.16 + (Math.sin(elapsed * 2.2) * 0.5 + 0.5) * 0.32
          : 0.16;
      installedRamStick.position.y = THREE.MathUtils.damp(
        installedRamStick.position.y,
        targetRamY,
        6,
        dt
      );

      // Fiber-optic micro-pulses along Northbridge & Southbridge traces
      pulseGroup.visible = !isMatot;
      if (!isMatot && !reducedMotion) {
        const nbFast = mechAction === 'pulse-nb' ? 0.42 : 0.24;
        const sbFast = mechAction === 'pulse-sb' ? 0.36 : 0.18;
        nbBeads.forEach((b, i) => {
          nbPath.getPointAt((elapsed * nbFast + i * 0.25) % 1, b.position);
        });
        sbBeads.forEach((b, i) => {
          sbPath.getPointAt((elapsed * sbFast + i * 0.25) % 1, b.position);
        });
      }

      // Subtle RJ45 link LEDs
      greenLedMat.emissiveIntensity = isMatot ? 0 : 0.9;
      amberLedMat.emissiveIntensity = isMatot ? 0 : 0.5 + Math.sin(elapsed * 7) * 0.35;

      // Subtle tactile sheen fill light hugging active component (no flat rings!)
      if (activeHighlightId && componentGroups[activeHighlightId]) {
        if (activeHighlightId !== prevHighlightId) {
          prevHighlightId = activeHighlightId;
        }
        _box.setFromObject(componentGroups[activeHighlightId]);
        _box.getCenter(_center);
        localRimLight.position.x = THREE.MathUtils.damp(localRimLight.position.x, _center.x, 7, dt);
        localRimLight.position.y = THREE.MathUtils.damp(
          localRimLight.position.y,
          Math.max(0.95, _center.y + 0.72),
          7,
          dt
        );
        localRimLight.position.z = THREE.MathUtils.damp(
          localRimLight.position.z,
          _center.z < -3.2 ? _center.z - 0.85 : _center.z + 0.35,
          7,
          dt
        );
        _activeColor.set(domainColor);
        localRimLight.color.lerp(_activeColor, Math.min(1, dt * 8));
        const targetIntensity = isMatot ? 0.4 : 1.85 + Math.sin(elapsed * 2.5) * 0.2;
        localRimLight.intensity = THREE.MathUtils.damp(localRimLight.intensity, targetIntensity, 6, dt);
      } else {
        localRimLight.color.lerp(_zeroColor, Math.min(1, dt * 6));
        localRimLight.intensity = THREE.MathUtils.damp(localRimLight.intensity, 0, 6, dt);
      }
    },
    dispose: () => t.disposeAll(),
  };
}
