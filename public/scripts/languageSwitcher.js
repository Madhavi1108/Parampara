/**
 * Parampara — Global Language Switcher
 * Place in: scripts/language-switcher.js
 * Load at END of <body> on every page, AFTER translations.js
 *
 * To add a new language:
 *   1. Add a new key block in translations.js  e.g. "gu": { ... }
 *   2. Add an <option value="gu"> to the langs array below
 *   No other changes needed anywhere.
 */

(function () {
  const LOCALE_STORAGE_KEY = 'parampara_lang';
  const FALLBACK_LANGUAGE = 'en';

  // ── Helpers
  function retrieveCurrentLang() {
    return localStorage.getItem(LOCALE_STORAGE_KEY) || FALLBACK_LANGUAGE;
  }

  function translateKey(key, lang) {
    lang = lang || retrieveCurrentLang();
    var dict =
      PARAMPARA_TRANSLATIONS[lang] || PARAMPARA_TRANSLATIONS[FALLBACK_LANGUAGE];
      console.log("Current language:", lang);
console.log("Translations:", PARAMPARA_TRANSLATIONS);
console.log("Current dict:", dict);
    return dict[key] !== undefined ? dict[key] : PARAMPARA_TRANSLATIONS[FALLBACK_LANGUAGE][key] || key;
  }

  // ── Apply all translations to the page ────────────────────────────────────
  function renderLanguageTranslations(lang) {
    // data-i18n="key"  →  textContent
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = translateKey(el.getAttribute('data-i18n'), lang);
    });

    // data-i18n-html="key"  →  innerHTML  (for strings containing markup)
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      el.innerHTML = translateKey(el.getAttribute('data-i18n-html'), lang);
    });

    // data-i18n-placeholder="key"  →  placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.setAttribute(
        'placeholder',
        translateKey(el.getAttribute('data-i18n-placeholder'), lang)
      );
    });

    // data-i18n-title="key"  →  title attribute  (tooltips)
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      el.setAttribute('title', translateKey(el.getAttribute('data-i18n-title'), lang));
    });

    // data-i18n-value="key"  →  value attribute  (<input type="button">)
    document.querySelectorAll('[data-i18n-value]').forEach(function (el) {
      el.setAttribute('value', translateKey(el.getAttribute('data-i18n-value'), lang));
    });

    // data-i18n-question="key"  →  data-question attribute
    // Used on chat page suggestion chips so the sent question is also translated
    document.querySelectorAll('[data-i18n-question]').forEach(function (el) {
      el.setAttribute(
        'data-question',
        translateKey(el.getAttribute('data-i18n-question'), lang)
      );
    });

    // Keep <html lang="..."> correct for accessibility / screen readers
    document.documentElement.setAttribute('lang', lang);

    // Sync both selectors (global pill + map page's own selector)
    ['global-lang-selector', 'language-selector'].forEach(function (id) {
      var sel = document.getElementById(id);
      if (sel) sel.value = lang;
    });
    window.dispatchEvent(
      new CustomEvent('parampara:langchange', { detail: { lang: lang } })
    );
  }

  // ── Inject floating language-selector pill into navbar ────────────────────
  function buildLanguageSelector() {
    if (document.getElementById('global-lang-selector')) return;

    const langs = [
      { value: 'en', label: 'English' },
      { value: 'hi', label: 'हिन्दी' },
      { value: 'mr', label: 'मराठी' },
    ];

    const wrapper = document.createElement('div');
    wrapper.className = 'lang-selector-wrapper';

    const btn = document.createElement('button');
    btn.id = 'global-lang-selector';
    btn.className = 'lang-btn';

    const currentLang = retrieveCurrentLang();
    btn.textContent =
      langs.find((l) => l.value === currentLang)?.label || 'English';

    const dropdown = document.createElement('div');
    dropdown.className = 'lang-dropdown';

    langs.forEach((lang) => {
      const item = document.createElement('button');
      item.className = 'lang-option';
      item.textContent = lang.label;

      item.addEventListener('click', () => {
        btn.textContent = lang.label;

        localStorage.setItem(LOCALE_STORAGE_KEY, lang.value);
        localStorage.setItem('language', lang.value);

        renderLanguageTranslations(lang.value);

        const mapSel = document.getElementById('language-selector');
        if (mapSel) mapSel.value = lang.value;

        dropdown.classList.remove('show');
      });

      dropdown.appendChild(item);
    });

    btn.addEventListener('click', () => {
      dropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });

    wrapper.append(btn, dropdown);

    const navContainer = document.querySelector('.nav-container');

    if (navContainer) {
      navContainer.appendChild(wrapper);
    } else {
      wrapper.style.cssText =
        'position:fixed;bottom:1rem;right:1rem;z-index:9999;';
      document.body.appendChild(wrapper);
    }
  }

  // ── Sync the map page's built-in language selector ────────────────────────
  function bindMapLanguageSelector() {
    var mapSel = document.getElementById('language-selector');
    if (!mapSel) return;

    mapSel.value = retrieveCurrentLang();
    mapSel.addEventListener('change', function () {
      var chosen = this.value;
      localStorage.setItem(LOCALE_STORAGE_KEY, chosen);
      localStorage.setItem('language', chosen);
      renderLanguageTranslations(chosen);
      var globalSel = document.getElementById('global-lang-selector');
      if (globalSel) globalSel.value = chosen;
    });
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  async function initializeTranslations() {
    try {
      const data = await window.CacheManager.get('/api/translations');
      window.PARAMPARA_TRANSLATIONS = data.PARAMPARA_TRANSLATIONS ?? data;
      window.translations = data.translations;
    } catch (error) {
      console.error('Parampara: failed to load translations', error);
      return;
    }

    buildLanguageSelector();
    bindMapLanguageSelector();
    renderLanguageTranslations(retrieveCurrentLang());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTranslations);
  } else {
    initializeTranslations();
  }
})();
