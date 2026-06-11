import { usePWA } from '../../hooks/usePWA';
import { useAppStore } from '../../store';
import { BentoCard } from '../shared/BentoCard';
import { RefreshCw } from 'lucide-react';

export function UpdatePrompt() {
  const { updateServiceWorker } = usePWA();
  const hasUpdate = useAppStore(s => s.pwa.hasUpdate);
  const dismissInstallPrompt = useAppStore(s => s.dismissInstallPrompt);
  const installPromptDismissed = useAppStore(s => s.pwa.installPromptDismissed);

  if (!hasUpdate || installPromptDismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-[360px] animate-[slideInUp_0.2s_ease-out]">
      <BentoCard className="border-[var(--color-ink)] border-2 bg-[var(--color-primary)] text-black p-4 shadow-[var(--shadow-card)]">
        <h4 style={{ fontFamily: 'var(--font-display)' }} className="text-xs font-bold uppercase tracking-wider text-black mb-1">
          UPDATE_AVAILABLE
        </h4>
        <p style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] uppercase font-bold text-neutral-800 leading-relaxed mb-4">
          A newer version of Kiny is available. Reload to apply updates.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => updateServiceWorker()}
            style={{ fontFamily: 'var(--font-display)' }}
            className="flex items-center gap-1.5 px-3 py-2 bg-black text-[var(--color-primary)] border-2 border-black rounded-[var(--border-radius)] text-[10px] font-bold shadow-[var(--shadow-btn-active)]"
          >
            <RefreshCw className="h-3 w-3" />
            REFRESH_NOW
          </button>
          <button
            onClick={dismissInstallPrompt}
            style={{ fontFamily: 'var(--font-mono)' }}
            className="px-3 py-2 bg-transparent text-black border-2 border-transparent hover:border-black rounded-[var(--border-radius)] text-[10px] font-bold uppercase"
          >
            DISMISS
          </button>
        </div>
      </BentoCard>
    </div>
  );
}
