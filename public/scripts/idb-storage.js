/**
 * IDBStorage: A lightweight Promise-based IndexedDB wrapper for Parampara
 * Designed for offline-first API caching and Sync Queue management.
 */
class IDBStorage {
  constructor(dbName = 'ParamparaOfflineDB', version = 2) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this.initPromise = this.init();
  }

  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Store for API JSON responses (e.g. /api/items)
        if (!db.objectStoreNames.contains('api-cache')) {
          db.createObjectStore('api-cache', { keyPath: 'url' });
        }
        
        // Store for Background Sync Queue
        if (!db.objectStoreNames.contains('sync-queue')) {
          db.createObjectStore('sync-queue', { keyPath: 'id' });
        }

        // Store for LRU Cache Meta Tracking
        if (!db.objectStoreNames.contains('lru-meta')) {
          const lruStore = db.createObjectStore('lru-meta', { keyPath: 'url' });
          lruStore.createIndex('lastAccess', 'lastAccess', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('[IDBStorage] Failed to open DB:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async getStore(storeName, mode = 'readonly') {
    await this.initPromise;
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // --- API Cache Methods ---
  async setApiData(url, data) {
    const store = await this.getStore('api-cache', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put({ url, data, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getApiData(url) {
    const store = await this.getStore('api-cache', 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.get(url);
      request.onsuccess = () => resolve(request.result ? request.result.data : null);
      request.onerror = () => reject(request.error);
    });
  }

  // --- LRU Meta Methods ---
  async updateLruAccess(url, size = 0) {
    const store = await this.getStore('lru-meta', 'readwrite');
    return new Promise((resolve) => {
      store.put({ url, size, lastAccess: Date.now() }).onsuccess = resolve;
    });
  }

  async getOldestLruItems(limit) {
    const store = await this.getStore('lru-meta', 'readonly');
    const index = store.index('lastAccess');
    return new Promise((resolve) => {
      const request = index.getAll();
      request.onsuccess = () => {
        // Sort by lastAccess ascending and take the first 'limit'
        const items = request.result.sort((a, b) => a.lastAccess - b.lastAccess).slice(0, limit);
        resolve(items);
      };
    });
  }

  async removeLruItem(url) {
    const store = await this.getStore('lru-meta', 'readwrite');
    return new Promise((resolve) => {
      store.delete(url).onsuccess = resolve;
    });
  }

  // --- Sync Queue Methods ---
  async enqueueSyncTask(task) {
    const store = await this.getStore('sync-queue', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add({ ...task, id: crypto.randomUUID(), timestamp: Date.now(), status: 'pending' });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue() {
    const store = await this.getStore('sync-queue', 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeSyncTask(id) {
    const store = await this.getStore('sync-queue', 'readwrite');
    return new Promise((resolve) => {
      store.delete(id).onsuccess = resolve;
    });
  }

  async clearStore(storeName) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve) => {
      store.clear().onsuccess = resolve;
    });
  }
}

// Export for module usage, or attach to window for vanilla JS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IDBStorage;
} else if (typeof window !== 'undefined') {
  window.idbStorage = new IDBStorage();
} else if (typeof self !== 'undefined') {
  self.idbStorage = new IDBStorage();
}
