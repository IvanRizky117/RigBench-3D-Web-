import * as THREE from 'three';

export interface GeometryTracker {
  geo<T extends THREE.BufferGeometry>(g: T): T;
  mat<T extends THREE.Material>(m: T): T;
}

const _dummy = new THREE.Object3D();

export interface BuiltHollowCardSlot {
  group: THREE.Group;
  leftLatch?: THREE.Mesh;
  rightLatch?: THREE.Mesh;
  rearTab?: THREE.Mesh;
  notchX: number;
}

/**
 * Builds a true 3D hollow card/expansion slot (RAM DIMM, PCIe x16/x1, AGP, PCI)
 * with hard matte walls, dark recessed floor, exact physical notch divider bridge,
 * instanced gold internal contact fingers, and optional hinged retention latches.
 */
export function buildHollowCardSlot(
  t: GeometryTracker,
  opts: {
    length: number;
    width: number;
    height: number;
    wallThickness: number;
    notchFrac?: number;
    notchOffsetX?: number;
    bodyMat: THREE.Material;
    cavityMat: THREE.Material;
    goldMat: THREE.Material;
    dividerMat?: THREE.Material;
    latchMat?: THREE.Material;
    dualLatch?: boolean;
    rearTab?: boolean;
    rearTabSide?: 1 | -1;
    pinCount: number;
    rotateY?: number;
  }
): BuiltHollowCardSlot {
  const g = new THREE.Group();
  const { length, width, height, wallThickness, bodyMat, cavityMat, goldMat } = opts;

  const innerW = Math.max(0.055, width - wallThickness * 2);
  const notchX =
    opts.notchOffsetX !== undefined
      ? opts.notchOffsetX
      : -length / 2 + length * (opts.notchFrac ?? 0.45);

  // Deep dark recessed cavity floor
  const floor = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(length - wallThickness * 1.4, 0.024, innerW)),
    cavityMat
  );
  floor.position.y = 0.012;
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
  const capGeo = t.geo(new THREE.BoxGeometry(wallThickness * 1.4, height, width));
  const leftCap = new THREE.Mesh(capGeo, bodyMat);
  leftCap.position.set(-length / 2 + wallThickness * 0.7, height / 2, 0);
  g.add(leftCap);

  const rightCap = new THREE.Mesh(capGeo, bodyMat);
  rightCap.position.set(length / 2 - wallThickness * 0.7, height / 2, 0);
  g.add(rightCap);

  // Physical keying notch divider bridge inside the hollow trough
  const dividerH = height * 0.86;
  const divider = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(0.082, dividerH, innerW + 0.012)),
    opts.dividerMat ?? bodyMat
  );
  divider.position.set(notchX, 0.012 + dividerH / 2, 0);
  g.add(divider);

  // Instanced gleaming gold internal contact fingers along both inner walls (skipping notch bridge)
  const pinGeo = t.geo(new THREE.BoxGeometry(0.022, height * 0.62, 0.016));
  const totalPins = opts.pinCount * 2;
  const inst = new THREE.InstancedMesh(pinGeo, goldMat, totalPins);
  let idx = 0;
  const usable = length - wallThickness * 4;
  for (let i = 0; i < opts.pinCount; i++) {
    const px = -usable / 2 + (i / Math.max(1, opts.pinCount - 1)) * usable;
    if (Math.abs(px - notchX) < 0.082) continue;
    for (const side of [-1, 1]) {
      _dummy.position.set(px, height * 0.42, side * (innerW * 0.37));
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();
      inst.setMatrixAt(idx++, _dummy.matrix);
    }
  }
  inst.count = idx;
  inst.instanceMatrix.needsUpdate = true;
  inst.computeBoundingSphere();
  g.add(inst);

  let leftLatch: THREE.Mesh | undefined;
  let rightLatch: THREE.Mesh | undefined;
  let rearTab: THREE.Mesh | undefined;

  // Hinged DIMM end latches pivoted at base so rotation.z = 0 hooks cleanly into RAM side cutouts!
  if (opts.dualLatch && opts.latchMat) {
    const clipH = height + 0.14;
    const buildClipGeo = (inwardSign: 1 | -1) => {
      const shape = new THREE.Shape();
      // Main upright ear with an inward-pointing locking tooth near the top
      const w = 0.095;
      const hook = 0.055 * inwardSign;
      if (inwardSign === 1) {
        // Left clip: hooks toward +X (inward)
        shape.moveTo(-w * 0.5, 0);
        shape.lineTo(w * 0.5, 0);
        shape.lineTo(w * 0.5, clipH * 0.72);
        shape.lineTo(w * 0.5 + hook, clipH * 0.76);
        shape.lineTo(w * 0.5 + hook, clipH * 0.89);
        shape.lineTo(w * 0.5, clipH * 0.92);
        shape.lineTo(w * 0.35, clipH);
        shape.lineTo(-w * 0.65, clipH);
        shape.lineTo(-w * 0.65, clipH * 0.86);
        shape.lineTo(-w * 0.5, clipH * 0.75);
      } else {
        // Right clip: hooks toward -X (inward)
        shape.moveTo(-w * 0.5, 0);
        shape.lineTo(w * 0.5, 0);
        shape.lineTo(w * 0.5, clipH * 0.75);
        shape.lineTo(w * 0.65, clipH * 0.86);
        shape.lineTo(w * 0.65, clipH);
        shape.lineTo(-w * 0.35, clipH);
        shape.lineTo(-w * 0.5, clipH * 0.92);
        shape.lineTo(-w * 0.5 + hook, clipH * 0.89);
        shape.lineTo(-w * 0.5 + hook, clipH * 0.76);
        shape.lineTo(-w * 0.5, clipH * 0.72);
      }
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: width * 0.88,
        bevelEnabled: false,
      });
      geo.translate(0, 0, -(width * 0.44));
      return t.geo(geo);
    };

    leftLatch = new THREE.Mesh(buildClipGeo(1), opts.latchMat);
    leftLatch.position.set(-length / 2 - 0.045, 0.02, 0);
    leftLatch.castShadow = true;
    g.add(leftLatch);

    rightLatch = new THREE.Mesh(buildClipGeo(-1), opts.latchMat);
    rightLatch.position.set(length / 2 + 0.045, 0.02, 0);
    rightLatch.castShadow = true;
    g.add(rightLatch);
  }

  // Hinged PCIe / AGP rear retention tab pivoted at base
  if (opts.rearTab && opts.latchMat) {
    const tabSide = opts.rearTabSide ?? 1;
    const tabGeo = t.geo(new THREE.BoxGeometry(0.24, height * 1.15, 0.14));
    tabGeo.translate(0, height * 0.575, 0);
    rearTab = new THREE.Mesh(tabGeo, opts.latchMat);
    rearTab.position.set(tabSide * (length / 2 + 0.09), 0.02, 0);
    rearTab.castShadow = true;
    g.add(rearTab);
  }

  if (opts.rotateY) g.rotation.y = opts.rotateY;
  return { group: g, leftLatch, rightLatch, rearTab, notchX };
}

/**
 * Builds an authentic physically notched RAM DIMM stick pivoted at its bottom gold contact edge (y = 0).
 * Features a real ExtrudeGeometry PCB with an open U-shaped keying cutout at `notchX` (zero clipping!),
 * semicircular side clip locking cutouts, split left & right gold contact finger banks,
 * 8 BGA DRAM IC chips, and a brushed heatspreader bar.
 */
export function buildNotchedRamStick(
  t: GeometryTracker,
  opts: {
    length: number;
    height: number;
    notchX: number;
    pcbMat: THREE.Material;
    spreaderMat: THREE.Material;
    goldMat: THREE.Material;
    icMat: THREE.Material;
    notchPipMat?: THREE.Material;
    fullHeightSpreader?: boolean;
  }
): THREE.Group {
  const { length, height, notchX, pcbMat, spreaderMat, goldMat, icMat } = opts;
  const halfL = length / 2;
  const pcbThick = 0.052;
  const cutoutHalfW = 0.072; // 0.144 total empty U-cutout wrapping cleanly around 0.082 slot divider
  const cutoutH = 0.21;
  const clipNotchY0 = 0.285;
  const clipNotchY1 = 0.365;
  const clipNotchDepth = 0.07;

  const stick = new THREE.Group();

  // Sculpted RAM PCB with physical U-shaped bottom notch cutout + left/right clip locking notches
  const pcbShape = new THREE.Shape();
  pcbShape.moveTo(-halfL, 0);
  pcbShape.lineTo(notchX - cutoutHalfW, 0);
  pcbShape.lineTo(notchX - cutoutHalfW, cutoutH);
  pcbShape.lineTo(notchX + cutoutHalfW, cutoutH);
  pcbShape.lineTo(notchX + cutoutHalfW, 0);
  pcbShape.lineTo(halfL, 0);
  // Right side edge with physical clip locking notch
  pcbShape.lineTo(halfL, clipNotchY0);
  pcbShape.lineTo(halfL - clipNotchDepth, clipNotchY0 + 0.015);
  pcbShape.lineTo(halfL - clipNotchDepth, clipNotchY1 - 0.015);
  pcbShape.lineTo(halfL, clipNotchY1);
  pcbShape.lineTo(halfL, height);
  // Top edge
  pcbShape.lineTo(-halfL, height);
  // Left side edge with physical clip locking notch
  pcbShape.lineTo(-halfL, clipNotchY1);
  pcbShape.lineTo(-halfL + clipNotchDepth, clipNotchY1 - 0.015);
  pcbShape.lineTo(-halfL + clipNotchDepth, clipNotchY0 + 0.015);
  pcbShape.lineTo(-halfL, clipNotchY0);
  pcbShape.closePath();

  const pcbGeo = t.geo(
    new THREE.ExtrudeGeometry(pcbShape, {
      depth: pcbThick,
      bevelEnabled: false,
    })
  );
  pcbGeo.translate(0, 0, -pcbThick / 2);
  const pcbMesh = new THREE.Mesh(pcbGeo, pcbMat);
  pcbMesh.castShadow = true;
  pcbMesh.receiveShadow = true;
  stick.add(pcbMesh);

  // Split Left & Right Gold Edge Contact Banks (strictly clear of the empty U-cutout!)
  const goldH = 0.105;
  const goldThick = pcbThick + 0.012;
  const leftStart = -halfL + 0.05;
  const leftEnd = notchX - cutoutHalfW - 0.014;
  const leftLen = Math.max(0.1, leftEnd - leftStart);
  const goldLeft = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(leftLen, goldH, goldThick)),
    goldMat
  );
  goldLeft.position.set((leftStart + leftEnd) / 2, goldH / 2 + 0.004, 0);
  stick.add(goldLeft);

  const rightStart = notchX + cutoutHalfW + 0.014;
  const rightEnd = halfL - 0.05;
  const rightLen = Math.max(0.1, rightEnd - rightStart);
  const goldRight = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(rightLen, goldH, goldThick)),
    goldMat
  );
  goldRight.position.set((rightStart + rightEnd) / 2, goldH / 2 + 0.004, 0);
  stick.add(goldRight);

  // Fine gold contact finger teeth ribs along both sides of the edge connector
  const toothGeo = t.geo(new THREE.BoxGeometry(0.02, goldH * 0.88, goldThick + 0.006));
  const toothPositions: number[] = [];
  for (let x = leftStart + 0.04; x < leftEnd - 0.03; x += 0.075) toothPositions.push(x);
  for (let x = rightStart + 0.04; x < rightEnd - 0.03; x += 0.075) toothPositions.push(x);
  if (toothPositions.length > 0) {
    const teeth = new THREE.InstancedMesh(toothGeo, goldMat, toothPositions.length);
    toothPositions.forEach((tx, idx) => {
      _dummy.position.set(tx, goldH / 2 + 0.005, 0);
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();
      teeth.setMatrixAt(idx, _dummy.matrix);
    });
    teeth.instanceMatrix.needsUpdate = true;
    teeth.computeBoundingSphere();
    stick.add(teeth);
  }

  // Heatspreader bar (studio full-skirt or sleek top rail)
  if (opts.fullHeightSpreader) {
    const spH = height * 0.56;
    const spreader = new THREE.Mesh(
      t.geo(new THREE.BoxGeometry(length - 0.04, spH, pcbThick + 0.032)),
      spreaderMat
    );
    spreader.position.y = height - spH / 2 + 0.01;
    spreader.castShadow = true;
    stick.add(spreader);
  } else {
    const spH = 0.13;
    const spreader = new THREE.Mesh(
      t.geo(new THREE.BoxGeometry(length - 0.02, spH, pcbThick + 0.036)),
      spreaderMat
    );
    spreader.position.y = height - spH / 2 + 0.015;
    spreader.castShadow = true;
    stick.add(spreader);
  }

  // 8 BGA DRAM IC chips along lower-mid PCB
  const icW = length * 0.076;
  const icGeo = t.geo(new THREE.BoxGeometry(icW, 0.19, pcbThick + 0.034));
  const icInst = new THREE.InstancedMesh(icGeo, icMat, 8);
  const icSpan = length * 0.78;
  for (let c = 0; c < 8; c++) {
    const ix = -icSpan / 2 + (c / 7) * icSpan;
    _dummy.position.set(ix, height * 0.52, 0);
    _dummy.rotation.set(0, 0, 0);
    _dummy.scale.set(1, 1, 1);
    _dummy.updateMatrix();
    icInst.setMatrixAt(c, _dummy.matrix);
  }
  icInst.instanceMatrix.needsUpdate = true;
  icInst.computeBoundingSphere();
  stick.add(icInst);

  // Optional top alignment pip right above the notch X coordinate (for Lab 3D lock flash)
  if (opts.notchPipMat) {
    const pip = new THREE.Mesh(
      t.geo(new THREE.BoxGeometry(0.13, 0.075, pcbThick + 0.048)),
      opts.notchPipMat
    );
    pip.position.set(notchX, height + 0.025, 0);
    stick.add(pip);
  }

  return stick;
}

/**
 * Builds an authentic LGA 775 CPU substrate with 2 physical asymmetric side keying notches
 * matching the socket wall lugs, plus beveled nickel IHS and golden Pin-1 corner triangle.
 */
export function buildNotchedCpuChip(
  t: GeometryTracker,
  opts: {
    pcbMat: THREE.Material;
    ihsMat: THREE.Material;
    triMat: THREE.Material;
  }
): THREE.Group {
  const cpu = new THREE.Group();
  const s = 0.74; // 1.48 x 1.48 substrate
  const keyZ = -0.32;
  const keyHalf = 0.075;
  const keyDepth = 0.075;

  // Substrate extruded horizontally along Y (draw in X-Y then rotateX(Math.PI/2) so shape Y -> +Z)
  const subShape = new THREE.Shape();
  subShape.moveTo(-s, -s);
  subShape.lineTo(s, -s);
  // Right edge (+X) with physical LGA 775 keying notch at z = keyZ
  subShape.lineTo(s, keyZ - keyHalf);
  subShape.lineTo(s - keyDepth, keyZ - keyHalf * 0.7);
  subShape.lineTo(s - keyDepth, keyZ + keyHalf * 0.7);
  subShape.lineTo(s, keyZ + keyHalf);
  subShape.lineTo(s, s);
  // Front edge (+Z)
  subShape.lineTo(-s + 0.14, s);
  // Chamfered Pin-1 corner at (-s, +s)
  subShape.lineTo(-s, s - 0.14);
  // Left edge (-X) with physical LGA 775 keying notch at z = keyZ
  subShape.lineTo(-s, keyZ + keyHalf);
  subShape.lineTo(-s + keyDepth, keyZ + keyHalf * 0.7);
  subShape.lineTo(-s + keyDepth, keyZ - keyHalf * 0.7);
  subShape.lineTo(-s, keyZ - keyHalf);
  subShape.closePath();

  const subGeo = t.geo(
    new THREE.ExtrudeGeometry(subShape, {
      depth: 0.055,
      bevelEnabled: false,
    })
  );
  subGeo.rotateX(Math.PI / 2);
  const subMesh = new THREE.Mesh(subGeo, opts.pcbMat);
  subMesh.position.y = 0.055;
  subMesh.castShadow = true;
  cpu.add(subMesh);

  // Nickel-plated Integrated Heat Spreader (IHS)
  const ihs = new THREE.Mesh(t.geo(new THREE.BoxGeometry(1.18, 0.085, 1.18)), opts.ihsMat);
  ihs.position.y = 0.095;
  ihs.castShadow = true;
  cpu.add(ihs);

  // Golden Pin-1 corner triangle aligned at (-0.58, +0.58)
  const tri = new THREE.Mesh(t.geo(new THREE.ConeGeometry(0.115, 0.032, 3)), opts.triMat);
  tri.position.set(-0.58, 0.072, 0.58);
  cpu.add(tri);

  return cpu;
}

/**
 * Builds a true hollow shrouded header (IDE 40-pin / Floppy 34-pin)
 * with 4 walls, front central key notch cutout, dark recessed floor, and 2 rows of brass pins.
 */
export function buildHollowShroudedHeader(
  t: GeometryTracker,
  opts: {
    cols: number;
    length: number;
    width: number;
    height: number;
    shroudMat: THREE.Material;
    cavityMat: THREE.Material;
    brassMat: THREE.Material;
    pin1MarkMat?: THREE.Material;
    pin1Side?: 1 | -1;
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

  // Back continuous wall (-Z)
  const backWall = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(length, height, wall)),
    shroudMat
  );
  backWall.position.set(0, height / 2, -(innerW + wall) / 2);
  backWall.castShadow = true;
  g.add(backWall);

  // Front wall (+Z) split in two for authentic central key notch cutout
  const notchGap = 0.24;
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

  // Optional red Pin-1 side indicator strip
  if (opts.pin1MarkMat) {
    const p1Side = opts.pin1Side ?? 1;
    const p1Mark = new THREE.Mesh(
      t.geo(new THREE.BoxGeometry(0.055, height * 0.96, width + 0.014)),
      opts.pin1MarkMat
    );
    p1Mark.position.set(p1Side * (length / 2 - 0.03), height * 0.48, 0);
    g.add(p1Mark);
  }

  // Instanced standing brass pins (2 rows x cols, omitting Pin 20 key on 40-pin IDE)
  const pinGeo = t.geo(new THREE.BoxGeometry(0.022, height * 0.82, 0.022));
  const pinInst = new THREE.InstancedMesh(pinGeo, brassMat, cols * 2);
  let idx = 0;
  const span = innerL - 0.14;
  for (let c = 0; c < cols; c++) {
    const px = -span / 2 + (c / Math.max(1, cols - 1)) * span;
    for (const r of [-1, 1]) {
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
  pinInst.computeBoundingSphere();
  g.add(pinInst);

  return g;
}

/**
 * Builds an authentic ATX 24-pin (12x2) or ATX12V 4-pin (2x2) connector
 * with individual walled square hollow cells, recessed brass terminal pins, and side retention catch tab.
 */
export function buildHollowAtxConnector(
  t: GeometryTracker,
  cols: number,
  rows: number,
  shellMat: THREE.Material,
  cavityMat: THREE.Material,
  metalMat: THREE.Material,
  cellSize = 0.14
): THREE.Group {
  const g = new THREE.Group();
  const cell = cellSize;
  const wall = 0.026;
  const height = 0.35;
  const totalL = cols * cell + wall;
  const totalW = rows * cell + wall;

  // Deep dark recessed base inside all holes
  const darkCore = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(totalL - wall * 1.4, 0.045, totalW - wall * 1.4)),
    cavityMat
  );
  darkCore.position.y = 0.032;
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

  // Vertical cell dividers creating true individual square hollow sockets
  if (cols > 1) {
    const divGeo = t.geo(new THREE.BoxGeometry(wall, height * 0.96, totalW - wall));
    const divInst = new THREE.InstancedMesh(divGeo, shellMat, cols - 1);
    for (let c = 1; c < cols; c++) {
      const dx = -totalL / 2 + wall / 2 + c * cell;
      _dummy.position.set(dx, height * 0.48, 0);
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();
      divInst.setMatrixAt(c - 1, _dummy.matrix);
    }
    divInst.instanceMatrix.needsUpdate = true;
    divInst.computeBoundingSphere();
    g.add(divInst);
  }

  // Instanced brass terminal pins seated deep inside each hole
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
  pinInst.computeBoundingSphere();
  g.add(pinInst);

  // Front (+Z) side locking catch tab that mates with the cable plug retention clip
  const clip = new THREE.Mesh(
    t.geo(new THREE.BoxGeometry(Math.min(0.32, totalL * 0.48), 0.11, 0.055)),
    shellMat
  );
  clip.position.set(0, height * 0.72, totalW / 2 + 0.025);
  g.add(clip);

  return g;
}

/**
 * Builds an authentic L-shaped hollow SATA port with 7 gold contacts.
 */
export function buildHollowSataPort(
  t: GeometryTracker,
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

  // 7 gleaming gold contact strips along the L-tongue (single InstancedMesh to cut draw calls)
  const contactGeo = t.geo(new THREE.BoxGeometry(0.022, h * 0.62, 0.012));
  const contactInst = new THREE.InstancedMesh(contactGeo, goldMat, 7);
  for (let i = 0; i < 7; i++) {
    _dummy.position.set(-0.15 + i * 0.044, h * 0.4, 0.012);
    _dummy.rotation.set(0, 0, 0);
    _dummy.scale.set(1, 1, 1);
    _dummy.updateMatrix();
    contactInst.setMatrixAt(i, _dummy.matrix);
  }
  contactInst.instanceMatrix.needsUpdate = true;
  contactInst.computeBoundingSphere();
  g.add(contactInst);

  return g;
}

/**
 * Macro-authentic Mini-DIN 6-pin PS/2 port with 6 circular holes + key slot.
 */
export function buildMacroPs2Port(
  t: GeometryTracker,
  colorHex: number,
  metalMat: THREE.Material,
  cavityMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  const can = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.56, 0.34, 0.56)), metalMat);
  can.castShadow = true;
  g.add(can);

  const collarMat = t.mat(
    new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.44, metalness: 0.08 })
  );
  const collar = new THREE.Mesh(t.geo(new THREE.CylinderGeometry(0.145, 0.145, 0.07, 24)), collarMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0, -0.27);
  g.add(collar);

  const bore = new THREE.Mesh(t.geo(new THREE.CylinderGeometry(0.115, 0.115, 0.04, 22)), cavityMat);
  bore.rotation.x = Math.PI / 2;
  bore.position.set(0, 0, -0.292);
  g.add(bore);

  const innerFace = new THREE.Mesh(t.geo(new THREE.CylinderGeometry(0.102, 0.102, 0.018, 20)), collarMat);
  innerFace.rotation.x = Math.PI / 2;
  innerFace.position.set(0, 0, -0.295);
  g.add(innerFace);

  const holeGeo = t.geo(new THREE.CylinderGeometry(0.014, 0.014, 0.03, 10));
  const pinOffsets: Array<[number, number]> = [
    [-0.048, 0.048],
    [0.048, 0.048],
    [-0.068, 0.0],
    [0.068, 0.0],
    [-0.042, -0.052],
    [0.042, -0.052],
  ];
  const holeInst = new THREE.InstancedMesh(holeGeo, cavityMat, pinOffsets.length);
  pinOffsets.forEach(([hx, hy], idx) => {
    _dummy.position.set(hx, hy, -0.302);
    _dummy.rotation.set(Math.PI / 2, 0, 0);
    _dummy.scale.set(1, 1, 1);
    _dummy.updateMatrix();
    holeInst.setMatrixAt(idx, _dummy.matrix);
  });
  holeInst.instanceMatrix.needsUpdate = true;
  holeInst.computeBoundingSphere();
  g.add(holeInst);

  const keySlot = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.042, 0.046, 0.032)), cavityMat);
  keySlot.position.set(0, 0.008, -0.302);
  g.add(keySlot);

  return g;
}

/**
 * Macro-authentic D-Sub port (DB25 Female with 25 recessed holes OR DB9 Male with 9 brass pins).
 */
export function buildMacroDSubPort(
  t: GeometryTracker,
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

  const body = new THREE.Mesh(t.geo(new THREE.BoxGeometry(width, height, 0.44)), metalMat);
  body.castShadow = true;
  g.add(body);

  const flange = new THREE.Mesh(t.geo(new THREE.BoxGeometry(width + 0.34, height + 0.05, 0.05)), metalMat);
  flange.position.set(0, 0, -0.23);
  g.add(flange);

  const nutGeo = t.geo(new THREE.CylinderGeometry(0.055, 0.055, 0.11, 6));
  const nutHoleGeo = t.geo(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 8));
  for (const s of [-1, 1]) {
    const nut = new THREE.Mesh(nutGeo, metalMat);
    nut.rotation.x = Math.PI / 2;
    nut.position.set(s * (width / 2 + 0.09), 0, -0.28);
    g.add(nut);
    const nutHole = new THREE.Mesh(nutHoleGeo, cavityMat);
    nutHole.rotation.x = Math.PI / 2;
    nutHole.position.set(s * (width / 2 + 0.09), 0, -0.325);
    g.add(nutHole);
  }

  const rim = new THREE.Mesh(t.geo(new THREE.BoxGeometry(width - 0.08, height - 0.04, 0.1)), metalMat);
  rim.position.set(0, 0, -0.26);
  g.add(rim);

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
    const trim = new THREE.Mesh(t.geo(new THREE.BoxGeometry(width - 0.12, height - 0.07, 0.015)), faceMat);
    trim.position.set(0, 0, -0.295);
    g.add(trim);
  }

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
  inst.computeBoundingSphere();
  g.add(inst);

  return g;
}

export interface MacroBackPanelParts {
  backPanelAnchor: THREE.Group;
  ps2Mouse: THREE.Group;
  ps2Keyboard: THREE.Group;
  parallelPort: THREE.Group;
  serialPort: THREE.Group;
  spdifPort: THREE.Group;
  firewirePort: THREE.Group;
  rj45Port: THREE.Group;
  usbPorts: THREE.Group;
  audioPorts: THREE.Group;
  greenLedMat: THREE.MeshStandardMaterial;
  amberLedMat: THREE.MeshStandardMaterial;
}

/**
 * Builds the complete macro-authentic Back Panel I/O cluster (#15–#24)
 * with steel EMI cans, 6-hole PS/2, 25-hole DB25, 9-pin DB9, Coax/Toslink SPDIF,
 * FireWire, 8-pin RJ45 + LEDs, dual-stack USB with tongues & gold pads, and 3.5mm audio jacks.
 */
export function buildMacroBackPanelParts(
  t: GeometryTracker,
  opts: {
    pcbY: number;
    brushedSteelMat: THREE.Material;
    darkAnodizedMat: THREE.Material;
    hardBlackPlastic: THREE.Material;
    hardSlateBluePlastic: THREE.Material;
    cavityMat: THREE.Material;
    goldMat: THREE.Material;
    brassMat: THREE.Material;
  }
): MacroBackPanelParts {
  const {
    pcbY,
    brushedSteelMat,
    darkAnodizedMat,
    hardBlackPlastic,
    hardSlateBluePlastic,
    cavityMat,
    goldMat,
    brassMat,
  } = opts;

  const backPanelAnchor = new THREE.Group();
  backPanelAnchor.position.set(0, pcbY, -3.72);
  const ioPlate = new THREE.Mesh(t.geo(new THREE.BoxGeometry(7.2, 0.88, 0.04)), darkAnodizedMat);
  ioPlate.position.set(0.22, 0.44, -0.02);
  backPanelAnchor.add(ioPlate);

  const ps2Mouse = buildMacroPs2Port(t, 0x10b981, brushedSteelMat, cavityMat);
  ps2Mouse.position.set(3.35, pcbY + 0.56, -3.72);

  const ps2Keyboard = buildMacroPs2Port(t, 0x8b5cf6, brushedSteelMat, cavityMat);
  ps2Keyboard.position.set(3.35, pcbY + 0.2, -3.72);

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

  const spdifPort = new THREE.Group();
  spdifPort.position.set(0.65, pcbY + 0.26, -3.72);
  const spdifCan = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.56, 0.44, 0.5)), brushedSteelMat);
  spdifCan.castShadow = true;
  spdifPort.add(spdifCan);
  const rcaOuter = new THREE.Mesh(t.geo(new THREE.CylinderGeometry(0.11, 0.11, 0.14, 20)), goldMat);
  rcaOuter.rotation.x = Math.PI / 2;
  rcaOuter.position.set(-0.11, 0.0, -0.29);
  spdifPort.add(rcaOuter);
  const rcaPlastic = new THREE.Mesh(
    t.geo(new THREE.CylinderGeometry(0.082, 0.082, 0.15, 18)),
    t.mat(new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 }))
  );
  rcaPlastic.rotation.x = Math.PI / 2;
  rcaPlastic.position.set(-0.11, 0.0, -0.295);
  spdifPort.add(rcaPlastic);
  const rcaHole = new THREE.Mesh(t.geo(new THREE.CylinderGeometry(0.044, 0.044, 0.08, 16)), cavityMat);
  rcaHole.rotation.x = Math.PI / 2;
  rcaHole.position.set(-0.11, 0.0, -0.34);
  spdifPort.add(rcaHole);
  const toslink = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.15, 0.15, 0.08)), cavityMat);
  toslink.position.set(0.13, 0, -0.24);
  spdifPort.add(toslink);

  const firewirePort = new THREE.Group();
  firewirePort.position.set(-0.35, pcbY + 0.52, -3.72);
  const fwCan = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.46, 0.34, 0.5)), brushedSteelMat);
  fwCan.castShadow = true;
  firewirePort.add(fwCan);
  const fwHole = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.32, 0.14, 0.08)), cavityMat);
  fwHole.position.set(0, 0, -0.24);
  firewirePort.add(fwHole);
  const fwTongue = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.24, 0.036, 0.06)), hardBlackPlastic);
  fwTongue.position.set(0, 0, -0.245);
  firewirePort.add(fwTongue);

  const rj45Port = new THREE.Group();
  rj45Port.position.set(-1.45, pcbY + 0.62, -3.72);
  const rjCan = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.62, 0.42, 0.56)), brushedSteelMat);
  rjCan.castShadow = true;
  rj45Port.add(rjCan);
  const rjMainHole = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.42, 0.24, 0.14)), cavityMat);
  rjMainHole.position.set(0, -0.02, -0.24);
  rj45Port.add(rjMainHole);
  const rjTopStep = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.18, 0.09, 0.14)), cavityMat);
  rjTopStep.position.set(0, 0.12, -0.24);
  rj45Port.add(rjTopStep);
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
  rjPins.computeBoundingSphere();
  rj45Port.add(rjPins);

  const greenLedMat = t.mat(
    new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.9 })
  );
  const amberLedMat = t.mat(
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.7 })
  );
  const ledL = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.065, 0.045, 0.02)), greenLedMat);
  ledL.position.set(-0.22, 0.15, -0.285);
  rj45Port.add(ledL);
  const ledR = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.065, 0.045, 0.02)), amberLedMat);
  ledR.position.set(0.22, 0.15, -0.285);
  rj45Port.add(ledR);

  const usbPorts = new THREE.Group();
  usbPorts.position.set(-1.45, pcbY + 0.22, -3.72);
  const usbCan = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.62, 0.38, 0.54)), brushedSteelMat);
  usbCan.castShadow = true;
  usbPorts.add(usbCan);
  const usbPadGeo = t.geo(new THREE.BoxGeometry(0.042, 0.014, 0.08));
  const usbPadsInst = new THREE.InstancedMesh(usbPadGeo, goldMat, 8);
  let usbPadIdx = 0;
  for (const dy of [-0.085, 0.085]) {
    const hole = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.44, 0.125, 0.14)), cavityMat);
    hole.position.set(0, dy, -0.23);
    usbPorts.add(hole);
    const tongue = new THREE.Mesh(t.geo(new THREE.BoxGeometry(0.38, 0.036, 0.11)), hardSlateBluePlastic);
    tongue.position.set(0, dy + 0.026, -0.235);
    usbPorts.add(tongue);
    for (let p = 0; p < 4; p++) {
      _dummy.position.set(-0.12 + p * 0.08, dy + 0.005, -0.245);
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();
      usbPadsInst.setMatrixAt(usbPadIdx++, _dummy.matrix);
    }
  }
  usbPadsInst.instanceMatrix.needsUpdate = true;
  usbPadsInst.computeBoundingSphere();
  usbPorts.add(usbPadsInst);

  const audioPorts = new THREE.Group();
  audioPorts.position.set(-2.85, pcbY + 0.4, -3.72);
  const audioCan = new THREE.Mesh(t.geo(new THREE.BoxGeometry(1.12, 0.48, 0.52)), brushedSteelMat);
  audioCan.castShadow = true;
  audioPorts.add(audioCan);
  const jackSpecs: Array<{ x: number; color: number }> = [
    { x: -0.34, color: 0x3b82f6 },
    { x: 0.0, color: 0x10b981 },
    { x: 0.34, color: 0xec4899 },
  ];
  for (const jk of jackSpecs) {
    const jMat = t.mat(
      new THREE.MeshStandardMaterial({ color: jk.color, roughness: 0.38, metalness: 0.12 })
    );
    const bezel = new THREE.Mesh(t.geo(new THREE.CylinderGeometry(0.125, 0.135, 0.08, 22)), jMat);
    bezel.rotation.x = Math.PI / 2;
    bezel.position.set(jk.x, 0, -0.275);
    audioPorts.add(bezel);
    const metalRing = new THREE.Mesh(
      t.geo(new THREE.TorusGeometry(0.082, 0.015, 8, 20)),
      brushedSteelMat
    );
    metalRing.position.set(jk.x, 0, -0.315);
    audioPorts.add(metalRing);
    const bore = new THREE.Mesh(t.geo(new THREE.CylinderGeometry(0.068, 0.068, 0.1, 18)), cavityMat);
    bore.rotation.x = Math.PI / 2;
    bore.position.set(jk.x, 0, -0.285);
    audioPorts.add(bore);
  }

  return {
    backPanelAnchor,
    ps2Mouse,
    ps2Keyboard,
    parallelPort,
    serialPort,
    spdifPort,
    firewirePort,
    rj45Port,
    usbPorts,
    audioPorts,
    greenLedMat,
    amberLedMat,
  };
}
