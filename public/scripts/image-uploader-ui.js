/**
 * ImageUploaderUI - Handles the Workspace for Heritage Image Uploads
 */
document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const previewCanvas = document.getElementById('preview-img');
  
  // Controls
  const textInput = document.getElementById('watermark-text');
  const opacitySlider = document.getElementById('watermark-opacity');
  const opacityVal = document.getElementById('opacity-val');
  const tileToggle = document.getElementById('watermark-tiled');
  const downloadBtn = document.getElementById('download-btn');
  const uploadBtn = document.getElementById('upload-btn');
  const workspace = document.getElementById('workspace');

  let currentEngine = null;
  let currentFile = null;

  // Initialize UI Events
  if (!dropZone) return; // Not on the upload page

  dropZone.addEventListener('click', () => fileInput.click());
  
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  // Re-render watermark when controls change
  const reRender = () => {
    if (!currentEngine) return;
    
    currentEngine.text = textInput.value || '© Parampara Digital Archive';
    currentEngine.opacity = parseFloat(opacitySlider.value);
    currentEngine.tiled = tileToggle.checked;
    
    opacityVal.textContent = Math.round(currentEngine.opacity * 100) + '%';
    
    // Process and update preview
    const dataUrl = currentEngine.applyWatermark();
    previewCanvas.src = dataUrl;
  };

  textInput.addEventListener('input', reRender);
  opacitySlider.addEventListener('input', reRender);
  tileToggle.addEventListener('change', reRender);

  async function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }

    currentFile = file;
    currentEngine = new WatermarkEngine({
      text: textInput.value,
      opacity: parseFloat(opacitySlider.value),
      tiled: tileToggle.checked
    });

    try {
      dropZone.querySelector('p').textContent = 'Processing image...';
      await currentEngine.loadImage(file);
      
      workspace.style.display = 'block';
      dropZone.style.display = 'none';
      
      reRender();
    } catch (err) {
      console.error(err);
      alert('Failed to load image.');
      dropZone.querySelector('p').textContent = 'Drag & Drop a Heritage Image or Click to Browse';
    }
  }

  // Handle Download (For offline testing / user archival)
  downloadBtn.addEventListener('click', async () => {
    if (!currentEngine) return;
    const blob = await currentEngine.exportBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watermarked_${currentFile.name}`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Handle Mock Upload to Server
  uploadBtn.addEventListener('click', async () => {
    if (!currentEngine) return;
    uploadBtn.textContent = 'Uploading...';
    uploadBtn.disabled = true;

    try {
      const blob = await currentEngine.exportBlob();
      
      // MOCK UPLOAD LOGIC
      // In a real app, this would be a FormData POST to /api/upload
      const formData = new FormData();
      formData.append('image', blob, currentFile.name);
      
      await new Promise(r => setTimeout(r, 1500)); // simulate network delay
      
      alert('Successfully uploaded watermarked image to the archive!');
      
      // Reset Workspace
      workspace.style.display = 'none';
      dropZone.style.display = 'flex';
      dropZone.querySelector('p').textContent = 'Drag & Drop a Heritage Image or Click to Browse';
      fileInput.value = '';
      currentEngine = null;
      currentFile = null;
    } catch (err) {
      console.error(err);
      alert('Failed to upload image.');
    } finally {
      uploadBtn.textContent = 'Upload to Archive';
      uploadBtn.disabled = false;
    }
  });
});
