import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { BentoCard } from '../shared/BentoCard';
import { ArrowDownToLine } from 'lucide-react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const isInstalled = useAppStore(s => s.pwa.isInstalled);
  const setPWAInstalled = useAppStore(s => s.setPWAInstalled);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setPWAInstalled(true);
    }
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (isInstalled || !visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 w-full max-w-[360px] animate-[slideInUp_0.2s_ease-out]">
      <BentoCard className="border-[var(--color-ink)] border-2 bg-[var(--color-primary)] text-black p-4 shadow-[var(--shadow-card)]">
        <h4 style={{ fontFamily: 'var(--font-display)' }} className="text-xs font-bold uppercase tracking-wider text-black mb-1">
          INSTALL_KINY_APP
        </h4>
        <p style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] uppercase font-bold text-neutral-800 leading-relaxed mb-4">
          Add Kiny to your home screen for quick, offline-capable access.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleInstallClick}
            style={{ fontFamily: 'var(--font-display)' }}
            className="flex items-center gap-1.5 px-3 py-2 bg-black text-[var(--color-primary)] border-2 border-black rounded-[var(--border-radius)] text-[10px] font-bold shadow-[var(--shadow-btn-active)]"
          >
            <ArrowDownToLine className="h-3 w-3" />
            INSTALL_NOW
          </button>
          <button
            onClick={() => setVisible(false)}
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
