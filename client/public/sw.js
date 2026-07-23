// ConnectX PWA Service Worker for Background Notifications & Active App Status
const CACHE_NAME = 'connectx-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle Background Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'ConnectX - Yangi Xabar';
  const options = {
    body: data.body || 'Sizga yangi xabar keldi',
    icon: data.icon || 'https://api.dicebear.com/7.x/bottts/svg?seed=ConnectXApp',
    badge: 'https://api.dicebear.com/7.x/bottts/svg?seed=ConnectXApp',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow(event.notification.data.url || '/');
    })
  );
});
