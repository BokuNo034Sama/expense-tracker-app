// public/firebase-messaging-sw.js
// Firebase Cloud Messaging Background Service Worker

// 1. Import Firebase Compat SDK scripts from Google CDN
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// 2. Parse configuration keys from the query parameters passed during registration
// self.location represents the URL of this script (e.g. /firebase-messaging-sw.js?apiKey=...&...)
const urlParams = new URLSearchParams(self.location.search);
const apiKey = urlParams.get('apiKey');
const messagingSenderId = urlParams.get('messagingSenderId');
const projectId = urlParams.get('projectId');
const appId = urlParams.get('appId');

if (apiKey && messagingSenderId && projectId && appId) {
  // 3. Initialize Firebase app compat
  firebase.initializeApp({
    apiKey,
    projectId,
    messagingSenderId,
    appId
  });

  // 4. Retrieve Firebase Messaging instance
  const messaging = firebase.messaging();

  // 5. Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message: ', payload);
    
    // Customize notification behavior here
    const notificationTitle = payload.notification?.title || 'KINY_OS';
    const notificationOptions = {
      body: payload.notification?.body || 'Maintain your momentum. Log your receipts, spending, or added income.',
      icon: '/logo.svg',
      badge: '/logo.svg',
      data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.warn('[firebase-messaging-sw.js] Missing Firebase initialization query parameters.');
}
