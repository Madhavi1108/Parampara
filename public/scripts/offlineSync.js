/**
 * Offline Sync Manager for Parampara
 * Uses IndexedDB to store failed network requests and retries them when online.
 * Features: Background Sync, Exponential Backoff, Non-blocking Toasts
 */

class OfflineSyncManager {
  constructor() {
    this.dbName = 'ParamparaSyncDB';
    this.storeName = 'sync-queue';
    this.dbVersion = 1;
    this.db = null;
    this.isSyncing = false;
    this.maxRetries = 5;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.bindEvents();
        this.renderUI();
        resolve();
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  bindEvents() {
    window.addEventListener('online', () => {
      console.log('[Parampara Sync] Online. Starting sync...');
      this.sync();
      this.renderUI();
    });
    
    window.addEventListener('offline', () => {
      console.log('[Parampara Sync] Offline.');
      this.renderUI();
    });
  }

  async enqueue(url, options, metadata = {}) {
    if (!this.db) await this.init();

    const item = {
      url,
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body || null,
      retryCount: 0,
      status: 'pending', // pending, failed
      metadata: {
        ...metadata,
        timestamp: Date.now()
      }
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(item);

      request.onsuccess = () => {
        this.renderUI();
        this.registerBackgroundSync();
        resolve(request.result);
      };

      request.onerror = (e) => reject(e.target.error);
    });
  }

  async registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-offline-queue');
        console.log('[Parampara Sync] Background sync registered.');
      } catch (err) {
        console.warn('[Parampara Sync] Background sync registration failed.', err);
      }
    }
  }

  async getQueue() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async updateItem(item) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async removeItem(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        this.renderUI();
        resolve();
      };
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async sync() {
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;
    this.renderUI();

    try {
      const queue = await this.getQueue();
      if (queue.length === 0) {
        this.isSyncing = false;
        this.renderUI();
        return;
      }

      let successCount = 0;
      let failureCount = 0;

      for (const item of queue) {
        if (item.status === 'failed') continue; // Skip permanently failed items

        // Exponential backoff check (if recently failed, wait longer based on retryCount)
        const now = Date.now();
        if (item.lastAttempt) {
          const backoffDelay = Math.pow(2, item.retryCount) * 1000;
          if (now - item.lastAttempt < backoffDelay) continue; 
        }

        try {
          const response = await fetch(item.url, {
            method: item.method,
            headers: item.headers,
            body: item.body
          });

          if (response.ok) {
            await this.removeItem(item.id);
            successCount++;
          } else if (response.status === 400 || response.status === 422) {
            // Non-retryable error
            item.status = 'failed';
            item.errorMsg = `Server rejected data (${response.status})`;
            await this.updateItem(item);
            failureCount++;
          } else {
            // Retryable error (500, etc)
            item.retryCount++;
            item.lastAttempt = now;
            if (item.retryCount >= this.maxRetries) {
               item.status = 'failed';
               item.errorMsg = 'Max retries exceeded.';
            }
            await this.updateItem(item);
          }
        } catch (err) {
          console.error(`[Parampara Sync] Failed to sync item ${item.id}`, err);
          item.retryCount++;
          item.lastAttempt = now;
          if (item.retryCount >= this.maxRetries) {
             item.status = 'failed';
             item.errorMsg = 'Network failure.';
          }
          await this.updateItem(item);
          break; // Stop syncing on hard network drop
        }
      }
      
      if (successCount > 0) {
        this.showToast(`Successfully synchronized ${successCount} offline submission(s).`, 'success');
        window.dispatchEvent(new CustomEvent('parampara:sync-complete', { detail: { count: successCount } }));
      }
      if (failureCount > 0) {
        this.showToast(`${failureCount} submission(s) could not be processed due to validation errors.`, 'error');
      }
    } finally {
      this.isSyncing = false;
      this.renderUI();
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `sync-toast sync-toast-${type}`;
    toast.innerText = message;
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 4s
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  async renderUI() {
    const containerId = 'offline-sync-container';
    let container = document.getElementById(containerId);
    
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.className = 'offline-sync-panel';
      document.body.appendChild(container);
    }

    try {
      const queue = await this.getQueue();
      
      if (queue.length === 0 && navigator.onLine) {
        container.style.display = 'none';
        return;
      }

      container.style.display = 'block';

      let statusHtml = ``;
      if (!navigator.onLine) {
        statusHtml = `<div class="sync-status offline">⚠️ You are offline. Changes will be saved locally.</div>`;
      } else if (this.isSyncing) {
        statusHtml = `<div class="sync-status syncing">🔄 Synchronizing data with server...</div>`;
      } else {
        statusHtml = `<div class="sync-status online">🟢 Online. Queue pending.</div>`;
      }

      let itemsHtml = ``;
      if (queue.length > 0) {
        itemsHtml = `
          <div class="sync-queue">
            <h4>Pending Uploads (${queue.length})</h4>
            <ul>
              ${queue.map(item => `
                <li class="${item.status === 'failed' ? 'item-failed' : ''}">
                  <div class="sync-item-info">
                    <strong>${item.metadata.title || 'Untitled'}</strong>
                    <span class="sync-time">${new Date(item.metadata.timestamp).toLocaleTimeString()}</span>
                  </div>
                  ${item.status === 'failed' ? `<div class="sync-error-msg">${item.errorMsg}</div>` : ''}
                  <div class="sync-item-actions">
                    ${item.status !== 'failed' ? `<button class="btn btn-sm retry-btn" onclick="window.SyncManager.sync()">Retry</button>` : ''}
                    <button class="btn btn-sm btn-danger remove-btn" onclick="window.SyncManager.removeItem(${item.id})">Remove</button>
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      }

      container.innerHTML = `
        ${statusHtml}
        ${itemsHtml}
      `;
    } catch (err) {
      console.error('Error rendering sync UI', err);
    }
  }
}

// Initialize globally
window.SyncManager = new OfflineSyncManager();
window.addEventListener('DOMContentLoaded', () => {
  window.SyncManager.init();
});
