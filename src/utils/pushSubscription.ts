// src/utils/pushSubscription.ts

const VAPID_PUBLIC_KEY = 'BHQmgmTx9pHYNVB5IQRgwxIzY6eBFBYTUExkRCLnrEC305sIUN7VEpxGCEEKD76TRmEdzTSHUg9S1jndYAIEibY';

/**
 * Utility to convert the Base64 VAPID public key string into a Uint8Array 
 * required by the browser's native pushManager subscription configuration.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Initializes permission checks, handles device token registration, 
 * and outputs the push subscription payload profile.
 */
export async function initializeKinyPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push messaging services are unsupported in this browser device environment.');
    return null;
  }

  try {
    // Wait for the active PWA service worker to be fully registered and ready
    const registration = await navigator.serviceWorker.ready;
    
    // Check if a PushSubscription vector is already registered
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('User session already verified and subscribed to push tokens.');
      return existingSubscription;
    }

    // Explicitly solicit user opt-in permissions for system banners
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('System notifications permission access denied by user.');
      return null;
    }

    // Build absolute subscription payload profile configuration 
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource
    });

    console.log('KINY_PUSH_TOKEN_GENERATED:', JSON.stringify(subscription));
    
    // NOTE: This JSON string payload is what gets saved to your database 
    // to target this specific device session later.
    return subscription;
  } catch (err) {
    console.error('Critical failure establishing web push protocol hooks:', err);
    return null;
  }
}
