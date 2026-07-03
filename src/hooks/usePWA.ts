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

  const registerPushNotifications = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('[KINY] Push notifications are not supported in this browser.');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('[KINY] Notification permission not granted.');
        return;
      }

      console.log('[KINY] Push notification permission granted.');
    } catch (err) {
      console.error('[KINY] registerPushNotifications failed:', err);
    }
  };

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
    },
    registerPushNotifications,
  };
}

