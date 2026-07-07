// public/scripts/arExperience.js

class ARExperienceUI {
  constructor(options = {}) {
    this.apiBase = options.apiBase || '/api/ar';
    this.userId = this.getUserId();
    this.container = options.container || '#ar-container';
    this.sessionId = null;
    this.sceneData = null;
    this.isARActive = false;
    this.cameraStream = null;
    this.currentLandmark = null;
    
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
    this.renderInterface();
    this.setupEventListeners();
    this.checkARSupport();
    console.log('✅ AR Experience UI initialized');
  }

  renderInterface() {
    const container = document.querySelector(this.container);
    if (!container) return;

    container.innerHTML = `
      <div class="ar-interface">
        <div class="ar-header">
          <h2>🔮 Augmented Reality Heritage</h2>
          <div class="ar-actions">
            <button id="ar-start" class="btn btn-primary">
              📱 Start AR
            </button>
            <button id="ar-scan" class="btn btn-secondary">
              🔍 Scan Landmark
            </button>
            <button id="ar-treasure" class="btn btn-info">
              💎 Treasure Hunt
            </button>
          </div>
        </div>

        <div class="ar-viewport" id="ar-viewport">
          <div class="ar-placeholder">
            <p>📱 Point your camera at a heritage site</p>
            <p style="font-size: 14px; color: #666;">Or browse available experiences below</p>
          </div>
        </div>

        <div class="ar-controls" id="ar-controls" style="display: none;">
          <button id="ar-capture" class="btn btn-primary">📸 Capture</button>
          <button id="ar-info" class="btn btn-info">ℹ️ Info</button>
          <button id="ar-close" class="btn btn-danger">❌ Close</button>
        </div>

        <div class="ar-landmarks" id="ar-landmarks">
          <h4>📍 Nearby Heritage Sites</h4>
          <div id="landmarks-list">
            <p>Loading landmarks...</p>
          </div>
        </div>

        <div class="ar-scenes" id="ar-scenes">
          <h4>🏛️ Historical Scenes</h4>
          <div id="scenes-list">
            <p>Loading scenes...</p>
          </div>
        </div>

        <div class="ar-shares" id="ar-shares">
          <h4>📸 Community AR Photos</h4>
          <div id="shares-list">
            <p>No shares yet</p>
          </div>
        </div>

        <!-- Modal for AR View -->
        <div class="modal" id="ar-modal" style="display: none;">
          <div class="modal-content" style="max-width: 90%;">
            <span class="modal-close">&times;</span>
            <div id="ar-modal-content">
              <div class="ar-scene-container">
                <video id="ar-video" autoplay playsinline></video>
                <canvas id="ar-canvas"></canvas>
                <div class="ar-overlay" id="ar-overlay">
                  <div id="ar-elements">
                    <!-- AR elements rendered here -->
                  </div>
                </div>
              </div>
              <div class="ar-info-panel" id="ar-info-panel">
                <h4 id="ar-element-name">Element Name</h4>
                <p id="ar-element-description">Description</p>
                <button id="ar-interact" class="btn btn-primary">Interact</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  checkARSupport() {
    const hasCamera = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
    const hasAR = 'xr' in navigator || 'mozXR' in navigator || 'webkitXR' in navigator;
    
    if (!hasCamera) {
      this.showToast('❌ Camera not supported on this device', 'error');
    }
    
    if (hasAR) {
      console.log('✅ WebXR supported');
    } else {
      console.log('ℹ️ Using fallback AR experience');
    }
  }

  async startAR() {
    if (this.isARActive) {
      this.stopAR();
      return;
    }

    try {
      // Get camera stream
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 }
      });

      const video = document.getElementById('ar-video');
      if (video) {
        video.srcObject = this.cameraStream;
        await video.play();
      }

      // Load AR scene
      const locationId = 'default';
      const response = await fetch(`${this.apiBase}/load-scene?locationId=${locationId}&userId=${this.userId}`);
      const data = await response.json();

      if (data.success) {
        this.sessionId = data.sessionId;
        this.sceneData = data.scene;
        this.isARActive = true;

        // Show AR controls
        document.getElementById('ar-controls').style.display = 'flex';
        document.getElementById('ar-placeholder')?.remove();
        
        this.showToast('✅ AR started! Point your camera at a heritage site.', 'success');
        this.renderARScene(data.scene);
      }

    } catch (error) {
      console.error('Error starting AR:', error);
      this.showToast('❌ Could not access camera: ' + error.message, 'error');
    }
  }

  stopAR() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }

    this.isARActive = false;
    document.getElementById('ar-controls').style.display = 'none';
    this.showToast('AR stopped', 'info');
  }

  renderARScene(scene) {
    const container = document.getElementById('ar-overlay');
    if (!container) return;

    // In production: render with Three.js/AR.js
    // For now: display placeholder elements
    const elementsHtml = scene.elements.map(el => `
      <div class="ar-element" style="
        position: absolute;
        top: ${30 + Math.random() * 40}%;
        left: ${20 + Math.random() * 60}%;
        padding: 10px 20px;
        background: rgba(0,0,0,0.7);
        color: white;
        border-radius: 8px;
        cursor: pointer;
        border: 2px solid #4CAF50;
        animation: pulse 2s infinite;
        transform: ${el.rotation ? `rotate(${el.rotation[2]}deg)` : ''};
      " data-element-id="${el.id}">
        ${el.label || el.type}
        <div style="font-size: 12px; color: #aaa;">
          Tap to interact
        </div>
      </div>
    `).join('');

    container.innerHTML = elementsHtml;

    // Add interaction handlers
    container.querySelectorAll('.ar-element').forEach(el => {
      el.addEventListener('click', () => {
        const elementId = el.dataset.elementId;
        this.interactWithElement(elementId);
      });
    });
  }

  async interactWithElement(elementId) {
    try {
      const response = await fetch(`${this.apiBase}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          elementId,
          interactionType: 'tap'
        })
      });

      const data = await response.json();

      if (data.success) {
        // Show element info
        document.getElementById('ar-element-name').textContent = data.info.name;
        document.getElementById('ar-element-description').textContent = data.info.description;
        document.getElementById('ar-info-panel').style.display = 'block';
        this.showToast(data.message, 'success');
      }
    } catch (error) {
      console.error('Error interacting:', error);
    }
  }

  async scanLandmark() {
    if (!this.isARActive) {
      this.showToast('Please start AR first', 'info');
      return;
    }

    // Capture current frame
    const video = document.getElementById('ar-video');
    const canvas = document.getElementById('ar-canvas');
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/jpeg');

    try {
      this.showToast('🔍 Scanning landmark...', 'info');
      
      const response = await fetch(`${this.apiBase}/recognize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData })
      });

      const data = await response.json();

      if (data.success && data.landmark) {
        this.currentLandmark = data.landmark;
        this.showToast(`✅ Found: ${data.landmark.name} (${Math.round(data.confidence * 100)}% confidence)`, 'success');
        this.showLandmarkInfo(data.landmark);
      } else {
        this.showToast('❌ No landmark recognized. Try again.', 'error');
        if (data.suggestions) {
          console.log('Suggestions:', data.suggestions);
        }
      }
    } catch (error) {
      console.error('Error scanning:', error);
      this.showToast('❌ Error scanning landmark', 'error');
    }
  }

  showLandmarkInfo(landmark) {
    const panel = document.getElementById('ar-info-panel');
    if (!panel) return;

    panel.innerHTML = `
      <h4>${landmark.name}</h4>
      <p>${landmark.description}</p>
      <div style="margin: 10px 0;">
        <span style="background: #e3f2fd; padding: 2px 10px; border-radius: 12px; font-size: 12px;">${landmark.category}</span>
        <span style="background: #fce4ec; padding: 2px 10px; border-radius: 12px; font-size: 12px;">${landmark.era}</span>
      </div>
      <p><strong>Significance:</strong> ${landmark.significance}</p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        ${landmark.facts.map(fact => `<li>${fact}</li>`).join('')}
      </ul>
      <button onclick="document.getElementById('ar-info-panel').style.display='none'" class="btn btn-secondary">Close</button>
    `;

    panel.style.display = 'block';
  }

  async loadLandmarks() {
    try {
      const response = await fetch(`${this.apiBase}/landmarks`);
      const data = await response.json();

      if (data.success) {
        this.renderLandmarks(data.landmarks);
      }
    } catch (error) {
      console.error('Error loading landmarks:', error);
    }
  }

  renderLandmarks(landmarks) {
    const container = document.getElementById('landmarks-list');
    if (!container) return;

    container.innerHTML = landmarks.map(lm => `
      <div class="landmark-item" style="
        background: white;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        cursor: pointer;
      " onclick="window.arUI.loadLandmarkScene('${lm.id}')">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <h4 style="margin: 0;">${lm.name}</h4>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">${lm.description}</p>
          </div>
          <span style="background: #4CAF50; color: white; padding: 2px 10px; border-radius: 12px; font-size: 11px;">${lm.category}</span>
        </div>
        <div style="font-size: 12px; color: #888; margin-top: 5px;">
          <span>📅 ${lm.era}</span>
        </div>
      </div>
    `).join('');
  }

  async loadScenes() {
    try {
      const response = await fetch(`${this.apiBase}/scenes`);
      const data = await response.json();

      if (data.success) {
        this.renderScenes(data.scenes);
      }
    } catch (error) {
      console.error('Error loading scenes:', error);
    }
  }

  renderScenes(scenes) {
    const container = document.getElementById('scenes-list');
    if (!container) return;

    container.innerHTML = scenes.map(scene => `
      <div class="scene-item" style="
        background: white;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        cursor: pointer;
      " onclick="window.arUI.loadARScene('${scene.id}')">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <h4 style="margin: 0;">${scene.name}</h4>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">${scene.description}</p>
          </div>
          <span style="background: #FF9800; color: white; padding: 2px 10px; border-radius: 12px; font-size: 11px;">${scene.period}</span>
        </div>
        <div style="font-size: 12px; color: #888; margin-top: 5px;">
          <span>📍 ${scene.location.lat}, ${scene.location.lng}</span>
        </div>
        <div style="margin-top: 8px;">
          <button onclick="event.stopPropagation(); window.arUI.previewScene('${scene.id}')" class="btn btn-primary" style="padding: 4px 12px; font-size: 12px;">
            👁️ Preview
          </button>
        </div>
      </div>
    `).join('');
  }

  async loadShares() {
    try {
      const response = await fetch(`${this.apiBase}/shares?limit=5`);
      const data = await response.json();

      if (data.success) {
        this.renderShares(data.shares);
      }
    } catch (error) {
      console.error('Error loading shares:', error);
    }
  }

  renderShares(shares) {
    const container = document.getElementById('shares-list');
    if (!container) return;

    if (!shares || shares.length === 0) {
      container.innerHTML = '<p style="color: #999;">No AR photos shared yet. Be the first!</p>';
      return;
    }

    container.innerHTML = shares.map(share => `
      <div class="share-item" style="
        background: white;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      ">
        <div style="display: flex; justify-content: space-between;">
          <div>
            <p><strong>${share.scene.name}</strong></p>
            <p style="font-size: 12px; color: #666;">${share.caption || 'AR experience'}</p>
          </div>
          <span style="font-size: 12px; color: #888;">❤️ ${share.likes}</span>
        </div>
        <div style="font-size: 11px; color: #999; margin-top: 5px;">
          ${new Date(share.createdAt).toLocaleDateString()}
        </div>
      </div>
    `).join('');
  }

  async loadLandmarkScene(landmarkId) {
    this.showToast(`📱 Loading AR experience for landmark...`, 'info');
    // In production: load specific AR scene
    await this.startAR();
  }

  previewScene(sceneId) {
    this.showToast(`🎥 Loading preview for scene...`, 'info');
    // In production: show scene preview
  }

  setupEventListeners() {
    // Start/Stop AR
    document.addEventListener('click', (e) => {
      if (e.target.id === 'ar-start' || e.target.closest('#ar-start')) {
        this.startAR();
      }
    });

    // Scan landmark
    document.addEventListener('click', (e) => {
      if (e.target.id === 'ar-scan' || e.target.closest('#ar-scan')) {
        this.scanLandmark();
      }
    });

    // Treasure hunt
    document.addEventListener('click', (e) => {
      if (e.target.id === 'ar-treasure' || e.target.closest('#ar-treasure')) {
        this.startTreasureHunt();
      }
    });

    // Capture
    document.addEventListener('click', (e) => {
      if (e.target.id === 'ar-capture' || e.target.closest('#ar-capture')) {
        this.captureARPhoto();
      }
    });

    // Close AR
    document.addEventListener('click', (e) => {
      if (e.target.id === 'ar-close' || e.target.closest('#ar-close')) {
        this.stopAR();
        document.getElementById('ar-modal').style.display = 'none';
      }
    });

    // Modal close
    document.addEventListener('click', (e) => {
      if (e.target.closest('.modal-close') || 
          (e.target.closest('.modal') && !e.target.closest('.modal-content'))) {
        const modal = e.target.closest('.modal');
        if (modal) {
          modal.style.display = 'none';
          if (this.isARActive) {
            this.stopAR();
          }
        }
      }
    });
  }

  async captureARPhoto() {
    if (!this.isARActive) {
      this.showToast('Please start AR first', 'info');
      return;
    }

    const video = document.getElementById('ar-video');
    const canvas = document.getElementById('ar-canvas');
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const photoData = canvas.toDataURL('image/jpeg');

    try {
      const response = await fetch(`${this.apiBase}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          photoData,
          caption: 'Exploring heritage with AR!'
        })
      });

      const data = await response.json();

      if (data.success) {
        this.showToast('📸 AR photo shared!', 'success');
        this.loadShares();
      }
    } catch (error) {
      console.error('Error sharing photo:', error);
      this.showToast('❌ Error sharing photo', 'error');
    }
  }

  async startTreasureHunt() {
    // In production: start treasure hunt
    this.showToast('💎 Treasure hunt coming soon!', 'info');
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
  const arUI = new ARExperienceUI({
    container: '#ar-container'
  });
  window.arUI = arUI;
  
  // Load data
  arUI.loadLandmarks();
  arUI.loadScenes();
  arUI.loadShares();
});

// Add CSS
const style = document.createElement('style');
style.textContent = `
  .ar-interface { max-width: 1200px; margin: 0 auto; padding: 20px; }
  .ar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
  .ar-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .ar-viewport { 
    background: #1a1a2e; 
    border-radius: 15px; 
    min-height: 300px; 
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
  }
  .ar-placeholder { color: white; text-align: center; padding: 40px; }
  .ar-placeholder p:first-child { font-size: 24px; }
  .ar-controls { 
    display: flex; 
    gap: 10px; 
    justify-content: center; 
    margin: 10px 0;
    flex-wrap: wrap;
  }
  .ar-landmarks, .ar-scenes, .ar-shares { 
    background: #f5f5f5; 
    padding: 20px; 
    border-radius: 12px; 
    margin: 15px 0;
  }
  .ar-landmarks h4, .ar-scenes h4, .ar-shares h4 { margin: 0 0 15px 0; color: #333; }
  .ar-scene-container { position: relative; width: 100%; }
  #ar-video { width: 100%; height: auto; border-radius: 10px; }
  #ar-canvas { display: none; }
  .ar-overlay { 
    position: absolute; 
    top: 0; 
    left: 0; 
    right: 0; 
    bottom: 0; 
    pointer-events: none;
  }
  .ar-overlay .ar-element { pointer-events: auto; }
  @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  .btn { 
    padding: 10px 20px; 
    border: none; 
    border-radius: 8px; 
    cursor: pointer; 
    font-weight: 500;
    transition: background 0.3s;
  }
  .btn-primary { background: #4CAF50; color: white; }
  .btn-primary:hover { background: #388E3C; }
  .btn-secondary { background: #FF9800; color: white; }
  .btn-secondary:hover { background: #F57C00; }
  .btn-info { background: #2196F3; color: white; }
  .btn-info:hover { background: #1976D2; }
  .btn-danger { background: #f44336; color: white; }
  .btn-danger:hover { background: #d32f2f; }
  .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: none; justify-content: center; align-items: center; z-index: 99999; }
  .modal-content { background: white; padding: 20px; border-radius: 15px; max-width: 95%; width: 100%; max-height: 90vh; overflow-y: auto; position: relative; }
  .modal-close { position: absolute; top: 15px; right: 20px; font-size: 28px; cursor: pointer; color: #999; z-index: 1; }
  .ar-info-panel { 
    background: white;
    padding: 20px;
    border-radius: 10px;
    margin-top: 15px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    display: none;
  }
  .ar-info-panel h4 { margin: 0 0 10px 0; }
  .landmark-item:hover, .scene-item:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0,0,0,0.15) !important; }
  .landmark-item, .scene-item { transition: transform 0.3s, box-shadow 0.3s; }
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @media (max-width: 768px) {
    .ar-header { flex-direction: column; align-items: stretch; }
    .ar-actions { justify-content: stretch; }
    .ar-actions .btn { flex: 1; }
    .ar-viewport { min-height: 200px; }
  }
`;
document.head.appendChild(style);