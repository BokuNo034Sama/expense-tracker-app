import { useEffect } from 'react';
import { useAppStore } from '../store';
import { supabase } from '../lib/supabaseClient';
import { messaging } from '../lib/firebase';
import { getToken } from 'firebase/messaging';

export function usePushSubscriptionGuard() {
  const profile = useAppStore(s => s.profile);

  useEffect(() => {
    // If the profile exists but their push subscription token is empty/NULL, prompt them!
    if (profile && !profile.push_subscription) {
      const requestAndSyncToken = async () => {
        try {
          // 1. Request standard browser notification permission
          const permission = await Notification.requestPermission();
          
          if (permission === 'granted' && messaging) {
            // 2. Fetch the fresh FCM token from Firebase using your VAPID key
            const fcmToken = await getToken(messaging, {
              vapidKey: 'BCHWxA7SFC5BRSz--VT_XJ8sQEGBZHyHwpY2dceqmSHbF3vDIVWffABat4MlbVd-eP7ta-TWmUwBiJ6_6NDWzr0'
            });

            if (fcmToken) {
              const payload = { type: 'fcm', token: fcmToken };
              
              // 3. Silently save the token object directly into their Supabase profile row
              await supabase
                .from('profiles')
                .update({ push_subscription: payload } as any)
                .eq('id', profile.id);
                
              console.log('[KINY FCM] Successfully synced legacy user push token!');
            }
          }
        } catch (error) {
          console.error('[KINY FCM] Catch-up permission sync failed:', error);
        }
      };

      // Run it gracefully in the background after the page loads
      requestAndSyncToken();
    }
  }, [profile]);
}
