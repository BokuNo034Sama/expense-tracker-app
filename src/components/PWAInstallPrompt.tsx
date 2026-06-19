import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { BentoCard } from './shared/BentoCard';
import { ArrowDownToLine, Share, PlusSquare, X } from 'lucide-react';

export function PWAInstallPrompt() {
  const isInstalled = useAppStore(s => s.pwa.isInstalled);
  const deferredPrompt = useAppStore(s => s.pwa.deferredPrompt);
  const setPWAInstalled = useAppStore(s => s.setPWAInstalled);
  const setDeferredPrompt = useAppStore(s => s.setDeferredPrompt);
  const dismissInstallPrompt = useAppStore(s => s.dismissInstallPrompt);
  const installPromptDismissed = useAppStore(s => s.pwa.installPromptDismissed);
  
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkPlatform = () => {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
      setIsIOS(ios);
      setIsStandalone(!!standalone);
      if (standalone) {
        setPWAInstalled(true);
      }
    };
    checkPlatform();
  }, [setPWAInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setPWAInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || isStandalone || installPromptDismissed) return null;

  // Show if it's iOS Safari or we have a deferred prompt for Chrome/Android
  const shouldShow = isIOS || !!deferredPrompt;
  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-[340px] animate-fade-in p-1">
      <BentoCard 
        style={{ 
          border: '4px solid #000000',
          boxShadow: '6px 6px 0px 0px #000000'
        }}
        className="p-5 bg-[#C6EF4E] text-[#000000] rounded-none relative"
      >
        <button 
          onClick={dismissInstallPrompt}
          className="absolute top-2 right-2 p-1 text-black hover:bg-black/10 transition-colors border border-transparent rounded-none"
          aria-label="Dismiss prompt"
        >
          <X className="h-4 w-4 stroke-[3px]" />
        </button>

        <h4 style={{ fontFamily: 'var(--font-display)' }} className="text-sm font-black uppercase tracking-wider text-black mb-1">
          [ INSTALL_KINY_OS ]
        </h4>

        {isIOS ? (
          <div className="space-y-3 mt-2">
            <p style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] uppercase font-black text-black leading-relaxed">
              Install on iOS Safari:
            </p>
            <ol style={{ fontFamily: 'var(--font-mono)' }} className="text-[9px] uppercase font-bold text-black space-y-1.5 list-decimal pl-4">
              <li>
                Tap the <span className="inline-flex items-center align-middle font-black bg-white border border-black px-1 py-0.5 rounded-none mx-0.5"><Share className="h-2.5 w-2.5 inline" /> Share</span> button.
              </li>
              <li>
                Scroll down and tap <span className="inline-flex items-center align-middle font-black bg-white border border-black px-1 py-0.5 rounded-none mx-0.5"><PlusSquare className="h-2.5 w-2.5 inline" /> Add to Home Screen</span>.
              </li>
            </ol>
          </div>
        ) : (
          <>
            <p style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] uppercase font-black text-black leading-relaxed mb-4">
              Add Kiny to your home screen for quick, offline-capable access.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleInstallClick}
                style={{ fontFamily: 'var(--font-mono)' }}
                className="flex items-center gap-1.5 px-3 py-2 bg-white text-[#000000] border-2 border-black rounded-none text-[10px] font-black shadow-[2px_2px_0px_0px_#000000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer uppercase"
              >
                <ArrowDownToLine className="h-3 w-3 stroke-[3px]" />
                INSTALL_NOW
              </button>
              <button
                onClick={dismissInstallPrompt}
                style={{ fontFamily: 'var(--font-mono)' }}
                className="px-3 py-2 bg-black text-[#C6EF4E] border-2 border-black rounded-none text-[10px] font-black shadow-[2px_2px_0px_0px_#000000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer uppercase"
              >
                DISMISS
              </button>
            </div>
          </>
        )}
      </BentoCard>
    </div>
  );
}
