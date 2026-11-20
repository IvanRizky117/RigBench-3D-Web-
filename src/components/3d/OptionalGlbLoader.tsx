import React from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Warning } from '@phosphor-icons/react';

export interface LoadedGlbHandle {
  model: THREE.Group;
  dispose: () => void;
}

/**
 * Safely loads either public/models/motherboard.glb or a user-uploaded local .glb blob URL.
 * Automatically centers and normalizes scale to fit the Anti-Static Workbench (~10 units wide).
 */
export async function loadOptionalGlbModel(url: string): Promise<LoadedGlbHandle> {
  const loader = new GLTFLoader();

  const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
    loader.load(
      url,
      (result) => resolve(result),
      undefined,
      (error) => reject(error)
    );
  });

  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  const scaleFactor = 9.6 / maxDim;
  model.scale.setScalar(scaleFactor);

  // Recompute bounds after scaling so model sits flush on workbench (Y >= 0.02)
  model.updateMatrixWorld(true);
  const scaledBox = new THREE.Box3().setFromObject(model);
  const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

  model.position.x -= scaledCenter.x;
  model.position.z -= scaledCenter.z;
  model.position.y -= scaledBox.min.y - 0.02;

  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });

  const dispose = () => {
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          if (!m) return;
          const std = m as THREE.MeshStandardMaterial;
          std.map?.dispose();
          std.normalMap?.dispose();
          std.roughnessMap?.dispose();
          std.metalnessMap?.dispose();
          m.dispose();
        });
      }
    });
  };

  return { model, dispose };
}

interface LabErrorBoundaryProps {
  children: React.ReactNode;
  onResetToProcedural: () => void;
}

interface LabErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class OptionalGlbErrorBoundary extends React.Component<
  LabErrorBoundaryProps,
  LabErrorBoundaryState
> {
  constructor(props: LabErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(): LabErrorBoundaryState {
    return {
      hasError: true,
      message: 'Gagal merender viewport 3D atau berkas .glb tidak valid. Klik tombol di bawah untuk memulihkan studio.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="workbench-card flex h-[540px] flex-col items-center justify-center rounded-xl p-8 text-center">
          <Warning size={36} weight="duotone" className="text-[#F59E0B]" />
          <h3 className="mt-3 text-lg font-semibold text-[#F3F4F6]">
            Viewport 3D Memerlukan Pemulihan
          </h3>
          <p className="mt-1 max-w-md text-sm text-[#9CA3AF]">{this.state.message}</p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, message: '' });
              this.props.onResetToProcedural();
            }}
            className="mt-5 rounded-lg bg-[#06B6D4] px-4 py-2 text-sm font-semibold text-[#0B0E14] hover:bg-[#22D3EE] press-feedback"
          >
            Kembali ke Procedural PBR Studio
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
