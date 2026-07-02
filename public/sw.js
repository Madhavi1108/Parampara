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

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-queue') {
    console.log('[ServiceWorker] Background sync triggered for offline queue');
    event.waitUntil(syncOfflineQueue());
  }
});

async function syncOfflineQueue() {
  try {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('ParamparaSyncDB', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const queue = await new Promise((resolve, reject) => {
      const tx = db.transaction(['sync-queue'], 'readonly');
      const store = tx.objectStore('sync-queue');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (queue.length === 0) return;

    for (const item of queue) {
      if (item.status === 'failed') continue;

      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body
        });

        if (response.ok || response.status === 400 || response.status === 422) {
          // Success or non-retryable error -> remove from queue
          await new Promise((resolve, reject) => {
            const tx = db.transaction(['sync-queue'], 'readwrite');
            const store = tx.objectStore('sync-queue');
            const req = store.delete(item.id);
            req.onsuccess = resolve;
            req.onerror = reject;
          });
        } else {
           // If we hit a 5xx, we might want to let the main thread handle the backoff logic.
           // Background sync itself has its own backoff mechanism provided by the browser.
           throw new Error(`Server returned ${response.status}`);
        }
      } catch (err) {
        console.error('[ServiceWorker] Sync failed for item', item.id, err);
        throw err; // Let the browser background sync know it failed, so it can retry later
      }
    }
  } catch (err) {
    console.error('[ServiceWorker] IndexedDB access failed', err);
  }
}

