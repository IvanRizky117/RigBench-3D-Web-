import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Cpu,
  Cube,
  Exam,
  House,
} from '@phosphor-icons/react';
import type { ClusterId, TabId, ToastMessage, ToastVariant } from './types/rigbench';
import { useProgressStore } from './hooks/useProgressStore';
import { HomeTab } from './components/tabs/HomeTab';
import { ToastStack } from './components/ui/ToastStack';
import { AnimatedSapphireBeams } from './components/ui/AnimatedSapphireBeams';
import { PillNav, type PillNavItem } from './components/ui/PillNav';
import { MobileBottomDock, type MobileDockTabItem } from './components/ui/MobileBottomDock';
import { OfflineIndicator } from './components/ui/OfflineIndicator';

const LectureTab = lazy(() =>
  import('./components/tabs/LectureTab').then((m) => ({ default: m.LectureTab }))
);
const Lab3DTab = lazy(() =>
  import('./components/tabs/Lab3DTab').then((m) => ({ default: m.Lab3DTab }))
);
const OsDiskTab = lazy(() =>
  import('./components/tabs/OsDiskTab').then((m) => ({ default: m.OsDiskTab }))
);
const ExamTab = lazy(() =>
  import('./components/tabs/ExamTab').then((m) => ({ default: m.ExamTab }))
);

interface NavTabSpec {
  id: TabId;
  label: string;
  icon: typeof House;
}

// 4 Primary Tabs (OS & Disk hidden from UI while keeping OsDiskTab intact on disk)
const NAV_TABS: NavTabSpec[] = [
  { id: 'home', label: 'Beranda', icon: House },
  { id: 'lecture', label: 'Materi', icon: BookOpen },
  { id: 'lab3d', label: 'Lab 3D', icon: Cube },
  { id: 'exam', label: 'Uji Pemahaman', icon: Exam },
];

function TabLoadingFallback({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-center ${
        fullScreen ? 'fixed inset-0 z-50 bg-[#0B0E14]' : 'min-h-[55vh] px-4 py-16'
      }`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#3B82F6]/30 bg-[#071127] text-[#38BDF8]">
        <Cpu size={22} weight="duotone" className="animate-spin" style={{ animationDuration: '2.4s' }} />
      </div>
      <div>
        <p className="text-sm font-medium text-[#F8FAFC]">
          {fullScreen ? 'Menyiapkan Viewport Lab 3D...' : 'Memuat modul RigBench...'}
        </p>
        <p className="mt-0.5 text-xs text-[#64748B]">
          Mengoptimalkan aset untuk perangkatmu
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const {
    progress,
    toggleClusterComplete,
    recordInspectedComponent,
    recordAssemblyReport,
    markOsSimComplete,
    markDiskSimComplete,
    toggleGlossaryMastered,
    recordExamAttempt,
    resetAllProgress,
  } = useProgressStore();

  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [activeClusterId, setActiveClusterId] = useState<ClusterId>('cluster-1');
  const [pending3DComponentId, setPending3DComponentId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastTimersRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = toastTimersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      toastTimersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (title: string, description: string, variant: ToastVariant = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-2), { id, title, description, variant }]);
      const timer = window.setTimeout(() => {
        dismissToast(id);
      }, 3400);
      toastTimersRef.current.set(id, timer);
    },
    [dismissToast]
  );

  useEffect(() => {
    const map = toastTimersRef.current;
    return () => {
      map.forEach((timerId) => window.clearTimeout(timerId));
      map.clear();
    };
  }, []);

  useEffect(() => {
    if (
      activeTab !== 'lecture' &&
      activeTab !== 'lab3d' &&
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    ) {
      window.speechSynthesis.cancel();
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  const handleOpenCluster = useCallback((clusterId: ClusterId) => {
    setActiveClusterId(clusterId);
    setActiveTab('lecture');
  }, []);

  const handleJumpTo3DComponent = useCallback((componentId: string) => {
    setPending3DComponentId(componentId);
    setActiveTab('lab3d');
  }, []);

  const handleResetProgress = useCallback(() => {
    resetAllProgress();
    notify(
      'Progres Belajar Direset',
      'Seluruh progres belajar, inspeksi 3D, dan riwayat Try Out lokal telah dibersihkan.',
      'info'
    );
  }, [resetAllProgress, notify]);

  const pillNavItems: PillNavItem[] = useMemo(
    () =>
      NAV_TABS.map((tab) => {
        const Icon = tab.icon;
        return {
          label: tab.label,
          href: `#${tab.id}`,
          icon: <Icon size={15} weight={activeTab === tab.id ? 'fill' : 'regular'} />,
          ariaLabel: tab.label,
        };
      }),
    [activeTab]
  );

  const mobileDockItems: MobileDockTabItem[] = useMemo(
    () =>
      NAV_TABS.map((tab) => {
        const Icon = tab.icon;
        return {
          id: tab.id,
          label: tab.label,
          icon: (isActive: boolean) => (
            <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
          ),
        };
      }),
    []
  );

  const showMobileBottomDock = activeTab !== 'lab3d';

  return (
    <div className="relative min-h-screen bg-[#02050C] text-[#F8FAFC] flex flex-col">
      {/* Ultra-Dark Cinematic Aurora Sapphire Gradient Backdrop (dimmed softly on Materi & Ujian) */}
      {activeTab !== 'lab3d' && (
        <AnimatedSapphireBeams fixedFullPage dimmed={activeTab !== 'home'} />
      )}

      {/* Floating Header: Mobile (Logo Left + Try Out TTS Right) · Desktop (3-Zone with Centered PillNav) */}
      {activeTab !== 'lab3d' && (
        <header className="sticky top-3 sm:top-4 z-40 mx-auto w-full max-w-6xl px-3.5 sm:px-6 lg:px-8 pointer-events-none">
          <div className="flex items-center justify-between gap-2.5 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
            {/* Zone 1 (Left): RigBench Brand Wordmark */}
            <div className="flex items-center justify-start">
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="glass-header-chip pointer-events-auto inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#3B82F6]/20 bg-[#050B18]/88 px-3.5 py-2 backdrop-blur-md shadow-[0_12px_28px_-12px_rgba(0,0,0,0.9)] transition-colors hover:border-[#38BDF8]/45 whitespace-nowrap shrink-0 press-feedback"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2563EB]/25 text-[#38BDF8]">
                  <Cpu size={15} weight="duotone" />
                </span>
                <span className="text-sm font-semibold tracking-tight text-[#F8FAFC]">
                  RigBench
                </span>
              </button>
            </div>

            {/* Zone 2 (Center - Desktop Only): Floating Obsidian-Navy PillNav */}
            <div className="hidden md:flex items-center justify-center pointer-events-auto">
              <PillNav
                items={pillNavItems}
                activeHref={`#${activeTab}`}
                collapse="never"
                onItemClick={(_item, idx, e) => {
                  e.preventDefault();
                  const target = NAV_TABS[idx];
                  if (target) setActiveTab(target.id);
                }}
                theme="dark"
                layout="split"
                itemStyle="pill"
                hoverEffect="fill"
                indicator="dot"
                surface="glass"
                size="md"
                barColor="rgba(6, 12, 26, 0.82)"
                textColor="#E2E8F0"
                highlightColor="#2563EB"
                highlightTextColor="#FFFFFF"
                className="rigbench-pill-nav"
                ariaLabel="Navigasi Utama RigBench"
              />
            </div>

            {/* Zone 3 (Right): Try Out CTA (Always accessible on both Mobile & Desktop) */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('exam')}
                className="inline-flex min-h-[44px] items-center justify-center pointer-events-auto sapphire-btn shrink-0 rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap"
              >
                Try Out
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area (Code-Split Lazy Tabs for Fast Mobile Initial Paint) */}
      <main className="relative z-10 flex-1">
        {activeTab === 'home' && (
          <HomeTab
            progress={progress}
            onNavigateTab={setActiveTab}
            onOpenCluster={handleOpenCluster}
            onResetProgress={handleResetProgress}
          />
        )}

        {activeTab === 'lecture' && (
          <Suspense fallback={<TabLoadingFallback />}>
            <div className="mx-auto max-w-6xl px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8">
              <LectureTab
                activeClusterId={activeClusterId}
                onSelectCluster={setActiveClusterId}
                completedClusters={progress.completedClusters}
                onToggleClusterComplete={toggleClusterComplete}
                onJumpTo3DComponent={handleJumpTo3DComponent}
                onNotify={notify}
              />
            </div>
          </Suspense>
        )}

        {activeTab === 'lab3d' && (
          <Suspense fallback={<TabLoadingFallback fullScreen />}>
            <Lab3DTab
              initialComponentId={pending3DComponentId}
              onClearInitialComponent={() => setPending3DComponentId(null)}
              inspectedComponents={progress.inspectedComponents}
              assemblyHistory={progress.assemblyHistory}
              onInspectComponent={recordInspectedComponent}
              onRecordAssemblyReport={recordAssemblyReport}
              onExitLab={() => setActiveTab('home')}
              onNotify={notify}
            />
          </Suspense>
        )}

        {activeTab === 'os-disk' && (
          <Suspense fallback={<TabLoadingFallback />}>
            <OsDiskTab
              osSimCompleted={progress.osSimCompleted}
              diskSimCompleted={progress.diskSimCompleted}
              onOsSimComplete={markOsSimComplete}
              onDiskSimComplete={markDiskSimComplete}
              onNotify={notify}
            />
          </Suspense>
        )}

        {activeTab === 'exam' && (
          <Suspense fallback={<TabLoadingFallback />}>
            <ExamTab
              examHistory={progress.examHistory}
              masteredGlossaryIds={progress.masteredGlossaryIds}
              onRecordExamAttempt={recordExamAttempt}
              onToggleGlossaryMastered={toggleGlossaryMastered}
              onNotify={notify}
            />
          </Suspense>
        )}
      </main>

      {/* Mobile Full-Width iOS Bottom Dock (Auto-hides in Lab 3D so 3D Assembly Dock has full room) */}
      {showMobileBottomDock && (
        <MobileBottomDock
          items={mobileDockItems}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />
      )}

      {/* Non-intrusive PWA Offline Banner */}
      <OfflineIndicator hasBottomDock={showMobileBottomDock} />

      {/* Toast Notification Stack (Top-Right in Lab 3D; clears Mobile Bottom Dock elsewhere) */}
      <ToastStack
        toasts={toasts}
        onDismiss={dismissToast}
        position={activeTab === 'lab3d' ? 'top-right' : 'bottom-right'}
        hasBottomDock={showMobileBottomDock}
      />
    </div>
  );
}
