// Safe wrapper: only call gtag if it exists
function gaEvent(name, params) {
  if (typeof gtag === 'function') {
    gtag('event', name, params || {});
  } else {
    console.debug('gtag not ready', name, params);
  }
}

// Public helper – called from onclick="trackHeroClick(...)" in HTML
function trackHeroClick(label) {
  gaEvent('select_content', {
    content_type: 'hero_button',
    item_id: label
  });
}

// Optional: track QR clicks
function trackQrClick() {
  gaEvent('select_content', {
    content_type: 'qr_badge',
    item_id: 'homepage_qr'
  });
}

// Attach listeners to buttons by data attribute (keeps HTML clean)
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-track-hero]').forEach(btn => {
    btn.addEventListener('click', () => {
      trackHeroClick(btn.getAttribute('data-track-hero'));
    });
  });

  const qr = document.querySelector('[data-track-qr]');
  if (qr) qr.addEventListener('click', trackQrClick);
});