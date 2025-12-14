// File: assets/js/matrimony.js

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
  const m = raw.match(/id=([^&]+)/);
  // Use thumbnail API with large size (w1000) to avoid strict download quotas (429 errors)
  return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000` : raw;
}

async function renderProfiles(gender) {
  container.innerHTML = "<p>Loading profiles...</p>";
  try {
    const res = await fetch(`${API_BASE_URL}/api/candidates?gender=${gender}`);
    const data = await res.json();
    const filtered = data.filter(c => !c.isMatched);

    filtered.sort((a, b) => b.age - a.age); // Oldest to youngest
    currentProfiles = filtered; // Store for references

    container.innerHTML = "";
    const cardList = document.createElement("div");
    cardList.className = "card-list";

    filtered.forEach((person, index) => {
      const imgUrl = imageURL(person.photo);
      const card = document.createElement("div");
      card.className = "profile-card";

      let adminHtml = '';
      if (localStorage.getItem("isAdmin") === "true") {
        const id = person.id || person._id;
        adminHtml = `<button 
              style="margin-top:10px; width:100%; padding:8px; background:#28a745; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;"
              onclick="event.stopPropagation(); window.openMatchModal('${id}')"
          >✅ Mark Matched</button>`;
      }

      // Add loading="lazy" and referrerpolicy="no-referrer" to reduce load impact
      card.innerHTML = `
  <img src="${imgUrl}" alt="${person.name}" loading="lazy" referrerpolicy="no-referrer">
  <p>${person.name}</p>
  ${adminHtml}
`;

      card.querySelector("img")
        .addEventListener("click", () => showModal(index));

      cardList.appendChild(card);
    });

    container.appendChild(cardList);
    backToGender.style.display = "block";
  } catch (err) {
    console.error("Error loading profiles:", err);
    container.innerHTML = "<p>Failed to load profiles</p>";
  }
}

function updateModalView(p) {
  document.getElementById("modal-photo").src = imageURL(p.photo);
  // When switching images quickly, it's nice to reset or update name
  document.getElementById("modal-name").textContent = p.name;

  // Hide details that are now in the image (or clear them if element exists)
  const fields = ["modal-age", "modal-height", "modal-blood", "modal-gotra", "modal-edu", "modal-occ", "modal-father", "modal-mother", "modal-phone", "modal-email", "modal-address"];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
}

function showModal(index) {
  if (index < 0 || index >= currentProfiles.length) return;
  currentIndex = index;
  const p = currentProfiles[currentIndex];

  updateModalView(p);
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

// Swipe Logic
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

  // If vertical movement is greater than horizontal, assume scroll and do nothing
  if (Math.abs(yDiff) > Math.abs(xDiff)) return;

  if (Math.abs(xDiff) > threshold) {
    if (xDiff < 0) {
      // Swipe Left -> Next
      showNext();
    } else {
      // Swipe Right -> Prev
      showPrev();
    }
  }
}

// Keyboard navigation support as bonus
document.addEventListener('keydown', (e) => {
  if (modal.classList.contains('hidden')) return;
  if (e.key === 'ArrowRight') showNext();
  if (e.key === 'ArrowLeft') showPrev();
  if (e.key === 'Escape') modal.classList.add("hidden");
});



if (prevBtn) {
  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent modal close
    showPrev();
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent modal close
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
});

/* =========================================
   ADMIN MATCH LOGIC
   ========================================= */

// Simple Toast function since matrimony.js doesn't have it
function showToast(msg, type = 'success') {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; 
        background: ${type === 'success' ? '#28a745' : '#dc3545'}; 
        color: white; padding: 12px 24px; border-radius: 8px; z-index: 3000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-weight: 600;
        opacity: 1; transition: opacity 0.3s;
    `;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
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
      // Just reload to refresh the list cleanly
      location.reload();
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    }
  });
}
