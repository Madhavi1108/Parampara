const CACHE_NAME = 'parampara-cache-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/styles/main.css',
  '/styles/theme.css',
  '/styles/languageSelector.css',
  '/scripts/main.js',
  '/scripts/theme.js',
  '/scripts/languageSwitcher.js',
  '/scripts/cacheLayer.js',
  '/scripts/sw-register.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching core assets');
      // addAll will fail if any request fails, so it's good for core assets
      return cache.addAll(CORE_ASSETS).catch(error => {
        console.warn('[ServiceWorker] Failed to cache some assets', error);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  // Ignore API requests if we want, but let's let cacheLayer handle API caching or we can intercept here.
  // The cache-first strategy applies nicely to static assets.
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. Cache hit
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. Network fetch
      return fetch(event.request)
        .then((response) => {
          // Can optionally cache new assets dynamically
          return response;
        })
        .catch(() => {
          // 3. Fallback on network failure
          // If the request was for a page (navigation), return the offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          // Optional: Return a generic offline image for image requests
        });
    })
  );
});
