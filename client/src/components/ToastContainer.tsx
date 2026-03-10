import { useEffect, useRef, useState } from 'react';
import { type Toast, type ToastType } from '../hooks/useToast';

/* ── Icônes ── */
const ICONS: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="h-5 w-5 shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

const BAR_COLORS: Record<ToastType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

/* ── Élément individuel ── */
interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [leaving, setLeaving] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    if (leaving) return;
    setLeaving(true);
  };

  /* Lance le timer auto au montage */
  useEffect(() => {
    autoRef.current = setTimeout(dismiss, toast.duration);
    return () => {
      if (autoRef.current) clearTimeout(autoRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Supprime du state une fois l'animation de sortie terminée */
  const handleAnimEnd = () => {
    if (leaving) onDismiss(toast.id);
  };

  /* Pause au hover */
  const handleMouseEnter = () => {
    if (autoRef.current) clearTimeout(autoRef.current);
    if (barRef.current) barRef.current.style.animationPlayState = 'paused';
  };

  const handleMouseLeave = () => {
    const bar = barRef.current;
    if (!bar) return;
    const pct =
      bar.getBoundingClientRect().width / bar.parentElement!.getBoundingClientRect().width;
    bar.style.animationPlayState = 'running';
    autoRef.current = setTimeout(dismiss, pct * toast.duration);
  };

  return (
    <div
      role="alert"
      className={leaving ? 'toast-leave' : 'toast-enter'}
      onAnimationEnd={handleAnimEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg shadow-gray-200/50 dark:border-gray-700 dark:bg-gray-800 dark:shadow-gray-900/50">
        {/* Contenu */}
        <div className="flex items-start gap-3 px-4 py-3.5">
          {ICONS[toast.type]}
          <p className="flex-1 pt-px text-sm leading-snug font-medium text-gray-800 dark:text-gray-200">
            {toast.message}
          </p>
          <button
            onClick={dismiss}
            className="-mt-0.5 -mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Fermer"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {/* Barre de progression */}
        <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-gray-100 dark:bg-gray-700">
          <div
            ref={barRef}
            className={`toast-timer h-full ${BAR_COLORS[toast.type]}`}
            style={{ animationDuration: `${toast.duration}ms` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Conteneur ── */
interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div aria-live="polite" className="fixed top-5 right-5 z-100 flex flex-col gap-3">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
