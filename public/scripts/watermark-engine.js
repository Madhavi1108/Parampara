/**
 * WatermarkEngine - Advanced HTML5 Canvas Image Processing
 * Features: High-performance rendering, EXIF metadata preservation, 
 * Dynamic Tiling, and Aspect-Ratio aware watermarking.
 */
class WatermarkEngine {
  constructor(options = {}) {
    this.text = options.text || '© Parampara Digital Archive';
    this.opacity = options.opacity || 0.4;
    this.fontSize = options.fontSize || 48;
    this.tiled = options.tiled || false;
    this.quality = options.quality || 0.9;
    
    // Internal state
    this.originalImage = null;
    this.originalExif = null;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  /**
   * Loads a file, extracts EXIF metadata, and prepares the image for canvas drawing.
   */
  async loadImage(file) {
    if (!file.type.startsWith('image/')) {
      throw new Error('Unsupported file format. Please upload an image.');
    }
    
    // Extract EXIF data if JPEG
    if (file.type === 'image/jpeg') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        this.originalExif = this.extractEXIF(arrayBuffer);
      } catch (err) {
        console.warn('[WatermarkEngine] Failed to extract EXIF data:', err);
      }
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          this.originalImage = img;
          resolve(img);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Applies the watermark based on the current configuration.
   * Returns a base64 Data URL of the preview image.
   */
  applyWatermark() {
    if (!this.originalImage) throw new Error('No image loaded.');

    const width = this.originalImage.width;
    const height = this.originalImage.height;
    
    this.canvas.width = width;
    this.canvas.height = height;

    // Draw original image
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.drawImage(this.originalImage, 0, 0, width, height);

    // Setup Text styling
    this.ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    
    // Scale font size based on image dimensions
    const scaleFactor = Math.max(width, height) / 1000;
    const adjustedFontSize = Math.max(16, this.fontSize * scaleFactor);
    this.ctx.font = `bold ${adjustedFontSize}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Shadow for contrast
    this.ctx.shadowColor = `rgba(0, 0, 0, ${this.opacity * 1.5})`;
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;

    if (this.tiled) {
      this.drawTiledWatermark(width, height, adjustedFontSize);
    } else {
      this.drawSingleWatermark(width, height);
    }

    // Return the preview data URL
    return this.canvas.toDataURL('image/jpeg', this.quality);
  }

  drawSingleWatermark(width, height) {
    this.ctx.translate(width / 2, height / 2);
    // Slight diagonal tilt for central watermark
    this.ctx.rotate(-Math.PI / 6);
    this.ctx.fillText(this.text, 0, 0);
    // Reset transform
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  drawTiledWatermark(width, height, fontSize) {
    const textMetrics = this.ctx.measureText(this.text);
    const textWidth = textMetrics.width;
    
    const spacingX = textWidth * 1.5;
    const spacingY = fontSize * 3;
    
    this.ctx.rotate(-Math.PI / 8);

    // Since we rotated, we need to extend the drawing loop bounds significantly
    const diagonal = Math.sqrt(width * width + height * height);
    
    for (let x = -diagonal; x < diagonal; x += spacingX) {
      for (let y = -diagonal; y < diagonal; y += spacingY) {
        this.ctx.fillText(this.text, x, y);
      }
    }
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /**
   * Generates the final Blob for upload.
   * If the original was a JPEG, it re-injects the EXIF APP1 segment.
   */
  async exportBlob() {
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        
        if (this.originalExif && blob.type === 'image/jpeg') {
          // Re-inject EXIF async
          const reader = new FileReader();
          reader.onload = () => {
            const newArrayBuffer = reader.result;
            const finalBuffer = this.injectEXIF(newArrayBuffer, this.originalExif);
            resolve(new Blob([finalBuffer], { type: 'image/jpeg' }));
          };
          reader.readAsArrayBuffer(blob);
        } else {
          resolve(blob);
        }
      }, 'image/jpeg', this.quality);
    });
  }

  // ==========================================
  // ADVANCED BINARY METADATA PROCESSING (EXIF)
  // ==========================================

  /**
   * Parses the JPEG binary structure to extract the APP1 (EXIF) segment.
   * A true production-ready archive requires metadata preservation.
   */
  extractEXIF(buffer) {
    const view = new DataView(buffer);
    if (view.getUint16(0, false) !== 0xFFD8) {
      return null; // Not a valid JPEG
    }
    
    let offset = 2;
    const length = view.byteLength;
    let marker;

    while (offset < length) {
      marker = view.getUint16(offset, false);
      if (marker === 0xFFE1) { // APP1 Marker
        const size = view.getUint16(offset + 2, false);
        // Is it EXIF?
        if (view.getUint32(offset + 4, false) === 0x45786966) { 
          // Extract the exact APP1 segment
          return buffer.slice(offset, offset + 2 + size);
        }
      }
      
      // Stop at SOS (Start of Stream)
      if (marker === 0xFFDA) break;
      
      // Move to next segment
      offset += 2 + view.getUint16(offset + 2, false);
    }
    return null;
  }

  /**
   * Injects a preserved APP1 (EXIF) segment back into a new JPEG binary.
   */
  injectEXIF(newBuffer, exifSegment) {
    const view = new DataView(newBuffer);
    if (view.getUint16(0, false) !== 0xFFD8) return newBuffer;

    let offset = 2;
    let app0Offset = 2;
    let hasApp0 = false;
    
    const marker = view.getUint16(offset, false);
    if (marker === 0xFFE0) {
      hasApp0 = true;
      app0Offset = offset + 2 + view.getUint16(offset + 2, false);
    }

    // Splice the EXIF segment after SOI (and APP0 if present)
    const insertPoint = hasApp0 ? app0Offset : 2;
    
    const finalLength = newBuffer.byteLength + exifSegment.byteLength;
    const finalBuffer = new Uint8Array(finalLength);
    
    const newBytes = new Uint8Array(newBuffer);
    const exifBytes = new Uint8Array(exifSegment);

    finalBuffer.set(newBytes.slice(0, insertPoint), 0);
    finalBuffer.set(exifBytes, insertPoint);
    finalBuffer.set(newBytes.slice(insertPoint), insertPoint + exifBytes.length);

    return finalBuffer.buffer;
  }
}

// Global Export
window.WatermarkEngine = WatermarkEngine;
