/*
 * ReplyDesk service worker.
 * Keeps a copy of the app so it opens instantly and works offline once installed.
 * Pages load fresh when you're online (so updates show up), and fall back to the saved copy when you're not.
 * Bump CACHE when you change files, so old copies get cleaned up.
 */
const CACHE = 'replydesk-v2';
const FILES = [
  './',
  'index.html',
  'style.css',
  'script.js',
  'templates.json',
  'manifest.webmanifest',
  'icons/favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  // Network first, then the saved copy. Successful responses refresh the saved copy.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html')))
  );
});

// Clicking a reminder notification brings ReplyDesk to the front.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.includes(self.registration.scope));
      if (open) {
        open.navigate(self.registration.scope + '#/scheduled').catch(() => {});
        return open.focus();
      }
      return self.clients.openWindow('./#/scheduled');
    })
  );
});
