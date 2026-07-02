// webglLightbox.js
class WebGLLightbox {
  constructor() {
    this.container = document.getElementById('webgl-lightbox');
    this.canvasContainer = document.getElementById('lightbox-canvas-container');
    this.titleEl = document.getElementById('webgl-lightbox-title');
    this.locationEl = document.getElementById('webgl-lightbox-location');
    this.descEl = document.getElementById('webgl-lightbox-desc');
    
    this.closeBtn = document.getElementById('lightbox-close');
    this.nextBtn = document.getElementById('lightbox-next');
    this.prevBtn = document.getElementById('lightbox-prev');
    
    this.items = [];
    this.currentIndex = 0;
    
    this.isOpen = false;
    this.isAnimating = false;
    
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // WebGL properties
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.material = null;
    this.texture1 = null;
    this.texture2 = null;
    this.textureLoader = null;
    
    // Displacement map for ripple/liquid effect
    this.dispImage = 'https://raw.githubusercontent.com/robin-dela/hover-effect/master/images/fluid.jpg';
    
    // Wait for DOM
    document.addEventListener('DOMContentLoaded', () => {
      this.container = document.getElementById('webgl-lightbox');
      if(this.container) {
          this.canvasContainer = document.getElementById('lightbox-canvas-container');
          this.titleEl = document.getElementById('webgl-lightbox-title');
          this.locationEl = document.getElementById('webgl-lightbox-location');
          this.descEl = document.getElementById('webgl-lightbox-desc');
          this.closeBtn = document.getElementById('lightbox-close');
          this.nextBtn = document.getElementById('lightbox-next');
          this.prevBtn = document.getElementById('lightbox-prev');
          this.initEventListeners();
      }
    });
  }
  
  initEventListeners() {
    this.closeBtn.addEventListener('click', () => this.close());
    this.nextBtn.addEventListener('click', () => this.navigate(1));
    this.prevBtn.addEventListener('click', () => this.navigate(-1));
    
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowRight') this.navigate(1);
      if (e.key === 'ArrowLeft') this.navigate(-1);
    });
    
    window.addEventListener('resize', () => {
      if (this.isOpen && this.renderer) {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.material) {
          this.material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
        }
      }
    });
  }
  
  initWebGL() {
    if (this.scene) return; // already initialized
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(
      window.innerWidth / -2, window.innerWidth / 2,
      window.innerHeight / 2, window.innerHeight / -2,
      1, 1000
    );
    this.camera.position.z = 1;
    
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.canvasContainer.innerHTML = '';
    this.canvasContainer.appendChild(this.renderer.domElement);
    
    this.textureLoader = new THREE.TextureLoader();
    this.textureLoader.crossOrigin = 'anonymous';
    
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    const fragmentShader = `
      varying vec2 vUv;
      uniform sampler2D texture1;
      uniform sampler2D texture2;
      uniform sampler2D disp;
      uniform float progress;
      uniform vec2 resolution;
      
      void main() {
        vec4 dispTex = texture2D(disp, vUv);
        
        // Ripple / Displacement logic
        vec2 distortedPosition = vec2(vUv.x, vUv.y + progress * (dispTex.r * 0.8));
        vec2 distortedPosition2 = vec2(vUv.x, vUv.y - (1.0 - progress) * (dispTex.r * 0.8));
        
        vec4 _texture1 = texture2D(texture1, distortedPosition);
        vec4 _texture2 = texture2D(texture2, distortedPosition2);
        
        gl_FragColor = mix(_texture1, _texture2, progress);
      }
    `;
    
    const dispTexture = this.textureLoader.load(this.dispImage);
    dispTexture.wrapS = dispTexture.wrapT = THREE.RepeatWrapping;
    
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        progress: { value: 0.0 },
        texture1: { value: null },
        texture2: { value: null },
        disp: { value: dispTexture },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false
    });
    
    const geometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
    const mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(mesh);
    
    this.animate();
  }
  
  animate() {
    if (!this.isOpen) return;
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }
  
  open(items, startIndex) {
    // Filter items to only those with valid images
    this.items = items.filter(item => item.imageUrl && item.imageUrl.trim() !== '');
    
    if (this.items.length === 0) {
        alert("This item does not have an image.");
        return;
    }

    // Find new start index relative to filtered items
    const originalItem = items[startIndex];
    const newIndex = this.items.findIndex(i => i.id === originalItem.id);
    this.currentIndex = newIndex !== -1 ? newIndex : 0;
    
    this.isOpen = true;
    this.container.style.display = 'block';
    
    this.updateUI();
    
    if (this.prefersReducedMotion || typeof THREE === 'undefined' || typeof gsap === 'undefined') {
      // Fallback CSS fade
      const img = document.createElement('img');
      img.src = this.items[this.currentIndex].imageUrl;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      this.canvasContainer.innerHTML = '';
      this.canvasContainer.appendChild(img);
    } else {
      this.initWebGL();
      
      const currentUrl = this.items[this.currentIndex].imageUrl;
      this.textureLoader.load(currentUrl, (tex) => {
        this.material.uniforms.texture1.value = tex;
        this.material.uniforms.texture2.value = tex;
        this.material.uniforms.progress.value = 0.0;
      });
      this.animate();
    }
  }
  
  close() {
    this.isOpen = false;
    this.container.style.display = 'none';
  }
  
  navigate(direction) {
    if (this.isAnimating) return;
    
    const nextIndex = (this.currentIndex + direction + this.items.length) % this.items.length;
    if (nextIndex === this.currentIndex) return;
    
    const nextItem = this.items[nextIndex];
    
    if (this.prefersReducedMotion || typeof THREE === 'undefined' || typeof gsap === 'undefined') {
      this.currentIndex = nextIndex;
      this.updateUI();
      const img = this.canvasContainer.querySelector('img');
      if (img) img.src = nextItem.imageUrl;
      return;
    }
    
    this.isAnimating = true;
    this.currentIndex = nextIndex;
    this.updateUI();
    
    this.textureLoader.load(nextItem.imageUrl, (nextTex) => {
      this.material.uniforms.texture2.value = nextTex;
      this.material.uniforms.progress.value = 0.0;
      
      gsap.to(this.material.uniforms.progress, {
        value: 1.0,
        duration: 1.2,
        ease: 'power2.inOut',
        onComplete: () => {
          this.material.uniforms.texture1.value = nextTex;
          this.material.uniforms.progress.value = 0.0;
          this.isAnimating = false;
        }
      });
    });
  }
  
  updateUI() {
    const item = this.items[this.currentIndex];
    this.titleEl.textContent = item.title;
    this.locationEl.innerHTML = '📍 ' + item.location;
    if (window.renderMarkdown) {
        this.descEl.innerHTML = window.renderMarkdown(item.description);
    } else {
        this.descEl.textContent = item.description;
    }
  }
}

window.webglLightbox = new WebGLLightbox();
