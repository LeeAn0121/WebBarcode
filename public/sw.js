const CACHE_NAME = 'webbarcode-v3';

self.addEventListener('install', event => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker.
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache); // Delete old caches
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all clients immediately
  );
});

// Network First, fallback to cache (Ensures users always get the latest version if online)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Ignore non-HTTP(S) schemes (like chrome-extension://)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request, { cache: event.request.mode === 'navigate' ? 'no-cache' : undefined }).then(response => {
      // Don't cache if not a successful response
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }
      
      // Clone the response to cache it
      const responseToCache = response.clone();
      caches.open(CACHE_NAME).then(cache => {
        cache.put(event.request, responseToCache);
      });
      
      return response;
    }).catch(() => {
      // If network fails, try the cache
      return caches.match(event.request);
    })
  );
});
