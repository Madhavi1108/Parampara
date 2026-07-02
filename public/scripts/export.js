document.addEventListener('DOMContentLoaded', () => {
  const exportForm = document.getElementById('exportForm');
  const exportBtn = document.getElementById('exportBtn');
  const btnText = exportBtn.querySelector('.btn-text');
  const spinner = document.getElementById('exportSpinner');
  const statusDiv = document.getElementById('exportStatus');

  exportForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Gather selected collections
    const checkboxes = document.querySelectorAll('input[name="collections"]:checked');
    const selectedCollections = Array.from(checkboxes).map(cb => cb.value);

    if (selectedCollections.length === 0) {
      showStatus('Please select at least one collection to export.', 'error');
      return;
    }

    // UI Loading state
    exportBtn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'block';
    showStatus('Generating archive... This may take a few moments.', '');

    try {
      // 1. Fetch CSRF token first (since the route uses csrfProtection)
      const csrfResponse = await fetch('/api/csrf-token');
      if (!csrfResponse.ok) throw new Error('Failed to fetch CSRF token');
      const { csrfToken } = await csrfResponse.json();

      // 2. Request the export archive
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ collections: selectedCollections })
      });

      if (!response.ok) {
        throw new Error(`Export failed with status: ${response.status}`);
      }

      // 3. Handle the file download directly in the browser
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Get filename from Content-Disposition if possible, otherwise fallback
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'parampara-archive.zip';
      if (contentDisposition && contentDisposition.includes('filename=')) {
        filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showStatus('✅ Archive successfully downloaded!', 'success');
    } catch (error) {
      console.error('Export Error:', error);
      showStatus('❌ Failed to generate archive. Please try again.', 'error');
    } finally {
      exportBtn.disabled = false;
      btnText.style.display = 'flex';
      spinner.style.display = 'none';
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'export-status';
    if (type === 'error') statusDiv.classList.add('status-error');
    if (type === 'success') statusDiv.classList.add('status-success');
  }
});
