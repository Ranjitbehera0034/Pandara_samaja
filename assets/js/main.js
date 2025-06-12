// Toggle navigation
const navToggle = document.querySelector('.nav-toggle');
const navLinks  = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  /* close after clicking any nav link (mobile UX) */
  navLinks.addEventListener('click', e => {
    if (e.target.tagName === 'A') {
      navLinks.classList.remove('open');
    }
  });
}
