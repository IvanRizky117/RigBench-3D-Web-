import { useState } from 'react';
import { DeviceMobile, DownloadSimple, ShareNetwork, X } from '@phosphor-icons/react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
  onInstalled?: () => void;
}

export function PWAInstallButton({ compact = false, onInstalled }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) onInstalled?.();
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleInstallClick()}
        className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#3B82F6]/30 bg-[#071127]/90 font-medium text-[#E2E8F0] transition-colors hover:border-[#38BDF8]/60 hover:text-[#38BDF8] whitespace-nowrap press-feedback ${
          compact ? 'px-3.5 py-2 text-xs' : 'px-4 py-2.5 text-sm'
        }`}
      >
        {isInstallable ? (
          <DownloadSimple size={16} weight="bold" className="text-[#38BDF8]" />
        ) : (
          <DeviceMobile size={16} weight="duotone" className="text-[#38BDF8]" />
        )}
        <span>{isInstallable ? 'Install Aplikasi' : 'Simpan ke Layar Utama'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#02050C]/80 p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-guide-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-[#3B82F6]/30 bg-[#070E1F] p-5 text-left shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="pwa-guide-title" className="text-base font-semibold text-[#F8FAFC]">
                  {isIOS ? 'Install RigBench di iPhone / iPad' : 'Install RigBench di HP'}
                </h3>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  Buka materi &amp; Lab 3D langsung seperti aplikasi native tanpa bar browser.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Tutup panduan install"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#3B82F6]/20 text-[#94A3B8] hover:text-white"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-4 space-y-2.5 text-xs leading-relaxed text-[#CBD5E1]">
                <li className="flex items-start gap-2.5 rounded-xl bg-[#040915] p-3 border border-[#3B82F6]/15">
                  <ShareNetwork size={16} className="mt-0.5 shrink-0 text-[#38BDF8]" />
                  <span>
                    1. Ketuk ikon <strong className="text-white">Share (Bagikan)</strong> di bilah
                    bawah Safari.
                  </span>
                </li>
                <li className="rounded-xl bg-[#040915] p-3 border border-[#3B82F6]/15">
                  2. Gulir ke bawah lalu pilih{' '}
                  <strong className="text-white">Add to Home Screen</strong>.
                </li>
                <li className="rounded-xl bg-[#040915] p-3 border border-[#3B82F6]/15">
                  3. Ketuk <strong className="text-white">Add</strong> di pojok kanan atas.
                </li>
              </ol>
            ) : (
              <ol className="mt-4 space-y-2.5 text-xs leading-relaxed text-[#CBD5E1]">
                <li className="rounded-xl bg-[#040915] p-3 border border-[#3B82F6]/15">
                  1. Buka menu titik tiga (<strong className="text-white">⋮</strong>) di pojok
                  kanan atas browser Chrome.
                </li>
                <li className="rounded-xl bg-[#040915] p-3 border border-[#3B82F6]/15">
                  2. Pilih <strong className="text-white">Tambahkan ke layar utama</strong> atau{' '}
                  <strong className="text-white">Install aplikasi</strong>.
                </li>
                <li className="rounded-xl bg-[#040915] p-3 border border-[#3B82F6]/15">
                  3. Setelah terpasang, RigBench dapat dibuka cepat meski koneksi sedang offline.
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-4 min-h-[44px] w-full rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#3B82F6] transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
