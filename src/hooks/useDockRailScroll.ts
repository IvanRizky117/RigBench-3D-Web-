import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { AssemblyStepId } from '../types/rigbench';

export interface DockEdgeFadeState {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  overscrollDir: -1 | 0 | 1;
}

interface UseDockRailScrollOptions {
  dockRef: RefObject<HTMLDivElement | null>;
  scrollRailRef: RefObject<HTMLDivElement | null>;
  isRailActive: boolean;
  railDependencyKey: string;
  onStartDragItem: (
    id: AssemblyStepId,
    clientX: number,
    clientY: number,
    pointerId?: number
  ) => void;
  onSelectItem: (id: AssemblyStepId) => void;
  onUninstallItem: (id: AssemblyStepId) => void;
  onStepCategory: (dir: -1 | 1) => void;
}

const WHEEL_OVERSCROLL_THRESHOLD = 72;
const MOUSE_DRAG_OVERSCROLL_THRESHOLD = 48;
const TOUCH_PULL_OVERSCROLL_THRESHOLD = 42;
const TAB_SWITCH_COOLDOWN_MS = 550;

export function useDockRailScroll({
  dockRef,
  scrollRailRef,
  isRailActive,
  railDependencyKey,
  onStartDragItem,
  onSelectItem,
  onUninstallItem,
  onStepCategory,
}: UseDockRailScrollOptions) {
  const [fadeState, setFadeState] = useState<DockEdgeFadeState>({
    canScrollLeft: false,
    canScrollRight: false,
    overscrollDir: 0,
  });

  const callbacksRef = useRef({
    onStartDragItem,
    onSelectItem,
    onUninstallItem,
    onStepCategory,
  });
  callbacksRef.current = {
    onStartDragItem,
    onSelectItem,
    onUninstallItem,
    onStepCategory,
  };

  const switchCooldownUntilRef = useRef<number>(0);
  const wheelOverscrollRef = useRef<{ accum: number; lastTs: number }>({
    accum: 0,
    lastTs: 0,
  });
  const activePointerCleanupRef = useRef<(() => void) | null>(null);
  const overscrollIndicatorTimerRef = useRef<number | null>(null);

  const flashOverscrollDir = useCallback((dir: -1 | 1) => {
    setFadeState((prev) => ({ ...prev, overscrollDir: dir }));
    if (overscrollIndicatorTimerRef.current !== null) {
      window.clearTimeout(overscrollIndicatorTimerRef.current);
    }
    overscrollIndicatorTimerRef.current = window.setTimeout(() => {
      setFadeState((prev) => (prev.overscrollDir === 0 ? prev : { ...prev, overscrollDir: 0 }));
    }, 360);
  }, []);

  const triggerEdgeTabSwitch = useCallback(
    (dir: -1 | 1): boolean => {
      const now = performance.now();
      if (now < switchCooldownUntilRef.current) return false;
      switchCooldownUntilRef.current = now + TAB_SWITCH_COOLDOWN_MS;
      wheelOverscrollRef.current = { accum: 0, lastTs: 0 };
      flashOverscrollDir(dir);
      callbacksRef.current.onStepCategory(dir);
      return true;
    },
    [flashOverscrollDir]
  );

  const syncScrollEdges = useCallback(() => {
    const rail = scrollRailRef.current;
    if (!rail) {
      setFadeState((prev) =>
        prev.canScrollLeft || prev.canScrollRight
          ? { ...prev, canScrollLeft: false, canScrollRight: false }
          : prev
      );
      return;
    }
    const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const nextLeft = rail.scrollLeft > 4;
    const nextRight = maxScroll > 4 && rail.scrollLeft < maxScroll - 4;
    setFadeState((prev) => {
      if (prev.canScrollLeft === nextLeft && prev.canScrollRight === nextRight) {
        return prev;
      }
      return { ...prev, canScrollLeft: nextLeft, canScrollRight: nextRight };
    });
  }, [scrollRailRef]);

  // Cleanup any in-flight pointer listeners & timers on unmount
  useEffect(() => {
    return () => {
      activePointerCleanupRef.current?.();
      activePointerCleanupRef.current = null;
      if (overscrollIndicatorTimerRef.current !== null) {
        window.clearTimeout(overscrollIndicatorTimerRef.current);
      }
    };
  }, []);

  // Desktop vertical wheel -> horizontal scroll + edge overscroll tab switching
  // Mobile touch-pan-x edge pull -> bidirectional tab switching
  useEffect(() => {
    const rail = scrollRailRef.current;
    if (!isRailActive || !rail) return;

    syncScrollEdges();

    const ro = new ResizeObserver(syncScrollEdges);
    ro.observe(rail);

    const onScroll = () => syncScrollEdges();
    rail.addEventListener('scroll', onScroll, { passive: true });

    const onWheel = (e: WheelEvent) => {
      const primaryDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (primaryDelta === 0) return;

      e.preventDefault();
      const scale = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? 240 : 1;
      const delta = primaryDelta * scale;

      const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
      const prevLeft = rail.scrollLeft;

      if (maxScroll > 2) {
        rail.scrollLeft = Math.max(0, Math.min(maxScroll, prevLeft + delta));
      }

      const now = performance.now();
      const atRightEdge = maxScroll <= 2 || rail.scrollLeft >= maxScroll - 2;
      const atLeftEdge = maxScroll <= 2 || rail.scrollLeft <= 2;

      if ((delta > 0 && atRightEdge) || (delta < 0 && atLeftEdge)) {
        const ws = wheelOverscrollRef.current;
        if (now - ws.lastTs > 260 || (ws.accum !== 0 && Math.sign(ws.accum) !== Math.sign(delta))) {
          ws.accum = 0;
        }
        ws.lastTs = now;
        ws.accum += delta;

        if (ws.accum >= WHEEL_OVERSCROLL_THRESHOLD && atRightEdge) {
          triggerEdgeTabSwitch(1);
        } else if (ws.accum <= -WHEEL_OVERSCROLL_THRESHOLD && atLeftEdge) {
          triggerEdgeTabSwitch(-1);
        }
      } else {
        wheelOverscrollRef.current = { accum: 0, lastTs: now };
      }

      syncScrollEdges();
    };

    // Native touch edge-pull listener (works smoothly alongside touch-pan-x momentum)
    let touchStartX = 0;
    let touchStartY = 0;
    let touchActive = false;
    let touchSwitched = false;
    let startedAtLeft = false;
    let startedAtRight = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        touchActive = false;
        return;
      }
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchActive = true;
      touchSwitched = false;
      const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
      startedAtLeft = rail.scrollLeft <= 3;
      startedAtRight = maxScroll <= 3 || rail.scrollLeft >= maxScroll - 3;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchActive || touchSwitched || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;

      if (Math.abs(dy) > Math.abs(dx) * 1.15) {
        touchActive = false;
        return;
      }

      const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
      const nowAtLeft = rail.scrollLeft <= 3;
      const nowAtRight = maxScroll <= 3 || rail.scrollLeft >= maxScroll - 3;

      if (nowAtRight && dx < -TOUCH_PULL_OVERSCROLL_THRESHOLD && (startedAtRight || maxScroll <= 3 || dx < -64)) {
        if (triggerEdgeTabSwitch(1)) {
          touchSwitched = true;
        }
      } else if (nowAtLeft && dx > TOUCH_PULL_OVERSCROLL_THRESHOLD && (startedAtLeft || maxScroll <= 3 || dx > 64)) {
        if (triggerEdgeTabSwitch(-1)) {
          touchSwitched = true;
        }
      }
    };

    const onTouchEnd = () => {
      touchActive = false;
      touchSwitched = false;
    };

    rail.addEventListener('wheel', onWheel, { passive: false });
    rail.addEventListener('touchstart', onTouchStart, { passive: true });
    rail.addEventListener('touchmove', onTouchMove, { passive: true });
    rail.addEventListener('touchend', onTouchEnd, { passive: true });
    rail.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      ro.disconnect();
      rail.removeEventListener('scroll', onScroll);
      rail.removeEventListener('wheel', onWheel);
      rail.removeEventListener('touchstart', onTouchStart);
      rail.removeEventListener('touchmove', onTouchMove);
      rail.removeEventListener('touchend', onTouchEnd);
      rail.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isRailActive, railDependencyKey, scrollRailRef, syncScrollEdges, triggerEdgeTabSwitch]);

  // Directional Card Pointer Handler:
  // - Quick tap -> select / uninstall
  // - Horizontal pan -> scroll rail (native touch-pan-x on touch, click-drag pan on mouse)
  // - Upward lift (or exiting top of dock) -> launch 3D component drag-and-drop
  const handleCardPointerDown = useCallback(
    (
      e: React.PointerEvent<HTMLButtonElement>,
      itemId: AssemblyStepId,
      isDone: boolean,
      canUnplug: boolean
    ) => {
      if (e.button !== 0) return;
      activePointerCleanupRef.current?.();

      const startX = e.clientX;
      const startY = e.clientY;
      const startPointerId = e.pointerId;
      const isMouse = e.pointerType === 'mouse';

      let prevClientX = startX;
      let totalPanDistance = 0;
      let mouseOverscrollAccum = 0;
      let intent: 'undecided' | 'scroll' | 'drag3d' = 'undecided';

      const cleanup = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        if (activePointerCleanupRef.current === cleanup) {
          activePointerCleanupRef.current = null;
        }
      };

      const lock3DDrag = (clientX: number, clientY: number) => {
        if (isDone) return;
        intent = 'drag3d';
        cleanup();
        callbacksRef.current.onStartDragItem(itemId, clientX, clientY, startPointerId);
      };

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== startPointerId) return;

        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const dockTop = dockRef.current?.getBoundingClientRect().top ?? window.innerHeight - 190;

        if (intent === 'undecided') {
          const dist = Math.hypot(dx, dy);
          if (dist <= 8) return;

          const movedOutTop = ev.clientY < dockTop - 4;
          const upwardLift = !isDone && dy < -10 && Math.abs(dy) >= Math.abs(dx) * 0.85;

          if (!isDone && (movedOutTop || upwardLift)) {
            lock3DDrag(ev.clientX, ev.clientY);
            return;
          }

          intent = 'scroll';
          if (!isMouse) {
            // Touch horizontal swipe is handled natively by touch-pan-x + touchstart/move overscroll
            cleanup();
            return;
          }
        }

        if (intent === 'scroll' && isMouse) {
          // Forgiving transition: if desktop user drags upward out of the dock, hand off to 3D drag
          if (!isDone && ev.clientY < dockTop - 8 && dy < -16) {
            lock3DDrag(ev.clientX, ev.clientY);
            return;
          }

          const stepDx = ev.clientX - prevClientX;
          prevClientX = ev.clientX;
          totalPanDistance += Math.abs(stepDx);

          const rail = scrollRailRef.current;
          if (!rail) return;

          const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
          if (maxScroll > 2) {
            rail.scrollLeft = Math.max(0, Math.min(maxScroll, rail.scrollLeft - stepDx));
          }

          const atRightEdge = maxScroll <= 2 || rail.scrollLeft >= maxScroll - 2;
          const atLeftEdge = maxScroll <= 2 || rail.scrollLeft <= 2;

          // Dragging mouse left (stepDx < 0) tries to reveal further right cards
          if (stepDx < 0 && atRightEdge) {
            mouseOverscrollAccum = mouseOverscrollAccum < 0 ? 0 : mouseOverscrollAccum - stepDx;
            if (mouseOverscrollAccum >= MOUSE_DRAG_OVERSCROLL_THRESHOLD) {
              mouseOverscrollAccum = 0;
              triggerEdgeTabSwitch(1);
            }
          } else if (stepDx > 0 && atLeftEdge) {
            mouseOverscrollAccum = mouseOverscrollAccum > 0 ? 0 : mouseOverscrollAccum - stepDx;
            if (mouseOverscrollAccum <= -MOUSE_DRAG_OVERSCROLL_THRESHOLD) {
              mouseOverscrollAccum = 0;
              triggerEdgeTabSwitch(-1);
            }
          } else {
            mouseOverscrollAccum = 0;
          }

          syncScrollEdges();
        }
      };

      const onUp = (ev: PointerEvent) => {
        if (ev.pointerId !== startPointerId) return;
        cleanup();
        if (intent === 'undecided' || (intent === 'scroll' && totalPanDistance < 6)) {
          if (isDone) {
            if (canUnplug) {
              callbacksRef.current.onUninstallItem(itemId);
            }
          } else {
            callbacksRef.current.onSelectItem(itemId);
          }
        }
      };

      const onCancel = (ev: PointerEvent) => {
        if (ev.pointerId !== startPointerId) return;
        // Native pan-x scroll emits pointercancel; never treat cancel as tap/select
        cleanup();
      };

      activePointerCleanupRef.current = cleanup;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
    },
    [dockRef, scrollRailRef, syncScrollEdges, triggerEdgeTabSwitch]
  );

  // Allow mouse drag panning directly from gaps between cards or empty rail background
  const handleRailMouseDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 || e.pointerType !== 'mouse') return;
      if ((e.target as HTMLElement | null)?.closest('button')) return;

      activePointerCleanupRef.current?.();
      const startPointerId = e.pointerId;
      let prevX = e.clientX;
      let overscrollAccum = 0;

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== startPointerId) return;
        const stepDx = ev.clientX - prevX;
        prevX = ev.clientX;
        const rail = scrollRailRef.current;
        if (!rail) return;

        const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
        if (maxScroll > 2) {
          rail.scrollLeft = Math.max(0, Math.min(maxScroll, rail.scrollLeft - stepDx));
        }

        const atRightEdge = maxScroll <= 2 || rail.scrollLeft >= maxScroll - 2;
        const atLeftEdge = maxScroll <= 2 || rail.scrollLeft <= 2;

        if (stepDx < 0 && atRightEdge) {
          overscrollAccum = overscrollAccum < 0 ? 0 : overscrollAccum - stepDx;
          if (overscrollAccum >= MOUSE_DRAG_OVERSCROLL_THRESHOLD) {
            overscrollAccum = 0;
            triggerEdgeTabSwitch(1);
          }
        } else if (stepDx > 0 && atLeftEdge) {
          overscrollAccum = overscrollAccum > 0 ? 0 : overscrollAccum - stepDx;
          if (overscrollAccum <= -MOUSE_DRAG_OVERSCROLL_THRESHOLD) {
            overscrollAccum = 0;
            triggerEdgeTabSwitch(-1);
          }
        } else {
          overscrollAccum = 0;
        }
        syncScrollEdges();
      };

      const cleanup = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', cleanup);
        window.removeEventListener('pointercancel', cleanup);
        if (activePointerCleanupRef.current === cleanup) {
          activePointerCleanupRef.current = null;
        }
      };

      activePointerCleanupRef.current = cleanup;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', cleanup);
      window.addEventListener('pointercancel', cleanup);
    },
    [scrollRailRef, syncScrollEdges, triggerEdgeTabSwitch]
  );

  return {
    fadeState,
    handleCardPointerDown,
    handleRailMouseDown,
    syncScrollEdges,
  };
}
