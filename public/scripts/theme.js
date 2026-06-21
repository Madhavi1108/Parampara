document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("themeToggle");

  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  toggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";

  toggle.addEventListener("click", () => {
    const currentTheme =
      document.documentElement.getAttribute("data-theme");

    const newTheme =
      currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);

    toggle.textContent =
      newTheme === "dark" ? "☀️" : "🌙";
  });
});