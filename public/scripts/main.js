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
        <p>${tr[post.contentKey]}</p>
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

const hamburgerBtn = document.getElementById("hamburgerBtn");
const navMenu = document.getElementById("navMenu");

hamburgerBtn.addEventListener("click", () => {
  hamburgerBtn.classList.toggle("open");
  navMenu.classList.toggle("open");
});

// Close menu when any link is clicked
navMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    hamburgerBtn.classList.remove("open");
    navMenu.classList.remove("open");
  });
});

// Close menu on outside click
document.addEventListener("click", (e) => {
  if (!hamburgerBtn.contains(e.target) && !navMenu.contains(e.target)) {
    hamburgerBtn.classList.remove("open");
    navMenu.classList.remove("open");
  }
});

window.addEventListener("parampara:langchange", () => {
  loadVillagePosts();
});
