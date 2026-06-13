import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useAppStore } from '../store';

export function usePWA() {
  const setPWAUpdate = useAppStore(s => s.setPWAUpdate);
  const setPWAInstalled = useAppStore(s => s.setPWAInstalled);
  const updateProfile = useAppStore(s => s.updateProfile);

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

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = "BEl62iII_CR8m9IDJTOVJ8...";

      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
          .replace(/-/g, '+')
          .replace(/_/g, '/');
        const cleanBase64 = base64.replace(new RegExp('[^A-Za-z0-9+/]', 'g'), '');
        const rawData = window.atob(cleanBase64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      };

      const subscription = await registration.pushManager.subscribe(subscribeOptions);
      const subscriptionJSON = subscription.toJSON();

      await updateProfile({ push_subscription: subscriptionJSON });
      console.log('[KINY] Push notification subscription registered:', subscriptionJSON);
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

