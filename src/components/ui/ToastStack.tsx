import { CheckCircle, Info, Warning, X, XCircle } from '@phosphor-icons/react';
import type { ToastMessage } from '../../types/rigbench';

interface ToastStackProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  position?: 'bottom-right' | 'top-right';
  hasBottomDock?: boolean;
}

const VARIANT_STYLES: Record<
  ToastMessage['variant'],
  { border: string; iconColor: string }
> = {
  info: { border: 'border-[#38BDF8]/35', iconColor: 'text-[#38BDF8]' },
  success: { border: 'border-[#10B981]/35', iconColor: 'text-[#10B981]' },
  warning: { border: 'border-[#F59E0B]/40', iconColor: 'text-[#F59E0B]' },
  error: { border: 'border-[#F43F5E]/40', iconColor: 'text-[#F43F5E]' },
};

export function ToastStack({
  toasts,
  onDismiss,
  position = 'bottom-right',
  hasBottomDock = false,
}: ToastStackProps) {
  if (toasts.length === 0) return null;

  const posClass =
    position === 'top-right'
      ? 'fixed right-3 top-14 z-[60]'
      : hasBottomDock
        ? 'fixed right-3 left-3 sm:left-auto sm:right-4 bottom-20 md:bottom-4 z-[60]'
        : 'fixed right-4 bottom-4 z-[60]';

  return (
    <div
      className={`${posClass} flex w-full max-w-xs sm:max-w-sm flex-col gap-2 pointer-events-none`}
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const style = VARIANT_STYLES[toast.variant];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 rounded-xl bg-[#091122]/96 px-3.5 py-2.5 border ${style.border} shadow-2xl`}
          >
            <div className={`mt-0.5 shrink-0 ${style.iconColor}`}>
              {toast.variant === 'success' && <CheckCircle size={17} weight="fill" />}
              {toast.variant === 'warning' && <Warning size={17} weight="fill" />}
              {toast.variant === 'error' && <XCircle size={17} weight="fill" />}
              {toast.variant === 'info' && <Info size={17} weight="fill" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#F8FAFC]">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-[11px] leading-relaxed text-[#94A3B8]">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Tutup notifikasi"
              className="rounded-md p-1 text-[#94A3B8] hover:bg-white/5 hover:text-[#F8FAFC] press-feedback"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
