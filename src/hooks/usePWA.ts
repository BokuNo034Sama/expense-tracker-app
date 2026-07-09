import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useAppStore } from '../store';
import { getFCMToken, saveTokenToSupabase } from '../lib/firebase';

export function usePWA() {
  const setPWAUpdate = useAppStore(s => s.setPWAUpdate);
  const setPWAInstalled = useAppStore(s => s.setPWAInstalled);
  // const updateProfile = useAppStore(s => s.updateProfile);

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

      // Fetch and sync FCM token
      const fcmToken = await getFCMToken();
      if (fcmToken) {
        const { supabase } = await import('../lib/supabaseClient');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // DEPRECATED — single device only, kept for rollback
          // await updateProfile({ push_subscription: { type: 'fcm', token: fcmToken } });
          await saveTokenToSupabase(user.id, fcmToken);
          console.log('[KINY] FCM Token successfully synced to push_subscriptions.');
        }
      }
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

