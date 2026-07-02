/**
 * OfflineDashboard: A UI component to monitor offline storage quota and sync queue.
 */
class OfflineDashboard {
  constructor() {
    this.modal = null;
    this.createUI();
  }

  createUI() {
    // Add dashboard button to nav if it exists
    const nav = document.querySelector('nav');
    if (nav && !document.getElementById('offline-dashboard-btn')) {
      const btn = document.createElement('button');
      btn.id = 'offline-dashboard-btn';
      btn.innerHTML = '📶 Offline Status';
      btn.className = 'nav-btn';
      btn.style.marginLeft = '10px';
      btn.style.background = 'var(--theme-card)';
      btn.style.color = 'var(--theme-text)';
      btn.style.border = '1px solid var(--theme-border)';
      btn.style.padding = '5px 10px';
      btn.style.borderRadius = '5px';
      btn.style.cursor = 'pointer';
      btn.onclick = () => this.showModal();
      nav.appendChild(btn);
    }

    // Create Modal HTML
    this.modal = document.createElement('div');
    this.modal.id = 'offline-dashboard-modal';
    this.modal.innerHTML = `
      <div class="offline-modal-overlay"></div>
      <div class="offline-modal-content card">
        <div class="offline-modal-header">
          <h2>Offline Data Manager</h2>
          <button class="close-btn">&times;</button>
        </div>
        <div class="offline-modal-body">
          <div class="stat-block">
            <h3>Storage Quota</h3>
            <div class="progress-bar"><div class="progress-fill" id="quota-fill"></div></div>
            <p id="quota-text">Calculating...</p>
          </div>
          <div class="stat-block">
            <h3>Pending Sync Tasks</h3>
            <p id="sync-count-text">Loading...</p>
            <ul id="sync-list" style="max-height: 150px; overflow-y: auto; text-align: left; font-size: 14px;"></ul>
          </div>
          <div class="actions">
            <button id="force-sync-btn" class="btn primary">Force Sync Now</button>
            <button id="clear-cache-btn" class="btn danger" style="background: #e74c3c; color: white;">Erase Offline Data</button>
          </div>
        </div>
      </div>
    `;

    // Basic inline styles for the modal
    const style = document.createElement('style');
    style.textContent = `
      #offline-dashboard-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 100000; }
      .offline-modal-overlay { position: absolute; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(2px); }
      .offline-modal-content { position: relative; margin: 10% auto; width: 90%; max-width: 500px; padding: 25px; }
      .offline-modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--theme-border); padding-bottom: 15px; margin-bottom: 20px; }
      .offline-modal-header h2 { margin: 0; font-size: 1.5rem; }
      .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted); }
      .stat-block { margin-bottom: 25px; text-align: center; }
      .stat-block h3 { margin: 0 0 10px 0; font-size: 1.1rem; color: var(--theme-accent); }
      .progress-bar { width: 100%; height: 10px; background: var(--surface-color); border-radius: 5px; overflow: hidden; margin-bottom: 5px; }
      .progress-fill { height: 100%; background: #4caf50; width: 0%; transition: width 0.3s; }
      .actions { display: flex; gap: 10px; justify-content: center; margin-top: 20px; }
      .actions button { padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer; font-weight: bold; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(this.modal);

    // Event Listeners
    this.modal.querySelector('.close-btn').onclick = () => this.hideModal();
    this.modal.querySelector('.offline-modal-overlay').onclick = () => this.hideModal();
    this.modal.querySelector('#force-sync-btn').onclick = () => this.forceSync();
    this.modal.querySelector('#clear-cache-btn').onclick = () => this.clearOfflineData();
  }

  async showModal() {
    this.modal.style.display = 'block';
    await this.updateStats();
  }

  hideModal() {
    this.modal.style.display = 'none';
  }

  async updateStats() {
    // 1. Update Quota
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
      const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(2);
      const percent = Math.min((estimate.usage / estimate.quota) * 100, 100);
      
      document.getElementById('quota-text').innerText = `${usedMB} MB used of ${quotaMB} MB available (${percent.toFixed(1)}%)`;
      document.getElementById('quota-fill').style.width = `${percent}%`;
    }

    // 2. Update Sync Queue
    if (window.idbStorage) {
      const queue = await window.idbStorage.getSyncQueue();
      document.getElementById('sync-count-text').innerText = queue.length === 0 ? 'No pending tasks.' : `${queue.length} tasks waiting for network.`;
      
      const list = document.getElementById('sync-list');
      list.innerHTML = '';
      queue.forEach(item => {
        const li = document.createElement('li');
        li.innerText = `[${item.method}] ${new URL(item.url).pathname}`;
        list.appendChild(li);
      });
    }
  }

  async forceSync() {
    const btn = document.getElementById('force-sync-btn');
    const originalText = btn.innerText;
    btn.innerText = 'Syncing...';
    btn.disabled = true;

    if (window.appSyncManager) {
      await window.appSyncManager.manualSync();
    }

    await this.updateStats();
    btn.innerText = 'Sync Complete!';
    setTimeout(() => {
      btn.innerText = originalText;
      btn.disabled = false;
    }, 2000);
  }

  async clearOfflineData() {
    if (confirm('Are you sure you want to delete all offline data? This will clear all cached images, audio, and API data. Pending sync tasks will NOT be deleted.')) {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          if (name.startsWith('parampara-')) {
            await caches.delete(name);
          }
        }
      }
      if (window.idbStorage) {
        await window.idbStorage.clearStore('api-cache');
        await window.idbStorage.clearStore('lru-meta');
      }
      
      // Unregister service worker so it re-installs fresh on reload
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.unregister();
        }
      }

      alert('Offline data cleared. The page will now reload.');
      window.location.reload();
    }
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.offlineDashboard = new OfflineDashboard();
});
