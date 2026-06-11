import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useAppStore } from '../store';

export function usePWA() {
  const setPWAUpdate = useAppStore(s => s.setPWAUpdate);
  const setPWAInstalled = useAppStore(s => s.setPWAInstalled);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onNeedRefresh() {
      setPWAUpdate(true);
    },
    onOfflineReady() {
      console.log('[KINY] Offline ready');
    },
  });

  useEffect(() => {
    // Listen to installation status
    const handleInstall = () => {
      setPWAInstalled(true);
    };

    window.addEventListener('appinstalled', handleInstall);
    return () => window.removeEventListener('appinstalled', handleInstall);
  }, [setPWAInstalled]);

  return {
    needRefresh,
    updateServiceWorker: () => {
      updateServiceWorker(true);
      setNeedRefresh(false);
      setPWAUpdate(false);
    }
  };
}
