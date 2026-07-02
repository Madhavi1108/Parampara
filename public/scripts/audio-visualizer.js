/**
 * Client-Side Audio Waveform Engine
 * Analyzes audio data and renders an interactive waveform using the Web Audio API.
 * Supports seeking, real-time playback progress, and responsive rendering.
 */

class WaveformEngine {
  constructor(audioElement) {
    this.audioElement = audioElement;
    
    // Prevent CORS issues when fetching external audio
    if (!this.audioElement.crossOrigin) {
      this.audioElement.crossOrigin = "anonymous";
    }

    // UI Setup
    this.canvas = document.createElement("canvas");
    this.canvas.classList.add("audio-waveform-canvas");
    
    // High-res canvas mapping
    this.canvas.width = 1200; 
    this.canvas.height = 150;
    
    // Responsive styling
    this.canvas.style.width = "100%";
    this.canvas.style.height = "80px";
    this.canvas.style.display = "block";
    this.canvas.style.marginTop = "12px";
    this.canvas.style.borderRadius = "12px";
    this.canvas.style.background = "var(--surface-color, rgba(0,0,0,0.03))";
    this.canvas.style.boxShadow = "inset 0 2px 5px rgba(0,0,0,0.05)";
    this.canvas.style.cursor = "pointer";
    this.canvas.style.transition = "transform 0.2s ease";

    if (this.audioElement.parentNode) {
      this.audioElement.parentNode.insertBefore(this.canvas, this.audioElement.nextSibling);
    }

    this.ctx = this.canvas.getContext("2d");
    this.peaks = null;
    this.isDecoding = false;
    this.errorMsg = null;
    this.hoverRatio = null;
    
    // Config
    this.numBars = 150;

    this.bindEvents();
    
    // If the audio source is already set, load immediately
    if (this.audioElement.src) {
      this.loadAudioData();
    }
  }

  /**
   * Fetches audio file and decodes it using Web Audio API to extract peaks
   */
  async loadAudioData() {
    const src = this.audioElement.src || this.audioElement.currentSrc;
    if (!src || src.startsWith("blob:") || src.startsWith("data:")) {
      // For local blob/data URLs we can try decoding if fetch supports it, 
      // but if not, fallback gracefully
      if(!src) return;
    }

    this.isDecoding = true;
    this.errorMsg = null;
    this.drawLoading();

    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error("Network response was not ok");
      const arrayBuffer = await response.arrayBuffer();
      
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      
      this.peaks = this.extractPeaks(audioBuffer, this.numBars);
      this.isDecoding = false;
      this.draw();
    } catch (err) {
      console.error("Error generating waveform:", err);
      this.errorMsg = "Waveform unavailable";
      this.isDecoding = false;
      this.drawError();
    }
  }

  /**
   * Compresses the raw audio samples into a manageable number of peaks for rendering
   */
  extractPeaks(audioBuffer, numPeaks) {
    const channelData = audioBuffer.getChannelData(0); // Mono downmix effectively for visualization
    const peaks = [];
    const step = Math.floor(channelData.length / numPeaks);
    
    for (let i = 0; i < numPeaks; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = channelData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      peaks.push(Math.max(Math.abs(min), Math.abs(max)));
    }
    return peaks;
  }

  drawLoading() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "var(--text-muted, #888)";
    this.ctx.font = "24px 'Inter', sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("Generating Waveform...", this.canvas.width / 2, this.canvas.height / 2);
  }

  drawError() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "var(--text-muted, #888)";
    this.ctx.font = "24px 'Inter', sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(this.errorMsg || "Error loading visualization", this.canvas.width / 2, this.canvas.height / 2);
  }

  formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  draw() {
    if (this.isDecoding) return;
    if (!this.peaks) {
      if (this.errorMsg) this.drawError();
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const progress = this.audioElement.duration ? this.audioElement.currentTime / this.audioElement.duration : 0;
    const barWidth = this.canvas.width / this.peaks.length;
    
    // Dynamic Gradient for played portion
    const playedGradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
    playedGradient.addColorStop(0, "var(--terracotta, #d2691e)");
    playedGradient.addColorStop(1, "var(--mustard, #daa520)");
    const playedColor = playedGradient;
    
    // Breathing animation based on system time
    const timeSec = Date.now() / 1000;
    const breath = (Math.sin(timeSec * 3) + 1) / 2; // oscillates 0 to 1
    const unplayedBaseOpacity = 0.25 + (breath * 0.15); 
    const unplayedColor = `rgba(150, 150, 150, ${unplayedBaseOpacity})`;
    
    // Draw Waveform Bars
    for (let i = 0; i < this.peaks.length; i++) {
      const peak = this.peaks[i];
      // Boost small peaks slightly for better visual representation
      const normalizedPeak = Math.pow(peak, 0.8);
      const barHeight = Math.max(normalizedPeak * this.canvas.height * 0.7, 4); // Min 4px height
      
      const x = i * barWidth;
      const y = (this.canvas.height - barHeight) / 2; // Center vertically

      if (i / this.peaks.length <= progress) {
        this.ctx.fillStyle = playedColor;
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = "rgba(210, 105, 30, 0.5)";
      } else {
        this.ctx.fillStyle = unplayedColor;
        this.ctx.shadowBlur = 0;
      }

      this.ctx.beginPath();
      if (this.ctx.roundRect) {
        this.ctx.roundRect(x + 2, y, barWidth - 4, barHeight, 4);
      } else {
        this.ctx.rect(x + 2, y, barWidth - 4, barHeight);
      }
      this.ctx.fill();
    }
    this.ctx.shadowBlur = 0; // Reset shadow for remaining elements
    
    // Draw Progress Head Line
    const headX = progress * this.canvas.width;
    this.ctx.fillStyle = "#ffffff";
    this.ctx.shadowBlur = 8;
    this.ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
    this.ctx.fillRect(headX - 1, 0, 3, this.canvas.height);
    this.ctx.shadowBlur = 0; // reset
    
    // Draw Time Timestamps
    const curTime = this.formatTime(this.audioElement.currentTime);
    const durTime = this.formatTime(this.audioElement.duration);
    
    this.ctx.font = "bold 14px 'Inter', sans-serif";
    
    // Draw pill background for current time
    const curTimeWidth = this.ctx.measureText(curTime).width;
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    this.ctx.beginPath();
    if (this.ctx.roundRect) {
      this.ctx.roundRect(8, 8, curTimeWidth + 16, 28, 14);
    } else {
      this.ctx.rect(8, 8, curTimeWidth + 16, 28);
    }
    this.ctx.fill();
    
    // Draw text for current time
    this.ctx.fillStyle = "#ffffff";
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(curTime, 16, 22);
    
    // Draw pill background for duration time
    const durTimeWidth = this.ctx.measureText(durTime).width;
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    this.ctx.beginPath();
    if (this.ctx.roundRect) {
      this.ctx.roundRect(this.canvas.width - durTimeWidth - 24, 8, durTimeWidth + 16, 28, 14);
    } else {
      this.ctx.rect(this.canvas.width - durTimeWidth - 24, 8, durTimeWidth + 16, 28);
    }
    this.ctx.fill();
    
    // Draw text for duration time
    this.ctx.fillStyle = "#ffffff";
    this.ctx.textAlign = "right";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(durTime, this.canvas.width - 16, 22);

    // Hover Preview
    if (this.hoverRatio !== null && this.audioElement.duration) {
      const hoverX = this.hoverRatio * this.canvas.width;
      const hoverTimeSec = this.hoverRatio * this.audioElement.duration;
      const hoverTimeStr = this.formatTime(hoverTimeSec);
      
      // Draw subtle vertical line
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      this.ctx.fillRect(hoverX, 0, 1, this.canvas.height);
      
      // Draw hover tooltip
      this.ctx.font = "bold 12px 'Inter', sans-serif";
      const ttWidth = this.ctx.measureText(hoverTimeStr).width;
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      this.ctx.beginPath();
      if (this.ctx.roundRect) {
        this.ctx.roundRect(hoverX - (ttWidth/2) - 8, 4, ttWidth + 16, 22, 11);
      } else {
        this.ctx.rect(hoverX - (ttWidth/2) - 8, 4, ttWidth + 16, 22);
      }
      this.ctx.fill();
      
      this.ctx.fillStyle = "#ffffff";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(hoverTimeStr, hoverX, 15);
    }


    // Continue rendering if playing
    if (!this.audioElement.paused && !this.audioElement.ended) {
      requestAnimationFrame(() => this.draw());
    }
  }

  bindEvents() {
    // Media events
    this.audioElement.addEventListener("play", () => {
      // Re-trigger animation frame loop
      requestAnimationFrame(() => this.draw());
    });
    
    this.audioElement.addEventListener("timeupdate", () => this.draw());
    
    this.audioElement.addEventListener("loadedmetadata", () => {
      // Reload waveform if src changed and we haven't decoded yet
      if (!this.peaks && !this.isDecoding) {
        this.loadAudioData();
      }
    });

    // Interaction Events
    let isDragging = false;
    
    const getRatioFromMouse = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      let x = e.clientX - rect.left;
      return Math.max(0, Math.min(x, rect.width)) / rect.width;
    };

    const updateTimeFromMouse = (e) => {
      if (!this.audioElement.duration) return;
      const clickRatio = getRatioFromMouse(e);
      this.audioElement.currentTime = clickRatio * this.audioElement.duration;
      this.draw();
    };

    this.canvas.addEventListener("mousedown", (e) => {
      isDragging = true;
      updateTimeFromMouse(e);
    });

    this.canvas.addEventListener("mousemove", (e) => {
      if (this.audioElement.duration) {
        this.hoverRatio = getRatioFromMouse(e);
        if (this.audioElement.paused) requestAnimationFrame(() => this.draw());
      }
    });

    this.canvas.addEventListener("mouseleave", () => {
      this.hoverRatio = null;
      if (this.audioElement.paused) requestAnimationFrame(() => this.draw());
    });

    window.addEventListener("mousemove", (e) => {
      if (isDragging) updateTimeFromMouse(e);
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
    });

    // Resize event for responsiveness
    window.addEventListener("resize", () => {
      // Re-draw on resize to keep visuals crisp
      requestAnimationFrame(() => this.draw());
    });
  }
}

// Attach globally for dynamic integrations (e.g., in paths.js)
window.setupAudioVisualizer = function(audioElement) {
  if (audioElement.dataset.visualizerInit === "true") return;
  audioElement.dataset.visualizerInit = "true";
  new WaveformEngine(audioElement);
};
