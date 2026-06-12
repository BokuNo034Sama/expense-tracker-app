import { precacheAndRoute } from 'workbox-precaching';

// Precache all assets compiled by Vite PWA
precacheAndRoute(self.__WB_MANIFEST || []);

// Listen for message events to skip waiting and activate immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Duolingo-style background push event listener
self.addEventListener('push', (event) => {
  let title = "STREAK_IN_DANGER! 🚨";
  let body = "Your financial discipline streak is freezing! Open Kiny to report today's logs and protect your pocket balance.";
  let icon = "/icons/icon-192x192.png";

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title || title;
      body = payload.body || body;
      icon = payload.icon || icon;
    } catch (e) {
      const textData = event.data.text();
      if (textData) {
        body = textData;
      }
    }
  }

  const options = {
    body: body,
    icon: icon,
    badge: icon,
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Listen for notification click to redirect or focus Vercel live url window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = 'https://expense-tracker-app-mu-five.vercel.app';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Satisfies PWA install criteria: fetch event handler
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch((err) => {
        console.warn('[KINY] Fetch failed offline:', err);
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      });
    })
  );
});
