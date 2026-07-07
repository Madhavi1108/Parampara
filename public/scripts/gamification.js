// public/scripts/gamification.js

class GamificationUI {
  constructor(options = {}) {
    this.apiBase = options.apiBase || '/api/gamification';
    this.userId = this.getUserId();
    this.container = options.container || '#gamification-container';
    
    this.init();
  }

  getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = `user_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  init() {
    this.loadProgress();
    this.loadAchievements();
    this.loadLeaderboard();
    this.setupEventListeners();
  }

  async loadProgress() {
    try {
      const response = await fetch(`${this.apiBase}/progress/${this.userId}`);
      const data = await response.json();
      
      if (data.success) {
        this.renderProgress(data.progress);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  }

  renderProgress(progress) {
    const container = document.querySelector(this.container);
    if (!container) return;

    const pointsProgress = (progress.points % 100) / 100 * 100;
    const level = progress.level;

    const html = `
      <div class="gamification-header">
        <div class="level-display">
          <div class="level-badge">${level}</div>
          <div class="level-label">Level</div>
        </div>
        <div class="points-display">
          <div class="points-value">${progress.points}</div>
          <div class="points-label">Points</div>
          <div class="points-bar">
            <div class="points-progress" style="width: ${pointsProgress}%"></div>
          </div>
        </div>
        <div class="stats-summary">
          <span>🎯 ${progress.badges ? progress.badges.length : 0} Badges</span>
          <span>💎 ${progress.artifacts ? progress.artifacts.length : 0} Artifacts</span>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
  }

  async loadAchievements() {
    try {
      const response = await fetch(`${this.apiBase}/achievements/${this.userId}`);
      const data = await response.json();
      
      if (data.success) {
        this.renderAchievements(data.achievements);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  }

  renderAchievements(achievements) {
    const container = document.querySelector('#achievements-section');
    if (!container) return;

    const allBadges = achievements.badges || [];

    const html = `
      <div class="achievements-grid">
        ${allBadges.map(badge => `
          <div class="badge-card">
            <div class="badge-icon">${badge.icon || '🏅'}</div>
            <div class="badge-name">${badge.name}</div>
            <div class="badge-desc">${badge.description}</div>
          </div>
        `).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  async loadLeaderboard() {
    try {
      const response = await fetch(`${this.apiBase}/leaderboard?limit=50`);
      const data = await response.json();
      
      if (data.success) {
        this.renderLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  }

  renderLeaderboard(leaderboard) {
    const container = document.querySelector('#leaderboard-section');
    if (!container) return;

    const html = `
      <div class="leaderboard-list">
        ${leaderboard.map((user, index) => `
          <div class="leaderboard-item ${user.userId === this.userId ? 'highlight' : ''}">
            <span class="rank">#${user.rank}</span>
            <span class="username">${user.userId}</span>
            <span class="points">${user.points} pts</span>
            <span class="level">Lv.${user.level}</span>
            <span class="badges">${user.badges} 🏅</span>
          </div>
        `).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  setupEventListeners() {
    // Track actions
    document.addEventListener('click', async (e) => {
      const actionEl = e.target.closest('[data-action]');
      if (!actionEl) return;

      const action = actionEl.dataset.action;
      const metadata = { ...actionEl.dataset };

      try {
        const response = await fetch(`${this.apiBase}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.userId,
            action,
            metadata
          })
        });

        const data = await response.json();
        if (data.success) {
          this.showToast(`✅ +${data.progress.points} points!`, 'success');
          this.loadProgress();
        }
      } catch (error) {
        console.error('Error tracking action:', error);
      }
    });
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
    
    setTimeout(() => toast.remove(), 3000);
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const gamification = new GamificationUI({
    container: '#gamification-container'
  });
  window.gamification = gamification;
});

// Add CSS
const style = document.createElement('style');
style.textContent = `
  .gamification-header {
    display: flex;
    align-items: center;
    gap: 30px;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 15px;
    color: white;
    margin-bottom: 20px;
  }
  .level-badge {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: bold;
  }
  .points-value {
    font-size: 32px;
    font-weight: bold;
  }
  .points-bar {
    width: 200px;
    height: 8px;
    background: rgba(255,255,255,0.3);
    border-radius: 4px;
    margin-top: 5px;
  }
  .points-progress {
    height: 100%;
    background: #4CAF50;
    border-radius: 4px;
    transition: width 0.5s ease;
  }
  .achievements-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
    margin: 20px 0;
  }
  .badge-card {
    background: white;
    padding: 15px;
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    transition: transform 0.3s;
  }
  .badge-card:hover {
    transform: translateY(-5px);
  }
  .badge-icon {
    font-size: 36px;
  }
  .badge-name {
    font-weight: bold;
    margin: 5px 0;
  }
  .badge-desc {
    font-size: 12px;
    color: #666;
  }
  .leaderboard-list {
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  .leaderboard-item {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    border-bottom: 1px solid #eee;
    gap: 15px;
  }
  .leaderboard-item.highlight {
    background: #f0f7ff;
    font-weight: bold;
  }
  .rank {
    font-weight: bold;
    min-width: 40px;
  }
  .username {
    flex: 1;
  }
  .points {
    font-weight: bold;
    color: #2E7D32;
  }
  .level {
    color: #764ba2;
  }
  .badges {
    color: #f57c00;
  }
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(style);