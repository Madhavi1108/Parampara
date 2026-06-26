(function() {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const toggle = document.getElementById("themeToggle");
    if (toggle) {
      toggle.textContent = theme === "dark" ? "☀️" : "🌙";
    }
  }

  // 1. Initial Load: Set theme immediately to prevent FOUC
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    setTheme(prefersDark.matches ? "dark" : "light");
  }

  // 2. System Sync: Listen for real-time changes to the OS theme settings
  prefersDark.addEventListener("change", (e) => {
    // Only auto-switch if the user hasn't explicitly set a manual preference
    if (!localStorage.getItem("theme")) {
      setTheme(e.matches ? "dark" : "light");
    }
  });

  // 3. User Override: Bind manual toggle event on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("themeToggle");
    if (toggle) {
      // Sync icon text on load since toggle wasn't available during initial execution
      const currentTheme = document.documentElement.getAttribute("data-theme");
      toggle.textContent = currentTheme === "dark" ? "☀️" : "🌙";
      
      toggle.addEventListener("click", () => {
        const activeTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = activeTheme === "dark" ? "light" : "dark";
        
        setTheme(newTheme);
        
        // Save the manual override in LocalStorage so it persists and disables auto-sync
        localStorage.setItem("theme", newTheme);
      });
    }
  });
})();