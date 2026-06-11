let currentLanguage = localStorage.getItem("language") || "en";

function t(key) {
    return translations[currentLanguage][key] || key;
}

function translatePage() {
    document.querySelectorAll("[data-key]").forEach(el => {
        const key = el.getAttribute("data-key");
        el.textContent = t(key);
    });
}