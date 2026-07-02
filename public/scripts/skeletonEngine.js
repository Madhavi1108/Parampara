/**
 * Skeleton Screen UI Engine - Advanced Framework
 * Dynamically generates, manages, and optimizes animated placeholder layouts.
 * Features:
 * - IntersectionObserver based performance optimizations
 * - Staggered animation sequencing
 * - Accessibility (a11y) ARIA management
 * - Progressive image loading hooks
 * - Extensible template library
 */
class SkeletonEngine {
  constructor() {
    this.templates = {
      card: this.createCardSkeleton.bind(this),
      list: this.createListSkeleton.bind(this),
      profile: this.createProfileSkeleton.bind(this),
      timeline: this.createTimelineSkeleton.bind(this),
      chat: this.createChatSkeleton.bind(this),
      dashboard: this.createDashboardWidgetSkeleton.bind(this),
      text: this.createTextSkeleton.bind(this)
    };

    this.activeSkeletons = new Map(); // Maps container elements to their observer data
    
    // Performance: Pause animations when off-screen
    this.initIntersectionObserver();
  }

  /**
   * Initializes the Intersection Observer for performance optimization
   */
  initIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;
    
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('skeleton-paused');
        } else {
          entry.target.classList.add('skeleton-paused');
        }
      });
    }, {
      rootMargin: '100px 0px',
      threshold: 0.1
    });
  }

  /**
   * Displays skeletons inside a given container
   * @param {HTMLElement} container - The DOM element to append skeletons to
   * @param {string} type - 'card', 'list', 'profile', 'timeline', 'chat', 'dashboard', 'text'
   * @param {number} count - Number of skeletons to render
   * @param {boolean|object} options - Options object (or boolean for backwards compat 'append')
   */
  show(container, type = 'card', count = 1, options = {}) {
    if (!container) return;
    
    // Backwards compatibility with previous boolean `append` signature
    if (typeof options === 'boolean') {
      options = { append: options };
    }
    
    const config = Object.assign({
      append: false,
      stagger: true,
      staggerDelay: 100, // ms
      animation: 'shimmer', // 'shimmer', 'pulse', 'wave'
      a11yLabel: 'Loading content, please wait...'
    }, options);
    
    let html = '';
    const generator = this.templates[type] || this.templates.card;
    
    for (let i = 0; i < count; i++) {
      // Add staggered delay classes if enabled
      let delayClass = '';
      if (config.stagger) {
        const delayIndex = (i % 5) + 1; // max 5 delay classes (0.1s to 0.5s)
        delayClass = `skeleton-delay-${delayIndex}`;
      }
      
      const skeletonHtml = generator();
      // Inject delay class and animation variant into the root wrapper of the generated template
      html += skeletonHtml.replace(/class="([^"]*)"/, `class="$1 ${delayClass} anim-${config.animation}"`);
    }
    
    const wrapper = document.createElement('div');
    wrapper.className = 'skeleton-container skeleton-active';
    wrapper.setAttribute('aria-busy', 'true');
    wrapper.setAttribute('aria-live', 'polite');
    wrapper.innerHTML = `
      <span class="sr-only">${config.a11yLabel}</span>
      ${html}
    `;

    if (config.append) {
      container.appendChild(wrapper);
    } else {
      container.innerHTML = '';
      container.appendChild(wrapper);
    }

    // Register with observer
    if (this.observer) {
      const children = wrapper.querySelectorAll('.skeleton-root-element');
      children.forEach(child => this.observer.observe(child));
    }
    
    this.activeSkeletons.set(container, wrapper);
  }

  /**
   * Hide and remove all skeletons from a container
   * @param {HTMLElement} container - The DOM element containing skeletons
   */
  hide(container) {
    if (!container) return;
    
    // Clean up observer
    if (this.observer) {
      const activeSkeletons = container.querySelectorAll('.skeleton-root-element');
      activeSkeletons.forEach(child => this.observer.unobserve(child));
    }
    
    const skeletons = container.querySelectorAll('.skeleton-active, .skeleton-card, .skeleton-list-item, .skeleton-root-element');
    skeletons.forEach(el => el.remove());
    
    // Remove aria-busy state if we added it to container
    container.removeAttribute('aria-busy');
    this.activeSkeletons.delete(container);
  }

  /**
   * Progressive Image Loading Hook
   * Replaces a skeleton element with an image smoothly once loaded
   * @param {HTMLElement} skeletonElement - The skeleton placeholder
   * @param {string} src - The high-res image URL
   * @param {string} lowResSrc - Optional low-res blur image
   */
  progressiveImageLoad(skeletonElement, src, lowResSrc = null) {
    if (!skeletonElement) return;
    
    if (lowResSrc) {
      skeletonElement.style.backgroundImage = `url(${lowResSrc})`;
      skeletonElement.style.backgroundSize = 'cover';
      skeletonElement.style.filter = 'blur(10px)';
    }

    const img = new Image();
    img.onload = () => {
      skeletonElement.classList.add('skeleton-image-loaded');
      setTimeout(() => {
        skeletonElement.style.backgroundImage = `url(${src})`;
        skeletonElement.style.filter = 'none';
        skeletonElement.classList.remove('skeleton'); // Remove shimmer
      }, 300); // transition duration
    };
    img.src = src;
  }

  /* =========================================================================
     TEMPLATES 
     (Each must have .skeleton-root-element on its top-level element)
  ========================================================================= */

  createCardSkeleton() {
    return `
      <div class="skeleton-card skeleton-root-element" aria-hidden="true">
        <div class="skeleton skeleton-card-img"></div>
        <div class="skeleton-card-body">
          <div class="skeleton skeleton-text badge"></div>
          <div class="skeleton skeleton-text short" style="margin-bottom: 0.25rem;"></div>
          <div class="skeleton skeleton-text title"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text short"></div>
          <div class="skeleton-text tags">
            <div class="skeleton skeleton-tag"></div>
            <div class="skeleton skeleton-tag"></div>
          </div>
        </div>
      </div>
    `;
  }

  createListSkeleton() {
    return `
      <div class="skeleton-list-item skeleton-root-element" aria-hidden="true">
        <div class="skeleton skeleton-list-img"></div>
        <div class="skeleton-list-content">
          <div class="skeleton skeleton-text title" style="margin-bottom:0;"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text short"></div>
        </div>
      </div>
    `;
  }
  
  createProfileSkeleton() {
    return `
      <div class="skeleton-profile skeleton-root-element" aria-hidden="true">
        <div class="skeleton skeleton-avatar"></div>
        <div class="skeleton-profile-info">
          <div class="skeleton skeleton-text title"></div>
          <div class="skeleton skeleton-text short"></div>
          <div class="skeleton-profile-stats">
             <div class="skeleton skeleton-stat-box"></div>
             <div class="skeleton skeleton-stat-box"></div>
             <div class="skeleton skeleton-stat-box"></div>
          </div>
        </div>
      </div>
    `;
  }

  createTimelineSkeleton() {
    return `
      <div class="skeleton-timeline-event skeleton-root-element" aria-hidden="true">
        <div class="skeleton-timeline-dot skeleton"></div>
        <div class="skeleton-timeline-content">
          <div class="skeleton skeleton-text badge"></div>
          <div class="skeleton skeleton-text title"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
        </div>
      </div>
    `;
  }

  createChatSkeleton() {
    return `
      <div class="skeleton-chat-bubble skeleton-root-element" aria-hidden="true">
        <div class="skeleton skeleton-avatar-small"></div>
        <div class="skeleton-chat-content">
          <div class="skeleton skeleton-text" style="width: 80%"></div>
          <div class="skeleton skeleton-text" style="width: 60%"></div>
          <div class="skeleton skeleton-text" style="width: 40%"></div>
        </div>
      </div>
    `;
  }
  
  createDashboardWidgetSkeleton() {
    return `
      <div class="skeleton-widget skeleton-root-element" aria-hidden="true">
        <div class="skeleton-widget-header">
           <div class="skeleton skeleton-icon"></div>
           <div class="skeleton skeleton-text title"></div>
        </div>
        <div class="skeleton skeleton-graph"></div>
        <div class="skeleton-widget-footer">
           <div class="skeleton skeleton-text short"></div>
        </div>
      </div>
    `;
  }

  createTextSkeleton() {
    return `
      <div class="skeleton-text-block skeleton-root-element" aria-hidden="true">
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>
    `;
  }
}

// Export as a global singleton to be used across the app
window.SkeletonEngine = new SkeletonEngine();
