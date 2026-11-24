import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ArrowRight, Cube } from '@phosphor-icons/react';
import { buildProceduralMotherboard, detectSoftwareWebGL } from './motherboardBuilder';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { resolveRenderProfile } from '../../utils/deviceTier';

interface MiniMotherboardCanvasProps {
  onOpenFullLab: () => void;
  frameless?: boolean;
}

export function MiniMotherboardCanvas({
  onOpenFullLab,
  frameless = false,
}: MiniMotherboardCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const host = canvasHostRef.current;
    if (!container || !host) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const profile = resolveRenderProfile('auto', isSoftwareGl);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: profile.antialias,
        precision: profile.precision,
        alpha: true,
        powerPreference: profile.effectiveTier === 'low' ? 'default' : 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, profile.maxDpr));
    renderer.shadowMap.enabled = profile.shadowsEnabled;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = host.clientWidth || 460;
    const height = host.clientHeight || 360;
    renderer.setSize(width, height);
    host.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFailed(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    const scene = new THREE.Scene();
    scene.background = frameless ? null : new THREE.Color(0x030814);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(8.2, 7.6, 9.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0.4, 0.2, 0.0);
    controls.enablePan = false;
    controls.minDistance = 6.5;
    controls.maxDistance = 17;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.autoRotate = !reducedMotion && !isSoftwareGl;
    controls.autoRotateSpeed = 0.75;
    controls.update();

    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x02050c, 0.85);
    scene.add(hemi);
    const keyLight = new THREE.DirectionalLight(0xfff4e6, 1.55);
    keyLight.position.set(7, 12, 8);
    if (profile.shadowsEnabled) {
      keyLight.castShadow = true;
      const smSize = Math.min(profile.shadowMapSize, 1024);
      keyLight.shadow.mapSize.set(smSize, smSize);
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    rimLight.position.set(-8, 6, -7);
    scene.add(rimLight);

    const maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy(), profile.anisotropyCap);
    const built = buildProceduralMotherboard(maxAniso, profile.textureScale);
    built.workbenchMesh.visible = false;
    built.dataFlow.group.visible = true;
    scene.add(built.rootGroup);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let inView = true;
    let docVisible = !document.hidden;
    let frameId = 0;
    let disposed = false;
    const timer = new THREE.Timer();
    timer.connect(document);

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 120);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 8);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 90);
        }
      };
      frameId = window.setTimeout(poll, 8);
    };

    let lastRenderAt = 0;

    const tick = () => {
      if (disposed || !inView || !docVisible) return;
      if (!isSoftwareGl && profile.targetFps < 60) {
        const frameNow = performance.now();
        if (lastRenderAt > 0 && frameNow - lastRenderAt < 1000 / profile.targetFps - 1.5) {
          frameId = window.requestAnimationFrame(tick);
          return;
        }
        lastRenderAt = frameNow;
      }
      timer.update();
      const elapsed = timer.getElapsed();
      if (!reducedMotion) {
        built.dataFlow.update(elapsed);
        if (isSoftwareGl) {
          built.rootGroup.rotation.y += 0.008;
        }
      }
      controls.update();
      renderer.render(scene, camera);
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    const stopLoop = () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      frameId = 0;
    };

    const resumeIfActive = () => {
      if (!disposed && inView && docVisible && !frameId) {
        timer.reset();
        lastRenderAt = 0;
        tick();
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? true;
        if (visible && !inView) {
          inView = true;
          resumeIfActive();
        } else if (!visible) {
          inView = false;
          stopLoop();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const onVisibilityChange = () => {
      docVisible = !document.hidden;
      if (docVisible) {
        resumeIfActive();
      } else {
        stopLoop();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const onResize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(host);

    tick();

    return () => {
      disposed = true;
      inView = false;
      stopLoop();
      timer.dispose();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      controls.dispose();
      built.dispose();
      envRT.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [frameless, reducedMotion]);

  return (
    <div
      ref={containerRef}
      className={
        frameless
          ? 'relative flex h-[320px] w-full flex-col lg:h-full lg:min-h-[340px]'
          : 'datacore-card datacore-card-interactive relative flex h-[320px] w-full flex-col overflow-hidden rounded-2xl lg:h-full lg:min-h-[340px]'
      }
    >
      <div
        className={`flex items-center justify-between ${
          frameless
            ? 'px-2 py-2'
            : 'px-4 py-3 border-b border-[#3B82F6]/15 bg-[#040915]/90'
        }`}
      >
        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <Cube size={15} weight="duotone" className="text-[#38BDF8]" />
          <span className="font-medium text-[#F8FAFC]">Lab 3D Interaktif</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-[11px] text-[#38BDF8]">AKI-915P</span>
        </div>
        <button
          type="button"
          onClick={onOpenFullLab}
          className="inline-flex min-h-[36px] items-center gap-1 text-xs font-medium text-[#38BDF8] hover:text-[#7DD3FC] whitespace-nowrap press-feedback"
        >
          Buka Lab 3D
          <ArrowRight size={13} weight="bold" />
        </button>
      </div>

      {webglFailed ? (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <Cube size={32} className="text-[#38BDF8]" />
          <p className="mt-2 text-sm font-medium text-[#F8FAFC]">Pratinjau 3D Motherboard</p>
          <p className="mt-1 text-xs text-[#94A3B8]">
            Buka Lab 3D untuk eksplorasi 24 titik mainboard &amp; game rakit TAS.
          </p>
        </div>
      ) : (
        <div ref={canvasHostRef} className="relative flex-1 w-full cursor-grab active:cursor-grabbing" />
      )}

      <div
        className={`flex items-center justify-between text-[11px] font-mono text-[#94A3B8] ${
          frameless
            ? 'px-2 py-2'
            : 'px-4 py-2.5 border-t border-[#3B82F6]/15 bg-[#040915]/90'
        }`}
      >
        <span>Drag untuk orbit 360°</span>
        <span className="text-[#38BDF8]">24 Titik + C-Panel</span>
      </div>
    </div>
  );
}
