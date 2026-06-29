import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging';

// Firebase Client Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

export let messaging: Messaging | null = null;

// Initialize Messaging client only if supported by browser (prevents test failures in jsdom)
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  } else {
    console.log('[KINY_FCM] Firebase messaging is not supported in this browser environment.');
  }
}).catch((err) => {
  console.warn('[KINY_FCM] Error checking Firebase Messaging support:', err);
});

/**
 * Request notification permissions and fetch the FCM token.
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const supported = await isSupported();
    if (!supported || !messaging) {
      console.warn('[KINY_FCM] Firebase Messaging is not supported or initialized.');
      return null;
    }

    // 1. Request notification permissions
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[KINY_FCM] Notification permissions denied.');
      return null;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_FCM_VAPID_KEY;
    if (!vapidKey || vapidKey === 'your_firebase_fcm_vapid_key') {
      console.warn('[KINY_FCM] Firebase VAPID key is missing or is set to placeholder.');
      return null;
    }

    // 2. Register/fetch our background service worker dynamically with config query params
    // This allows the static service worker script to get environment config at runtime
    if ('serviceWorker' in navigator) {
      const registrationUrl = `/firebase-messaging-sw.js` + 
        `?apiKey=${encodeURIComponent(firebaseConfig.apiKey || '')}` +
        `&messagingSenderId=${encodeURIComponent(firebaseConfig.messagingSenderId || '')}` +
        `&projectId=${encodeURIComponent(firebaseConfig.projectId || '')}` +
        `&appId=${encodeURIComponent(firebaseConfig.appId || '')}`;
      
      const registration = await navigator.serviceWorker.register(registrationUrl, {
        scope: '/firebase-cloud-messaging-push-scope' // Scope it separately from Vite PWA sw.js
      });

      // 3. Retrieve FCM Token
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration
      });

      if (token) {
        console.log('KINY_FCM_TOKEN_GENERATED:', token);
        return token;
      }
    }
    
    return null;
  } catch (err) {
    console.error('[KINY_FCM] Error getting FCM Token:', err);
    return null;
  }
}

/**
 * Listen for foreground push notifications.
 */
export function onMessageListener() {
  return new Promise((resolve) => {
    isSupported().then((supported) => {
      if (supported && messaging) {
        onMessage(messaging, (payload) => {
          resolve(payload);
        });
      }
    });
  });
}
