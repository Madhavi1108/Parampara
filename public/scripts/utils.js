/**
 * Global Utility Functions for Parampara
 */

/**
 * Debounce utility to delay function execution until after a specified wait time
 * has elapsed since the last time the debounced function was invoked.
 * 
 * @param {Function} func The function to debounce.
 * @param {number} wait The number of milliseconds to delay.
 * @returns {Function} The debounced function.
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};


/**
 * WorkerManager utility to handle background tasks using Web Workers
 */
class WorkerManager {
  constructor(workerUrl = 'scripts/dataWorker.js') {
    this.worker = new Worker(workerUrl);
    this.jobIdCounter = 0;
    this.callbacks = new Map();

    this.worker.onmessage = (e) => {
      const { jobId, success, result, error } = e.data;
      if (this.callbacks.has(jobId)) {
        const { resolve, reject } = this.callbacks.get(jobId);
        this.callbacks.delete(jobId);
        if (success) {
          resolve(result);
        } else {
          reject(new Error(error));
        }
      }
    };

    this.worker.onerror = (error) => {
      console.error('Worker error:', error);
    };
  }

  runJob(action, payload) {
    return new Promise((resolve, reject) => {
      const jobId = ++this.jobIdCounter;
      this.callbacks.set(jobId, { resolve, reject });
      this.worker.postMessage({ action, payload, jobId });
    });
  }

  terminate() {
    this.worker.terminate();
    this.callbacks.clear();
  }
}

// Instantiate a global worker manager
window.dataWorker = new WorkerManager();
