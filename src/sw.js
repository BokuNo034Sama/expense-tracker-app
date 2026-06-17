import { precacheAndRoute } from 'workbox-precaching';

// Precache all assets compiled by Vite PWA
precacheAndRoute(self.__WB_MANIFEST || []);

// Listen for message events to skip waiting and activate immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Listen for incoming system push notifications
self.addEventListener('push', (event) => {
  let data = { 
    title: 'KINY_OS', 
    body: 'Maintain your momentum. Log your receipts, spending, or added income for the day.' 
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'KINY_OS', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: { dateOfArrival: Date.now() }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Focus or launch app view upon clicking the notification banner
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
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
