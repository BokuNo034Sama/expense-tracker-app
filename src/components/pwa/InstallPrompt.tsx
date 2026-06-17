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
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-[340px] animate-fade-in p-1">
      <BentoCard 
        style={{ 
          border: '4px solid #000000',
          boxShadow: '6px 6px 0px 0px #000000'
        }}
        className="p-5 bg-white dark:bg-zinc-800 text-black dark:text-white rounded-none relative"
      >
        <h4 style={{ fontFamily: 'var(--font-display)' }} className="text-sm font-black uppercase tracking-wider text-black dark:text-white mb-1">
          [INSTALL_KINY_OS]
        </h4>
        <p style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] uppercase font-bold text-gray-600 dark:text-zinc-400 leading-relaxed mb-4">
          Add Kiny to your home screen for quick, offline-capable access.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleInstallClick}
            style={{ fontFamily: 'var(--font-mono)' }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#C6EF4E] text-[#000000] border-2 border-black rounded-none text-[10px] font-black shadow-[2px_2px_0px_0px_#000000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer uppercase"
          >
            <ArrowDownToLine className="h-3 w-3 stroke-[3px]" />
            INSTALL_NOW
          </button>
          <button
            onClick={dismissInstallPrompt}
            style={{ fontFamily: 'var(--font-mono)' }}
            className="px-3 py-2 bg-white text-black border-2 border-black rounded-none text-[10px] font-black shadow-[2px_2px_0px_0px_#000000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer uppercase"
          >
            DISMISS
          </button>
        </div>
      </BentoCard>
    </div>
  );
}

