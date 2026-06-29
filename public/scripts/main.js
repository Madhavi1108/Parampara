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
    initVillagePostsWebSocket();
  } catch (err) {
    console.error("Failed to initialize WebSocket:", err);
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
    { titleKey: "post1_title", villageKey: "post1_village", contentKey: "post1_content", typeKey: "post1_type", timestamp: new Date().toISOString() },
    { titleKey: "post2_title", villageKey: "post2_village", contentKey: "post2_content", typeKey: "post2_type", timestamp: new Date(Date.now() - 86400000).toISOString() },
    { titleKey: "post3_title", villageKey: "post3_village", contentKey: "post3_content", typeKey: "post3_type", timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
    { titleKey: "post4_title", villageKey: "post4_village", contentKey: "post4_content", typeKey: "post4_type", timestamp: new Date(Date.now() - 3 * 86400000).toISOString() },
    { titleKey: "post5_title", villageKey: "post5_village", contentKey: "post5_content", typeKey: "post5_type", timestamp: new Date(Date.now() - 4 * 86400000).toISOString() },
    { titleKey: "post6_title", villageKey: "post6_village", contentKey: "post6_content", typeKey: "post6_type", timestamp: new Date(Date.now() - 5 * 86400000).toISOString() },
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
  const tr = translations[lang];

  container.innerHTML = posts
    .map(
      (post) => `
    <div class="post-card">
        <h4>${tr[post.titleKey]}</h4>
        <p class="post-meta">📍 ${tr[post.villageKey]} · 📅 ${formatDate(post.timestamp)}</p>
        <div class="post-content markdown-body">${renderMarkdown(tr[post.contentKey] || '')}</div>
        <span style="display:inline-block;padding:0.25rem 0.75rem;background:var(--primary-color);border-radius:20px;font-size:0.85rem;margin-top:1rem;color:white">
            ${tr[post.typeKey]}
        </span>
    </div>
`,
    )
    .join("");

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

// --- Real-Time WebSocket Logic ---
const receivedPostIds = new Set();
let wsReconnectDelay = 1000;

function initVillagePostsWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'NEW_POST' && data.payload) {
        handleNewVillagePost(data.payload);
      }
    } catch (err) { console.error("Error parsing WS message:", err); }
  };

  ws.onclose = () => {
    setTimeout(initVillagePostsWebSocket, wsReconnectDelay);
    wsReconnectDelay = Math.min(wsReconnectDelay * 2, 30000);
  };
}

function handleNewVillagePost(post) {
  if (receivedPostIds.has(post.id)) return;
  receivedPostIds.add(post.id);

  const postsGrid = document.getElementById("village-posts");
  if (!postsGrid) return;

  const lang = localStorage.getItem("parampara_lang") || "en";
  const tr = translations[lang] || {};
  
  const postHtml = `
    <div class="post-card new-post" style="opacity: 0; transform: translateY(-20px); transition: all 0.5s ease;">
        <h4>${tr[post.titleKey] || post.title || "New Post"}</h4>
        <p class="post-meta">${tr[post.villageKey] || post.village || "Unknown Village"} • ${formatDate(post.timestamp)}</p>
        <div class="post-content markdown-body">${renderMarkdown(tr[post.contentKey] || post.content || "")}</div>
        <span style="display:inline-block;padding:0.25rem 0.75rem;background:var(--primary-color);border-radius:20px;font-size:0.85rem;margin-top:1rem;color:white">
            ${tr[post.typeKey] || post.type || "Update"}
        </span>
    </div>
  `;

  postsGrid.insertAdjacentHTML("afterbegin", postHtml);
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
