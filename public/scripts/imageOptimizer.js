/**
 * ImageOptimizer
 * A client-side utility to resize and compress images before upload.
 */
class ImageOptimizer {
  constructor(options = {}) {
    this.maxWidth = options.maxWidth || 1920;
    this.maxHeight = options.maxHeight || 1080;
    this.presets = {
      high: 0.8,
      medium: 0.6,
      low: 0.4
    };
  }

  /**
   * Compresses an image file and returns a Promise with the base64 string and stats.
   * @param {File} file - The image file to compress.
   * @param {string} qualityPreset - 'high', 'medium', or 'low'.
   * @returns {Promise<Object>} - { dataUrl, originalSize, compressedSize, savingsPercent }
   */
  compressImage(file, qualityPreset = 'medium') {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        return reject(new Error('Invalid file type. Must be an image.'));
      }

      const quality = this.presets[qualityPreset] || this.presets.medium;
      const originalSize = file.size;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Calculate new dimensions keeping aspect ratio
          let width = img.width;
          let height = img.height;

          if (width > this.maxWidth || height > this.maxHeight) {
            const ratio = Math.min(this.maxWidth / width, this.maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // Draw on canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          ctx.drawImage(img, 0, 0, width, height);

          // Get compressed Data URL (prefer webp, fallback to jpeg)
          let mimeType = 'image/webp';
          let dataUrl = canvas.toDataURL(mimeType, quality);
          
          // If browser doesn't support webp, it returns image/png (default), so we force jpeg
          if (!dataUrl.startsWith('data:image/webp')) {
            mimeType = 'image/jpeg';
            dataUrl = canvas.toDataURL(mimeType, quality);
          }

          // Calculate compressed size (approximate from base64 string length)
          const padding = (dataUrl.endsWith("==") ? 2 : (dataUrl.endsWith("=") ? 1 : 0));
          const base64Data = dataUrl.split(',')[1];
          const compressedSize = Math.floor((base64Data.length * 3) / 4) - padding;

          const savingsPercent = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

          resolve({
            dataUrl,
            originalSize,
            compressedSize,
            savingsPercent
          });
        };
        img.onerror = () => reject(new Error('Failed to load image for compression.'));
        img.src = event.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });
  }

  formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }
}

// Export to global scope
window.ImageOptimizer = new ImageOptimizer();
