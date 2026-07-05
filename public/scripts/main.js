// Main JavaScript for Home Page

// Load village posts on page load
document.addEventListener("DOMContentLoaded", async () => {
  initNavbar();

  try {
    await loadVillagePosts();
  } catch (err) {
    console.error("Failed to load village posts:", err);
  }

  try {
    initVillagePostsSSE();
  } catch (err) {
    console.error("Failed to initialize SSE:", err);
  }
});

function initNavbar() {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navFullMenu = document.getElementById("navFullMenu");
  const navOverlay = document.getElementById("navOverlay");

  if (!hamburgerBtn || !navFullMenu || !navOverlay) {
    console.warn("Nav elements not found");
    return;
  }

  function toggleNavMenu(forceOpen) {
    const isOpen =
      forceOpen !== undefined
        ? forceOpen
        : !navFullMenu.classList.contains("open");

    hamburgerBtn.classList.toggle("open", isOpen);
    navFullMenu.classList.toggle("open", isOpen);
    navOverlay.classList.toggle("open", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
  }

  hamburgerBtn.addEventListener("click", () => toggleNavMenu());

  navOverlay.addEventListener("click", () => toggleNavMenu(false));

  document.querySelectorAll(".nav-fullmenu-grid a").forEach((link) => {
    link.addEventListener("click", () => toggleNavMenu(false));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      toggleNavMenu(false);
    }
  });
}

async function loadVillagePosts() {
  const DUMMY_POSTS = [
    {
      id: "dummy1",
      titleKey: "post1_title",
      title: "Village Council Announces Seed Bank",
      villageKey: "post1_village",
      village: "Piplantri, Rajasthan",
      contentKey: "post1_content",
      content: "The local panchayat just approved a native seed bank to preserve 20 varieties of indigenous millet.",
      typeKey: "post1_type",
      type: "Update",
      timestamp: new Date().toISOString()
    },
    {
      id: "dummy2",
      titleKey: "post2_title",
      title: "New Pottery Workshop Opens",
      villageKey: "post2_village",
      village: "Khurja, Uttar Pradesh",
      contentKey: "post2_content",
      content: "Local artisan _Ramesh Kumhar_ has opened a free pottery workshop for village youth, teaching **traditional blue pottery** techniques.",
      typeKey: "post2_type",
      type: "Craft",
      timestamp: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: "dummy3",
      titleKey: "post3_title",
      title: "Elder Storytelling Session Recorded",
      villageKey: "post3_village",
      village: "Bishnoi, Rajasthan",
      contentKey: "post3_content",
      content: "90-year-old Dadi Kamla shared tales of the Bishnoi conservation movement — now archived in 3 languages.",
      typeKey: "post3_type",
      type: "Story",
      timestamp: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: "dummy4",
      titleKey: "post4_title",
      title: "Heritage Bamboo Bridge Restored",
      villageKey: "post4_village",
      village: "Majuli, Assam",
      contentKey: "post4_content",
      content: "Community volunteers restored the 80-year-old bamboo bridge using traditional Mising tribe construction methods.",
      typeKey: "post4_type",
      type: "Restoration",
      timestamp: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: "dummy5",
      titleKey: "post5_title",
      title: "Phad Painting Exhibition Next Week",
      villageKey: "post5_village",
      village: "Shahpura, Rajasthan",
      contentKey: "post5_content",
      content: "Local Bhopa community is hosting a live Phad painting demo — a 700-year-old narrative scroll art tradition.",
      typeKey: "post5_type",
      type: "Art",
      timestamp: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: "dummy6",
      titleKey: "post6_title",
      title: "Tribal Music Archive — 50 Songs Added",
      villageKey: "post6_village",
      village: "Bastar, Chhattisgarh",
      contentKey: "post6_content",
      content: "Gond tribal musicians contributed 50 rare folk songs to the archive, many never recorded before.",
      typeKey: "post6_type",
      type: "Music",
      timestamp: new Date(Date.now() - 5 * 86400000).toISOString()
    }
  ];

  try {
    const response = await fetch("/api/posts");
    if (!response.ok) throw new Error("API unavailable");
    const posts = await response.json();

    const postsGrid = document.getElementById("village-posts");
    if (!postsGrid) return;

    if (posts.length === 0) {
      renderPosts(postsGrid, DUMMY_POSTS, true);
      return;
    }

    renderPosts(postsGrid, posts.slice(0, 6), false);
  } catch (error) {
    console.error("Error loading posts:", error);
    const postsGrid = document.getElementById("village-posts");
    if (postsGrid) renderPosts(postsGrid, DUMMY_POSTS, true);
  }
}

function renderPosts(container, posts, isDummy) {
  const lang = localStorage.getItem("parampara_lang") || "en";
  const activeTranslations = window.translations;
  const tr = activeTranslations ? activeTranslations[lang] : null;

  container.innerHTML = posts
    .map(
      (post) => {
        const title = (tr && post.titleKey && tr[post.titleKey]) || post.title || "Post";
        const village = (tr && post.villageKey && tr[post.villageKey]) || post.village || "Unknown Village";
        const content = (tr && post.contentKey && tr[post.contentKey]) || post.content || "";
        const type = (tr && post.typeKey && tr[post.typeKey]) || post.type || "Update";

        return `
          <div class="post-card" data-post-id="${post.id || ''}">
              <h4>${title}</h4>
              <p class="post-meta">📍 ${village} · 📅 ${formatDate(post.timestamp)}</p>
              <div class="post-content markdown-body">${renderMarkdown(content)}</div>
              <span class="post-card-badge">
                  ${type}
              </span>
              ${post.id ? `<button class="report-post-btn" data-post-id="${post.id}" title="Report inappropriate content" aria-label="Report" style="position:absolute; top:10px; right:10px; background:none; border:none; cursor:pointer; font-size:16px; opacity:0.6;">🚩</button>` : ''}
          </div>
        `;
      }
    )
    .join("");

  // Attach event listeners for report buttons
  const reportBtns = container.querySelectorAll('.report-post-btn');
  reportBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const postId = e.target.dataset.postId;
      if (!postId) return;
      if (confirm('Are you sure you want to report this post?')) {
        fetch('/api/moderation/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: postId, type: 'villagePost' })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert('Post reported successfully.');
            if (data.isHidden) {
              const card = e.target.closest('.post-card');
              if (card) card.remove();
            }
          } else {
            alert(data.error || 'Failed to report post');
          }
        })
        .catch(err => console.error('Error reporting:', err));
      }
    });
  });

  if (isDummy) {
    const note = document.createElement("p");
    note.style.cssText = "text-align:center; color: rgba(255,255,255,0.6); font-size:0.85rem; margin-top:1rem;";
    note.textContent = "✦ Sample stories — live updates coming soon";
    container.appendChild(note);
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const backToTopBtn = document.getElementById("backToTopBtn");
if (backToTopBtn) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add("show");
    } else {
      backToTopBtn.classList.remove("show");
    }
  });
  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

window.addEventListener("parampara:langchange", () => {
  loadVillagePosts();
});

// --- Real-Time SSE Logic ---
const receivedPostIds = new Set();
let sseReconnectDelay = 1000;

function initVillagePostsSSE() {
  const sseUrl = '/api/posts/stream';
  const eventSource = new EventSource(sseUrl);

  eventSource.addEventListener('NEW_POST', (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload) {
        handleNewVillagePost(payload);
      }
    } catch (err) {
      console.error("Error parsing SSE message:", err);
    }
  });

  eventSource.addEventListener('HIDE_POST', (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload && payload.id) {
        const card = document.querySelector(`.post-card[data-post-id="${payload.id}"]`);
        if (card) card.remove();
      }
    } catch (err) {
      console.error("Error parsing SSE HIDE_POST message:", err);
    }
  });

  eventSource.onerror = (err) => {
    console.error("EventSource failed:", err);
    // EventSource auto-reconnects natively, but we can log errors.
  };
}

function handleNewVillagePost(post) {
  if (receivedPostIds.has(post.id)) return;
  receivedPostIds.add(post.id);

  const postsGrid = document.getElementById("village-posts");
  if (!postsGrid) return;

  const lang = localStorage.getItem("parampara_lang") || "en";
  const activeTranslations = window.translations;
  const tr = activeTranslations ? activeTranslations[lang] : null;

  const title = (tr && post.titleKey && tr[post.titleKey]) || post.title || "New Post";
  const village = (tr && post.villageKey && tr[post.villageKey]) || post.village || "Unknown Village";
  const content = (tr && post.contentKey && tr[post.contentKey]) || post.content || "";
  const type = (tr && post.typeKey && tr[post.typeKey]) || post.type || "Update";
  
  const postHtml = `
    <div class="post-card new-post" data-post-id="${post.id || ''}" style="opacity: 0; transform: translateY(-20px); transition: all 0.5s ease;">
        <h4>${title}</h4>
        <p class="post-meta">${village} • ${formatDate(post.timestamp)}</p>
        <div class="post-content markdown-body">${renderMarkdown(content)}</div>
        <span class="post-card-badge">
            ${type}
        </span>
        ${post.id ? `<button class="report-post-btn" data-post-id="${post.id}" title="Report inappropriate content" aria-label="Report" style="position:absolute; top:10px; right:10px; background:none; border:none; cursor:pointer; font-size:16px; opacity:0.6;">🚩</button>` : ''}
    </div>
  `;

  // Insert at the top of the grid
  postsGrid.insertAdjacentHTML('afterbegin', postHtml);
  
  // Attach listener to the newly inserted button
  const newCard = postsGrid.firstElementChild;
  const newReportBtn = newCard.querySelector('.report-post-btn');
  if (newReportBtn) {
    newReportBtn.addEventListener('click', (e) => {
      const postId = e.target.dataset.postId;
      if (!postId) return;
      if (confirm('Are you sure you want to report this post?')) {
        fetch('/api/moderation/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: postId, type: 'villagePost' })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert('Post reported successfully.');
            if (data.isHidden) {
              const card = e.target.closest('.post-card');
              if (card) card.remove();
            }
          } else {
            alert(data.error || 'Failed to report post');
          }
        })
        .catch(err => console.error('Error reporting:', err));
      }
    });
  }

  requestAnimationFrame(() => {
    const newEl = postsGrid.firstElementChild;
    if (newEl) {
      void newEl.offsetWidth; 
      newEl.style.opacity = "1";
      newEl.style.transform = "translateY(0)";
    }
  });
}

// ===== FOCUS TRAPPING UTILITY FOR MODALS =====
(function() {
  let activeModal = null;
  let previousFocusElement = null;
  const focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';

  function trapFocus(e) {
    if (!activeModal || e.key !== 'Tab') return;
    const focusable = Array.from(activeModal.querySelectorAll(focusableElementsString)).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0);
    if (focusable.length === 0) return;
    if (e.shiftKey ? document.activeElement === focusable[0] : document.activeElement === focusable[focusable.length - 1]) {
      (e.shiftKey ? focusable[focusable.length - 1] : focusable[0]).focus();
      e.preventDefault();
    }
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        const el = mutation.target;
        if (el.classList.contains('active') && (el.className.includes('modal') || el.className.includes('fav-modal'))) {
          activeModal = el;
          previousFocusElement = document.activeElement;
          document.addEventListener('keydown', trapFocus);
        } else if (activeModal === el) {
          document.removeEventListener('keydown', trapFocus);
          if (previousFocusElement) previousFocusElement.focus();
          activeModal = null;
        }
      }
    });
  });

  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
    
    // Check if any modal is already active on load
    const openModal = document.querySelector('.modal.active, .fav-modal-overlay.active');
    if (openModal && typeof onModalOpen === 'function') {
      onModalOpen(openModal);
    }
  });
})();


const heroStats = document.querySelector(".hero-stats")
heroStats.style.transform = "rotateX(3600deg)"