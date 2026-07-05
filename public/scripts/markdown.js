class ParamparaMarkdown {
  static parse(text, inline = false) {
    if (!text) return '';
    let html = text;

    // --- 1. Parampara Custom Extensions ---
    
    // Heritage note
    html = html.replace(/\[heritage-note\]([\s\S]*?)\[\/heritage-note\]/gi, (match, content) => {
      return `<div class="heritage-note"><strong>Heritage Note:</strong><div class="heritage-note-content">${content.trim()}</div></div>`;
    });
    
    // FAQ
    html = html.replace(/\[faq:\s*(.+?)\]([\s\S]*?)\[\/faq\]/gi, (match, question, answer) => {
      return `<details class="faq-section"><summary>${question.trim()}</summary><div class="faq-content">${answer.trim()}</div></details>`;
    });
    
    // Audio
    html = html.replace(/\[audio:\s*([^\]]+)\]/gi, (match, url) => {
      return `<div class="custom-audio"><audio controls src="${url.trim()}"></audio></div>`;
    });
    
    // Location
    html = html.replace(/\[location:\s*([^,]+),\s*([^\]]+)\]/gi, (match, lat, lng) => {
      lat = lat.trim();
      lng = lng.trim();
      return `<div class="location-card">🗺️ <strong>Location:</strong> <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" rel="noopener noreferrer">${lat}, ${lng}</a></div>`;
    });
    
    // Gallery
    html = html.replace(/\[gallery:\s*([^\]]+)\]/gi, (match, imagesStr) => {
      const images = imagesStr.split(',').map(i => i.trim()).filter(i => i);
      const imgsHtml = images.map(src => `<img src="${src}" alt="Gallery Image" class="inline-gallery-img">`).join('');
      return `<div class="inline-gallery">${imgsHtml}</div>`;
    });

    // --- 2. Standard Markdown ---
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
      return `<pre><code>${this.escapeHTML(code)}</code></pre>`;
    });
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, (match, code) => {
      return `<code>${this.escapeHTML(code)}</code>`;
    });
    
    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    
    // Links (Standard Markdown)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Auto-link detection (basic, avoiding inside HTML tags)
    html = html.replace(/(^|\s)(https?:\/\/[^\s<>]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
    
    // Bold & Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

    if (inline) {
      return html.replace(/\n/g, '<br>');
    }

    // Blockquotes
    html = html.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>');
    
    // Headings
    html = html.replace(/^(#{1,6})\s+(.*)$/gm, (match, hashes, content) => {
      const level = hashes.length;
      return `<h${level}>${content}</h${level}>`;
    });

    // Lists
    // Unordered
    html = html.replace(/^(?:-|\*)\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    
    // Ordered
    html = html.replace(/^\d+\.\s+(.*)$/gm, '<li class="ordered">$1</li>');
    html = html.replace(/(<li class="ordered">.*<\/li>\n?)+/g, '<ol>$&</ol>');

    // Tables
    html = html.replace(/((?:\|.*\|\n?)+)/g, (match) => {
      const rows = match.trim().split('\n');
      if (rows.length < 2) return match; // Not a valid table
      
      let tableHtml = '<table class="markdown-table">\n';
      let isTable = false;
      rows.forEach((row, index) => {
        if (row.match(/^\|[-\s:]+\|[-\s:|]*$/)) {
            isTable = true;
            return;
        }
        
        const cells = row.split('|').map(c => c.trim()).filter((c, i, arr) => {
          return !(c === '' && (i === 0 || i === arr.length - 1));
        });
        
        if (cells.length === 0) return;

        tableHtml += '<tr>';
        cells.forEach(cell => {
          tableHtml += index === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`;
        });
        tableHtml += '</tr>\n';
      });
      tableHtml += '</table>';
      return isTable ? tableHtml : match;
    });

    // Paragraph handling
    const blocks = html.split(/\n\n+/);
    html = blocks.map(block => {
      if (!block.trim()) return '';
      if (block.trim().match(/^(<h|<ul|<ol|<table|<blockquote|<pre|<div|<details)/i)) {
        return block;
      }
      return `<p>${block.trim().replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

    return html;
  }

  static escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

/**
 * Parses Markdown content safely into sanitized HTML.
 * Uses ParamparaMarkdown for parsing and 'DOMPurify' for sanitization.
 */
function renderMarkdown(markdownText, inline = false) {
  if (!markdownText) return '';
  
  let rawHtml = ParamparaMarkdown.parse(markdownText, inline);
  
  if (typeof DOMPurify !== 'undefined') {
    return DOMPurify.sanitize(rawHtml, {
      USE_PROFILES: { html: true },
      ADD_TAGS: ['details', 'summary', 'audio', 'source'],
      ADD_ATTR: ['controls', 'src', 'class', 'target', 'rel']
    });
  } else {
    console.warn('DOMPurify is not loaded. Output is NOT sanitized!');
    return rawHtml;
  }
}

if (typeof window !== 'undefined') {
    if (typeof window.escapeHtml !== 'function') {
      window.escapeHtml = ParamparaMarkdown.escapeHTML;
    }
    window.ParamparaMarkdown = ParamparaMarkdown;
    window.renderMarkdown = renderMarkdown;
} else if (typeof module !== 'undefined') {
    module.exports = { ParamparaMarkdown, renderMarkdown };
}
