import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { DirectorKeyframe, TheaterSceneKind } from '../../data/theaterDirectorTimeline';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { resolveRenderProfile } from '../../utils/deviceTier';
import {
  buildStudioMotherboard,
  type BuiltStudioMotherboard,
} from './studioMotherboardBuilder';
import {
  buildCpuDiorama,
  buildElectronicsDiorama,
  buildHddDiorama,
  buildPsuDiorama,
  buildRamDiorama,
} from './theaterDioramas';
import { buildMonitorTerminalDiorama } from './theaterMonitorDiorama';
import type { BuiltTheaterDiorama } from './theaterDioramaCore';

interface Theater3DStageCanvasProps {
  sceneKind: TheaterSceneKind;
  keyframe: DirectorKeyframe;
  isPlaying: boolean;
  resyncSignal: number;
  onManualOrbitChange: (isManual: boolean) => void;
  onWebglFailed: () => void;
}

const _targetCamPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();
const _spotTargetPos = new THREE.Vector3();
const _spotColor = new THREE.Color();
const _domainColor = new THREE.Color();

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return false;
    const renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
    return /SwiftShader|llvmpipe|Software|Microsoft Basic Render/i.test(renderer);
  } catch {
    return true;
  }
}

export function Theater3DStageCanvas({
  sceneKind,
  keyframe,
  isPlaying,
  resyncSignal,
  onManualOrbitChange,
  onWebglFailed,
}: Theater3DStageCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  // Mutable refs read inside 60fps loop without triggering WebGL re-initialization
  const keyframeRef = useRef<DirectorKeyframe>(keyframe);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const manualOrbitRef = useRef<boolean>(false);
  const prevKeyframeIdRef = useRef<string>(keyframe.id);
  const prevPlayingRef = useRef<boolean>(isPlaying);

  const onManualOrbitChangeRef = useRef(onManualOrbitChange);
  const onWebglFailedRef = useRef(onWebglFailed);

  onManualOrbitChangeRef.current = onManualOrbitChange;
  onWebglFailedRef.current = onWebglFailed;

  keyframeRef.current = keyframe;
  isPlayingRef.current = isPlaying;

  // Resume cinematic camera when user clicks "Ikuti Kamera" or clicks a chapter dot on the timeline
  useEffect(() => {
    if (resyncSignal > 0 && manualOrbitRef.current) {
      manualOrbitRef.current = false;
      onManualOrbitChangeRef.current(false);
    }
  }, [resyncSignal]);

  // Resume cinematic tracking when Play starts or narration transitions to next component while playing
  useEffect(() => {
    const startedPlaying = isPlaying && !prevPlayingRef.current;
    const keyframeChangedWhilePlaying = isPlaying && keyframe.id !== prevKeyframeIdRef.current;
    prevPlayingRef.current = isPlaying;
    prevKeyframeIdRef.current = keyframe.id;

    if ((startedPlaying || keyframeChangedWhilePlaying) && manualOrbitRef.current) {
      manualOrbitRef.current = false;
      onManualOrbitChangeRef.current(false);
    }
  }, [isPlaying, keyframe.id]);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    manualOrbitRef.current = false;
    onManualOrbitChangeRef.current(false);

    const isSoftwareGl = detectSoftwareGl();
    const profile = resolveRenderProfile('auto', isSoftwareGl);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: profile.antialias,
        alpha: false,
        powerPreference: profile.effectiveTier === 'low' ? 'default' : 'high-performance',
      });
    } catch {
      onWebglFailedRef.current();
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, profile.maxDpr));
    renderer.shadowMap.enabled = profile.shadowsEnabled;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = Math.max(240, host.clientWidth || 640);
    const height = Math.max(180, host.clientHeight || 360);
    renderer.setSize(width, height);
    host.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      onWebglFailedRef.current();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    const scene = new THREE.Scene();
    // Seamlessly matches frameless dark theater shell (#04070E)
    scene.background = new THREE.Color(0x04070e);
    scene.fog = new THREE.FogExp2(0x04070e, 0.028);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmrem.dispose();

    // Dark Documentary Studio Lighting Rig:
    // Soft low ambient + warm overhead key + cool rim + moving dramatic Studio SpotLight!
    const hemi = new THREE.HemisphereLight(0xcbd5e1, 0x050810, 0.42);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff5e8, 0.88);
    keyLight.position.set(6.5, 11.0, 6.5);
    if (profile.shadowsEnabled) {
      keyLight.castShadow = true;
      const sm = Math.min(profile.shadowMapSize, 1024);
      keyLight.shadow.mapSize.set(sm, sm);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 30;
      keyLight.shadow.camera.left = -9;
      keyLight.shadow.camera.right = 9;
      keyLight.shadow.camera.top = 9;
      keyLight.shadow.camera.bottom = -9;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.55);
    rimLight.position.set(-8.0, 5.5, -7.5);
    scene.add(rimLight);

    // Dramatic Moving Studio Spotlight that smoothly glides onto the active component!
    const initKf = keyframeRef.current;
    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(initKf.anchor3D[0], initKf.anchor3D[1], initKf.anchor3D[2]);
    scene.add(spotTarget);

    const studioSpot = new THREE.SpotLight(0xfff8ef, 42, 22, Math.PI * 0.2, 0.62, 1.5);
    studioSpot.position.set(initKf.anchor3D[0] + 1.8, 7.2, initKf.anchor3D[2] + 1.8);
    studioSpot.target = spotTarget;
    scene.add(studioSpot);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 80);
    camera.position.set(initKf.cameraPos[0], initKf.cameraPos[1], initKf.cameraPos[2]);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(initKf.cameraLookAt[0], initKf.cameraLookAt[1], initKf.cameraLookAt[2]);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.minDistance = 1.6;
    controls.maxDistance = 15.0;
    controls.maxPolarAngle = Math.PI * 0.485;
    controls.update();

    const onControlStart = () => {
      if (!manualOrbitRef.current) {
        manualOrbitRef.current = true;
        onManualOrbitChangeRef.current(true);
      }
    };
    controls.addEventListener('start', onControlStart);

    // Build selected Studio 3D scene
    const maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy(), profile.anisotropyCap);
    let studioMobo: BuiltStudioMotherboard | null = null;
    let dioramaBuilt: BuiltTheaterDiorama | null = null;

    if (sceneKind === 'motherboard') {
      studioMobo = buildStudioMotherboard(maxAniso, profile.textureScale);
      scene.add(studioMobo.rootGroup);
    } else if (sceneKind === 'ram-diorama') {
      dioramaBuilt = buildRamDiorama(maxAniso, profile.textureScale);
      scene.add(dioramaBuilt.rootGroup);
    } else if (sceneKind === 'cpu-diorama') {
      dioramaBuilt = buildCpuDiorama(maxAniso, profile.textureScale);
      scene.add(dioramaBuilt.rootGroup);
    } else if (sceneKind === 'psu-diorama') {
      dioramaBuilt = buildPsuDiorama(maxAniso, profile.textureScale);
      scene.add(dioramaBuilt.rootGroup);
    } else if (sceneKind === 'hdd-diorama') {
      dioramaBuilt = buildHddDiorama(maxAniso, profile.textureScale);
      scene.add(dioramaBuilt.rootGroup);
    } else if (sceneKind === 'electronics-diorama') {
      dioramaBuilt = buildElectronicsDiorama(maxAniso, profile.textureScale);
      scene.add(dioramaBuilt.rootGroup);
    } else {
      dioramaBuilt = buildMonitorTerminalDiorama(sceneKind, maxAniso, profile.textureScale);
      scene.add(dioramaBuilt.rootGroup);
    }

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
        frameId = window.setTimeout(cb, 110);
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
          frameId = window.setTimeout(cb, 75);
        }
      };
      frameId = window.setTimeout(poll, 8);
    };

    const tick = () => {
      if (disposed || !inView || !docVisible) return;
      timer.update();
      const dt = Math.min(timer.getDelta(), 0.05);
      const elapsed = timer.getElapsed();
      const kf = keyframeRef.current;
      const playing = isPlayingRef.current;

      // 1. Smooth cinematic ~0.8s camera glide when following narration
      if (!manualOrbitRef.current) {
        const swayX = !reducedMotion && playing ? Math.sin(elapsed * 0.42) * 0.14 : 0;
        const swayY = !reducedMotion && playing ? Math.cos(elapsed * 0.34) * 0.07 : 0;
        _targetCamPos.set(
          kf.cameraPos[0] + swayX,
          kf.cameraPos[1] + swayY,
          kf.cameraPos[2]
        );
        _targetLook.set(kf.cameraLookAt[0], kf.cameraLookAt[1], kf.cameraLookAt[2]);

        const dampRate = reducedMotion ? 18 : 5.2;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamPos.x, dampRate, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamPos.y, dampRate, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamPos.z, dampRate, dt);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetLook.x, dampRate, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetLook.y, dampRate, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetLook.z, dampRate, dt);
      }

      controls.update();

      // 2. Smoothly glide dramatic overhead studio spotlight onto the active component
      _spotTargetPos.set(kf.anchor3D[0], kf.anchor3D[1], kf.anchor3D[2]);
      spotTarget.position.x = THREE.MathUtils.damp(spotTarget.position.x, _spotTargetPos.x, 6, dt);
      spotTarget.position.y = THREE.MathUtils.damp(spotTarget.position.y, _spotTargetPos.y, 6, dt);
      spotTarget.position.z = THREE.MathUtils.damp(spotTarget.position.z, _spotTargetPos.z, 6, dt);

      const spotZOffset = _spotTargetPos.z < -3.0 ? -2.4 : 1.9;
      studioSpot.position.x = THREE.MathUtils.damp(
        studioSpot.position.x,
        _spotTargetPos.x + 1.4,
        5,
        dt
      );
      studioSpot.position.z = THREE.MathUtils.damp(
        studioSpot.position.z,
        _spotTargetPos.z + spotZOffset,
        5,
        dt
      );

      // Blend crisp studio warm-white with subtle tint of active domain color
      _domainColor.set(kf.domainColor);
      _spotColor.set('#FFF8EF').lerp(_domainColor, 0.18);
      studioSpot.color.lerp(_spotColor, Math.min(1, dt * 6));

      // 3. Scene-specific mechanical animations & active sheen
      if (studioMobo) {
        studioMobo.update(
          elapsed,
          dt,
          kf.highlightId,
          kf.mechAction,
          kf.domainColor,
          playing,
          reducedMotion
        );
      } else if (dioramaBuilt) {
        dioramaBuilt.update(elapsed, dt, kf.mechAction, kf.anchor3D, kf.domainColor, playing);
      }

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
        tick();
      }
    };

    const intersectionObserver = new IntersectionObserver(
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
    intersectionObserver.observe(host);

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
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      resizeObserver.disconnect();
      controls.removeEventListener('start', onControlStart);
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      studioMobo?.dispose();
      dioramaBuilt?.dispose();
      envRT.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [sceneKind, reducedMotion]);

  return (
    <div
      ref={containerRef}
      aria-label="Panggung Visual 3D Studio Dokumenter Perangkat Keras"
      className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
    />
  );
}
