// Main JavaScript for Home Page

// Load village posts on page load
document.addEventListener("DOMContentLoaded", async () => {
  await loadVillagePosts();
});

async function loadVillagePosts() {
  const DUMMY_POSTS = [
    {
      titleKey: "post1_title",
      villageKey: "post1_village",
      contentKey: "post1_content",
      typeKey: "post1_type",
      timestamp: new Date().toISOString(),
    },
    {
      titleKey: "post2_title",
      villageKey: "post2_village",
      contentKey: "post2_content",
      typeKey: "post2_type",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      titleKey: "post3_title",
      villageKey: "post3_village",
      contentKey: "post3_content",
      typeKey: "post3_type",
      timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      titleKey: "post4_title",
      villageKey: "post4_village",
      contentKey: "post4_content",
      typeKey: "post4_type",
      timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      titleKey: "post5_title",
      villageKey: "post5_village",
      contentKey: "post5_content",
      typeKey: "post5_type",
      timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      titleKey: "post6_title",
      villageKey: "post6_village",
      contentKey: "post6_content",
      typeKey: "post6_type",
      timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
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

console.log("LANG:", lang);
console.log("TRANSLATIONS:", PARAMPARA_TRANSLATIONS);
console.log("CURRENT LANG OBJECT:", tr);
console.log("POST 1 TITLE:", tr?.post1_title);
  container.innerHTML = posts
    .map(
      (post) => `
    <div class="post-card">
        <h4>${tr[post.titleKey]}</h4>
        <p class="post-meta">${tr[post.villageKey]} • ${formatDate(post.timestamp)}</p>
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
    note.style.cssText =
      "text-align:center; color: rgba(255,255,255,0.6); font-size:0.85rem; margin-top:1rem;";
    note.textContent = "✦ Sample stories — live updates coming soon";
    container.appendChild(note);
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
const backToTopBtn = document.getElementById("backToTopBtn");
if (backToTopBtn) {

  // Show button after scrolling
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add("show");
    } else {
      backToTopBtn.classList.remove("show");
    }
  });

  // Smooth scroll to top
  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}
window.addEventListener("parampara:langchange", () => {
  loadVillagePosts();
});


document.addEventListener("DOMContentLoaded", async () => {
  await loadVillagePosts();

  // ===== HAMBURGER NAV =====
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navFullMenu = document.getElementById("navFullMenu");
  const navOverlay = document.getElementById("navOverlay");

  if (!hamburgerBtn || !navFullMenu || !navOverlay) {
    console.warn("Nav elements not found");
    return;
  }

  function toggleNavMenu(forceOpen) {
    const isOpen = forceOpen !== undefined
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
    if (e.key === "Escape") toggleNavMenu(false);
  });
});

// ===== FOCUS TRAPPING UTILITY FOR MODALS =====
(function() {
  let activeModal = null;
  let previousFocusElement = null;

  const focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';

  function trapFocus(e) {
    if (!activeModal) return;

    const focusableElements = Array.from(activeModal.querySelectorAll(focusableElementsString)).filter(el => {
      // Ensure the element is visible
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
    });
    
    if (focusableElements.length === 0) return;

    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];

    const isTabPressed = e.key === 'Tab' || e.keyCode === 9;
    if (!isTabPressed) return;

    if (e.shiftKey) { 
      // Shift + Tab
      if (document.activeElement === firstFocusableElement) {
        lastFocusableElement.focus();
        e.preventDefault();
      }
    } else { 
      // Tab
      if (document.activeElement === lastFocusableElement) {
        firstFocusableElement.focus();
        e.preventDefault();
      }
    }
  }

  function handleEscape(e) {
    if (!activeModal) return;
    if (e.key === 'Escape' || e.keyCode === 27) {
      // Find close button and click it, or just remove active class
      const closeBtn = activeModal.querySelector('.close-btn, .fav-modal-close') || activeModal.querySelector('[id^="close-"]');
      if (closeBtn) {
        closeBtn.click();
      } else {
        activeModal.classList.remove('active');
      }
    }
  }

  function onModalOpen(modal) {
    if (activeModal === modal) return;
    previousFocusElement = document.activeElement;
    activeModal = modal;
    
    // Focus first interactive element
    setTimeout(() => {
      const focusableElements = Array.from(activeModal.querySelectorAll(focusableElementsString)).filter(el => {
        return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
      });
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }, 50);

    document.addEventListener('keydown', trapFocus);
    document.addEventListener('keydown', handleEscape);
  }

  function onModalClose(modal) {
    if (activeModal === modal) {
      activeModal = null;
      document.removeEventListener('keydown', trapFocus);
      document.removeEventListener('keydown', handleEscape);
      if (previousFocusElement) {
        previousFocusElement.focus();
        previousFocusElement = null;
      }
    }
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const el = mutation.target;
        if (typeof el.className === 'string' && (el.className.includes('modal') || el.className.includes('fav-modal-overlay'))) {
          if (el.classList.contains('active')) {
            onModalOpen(el);
          } else {
            onModalClose(el);
          }
        }
      }
    });
  });

  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
    
    // Check if any modal is already active on load
    const openModal = document.querySelector('.modal.active, .fav-modal-overlay.active');
    if (openModal) {
      onModalOpen(openModal);
    }
  });
})();