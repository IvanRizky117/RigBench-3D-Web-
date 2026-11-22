import * as THREE from 'three';
import type { TheaterFocusPlane } from '../../data/theaterDirectorTimeline';

export interface TheaterFocusMarkerController {
  rootGroup: THREE.Group;
  update: (params: {
    elapsed: number;
    dt: number;
    visible: boolean;
    anchor: [number, number, number];
    radius: number;
    plane: TheaterFocusPlane;
    colorHex: string;
    isPlaying: boolean;
    reducedMotion: boolean;
    camera: THREE.Camera;
  }) => { visible: boolean; opacity: number };
  getTipWorldPosition: (out: THREE.Vector3) => THREE.Vector3;
  dispose: () => void;
}

const _targetPos = new THREE.Vector3();
const _targetColor = new THREE.Color();
const _whiteColor = new THREE.Color(0xffffff);
const _camRight = new THREE.Vector3();
const _camUp = new THREE.Vector3();
const _p0 = new THREE.Vector3();
const _p1 = new THREE.Vector3();
const _p2 = new THREE.Vector3();
const _quatXZ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
const _quatXYFront = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
const _quatXYBack = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0));

/**
 * Architectural Studio Documentary 3D Focus Marker:
 * - Thin luminous circular ring + subtle breathing outer halo + 4 precision CAD ticks
 * - Precision 3-point angled pointer leader line connecting the ring perimeter to the floating DOM tag
 * - Zero per-frame allocations & complete GPU resource disposal
 */
export function createTheaterFocusMarker(): TheaterFocusMarkerController {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'theater-focus-marker';
  rootGroup.renderOrder = 20;

  const ringGroup = new THREE.Group();
  rootGroup.add(ringGroup);

  const primaryMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    toneMapped: false,
  });

  const haloMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    toneMapped: false,
  });

  const tickMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
    toneMapped: false,
  });

  // Unit-radius thin rings scaled dynamically to target component radius
  const primaryRingGeo = new THREE.TorusGeometry(1, 0.017, 12, 72);
  const primaryRing = new THREE.Mesh(primaryRingGeo, primaryMat);
  ringGroup.add(primaryRing);

  const haloRingGeo = new THREE.TorusGeometry(1.1, 0.008, 10, 72);
  const haloRing = new THREE.Mesh(haloRingGeo, haloMat);
  ringGroup.add(haloRing);

  // 4 hairline precision ticks at cardinal angles
  const tickGeo = new THREE.BoxGeometry(0.11, 0.016, 0.012);
  const tickOffsets: Array<[number, number, number]> = [
    [1.06, 0, 0],
    [-1.06, 0, 0],
    [0, 1.06, Math.PI / 2],
    [0, -1.06, Math.PI / 2],
  ];
  for (const [tx, ty, rz] of tickOffsets) {
    const tick = new THREE.Mesh(tickGeo, tickMat);
    tick.position.set(tx, ty, 0);
    tick.rotation.z = rz;
    ringGroup.add(tick);
  }

  // Precision 3-point pointer leader line (world-space relative to rootGroup)
  const linePositions = new Float32Array(9);
  const lineGeo = new THREE.BufferGeometry();
  const linePosAttr = new THREE.BufferAttribute(linePositions, 3);
  lineGeo.setAttribute('position', linePosAttr);

  const lineMat = new THREE.LineBasicMaterial({
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    toneMapped: false,
  });

  const leaderLine = new THREE.Line(lineGeo, lineMat);
  leaderLine.frustumCulled = false;
  rootGroup.add(leaderLine);

  const dotGeo = new THREE.SphereGeometry(0.032, 10, 10);
  const startDot = new THREE.Mesh(dotGeo, tickMat);
  const tipDot = new THREE.Mesh(dotGeo, primaryMat);
  tipDot.scale.setScalar(0.85);
  rootGroup.add(startDot);
  rootGroup.add(tipDot);

  let currentRadius = 0.85;
  let currentOpacity = 0;
  let initialized = false;
  const tipWorldPos = new THREE.Vector3();

  return {
    rootGroup,
    update({
      elapsed,
      dt,
      visible,
      anchor,
      radius,
      plane,
      colorHex,
      isPlaying,
      reducedMotion,
      camera,
    }) {
      const targetOpacity = visible ? 1 : 0;
      currentOpacity = THREE.MathUtils.damp(currentOpacity, targetOpacity, 10, dt);

      if (currentOpacity < 0.015 && !visible) {
        rootGroup.visible = false;
        return { visible: false, opacity: 0 };
      }
      rootGroup.visible = true;

      // Slight lift on XZ plane so ring never z-fights with PCB silkscreen
      const liftY = plane === 'xz' ? 0.05 : 0;
      const liftZ = plane === 'xy-back' ? -0.05 : plane === 'xy-front' ? 0.06 : 0;
      _targetPos.set(anchor[0], anchor[1] + liftY, anchor[2] + liftZ);

      const safeRadius = Math.max(0.28, Math.min(2.6, radius));
      if (!initialized) {
        rootGroup.position.copy(_targetPos);
        currentRadius = safeRadius;
        initialized = true;
      } else {
        const dampRate = reducedMotion ? 20 : 8.5;
        rootGroup.position.x = THREE.MathUtils.damp(rootGroup.position.x, _targetPos.x, dampRate, dt);
        rootGroup.position.y = THREE.MathUtils.damp(rootGroup.position.y, _targetPos.y, dampRate, dt);
        rootGroup.position.z = THREE.MathUtils.damp(rootGroup.position.z, _targetPos.z, dampRate, dt);
        currentRadius = THREE.MathUtils.damp(currentRadius, safeRadius, dampRate, dt);
      }

      // Smoothly orient ring onto the target plane
      const targetQuat =
        plane === 'xy-back' ? _quatXYBack : plane === 'xy-front' ? _quatXYFront : _quatXZ;
      ringGroup.quaternion.slerp(targetQuat, Math.min(1, dt * (reducedMotion ? 24 : 10)));

      // Gentle slow breathing pulse following narration rhythm
      const pulsePhase = reducedMotion
        ? 0.5
        : Math.sin(elapsed * (isPlaying ? 2.15 : 1.1)) * 0.5 + 0.5;
      const primaryScale = currentRadius * (1 + (reducedMotion ? 0 : (pulsePhase - 0.5) * 0.045));
      const haloScale = 1.06 + (reducedMotion ? 0.03 : pulsePhase * 0.09);

      ringGroup.scale.setScalar(primaryScale);
      haloRing.scale.setScalar(haloScale);

      // Update active domain color smoothly
      _targetColor.set(colorHex);
      primaryMat.color.lerp(_targetColor, Math.min(1, dt * 9));
      haloMat.color.copy(primaryMat.color);
      lineMat.color.copy(primaryMat.color).lerp(_whiteColor, 0.28);

      primaryMat.opacity = currentOpacity * (0.76 + pulsePhase * 0.18);
      haloMat.opacity = currentOpacity * (0.14 + pulsePhase * 0.24);
      tickMat.opacity = currentOpacity * 0.82;
      lineMat.opacity = currentOpacity * 0.82;

      // Compute camera-aligned upper-right precision pointer leader line (in local rootGroup space)
      // Extract camera's world right & up vectors from camera.matrixWorld
      _camRight.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
      _camUp.setFromMatrixColumn(camera.matrixWorld, 1).normalize();

      // Anchor point P0 on ring edge in upper-right direction relative to camera
      const rimDist = primaryScale * 0.98;
      if (plane === 'xz') {
        // Project camera right vector onto XZ plane for clean rim attachment
        _p0.set(_camRight.x, 0, _camRight.z);
        if (_p0.lengthSq() < 0.001) _p0.set(1, 0, 0);
        _p0.normalize().multiplyScalar(rimDist);
      } else {
        _p0
          .copy(_camRight)
          .multiplyScalar(rimDist * 0.72)
          .addScaledVector(_camUp, rimDist * 0.68);
      }

      const stemLen = Math.max(0.36, Math.min(0.88, currentRadius * 0.58 + 0.22));
      const horizLen = Math.max(0.24, Math.min(0.55, currentRadius * 0.32 + 0.14));

      _p1
        .copy(_p0)
        .addScaledVector(_camRight, stemLen * 0.55)
        .addScaledVector(_camUp, stemLen * 0.85);

      _p2.copy(_p1).addScaledVector(_camRight, horizLen);

      linePositions[0] = _p0.x;
      linePositions[1] = _p0.y;
      linePositions[2] = _p0.z;
      linePositions[3] = _p1.x;
      linePositions[4] = _p1.y;
      linePositions[5] = _p1.z;
      linePositions[6] = _p2.x;
      linePositions[7] = _p2.y;
      linePositions[8] = _p2.z;
      linePosAttr.needsUpdate = true;

      startDot.position.copy(_p0);
      tipDot.position.copy(_p2);

      // Compute world position of tip for 2D DOM tag projection
      tipWorldPos.copy(rootGroup.position).add(_p2);

      return { visible: true, opacity: currentOpacity };
    },
    getTipWorldPosition(out) {
      return out.copy(tipWorldPos);
    },
    dispose() {
      primaryRingGeo.dispose();
      haloRingGeo.dispose();
      tickGeo.dispose();
      lineGeo.dispose();
      dotGeo.dispose();
      primaryMat.dispose();
      haloMat.dispose();
      tickMat.dispose();
      lineMat.dispose();
    },
  };
}
