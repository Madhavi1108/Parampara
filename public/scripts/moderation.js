// public/scripts/moderation.js

class ModerationDashboard {
  constructor(options = {}) {
    this.apiBase = options.apiBase || '/api/moderation';
    this.container = options.container || '#moderation-dashboard';
    this.isLoading = false;
    
    this.init();
  }

  init() {
    this.renderDashboard();
    this.loadStats();
    this.loadQueue();
    this.setupEventListeners();
  }

  renderDashboard() {
    const container = document.querySelector(this.container);
    if (!container) return;

    container.innerHTML = `
      <div class="moderation-dashboard">
        <div class="dashboard-header">
          <h2>🛡️ Content Moderation Dashboard</h2>
          <div class="dashboard-actions">
            <button id="refresh-moderation" class="btn btn-primary">
              🔄 Refresh
            </button>
            <button id="train-model" class="btn btn-secondary">
              🧠 Train Model
            </button>
          </div>
        </div>

        <div class="stats-grid" id="moderation-stats">
          <div class="stat-card">
            <div class="stat-value" id="stat-total">0</div>
            <div class="stat-label">Total Moderated</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="stat-queue">0</div>
            <div class="stat-label">In Queue</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="stat-accuracy">0%</div>
            <div class="stat-label">Accuracy</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="stat-users">0</div>
            <div class="stat-label">Users Tracked</div>
          </div>
        </div>

        <div class="queue-section">
          <h3>📋 Review Queue</h3>
          <div class="queue-filters">
            <select id="queue-filter-status">
              <option value="all">All Status</option>
              <option value="flagged">Flagged</option>
              <option value="review">Review</option>
              <option value="warn">Warn</option>
            </select>
            <select id="queue-filter-priority">
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div id="queue-list" class="queue-list">
            <p>Loading queue...</p>
          </div>
        </div>
      </div>
    `;
  }

  async loadStats() {
    try {
      const response = await fetch(`${this.apiBase}/stats`);
      const data = await response.json();

      if (data.success) {
        document.getElementById('stat-total').textContent = data.stats.totalModerated || 0;
        document.getElementById('stat-queue').textContent = data.stats.queueSize || 0;
        document.getElementById('stat-accuracy').textContent = 
          `${Math.round((data.stats.accuracy || 0.95) * 100)}%`;
        document.getElementById('stat-users').textContent = data.stats.reputationCount || 0;
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async loadQueue(filters = {}) {
    const queueList = document.getElementById('queue-list');
    if (!queueList) return;

    this.setLoading(queueList, true);

    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${this.apiBase}/queue?${params}`);
      const data = await response.json();

      if (data.success) {
        this.renderQueue(queueList, data.queue);
      }
    } catch (error) {
      console.error('Error loading queue:', error);
      queueList.innerHTML = '<p class="error">Error loading queue</p>';
    } finally {
      this.setLoading(queueList, false);
    }
  }

  renderQueue(container, queue) {
    if (!queue || queue.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>✅ No content in review queue</p>
        </div>
      `;
      return;
    }

    const html = `
      <div class="queue-items">
        ${queue.map(item => this.renderQueueItem(item)).join('')}
      </div>
    `;

    container.innerHTML = html;

    // Add review handlers
    container.querySelectorAll('.review-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.reviewContent(
          btn.dataset.contentId,
          btn.dataset.decision
        );
      });
    });
  }

  renderQueueItem(item) {
    const priorityColors = {
      high: '#f44336',
      medium: '#ff9800',
      low: '#4CAF50'
    };

    return `
      <div class="queue-item" style="
        background: white;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        border-left: 4px solid ${priorityColors[item.priority] || '#999'};
      ">
        <div class="queue-item-header">
          <span class="queue-item-id">📝 ${item.contentId}</span>
          <span class="queue-item-status badge badge-${item.status}">
            ${item.status}
          </span>
          <span class="queue-item-priority badge badge-${item.priority}">
            ${item.priority}
          </span>
        </div>
        <div class="queue-item-details">
          <p><strong>Flags:</strong> ${item.flags ? item.flags.length : 0}</p>
          <p><strong>Score:</strong> ${item.score || 0}</p>
          <p><strong>User:</strong> ${item.userId || 'Unknown'}</p>
          <p><strong>Time:</strong> ${new Date(item.addedAt).toLocaleString()}</p>
        </div>
        <div class="queue-item-actions">
          <button class="review-btn btn btn-success" 
                  data-content-id="${item.contentId}" 
                  data-decision="approve">
            ✅ Approve
          </button>
          <button class="review-btn btn btn-danger" 
                  data-content-id="${item.contentId}" 
                  data-decision="reject">
            ❌ Reject
          </button>
          <button class="review-btn btn btn-warning" 
                  data-content-id="${item.contentId}" 
                  data-decision="flag">
            ⚠️ Flag
          </button>
        </div>
      </div>
    `;
  }

  async reviewContent(contentId, decision) {
    const reviewerId = localStorage.getItem('userId') || 'moderator_1';

    try {
      const response = await fetch(`${this.apiBase}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contentId,
          reviewerId,
          decision,
          notes: `Reviewed via dashboard`
        })
      });

      const data = await response.json();

      if (data.success) {
        this.showToast(`✅ Content ${decision}ed successfully`, 'success');
        this.loadQueue();
        this.loadStats();
      } else {
        this.showToast(`❌ Error: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error reviewing content:', error);
      this.showToast('❌ Error processing review', 'error');
    }
  }

  async trainModel() {
    try {
      this.showToast('🔄 Training model...', 'info');
      
      const response = await fetch(`${this.apiBase}/train`, {
        method: 'POST'
      });
      
      const data = await response.json();

      if (data.success) {
        this.showToast(`✅ Model trained! Accuracy: ${Math.round(data.accuracy * 100)}%`, 'success');
        this.loadStats();
      }
    } catch (error) {
      console.error('Error training model:', error);
      this.showToast('❌ Error training model', 'error');
    }
  }

  setupEventListeners() {
    // Refresh button
    document.addEventListener('click', (e) => {
      if (e.target.id === 'refresh-moderation' || e.target.closest('#refresh-moderation')) {
        this.loadStats();
        this.loadQueue();
        this.showToast('🔄 Refreshed dashboard', 'info');
      }
    });

    // Train model button
    document.addEventListener('click', (e) => {
      if (e.target.id === 'train-model' || e.target.closest('#train-model')) {
        this.trainModel();
      }
    });

    // Filter changes
    document.addEventListener('change', (e) => {
      if (e.target.id === 'queue-filter-status' || e.target.id === 'queue-filter-priority') {
        const status = document.getElementById('queue-filter-status').value;
        const priority = document.getElementById('queue-filter-priority').value;
        
        const filters = {};
        if (status !== 'all') filters.status = status;
        if (priority !== 'all') filters.priority = priority;
        
        this.loadQueue(filters);
      }
    });
  }

  setLoading(container, isLoading) {
    this.isLoading = isLoading;
    if (isLoading) {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="
            display: inline-block;
            width: 30px;
            height: 30px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #4CAF50;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "></div>
          <p>Loading...</p>
        </div>
      `;
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      border-radius: 8px;
      z-index: 99999;
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const dashboard = new ModerationDashboard({
    container: '#moderation-dashboard'
  });
  
  window.moderationDashboard = dashboard;
});

// Add CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  .badge {
    padding: 2px 10px;
    border-radius: 15px;
    font-size: 12px;
    font-weight: bold;
  }
  .badge-approved { background: #4CAF50; color: white; }
  .badge-flagged { background: #f44336; color: white; }
  .badge-review { background: #ff9800; color: white; }
  .badge-warn { background: #ffc107; color: black; }
  .badge-high { background: #f44336; color: white; }
  .badge-medium { background: #ff9800; color: white; }
  .badge-low { background: #4CAF50; color: white; }
  .btn-success { background: #4CAF50; color: white; }
  .btn-danger { background: #f44336; color: white; }
  .btn-warning { background: #ff9800; color: white; }
  .btn { padding: 5px 15px; border: none; border-radius: 5px; cursor: pointer; margin: 0 5px; }
  .queue-item-actions { margin-top: 10px; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
  .stat-card { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
  .stat-value { font-size: 2em; font-weight: bold; color: #2E7D32; }
  .queue-filters { display: flex; gap: 10px; margin: 10px 0; }
  .queue-filters select { padding: 5px 10px; border-radius: 5px; border: 1px solid #ddd; }
`;
document.head.appendChild(style);