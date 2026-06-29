/**
 * 360 Panorama Viewer using Three.js
 */

class PanoramaViewer {
  constructor() {
    this.container = null;
    this.modal = null;
    this.camera = null;
    this.scene = null;
    this.renderer = null;
    this.sphere = null;

    this.isDragging = false;
    this.lon = 0;
    this.lat = 0;
    this.phi = 0;
    this.theta = 0;

    this.onPointerDownPointerX = 0;
    this.onPointerDownPointerY = 0;
    this.onPointerDownLon = 0;
    this.onPointerDownLat = 0;

    this.gyroEnabled = false;
    this.animationFrameId = null;

    this.hotspots = [];
    this.hotspotElements = [];

    this.bindEvents = this.bindEvents.bind(this);
    this.animate = this.animate.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
  }

  initDOM() {
    if (document.getElementById('panorama-modal')) return;

    const html = `
      <div id="panorama-modal" class="panorama-modal">
        <div id="panorama-container"></div>
        <div class="panorama-ui">
          <div class="panorama-header">
            <div class="panorama-title-container">
              <h3 id="pano-title">Panorama</h3>
              <p id="pano-location">Location</p>
            </div>
            <button class="panorama-close-btn" id="pano-close" aria-label="Close Viewer">×</button>
          </div>
          
          <div class="panorama-loader" id="pano-loader" style="display: none;">
            <div class="spinner"></div>
            <span>Loading High-Res Panorama...</span>
          </div>

          <div class="panorama-controls">
            <button class="panorama-btn" id="pano-gyro-btn" title="Toggle Gyroscope">
              📱 Gyro
            </button>
            <button class="panorama-btn" id="pano-fullscreen-btn" title="Toggle Fullscreen">
              ⛶ Fullscreen
            </button>
          </div>

          <div class="panorama-compass" id="pano-compass">
            <div class="compass-arrow" id="pano-compass-arrow"></div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    this.modal = document.getElementById('panorama-modal');
    this.container = document.getElementById('panorama-container');

    document.getElementById('pano-close').addEventListener('click', () => this.close());
    document.getElementById('pano-fullscreen-btn').addEventListener('click', () => this.toggleFullscreen());
    document.getElementById('pano-gyro-btn').addEventListener('click', () => this.toggleGyro());
  }

  initThreeJS() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1100);
    this.camera.target = new THREE.Vector3(0, 0, 0);

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1); // Invert sphere

    const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.sphere = new THREE.Mesh(geometry, material);
    this.scene.add(this.sphere);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);
  }

  bindEvents() {
    this.container.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.container.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.container.addEventListener('pointerup', this.onPointerUp.bind(this));
    this.container.addEventListener('pointercancel', this.onPointerUp.bind(this));
    this.container.addEventListener('wheel', this.onDocumentMouseWheel.bind(this));
    
    // Touch zoom (pinch) support could be added here
    
    window.addEventListener('resize', this.onWindowResize);
    
    // Gyroscope
    window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this));
  }

  open(item) {
    if (!this.modal) {
      this.initDOM();
      this.initThreeJS();
      this.bindEvents();
    }

    document.getElementById('pano-title').textContent = item.title;
    document.getElementById('pano-location').textContent = item.location;
    document.getElementById('pano-loader').style.display = 'flex';

    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Reset camera
    this.lon = 0;
    this.lat = 0;
    this.camera.fov = 75;
    this.camera.updateProjectionMatrix();

    // Load texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      item.panoramaUrl || 'https://images.unsplash.com/photo-1557971370-e7298ee473cb?q=80&w=2560&auto=format&fit=crop', // Placeholder equirectangular
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace || THREE.sRGBEncoding;
        this.sphere.material.map = texture;
        this.sphere.material.color.setHex(0xffffff);
        this.sphere.material.needsUpdate = true;
        document.getElementById('pano-loader').style.display = 'none';
        
        // Add hotspots if defined
        this.setupHotspots(item.hotspots || []);
      },
      undefined,
      (err) => {
        console.error('Error loading panorama texture:', err);
        document.getElementById('pano-loader').style.display = 'none';
        alert('Failed to load high-res panorama.');
      }
    );

    this.onWindowResize();
    this.animate();
  }

  close() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Cleanup hotspots
    this.hotspotElements.forEach(el => el.remove());
    this.hotspotElements = [];
    this.hotspots = [];
  }

  setupHotspots(hotspotData) {
    this.hotspotElements.forEach(el => el.remove());
    this.hotspotElements = [];
    this.hotspots = hotspotData;

    this.hotspots.forEach((hs, i) => {
      const el = document.createElement('div');
      el.className = 'panorama-hotspot';
      el.innerHTML = `<div class="hotspot-tooltip">${hs.info}</div>`;
      this.modal.appendChild(el);
      
      this.hotspotElements.push({
        element: el,
        lon: hs.lon,
        lat: hs.lat
      });
    });
  }

  updateHotspots() {
    this.hotspotElements.forEach(hs => {
      // Convert lon/lat to 3D vector
      const phi = THREE.MathUtils.degToRad(90 - hs.lat);
      const theta = THREE.MathUtils.degToRad(hs.lon);
      
      const position = new THREE.Vector3(
        500 * Math.sin(phi) * Math.cos(theta),
        500 * Math.cos(phi),
        500 * Math.sin(phi) * Math.sin(theta)
      );

      // Project 3D vector to 2D screen coordinates
      position.project(this.camera);

      const x = (position.x *  .5 + .5) * window.innerWidth;
      const y = (position.y * -.5 + .5) * window.innerHeight;

      // Only show if in front of camera
      if (position.z < 1) {
        hs.element.style.display = 'block';
        hs.element.style.left = `${x}px`;
        hs.element.style.top = `${y}px`;
      } else {
        hs.element.style.display = 'none';
      }
    });
  }

  onPointerDown(event) {
    this.isDragging = true;
    this.onPointerDownPointerX = event.clientX;
    this.onPointerDownPointerY = event.clientY;
    this.onPointerDownLon = this.lon;
    this.onPointerDownLat = this.lat;
  }

  onPointerMove(event) {
    if (this.isDragging && !this.gyroEnabled) {
      this.lon = (this.onPointerDownPointerX - event.clientX) * 0.1 + this.onPointerDownLon;
      this.lat = (event.clientY - this.onPointerDownPointerY) * 0.1 + this.onPointerDownLat;
    }
  }

  onPointerUp() {
    this.isDragging = false;
  }

  onDocumentMouseWheel(event) {
    const fov = this.camera.fov + event.deltaY * 0.05;
    this.camera.fov = THREE.MathUtils.clamp(fov, 30, 100);
    this.camera.updateProjectionMatrix();
  }

  handleDeviceOrientation(event) {
    if (!this.gyroEnabled || !event.alpha || !event.beta || !event.gamma) return;
    
    // Simplified gyro tracking (for a robust one, DeviceOrientationControls from three.js examples is better,
    // but we can map alpha/beta roughly for this demo)
    // Beta is front/back tilt (-180 to 180) -> Maps to latitude
    // Alpha is compass direction (0 to 360) -> Maps to longitude
    
    let alpha = event.alpha;
    if (window.orientation === 90) {
      alpha += 90;
    } else if (window.orientation === -90) {
      alpha -= 90;
    }
    
    this.lon = alpha;
    this.lat = event.beta - 90; 
  }

  toggleGyro() {
    this.gyroEnabled = !this.gyroEnabled;
    const btn = document.getElementById('pano-gyro-btn');
    if (this.gyroEnabled) {
      btn.style.background = '#3b82f6';
      
      // Request permission for iOS 13+ devices
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(permissionState => {
            if (permissionState !== 'granted') {
              this.gyroEnabled = false;
              btn.style.background = '';
              alert('Gyroscope permission denied.');
            }
          })
          .catch(console.error);
      }
    } else {
      btn.style.background = '';
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.modal.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);

    if (!this.gyroEnabled) {
      // Auto-rotation can be added here if !this.isDragging
      // this.lon += 0.05;
    }

    this.lat = Math.max(-85, Math.min(85, this.lat));
    
    this.phi = THREE.MathUtils.degToRad(90 - this.lat);
    this.theta = THREE.MathUtils.degToRad(this.lon);

    const targetX = 500 * Math.sin(this.phi) * Math.cos(this.theta);
    const targetY = 500 * Math.cos(this.phi);
    const targetZ = 500 * Math.sin(this.phi) * Math.sin(this.theta);

    this.camera.lookAt(targetX, targetY, targetZ);
    this.renderer.render(this.scene, this.camera);

    // Update compass arrow rotation
    const arrow = document.getElementById('pano-compass-arrow');
    if (arrow) {
      // Compass needle points North. We map it to lon.
      arrow.style.transform = `rotate(${this.lon}deg)`;
    }

    // Update hotspot positions
    if (this.hotspots.length > 0) {
      this.updateHotspots();
    }
  }
}

// Global instance
window.panoramaViewer = new PanoramaViewer();
