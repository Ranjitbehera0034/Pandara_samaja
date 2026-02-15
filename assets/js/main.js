// ─── Toggle mobile navigation ───────────────────────────────────
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    navToggle.classList.toggle('active');
  });
}

// ─── Language Toggle ────────────────────────────────────────────
(function initLanguage() {
  const LANG_KEY = 'pandaraSamaja_lang';
  const stored = localStorage.getItem(LANG_KEY);
  let currentLang = stored || 'or'; // default Odia

  // Apply language immediately
  document.documentElement.setAttribute('lang', currentLang);

  function createLangButton() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    // Don't create if already exists
    if (document.getElementById('langToggle')) return;

    const btn = document.createElement('button');
    btn.className = 'lang-toggle';
    btn.id = 'langToggle';
    btn.setAttribute('aria-label', 'Switch language');
    btn.title = currentLang === 'or' ? 'Switch to English' : 'ଓଡ଼ିଆ ଭାଷାକୁ ବଦଳାନ୍ତୁ';
    btn.textContent = currentLang === 'or' ? 'EN' : 'ଓ';

    btn.addEventListener('click', () => {
      currentLang = currentLang === 'or' ? 'en' : 'or';
      document.documentElement.setAttribute('lang', currentLang);
      localStorage.setItem(LANG_KEY, currentLang);
      btn.textContent = currentLang === 'or' ? 'EN' : 'ଓ';
      btn.title = currentLang === 'or' ? 'Switch to English' : 'ଓଡ଼ିଆ ଭାଷାକୁ ବଦଳାନ୍ତୁ';
    });

    // Insert before dark mode toggle or nav-toggle
    const darkBtn = navbar.querySelector('.dark-mode-toggle');
    const navToggleBtn = navbar.querySelector('.nav-toggle');
    const insertBefore = darkBtn || navToggleBtn;
    if (insertBefore) {
      navbar.insertBefore(btn, insertBefore);
    } else {
      navbar.appendChild(btn);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createLangButton);
  } else {
    createLangButton();
  }
})();

// ─── Dark Mode ──────────────────────────────────────────────────
(function initDarkMode() {
  const STORAGE_KEY = 'pandaraSamaja_darkMode';

  // Determine initial state
  const stored = localStorage.getItem(STORAGE_KEY);
  let isDark;
  if (stored !== null) {
    isDark = stored === 'true';
  } else {
    // Respect system preference
    isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // Apply immediately (before paint)
  if (isDark) document.documentElement.classList.add('dark');

  // Create toggle button and inject into navbar
  function createToggleButton() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const btn = document.createElement('button');
    btn.className = 'dark-mode-toggle';
    btn.id = 'darkModeToggle';
    btn.setAttribute('aria-label', 'Toggle dark mode');
    btn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    btn.innerHTML = isDark
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

    btn.addEventListener('click', () => {
      isDark = !isDark;
      document.documentElement.classList.toggle('dark', isDark);
      localStorage.setItem(STORAGE_KEY, isDark);
      btn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
      btn.innerHTML = isDark
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    });

    // Insert before nav-toggle (hamburger) or at end
    const navToggleBtn = navbar.querySelector('.nav-toggle');
    if (navToggleBtn) {
      navbar.insertBefore(btn, navToggleBtn);
    } else {
      navbar.appendChild(btn);
    }
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createToggleButton);
  } else {
    createToggleButton();
  }
})();
