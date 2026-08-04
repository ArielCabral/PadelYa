self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Service worker básico para cumplir con los requisitos de PWA
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});