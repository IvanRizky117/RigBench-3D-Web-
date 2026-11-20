import { WifiSlash } from '@phosphor-icons/react';
import { useOnlineStatus } from '../../hooks/usePWAInstall';

interface OfflineIndicatorProps {
  hasBottomDock?: boolean;
}

export function OfflineIndicator({ hasBottomDock = false }: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-4 z-50 flex items-center gap-2 rounded-xl border border-[#F59E0B]/45 bg-[#1B1406]/95 px-3.5 py-2 text-xs font-medium text-[#FDE68A] shadow-xl ${
        hasBottomDock ? 'bottom-20 md:bottom-4' : 'bottom-4'
      }`}
    >
      <WifiSlash size={15} weight="bold" className="text-[#F59E0B] shrink-0" />
      <span>Mode Offline · Materi &amp; progres lokal tetap aktif</span>
    </div>
  );
}
