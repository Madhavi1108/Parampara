/**
 * Parampara - Reusable Share Utility
 * Handles Web Share API and provides a custom fallback modal.
 */

(function () {
  const ShareManager = {
    share: async function ({ title, text, url }) {
      const shareData = { title, text, url };

      // 1. Try Native Web Share API
      if (navigator.share) {
        try {
          await navigator.share(shareData);
          console.log('Shared successfully via Native API');
          return;
        } catch (err) {
          if (err.name === 'AbortError') {
            console.log('User cancelled native share');
            return; // Don't show fallback if they explicitly cancelled
          }
          console.log('Native share failed, falling back to modal', err);
        }
      }

      // 2. Fallback Modal
      this._showFallbackModal(shareData);
    },

    _showFallbackModal: function ({ title, text, url }) {
      title = title || '';
      text = text || '';
      url = url || window.location.href;

      let modal = document.getElementById('parampara-share-modal');
      
      if (!modal) {
        modal = this._createModalElement();
        document.body.appendChild(modal);
      }

      const encodedUrl = encodeURIComponent(url);
      const encodedTitle = encodeURIComponent(title);
      const encodedText = encodeURIComponent(text);

      // Set hrefs for links
      document.getElementById('share-wa').href = `https://api.whatsapp.com/send?text=${encodedTitle}%0A${encodedUrl}`;
      document.getElementById('share-fb').href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      document.getElementById('share-x').href = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
      document.getElementById('share-email').href = `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`;

      // Set up copy link button
      const copyBtn = document.getElementById('share-copy');
      copyBtn.onclick = () => {
        const handleSuccess = () => {
          const originalText = copyBtn.innerText;
          copyBtn.innerText = 'Copied!';
          setTimeout(() => copyBtn.innerText = originalText, 2000);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(handleSuccess).catch(err => console.error('Copy failed', err));
        } else {
          // Fallback for older browsers / non-https environments
          try {
            const textArea = document.createElement('textarea');
            textArea.value = url;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            textArea.remove();
            handleSuccess();
          } catch (err) {
            console.error('Fallback copy failed', err);
            prompt('Copy this link:', url);
          }
        }
      };

      // Show modal
      modal.classList.add('active');
    },

    _createModalElement: function () {
      const modal = document.createElement('div');
      modal.id = 'parampara-share-modal';
      modal.className = 'modal share-modal';
      
      modal.innerHTML = `
        <div class="modal-content share-modal-content">
          <div class="modal-header">
            <h3>Share this Cultural Heritage</h3>
            <button class="close-btn" id="close-share-modal">×</button>
          </div>
          <div class="share-options">
            <a id="share-wa" target="_blank" class="share-btn-link whatsapp">
              WhatsApp
            </a>
            <a id="share-fb" target="_blank" class="share-btn-link facebook">
              Facebook
            </a>
            <a id="share-x" target="_blank" class="share-btn-link x-twitter">
              X (Twitter)
            </a>
            <a id="share-email" target="_blank" class="share-btn-link email">
              Email
            </a>
            <button id="share-copy" class="share-btn-action copy-link">
              Copy Link
            </button>
          </div>
        </div>
      `;

      // Close handlers
      const closeBtn = modal.querySelector('#close-share-modal');
      closeBtn.onclick = () => modal.classList.remove('active');
      
      modal.onclick = (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      };

      return modal;
    }
  };

  window.ShareManager = ShareManager;
})();
