// ═══════════════════════════════════════════════════════════════
// SPLASH SCREEN — Netflix-style intro animation
// ═══════════════════════════════════════════════════════════════
(function () {
    'use strict';

    const SPLASH_KEY = 'pandaraSamaja_splashSeen';
    const SPLASH_DURATION = 3200;   // total splash display time (ms)
    const SPLASH_EXPIRY = 30 * 60 * 1000; // show again after 30 min of no visit

    // ── Should we show splash? ────────────────────────────────
    function shouldShowSplash() {
        try {
            const data = localStorage.getItem(SPLASH_KEY);
            if (!data) return true;
            const ts = parseInt(data, 10);
            if (isNaN(ts)) return true;
            return (Date.now() - ts) > SPLASH_EXPIRY;
        } catch (e) {
            return true; // show if localStorage fails
        }
    }

    // ── Mark splash as seen ───────────────────────────────────
    function markSplashSeen() {
        try {
            localStorage.setItem(SPLASH_KEY, Date.now().toString());
        } catch (e) { /* ignore */ }
    }

    // ── Create splash DOM ─────────────────────────────────────
    function createSplash() {
        const splash = document.createElement('div');
        splash.className = 'splash-screen';
        splash.id = 'splashScreen';
        splash.setAttribute('aria-hidden', 'true');

        splash.innerHTML = `
      <div class="splash-logo-wrap">
        <div class="splash-logo-ring"></div>
        <img class="splash-logo" src="assets/img/pandara logo.png"
             alt="Pandara Samaja" draggable="false" />
      </div>
      <div class="splash-text">
        <p class="splash-title">ନିଖିଳ ଓଡିଶା ପନ୍ଦରା ସମାଜ</p>
        <p class="splash-subtitle">Nikhila Odisha Pandara Samaja</p>
      </div>
      <div class="splash-loader">
        <div class="splash-loader-bar"></div>
      </div>
    `;

        return splash;
    }

    // ── Dismiss splash ────────────────────────────────────────
    function dismissSplash(splash) {
        splash.classList.add('splash-hidden');
        markSplashSeen();

        // Remove from DOM after fade-out
        splash.addEventListener('transitionend', () => {
            splash.remove();
        }, { once: true });

        // Fallback removal if transitionend doesn't fire
        setTimeout(() => {
            if (splash.parentNode) splash.remove();
        }, 1000);
    }

    // ── Init ──────────────────────────────────────────────────
    if (shouldShowSplash()) {
        // Inject splash BEFORE anything else renders
        const splash = createSplash();

        // Prevent body scroll during splash
        document.documentElement.style.overflow = 'hidden';

        // Insert as first child of body, or wait for body
        function insertSplash() {
            document.body.insertBefore(splash, document.body.firstChild);

            // Auto-dismiss after duration
            setTimeout(() => {
                dismissSplash(splash);
                document.documentElement.style.overflow = '';
            }, SPLASH_DURATION);

            // Also allow click / tap to skip
            splash.addEventListener('click', () => {
                dismissSplash(splash);
                document.documentElement.style.overflow = '';
            }, { once: true });
        }

        if (document.body) {
            insertSplash();
        } else {
            document.addEventListener('DOMContentLoaded', insertSplash);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PAGE TRANSITION LOADER — Netflix-style loading between pages
    // ═══════════════════════════════════════════════════════════

    function createPageLoader() {
        // Don't create if already exists
        if (document.getElementById('pageLoader')) return;

        const loader = document.createElement('div');
        loader.className = 'page-loader';
        loader.id = 'pageLoader';
        loader.innerHTML = `
      <img class="page-loader-logo" src="assets/img/pandara logo.png"
           alt="" draggable="false" />
      <p class="page-loader-text">Loading…</p>
    `;
        document.body.appendChild(loader);
    }

    // Show loader on internal navigation
    function setupPageTransitions() {
        createPageLoader();
        const loader = document.getElementById('pageLoader');
        if (!loader) return;

        // Intercept internal link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (!link) return;

            const href = link.getAttribute('href');
            // Skip external links, anchors, javascript:, mailto:, etc.
            if (!href ||
                href.startsWith('#') ||
                href.startsWith('http') ||
                href.startsWith('mailto:') ||
                href.startsWith('tel:') ||
                href.startsWith('javascript:') ||
                link.target === '_blank') {
                return;
            }

            // Show loader for internal page navigation
            e.preventDefault();
            loader.classList.add('active');

            setTimeout(() => {
                window.location.href = href;
            }, 300);
        });
    }

    // Init page transitions
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupPageTransitions);
    } else {
        setupPageTransitions();
    }

})();
