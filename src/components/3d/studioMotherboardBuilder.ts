import * as THREE from 'three';
import {
  createBrushedMetalTexture,
  createCmosCoinTexture,
  createMacroLga775GoldTexture,
  createStudioFloorTexture,
  createStudioPcbTextures,
} from './studioMotherboardTextures';
import {
  buildHollowAtxConnector,
  buildHollowCardSlot,
  buildHollowSataPort,
  buildHollowShroudedHeader,
  buildMacroBackPanelParts,
  buildNotchedRamStick,
} from './hardwareHollowGeometry';

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
      ...(pcbTexSet.bumpMap ? { bumpMap: pcbTexSet.bumpMap, bumpScale: 0.018 } : {}),
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
  standInst.computeBoundingSphere();
  screwInst.instanceMatrix.needsUpdate = true;
  screwInst.computeBoundingSphere();
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
  smdInst.computeBoundingSphere();
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
  const lgaTex = t.tex(createMacroLga775GoldTexture(maxAniso, textureScale));
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
  finInst.computeBoundingSphere();
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

  // ── 3. #02 4x HOLLOW DIMM RAM SLOTS (1 NOTCHED RAM STICK FLUSH-SEATED, 3 SLOTS OPEN!) ──
  const ramGroup = new THREE.Group();
  ramGroup.position.set(1.9, pcbY, 1.85);

  const dimmOffsetsZ = [-0.6, -0.2, 0.2, 0.6];
  let slot0LeftLatch: THREE.Mesh | undefined;
  let slot0RightLatch: THREE.Mesh | undefined;

  dimmOffsetsZ.forEach((dz, i) => {
    const builtSlot = buildHollowCardSlot(t, {
      length: 3.7,
      width: 0.24,
      height: 0.24,
      wallThickness: 0.048,
      notchOffsetX: -0.3,
      bodyMat: i % 2 === 0 ? hardSlateBluePlastic : hardBlackPlastic,
      cavityMat,
      goldMat,
      latchMat: hardIvoryPlastic,
      dualLatch: true,
      pinCount: 38,
    });
    builtSlot.group.position.set(0, 0, dz);
    if (i === 0) {
      slot0LeftLatch = builtSlot.leftLatch;
      slot0RightLatch = builtSlot.rightLatch;
    } else {
      // Empty slots keep retention clips visibly tilted open!
      if (builtSlot.leftLatch) builtSlot.leftLatch.rotation.z = 0.42;
      if (builtSlot.rightLatch) builtSlot.rightLatch.rotation.z = -0.42;
    }
    ramGroup.add(builtSlot.group);
  });

  // 1 Realistic Physically Notched RAM Stick seated deep & flush in Slot 0 (dz = -0.6)
  const ramPcbMat = t.mat(
    new THREE.MeshStandardMaterial({ color: 0x0f1a16, roughness: 0.45, metalness: 0.18 })
  );
  const installedRamStick = buildNotchedRamStick(t, {
    length: 3.58,
    height: 0.66,
    notchX: -0.3,
    pcbMat: ramPcbMat,
    spreaderMat: darkAnodizedMat,
    goldMat,
    icMat: icEpoxyMat,
    fullHeightSpreader: true,
  });
  installedRamStick.position.set(0, 0.035, -0.6);
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
  const pcie16Built = buildHollowCardSlot(t, {
    length: 2.95,
    width: 0.24,
    height: 0.23,
    wallThickness: 0.048,
    notchOffsetX: 0.76,
    bodyMat: hardSlateBluePlastic,
    cavityMat,
    goldMat,
    latchMat: hardIvoryPlastic,
    rearTab: true,
    rearTabSide: -1,
    pinCount: 34,
    rotateY: Math.PI / 2,
  });
  pcie16Built.group.position.set(-1.5, pcbY, -1.65);
  registerGroup('pcie-x16', pcie16Built.group);

  // ── 7. #06 PCIe x1 (SHORT OPEN HOLLOW TROUGH) ──
  const pcie1Built = buildHollowCardSlot(t, {
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
  pcie1Built.group.position.set(-2.4, pcbY, -2.5);
  registerGroup('pcie-x1', pcie1Built.group);

  // ── 8. #07 AGP SLOT (BROWN OPEN HOLLOW TROUGH) ──
  const agpBuilt = buildHollowCardSlot(t, {
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
    rearTabSide: -1,
    pinCount: 28,
    rotateY: Math.PI / 2,
  });
  agpBuilt.group.position.set(-2.7, pcbY, -1.2);
  registerGroup('agp-slot', agpBuilt.group);

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
    slot.group.position.set(dx, 0, 0);
    pciGroup.add(slot.group);
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
  const bpParts = buildMacroBackPanelParts(t, {
    pcbY,
    brushedSteelMat,
    darkAnodizedMat,
    hardBlackPlastic,
    hardSlateBluePlastic,
    cavityMat,
    goldMat,
    brassMat,
  });
  const { greenLedMat, amberLedMat } = bpParts;
  registerGroup('back-panel-block', bpParts.backPanelAnchor);
  registerGroup('ps2-mouse', bpParts.ps2Mouse);
  registerGroup('ps2-keyboard', bpParts.ps2Keyboard);
  registerGroup('parallel-port', bpParts.parallelPort);
  registerGroup('serial-port', bpParts.serialPort);
  registerGroup('spdif-port', bpParts.spdifPort);
  registerGroup('firewire-port', bpParts.firewirePort);
  registerGroup('rj45-port', bpParts.rj45Port);
  registerGroup('usb-ports', bpParts.usbPorts);
  registerGroup('audio-ports', bpParts.audioPorts);

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

      // Authentic full-depth mechanical seating motion + synchronized end retention clip locking!
      const targetRamY =
        mechAction === 'seat-ram' && !reducedMotion && isPlaying
          ? 0.035 + (Math.sin(elapsed * 2.2) * 0.5 + 0.5) * 0.32
          : 0.035;
      installedRamStick.position.y = THREE.MathUtils.damp(
        installedRamStick.position.y,
        targetRamY,
        6,
        dt
      );
      const clipOpenAngle =
        THREE.MathUtils.clamp((installedRamStick.position.y - 0.04) / 0.24, 0, 1) * 0.42;
      if (slot0LeftLatch) {
        slot0LeftLatch.rotation.z = THREE.MathUtils.damp(
          slot0LeftLatch.rotation.z,
          clipOpenAngle,
          10,
          dt
        );
      }
      if (slot0RightLatch) {
        slot0RightLatch.rotation.z = THREE.MathUtils.damp(
          slot0RightLatch.rotation.z,
          -clipOpenAngle,
          10,
          dt
        );
      }

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
