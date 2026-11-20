import * as THREE from 'three';
import { MAINBOARD_COMPONENTS } from '../../data/mainboardData';
import type { CPanelWireId, FPanelZoneId, HddJumperMode } from '../../types/rigbench';
import {
  createFPanelLegendTexture,
  createHddLabelTexture,
  createHddRearLegendTexture,
  createLga775PinGridTexture,
  createProceduralPcbMaps,
  createWorkbenchMatTexture,
} from '../../utils/pcbTextureGenerator';

export interface AssemblyPartsRefs {
  cpuLever: THREE.Group;
  cpuRetentionPlate: THREE.Group;
  cpuChip: THREE.Group;
  cpuAlignGlowMat: THREE.MeshStandardMaterial;
  thermalPaste: THREE.Mesh;
  cpuHeatsink: THREE.Group;
  cpuFanRotor: THREE.Group;
  heatsinkPushPins: THREE.Group[];
  heatsinkPinRingMats: THREE.MeshStandardMaterial[];
  ramClips1Left: THREE.Mesh;
  ramClips1Right: THREE.Mesh;
  ramClips2Left: THREE.Mesh;
  ramClips2Right: THREE.Mesh;
  ramStick1: THREE.Group;
  ramStick2: THREE.Group;
  ram1AlignGlowMat: THREE.MeshStandardMaterial;
  ram2AlignGlowMat: THREE.MeshStandardMaterial;
  cmosCoin: THREE.Mesh;
  vgaCard: THREE.Group;
  vgaBracketScrew: THREE.Group;
  vgaScrewGlowMat: THREE.MeshStandardMaterial;
  pcie16Latch: THREE.Mesh;
  hddUnitGroup: THREE.Group;
  hddJumperCap: THREE.Mesh;
  hddJumperColMats: Record<HddJumperMode, THREE.MeshStandardMaterial>;
  hddRearPortMats: {
    ide: THREE.MeshStandardMaterial;
    molex: THREE.MeshStandardMaterial;
  };
  ideRibbonPartial: THREE.Group;
  ideRibbonCable: THREE.Group;
  hddMolexCable: THREE.Group;
  atx24CableBundle: THREE.Group;
  atx4CableBundle: THREE.Group;
  atx4PinGlowMat: THREE.MeshStandardMaterial;
  fPanelZoneMats: Record<FPanelZoneId, THREE.MeshStandardMaterial>;
  cpanelConnectedWires: THREE.Group;
  cpanelWiresById: Record<CPanelWireId, THREE.Group>;
  cpanelLooseWiresById: Record<CPanelWireId, THREE.Group>;
  routeCPanelWireToZone: (wireId: CPanelWireId, zoneId: FPanelZoneId) => void;
  powerLedMat: THREE.MeshStandardMaterial;
  hddLedMat: THREE.MeshStandardMaterial;
}

export interface DataFlowSystem {
  group: THREE.Group;
  update: (elapsed: number) => void;
}

export interface BuiltMotherboardScene {
  rootGroup: THREE.Group;
  boardGroup: THREE.Group;
  workbenchMesh: THREE.Mesh;
  hitboxes: THREE.Mesh[];
  highlightRing: THREE.Mesh;
  targetGuideRing: THREE.Mesh;
  secondaryGuideRings: THREE.Mesh[];
  assemblyParts: AssemblyPartsRefs;
  dataFlow: DataFlowSystem;
  dispose: () => void;
}

export function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function buildProceduralMotherboard(maxAnisotropy: number): BuiltMotherboardScene {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  const rootGroup = new THREE.Group();
  const boardGroup = new THREE.Group();
  rootGroup.add(boardGroup);

  // 1. Anti-Static Workbench Mat
  const matTex = createWorkbenchMatTexture(maxAnisotropy);
  textures.push(matTex);
  const workbenchGeo = trackGeo(new THREE.BoxGeometry(20.5, 0.25, 15.2));
  const workbenchMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: matTex,
      roughness: 0.88,
      metalness: 0.05,
    })
  );
  const workbenchMesh = new THREE.Mesh(workbenchGeo, workbenchMat);
  workbenchMesh.position.set(1.0, -0.14, 0.7);
  workbenchMesh.receiveShadow = true;
  rootGroup.add(workbenchMesh);

  // 2. Main PCB Substrate (2048x1720 PBR Maps + Clearcoat Resin Solder Mask)
  const pcbMaps = createProceduralPcbMaps(maxAnisotropy);
  const pcbGeo = trackGeo(new THREE.BoxGeometry(10.0, 0.16, 8.4));
  const pcbTopMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      map: pcbMaps.albedoMap,
      bumpMap: pcbMaps.bumpMap,
      bumpScale: 0.028,
      roughnessMap: pcbMaps.roughnessMap,
      roughness: 0.36,
      metalness: 0.14,
      clearcoat: 0.48,
      clearcoatRoughness: 0.24,
    })
  );
  const pcbEdgeMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1e2c3a,
      roughness: 0.72,
      metalness: 0.1,
    })
  );
  const pcbMesh = new THREE.Mesh(pcbGeo, [
    pcbEdgeMat,
    pcbEdgeMat,
    pcbTopMat,
    pcbEdgeMat,
    pcbEdgeMat,
    pcbEdgeMat,
  ]);
  pcbMesh.position.set(0, 0.08, 0);
  pcbMesh.castShadow = true;
  pcbMesh.receiveShadow = true;
  boardGroup.add(pcbMesh);

  // Shared Blender-Grade PBR Materials
  const brushedAlumMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xd4dbe6,
      metalness: 0.92,
      roughness: 0.24,
      anisotropy: 0.65,
    })
  );
  const darkAnodizedMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x263040,
      metalness: 0.84,
      roughness: 0.32,
    })
  );
  const steelMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xc5cedb,
      metalness: 0.94,
      roughness: 0.18,
    })
  );
  const goldMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xeab308,
      metalness: 0.96,
      roughness: 0.14,
      clearcoat: 0.32,
    })
  );
  const mattePlasticBlack = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x161b24,
      roughness: 0.68,
      metalness: 0.06,
    })
  );
  const mattePlasticIvory = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.58,
      metalness: 0.04,
    })
  );
  const slotCyanMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x0e7490, roughness: 0.54, metalness: 0.08 })
  );
  const slotOrangeMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.52, metalness: 0.08 })
  );
  const slotAmberMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.56, metalness: 0.08 })
  );
  const slotBlueMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.52, metalness: 0.08 })
  );
  const darkIcMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x11151d, roughness: 0.5, metalness: 0.16 })
  );
  const copperMat = trackMat(
    new THREE.MeshPhysicalMaterial({ color: 0xb87333, metalness: 0.92, roughness: 0.24 })
  );

  // 3. #01 SOKET PROSESOR LGA 775 (775 Pin Grid + Hinged Load Plate + Curved Lever + CPU + Thermal Paste + Radial Heatsink/Fan)
  const cpuGroup = new THREE.Group();
  cpuGroup.position.set(2.1, 0.16, -1.6);
  boardGroup.add(cpuGroup);

  const socketBase = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.15, 0.12, 2.15)),
    mattePlasticBlack
  );
  socketBase.position.y = 0.06;
  socketBase.castShadow = true;
  cpuGroup.add(socketBase);

  const pinGridTex = createLga775PinGridTexture(maxAnisotropy);
  textures.push(pinGridTex);
  const pinBed = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.56, 0.03, 1.56)),
    trackMat(
      new THREE.MeshPhysicalMaterial({
        map: pinGridTex,
        metalness: 0.72,
        roughness: 0.34,
      })
    )
  );
  pinBed.position.y = 0.125;
  cpuGroup.add(pinBed);

  // Hinged Steel Retention Load Plate
  const cpuRetentionPlate = new THREE.Group();
  cpuRetentionPlate.position.set(0, 0.14, -1.02);
  const frameShape = new THREE.Shape();
  frameShape.moveTo(-1.02, 0);
  frameShape.lineTo(1.02, 0);
  frameShape.lineTo(1.02, 2.04);
  frameShape.lineTo(-1.02, 2.04);
  frameShape.closePath();
  const frameHole = new THREE.Path();
  frameHole.moveTo(-0.74, 0.28);
  frameHole.lineTo(0.74, 0.28);
  frameHole.lineTo(0.74, 1.76);
  frameHole.lineTo(-0.74, 1.76);
  frameHole.closePath();
  frameShape.holes.push(frameHole);

  const frameGeo = trackGeo(
    new THREE.ExtrudeGeometry(frameShape, {
      depth: 0.07,
      bevelEnabled: true,
      bevelThickness: 0.014,
      bevelSize: 0.014,
      bevelSegments: 2,
    })
  );
  frameGeo.rotateX(Math.PI / 2);
  const retentionMesh = new THREE.Mesh(frameGeo, steelMat);
  retentionMesh.position.y = 0.06;
  retentionMesh.castShadow = true;
  cpuRetentionPlate.add(retentionMesh);
  cpuGroup.add(cpuRetentionPlate);

  // Curved ZIF steel locking lever
  const cpuLever = new THREE.Group();
  cpuLever.position.set(1.14, 0.15, -0.96);
  const leverCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.07, 0.04, 0.92),
    new THREE.Vector3(0.07, 0.06, 1.98),
    new THREE.Vector3(-0.18, 0.08, 2.12),
  ]);
  const leverMesh = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(leverCurve, 22, 0.034, 8, false)),
    steelMat
  );
  cpuLever.add(leverMesh);
  cpuGroup.add(cpuLever);

  // CPU Chip (Green Substrate + Nickel-Plated IHS + Pin-1 Golden Triangle with Emerald Lock Glow)
  const cpuChip = new THREE.Group();
  const cpuSub = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.48, 0.055, 1.48)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0x0f5132, roughness: 0.44, metalness: 0.16 }))
  );
  cpuSub.position.y = 0.16;
  const cpuIhs = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.22, 0.09, 1.22)), brushedAlumMat);
  cpuIhs.position.y = 0.22;
  cpuIhs.castShadow = true;
  const cpuAlignGlowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xeab308,
      emissive: 0x10b981,
      emissiveIntensity: 0,
      metalness: 0.78,
      roughness: 0.2,
    })
  );
  const triMarker = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.11, 0.03, 3)), cpuAlignGlowMat);
  triMarker.position.set(-0.6, 0.198, 0.6);
  cpuChip.add(cpuSub, cpuIhs, triMarker);
  cpuGroup.add(cpuChip);

  // Metallic Grey Thermal Paste Layer
  const thermalPaste = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.36, 0.42, 0.035, 24)),
    trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0x9ca3af,
        metalness: 0.55,
        roughness: 0.22,
        clearcoat: 0.65,
      })
    )
  );
  thermalPaste.position.set(0, 0.275, 0);
  cpuGroup.add(thermalPaste);

  // CPU Heatsink + Spinning Aerodynamic Fan Rotor + 4 Corner Push-Pins + 4-Wire CPU_FAN Cable
  const cpuHeatsink = new THREE.Group();
  cpuHeatsink.position.y = 0.29;
  const hsCore = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.46, 0.46, 0.62, 24)),
    copperMat
  );
  hsCore.position.y = 0.31;
  cpuHeatsink.add(hsCore);

  const finGeo = trackGeo(new THREE.BoxGeometry(1.82, 0.56, 0.038));
  for (let i = 0; i < 18; i++) {
    const fin = new THREE.Mesh(finGeo, brushedAlumMat);
    fin.position.y = 0.3;
    fin.rotation.y = (i * Math.PI) / 18;
    fin.castShadow = true;
    cpuHeatsink.add(fin);
  }

  // 4 Interactive Corner Push-Pins (diagonal criss-cross locking!)
  const pushPinGeo = trackGeo(new THREE.CylinderGeometry(0.075, 0.075, 0.56, 12));
  const pushCapGeo = trackGeo(new THREE.CylinderGeometry(0.135, 0.135, 0.09, 14));
  const pushSlotGeo = trackGeo(new THREE.BoxGeometry(0.2, 0.024, 0.032));
  const pushRingGeo = trackGeo(new THREE.TorusGeometry(0.16, 0.024, 8, 18));
  const heatsinkPushPins: THREE.Group[] = [];
  const heatsinkPinRingMats: THREE.MeshStandardMaterial[] = [];
  const heatsinkPinHitboxMat = trackMat(new THREE.MeshBasicMaterial({ visible: false }));
  const heatsinkPinHitboxes: THREE.Mesh[] = [];

  // Diagonal order: Top-Left (0), Bottom-Right (1), Top-Right (2), Bottom-Left (3)
  (
    [
      [-0.95, -0.95],
      [0.95, 0.95],
      [0.95, -0.95],
      [-0.95, 0.95],
    ] as Array<[number, number]>
  ).forEach(([px, pz], idx) => {
    const shaft = new THREE.Mesh(pushPinGeo, mattePlasticBlack);
    shaft.position.set(px, 0.28, pz);
    cpuHeatsink.add(shaft);

    const pinHead = new THREE.Group();
    pinHead.position.set(px, 0.58, pz);
    const cap = new THREE.Mesh(pushCapGeo, mattePlasticBlack);
    const slot = new THREE.Mesh(pushSlotGeo, mattePlasticIvory);
    slot.position.y = 0.05;
    const ringMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x38bdf8,
        emissiveIntensity: 0,
        roughness: 0.35,
      })
    );
    const ring = new THREE.Mesh(pushRingGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    pinHead.add(cap, slot, ring);
    cpuHeatsink.add(pinHead);
    heatsinkPushPins.push(pinHead);
    heatsinkPinRingMats.push(ringMat);

    // Child hitbox on Layer 1 so raycasting always tracks the push-pin head
    const pinHb = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.46, 0.48, 0.46)), heatsinkPinHitboxMat);
    pinHb.position.set(px, 0.62, pz);
    pinHb.userData.componentId = `heatsink-pin-${idx}`;
    pinHb.layers.set(1);
    cpuHeatsink.add(pinHb);
    heatsinkPinHitboxes.push(pinHb);
  });

  const fanShroud = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.96, 0.96, 0.24, 32, 1, true)),
    mattePlasticBlack
  );
  fanShroud.position.y = 0.72;
  cpuHeatsink.add(fanShroud);

  const cpuFanRotor = new THREE.Group();
  cpuFanRotor.position.y = 0.72;
  const fanHub = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 20)),
    darkAnodizedMat
  );
  const fanRing = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.18, 0.18, 0.215, 20)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.35, metalness: 0.5 }))
  );
  cpuFanRotor.add(fanHub, fanRing);

  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0.22, -0.06);
  bladeShape.quadraticCurveTo(0.56, 0.06, 0.86, 0.09);
  bladeShape.lineTo(0.84, -0.11);
  bladeShape.quadraticCurveTo(0.52, -0.12, 0.22, -0.14);
  bladeShape.closePath();
  const bladeGeo = trackGeo(
    new THREE.ExtrudeGeometry(bladeShape, { depth: 0.025, bevelEnabled: false })
  );
  bladeGeo.rotateX(Math.PI / 2 - 0.38);
  for (let i = 0; i < 7; i++) {
    const bladeWrap = new THREE.Group();
    bladeWrap.rotation.y = (i * Math.PI * 2) / 7;
    const blade = new THREE.Mesh(bladeGeo, mattePlasticBlack);
    bladeWrap.add(blade);
    cpuFanRotor.add(bladeWrap);
  }
  cpuHeatsink.add(cpuFanRotor);

  const fanCableColors = [0x111827, 0xeab308, 0x22c55e, 0x3b82f6];
  fanCableColors.forEach((col, i) => {
    const cCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.92, 0.68, -0.25 + i * 0.04),
      new THREE.Vector3(1.38, 0.45, -0.55 + i * 0.04),
      new THREE.Vector3(1.62, 0.05, -0.82 + i * 0.04),
    ]);
    const wire = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(cCurve, 14, 0.02, 6, false)),
      trackMat(new THREE.MeshStandardMaterial({ color: col, roughness: 0.55 }))
    );
    cpuHeatsink.add(wire);
  });
  cpuGroup.add(cpuHeatsink);

  const cpuFanHeader = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.18, 0.2, 0.42)),
    mattePlasticIvory
  );
  cpuFanHeader.position.set(3.72, 0.26, -2.35);
  boardGroup.add(cpuFanHeader);

  // 4. #02 SLOT MEMORI (4 DIMM Slots + Independent White End Clips + Separate Single-Stick RAM 1 & RAM 2)
  const ramGroup = new THREE.Group();
  ramGroup.position.set(1.9, 0.16, 1.85);
  boardGroup.add(ramGroup);

  const ramSlotZ = [-0.66, -0.22, 0.22, 0.66];
  const slotLeftClips: THREE.Mesh[] = [];
  const slotRightClips: THREE.Mesh[] = [];

  ramSlotZ.forEach((zPos, idx) => {
    const slotMat = idx % 2 === 0 ? slotCyanMat : darkAnodizedMat;
    const slotBody = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.2, 0.26, 0.17)), slotMat);
    slotBody.position.set(0, 0.13, zPos);
    slotBody.castShadow = true;
    ramGroup.add(slotBody);

    // Clear notch bridge inside slot
    const notch = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.09, 0.29, 0.15)), mattePlasticIvory);
    notch.position.set(-0.35, 0.145, zPos);
    ramGroup.add(notch);

    const clipGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.38, 0.19));
    clipGeo.translate(0, 0.19, 0);

    const leftClip = new THREE.Mesh(clipGeo, mattePlasticIvory);
    leftClip.position.set(-2.18, 0.02, zPos);
    ramGroup.add(leftClip);

    const rightClip = new THREE.Mesh(clipGeo, mattePlasticIvory);
    rightClip.position.set(2.18, 0.02, zPos);
    ramGroup.add(rightClip);

    slotLeftClips.push(leftClip);
    slotRightClips.push(rightClip);
  });

  const ramClips1Left = slotLeftClips[0];
  const ramClips1Right = slotRightClips[0];
  const ramClips2Left = slotLeftClips[2];
  const ramClips2Right = slotRightClips[2];

  const ramPcbMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x14532d,
      roughness: 0.36,
      metalness: 0.15,
      clearcoat: 0.45,
    })
  );

  const ram1AlignGlowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      emissive: 0x10b981,
      emissiveIntensity: 0,
      roughness: 0.3,
    })
  );
  const ram2AlignGlowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      emissive: 0x10b981,
      emissiveIntensity: 0,
      roughness: 0.3,
    })
  );

  const buildRamStick = (zPos: number, glowMat: THREE.MeshStandardMaterial, accentTint: THREE.Material) => {
    const stick = new THREE.Group();
    stick.position.set(0, 0.44, zPos);
    const body = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.06, 0.58, 0.06)), ramPcbMat);
    body.castShadow = true;
    const goldLeft = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.62, 0.1, 0.072)), goldMat);
    goldLeft.position.set(-1.22, -0.25, 0);
    const goldRight = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.3, 0.1, 0.072)), goldMat);
    goldRight.position.set(0.86, -0.25, 0);
    const spreader = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.08, 0.12, 0.095)), accentTint);
    spreader.position.y = 0.25;
    // Notch alignment indicator pip (glows bright emerald on lock!)
    const notchPip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 0.16, 0.12)), glowMat);
    notchPip.position.set(-0.35, 0.27, 0);
    stick.add(body, goldLeft, goldRight, spreader, notchPip);

    for (let c = 0; c < 8; c++) {
      const ic = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.24, 0.098)), darkIcMat);
      ic.position.set(-1.6 + c * 0.46, 0.01, 0);
      stick.add(ic);
    }
    return stick;
  };

  const ramStick1 = buildRamStick(-0.66, ram1AlignGlowMat, brushedAlumMat);
  const ramStick2 = buildRamStick(0.22, ram2AlignGlowMat, brushedAlumMat);
  ramGroup.add(ramStick1, ramStick2);

  // 5. #03 NORTHBRIDGE (MCH) — Diagonal Extruded Fin Heatsink + Spring Screws
  const nbGroup = new THREE.Group();
  nbGroup.position.set(0.1, 0.16, -0.8);
  nbGroup.rotation.y = Math.PI / 4;
  boardGroup.add(nbGroup);

  const nbBase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.42, 0.16, 1.42)), brushedAlumMat);
  nbBase.position.y = 0.08;
  nbBase.castShadow = true;
  nbGroup.add(nbBase);

  const nbFinShape = new THREE.Shape();
  nbFinShape.moveTo(-0.68, 0);
  nbFinShape.lineTo(0.68, 0);
  nbFinShape.lineTo(0.62, 0.6);
  nbFinShape.lineTo(-0.62, 0.6);
  nbFinShape.closePath();
  const nbFinGeo = trackGeo(
    new THREE.ExtrudeGeometry(nbFinShape, {
      depth: 0.042,
      bevelEnabled: true,
      bevelSize: 0.008,
      bevelThickness: 0.008,
    })
  );
  for (let i = 0; i < 10; i++) {
    const fin = new THREE.Mesh(nbFinGeo, brushedAlumMat);
    fin.position.set(0, 0.15, -0.62 + i * 0.135);
    fin.castShadow = true;
    nbGroup.add(fin);
  }
  [
    [-0.78, -0.78],
    [0.78, 0.78],
  ].forEach(([bx, bz]) => {
    const screw = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 12)), steelMat);
    screw.position.set(bx, 0.11, bz);
    nbGroup.add(screw);
  });

  // 6. #04 SOUTHBRIDGE (ICH) — Anodized Low-Profile Finned Heatsink
  const sbGroup = new THREE.Group();
  sbGroup.position.set(-1.45, 0.16, 0.95);
  boardGroup.add(sbGroup);

  const sbBase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.22, 0.12, 1.22)), darkAnodizedMat);
  sbBase.position.y = 0.06;
  sbBase.castShadow = true;
  sbGroup.add(sbBase);
  for (let i = 0; i < 8; i++) {
    const fin = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.16, 0.28, 0.055)), brushedAlumMat);
    fin.position.set(0, 0.24, -0.49 + i * 0.14);
    fin.castShadow = true;
    sbGroup.add(fin);
  }

  // 7. EXPANSION SLOTS: #05 PCIe x16 (with hinged retention latch), #06 PCIe x1, #07 AGP, #08 PCI (×3)
  const pcie16Group = new THREE.Group();
  pcie16Group.position.set(-1.5, 0.16, -1.65);
  const pcie16Body = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.24, 3.05)), slotOrangeMat);
  pcie16Body.position.y = 0.12;
  pcie16Body.castShadow = true;
  const pcieLatchGeo = trackGeo(new THREE.BoxGeometry(0.26, 0.34, 0.22));
  pcieLatchGeo.translate(0, 0.17, 0);
  const pcie16Latch = new THREE.Mesh(pcieLatchGeo, mattePlasticIvory);
  pcie16Latch.position.set(0, 0.04, 1.56);
  pcie16Group.add(pcie16Body, pcie16Latch);
  boardGroup.add(pcie16Group);

  // Collision-Free Installable VGA Card (zero overlap with Back Panel I/O, PCIe latch, Northbridge, or Southbridge!)
  const vgaCard = new THREE.Group();
  vgaCard.position.set(-1.5, 0.42, -1.68);
  const vgaPcb = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.075, 0.9, 2.86)),
    trackMat(
      new THREE.MeshPhysicalMaterial({ color: 0x7f1d1d, roughness: 0.38, metalness: 0.15, clearcoat: 0.42 })
    )
  );
  vgaPcb.position.y = 0.45;
  vgaPcb.castShadow = true;
  const vgaGoldPins = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.085, 0.12, 2.45)), goldMat);
  vgaGoldPins.position.set(0, -0.02, 0.05);
  const vgaShroud = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.22, 0.68, 2.25)), darkAnodizedMat);
  vgaShroud.position.set(0.13, 0.44, 0.08);
  const vgaHeatpipe = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 2.15, 12)),
    copperMat
  );
  vgaHeatpipe.rotation.x = Math.PI / 2;
  vgaHeatpipe.position.set(0.13, 0.84, 0.08);
  const vgaFan = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.29, 0.29, 0.07, 22)), brushedAlumMat);
  vgaFan.rotation.z = Math.PI / 2;
  vgaFan.position.set(0.245, 0.44, 0.18);
  const vgaBracket = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.26, 1.04, 0.05)), steelMat);
  vgaBracket.position.set(0.04, 0.46, -1.46);
  const vgaBracketTab = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.28, 0.05, 0.22)), steelMat);
  vgaBracketTab.position.set(-0.08, 0.96, -1.46);

  // Interactive VGA Bracket Thumbscrew (clicks to tighten down onto the bracket tab!)
  const vgaBracketScrew = new THREE.Group();
  vgaBracketScrew.position.set(-0.1, 1.03, -1.46);
  const vgaScrewGlowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      emissive: 0x38bdf8,
      emissiveIntensity: 0,
      metalness: 0.9,
      roughness: 0.2,
    })
  );
  const screwHead = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.095, 0.095, 0.09, 16)), vgaScrewGlowMat);
  const screwCross1 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.12, 0.02, 0.024)), darkAnodizedMat);
  screwCross1.position.y = 0.048;
  const screwCross2 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.024, 0.02, 0.12)), darkAnodizedMat);
  screwCross2.position.y = 0.048;
  const screwShaft = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 10)), steelMat);
  screwShaft.position.y = -0.07;
  vgaBracketScrew.add(screwHead, screwCross1, screwCross2, screwShaft);

  const vgaScrewHitbox = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.54, 0.56, 0.54)), heatsinkPinHitboxMat);
  vgaScrewHitbox.position.set(-0.1, 1.04, -1.46);
  vgaScrewHitbox.userData.componentId = 'vga-screw';
  vgaScrewHitbox.layers.set(1);

  vgaCard.add(
    vgaPcb,
    vgaGoldPins,
    vgaShroud,
    vgaHeatpipe,
    vgaFan,
    vgaBracket,
    vgaBracketTab,
    vgaBracketScrew,
    vgaScrewHitbox
  );
  boardGroup.add(vgaCard);

  // #06 PCIe x1
  const pcie1 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.2, 0.22, 0.85)), mattePlasticIvory);
  pcie1.position.set(-2.4, 0.27, -2.5);
  pcie1.castShadow = true;
  boardGroup.add(pcie1);

  // #07 AGP Slot
  const agpMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.24, 2.45)), slotAmberMat);
  agpMesh.position.set(-2.7, 0.28, -1.2);
  agpMesh.castShadow = true;
  boardGroup.add(agpMesh);

  // #08 PCI Slots (3 Ivory Slots)
  [-3.45, -3.88, -4.31].forEach((xPos) => {
    const pci = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.24, 2.7)), mattePlasticIvory);
    pci.position.set(xPos, 0.28, -1.35);
    pci.castShadow = true;
    boardGroup.add(pci);
  });

  // 8. #09 ROM BIOS Chip
  const biosGroup = new THREE.Group();
  biosGroup.position.set(-3.75, 0.16, 1.2);
  const biosSocket = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.68, 0.1, 0.68)), mattePlasticBlack);
  biosSocket.position.y = 0.05;
  const biosChip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.56, 0.14, 0.56)), darkIcMat);
  biosChip.position.y = 0.12;
  const biosLabel = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.36, 0.01, 0.2)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.2 }))
  );
  biosLabel.position.y = 0.195;
  biosGroup.add(biosSocket, biosChip, biosLabel);
  boardGroup.add(biosGroup);

  // 9. #10 BATERAI CMOS CR2032
  const cmosGroup = new THREE.Group();
  cmosGroup.position.set(-1.4, 0.16, 2.35);
  const cmosHolder = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.47, 0.47, 0.12, 28)),
    mattePlasticBlack
  );
  cmosHolder.position.y = 0.06;
  const cmosSpring = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.05, 0.18)), steelMat);
  cmosSpring.position.set(0.42, 0.16, 0);
  const cmosCoin = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.38, 0.38, 0.09, 32)),
    trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xf1f5f9,
        metalness: 0.96,
        roughness: 0.12,
        clearcoat: 0.6,
        anisotropy: 0.5,
      })
    )
  );
  cmosCoin.position.y = 0.135;
  cmosCoin.castShadow = true;
  cmosGroup.add(cmosHolder, cmosSpring, cmosCoin);
  boardGroup.add(cmosGroup);

  // 10. #11 PORT SATA (4 Red Angled Ports) + Installable Red SATA Cable
  const sataGroup = new THREE.Group();
  sataGroup.position.set(-2.65, 0.16, 2.5);
  const sataMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.44, metalness: 0.1 }));
  [
    [-0.36, -0.2],
    [0.36, -0.2],
    [-0.36, 0.25],
    [0.36, 0.25],
  ].forEach(([sx, sz]) => {
    const port = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.56, 0.24, 0.24)), sataMat);
    port.position.set(sx, 0.12, sz);
    port.castShadow = true;
    sataGroup.add(port);
  });
  boardGroup.add(sataGroup);

  // 11. #12 PORT IDE (40-Pin Blue Header with Dual-Row Gold Pins) + #13 FLOPPY (34-Pin Dual-Row Gold Pins)
  const ideGroup = new THREE.Group();
  ideGroup.position.set(-0.85, 0.16, 3.45);
  const ideShell = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.82, 0.26, 0.36)), slotBlueMat);
  ideShell.position.y = 0.13;
  ideShell.castShadow = true;
  ideGroup.add(ideShell);
  const idePinGeo = trackGeo(new THREE.CylinderGeometry(0.014, 0.014, 0.2, 6));
  for (let p = 0; p < 18; p++) {
    for (const rowZ of [-0.06, 0.06]) {
      const pin = new THREE.Mesh(idePinGeo, goldMat);
      pin.position.set(-0.78 + p * 0.092, 0.21, rowZ);
      ideGroup.add(pin);
    }
  }
  boardGroup.add(ideGroup);

  // #13 PORT FLOPPY (34-Pin Ivory Header with Dual-Row Gold Pins)
  const floppyGroup = new THREE.Group();
  floppyGroup.position.set(-4.2, 0.16, 2.55);
  const floppyMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.34, 0.26, 1.52)), mattePlasticIvory);
  floppyMesh.position.y = 0.13;
  floppyMesh.castShadow = true;
  floppyGroup.add(floppyMesh);
  for (let p = 0; p < 14; p++) {
    for (const rowX of [-0.055, 0.055]) {
      const pin = new THREE.Mesh(idePinGeo, goldMat);
      pin.position.set(rowX, 0.21, -0.62 + p * 0.095);
      floppyGroup.add(pin);
    }
  }
  boardGroup.add(floppyGroup);

  // 11b. AUTHENTIC OLD 3.5" IDE (PATA) HARDDISK + ROOMY DESK BRACKET (z=6.25)
  // Rear Panel has ONLY 3 Authentic IDE Connectors: [IDE 40-Pin Data] [Jumper 8-Pin MA|SL|CS] [Molex 4-Pin Power]
  const hddBracket = new THREE.Group();
  hddBracket.position.set(-1.35, 0.0, 6.25);
  const bracketBase = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.96, 0.06, 2.02)),
    mattePlasticBlack
  );
  bracketBase.position.y = 0.03;
  bracketBase.receiveShadow = true;
  hddBracket.add(bracketBase);
  [
    [-1.44, 0.0],
    [1.44, 0.0],
  ].forEach(([rx, rz]) => {
    const rail = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 0.34, 1.88)), steelMat);
    rail.position.set(rx, 0.17, rz);
    hddBracket.add(rail);
  });
  rootGroup.add(hddBracket);

  const hddLabelTex = createHddLabelTexture(maxAnisotropy);
  const hddRearLegendTex = createHddRearLegendTexture(maxAnisotropy);
  textures.push(hddLabelTex, hddRearLegendTex);

  const hddUnitGroup = new THREE.Group();
  hddUnitGroup.position.set(-1.35, 0.06, 6.25);

  // Die-cast dark anodized chassis + brushed silver top cover + crisp technical sticker
  const hddBody = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.68, 0.46, 1.72)), darkAnodizedMat);
  hddBody.position.y = 0.23;
  hddBody.castShadow = true;
  const hddTopPlate = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.4, 0.035, 1.48)), brushedAlumMat);
  hddTopPlate.position.y = 0.475;
  const hddSticker = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(2.08, 1.26)),
    trackMat(new THREE.MeshStandardMaterial({ map: hddLabelTex, roughness: 0.48 }))
  );
  hddSticker.rotation.x = -Math.PI / 2;
  hddSticker.position.y = 0.496;

  // High-contrast rear silkscreen strip right above the 3 rear connectors (IDE 40-PIN | MA SL CS | MOLEX 4-PIN)
  const hddRearLegendMesh = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(2.58, 0.28)),
    trackMat(new THREE.MeshStandardMaterial({ map: hddRearLegendTex, roughness: 0.42 }))
  );
  hddRearLegendMesh.position.set(0, 0.56, -0.865);
  hddRearLegendMesh.rotation.y = Math.PI;
  hddUnitGroup.add(hddBody, hddTopPlate, hddSticker, hddRearLegendMesh);

  // Rear Connectors facing motherboard (-Z side of HDD) + Expanded Dynamic Child Hitboxes!
  const hddChildHitboxes: THREE.Mesh[] = [];
  const addHddChildHitbox = (id: string, pos: [number, number, number], size: [number, number, number]) => {
    const hb = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(size[0], size[1], size[2])), heatsinkPinHitboxMat);
    hb.position.set(pos[0], pos[1], pos[2]);
    hb.userData.componentId = id;
    hb.layers.set(1);
    hddUnitGroup.add(hb);
    hddChildHitboxes.push(hb);
  };

  const hddRearIdeGlowMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x161b24, emissive: 0x22d3ee, emissiveIntensity: 0, roughness: 0.65 })
  );
  const hddRearMolexGlowMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, emissive: 0x22d3ee, emissiveIntensity: 0, roughness: 0.48 })
  );

  // (a) Rear Left (local x = -0.58): 40-Pin IDE Data Connector + Gold Pins + Red Pin-1 Key Marker
  const hddIdeSocket = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.22, 0.24, 0.16)), hddRearIdeGlowMat);
  hddIdeSocket.position.set(-0.58, 0.22, -0.89);
  hddUnitGroup.add(hddIdeSocket);
  const hddIdePin1Mark = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.06, 0.24, 0.17)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.45 }))
  );
  hddIdePin1Mark.position.set(-0.01, 0.22, -0.89);
  hddUnitGroup.add(hddIdePin1Mark);
  for (let p = 0; p < 12; p++) {
    for (const rowY of [0.175, 0.265]) {
      const pin = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.011, 0.011, 0.16, 6)), goldMat);
      pin.rotation.x = Math.PI / 2;
      pin.position.set(-1.1 + p * 0.092, rowY, -0.94);
      hddUnitGroup.add(pin);
    }
  }
  // Generous expanded hitbox so End-2 IDE never gets stuck!
  addHddChildHitbox('hdd-ide-port', [-0.58, 0.24, -1.0], [1.38, 0.58, 0.72]);

  // (b) Rear Center-Right (local x = +0.28): Enlarged 8-Pin Jumper Block (MA | SL | CS)
  const hddJumperBase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.6, 0.26, 0.15)), mattePlasticBlack);
  hddJumperBase.position.set(0.32, 0.22, -0.89);
  hddUnitGroup.add(hddJumperBase);

  const hddJumperColMats: Record<HddJumperMode, THREE.MeshStandardMaterial> = {
    master: trackMat(
      new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x10b981, emissiveIntensity: 0, roughness: 0.4 })
    ),
    slave: trackMat(
      new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0xf59e0b, emissiveIntensity: 0, roughness: 0.4 })
    ),
    cs: trackMat(
      new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x38bdf8, emissiveIntensity: 0, roughness: 0.4 })
    ),
  };

  // Visual pin-pair backplates + 3 separate child hitboxes (MA x=0.14, SL x=0.28, CS x=0.42)
  (
    [
      ['master', 0.14, 'hdd-jumper-master'],
      ['slave', 0.28, 'hdd-jumper-slave'],
      ['cs', 0.42, 'hdd-jumper-cs'],
    ] as Array<[HddJumperMode, number, string]>
  ).forEach(([modeKey, colX, hbId]) => {
    const colPad = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.11, 0.23, 0.05)),
      hddJumperColMats[modeKey]
    );
    colPad.position.set(colX, 0.22, -0.945);
    hddUnitGroup.add(colPad);
    addHddChildHitbox(hbId, [colX, 0.24, -1.0], [0.135, 0.48, 0.56]);
  });

  const jPinGeo = trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 8));
  [0.14, 0.28, 0.42, 0.55].forEach((colX) => {
    for (const rowY of [0.165, 0.275]) {
      const jp = new THREE.Mesh(jPinGeo, goldMat);
      jp.rotation.x = Math.PI / 2;
      jp.position.set(colX, rowY, -0.98);
      hddUnitGroup.add(jp);
    }
  });

  // High-Contrast Tiny 2-Pin Plastic Jumper Shunt Cap (Bright Yellow body + Dark top grip ridge — NOT a cable!)
  const hddJumperCap = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.11, 0.23, 0.17)),
    trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xeab308,
        emissiveIntensity: 0.28,
        roughness: 0.34,
      })
    )
  );
  const jumperCapTopBar = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.115, 0.045, 0.18)),
    mattePlasticBlack
  );
  jumperCapTopBar.position.y = 0.115;
  hddJumperCap.add(jumperCapTopBar);
  hddJumperCap.position.set(0.14, 0.22, -0.99);
  hddUnitGroup.add(hddJumperCap);

  // (c) Rear Far-Right (local x = +0.96): Authentic White D-Shaped 4-Pin Molex Power Connector
  const molexShroud = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.56, 0.24, 0.18)), hddRearMolexGlowMat);
  molexShroud.position.set(0.96, 0.22, -0.89);
  const molexBevel = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.44, 0.05, 0.17)), hddRearMolexGlowMat);
  molexBevel.position.set(0.96, 0.355, -0.89);
  hddUnitGroup.add(molexShroud, molexBevel);
  for (let m = 0; m < 4; m++) {
    const mp = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.026, 0.026, 0.18, 8)), goldMat);
    mp.rotation.x = Math.PI / 2;
    mp.position.set(0.79 + m * 0.112, 0.22, -0.94);
    hddUnitGroup.add(mp);
  }
  // Generous expanded hitbox so Molex 4-Pin clicks & drops effortlessly!
  addHddChildHitbox('hdd-molex-port', [0.96, 0.24, -1.02], [0.82, 0.58, 0.76]);
  rootGroup.add(hddUnitGroup);

  // 2-End IDE 40-Wire Data Ribbon: End 1 (Board #12 only) + Full Clean Ribbon (Board #12 <-> HDD Rear IDE at x=-1.93, z=5.32)
  const ribbonMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.72 }));
  const redStripeMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.48 }));

  const ideRibbonPartial = new THREE.Group();
  const idePlugBoardPart = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.74, 0.22, 0.26)), mattePlasticBlack);
  idePlugBoardPart.position.set(-0.85, 0.48, 3.45);
  const idePartialCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.85, 0.56, 3.45),
    new THREE.Vector3(-1.35, 1.04, 4.05),
    new THREE.Vector3(-1.82, 0.88, 4.65),
  ]);
  for (let w = -4; w <= 4; w++) {
    const offsetX = w * 0.115;
    const pts = idePartialCurve.getPoints(10).map((pt) => new THREE.Vector3(pt.x + offsetX, pt.y, pt.z));
    const strand = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, 0.032, 5, false)),
      w === 4 ? redStripeMat : ribbonMat
    );
    ideRibbonPartial.add(strand);
  }
  const ideLoosePlug = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.22, 0.22, 0.18)), mattePlasticBlack);
  ideLoosePlug.position.set(-1.82, 0.82, 4.68);
  ideRibbonPartial.add(idePlugBoardPart, ideLoosePlug);
  ideRibbonPartial.visible = false;
  boardGroup.add(ideRibbonPartial);

  const ideRibbonCable = new THREE.Group();
  const idePlugBoard = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.74, 0.22, 0.26)), mattePlasticBlack);
  idePlugBoard.position.set(-0.85, 0.48, 3.45);
  const idePlugHdd = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.24, 0.24, 0.2)), mattePlasticBlack);
  idePlugHdd.position.set(-1.93, 0.28, 5.29);

  const ideRibbonCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.85, 0.56, 3.45),
    new THREE.Vector3(-1.3, 1.02, 4.18),
    new THREE.Vector3(-1.76, 0.72, 4.82),
    new THREE.Vector3(-1.93, 0.28, 5.29),
  ]);
  for (let w = -4; w <= 4; w++) {
    const offsetBoard = w * 0.13;
    const offsetHdd = w * 0.105;
    const rawPts = ideRibbonCurve.getPoints(16);
    const pts = rawPts.map((pt, i) => {
      const t = i / (rawPts.length - 1);
      const ox = THREE.MathUtils.lerp(offsetBoard, offsetHdd, t);
      return new THREE.Vector3(pt.x + ox, pt.y, pt.z);
    });
    const strand = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 18, 0.032, 5, false)),
      w === 4 ? redStripeMat : ribbonMat
    );
    ideRibbonCable.add(strand);
  }
  ideRibbonCable.add(idePlugBoard, idePlugHdd);
  boardGroup.add(ideRibbonCable);

  // Authentic 4-Pin PSU Molex Power Cable (White D-Shape Head + Yellow 12V, Black GND, Black GND, Red 5V -> Rear Right HDD!)
  const hddMolexCable = new THREE.Group();
  const molexPlug = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.56, 0.24, 0.24)), mattePlasticIvory);
  molexPlug.position.set(-0.39, 0.28, 5.27);
  const molexPlugBevel = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.44, 0.05, 0.22)), mattePlasticIvory);
  molexPlugBevel.position.set(-0.39, 0.415, 5.27);
  hddMolexCable.add(molexPlug, molexPlugBevel);
  [0xeab308, 0x111827, 0x1f2937, 0xef4444].forEach((col, i) => {
    const mCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.56 + i * 0.112, 0.28, 5.18),
      new THREE.Vector3(-0.32 + i * 0.095, 0.56, 4.72),
      new THREE.Vector3(1.05 + i * 0.07, 0.44, 4.95),
      new THREE.Vector3(3.25 + i * 0.055, 0.22, 5.65),
    ]);
    const mw = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(mCurve, 20, 0.036, 7, false)),
      trackMat(new THREE.MeshStandardMaterial({ color: col, roughness: 0.46 }))
    );
    hddMolexCable.add(mw);
  });
  boardGroup.add(hddMolexCable);

  // 12. #14 PORT POWER ATX 24-PIN + SEPARATE ATX 12V 4-PIN CPU POWER
  const atxGroup = new THREE.Group();
  atxGroup.position.set(1.55, 0.16, 3.45);
  const atx24 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.88, 0.34, 0.42)), mattePlasticIvory);
  atx24.position.y = 0.17;
  atx24.castShadow = true;
  atxGroup.add(atx24);
  boardGroup.add(atxGroup);

  const atx4PinGlowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      emissive: 0x22d3ee,
      emissiveIntensity: 0,
      roughness: 0.52,
    })
  );
  const atx4Pin = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.44, 0.34, 0.44)), atx4PinGlowMat);
  atx4Pin.position.set(4.1, 0.33, -2.5);
  boardGroup.add(atx4Pin);

  // Split Bundle 1: ATX 24-Pin Mainboard Harness
  const atx24CableBundle = new THREE.Group();
  const atx24Plug = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.86, 0.26, 0.38)), mattePlasticIvory);
  atx24Plug.position.set(1.55, 0.52, 3.45);
  atx24CableBundle.add(atx24Plug);
  const atxColors = [0xf97316, 0xef4444, 0xeab308, 0x10b981, 0x111827, 0xa855f7];
  atxColors.forEach((col, i) => {
    const wireCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.85 + i * 0.26, 0.58, 3.45),
      new THREE.Vector3(1.1 + i * 0.22, 1.15, 4.15),
      new THREE.Vector3(2.2 + i * 0.12, 0.85, 4.95),
      new THREE.Vector3(3.4 + i * 0.08, 0.26, 5.45),
    ]);
    const wire = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(wireCurve, 22, 0.045, 7, false)),
      trackMat(new THREE.MeshStandardMaterial({ color: col, roughness: 0.55 }))
    );
    atx24CableBundle.add(wire);
  });
  boardGroup.add(atx24CableBundle);

  // Split Bundle 2: ATX 12V 4-Pin CPU Power Harness
  const atx4CableBundle = new THREE.Group();
  const atx4Plug = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.42, 0.26, 0.42)), mattePlasticIvory);
  atx4Plug.position.set(4.1, 0.55, -2.5);
  atx4CableBundle.add(atx4Plug);
  [
    [0xeab308, -0.09, -0.09],
    [0xeab308, 0.09, -0.09],
    [0x111827, -0.09, 0.09],
    [0x111827, 0.09, 0.09],
  ].forEach(([col, ox, oz]) => {
    const cpuPwrCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(4.1 + (ox as number), 0.62, -2.5 + (oz as number)),
      new THREE.Vector3(4.85, 0.96, -2.35 + (oz as number)),
      new THREE.Vector3(5.55, 0.24, -1.75 + (oz as number)),
    ]);
    const wire = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(cpuPwrCurve, 16, 0.036, 6, false)),
      trackMat(new THREE.MeshStandardMaterial({ color: col as number, roughness: 0.55 }))
    );
    atx4CableBundle.add(wire);
  });
  boardGroup.add(atx4CableBundle);

  // 13. #15–#24 BACK PANEL I/O SHIELD
  const backPanelGroup = new THREE.Group();
  backPanelGroup.position.set(0, 0.16, -3.72);
  boardGroup.add(backPanelGroup);

  const ioBacking = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(7.2, 0.96, 0.68)), brushedAlumMat);
  ioBacking.position.set(0.25, 0.48, 0);
  ioBacking.castShadow = true;
  backPanelGroup.add(ioBacking);

  const ps2Mouse = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.17, 0.17, 0.24, 18)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.42 }))
  );
  ps2Mouse.rotation.x = Math.PI / 2;
  ps2Mouse.position.set(3.35, 0.66, -0.34);

  const ps2Kb = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.17, 0.17, 0.24, 18)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.42 }))
  );
  ps2Kb.rotation.x = Math.PI / 2;
  ps2Kb.position.set(3.35, 0.28, -0.34);

  const parallelMesh = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.52, 0.28, 0.24)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.45 }))
  );
  parallelMesh.position.set(1.85, 0.68, -0.34);
  [1.0, 2.7].forEach((hx) => {
    const hexNut = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 6)), steelMat);
    hexNut.rotation.x = Math.PI / 2;
    hexNut.position.set(hx, 0.68, -0.38);
    backPanelGroup.add(hexNut);
  });

  const serialMesh = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.76, 0.24, 0.24)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.45 }))
  );
  serialMesh.position.set(2.15, 0.28, -0.34);

  const spdifMesh = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 0.26, 16)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.5 }))
  );
  spdifMesh.rotation.x = Math.PI / 2;
  spdifMesh.position.set(0.65, 0.32, -0.34);

  const firewireMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.46, 0.28, 0.24)), mattePlasticBlack);
  firewireMesh.position.set(-0.35, 0.62, -0.34);

  const rj45Mesh = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.58, 0.42, 0.26)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.38, metalness: 0.6 }))
  );
  rj45Mesh.position.set(-1.45, 0.72, -0.34);
  const lanLedG = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.08, 0.06, 0.04)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.7 }))
  );
  lanLedG.position.set(-1.62, 0.86, -0.47);
  const lanLedA = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.08, 0.06, 0.04)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.6 }))
  );
  lanLedA.position.set(-1.28, 0.86, -0.47);

  const usbStack = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.58, 0.36, 0.24)), mattePlasticBlack);
  usbStack.position.set(-1.45, 0.26, -0.34);

  const audioColors = [0x3b82f6, 0x22c55e, 0xec4899, 0x111827, 0xf97316, 0x9ca3af];
  audioColors.forEach((col, i) => {
    const colIdx = i % 3;
    const rowIdx = Math.floor(i / 3);
    const jack = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.105, 0.105, 0.22, 14)),
      trackMat(new THREE.MeshStandardMaterial({ color: col, roughness: 0.42 }))
    );
    jack.rotation.x = Math.PI / 2;
    jack.position.set(-2.45 - colIdx * 0.28, 0.64 - rowIdx * 0.32, -0.34);
    backPanelGroup.add(jack);
  });

  backPanelGroup.add(
    ps2Mouse,
    ps2Kb,
    parallelMesh,
    serialMesh,
    spdifMesh,
    firewireMesh,
    rj45Mesh,
    lanLedG,
    lanLedA,
    usbStack
  );

  // 14. GROOVED ELECTROLYTIC CAPACITORS + VRM FERRITE CHOKES + SMD ICs
  const capProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.145, 0.0),
    new THREE.Vector2(0.145, 0.35),
    new THREE.Vector2(0.125, 0.38),
    new THREE.Vector2(0.0, 0.38),
  ];
  const capGeo = trackGeo(new THREE.LatheGeometry(capProfile, 16));
  const capMat = trackMat(
    new THREE.MeshPhysicalMaterial({ color: 0x1e3a5f, metalness: 0.4, roughness: 0.26, clearcoat: 0.52 })
  );
  const capTopGeo = trackGeo(new THREE.CylinderGeometry(0.115, 0.115, 0.022, 16));
  const capCrossGeo = trackGeo(new THREE.BoxGeometry(0.17, 0.01, 0.02));
  const capStripeGeo = trackGeo(new THREE.BoxGeometry(0.04, 0.32, 0.04));

  const capPositions: Array<[number, number]> = [
    [0.55, -2.7], [0.9, -2.7], [1.25, -2.7], [1.6, -2.7], [1.95, -2.7], [2.3, -2.7],
    [3.55, -2.35], [3.55, -1.95], [3.55, -1.55], [3.55, -1.15], [3.55, -0.75],
    [0.45, 3.1], [0.1, 3.1], [-0.45, 2.3], [-0.8, 2.3], [3.2, 2.85], [3.55, 2.85],
  ];
  capPositions.forEach(([cx, cz]) => {
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(cx, 0.16, cz);
    cap.castShadow = true;
    const capTop = new THREE.Mesh(capTopGeo, brushedAlumMat);
    capTop.position.set(cx, 0.545, cz);
    const cross1 = new THREE.Mesh(capCrossGeo, darkAnodizedMat);
    cross1.position.set(cx, 0.56, cz);
    const cross2 = new THREE.Mesh(capCrossGeo, darkAnodizedMat);
    cross2.position.set(cx, 0.56, cz);
    cross2.rotation.y = Math.PI / 2;
    const stripe = new THREE.Mesh(capStripeGeo, mattePlasticIvory);
    stripe.position.set(cx + 0.13, 0.34, cz);
    boardGroup.add(cap, capTop, cross1, cross2, stripe);
  });

  // VRM Ferrite Choke Inductors with metallic top pad
  const chokeGeo = trackGeo(new THREE.BoxGeometry(0.36, 0.26, 0.36));
  const chokeTopGeo = trackGeo(new THREE.BoxGeometry(0.24, 0.02, 0.24));
  [0.7, 1.3, 1.9, 2.5, 3.1].forEach((vx) => {
    const choke = new THREE.Mesh(chokeGeo, darkAnodizedMat);
    choke.position.set(vx, 0.29, -3.08);
    choke.castShadow = true;
    const chokeMark = new THREE.Mesh(chokeTopGeo, steelMat);
    chokeMark.position.set(vx, 0.425, -3.08);
    boardGroup.add(choke, chokeMark);
  });
  [
    [-3.15, -3.05, 0.52],
    [-4.35, 0.55, 0.58],
    [3.35, 0.25, 0.45],
  ].forEach(([ix, iz, s]) => {
    const smd = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(s, 0.08, s)), darkIcMat);
    smd.position.set(ix, 0.2, iz);
    boardGroup.add(smd);
  });

  // 15. ENLARGED COLOR-CODED 9-PIN F_PANEL HEADER WITH 6 SEPARATE PIN-ZONE HITBOXES
  const fPanelGroup = new THREE.Group();
  fPanelGroup.position.set(4.18, 0.16, 3.22);

  const fpBasePlate = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.64, 0.08, 1.26)), mattePlasticBlack);
  fpBasePlate.position.y = 0.04;
  fPanelGroup.add(fpBasePlate);

  const fPanelZoneMats: Record<FPanelZoneId, THREE.MeshStandardMaterial> = {
    'fpanel-orange-13': trackMat(
      new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xf97316, emissiveIntensity: 0, roughness: 0.42 })
    ),
    'fpanel-green-2': trackMat(
      new THREE.MeshStandardMaterial({ color: 0x16a34a, emissive: 0x22c55e, emissiveIntensity: 0, roughness: 0.42 })
    ),
    'fpanel-green-4': trackMat(
      new THREE.MeshStandardMaterial({ color: 0x15803d, emissive: 0x4ade80, emissiveIntensity: 0, roughness: 0.42 })
    ),
    'fpanel-blue-57': trackMat(
      new THREE.MeshStandardMaterial({ color: 0x2563eb, emissive: 0x3b82f6, emissiveIntensity: 0, roughness: 0.42 })
    ),
    'fpanel-red-68': trackMat(
      new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0xef4444, emissiveIntensity: 0, roughness: 0.42 })
    ),
    'fpanel-black-9': trackMat(
      new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0xf43f5e, emissiveIntensity: 0, roughness: 0.55 })
    ),
  };

  const fPanelChildHitboxes: THREE.Mesh[] = [];
  const addFpZone = (
    zoneId: FPanelZoneId,
    x: number,
    z: number,
    lenZ: number
  ) => {
    const blk = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.22, 0.16, lenZ)), fPanelZoneMats[zoneId]);
    blk.position.set(x, 0.12, z);
    blk.castShadow = true;
    fPanelGroup.add(blk);

    const hb = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.24, 0.52, lenZ + 0.02)),
      heatsinkPinHitboxMat
    );
    hb.position.set(x, 0.28, z);
    hb.userData.componentId = zoneId;
    hb.layers.set(1);
    fPanelGroup.add(hb);
    fPanelChildHitboxes.push(hb);
  };

  addFpZone('fpanel-orange-13', -0.13, -0.315, 0.39); // Pin 1 & 3 (HDD LED)
  addFpZone('fpanel-green-2', 0.13, -0.42, 0.185); // Pin 2 (+P LED)
  addFpZone('fpanel-green-4', 0.13, -0.21, 0.185); // Pin 4 (-P LED)
  addFpZone('fpanel-blue-57', -0.13, 0.105, 0.39); // Pin 5 & 7 (RESET SW)
  addFpZone('fpanel-red-68', 0.13, 0.105, 0.39); // Pin 6 & 8 (POWER SW)
  addFpZone('fpanel-black-9', -0.13, 0.42, 0.19); // Pin 9 (Key / NC trap; Pin 10 empty!)

  // 9 Crisp Gold Needle Pins (Pin 1..9 present, Pin 10 omitted!)
  const fpPinGeo = trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.32, 8));
  const fpPinCoords: Array<[number, number]> = [
    [-0.13, -0.42], // Pin 1
    [0.13, -0.42], // Pin 2
    [-0.13, -0.21], // Pin 3
    [0.13, -0.21], // Pin 4
    [-0.13, 0.0], // Pin 5
    [0.13, 0.0], // Pin 6
    [-0.13, 0.21], // Pin 7
    [0.13, 0.21], // Pin 8
    [-0.13, 0.42], // Pin 9 (Key)
  ];
  fpPinCoords.forEach(([px, pz]) => {
    const needle = new THREE.Mesh(fpPinGeo, goldMat);
    needle.position.set(px, 0.22, pz);
    fPanelGroup.add(needle);
  });

  // Silkscreen F_PANEL Legend Plaque right next to the 9-pin block
  const fpLegendTex = createFPanelLegendTexture(maxAnisotropy);
  textures.push(fpLegendTex);
  const fpLegendPlaque = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.18, 0.58)),
    trackMat(new THREE.MeshStandardMaterial({ map: fpLegendTex, roughness: 0.45 }))
  );
  fpLegendPlaque.rotation.x = -Math.PI / 2;
  fpLegendPlaque.position.set(-0.98, 0.015, 0.15);
  fPanelGroup.add(fpLegendPlaque);

  boardGroup.add(fPanelGroup);

  // 16. SEPARATE CLUSTER ON WORKBENCH: C-PANEL TRAY + 5 DANGLING LOOSE WIRES + DYNAMIC ROUTED WIRES
  const cPanelCluster = new THREE.Group();
  cPanelCluster.position.set(6.4, 0.0, 2.25);
  rootGroup.add(cPanelCluster);

  const fpTray = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.15, 0.08, 3.0)), mattePlasticBlack);
  fpTray.position.set(0, 0.04, 0);
  fpTray.receiveShadow = true;
  cPanelCluster.add(fpTray);

  const fpModule = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.75, 0.52, 2.6)), darkAnodizedMat);
  fpModule.position.set(0, 0.32, 0);
  fpModule.castShadow = true;
  fpModule.receiveShadow = true;
  cPanelCluster.add(fpModule);

  const pwrBtn = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 22)),
    trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0x06b6d4,
        emissive: 0x06b6d4,
        emissiveIntensity: 0.35,
        roughness: 0.25,
      })
    )
  );
  pwrBtn.position.set(-0.25, 0.6, -0.65);

  const rstBtn = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 18)),
    brushedAlumMat
  );
  rstBtn.position.set(0.32, 0.6, -0.65);

  const powerLedMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.3 })
  );
  const pwrLed = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.068, 12, 12)), powerLedMat);
  pwrLed.position.set(-0.25, 0.6, -0.15);

  const hddLedMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xf97316, emissiveIntensity: 0.25 })
  );
  const hddLed = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.068, 12, 12)), hddLedMat);
  hddLed.position.set(0.15, 0.6, -0.15);

  const spkBuzzer = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 20)),
    mattePlasticBlack
  );
  spkBuzzer.position.set(0, 0.67, 0.65);
  cPanelCluster.add(pwrBtn, rstBtn, pwrLed, hddLed, spkBuzzer);

  // World positions of each of the 6 F_PANEL pin zones (derived from fPanelGroup at 4.18, 0.16, 3.22)
  const FPANEL_ZONE_WORLD_COORDS: Record<FPanelZoneId, { x: number; z: number }> = {
    'fpanel-orange-13': { x: 4.05, z: 2.905 },
    'fpanel-green-2': { x: 4.31, z: 2.8 },
    'fpanel-green-4': { x: 4.31, z: 3.01 },
    'fpanel-blue-57': { x: 4.05, z: 3.325 },
    'fpanel-red-68': { x: 4.31, z: 3.325 },
    'fpanel-black-9': { x: 4.05, z: 3.64 },
  };

  interface WireBuildSpec {
    id: CPanelWireId;
    col1: number;
    col2?: number;
    originZ: number;
    defaultZone: FPanelZoneId;
    housingZ: number;
    archY: number;
  }

  const wireConfigs: WireBuildSpec[] = [
    { id: 'hdd-led', col1: 0xef4444, col2: 0xf8fafc, originZ: -0.82, defaultZone: 'fpanel-orange-13', housingZ: 0.36, archY: 0.84 },
    { id: 'p-led-pos', col1: 0x22c55e, originZ: -0.42, defaultZone: 'fpanel-green-2', housingZ: 0.17, archY: 0.68 },
    { id: 'p-led-neg', col1: 0xf8fafc, originZ: -0.02, defaultZone: 'fpanel-green-4', housingZ: 0.17, archY: 0.62 },
    { id: 'reset-sw', col1: 0x2563eb, col2: 0xf8fafc, originZ: 0.38, defaultZone: 'fpanel-blue-57', housingZ: 0.36, archY: 0.78 },
    { id: 'power-sw', col1: 0xf97316, col2: 0xf8fafc, originZ: 0.78, defaultZone: 'fpanel-red-68', housingZ: 0.36, archY: 0.66 },
  ];

  const cpanelConnectedWires = new THREE.Group();
  const cpanelLooseWiresGroup = new THREE.Group();
  const cpanelWiresById = {} as Record<CPanelWireId, THREE.Group>;
  const cpanelLooseWiresById = {} as Record<CPanelWireId, THREE.Group>;
  const wireRuntimeHandles = {} as Record<
    CPanelWireId,
    {
      spec: WireBuildSpec;
      strandAMesh: THREE.Mesh;
      strandBMesh?: THREE.Mesh;
      dupontHousing: THREE.Mesh;
      colorBand: THREE.Mesh;
      currentZone: FPanelZoneId;
    }
  >;

  const buildConnectedStrandGeometry = (
    spec: WireBuildSpec,
    targetX: number,
    targetZ: number,
    zOff: number,
    isSecond: boolean
  ) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(5.52, isSecond ? 0.24 : 0.28, 2.25 + spec.originZ + (isSecond ? 0.04 : 0)),
      new THREE.Vector3(5.05, spec.archY - (isSecond ? 0.04 : 0), 2.55 + spec.originZ * 0.55),
      new THREE.Vector3(targetX + 0.34, spec.archY - (isSecond ? 0.15 : 0.12), targetZ + zOff),
      new THREE.Vector3(targetX, 0.44, targetZ + zOff),
    ]);
    return new THREE.TubeGeometry(curve, 20, isSecond ? 0.024 : 0.027, 7, false);
  };

  wireConfigs.forEach((spec) => {
    const isPair = spec.col2 !== undefined;
    const zOffsetA = isPair ? -0.075 : 0;
    const zOffsetB = 0.075;
    const matA = trackMat(new THREE.MeshStandardMaterial({ color: spec.col1, roughness: 0.45 }));
    const matB =
      isPair && spec.col2 !== undefined
        ? trackMat(new THREE.MeshStandardMaterial({ color: spec.col2, roughness: 0.48 }))
        : undefined;

    // 1. Connected Wire (dynamically re-routable to any of the 6 pin zones!)
    const wireGroup = new THREE.Group();
    const defCoord = FPANEL_ZONE_WORLD_COORDS[spec.defaultZone];
    const geoA = buildConnectedStrandGeometry(spec, defCoord.x, defCoord.z, zOffsetA, false);
    const strandAMesh = new THREE.Mesh(geoA, matA);
    wireGroup.add(strandAMesh);

    let strandBMesh: THREE.Mesh | undefined;
    if (isPair && matB) {
      const geoB = buildConnectedStrandGeometry(spec, defCoord.x, defCoord.z, zOffsetB, true);
      strandBMesh = new THREE.Mesh(geoB, matB);
      wireGroup.add(strandBMesh);
    }

    const dupontHousing = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.18, 0.24, spec.housingZ)),
      mattePlasticBlack
    );
    dupontHousing.position.set(defCoord.x, 0.44, defCoord.z);
    const colorBand = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.19, 0.045, spec.housingZ * 0.85)),
      matA
    );
    colorBand.position.set(defCoord.x, 0.55, defCoord.z);
    wireGroup.add(dupontHousing, colorBand);

    cpanelConnectedWires.add(wireGroup);
    cpanelWiresById[spec.id] = wireGroup;
    wireRuntimeHandles[spec.id] = {
      spec,
      strandAMesh,
      strandBMesh,
      dupontHousing,
      colorBand,
      currentZone: spec.defaultZone,
    };

    // 2. Dangling Loose Casing Wire (resting naturally on workbench beside C-Panel tray before plugged!)
    const looseGroup = new THREE.Group();
    const restX = 5.06;
    const restZ = 2.28 + spec.originZ * 0.92;
    const looseCurveA = new THREE.CatmullRomCurve3([
      new THREE.Vector3(5.52, 0.28, 2.25 + spec.originZ),
      new THREE.Vector3(5.32, 0.22, 2.26 + spec.originZ * 0.96),
      new THREE.Vector3(restX + 0.06, 0.08, restZ + (isPair ? -0.04 : 0)),
    ]);
    const looseStrandA = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(looseCurveA, 14, 0.025, 6, false)),
      matA
    );
    looseGroup.add(looseStrandA);
    if (isPair && matB) {
      const looseCurveB = new THREE.CatmullRomCurve3([
        new THREE.Vector3(5.52, 0.24, 2.29 + spec.originZ),
        new THREE.Vector3(5.32, 0.19, 2.3 + spec.originZ * 0.96),
        new THREE.Vector3(restX + 0.06, 0.08, restZ + 0.04),
      ]);
      const looseStrandB = new THREE.Mesh(
        trackGeo(new THREE.TubeGeometry(looseCurveB, 14, 0.022, 6, false)),
        matB
      );
      looseGroup.add(looseStrandB);
    }
    const looseHousing = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.24, 0.14, spec.housingZ * 0.72)),
      mattePlasticBlack
    );
    looseHousing.position.set(restX - 0.06, 0.08, restZ);
    const looseBand = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.12, 0.15, spec.housingZ * 0.65)),
      matA
    );
    looseBand.position.set(restX - 0.02, 0.085, restZ);
    looseGroup.add(looseHousing, looseBand);
    looseGroup.visible = false;
    cpanelLooseWiresGroup.add(looseGroup);
    cpanelLooseWiresById[spec.id] = looseGroup;
  });

  rootGroup.add(cpanelConnectedWires, cpanelLooseWiresGroup);

  const routeCPanelWireToZone = (wireId: CPanelWireId, zoneId: FPanelZoneId) => {
    const handle = wireRuntimeHandles[wireId];
    if (!handle || handle.currentZone === zoneId) return;
    handle.currentZone = zoneId;

    const coord = FPANEL_ZONE_WORLD_COORDS[zoneId];
    const isPair = handle.spec.col2 !== undefined;
    const zOffsetA = isPair ? -0.075 : 0;
    const zOffsetB = 0.075;

    handle.strandAMesh.geometry.dispose();
    handle.strandAMesh.geometry = buildConnectedStrandGeometry(
      handle.spec,
      coord.x,
      coord.z,
      zOffsetA,
      false
    );
    if (handle.strandBMesh) {
      handle.strandBMesh.geometry.dispose();
      handle.strandBMesh.geometry = buildConnectedStrandGeometry(
        handle.spec,
        coord.x,
        coord.z,
        zOffsetB,
        true
      );
    }
    handle.dupontHousing.position.set(coord.x, 0.44, coord.z);
    handle.colorBand.position.set(coord.x, 0.55, coord.z);
  };

  // 17. CLICKABLE PROXY HITBOXES ON LAYER 1
  const hitboxes: THREE.Mesh[] = [];
  const hitboxMat = trackMat(new THREE.MeshBasicMaterial({ visible: false }));

  MAINBOARD_COMPONENTS.forEach((comp) => {
    let size: [number, number, number] = [0.95, 0.75, 0.95];
    if (comp.id === 'cpu-socket') size = [2.4, 1.35, 2.4];
    else if (comp.id === 'ram-slots') size = [4.45, 1.05, 1.8];
    else if (comp.id === 'northbridge') size = [1.7, 0.95, 1.7];
    else if (comp.id === 'southbridge') size = [1.4, 0.7, 1.4];
    else if (comp.id === 'pcie-x16') size = [0.68, 0.9, 3.05];
    else if (comp.id === 'agp-slot') size = [0.55, 0.7, 2.5];
    else if (comp.id === 'pci-slots') size = [1.25, 0.7, 2.8];
    else if (comp.id === 'ide-port' || comp.id === 'atx-power') size = [2.0, 0.7, 0.75];
    else if (comp.id === 'back-panel-block') size = [7.2, 1.0, 0.6];
    else if (comp.category === 'back-panel') size = [0.68, 0.42, 0.45];
    else if (comp.id === 'c-panel') size = [2.2, 0.95, 3.0];

    const hb = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(size[0], size[1], size[2])), hitboxMat);
    hb.position.set(comp.position[0], comp.position[1], comp.position[2]);
    hb.userData.componentId = comp.id;
    hb.layers.set(1);
    rootGroup.add(hb);
    hitboxes.push(hb);
  });

  // Dedicated Assembly-mode hitboxes + Dynamic Child Hitboxes
  const addExtraHitbox = (id: string, pos: [number, number, number], size: [number, number, number]) => {
    const hb = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(size[0], size[1], size[2])), hitboxMat);
    hb.position.set(pos[0], pos[1], pos[2]);
    hb.userData.componentId = id;
    hb.layers.set(1);
    rootGroup.add(hb);
    hitboxes.push(hb);
  };
  addExtraHitbox('ram-slot-1', [1.9, 0.56, 1.19], [4.4, 0.85, 0.4]);
  addExtraHitbox('ram-slot-2', [1.9, 0.56, 2.07], [4.4, 0.85, 0.4]);
  addExtraHitbox('hdd-bay', [-1.35, 0.28, 6.25], [2.95, 0.65, 1.95]);
  addExtraHitbox('atx-4pin', [4.1, 0.42, -2.5], [0.85, 0.72, 0.85]);

  // Register dynamic child hitboxes (move automatically with HDD, Heatsink, VGA, & F_PANEL!)
  hitboxes.push(...heatsinkPinHitboxes, vgaScrewHitbox, ...hddChildHitboxes, ...fPanelChildHitboxes);

  // 18. SELECTION HIGHLIGHT RING + PRACTICE MODE CYAN TARGET GUIDE RING
  const highlightRing = new THREE.Mesh(
    trackGeo(new THREE.RingGeometry(0.65, 0.8, 32)),
    trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.88,
        depthTest: false,
      })
    )
  );
  highlightRing.rotation.x = -Math.PI / 2;
  highlightRing.visible = false;
  highlightRing.renderOrder = 10;
  rootGroup.add(highlightRing);

  const targetGuideRingMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
      depthTest: false,
    })
  );
  const targetGuideRing = new THREE.Mesh(
    trackGeo(new THREE.RingGeometry(0.72, 0.94, 36)),
    targetGuideRingMat
  );
  targetGuideRing.rotation.x = -Math.PI / 2;
  targetGuideRing.visible = false;
  targetGuideRing.renderOrder = 14;
  rootGroup.add(targetGuideRing);

  // Pool of 4 mini pulsing rings for simultaneous multi-target hints (all unlocked Heatsink Push-Pins!)
  const miniRingGeo = trackGeo(new THREE.RingGeometry(0.16, 0.24, 24));
  const secondaryGuideRings: THREE.Mesh[] = Array.from({ length: 4 }, () => {
    const ring = new THREE.Mesh(miniRingGeo, targetGuideRingMat);
    ring.rotation.x = -Math.PI / 2;
    ring.visible = false;
    ring.renderOrder = 14;
    rootGroup.add(ring);
    return ring;
  });

  // 19. ANIMATED CHIPSET DATA FLOW (Northbridge Cyan + Southbridge Amber)
  const dataFlowGroup = new THREE.Group();
  dataFlowGroup.visible = false;
  rootGroup.add(dataFlowGroup);

  interface FlowPathItem {
    curve: THREE.CatmullRomCurve3;
    particles: THREE.Mesh[];
    speed: number;
  }
  const flowPaths: FlowPathItem[] = [];

  const cyanRailMat = trackMat(
    new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.55 })
  );
  const cyanParticleMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    })
  );
  const amberRailMat = trackMat(
    new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.52 })
  );
  const amberParticleMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.0,
      roughness: 0.2,
    })
  );
  const particleGeo = trackGeo(new THREE.SphereGeometry(0.085, 12, 12));

  const addBusRoute = (points: THREE.Vector3[], kind: 'nb' | 'sb', speed: number) => {
    const curve = new THREE.CatmullRomCurve3(points);
    const tube = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(curve, 24, 0.028, 6, false)),
      kind === 'nb' ? cyanRailMat : amberRailMat
    );
    dataFlowGroup.add(tube);

    const particles: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(particleGeo, kind === 'nb' ? cyanParticleMat : amberParticleMat);
      dataFlowGroup.add(p);
      particles.push(p);
    }
    flowPaths.push({ curve, particles, speed });
  };

  addBusRoute([new THREE.Vector3(2.1, 0.34, -1.6), new THREE.Vector3(1.1, 0.5, -1.2), new THREE.Vector3(0.1, 0.58, -0.8)], 'nb', 0.42);
  addBusRoute([new THREE.Vector3(0.1, 0.58, -0.8), new THREE.Vector3(0.95, 0.52, 0.55), new THREE.Vector3(1.9, 0.45, 1.85)], 'nb', 0.36);
  addBusRoute([new THREE.Vector3(0.1, 0.58, -0.8), new THREE.Vector3(-0.7, 0.55, -1.25), new THREE.Vector3(-1.5, 0.42, -1.65)], 'nb', 0.38);
  addBusRoute([new THREE.Vector3(0.1, 0.58, -0.8), new THREE.Vector3(-1.3, 0.52, -1.0), new THREE.Vector3(-2.7, 0.42, -1.2)], 'nb', 0.34);
  addBusRoute([new THREE.Vector3(0.1, 0.55, -0.8), new THREE.Vector3(-0.7, 0.55, 0.1), new THREE.Vector3(-1.45, 0.48, 0.95)], 'nb', 0.32);
  addBusRoute([new THREE.Vector3(-1.45, 0.48, 0.95), new THREE.Vector3(-2.05, 0.48, 1.75), new THREE.Vector3(-2.65, 0.36, 2.5)], 'sb', 0.28);
  addBusRoute([new THREE.Vector3(-1.45, 0.48, 0.95), new THREE.Vector3(-1.15, 0.48, 2.2), new THREE.Vector3(-0.85, 0.42, 3.45)], 'sb', 0.25);
  addBusRoute([new THREE.Vector3(-1.45, 0.48, 0.95), new THREE.Vector3(-2.6, 0.48, 1.05), new THREE.Vector3(-3.75, 0.32, 1.2)], 'sb', 0.26);
  addBusRoute([new THREE.Vector3(-1.45, 0.48, 0.95), new THREE.Vector3(-2.7, 0.5, -0.2), new THREE.Vector3(-3.85, 0.4, -1.35)], 'sb', 0.26);
  addBusRoute([new THREE.Vector3(-1.45, 0.48, 0.95), new THREE.Vector3(-1.45, 0.58, -1.5), new THREE.Vector3(-1.45, 0.62, -3.72)], 'sb', 0.28);

  const _tempPos = new THREE.Vector3();
  const dataFlow: DataFlowSystem = {
    group: dataFlowGroup,
    update: (elapsed: number) => {
      if (!dataFlowGroup.visible) return;
      for (const path of flowPaths) {
        const count = path.particles.length;
        for (let i = 0; i < count; i++) {
          const t = (elapsed * path.speed + i / count) % 1;
          path.curve.getPointAt(t, _tempPos);
          path.particles[i].position.copy(_tempPos);
        }
      }
    },
  };

  return {
    rootGroup,
    boardGroup,
    workbenchMesh,
    hitboxes,
    highlightRing,
    targetGuideRing,
    secondaryGuideRings,
    assemblyParts: {
      cpuLever,
      cpuRetentionPlate,
      cpuChip,
      cpuAlignGlowMat,
      thermalPaste,
      cpuHeatsink,
      cpuFanRotor,
      heatsinkPushPins,
      heatsinkPinRingMats,
      ramClips1Left,
      ramClips1Right,
      ramClips2Left,
      ramClips2Right,
      ramStick1,
      ramStick2,
      ram1AlignGlowMat,
      ram2AlignGlowMat,
      cmosCoin,
      vgaCard,
      vgaBracketScrew,
      vgaScrewGlowMat,
      pcie16Latch,
      hddUnitGroup,
      hddJumperCap,
      hddJumperColMats,
      hddRearPortMats: {
        ide: hddRearIdeGlowMat,
        molex: hddRearMolexGlowMat,
      },
      ideRibbonPartial,
      ideRibbonCable,
      hddMolexCable,
      atx24CableBundle,
      atx4CableBundle,
      atx4PinGlowMat,
      fPanelZoneMats,
      cpanelConnectedWires,
      cpanelWiresById,
      cpanelLooseWiresById,
      routeCPanelWireToZone,
      powerLedMat,
      hddLedMat,
    },
    dataFlow,
    dispose: () => {
      Object.values(wireRuntimeHandles).forEach((h) => {
        h.strandAMesh.geometry.dispose();
        h.strandBMesh?.geometry.dispose();
      });
      pcbMaps.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
