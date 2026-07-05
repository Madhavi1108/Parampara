/**
 * SyncManager: Intercepts network requests when offline and queues them for Background Sync
 */
class SyncManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.initListeners();
  }

  initListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.triggerBackgroundSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async queueRequest(url, method = 'POST', headers = {}, body = null) {
    if (!window.idbStorage) {
      console.warn('[SyncManager] IDBStorage not initialized');
      return false;
    }

    const task = {
      url,
      method,
      headers,
      body: typeof body === 'string' ? body : JSON.stringify(body)
    };

    try {
      await window.idbStorage.enqueueSyncTask(task);
      console.log('[SyncManager] Queued task for offline sync:', url);
      
      // Attempt to register sync if service worker is active
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        try {
          await registration.sync.register('sync-offline-queue');
          console.log('[SyncManager] Registered background sync');
        } catch (err) {
          console.error('[SyncManager] Sync registration failed', err);
        }
      }
      return true;
    } catch (err) {
      console.error('[SyncManager] Failed to queue task', err);
      return false;
    }
  }

  async triggerBackgroundSync() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-offline-queue');
      } catch (err) {
        console.warn('[SyncManager] Background sync API unavailable, falling back to manual sync');
        this.manualSync();
      }
    } else {
      this.manualSync();
    }
  }

  async manualSync() {
    // Fallback if Background Sync API is not supported (e.g. Safari)
    if (!window.idbStorage) return;
    
    try {
      const queue = await window.idbStorage.getSyncQueue();
      for (const item of queue) {
        try {
          const response = await fetch(item.url, {
            method: item.method,
            headers: item.headers,
            body: item.body
          });
          
          if (response.ok || response.status === 400 || response.status === 422) {
            await window.idbStorage.removeSyncTask(item.id);
            console.log('[SyncManager] Manually synced task:', item.id);
          }
        } catch (e) {
          console.error('[SyncManager] Manual sync failed for task:', item.id);
        }
      }
    } catch (err) {
      console.error('[SyncManager] Error reading sync queue for manual sync', err);
    }
  }
}

window.appSyncManager = new SyncManager();
