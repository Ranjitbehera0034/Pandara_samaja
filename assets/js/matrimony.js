// File: assets/js/matrimony.js — Netflix-Level Redesign

const container = document.getElementById("profile-list");
const modal = document.getElementById("profile-modal");
const closeBtn = document.querySelector(".close-btn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const genderSelection = document.getElementById("gender-selection");
const maleBtn = document.getElementById("selectMale");
const femaleBtn = document.getElementById("selectFemale");
const backToGender = document.getElementById("backToGender");

let currentProfiles = [];
let currentIndex = -1;

function imageURL(raw) {
  if (!raw) return '';
  const m = raw.match(/id=([^&]+)/);
  return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000` : raw;
}

/* ─── Stats Counter Animation ─── */
function animateCounter(el, target) {
  if (!el) return;
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 40));
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = current;
  }, 30);
}

/* ─── Fetch & display stats ─── */
async function loadStats() {
  try {
    const [maleRes, femaleRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/candidates?gender=male`),
      fetch(`${API_BASE_URL}/api/candidates?gender=female`)
    ]);
    const males = await maleRes.json();
    const females = await femaleRes.json();
    const all = [...males, ...females];
    const active = all.filter(c => !c.isMatched);
    const matched = all.filter(c => c.isMatched);

    animateCounter(document.getElementById('statProfiles'), active.length);
    animateCounter(document.getElementById('statMatched'), matched.length);
  } catch (e) {
    console.warn('Stats unavailable:', e);
  }
}

loadStats();

/* ─── Skeleton Loading ─── */
function showSkeleton() {
  container.innerHTML = `
    <div class="skeleton-grid">
      ${Array(8).fill('').map(() => `
        <div class="skeleton-card">
          <div class="skeleton-img"></div>
          <div class="skeleton-text"></div>
        </div>
      `).join('')}
    </div>`;
}

/* ─── Profile Rendering ─── */
async function renderProfiles(gender) {
  showSkeleton();
  const heroEl = document.querySelector('.matrimony-hero');
  if (heroEl) heroEl.style.display = 'none';

  try {
    const res = await fetch(`${API_BASE_URL}/api/candidates?gender=${gender}`);
    const data = await res.json();
    const filtered = data.filter(c => !c.isMatched);

    filtered.sort((a, b) => b.age - a.age);
    currentProfiles = filtered;

    container.innerHTML = "";

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💍</div>
          <p>
            <span class="lang-or">ବର୍ତ୍ତମାନ କୌଣସି ପ୍ରୋଫାଇଲ୍ ଉପಲବ୍ଧ ନାହିଁ</span>
            <span class="lang-en">No profiles available at the moment</span>
          </p>
        </div>`;
      backToGender.style.display = "block";
      return;
    }

    // Header
    const header = document.createElement('div');
    header.className = 'profiles-header';
    header.innerHTML = `
      <h2>
        <span class="lang-or">${gender === 'male' ? 'ବର' : 'କନ୍ୟା'} ପ୍ରୋଫାଇଲ୍</span>
        <span class="lang-en">${gender === 'male' ? 'Groom' : 'Bride'} Profiles</span>
      </h2>
      <div class="profiles-count">
        <span class="lang-or">${filtered.length} ଟି ପ୍ରୋଫାଇଲ୍ ଉପಲବ୍ଧ</span>
        <span class="lang-en">${filtered.length} profiles available</span>
      </div>`;
    container.appendChild(header);

    // Grid
    const cardList = document.createElement("div");
    cardList.className = "card-list";

    filtered.forEach((person, index) => {
      const imgUrl = imageURL(person.photo);
      const card = document.createElement("div");
      card.className = "profile-card";
      card.style.animationDelay = `${index * 0.05}s`;

      const isAdmin = localStorage.getItem("isAdmin") === "true";
      const id = person.id || person._id;

      let adminHtml = '';
      if (isAdmin) {
        adminHtml = `<button class="admin-match-btn" onclick="event.stopPropagation(); window.openMatchModal('${id}')">✅ Match</button>`;
      }

      card.innerHTML = `
        <img src="${imgUrl}" alt="${person.name}" loading="lazy" referrerpolicy="no-referrer"
             onerror="this.onerror=null; this.style.background='linear-gradient(135deg,#1a1a2e,#16213e)'; this.style.objectFit='contain';">
        <div class="card-info">
          <p class="card-name">${person.name}</p>
          <div class="card-action">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
            <span class="lang-or">ଦେଖନ୍ତୁ</span>
            <span class="lang-en">View Profile</span>
          </div>
        </div>
        ${adminHtml}`;

      card.addEventListener("click", (e) => {
        if (e.target.closest('.admin-match-btn')) return;
        showModal(index);
      });

      cardList.appendChild(card);
    });

    container.appendChild(cardList);
    backToGender.style.display = "block";

    // Animate cards in with stagger
    requestAnimationFrame(() => {
      const cards = cardList.querySelectorAll('.profile-card');
      cards.forEach((c, i) => {
        c.style.opacity = '0';
        c.style.transform = 'translateY(30px)';
        setTimeout(() => {
          c.style.transition = 'all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
          c.style.opacity = '1';
          c.style.transform = 'translateY(0)';
        }, i * 60);
      });
    });

  } catch (err) {
    console.error("Error loading profiles:", err);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>
          <span class="lang-or">ପ୍ରୋଫାଇଲ୍ ଲୋଡ୍ କରିବାରେ ତ୍ରୁଟି</span>
          <span class="lang-en">Failed to load profiles</span>
        </p>
      </div>`;
  }
}

/* ─── Modal Functions ─── */
function updateModalView(p) {
  const photo = document.getElementById("modal-photo");
  const name = document.getElementById("modal-name");
  if (photo) photo.src = imageURL(p.photo);
  if (name) name.textContent = p.name;
}

function showModal(index) {
  if (index < 0 || index >= currentProfiles.length) return;
  currentIndex = index;
  updateModalView(currentProfiles[currentIndex]);
  modal.classList.remove("hidden");
}

function showNext() {
  if (currentIndex < currentProfiles.length - 1) {
    currentIndex++;
    updateModalView(currentProfiles[currentIndex]);
  }
}

function showPrev() {
  if (currentIndex > 0) {
    currentIndex--;
    updateModalView(currentProfiles[currentIndex]);
  }
}

/* ─── Touch / Swipe ─── */
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

modal.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

modal.addEventListener('touchend', e => {
  touchEndX = e.changedTouches[0].screenX;
  touchEndY = e.changedTouches[0].screenY;
  handleSwipe();
}, { passive: true });

function handleSwipe() {
  const threshold = 50;
  const xDiff = touchEndX - touchStartX;
  const yDiff = touchEndY - touchStartY;
  if (Math.abs(yDiff) > Math.abs(xDiff)) return;
  if (Math.abs(xDiff) > threshold) {
    if (xDiff < 0) showNext();
    else showPrev();
  }
}

/* ─── Keyboard Navigation ─── */
document.addEventListener('keydown', (e) => {
  if (modal.classList.contains('hidden')) return;
  if (e.key === 'ArrowRight') showNext();
  if (e.key === 'ArrowLeft') showPrev();
  if (e.key === 'Escape') modal.classList.add("hidden");
});

/* ─── Button Listeners ─── */
if (prevBtn) {
  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showPrev();
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showNext();
  });
}

closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
window.addEventListener("click", e => {
  if (e.target === modal) modal.classList.add("hidden");
});

maleBtn.addEventListener("click", () => {
  genderSelection.style.display = "none";
  renderProfiles("male");
});

femaleBtn.addEventListener("click", () => {
  genderSelection.style.display = "none";
  renderProfiles("female");
});

backToGender.addEventListener("click", () => {
  container.innerHTML = "";
  backToGender.style.display = "none";
  genderSelection.style.display = "block";
  const heroEl = document.querySelector('.matrimony-hero');
  if (heroEl) heroEl.style.display = '';
});

/* ═════════════════════════════════════════════════════════════
   ADMIN MATCH LOGIC
   ═════════════════════════════════════════════════════════════ */

function showToast(msg, type = 'success') {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = `
    position: fixed; bottom: 20px; right: 20px;
    background: ${type === 'success' ? 'linear-gradient(135deg, #28a745, #20c997)' : 'linear-gradient(135deg, #e50914, #ff3d47)'};
    color: white; padding: 14px 28px; border-radius: 12px; z-index: 3000;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3); font-weight: 700;
    font-family: 'Inter', sans-serif; font-size: 0.9rem;
    opacity: 0; transform: translateY(20px);
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  `;
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    setTimeout(() => el.remove(), 400);
  }, 3000);
}

function getAuthHeaders() {
  const token = localStorage.getItem("adminToken");
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

window.openMatchModal = function (id) {
  if (!id || id === 'undefined') {
    showToast("Error: Missing Candidate ID", "error");
    return;
  }
  const el = document.getElementById('matchCandidateId');
  if (el) el.value = id;
  const m = document.getElementById('matchModal');
  if (m) m.style.display = 'flex';
}

window.closeMatchModal = function () {
  const m = document.getElementById('matchModal');
  if (m) m.style.display = 'none';
  const f = document.getElementById('matchForm');
  if (f) f.reset();
}

if (document.getElementById('matchForm')) {
  document.getElementById('matchForm').addEventListener('submit', async e => {
    e.preventDefault();
    const id = document.getElementById('matchCandidateId').value;
    const partnerName = document.getElementById('partnerName').value.trim();
    const partnerGender = document.getElementById('partnerGender').value;

    if (!id || !partnerName || !partnerGender) return showToast("Fill all fields", "error");

    try {
      const res = await fetch(`${API_BASE_URL}/api/candidates/${id}/match`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isMatched: true, partnerName, partnerGender })
      });

      if (!res.ok) throw new Error("Failed to update");

      showToast("Marked as Matched!", "success");
      closeMatchModal();
      location.reload();
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    }
  });
}
