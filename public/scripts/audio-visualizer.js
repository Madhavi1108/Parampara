window.setupAudioVisualizer = function(audioElement) {
  // Prevent multiple initializations on the same element
  if (audioElement.dataset.visualizerInit === "true") return;
  audioElement.dataset.visualizerInit = "true";

  // Prevent CORS issues with Web Audio API if loading external audio
  if (!audioElement.crossOrigin) {
    audioElement.crossOrigin = "anonymous";
  }

  // Create canvas for visualizer
  const canvas = document.createElement("canvas");
  canvas.classList.add("audio-visualizer-canvas");
  
  // Set rendering dimensions
  canvas.width = 400;
  canvas.height = 100;
  
  // Basic inline styling (can be overridden by theme.css)
  canvas.style.width = "100%";
  canvas.style.height = "60px";
  canvas.style.display = "block";
  canvas.style.marginTop = "10px";
  canvas.style.borderRadius = "8px";
  canvas.style.background = "var(--surface-color, rgba(0, 0, 0, 0.05))";
  canvas.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.1)";

  // Insert canvas immediately after the audio element
  if (audioElement.parentNode) {
    audioElement.parentNode.insertBefore(canvas, audioElement.nextSibling);
  }

  const canvasCtx = canvas.getContext("2d");
  
  let audioCtx;
  let analyser;
  let source;
  let animationId;
  let dataArray;
  let bufferLength;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn('Web Audio API not supported in this browser.');
        return;
      }
      
      try {
        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        
        // Connect the audio element to the analyser
        source = audioCtx.createMediaElementSource(audioElement);
        source.connect(analyser);
        // Connect the analyser to the destination (speakers)
        analyser.connect(audioCtx.destination);
        
        // Fast Fourier Transform size (determines number of frequency bins)
        analyser.fftSize = 128;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
      } catch (err) {
        console.error('Failed to initialize AudioContext:', err);
      }
    }
    
    // Resume context if it was suspended (autoplay policy)
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function draw() {
    if (!audioCtx || !analyser) return;

    animationId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2;
    let barHeight;
    let x = 0;

    // Get theme primary color
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue('--primary-color').trim() || '#e67e22';

    for (let i = 0; i < bufferLength; i++) {
      // Normalize height to fit canvas
      barHeight = (dataArray[i] / 255) * canvas.height * 0.9;

      canvasCtx.fillStyle = primaryColor;
      
      // Draw bar from bottom up
      // Add a slight gradient-like effect by altering opacity based on height
      canvasCtx.globalAlpha = 0.6 + (barHeight / canvas.height) * 0.4;
      
      // Rounded top effect can be simulated, but for performance, fillRect is best
      canvasCtx.fillRect(
        x, 
        canvas.height - barHeight, 
        barWidth - 2, // gap between bars
        barHeight
      );

      x += barWidth;
    }
    canvasCtx.globalAlpha = 1.0; // reset
  }

  // Bind to audio playback events
  audioElement.addEventListener("play", () => {
    initAudioContext();
    if (audioCtx) draw();
  });

  audioElement.addEventListener("pause", () => {
    cancelAnimationFrame(animationId);
  });

  audioElement.addEventListener("ended", () => {
    cancelAnimationFrame(animationId);
    // Clear canvas when audio finishes
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  });
};
