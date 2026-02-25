/* ═══════════════════════════════════════════════════════════════
   MEMBER PORTAL JS — Community Platform Logic
   ═══════════════════════════════════════════════════════════════ */

const API = window.API_BASE_URL || 'http://localhost:5000';

// ── State ──
let currentMember = null;        // logged-in member data
let allPortalMembers = [];       // all members for directory
let communityPosts = [];         // local posts (stored in localStorage)
let memberPhotos = [];           // member's uploaded photos
let subscriptions = new Set();   // subscribed member IDs
let postLikes = {};              // post ID → liked boolean
let postComments = {};           // post ID → [comments]
let composePhotos = [];          // photos being composed for a post

const STORAGE_KEYS = {
  member: 'portalMember',
  posts: 'portalPosts',
  photos: 'portalPhotos',
  subscriptions: 'portalSubscriptions',
  likes: 'portalLikes',
  comments: 'portalComments'
};

// ── Toast ──
function portalToast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `portal-toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ── Utility ──
function getInitial(name) {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  return words.length > 1
    ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

function escHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN');
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// ── Load persisted data ──
function loadPersistedData() {
  try {
    const savedMember = localStorage.getItem(STORAGE_KEYS.member);
    if (savedMember) currentMember = JSON.parse(savedMember);

    const savedPosts = localStorage.getItem(STORAGE_KEYS.posts);
    if (savedPosts) communityPosts = JSON.parse(savedPosts);

    const savedPhotos = localStorage.getItem(STORAGE_KEYS.photos);
    if (savedPhotos) memberPhotos = JSON.parse(savedPhotos);

    const savedSubs = localStorage.getItem(STORAGE_KEYS.subscriptions);
    if (savedSubs) subscriptions = new Set(JSON.parse(savedSubs));

    const savedLikes = localStorage.getItem(STORAGE_KEYS.likes);
    if (savedLikes) postLikes = JSON.parse(savedLikes);

    const savedComments = localStorage.getItem(STORAGE_KEYS.comments);
    if (savedComments) postComments = JSON.parse(savedComments);
  } catch (e) {
    console.error('Error loading persisted data:', e);
  }
}

function savePosts() {
  localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(communityPosts));
}

function savePhotos() {
  localStorage.setItem(STORAGE_KEYS.photos, JSON.stringify(memberPhotos));
}

function saveSubscriptions() {
  localStorage.setItem(STORAGE_KEYS.subscriptions, JSON.stringify([...subscriptions]));
}

function saveLikes() {
  localStorage.setItem(STORAGE_KEYS.likes, JSON.stringify(postLikes));
}

function saveComments() {
  localStorage.setItem(STORAGE_KEYS.comments, JSON.stringify(postComments));
}

// ══════════════════════════════════════════════════════
//  AUTHENTICATION — Login via Membership No + Mobile
// ══════════════════════════════════════════════════════

loadPersistedData();

// Check if already logged in
if (currentMember) {
  showDashboard();
}

document.getElementById('memberLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const memberNo = document.getElementById('loginMembershipNo').value.trim();
  const mobile = document.getElementById('loginMobile').value.trim().replace(/\D/g, '');
  const loginBtn = document.getElementById('loginBtn');
  const errorEl = document.getElementById('loginError');

  // Validation
  if (!memberNo) {
    showLoginError('Please enter your Membership No.');
    return;
  }
  if (!mobile || mobile.length < 10) {
    showLoginError('Please enter a valid 10-digit mobile number.');
    return;
  }

  loginBtn.classList.add('loading');
  errorEl.style.display = 'none';

  try {
    // Fetch all members for client-side matching
    // NOTE: This approach is used because the public API masks mobile numbers (e.g., ******9999).
    // We match the membership_no exact and the mobile number's LAST 4 DIGITS against the masked data.
    const res = await fetch(`${API}/api/members`);
    if (!res.ok) throw new Error('Failed to connect to server');

    const members = await res.json();

    // Find member by membership_no AND mobile (last 4 digits)
    const found = members.find(m => {
      const mNo = String(m.membership_no || '').trim();

      // API returns masked mobile (e.g. ******9999)
      const apiMobile = String(m.mobile || '').trim();
      const inputLast4 = mobile.slice(-4);

      // We check if:
      // 1. Membership No matches exactly
      // 2. The masked API mobile ends with the last 4 digits of the input mobile
      return mNo === memberNo && apiMobile.endsWith(inputLast4);
    });

    if (!found) {
      showLoginError('No matching member found. Please check your Membership No. and Mobile.');
      return;
    }

    // Success — Store member
    currentMember = found;
    // ensure we have an ID
    if (!currentMember.id && currentMember.membership_no) {
      currentMember.id = currentMember._id || currentMember.membership_no;
    }

    // Check if there is more detailed data available (optional)
    try {
      const detailRes = await fetch(`${API}/api/members/${currentMember._id || currentMember.membership_no}`);
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        currentMember = { ...currentMember, ...detailData };
      }
    } catch (ignore) { }

    localStorage.setItem(STORAGE_KEYS.member, JSON.stringify(currentMember));

    showDashboard();
    portalToast('Login successful! Welcome ' + (found.name || 'Member'), 'success');

  } catch (err) {
    console.error('Login error:', err);
    showLoginError('Server error. Please try again later.');
  } finally {
    loginBtn.classList.remove('loading');
  }
});

function showLoginError(msg) {
  const el = document.getElementById('loginError');
  el.textContent = msg;
  el.style.display = 'block';
}

function memberLogout() {
  currentMember = null;
  localStorage.removeItem(STORAGE_KEYS.member);
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('portalDashboard').classList.remove('active');
  document.getElementById('memberLoginForm').reset();
  portalToast('Logged out successfully', 'info');
}

// ═══════════════════════════════════════════════════
//  DASHBOARD — Show after login
// ═══════════════════════════════════════════════════

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('portalDashboard').classList.add('active');

  updateDashHeader();
  loadAllMembers();
  renderProfile();
  renderFeed();
  renderGallery();
}

function updateDashHeader() {
  if (!currentMember) return;
  const name = currentMember.name || 'Member';
  const initials = getInitial(name);

  document.getElementById('dashUserName').textContent = name;
  document.getElementById('dashAvatar').textContent = initials;
  document.getElementById('dashUserMeta').innerHTML = `
    <span class="lang-or">#${currentMember.membership_no || '—'} • ${currentMember.district || ''}</span>
    <span class="lang-en">#${currentMember.membership_no || '—'} • ${currentMember.district || ''}</span>
  `;

  // Feed avatar
  const feedAvatar = document.getElementById('feedAvatar');
  if (feedAvatar) feedAvatar.textContent = initials;
}

// ═══════════════════════════════════════════════════
//  TAB SWITCHING
// ═══════════════════════════════════════════════════

function switchTab(tab) {
  document.querySelectorAll('.dash-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.querySelectorAll('.dash-panel').forEach(p => {
    p.classList.toggle('active', p.id === `panel-${tab}`);
  });

  // Lazy-load sections
  if (tab === 'profile') renderProfile();
  if (tab === 'gallery') renderGallery();
  if (tab === 'members') renderPortalMembers();
  if (tab === 'feed') renderFeed();
}

// ═══════════════════════════════════════════════════
//  PROFILE
// ═══════════════════════════════════════════════════

function renderProfile() {
  if (!currentMember) return;
  const m = currentMember;
  const ini = getInitial(m.name);

  // Sidebar
  document.getElementById('profileSidebar').innerHTML = `
    <div class="profile-avatar-wrap">
      <div class="profile-avatar-fallback">${ini}</div>
      <label class="profile-avatar-edit" title="Change photo">
        📷
        <input type="file" accept="image/*" style="display:none" onchange="handleAvatarUpload(event)" />
      </label>
    </div>
    <div class="profile-name-display">${escHtml(m.name || '—')}</div>
    <div class="profile-membership-no">#${escHtml(m.membership_no || '—')}</div>
    <div class="profile-location-badge">
      📍 ${escHtml(m.village || '')}${m.district ? ', ' + escHtml(m.district) : ''}
    </div>
    <div class="profile-stats-row">
      <div class="profile-stat">
        <div class="profile-stat-value">${memberPhotos.length}</div>
        <div class="profile-stat-label">
          <span class="lang-or">ଫଟୋ</span>
          <span class="lang-en">Photos</span>
        </div>
      </div>
      <div class="profile-stat">
        <div class="profile-stat-value">${communityPosts.filter(p => p.authorId === (m._id || m.id)).length}</div>
        <div class="profile-stat-label">
          <span class="lang-or">ପୋଷ୍ଟ</span>
          <span class="lang-en">Posts</span>
        </div>
      </div>
      <div class="profile-stat">
        <div class="profile-stat-value">${subscriptions.size}</div>
        <div class="profile-stat-label">
          <span class="lang-or">ସବସ୍କ୍ରିପ୍ସନ</span>
          <span class="lang-en">Following</span>
        </div>
      </div>
    </div>
  `;

  // Details card
  document.getElementById('profileDetails').innerHTML = `
    <div class="profile-details-title">
      <span>
        <span class="lang-or">ବ୍ୟକ୍ତିଗତ ବିବରଣୀ</span>
        <span class="lang-en">Personal Details</span>
      </span>
      <button class="edit-profile-btn" onclick="openEditProfile()">
        ✏️
        <span class="lang-or">ସଂପାଦନ</span>
        <span class="lang-en">Edit</span>
      </button>
    </div>
    <div class="profile-fields">
      <div class="profile-field">
        <div class="profile-field-label">
          <span class="lang-or">ସଦସ୍ୟ ନଂ.</span>
          <span class="lang-en">Membership No.</span>
        </div>
        <div class="profile-field-value">${escHtml(m.membership_no || '—')}</div>
      </div>
      <div class="profile-field">
        <div class="profile-field-label">
          <span class="lang-or">ନାମ</span>
          <span class="lang-en">Name</span>
        </div>
        <div class="profile-field-value">${escHtml(m.name || '—')}</div>
      </div>
      <div class="profile-field">
        <div class="profile-field-label">
          <span class="lang-or">ମୋବାଇଲ</span>
          <span class="lang-en">Mobile</span>
        </div>
        <div class="profile-field-value">${escHtml(m.mobile || '—')}</div>
      </div>
      <div class="profile-field">
        <div class="profile-field-label">
          <span class="lang-or">ଆଧାର</span>
          <span class="lang-en">Aadhaar</span>
        </div>
        <div class="profile-field-value">${escHtml(m.aadhar_number || '—')}</div>
      </div>
      <div class="profile-field full-width">
        <div class="profile-field-label">
          <span class="lang-or">ଠିକଣା</span>
          <span class="lang-en">Address</span>
        </div>
        <div class="profile-field-value">${escHtml(m.address || '—')}</div>
      </div>
      <div class="profile-field">
        <div class="profile-field-label">
          <span class="lang-or">ଜିଲ୍ଲା</span>
          <span class="lang-en">District</span>
        </div>
        <div class="profile-field-value">${escHtml(m.district || '—')}</div>
      </div>
      <div class="profile-field">
        <div class="profile-field-label">
          <span class="lang-or">ତାଳୁକା</span>
          <span class="lang-en">Taluka</span>
        </div>
        <div class="profile-field-value">${escHtml(m.taluka || '—')}</div>
      </div>
      <div class="profile-field">
        <div class="profile-field-label">
          <span class="lang-or">ପଞ୍ଚାୟତ</span>
          <span class="lang-en">Panchayat</span>
        </div>
        <div class="profile-field-value">${escHtml(m.panchayat || '—')}</div>
      </div>
      <div class="profile-field">
        <div class="profile-field-label">
          <span class="lang-or">ଗ୍ରାମ</span>
          <span class="lang-en">Village</span>
        </div>
        <div class="profile-field-value">${escHtml(m.village || '—')}</div>
      </div>
      <div class="profile-field">
        <div class="profile-field-label">
          <span class="lang-or">ପୁରୁଷ</span>
          <span class="lang-en">Male Members</span>
        </div>
        <div class="profile-field-value">${m.male || 0}</div>
      </div>
      <div class="profile-field">
        <div class="profile-field-label">
          <span class="lang-or">ମହିଳା</span>
          <span class="lang-en">Female Members</span>
        </div>
        <div class="profile-field-value">${m.female || 0}</div>
      </div>
    </div>
  `;

  // Family section
  const familyMembers = m.family_members || [];
  const familyHtml = familyMembers.length > 0
    ? familyMembers.map(fm => `
      <div class="family-member-card">
        <div class="family-member-avatar">${getInitial(fm.name)}</div>
        <div class="family-member-info">
          <h4>${escHtml(fm.name || 'Unknown')}</h4>
          <p>${escHtml(fm.relation || '')} • ${escHtml(fm.gender || '')}${fm.age ? ' • ' + fm.age + ' yrs' : ''}</p>
        </div>
      </div>
    `).join('')
    : `<div class="empty-state">
        <div class="empty-icon">👨‍👩‍👧‍👦</div>
        <h4>
          <span class="lang-or">ପରିବାର ସଦସ୍ୟ ଯୋଡ଼ାଯାଇ ନାହିଁ</span>
          <span class="lang-en">No family members added</span>
        </h4>
        <p>
          <span class="lang-or">ଆଡମିନଙ୍କ ମାଧ୍ୟମରେ ପରିବାର ସଦସ୍ୟ ଯୋଡ଼ନ୍ତୁ</span>
          <span class="lang-en">Family members can be added through admin</span>
        </p>
      </div>`;

  document.getElementById('familySection').innerHTML = `
    <h3>
      👨‍👩‍👧‍👦
      <span class="lang-or">ପରିବାର ସଦସ୍ୟ</span>
      <span class="lang-en">Family Members</span>
    </h3>
    <div class="family-list">${familyHtml}</div>
  `;
}

// ═══════════════════════════════════════════════════
//  EDIT PROFILE
// ═══════════════════════════════════════════════════

function openEditProfile() {
  if (!currentMember) return;
  const m = currentMember;

  document.getElementById('editName').value = m.name || '';
  document.getElementById('editMobile').value = m.mobile || '';
  document.getElementById('editAadhar').value = m.aadhar_number || '';
  document.getElementById('editAddress').value = m.address || '';
  document.getElementById('editDistrict').value = m.district || '';
  document.getElementById('editTaluka').value = m.taluka || '';
  document.getElementById('editPanchayat').value = m.panchayat || '';
  document.getElementById('editVillage').value = m.village || '';

  openModal('editProfileModal');
}

document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentMember) return;

  const memberId = currentMember._id || currentMember.id || currentMember.membership_no;
  const updatedData = {
    name: document.getElementById('editName').value.trim(),
    mobile: document.getElementById('editMobile').value.trim(),
    aadhar_number: document.getElementById('editAadhar').value.trim(),
    address: document.getElementById('editAddress').value.trim(),
    district: document.getElementById('editDistrict').value.trim(),
    taluka: document.getElementById('editTaluka').value.trim(),
    panchayat: document.getElementById('editPanchayat').value.trim(),
    village: document.getElementById('editVillage').value.trim()
  };

  try {
    const res = await fetch(`${API}/api/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });

    if (!res.ok) {
      // Try fallback if strict JSON response is not returned
      try {
        const errData = await res.json();
        throw new Error(errData.message || 'Update failed');
      } catch (e) {
        throw new Error('Update failed (Server Error)');
      }
    }

    // Update local state
    Object.assign(currentMember, updatedData);
    localStorage.setItem(STORAGE_KEYS.member, JSON.stringify(currentMember));

    closeModal('editProfileModal');
    renderProfile();
    updateDashHeader();
    portalToast('Profile updated successfully!', 'success');

  } catch (err) {
    console.error('Update error:', err);
    portalToast('Failed to update profile: ' + err.message, 'error');
  }
});

function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    // Store as the first photo
    const photoData = {
      id: generateId(),
      src: e.target.result,
      caption: 'Profile Photo',
      date: new Date().toISOString(),
      likes: 0
    };

    // Add to photos if not already there
    memberPhotos.unshift(photoData);
    savePhotos();
    renderProfile();
    renderGallery();
    portalToast('Profile photo updated!', 'success');
  };
  reader.readAsDataURL(file);
}

// ═══════════════════════════════════════════════════
//  PHOTO GALLERY
// ═══════════════════════════════════════════════════

function handlePhotoUpload(event) {
  const files = event.target.files;
  if (!files.length) return;

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const photo = {
        id: generateId(),
        src: e.target.result,
        caption: file.name.replace(/\.[^/.]+$/, ''),
        date: new Date().toISOString(),
        likes: 0
      };
      memberPhotos.unshift(photo);
      savePhotos();
      renderGallery();
      renderProfile(); // Update photo count
    };
    reader.readAsDataURL(file);
  });

  event.target.value = ''; // Reset input
  portalToast(`${files.length} photo(s) uploaded!`, 'success');
}

function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  let html = `
    <div class="gallery-upload-zone" onclick="document.getElementById('photoUploadInput').click()">
      <div class="upload-icon">📤</div>
      <span>
        <span class="lang-or">ଫଟୋ ଅପଲୋଡ</span>
        <span class="lang-en">Upload Photo</span>
      </span>
    </div>
  `;

  if (memberPhotos.length === 0) {
    html += `
      <div class="empty-state" style="grid-column: 2 / -1;">
        <div class="empty-icon">📷</div>
        <h4>
          <span class="lang-or">କୌଣସି ଫଟୋ ନାହିଁ</span>
          <span class="lang-en">No photos yet</span>
        </h4>
        <p>
          <span class="lang-or">ଆପଣଙ୍କ ପ୍ରଥମ ଫଟୋ ଅପଲୋଡ କରନ୍ତୁ!</span>
          <span class="lang-en">Upload your first photo!</span>
        </p>
      </div>
    `;
  } else {
    html += memberPhotos.map(photo => `
      <div class="gallery-item" onclick="openLightbox('${photo.src}')">
        <img src="${photo.src}" alt="${escHtml(photo.caption)}" loading="lazy" />
        <div class="gallery-item-overlay">
          <div class="gallery-stats">
            <span>❤️ ${photo.likes || 0}</span>
            <span>${timeAgo(photo.date)}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  grid.innerHTML = html;
}

function openLightbox(src) {
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightbox').classList.add('active');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
}

// Close lightbox on ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLightbox();
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
  }
});

// ═══════════════════════════════════════════════════
//  COMMUNITY FEED — Posts, Likes, Comments
// ═══════════════════════════════════════════════════

function renderFeed() {
  const container = document.getElementById('postsContainer');
  if (!container) return;

  if (communityPosts.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="background: var(--portal-surface); border-radius: var(--portal-radius-lg); padding: 3rem;">
        <div class="empty-icon">📰</div>
        <h4>
          <span class="lang-or">କୌଣସି ପୋଷ୍ଟ ନାହିଁ</span>
          <span class="lang-en">No posts yet</span>
        </h4>
        <p>
          <span class="lang-or">ସମ୍ପ୍ରଦାୟ ସହ ପ୍ରଥମ ପୋଷ୍ଟ ସେୟାର କରନ୍ତୁ!</span>
          <span class="lang-en">Share the first post with the community!</span>
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = communityPosts.map(post => {
    const isLiked = postLikes[post.id] || false;
    const comments = postComments[post.id] || [];
    const likeCount = (post.likes || 0) + (isLiked ? 1 : 0);

    let imagesHtml = '';
    if (post.images && post.images.length > 0) {
      if (post.images.length === 1) {
        imagesHtml = `
          <div class="post-images">
            <img src="${post.images[0]}" alt="Post image" onclick="openLightbox('${post.images[0]}')" />
          </div>`;
      } else {
        imagesHtml = `
          <div class="post-images">
            <div class="post-images-grid">
              ${post.images.slice(0, 4).map(img => `
                <img src="${img}" alt="Post image" onclick="openLightbox('${img}')" />
              `).join('')}
            </div>
          </div>`;
      }
    }

    const commentsHtml = comments.map(c => `
      <div class="comment-item">
        <div class="comment-avatar">${getInitial(c.author)}</div>
        <div>
          <div class="comment-bubble">
            <div class="comment-author">${escHtml(c.author)}</div>
            <div class="comment-text">${escHtml(c.text)}</div>
          </div>
          <div class="comment-time">${timeAgo(c.date)}</div>
        </div>
      </div>
    `).join('');

    return `
      <div class="post-card" id="post-${post.id}">
        <div class="post-header">
          <div class="post-avatar">${getInitial(post.authorName)}</div>
          <div class="post-author">
            <div class="post-author-name">${escHtml(post.authorName)}</div>
            <div class="post-author-meta">${timeAgo(post.date)}${post.location ? ' • 📍 ' + escHtml(post.location) : ''}</div>
          </div>
          ${post.authorId === (currentMember?._id || currentMember?.id || currentMember?.membership_no) ?
        `<button class="post-menu-btn" onclick="deletePost('${post.id}')" title="Delete">🗑️</button>` : ''}
        </div>
        <div class="post-content">${escHtml(post.text)}</div>
        ${imagesHtml}
        <div class="post-stats">
          <span>${likeCount > 0 ? `❤️ ${likeCount} likes` : ''}</span>
          <span onclick="toggleComments('${post.id}')">${comments.length > 0 ? `💬 ${comments.length} comments` : ''}</span>
        </div>
        <div class="post-actions-bar">
          <button class="post-action-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
            <span class="action-icon">${isLiked ? '❤️' : '🤍'}</span>
            <span>
              <span class="lang-or">ଲାଇକ</span>
              <span class="lang-en">Like</span>
            </span>
          </button>
          <button class="post-action-btn" onclick="toggleComments('${post.id}')">
            <span class="action-icon">💬</span>
            <span>
              <span class="lang-or">ମନ୍ତବ୍ୟ</span>
              <span class="lang-en">Comment</span>
            </span>
          </button>
          <button class="post-action-btn" onclick="sharePost('${post.id}')">
            <span class="action-icon">📤</span>
            <span>
              <span class="lang-or">ସେୟାର</span>
              <span class="lang-en">Share</span>
            </span>
          </button>
        </div>
        <div class="post-comments" id="comments-${post.id}">
          ${commentsHtml}
          <div class="comment-input-wrap">
            <input type="text" class="comment-input" id="commentInput-${post.id}"
              placeholder="Write a comment..." onkeydown="if(event.key==='Enter')submitComment('${post.id}')" />
            <button class="comment-send-btn" onclick="submitComment('${post.id}')">➤</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleLike(postId) {
  postLikes[postId] = !postLikes[postId];
  saveLikes();
  renderFeed();
}

function toggleComments(postId) {
  const commentsSection = document.getElementById(`comments-${postId}`);
  if (commentsSection) {
    commentsSection.classList.toggle('open');
    if (commentsSection.classList.contains('open')) {
      const input = document.getElementById(`commentInput-${postId}`);
      if (input) input.focus();
    }
  }
}

function submitComment(postId) {
  const input = document.getElementById(`commentInput-${postId}`);
  if (!input || !input.value.trim()) return;

  if (!postComments[postId]) postComments[postId] = [];
  postComments[postId].push({
    id: generateId(),
    author: currentMember?.name || 'Anonymous',
    text: input.value.trim(),
    date: new Date().toISOString()
  });

  saveComments();
  input.value = '';
  renderFeed();

  // Re-open comments section after re-render
  setTimeout(() => {
    const section = document.getElementById(`comments-${postId}`);
    if (section) section.classList.add('open');
  }, 50);
}

function deletePost(postId) {
  if (!confirm('Delete this post?')) return;
  communityPosts = communityPosts.filter(p => p.id !== postId);
  savePosts();
  renderFeed();
  portalToast('Post deleted', 'info');
}

function sharePost(postId) {
  const post = communityPosts.find(p => p.id === postId);
  if (!post) return;

  if (navigator.share) {
    navigator.share({
      title: 'Pandara Samaja Post',
      text: post.text,
      url: window.location.href
    }).catch(() => { });
  } else {
    // Fallback — copy to clipboard
    navigator.clipboard.writeText(post.text).then(() => {
      portalToast('Post text copied!', 'success');
    }).catch(() => { });
  }
}

// ═══════════════════════════════════════════════════
//  COMPOSE POST
// ═══════════════════════════════════════════════════

function openComposeModal(mode) {
  composePhotos = [];
  document.getElementById('composeText').value = '';
  document.getElementById('composeMediaPreview').innerHTML = '';
  openModal('composeModal');

  if (mode === 'photo') {
    setTimeout(() => document.getElementById('composePhotoInput').click(), 300);
  } else {
    setTimeout(() => document.getElementById('composeText').focus(), 300);
  }
}

function handleComposePhoto(event) {
  const files = event.target.files;
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      composePhotos.push(e.target.result);
      renderComposePreview();
    };
    reader.readAsDataURL(file);
  });
  event.target.value = '';
}

function renderComposePreview() {
  const preview = document.getElementById('composeMediaPreview');
  preview.innerHTML = composePhotos.map((src, i) => `
    <div class="compose-preview-item">
      <img src="${src}" alt="Preview" />
      <button class="compose-preview-remove" onclick="removeComposePhoto(${i})">✕</button>
    </div>
  `).join('');
}

function removeComposePhoto(index) {
  composePhotos.splice(index, 1);
  renderComposePreview();
}

document.getElementById('composePostForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = document.getElementById('composeText').value.trim();

  if (!text && composePhotos.length === 0) {
    portalToast('Please write something or add a photo', 'error');
    return;
  }

  const post = {
    id: generateId(),
    authorId: currentMember?._id || currentMember?.id || currentMember?.membership_no,
    authorName: currentMember?.name || 'Anonymous',
    location: currentMember?.village || '',
    text: text,
    images: [...composePhotos],
    date: new Date().toISOString(),
    likes: 0
  };

  communityPosts.unshift(post);
  savePosts();

  // Also add images to gallery
  composePhotos.forEach(src => {
    memberPhotos.unshift({
      id: generateId(),
      src: src,
      caption: 'Post photo',
      date: new Date().toISOString(),
      likes: 0
    });
  });
  if (composePhotos.length > 0) savePhotos();

  closeModal('composeModal');
  renderFeed();
  renderProfile();
  renderGallery();
  portalToast('Post published!', 'success');
});

// ═══════════════════════════════════════════════════
//  MEMBERS DIRECTORY (with Subscribe)
// ═══════════════════════════════════════════════════

async function loadAllMembers() {
  try {
    const res = await fetch(`${API}/api/members`);
    if (!res.ok) throw new Error('Failed to load');
    allPortalMembers = await res.json();
    renderSidebarMembers();
    renderPortalMembers();
  } catch (err) {
    console.error('Failed to load members:', err);
  }
}

function renderSidebarMembers() {
  const container = document.getElementById('sidebarMembers');
  if (!container) return;

  const myId = currentMember?._id || currentMember?.id || currentMember?.membership_no;
  const others = allPortalMembers.filter(m => (m._id || m.id || m.membership_no) !== myId).slice(0, 5);

  if (others.length === 0) {
    container.innerHTML = '<p style="font-size:0.85rem; color:var(--portal-text-secondary);">No other members yet</p>';
    return;
  }

  container.innerHTML = others.map(m => {
    const mid = m._id || m.id || m.membership_no;
    const isSub = subscriptions.has(mid);
    return `
      <div class="subscriber-item">
        <div class="subscriber-avatar">${getInitial(m.name)}</div>
        <div class="subscriber-name">${escHtml(m.name || 'Member')}</div>
        <button class="subscribe-btn ${isSub ? 'subscribed' : ''}"
          onclick="toggleSubscribe('${mid}', this)">
          ${isSub ? '✓' : '+'}
        </button>
      </div>
    `;
  }).join('');
}

function renderPortalMembers(filter = '') {
  const container = document.getElementById('portalMembersGrid');
  if (!container) return;

  const myId = currentMember?._id || currentMember?.id || currentMember?.membership_no;
  let members = allPortalMembers.filter(m => (m._id || m.id || m.membership_no) !== myId);

  if (filter) {
    const lf = filter.toLowerCase();
    members = members.filter(m =>
      (m.name || '').toLowerCase().includes(lf) ||
      (m.village || '').toLowerCase().includes(lf) ||
      (m.district || '').toLowerCase().includes(lf) ||
      (m.membership_no || '').toLowerCase().includes(lf)
    );
  }

  if (members.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-icon">👥</div>
        <h4>
          <span class="lang-or">କୌଣସି ସଦସ୍ୟ ମିଳିଲା ନାହିଁ</span>
          <span class="lang-en">No members found</span>
        </h4>
      </div>
    `;
    return;
  }

  container.innerHTML = members.map(m => {
    const mid = m._id || m.id || m.membership_no;
    const isSub = subscriptions.has(mid);
    return `
      <div style="background: var(--portal-surface); border-radius: var(--portal-radius-lg); box-shadow: var(--portal-shadow); padding: 1.25rem; display:flex; align-items:center; gap:1rem; transition: var(--portal-transition);">
        <div style="width:50px; height:50px; border-radius:50%; background:linear-gradient(135deg, var(--portal-primary), var(--portal-primary-light)); color:white; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:1rem; flex-shrink:0;">
          ${getInitial(m.name)}
        </div>
        <div style="flex:1; overflow:hidden;">
          <div style="font-weight:600; font-size:0.95rem;">${escHtml(m.name || 'Member')}</div>
          <div style="font-size:0.75rem; color:var(--portal-text-secondary);">
            #${escHtml(m.membership_no || '—')} • ${escHtml(m.village || '')}${m.district ? ', ' + escHtml(m.district) : ''}
          </div>
        </div>
        <button class="subscribe-btn ${isSub ? 'subscribed' : ''}"
          onclick="toggleSubscribe('${mid}', this)">
          ${isSub ? '✓ Following' : '+ Follow'}
        </button>
      </div>
    `;
  }).join('');
}

function searchPortalMembers(query) {
  renderPortalMembers(query);
}

function toggleSubscribe(memberId, btn) {
  if (subscriptions.has(memberId)) {
    subscriptions.delete(memberId);
    if (btn) {
      btn.classList.remove('subscribed');
      btn.textContent = btn.textContent.includes('Follow') ? '+ Follow' : '+';
    }
  } else {
    subscriptions.add(memberId);
    if (btn) {
      btn.classList.add('subscribed');
      btn.textContent = btn.textContent.includes('Follow') ? '✓ Following' : '✓';
    }
  }
  saveSubscriptions();
  renderProfile(); // Update count
}

// ═══════════════════════════════════════════════════
//  MODAL HELPERS
// ═══════════════════════════════════════════════════

function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Close modal on outside click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
});
