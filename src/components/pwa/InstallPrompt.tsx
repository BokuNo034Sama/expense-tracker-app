import { useAppStore } from '../../store';
import { BentoCard } from '../shared/BentoCard';
import { ArrowDownToLine } from 'lucide-react';

export function InstallPrompt() {
  const isInstalled = useAppStore(s => s.pwa.isInstalled);
  const deferredPrompt = useAppStore(s => s.pwa.deferredPrompt);
  const setPWAInstalled = useAppStore(s => s.setPWAInstalled);
  const setDeferredPrompt = useAppStore(s => s.setDeferredPrompt);
  const dismissInstallPrompt = useAppStore(s => s.dismissInstallPrompt);
  const installPromptDismissed = useAppStore(s => s.pwa.installPromptDismissed);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setPWAInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || !deferredPrompt || installPromptDismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 w-full max-w-[360px] animate-[slideInUp_0.2s_ease-out]">
      <BentoCard className="p-4">
        <h4 style={{ fontFamily: 'var(--font-display)' }} className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-main)] mb-1">
          INSTALL_KINY_APP
        </h4>
        <p style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] leading-relaxed mb-4">
          Add Kiny to your home screen for quick, offline-capable access.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleInstallClick}
            style={{ fontFamily: 'var(--font-display)' }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--color-brand-primary)] text-[#000000] border-2 border-[var(--color-border)] rounded-[var(--border-radius)] text-[10px] font-bold shadow-[var(--shadow-btn-active)]"
          >
            <ArrowDownToLine className="h-3 w-3" />
            INSTALL_NOW
          </button>
          <button
            onClick={dismissInstallPrompt}
            style={{ fontFamily: 'var(--font-mono)' }}
            className="px-3 py-2 bg-transparent text-[var(--color-text-main)] border-2 border-transparent hover:border-[var(--color-border)] rounded-[var(--border-radius)] text-[10px] font-bold uppercase"
          >
            DISMISS
          </button>
        </div>
      </BentoCard>
    </div>
  );
}

