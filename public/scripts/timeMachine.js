/**
 * TimeMachineEngine
 * A highly reusable vanilla JS component that renders a chronological slider
 * and emits events to synchronize map markers, gallery items, etc.
 */

class TimeMachineEngine {
  constructor(options = {}) {
    this.containerId = options.containerId;
    this.eras = options.eras || ['All', '1950', '1980', '2000', '2025'];
    this.initialEraIndex = options.initialEraIndex !== undefined ? options.initialEraIndex : 0;
    this.currentEraIndex = this.initialEraIndex;
    
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.warn(`TimeMachineEngine: Container #${this.containerId} not found.`);
      return;
    }

    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="time-machine-wrapper" aria-label="Time Machine Historical Slider">
        <div class="time-machine-header">
          <div class="time-machine-title">
            <i class="ti ti-history"></i>
            Time Machine
          </div>
          <div class="time-machine-active-era" id="tm-active-era-${this.containerId}">
            ${this.eras[this.currentEraIndex]}
          </div>
        </div>
        <div class="time-machine-slider-container">
          <input 
            type="range" 
            class="time-machine-range" 
            id="tm-range-${this.containerId}" 
            min="0" 
            max="${this.eras.length - 1}" 
            step="1" 
            value="${this.currentEraIndex}"
            aria-valuetext="${this.eras[this.currentEraIndex]}"
          />
          <div class="time-machine-ticks" id="tm-ticks-${this.containerId}">
            ${this.eras.map((era, index) => `
              <span 
                class="time-machine-tick ${index === this.currentEraIndex ? 'active' : ''}" 
                data-index="${index}"
              >
                ${era}
              </span>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const rangeInput = document.getElementById(`tm-range-${this.containerId}`);
    const ticksContainer = document.getElementById(`tm-ticks-${this.containerId}`);
    const activeLabel = document.getElementById(`tm-active-era-${this.containerId}`);
    const wrapper = this.container.querySelector('.time-machine-wrapper');

    if (!rangeInput) return;

    // Handle range slider drag
    rangeInput.addEventListener('input', (e) => {
      this.currentEraIndex = parseInt(e.target.value, 10);
      this.updateUI(activeLabel, ticksContainer, rangeInput);
    });

    // Handle tick clicks
    if (ticksContainer) {
      ticksContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('time-machine-tick')) {
          this.currentEraIndex = parseInt(e.target.dataset.index, 10);
          rangeInput.value = this.currentEraIndex;
          this.updateUI(activeLabel, ticksContainer, rangeInput);
        }
      });
    }

    // Handle touch/mouse interactions for pulsing effect
    rangeInput.addEventListener('mousedown', () => wrapper.classList.add('time-traveling'));
    rangeInput.addEventListener('touchstart', () => wrapper.classList.add('time-traveling'));
    
    // Release
    rangeInput.addEventListener('mouseup', () => {
      wrapper.classList.remove('time-traveling');
      this.emitChange();
    });
    rangeInput.addEventListener('touchend', () => {
      wrapper.classList.remove('time-traveling');
      this.emitChange();
    });
    rangeInput.addEventListener('keyup', (e) => {
      if(e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        this.emitChange();
      }
    });
  }

  updateUI(activeLabel, ticksContainer, rangeInput) {
    const era = this.eras[this.currentEraIndex];
    
    // Update labels
    if (activeLabel) activeLabel.textContent = era;
    if (rangeInput) rangeInput.setAttribute('aria-valuetext', era);

    // Update active tick styling
    if (ticksContainer) {
      const ticks = ticksContainer.querySelectorAll('.time-machine-tick');
      ticks.forEach(tick => tick.classList.remove('active'));
      const activeTick = ticksContainer.querySelector(`.time-machine-tick[data-index="${this.currentEraIndex}"]`);
      if (activeTick) activeTick.classList.add('active');
    }
  }

  emitChange() {
    const era = this.eras[this.currentEraIndex];
    const event = new CustomEvent('parampara:timemachine:change', {
      detail: { era, index: this.currentEraIndex }
    });
    window.dispatchEvent(event);
  }

  getCurrentEra() {
    return this.eras[this.currentEraIndex];
  }
}

window.TimeMachineEngine = TimeMachineEngine;
