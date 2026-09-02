const CACHE_NAME = 'webbarcode-v1';
const urlsToCache = [
  './',
  './index.html',
  './icon.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        return caches.match('./index.html');
      });
    })
  );
});
