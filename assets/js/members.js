/* assets/js/members.js – Netflix-Level Member Directory v2
   Features: Expandable cards, Search, Responsive table, View toggle */

let allMembers = [];
let dataTable = null;
let currentFiltered = []; // track filtered list for search

// ── Auth helpers ─────────────────────────────────────────────
function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ── DOM refs ─────────────────────────────────────────────────
const districtSelect = document.getElementById('districtSelect');
const talukaSelect = document.getElementById('talukaSelect');
const panchayatSelect = document.getElementById('panchayatSelect');
const leaderContainer = document.getElementById('leaderContainer');

// ── Leader images ────────────────────────────────────────────
const districtLeaderImages = {
  "GANJAM": [
    { "name": "Ashok Kumar Badatya", "src": "assets/img/GANJAM/Ashok Kumar Badatya.png" },
    { "name": "Hrisikesh Badatya", "src": "assets/img/GANJAM/Hrisikesh Badatya.png" },
    { "name": "Pramod Badatya", "src": "assets/img/GANJAM/Pramod Badatya.png" },
    { "name": "Santosh Badatya", "src": "assets/img/GANJAM/Santosh Badatya.png" },
    { "name": "Jagannath Badatya", "src": "assets/img/GANJAM/Jagannath Badatya.png" },
    { "name": "BanchhaNidhi Behera", "src": "assets/img/GANJAM/BanchhaNidhi Behera.png" },
    { "name": "Santosh", "src": "assets/img/GANJAM/Santosh.png" },
    { "name": "Sudama Behera", "src": "assets/img/GANJAM/Sudama Behera.png" },
    { "name": "Susanta Kumar Badatya", "src": "assets/img/GANJAM/Susanta Kumar Badatya.png" },
    { "name": "Trilochan Badatya", "src": "assets/img/GANJAM/Trilochan Badatya.png" },
    { "name": "Upendra Badatya", "src": "assets/img/GANJAM/Upendra Badatya.png" }
  ],
  "JHARSAGUDA": [
    { "name": "RankaMani Badatya", "src": "assets/img/JHARSAGUDA/RankaMani Badatya.jpg" },
    { "name": "Dhoba Badatya", "src": "assets/img/JHARSAGUDA/Dhoba Badatya.jpg" },
    { "name": "Manoj Kumar Badatya", "src": "assets/img/JHARSAGUDA/Manoj Kumar Badatya.jpg" },
    { "name": "Dillip Kumar Badatya", "src": "assets/img/JHARSAGUDA/Dillip Kumar Badatya.jpg" },
    { "name": "Manoranjan Badatya", "src": "assets/img/JHARSAGUDA/Manoranjan Badatya.jpg" },
    { "name": "Tuna Badatya", "src": "assets/img/JHARSAGUDA/Tuna Badatya.jpg" }
  ],
  "SAMBALAPUR": [

    { "name": "IMG-20250630-WA0003", "src": "assets/img/SAMBALAPUR/IMG-20250630-WA0003.jpg" },
    { "name": "IMG-20250630-WA0002", "src": "assets/img/SAMBALAPUR/IMG-20250630-WA0002.jpg" },
    { "name": "IMG-20250630-WA0006", "src": "assets/img/SAMBALAPUR/IMG-20250630-WA0006.jpg" },
    { "name": "IMG-20250630-WA0005", "src": "assets/img/SAMBALAPUR/IMG-20250630-WA0005.jpg" },
    { "name": "IMG-20250630-WA0001", "src": "assets/img/SAMBALAPUR/IMG-20250630-WA0001.jpg" },
    { "name": "IMG-20250630-WA0004", "src": "assets/img/SAMBALAPUR/IMG-20250630-WA0004.jpg" },
    { "name": "IMG-20250630-WA0008", "src": "assets/img/SAMBALAPUR/IMG-20250630-WA0008.jpg" },
    { "name": "IMG-20250630-WA0007", "src": "assets/img/SAMBALAPUR/IMG-20250630-WA0007.jpg" },
    { "name": "IMG-20250711-WA0011", "src": "assets/img/SAMBALAPUR/IMG-20250711-WA0011.jpg" },
    { "name": "IMG-20250711-WA0013", "src": "assets/img/SAMBALAPUR/IMG-20250711-WA0013.jpg" },
    { "name": "IMG-20250711-WA0014", "src": "assets/img/SAMBALAPUR/IMG-20250711-WA0014.jpg" },
    { "name": "IMG-20250711-WA0018", "src": "assets/img/SAMBALAPUR/IMG-20250711-WA0018.jpg" }
  ]
};

function showLeader(district) {
  const leaders = districtLeaderImages[district];
  if (!leaders || leaders.length === 0) {
    leaderContainer.style.display = 'none';
    return;
  }

  leaderContainer.style.display = '';
  leaderContainer.innerHTML = '';

  const galleryDiv = document.createElement('div');
  galleryDiv.style.cssText = 'display:flex;flex-wrap:wrap;gap:1rem;justify-content:center;padding:0.5rem;';
  leaderContainer.appendChild(galleryDiv);

  leaders.forEach((leader) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'text-align:center;max-width:140px;';

    const img = document.createElement('img');
    img.src = leader.src;
    img.alt = leader.name;
    img.loading = 'lazy';
    img.style.cssText = 'max-height:160px;border-radius:12px;box-shadow:0 6px 18px rgba(10,70,150,.12);width:100%;object-fit:cover;';
    img.onerror = function () { wrapper.style.display = 'none'; };

    const nameP = document.createElement('p');
    nameP.style.cssText = 'margin:0.4rem 0 0;font-size:0.75rem;font-weight:600;color:#0a4a96;';
    nameP.textContent = leader.name.replace(/IMG-\d+-WA\d+/i, 'Leader');

    wrapper.appendChild(img);
    wrapper.appendChild(nameP);
    galleryDiv.appendChild(wrapper);
  });
}

/* ════════════════════════════════════════════════════════════════
   UI HELPERS
   ════════════════════════════════════════════════════════════════ */

function maskMobile(mobile) {
  if (!mobile || mobile.length < 4) return '******';
  return '******' + mobile.slice(-4);
}

function maskAadhar(aadhar) {
  if (!aadhar || aadhar.length < 4) return '********';
  return '********' + aadhar.slice(-4);
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function escHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ════════════════════════════════════════════════════════════════
   CARD RENDERING — Batch + Lazy Family Loading for Performance
   ════════════════════════════════════════════════════════════════ */

const BATCH_SIZE = 30; // render this many cards per frame
let renderRAF = null;  // track pending animation frame

function buildCardHtml(m, isAdmin) {
  const initials = getInitials(m.name);
  const mobile = isAdmin ? escHtml(m.mobile || '') : maskMobile(m.mobile || '');
  const aadhar = isAdmin ? escHtml(m.aadhar_no || '') : maskAadhar(m.aadhar_no || '');
  const male = m.male || 0;
  const female = m.female || 0;
  const familyCount = (m.family_members || []).length;

  // Family placeholder — actual table built lazily on first expand
  const familyPlaceholder = familyCount > 0
    ? `<div class="family-lazy-slot" data-loaded="false"></div>`
    : '';

  return `
    <div class="member-card">
      <div class="member-card-header">
        <div class="member-avatar">${initials}</div>
        <div class="member-header-info">
          <div class="member-name">${escHtml(m.name)}</div>
          <div class="member-id">#${escHtml(m.membership_no || '—')}</div>
        </div>
        ${m.district ? `<span class="member-district-badge">${escHtml(m.district)}</span>` : ''}
        <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="member-card-body">
        <div class="member-details">
          <div class="member-detail">
            <span class="detail-icon">📱</span>
            <span class="detail-label">
              <span class="lang-or">ମୋବାଇଲ</span>
              <span class="lang-en">Mobile</span>
            </span>
            <span class="detail-value">${mobile || '—'}</span>
          </div>
          <div class="member-detail">
            <span class="detail-icon">👨‍👩‍👦</span>
            <span class="detail-label">
              <span class="lang-or">ପରିବାର</span>
              <span class="lang-en">Family</span>
            </span>
            <span class="detail-value">${male}M / ${female}F</span>
          </div>
          <div class="member-detail">
            <span class="detail-icon">🪪</span>
            <span class="detail-label">
              <span class="lang-or">ଆଧାର</span>
              <span class="lang-en">Aadhaar</span>
            </span>
            <span class="detail-value">${aadhar || '—'}</span>
          </div>
          <div class="member-detail">
            <span class="detail-icon">📍</span>
            <span class="detail-label">
              <span class="lang-or">ତାଳୁକା</span>
              <span class="lang-en">Taluka</span>
            </span>
            <span class="detail-value">${escHtml(m.taluka || '—')}</span>
          </div>
          <div class="member-detail">
            <span class="detail-icon">🏛️</span>
            <span class="detail-label">
              <span class="lang-or">ପଞ୍ଚାୟତ</span>
              <span class="lang-en">Panchayat</span>
            </span>
            <span class="detail-value">${escHtml(m.panchayat || '—')}</span>
          </div>
          <div class="member-detail">
            <span class="detail-icon">🏘️</span>
            <span class="detail-label">
              <span class="lang-or">ଗ୍ରାମ</span>
              <span class="lang-en">Village</span>
            </span>
            <span class="detail-value">${escHtml(m.village || '—')}</span>
          </div>
          <div class="member-detail full-width">
            <span class="detail-icon">🏠</span>
            <span class="detail-label">
              <span class="lang-or">ଠିକଣା</span>
              <span class="lang-en">Address</span>
            </span>
            <span class="detail-value">${escHtml(m.address || '—')}</span>
          </div>
        </div>
        ${familyPlaceholder}
      </div>
    </div>`;
}

function buildFamilyHtml(familyMembers) {
  return `
    <div class="family-members-section">
      <div class="family-section-header">
        <span class="detail-icon">👨‍👩‍👧‍👦</span>
        <span class="family-section-title">
          <span class="lang-or">ପରିବାର ସଦସ୍ୟ</span>
          <span class="lang-en">Family Members</span>
        </span>
        <span class="family-count-badge">${familyMembers.length}</span>
      </div>
      <table class="family-table">
        <thead>
          <tr>
            <th><span class="lang-or">ନାମ</span><span class="lang-en">Name</span></th>
            <th><span class="lang-or">ବୟସ</span><span class="lang-en">Age</span></th>
            <th><span class="lang-or">ଲିଙ୍ଗ</span><span class="lang-en">Gender</span></th>
            <th><span class="lang-or">ସମ୍ପର୍କ</span><span class="lang-en">Relation</span></th>
          </tr>
        </thead>
        <tbody>
          ${familyMembers.map(fm => `
            <tr>
              <td>${escHtml(fm.name || '—')}</td>
              <td>${fm.age || '—'}</td>
              <td>
                <span class="gender-badge gender-${(fm.gender || '').toLowerCase()}">
                  ${fm.gender === 'Male' ? '♂' : fm.gender === 'Female' ? '♀' : ''} ${escHtml(fm.gender || '—')}
                </span>
              </td>
              <td>${escHtml(fm.relation || '—')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

function handleCardClick(e) {
  const card = e.currentTarget;
  card.classList.toggle('expanded');

  // Lazy-load family table on first expand
  if (card.classList.contains('expanded')) {
    const slot = card.querySelector('.family-lazy-slot[data-loaded="false"]');
    if (slot) {
      const idx = parseInt(card.dataset.memberIdx, 10);
      const m = card._memberRef;
      if (m && m.family_members && m.family_members.length > 0) {
        slot.innerHTML = buildFamilyHtml(m.family_members);
        slot.dataset.loaded = 'true';
      }
    }
  }
}

function renderCards(members) {
  const grid = document.getElementById('membersGrid');
  if (!grid) return;

  // Cancel any pending batch render
  if (renderRAF) {
    cancelAnimationFrame(renderRAF);
    renderRAF = null;
  }

  const isAdmin = localStorage.getItem("isAdmin") === "true";

  if (members.length === 0) {
    grid.innerHTML = `
      <div class="members-empty" style="grid-column:1/-1;">
        <div class="empty-icon">🔍</div>
        <p><span class="lang-or">କୌଣସି ସଦସ୍ୟ ମିଳିଲା ନାହିଁ</span>
           <span class="lang-en">No members found</span></p>
      </div>`;
    grid.style.display = 'grid';
    return;
  }

  // Clear grid
  grid.innerHTML = '';
  grid.style.display = 'grid';

  let offset = 0;

  function renderBatch() {
    const end = Math.min(offset + BATCH_SIZE, members.length);
    const fragment = document.createDocumentFragment();

    for (let i = offset; i < end; i++) {
      const m = members[i];
      const tmp = document.createElement('div');
      tmp.innerHTML = buildCardHtml(m, isAdmin);
      const card = tmp.firstElementChild;
      card.dataset.memberIdx = i;
      card._memberRef = m; // store reference for lazy family load
      card.addEventListener('click', handleCardClick);
      fragment.appendChild(card);
    }

    grid.appendChild(fragment);
    offset = end;

    if (offset < members.length) {
      renderRAF = requestAnimationFrame(renderBatch);
    }
  }

  // Kick off first batch immediately
  renderBatch();
}

/* ════════════════════════════════════════════════════════════════
   SEARCH — Instant search across all member fields
   ════════════════════════════════════════════════════════════════ */

function setupSearch() {
  const searchInput = document.getElementById('cardSearch');
  const clearBtn = document.getElementById('searchClear');
  const searchWrap = document.getElementById('searchBarWrap');
  if (!searchInput) return;

  let debounceTimer;

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim();

    // Show/hide clear button
    if (clearBtn) {
      clearBtn.classList.toggle('visible', q.length > 0);
    }

    // Debounce search
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      performSearch(q);
    }, 200);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.classList.remove('visible');
      performSearch('');
      searchInput.focus();
    });
  }
}

function performSearch(query) {
  const q = query.toLowerCase();

  let base = currentFiltered; // the dropdown-filtered list

  if (!q) {
    renderCards(base);
    updateResultCount(base.length);
    return;
  }

  const results = base.filter(m => {
    const fields = [
      m.name, m.membership_no, m.mobile,
      m.district, m.taluka, m.panchayat, m.village
    ];
    return fields.some(f => f && f.toLowerCase().includes(q));
  });

  renderCards(results);
  updateResultCount(results.length);
}

/* ════════════════════════════════════════════════════════════════
   STATS — Populate hero stats bar with animated counting
   ════════════════════════════════════════════════════════════════ */

function updateStats(members) {
  const total = members.length;
  const districts = new Set(members.map(m => m.district).filter(Boolean)).size;
  const totalMale = members.reduce((s, m) => s + (parseInt(m.male) || 0), 0);
  const totalFemale = members.reduce((s, m) => s + (parseInt(m.female) || 0), 0);

  animateCount('statTotal', total);
  animateCount('statDistricts', districts);
  animateCount('statMale', totalMale);
  animateCount('statFemale', totalFemale);
}

function animateCount(elId, target) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (target === 0) { el.textContent = '0'; return; }

  let current = 0;
  const step = Math.max(1, Math.ceil(target / 40));
  const interval = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(interval);
    }
    el.textContent = current.toLocaleString();
  }, 30);
}

function updateResultCount(count) {
  const el = document.getElementById('resultCount');
  if (!el) return;
  if (count === allMembers.length) {
    el.innerHTML = `<span class="lang-or">ମୋଟ <strong>${count}</strong> ସଦସ୍ୟ</span>
                    <span class="lang-en">Showing <strong>${count}</strong> members</span>`;
  } else {
    el.innerHTML = `<span class="lang-or"><strong>${count}</strong> ସଦସ୍ୟ ଫିଲ୍ଟର ହୋଇଛି</span>
                    <span class="lang-en">Showing <strong>${count}</strong> of ${allMembers.length} members</span>`;
  }
}

/* ════════════════════════════════════════════════════════════════
   VIEW TOGGLE — Cards ↔ Table
   ════════════════════════════════════════════════════════════════ */

function setupViewToggle() {
  const cardsBtn = document.getElementById('viewCards');
  const tableBtn = document.getElementById('viewTable');
  const grid = document.getElementById('membersGrid');
  const tableCard = document.getElementById('tableCard');
  const searchWrap = document.getElementById('searchBarWrap');

  if (!cardsBtn || !tableBtn) return;

  cardsBtn.addEventListener('click', () => {
    cardsBtn.classList.add('active');
    tableBtn.classList.remove('active');
    if (grid) grid.style.display = 'grid';
    if (tableCard) tableCard.style.display = 'none';
    if (searchWrap) searchWrap.style.display = '';
  });

  tableBtn.addEventListener('click', () => {
    tableBtn.classList.add('active');
    cardsBtn.classList.remove('active');
    if (grid) grid.style.display = 'none';
    if (tableCard) tableCard.style.display = '';
    if (searchWrap) searchWrap.style.display = 'none';
  });
}

/* ════════════════════════════════════════════════════════════════
   RESPONSIVE TABLE — Add data-label attributes for mobile
   ════════════════════════════════════════════════════════════════ */

function addTableDataLabels() {
  const table = document.getElementById('memberTable');
  if (!table) return;

  const columnLabels = ['Membership No.', 'Name', 'Mobile', 'Male', 'Female', 'District', 'Taluka', 'Panchayat', 'Village', 'Aadhaar', 'Address', 'Family Members'];

  // Use MutationObserver to add data-labels whenever rows change
  const observer = new MutationObserver(() => {
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, i) => {
        if (i < columnLabels.length && !cell.hasAttribute('data-label')) {
          cell.setAttribute('data-label', columnLabels[i]);
        }
      });
    });
  });

  observer.observe(table.querySelector('tbody') || table, {
    childList: true,
    subtree: true
  });

  // Also do initial pass
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    cells.forEach((cell, i) => {
      if (i < columnLabels.length) {
        cell.setAttribute('data-label', columnLabels[i]);
      }
    });
  });
}

/* ════════════════════════════════════════════════════════════════
   INIT — Fetch data and set everything up
   ════════════════════════════════════════════════════════════════ */

(async function init() {
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  const skeletonLoader = document.getElementById('skeletonLoader');
  const membersGrid = document.getElementById('membersGrid');
  const memberTable = document.getElementById('memberTable');

  if (memberTable) memberTable.style.display = 'none';

  try {
    const res = await fetch(`${API_BASE_URL}/api/members`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    allMembers = await res.json();
    console.log(`Loaded ${allMembers.length} members`);
  } catch (err) {
    console.error("Failed to load members:", err);
    allMembers = [];

    if (membersGrid) {
      membersGrid.innerHTML = `
        <div class="members-empty" style="grid-column:1/-1;">
          <div class="empty-icon">📋</div>
          <p><span class="lang-or">ସଦସ୍ୟ ତଥ୍ୟ ଶୀଘ୍ର ଉପଲବ୍ଧ ହେବ</span>
             <span class="lang-en">Member data will be available soon.</span></p>
        </div>`;
      membersGrid.style.display = 'grid';
    }
  }

  // Hide skeleton
  if (skeletonLoader) skeletonLoader.style.display = 'none';

  // Set initial filtered list = all members
  currentFiltered = [...allMembers];

  // Render cards + stats
  renderCards(currentFiltered);
  updateStats(allMembers);
  updateResultCount(currentFiltered.length);

  // Show table (hidden by default behind card view)
  if (memberTable) memberTable.style.display = '';

  // Populate District dropdown
  if (allMembers.length > 0) {
    [...new Set(allMembers.map(m => m.district))]
      .filter(Boolean)
      .sort()
      .forEach(d => {
        districtSelect.insertAdjacentHTML('beforeend', `<option value="${d}">${d}</option>`);
      });
  }

  // ── DataTable columns ──────────────────────────────────────
  const columns = [
    { data: 'membership_no', title: 'Membership No.', defaultContent: '' },
    { data: 'name', title: 'Name', defaultContent: '' },
    {
      data: 'mobile', title: 'Mobile', defaultContent: '',
      render: function (data, type) {
        if (type !== 'display') return data;
        return isAdmin ? escHtml(data || '') : maskMobile(data);
      }
    },
    { data: 'male', title: 'Male', defaultContent: '0' },
    { data: 'female', title: 'Female', defaultContent: '0' },
    { data: 'district', title: 'District', defaultContent: '' },
    { data: 'taluka', title: 'Taluka', defaultContent: '' },
    { data: 'panchayat', title: 'Panchayat', defaultContent: '' },
    { data: 'village', title: 'Village', defaultContent: '' },
    {
      data: 'aadhar_no', title: 'Aadhaar', defaultContent: '',
      render: function (data, type) {
        if (type !== 'display') return data;
        return isAdmin ? escHtml(data || '') : maskAadhar(data);
      }
    },
    { data: 'address', title: 'Address', defaultContent: '' },
    {
      data: 'family_members', title: 'Family Members', defaultContent: '—',
      render: function (data, type) {
        if (!data || !Array.isArray(data) || data.length === 0) return '—';
        if (type !== 'display') return data.map(fm => fm.name).join(', ');
        return data.map(fm =>
          `<span class="table-family-chip">${escHtml(fm.name)} <small>(${escHtml(fm.relation)}, ${fm.age || '—'}, ${fm.gender === 'Male' ? '♂' : '♀'})</small></span>`
        ).join(' ');
      }
    }
  ];

  // Admin actions column
  if (isAdmin) {
    const thead = document.querySelector('#memberTable thead tr');
    if (thead && !thead.querySelector('th[data-admin]')) {
      const th = document.createElement('th');
      th.textContent = 'Actions';
      th.setAttribute('data-admin', 'true');
      thead.appendChild(th);
    }

    columns.push({
      data: null, title: 'Actions', orderable: false,
      render: function (data, type, row) {
        const id = row.id || row._id || '';
        return `<button class="btn-delete" data-id="${id}" style="background:#dc3545;color:#fff;border:none;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:0.8rem;">Delete</button>`;
      }
    });
  }

  // Destroy old DataTable
  if ($.fn.DataTable.isDataTable('#memberTable')) {
    $('#memberTable').DataTable().destroy();
    $('#memberTable tbody').empty();
  }

  // Init DataTable
  dataTable = $('#memberTable').DataTable({
    data: allMembers,
    columns: columns,
    dom: 'Bfrtip',
    buttons: ['csv'],
    language: { emptyTable: "No members found" },
    destroy: true,
    scrollX: true, // allow horizontal scroll for wider table
    autoWidth: false,
    drawCallback: function () {
      // Add data-labels for responsive table on every redraw
      addTableDataLabels();
    }
  });

  // Admin delete handler
  if (isAdmin) {
    $('#memberTable tbody').off('click', 'button.btn-delete');
    $('#memberTable tbody').on('click', 'button.btn-delete', async function () {
      const id = $(this).data('id');
      if (!id) return alert("Member ID not found");

      if (confirm('Are you sure you want to delete this member?')) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/members/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to delete: ${errorText}`);
          }

          dataTable.row($(this).parents('tr')).remove().draw();
          allMembers = allMembers.filter(m => (m.id || m._id) != id);

          // Re-render
          const f = getCurrentFilter();
          currentFiltered = filterMembers(f);
          renderCards(currentFiltered);
          updateStats(allMembers);
          updateResultCount(currentFiltered.length);
        } catch (err) {
          alert('Failed to delete member: ' + err.message);
          console.error(err);
        }
      }
    });
  }

  // Setup features
  setupViewToggle();
  setupSearch();
  addTableDataLabels();

})();

/* ════════════════════════════════════════════════════════════════
   CASCADING DROPDOWNS
   ════════════════════════════════════════════════════════════════ */

function getCurrentFilter() {
  return {
    district: districtSelect.value,
    taluka: talukaSelect.value,
    panchayat: panchayatSelect.value
  };
}

districtSelect.addEventListener('change', () => {
  const d = districtSelect.value;
  showLeader(d);

  talukaSelect.disabled = !d;
  talukaSelect.innerHTML = '<option value="">Select Taluka</option>';
  if (d) {
    [...new Set(allMembers.filter(m => m.district === d).map(m => m.taluka))]
      .filter(Boolean).sort()
      .forEach(t => { talukaSelect.insertAdjacentHTML('beforeend', `<option value="${t}">${t}</option>`); });
  }

  panchayatSelect.disabled = true;
  panchayatSelect.innerHTML = '<option value="">Select Panchayat</option>';

  filterAndRender({ district: d });
});

talukaSelect.addEventListener('change', () => {
  const d = districtSelect.value;
  const t = talukaSelect.value;

  panchayatSelect.disabled = !t;
  panchayatSelect.innerHTML = '<option value="">Select Panchayat</option>';
  if (t) {
    [...new Set(allMembers.filter(m => m.district === d && m.taluka === t).map(m => m.panchayat))]
      .filter(Boolean).sort()
      .forEach(p => { panchayatSelect.insertAdjacentHTML('beforeend', `<option value="${p}">${p}</option>`); });
  }

  filterAndRender({ district: d, taluka: t });
});

panchayatSelect.addEventListener('change', () => {
  filterAndRender({
    district: districtSelect.value,
    taluka: talukaSelect.value,
    panchayat: panchayatSelect.value
  });
});

/* ════════════════════════════════════════════════════════════════
   FILTER HELPERS
   ════════════════════════════════════════════════════════════════ */

function filterMembers(f) {
  return allMembers.filter(m =>
    (!f.district || m.district === f.district) &&
    (!f.taluka || m.taluka === f.taluka) &&
    (!f.panchayat || m.panchayat === f.panchayat)
  );
}

function filterAndRender(f) {
  currentFiltered = filterMembers(f);

  // Clear search when filter changes
  const searchInput = document.getElementById('cardSearch');
  const clearBtn = document.getElementById('searchClear');
  if (searchInput) searchInput.value = '';
  if (clearBtn) clearBtn.classList.remove('visible');

  // Update cards
  renderCards(currentFiltered);
  updateResultCount(currentFiltered.length);

  // Update DataTable
  if (dataTable) {
    dataTable.clear().rows.add(currentFiltered).draw();
  }
}