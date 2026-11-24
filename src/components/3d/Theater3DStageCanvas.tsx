import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type {
  DirectorKeyframe,
  TheaterGuideMode,
  TheaterSceneKind,
} from '../../data/theaterDirectorTimeline';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { isSoftwareWebGLCached, resolveRenderProfile } from '../../utils/deviceTier';
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
import { buildStoryArchUnitsScene } from './storyArchUnitsScene';
import { buildStoryArchPerfScene } from './storyArchPerfScene';
import { buildStoryArchParallelScene } from './storyArchParallelScene';
import { buildStoryHistoryMechScene } from './storyHistoryMechScene';
import { buildStoryHistoryGen5Scene } from './storyHistoryGen5Scene';
import { buildStoryHistoryClassScene } from './storyHistoryClassScene';
import { buildMonitorTerminalDiorama } from './theaterMonitorDiorama';
import type { BuiltTheaterDiorama } from './theaterDioramaCore';
import { createTheaterFocusMarker } from './theaterFocusMarker';

interface Theater3DStageCanvasProps {
  sceneKind: TheaterSceneKind;
  keyframe: DirectorKeyframe;
  keyframeIndex?: number;
  progressPct?: number;
  guideMode: TheaterGuideMode;
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
const _tipWorld = new THREE.Vector3();
const _compBox = new THREE.Box3();
const _compSize = new THREE.Vector3();

export function Theater3DStageCanvas({
  sceneKind,
  keyframe,
  keyframeIndex = 0,
  progressPct = 0,
  guideMode,
  isPlaying,
  resyncSignal,
  onManualOrbitChange,
  onWebglFailed,
}: Theater3DStageCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tagElRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  // Mutable refs read inside 60fps loop without triggering WebGL re-initialization
  const keyframeRef = useRef<DirectorKeyframe>(keyframe);
  const keyframeIndexRef = useRef<number>(keyframeIndex);
  const progressPctRef = useRef<number>(progressPct);
  const guideModeRef = useRef<TheaterGuideMode>(guideMode);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const manualOrbitRef = useRef<boolean>(false);
  const prevKeyframeIdRef = useRef<string>(keyframe.id);
  const prevPlayingRef = useRef<boolean>(isPlaying);

  const onManualOrbitChangeRef = useRef(onManualOrbitChange);
  const onWebglFailedRef = useRef(onWebglFailed);

  onManualOrbitChangeRef.current = onManualOrbitChange;
  onWebglFailedRef.current = onWebglFailed;

  keyframeRef.current = keyframe;
  keyframeIndexRef.current = keyframeIndex;
  progressPctRef.current = progressPct;
  guideModeRef.current = guideMode;
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

    const isSoftwareGl = isSoftwareWebGLCached();
    const profile = resolveRenderProfile('auto', isSoftwareGl);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: profile.antialias,
        precision: profile.precision,
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

    let viewportW = Math.max(240, host.clientWidth || 640);
    let viewportH = Math.max(180, host.clientHeight || 360);
    renderer.setSize(viewportW, viewportH);
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

    const useEnvMap = profile.effectiveTier !== 'low';
    let envRT: THREE.WebGLRenderTarget | null = null;
    if (useEnvMap) {
      const pmrem = new THREE.PMREMGenerator(renderer);
      envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envRT.texture;
      pmrem.dispose();
    }

    // Dark Documentary Studio Lighting Rig (ambient smoothly dims in Guide modes to isolate target)
    const darkHemiBoost = useEnvMap ? 0 : 0.28;
    const hemi = new THREE.HemisphereLight(0xcbd5e1, 0x050810, 0.42 + darkHemiBoost);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff5e8, useEnvMap ? 0.88 : 1.05);
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

    const rimLight = new THREE.DirectionalLight(0x38bdf8, useEnvMap ? 0.55 : 0.72);
    rimLight.position.set(-8.0, 5.5, -7.5);
    scene.add(rimLight);

    // Dramatic Moving Studio Spotlight that smoothly glides onto the active component
    const initKf = keyframeRef.current;
    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(initKf.anchor3D[0], initKf.anchor3D[1], initKf.anchor3D[2]);
    scene.add(spotTarget);

    const studioSpot = new THREE.SpotLight(0xfff8ef, 48, 24, Math.PI * 0.18, 0.6, 1.45);
    studioSpot.position.set(initKf.anchor3D[0] + 1.8, 7.2, initKf.anchor3D[2] + 1.8);
    studioSpot.target = spotTarget;
    scene.add(studioSpot);

    const camera = new THREE.PerspectiveCamera(38, viewportW / viewportH, 0.1, 80);
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
    } else if (sceneKind === 'arch-bus-diorama') {
      dioramaBuilt = buildStoryArchUnitsScene(maxAniso, profile.textureScale);
      scene.add(dioramaBuilt.rootGroup);
    } else if (sceneKind === 'arch-perf-diorama') {
      dioramaBuilt = buildStoryArchPerfScene(maxAniso, profile.textureScale);
      scene.add(dioramaBuilt.rootGroup);
    } else if (sceneKind === 'arch-parallel-diorama') {
      dioramaBuilt = buildStoryArchParallelScene(maxAniso, profile.textureScale);
      scene.add(dioramaBuilt.rootGroup);
    } else if (sceneKind === 'history-mech-diorama') {
      dioramaBuilt = buildStoryHistoryMechScene(maxAniso, profile.textureScale);
      scene.add(dioramaBuilt.rootGroup);
    } else if (sceneKind === 'history-gen5-diorama') {
      dioramaBuilt = buildStoryHistoryGen5Scene(maxAniso, profile.textureScale);
      scene.add(dioramaBuilt.rootGroup);
    } else if (sceneKind === 'history-class-sw-diorama') {
      dioramaBuilt = buildStoryHistoryClassScene(maxAniso, profile.textureScale);
      scene.add(dioramaBuilt.rootGroup);
    } else {
      dioramaBuilt = buildMonitorTerminalDiorama(sceneKind, maxAniso, profile.textureScale);
      scene.add(dioramaBuilt.rootGroup);
    }

    const isStoryBright = dioramaBuilt?.stageTheme === 'story-bright';
    const storyAtmo = dioramaBuilt?.initialAtmosphere;
    const storyHemiTarget = storyAtmo ? storyAtmo.hemiIntensity + (useEnvMap ? 0 : 0.16) : 0.85;
    if (isStoryBright && storyAtmo) {
      scene.background = new THREE.Color(storyAtmo.backgroundHex);
      scene.fog = new THREE.Fog(storyAtmo.fogHex, storyAtmo.fogNear, storyAtmo.fogFar);
      hemi.color.setHex(storyAtmo.hemiSkyHex);
      hemi.groundColor.setHex(storyAtmo.hemiGroundHex);
      hemi.intensity = storyHemiTarget;
      keyLight.color.setHex(storyAtmo.keyHex);
      keyLight.intensity = storyAtmo.keyIntensity;
      keyLight.position.set(8.5, 13.0, 7.5);
      keyLight.shadow.camera.left = -12;
      keyLight.shadow.camera.right = 12;
      keyLight.shadow.camera.top = 12;
      keyLight.shadow.camera.bottom = -12;
      keyLight.shadow.normalBias = 0.02;
      rimLight.color.setHex(storyAtmo.rimHex);
      rimLight.intensity = storyAtmo.rimIntensity;
      scene.environmentIntensity = storyAtmo.envIntensity;
      renderer.toneMappingExposure = 1.06;
      camera.far = 110;
      camera.updateProjectionMatrix();
      controls.maxDistance = 19.5;
    }

    // Precision 3D Focus Ring + Leader Pointer Line (used on dark hardware scenes; hidden on bright story scenes)
    const focusMarker = createTheaterFocusMarker();
    if (!isStoryBright) {
      scene.add(focusMarker.rootGroup);
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

    let lastRenderAt = 0;
    let cachedRadiusKfId = '';
    let cachedFocusRadius = 0.85;

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
      const dt = Math.min(timer.getDelta(), 0.05);
      const elapsed = timer.getElapsed();
      const kf = keyframeRef.current;
      const playing = isPlayingRef.current;
      const markerActive = guideModeRef.current !== 'cinema';

      // 1. Smooth cinematic ~0.8s camera glide when following narration
      if (!manualOrbitRef.current) {
        const swayX = !reducedMotion && playing ? Math.sin(elapsed * 0.42) * 0.12 : 0;
        const swayY = !reducedMotion && playing ? Math.cos(elapsed * 0.34) * 0.06 : 0;
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
      camera.updateMatrixWorld();

      // 2. Lighting behavior: keep story-bright worlds vivid with gentle warm spotlight; dim dark studio only on hardware scenes
      const lightDamp = 6.5;
      if (isStoryBright && storyAtmo) {
        hemi.intensity = THREE.MathUtils.damp(hemi.intensity, storyHemiTarget, lightDamp, dt);
        keyLight.intensity = THREE.MathUtils.damp(keyLight.intensity, storyAtmo.keyIntensity, lightDamp, dt);
        rimLight.intensity = THREE.MathUtils.damp(rimLight.intensity, storyAtmo.rimIntensity, lightDamp, dt);
        scene.environmentIntensity = THREE.MathUtils.damp(
          scene.environmentIntensity,
          storyAtmo.envIntensity,
          lightDamp,
          dt
        );
        studioSpot.intensity = THREE.MathUtils.damp(studioSpot.intensity, markerActive ? 22 : 10, lightDamp, dt);
        studioSpot.angle = THREE.MathUtils.damp(studioSpot.angle, Math.PI * 0.24, lightDamp, dt);
      } else {
        hemi.intensity = THREE.MathUtils.damp(
          hemi.intensity,
          (markerActive ? 0.18 : 0.42) + darkHemiBoost,
          lightDamp,
          dt
        );
        keyLight.intensity = THREE.MathUtils.damp(
          keyLight.intensity,
          markerActive ? (useEnvMap ? 0.38 : 0.52) : (useEnvMap ? 0.88 : 1.05),
          lightDamp,
          dt
        );
        rimLight.intensity = THREE.MathUtils.damp(
          rimLight.intensity,
          markerActive ? (useEnvMap ? 0.28 : 0.4) : (useEnvMap ? 0.55 : 0.72),
          lightDamp,
          dt
        );
        scene.environmentIntensity = THREE.MathUtils.damp(
          scene.environmentIntensity,
          markerActive ? 0.46 : 1.0,
          lightDamp,
          dt
        );
        studioSpot.intensity = THREE.MathUtils.damp(
          studioSpot.intensity,
          markerActive ? 74 : 42,
          lightDamp,
          dt
        );
        studioSpot.angle = THREE.MathUtils.damp(
          studioSpot.angle,
          markerActive ? Math.PI * 0.145 : Math.PI * 0.2,
          lightDamp,
          dt
        );
      }

      // 3. Smoothly glide warm overhead spotlight onto the active actor/component
      _spotTargetPos.set(kf.anchor3D[0], kf.anchor3D[1], kf.anchor3D[2]);
      spotTarget.position.x = THREE.MathUtils.damp(spotTarget.position.x, _spotTargetPos.x, 6, dt);
      spotTarget.position.y = THREE.MathUtils.damp(spotTarget.position.y, _spotTargetPos.y, 6, dt);
      spotTarget.position.z = THREE.MathUtils.damp(spotTarget.position.z, _spotTargetPos.z, 6, dt);

      const spotZOffset = _spotTargetPos.z < -3.0 ? -2.4 : 1.9;
      studioSpot.position.x = THREE.MathUtils.damp(
        studioSpot.position.x,
        _spotTargetPos.x + 1.3,
        5,
        dt
      );
      studioSpot.position.z = THREE.MathUtils.damp(
        studioSpot.position.z,
        _spotTargetPos.z + spotZOffset,
        5,
        dt
      );

      if (isStoryBright) {
        _spotColor.set('#FFE8B6');
      } else {
        _domainColor.set(kf.domainColor);
        _spotColor.set('#FFF8EF').lerp(_domainColor, markerActive ? 0.22 : 0.14);
      }
      studioSpot.color.lerp(_spotColor, Math.min(1, dt * 6));

      // 4. Scene-specific mechanical & story animations
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
        dioramaBuilt.update(elapsed, dt, kf.mechAction, kf.anchor3D, kf.domainColor, playing, {
          progressPct: progressPctRef.current,
          keyframeId: kf.id,
          keyframeIndex: keyframeIndexRef.current,
          reducedMotion,
        });
      }

      // 5. Resolve focus ring radius (cached per keyframe ID to avoid per-frame Box3 traversal)
      if (kf.id !== cachedRadiusKfId) {
        cachedRadiusKfId = kf.id;
        if (kf.focusRadius !== undefined) {
          cachedFocusRadius = kf.focusRadius;
        } else if (studioMobo && kf.highlightId && studioMobo.componentGroups[kf.highlightId]) {
          _compBox.setFromObject(studioMobo.componentGroups[kf.highlightId]);
          _compBox.getSize(_compSize);
          cachedFocusRadius = Math.max(
            0.35,
            Math.min(2.1, Math.max(_compSize.x, _compSize.z) * 0.56)
          );
        } else {
          cachedFocusRadius = 0.85;
        }
      }
      const resolvedRadius = cachedFocusRadius;

      const markerState = focusMarker.update({
        elapsed,
        dt,
        visible: !isStoryBright && markerActive,
        anchor: kf.anchor3D,
        radius: resolvedRadius,
        plane: kf.focusPlane ?? 'xz',
        colorHex: kf.domainColor,
        isPlaying: playing,
        reducedMotion,
        camera,
      });

      renderer.render(scene, camera);

      // 6. Project 3D pointer tip (or top-of-anchor on bright story scenes) onto slim HUD tag
      const tagEl = tagElRef.current;
      if (tagEl) {
        if (isStoryBright) {
          if (!markerActive) {
            tagEl.style.opacity = '0';
          } else {
            _tipWorld.set(kf.anchor3D[0], kf.anchor3D[1] + 1.55, kf.anchor3D[2]);
            _tipWorld.project(camera);
            const inFront = _tipWorld.z >= -1 && _tipWorld.z <= 1;
            if (!inFront) {
              tagEl.style.opacity = '0';
            } else {
              const rawX = (_tipWorld.x * 0.5 + 0.5) * viewportW;
              const rawY = (-_tipWorld.y * 0.5 + 0.5) * viewportH;
              const tagW = tagEl.offsetWidth || 168;
              const tagH = tagEl.offsetHeight || 28;
              const clampedX = Math.max(12, Math.min(viewportW - tagW - 12, rawX - tagW * 0.5));
              const clampedY = Math.max(12, Math.min(viewportH * 0.34, rawY - tagH));
              tagEl.style.transform = `translate3d(${clampedX.toFixed(1)}px, ${clampedY.toFixed(1)}px, 0)`;
              tagEl.style.opacity = '0.96';
            }
          }
        } else if (!markerState.visible || markerState.opacity < 0.03) {
          tagEl.style.opacity = '0';
        } else {
          focusMarker.getTipWorldPosition(_tipWorld);
          _tipWorld.project(camera);
          const inFront = _tipWorld.z >= -1 && _tipWorld.z <= 1;
          if (!inFront) {
            tagEl.style.opacity = '0';
          } else {
            const rawX = (_tipWorld.x * 0.5 + 0.5) * viewportW;
            const rawY = (-_tipWorld.y * 0.5 + 0.5) * viewportH;
            const tagW = tagEl.offsetWidth || 156;
            const tagH = tagEl.offsetHeight || 28;
            const clampedX = Math.max(12, Math.min(viewportW - tagW - 12, rawX + 6));
            const clampedY = Math.max(12, Math.min(viewportH - tagH - 18, rawY - tagH * 0.5));
            tagEl.style.transform = `translate3d(${clampedX.toFixed(1)}px, ${clampedY.toFixed(1)}px, 0)`;
            tagEl.style.opacity = markerState.opacity.toFixed(2);
          }
        }
      }

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
      viewportW = w;
      viewportH = h;
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
      focusMarker.dispose();
      studioMobo?.dispose();
      dioramaBuilt?.dispose();
      envRT?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [sceneKind, reducedMotion]);

  // Avoid duplicate point number if shortLabel already starts with pdfBadge (e.g. "#16 PS/2 Hijau")
  const tagName = keyframe.shortLabel.startsWith(keyframe.pdfBadge)
    ? keyframe.shortLabel.slice(keyframe.pdfBadge.length).trim()
    : keyframe.shortLabel;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        ref={containerRef}
        aria-label="Panggung Visual 3D Studio Dokumenter Perangkat Keras"
        className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
      />

      {/* Slim Floating 3D Pointer Tag (zero backdrop-filter over WebGL, 60fps direct transform) */}
      <div
        ref={tagElRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 z-10 flex max-w-[230px] items-center gap-1.5 rounded-md border border-white/15 bg-[#060C18]/92 px-2 py-1 shadow-[0_6px_18px_rgba(0,0,0,0.72)] will-change-transform"
        style={{ opacity: 0, transform: 'translate3d(-999px, -999px, 0)' }}
      >
        <span
          className="shrink-0 font-mono text-[10px] font-bold tracking-wide"
          style={{ color: keyframe.domainColor }}
        >
          {keyframe.pdfBadge}
        </span>
        {tagName && (
          <>
            <span className="text-[10px] text-[#475569]">·</span>
            <span className="truncate text-[11px] font-medium text-[#F1F5F9]">
              {tagName}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
