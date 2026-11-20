import * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface CameraRigHandle {
  update: (delta: number) => boolean;
  dispose: () => void;
}

const BOUNDS = {
  minX: -9.5,
  maxX: 11.5,
  minY: 0.9,
  maxY: 16.5,
  minZ: -8.5,
  maxZ: 11.5,
  targetMinY: -0.2,
  targetMaxY: 3.8,
};

function isTypingElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

/**
 * Pure Three.js WASD + Arrow Keys (horizontal XZ) + Q/E (vertical elevation) camera rig.
 * Moves camera.position and OrbitControls.target in tandem with smooth exponential damping,
 * bounded safely around the Anti-Static Workbench so the user never gets lost.
 */
export function createCameraRigController(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  onManualMoveStart: () => void
): CameraRigHandle {
  const pressed = new Set<string>();
  const velocity = new THREE.Vector3();
  const desired = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const upAxis = new THREE.Vector3(0, 1, 0);
  const stepVec = new THREE.Vector3();

  const onKeyDown = (e: KeyboardEvent) => {
    if (isTypingElement(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    const code = e.code;
    if (
      code === 'KeyW' ||
      code === 'KeyA' ||
      code === 'KeyS' ||
      code === 'KeyD' ||
      code === 'KeyQ' ||
      code === 'KeyE' ||
      code === 'ArrowUp' ||
      code === 'ArrowDown' ||
      code === 'ArrowLeft' ||
      code === 'ArrowRight' ||
      code === 'ShiftLeft' ||
      code === 'ShiftRight'
    ) {
      if (code.startsWith('Arrow')) {
        e.preventDefault();
      }
      if (!pressed.has(code)) {
        pressed.add(code);
        onManualMoveStart();
      }
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    pressed.delete(e.code);
  };

  const onWindowBlur = () => {
    pressed.clear();
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onWindowBlur);

  const update = (delta: number): boolean => {
    desired.set(0, 0, 0);

    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 0.0001) {
      forward.set(0, 0, -1);
    } else {
      forward.normalize();
    }
    right.crossVectors(forward, upAxis).normalize();

    if (pressed.has('KeyW') || pressed.has('ArrowUp')) desired.add(forward);
    if (pressed.has('KeyS') || pressed.has('ArrowDown')) desired.sub(forward);
    if (pressed.has('KeyD') || pressed.has('ArrowRight')) desired.add(right);
    if (pressed.has('KeyA') || pressed.has('ArrowLeft')) desired.sub(right);
    if (pressed.has('KeyE')) desired.y += 0.85;
    if (pressed.has('KeyQ')) desired.y -= 0.85;

    const baseSpeed = pressed.has('ShiftLeft') || pressed.has('ShiftRight') ? 11.5 : 6.8;
    if (desired.lengthSq() > 0.0001) {
      desired.normalize().multiplyScalar(baseSpeed);
    }

    const dampFactor = 1 - Math.exp(-10 * delta);
    velocity.lerp(desired, dampFactor);

    if (velocity.lengthSq() < 0.0002) {
      velocity.set(0, 0, 0);
      return false;
    }

    stepVec.copy(velocity).multiplyScalar(delta);

    // Clamp target inside workbench bounding box, applying identical delta to camera
    const nextTargetX = THREE.MathUtils.clamp(controls.target.x + stepVec.x, BOUNDS.minX, BOUNDS.maxX);
    const nextTargetZ = THREE.MathUtils.clamp(controls.target.z + stepVec.z, BOUNDS.minZ, BOUNDS.maxZ);

    const appliedX = nextTargetX - controls.target.x;
    const appliedZ = nextTargetZ - controls.target.z;
    const nextCamY = THREE.MathUtils.clamp(camera.position.y + stepVec.y, BOUNDS.minY, BOUNDS.maxY);
    const appliedY = nextCamY - camera.position.y;

    controls.target.x += appliedX;
    controls.target.z += appliedZ;
    controls.target.y = THREE.MathUtils.clamp(
      controls.target.y + appliedY,
      BOUNDS.targetMinY,
      BOUNDS.targetMaxY
    );

    camera.position.x = THREE.MathUtils.clamp(camera.position.x + appliedX, BOUNDS.minX - 5, BOUNDS.maxX + 5);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z + appliedZ, BOUNDS.minZ - 5, BOUNDS.maxZ + 5);
    camera.position.y = nextCamY;

    return true;
  };

  const dispose = () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onWindowBlur);
    pressed.clear();
  };

  return { update, dispose };
}
