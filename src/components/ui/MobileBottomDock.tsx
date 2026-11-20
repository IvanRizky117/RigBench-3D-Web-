import { useEffect, useRef, type ReactNode } from 'react';
import type { TabId } from '../../types/rigbench';

export interface MobileDockTabItem {
  id: TabId;
  label: string;
  icon: (active: boolean) => ReactNode;
}

interface MobileBottomDockProps {
  items: MobileDockTabItem[];
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Full-width iOS-style bottom navigation dock for mobile (<768px) with
 * PillNav-grade spring-glide active capsule and velocity-stretched elastic dot.
 * Runs exclusively on GPU compositor transforms (zero layout thrash).
 */
export function MobileBottomDock({
  items,
  activeTab,
  onSelectTab,
}: MobileBottomDockProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const slotRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pillRef = useRef<HTMLSpanElement | null>(null);
  const dotRef = useRef<HTMLSpanElement | null>(null);

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeTab)
  );
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const wakeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const reduce =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const rects: Array<{ left: number; width: number }> = [];
    let rafId = 0;
    let lastTime = 0;
    let initialized = false;

    const spring = {
      x0: 0,
      x1: 0,
      v0: 0,
      v1: 0,
      dotX: 0,
      dotV: 0,
      press: 1,
    };

    const measure = () => {
      slotRefs.current.forEach((slot, idx) => {
        if (!slot) return;
        rects[idx] = { left: slot.offsetLeft, width: slot.offsetWidth };
      });
    };

    const applyDom = () => {
      const pill = pillRef.current;
      const dot = dotRef.current;
      const width = Math.max(0, spring.x1 - spring.x0);
      const target = rects[activeIndexRef.current];
      const squash = target
        ? 1 - clamp((width / Math.max(target.width, 1) - 1) * 0.25, 0, 0.12)
        : 1;

      if (pill) {
        pill.style.width = `${width}px`;
        pill.style.transform = `translate3d(${spring.x0}px, 0, 0) scale(${spring.press}, ${spring.press * squash})`;
        pill.style.opacity = width > 0 ? '1' : '0';
      }

      if (dot) {
        const stretch = clamp(Math.abs(spring.dotV) / 620, 0, 2.4);
        dot.style.transform = `translate3d(${spring.dotX}px, 0, 0) scaleX(${1 + stretch})`;
        dot.style.opacity = target ? '1' : '0';
      }
    };

    const snapToCurrent = () => {
      const target = rects[activeIndexRef.current];
      if (!target) return;
      const insetX = 6;
      spring.x0 = target.left + insetX;
      spring.x1 = target.left + target.width - insetX;
      spring.v0 = 0;
      spring.v1 = 0;
      spring.dotX = target.left + target.width / 2;
      spring.dotV = 0;
      initialized = true;
      applyDom();
    };

    const tick = (now: number) => {
      rafId = 0;
      const target = rects[activeIndexRef.current];
      if (!target) return;

      const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 1 / 60;
      lastTime = now;

      const insetX = 6;
      const t0 = target.left + insetX;
      const t1 = target.left + target.width - insetX;
      const dotTarget = target.left + target.width / 2;

      if (!initialized || reduce) {
        snapToCurrent();
        return;
      }

      // Asymmetric leading/trailing spring stiffness for liquid elastic glide
      const dir = Math.sign((t0 + t1) / 2 - (spring.x0 + spring.x1) / 2);
      const base = 520;
      const lead = base * 1.48;
      const trail = base * 0.72;
      const k0 = dir < 0 ? lead : dir > 0 ? trail : base;
      const k1 = dir > 0 ? lead : dir < 0 ? trail : base;
      const zeta = 0.78;
      const dotK = 390;
      const dotZeta = 0.72;

      const steps = Math.ceil(dt / (1 / 240));
      const h = dt / steps;

      for (let i = 0; i < steps; i++) {
        spring.v0 += (-k0 * (spring.x0 - t0) - 2 * zeta * Math.sqrt(k0) * spring.v0) * h;
        spring.x0 += spring.v0 * h;
        spring.v1 += (-k1 * (spring.x1 - t1) - 2 * zeta * Math.sqrt(k1) * spring.v1) * h;
        spring.x1 += spring.v1 * h;
        spring.dotV +=
          (-dotK * (spring.dotX - dotTarget) - 2 * dotZeta * Math.sqrt(dotK) * spring.dotV) * h;
        spring.dotX += spring.dotV * h;
      }

      applyDom();

      const busy =
        Math.abs(spring.x0 - t0) > 0.08 ||
        Math.abs(spring.x1 - t1) > 0.08 ||
        Math.abs(spring.v0) > 0.6 ||
        Math.abs(spring.v1) > 0.6 ||
        Math.abs(spring.dotX - dotTarget) > 0.08 ||
        Math.abs(spring.dotV) > 0.6;

      if (busy) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const wake = () => {
      if (!rafId) {
        lastTime = 0;
        rafId = window.requestAnimationFrame(tick);
      }
    };
    wakeRef.current = wake;

    measure();
    snapToCurrent();

    const ro = new ResizeObserver(() => {
      measure();
      snapToCurrent();
    });
    ro.observe(track);

    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      wakeRef.current = null;
    };
  }, [items.length]);

  useEffect(() => {
    wakeRef.current?.();
  }, [activeIndex]);

  return (
    <nav
      aria-label="Navigasi Bawah Mobile RigBench"
      className="mobile-bottom-dock fixed inset-x-0 bottom-0 z-40 md:hidden border-t border-[#3B82F6]/22 bg-[#050B18]/92 shadow-[0_-14px_34px_-14px_rgba(0,0,0,0.92)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div
        ref={trackRef}
        className="relative mx-auto grid h-[62px] max-w-md grid-cols-4 items-center px-1.5"
      >
        {/* Spring-Glide Royal Sapphire Active Capsule */}
        <span
          ref={pillRef}
          aria-hidden="true"
          className="pointer-events-none absolute top-1.5 bottom-2.5 left-0 rounded-2xl border border-[#38BDF8]/35 bg-gradient-to-b from-[#2563EB]/32 to-[#1D4ED8]/22 shadow-[inset_0_1px_0_rgba(147,197,253,0.28),0_6px_18px_-6px_rgba(37,99,235,0.55)] will-change-transform"
          style={{ opacity: 0 }}
        />

        {/* Velocity-Stretched Elastic Sky Sapphire Dot */}
        <span
          ref={dotRef}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1 left-0 -ml-1.5 h-[3px] w-3 rounded-full bg-[#38BDF8] shadow-[0_0_10px_rgba(56,189,248,0.85)] will-change-transform"
          style={{ opacity: 0 }}
        />

        {items.map((item, idx) => {
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              ref={(el) => {
                slotRefs.current[idx] = el;
              }}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative z-10 flex min-h-[48px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1 text-center transition-colors focus-visible:outline-2 focus-visible:outline-[#38BDF8] active:scale-[0.96] ${
                isActive ? 'text-[#F8FAFC]' : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              <span
                className={`transition-transform duration-200 ${
                  isActive ? 'scale-105 text-[#38BDF8]' : 'text-current'
                }`}
              >
                {item.icon(isActive)}
              </span>
              <span
                className={`text-[11px] leading-tight tracking-tight whitespace-nowrap ${
                  isActive ? 'font-semibold text-[#F8FAFC]' : 'font-medium text-[#94A3B8]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
