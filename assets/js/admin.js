// File: assets/js/admin.js


const adminLogin = document.getElementById("admin-login");
const adminPanel = document.getElementById("admin-panel");
const adminLoginForm = document.getElementById("adminLoginForm");

// Loader Helpers
function showLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) loader.style.display = "flex";
}

function hideLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) loader.style.display = "none";
}
const addCandidateForm = document.getElementById("addCandidateForm");
const candidatesTableBody = document.getElementById("candidatesTableBody");
const excelInput = document.getElementById("excelFileInput");
const uploadBtn = document.getElementById("uploadExcelBtn");
const excelStatus = document.getElementById("excelStatus");
const postForm = document.getElementById("addPostForm");
const postsTableBody = document.getElementById("postsTableBody");

let candidates = [];
let filteredCandidates = [];
let posts = [];
let filteredPosts = [];



function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function imageURL(raw) {
  if (!raw) return '';
  const m = raw.match(/id=([^&]+)/);
  // Use thumbnail API to avoid excessive 429 errors from Google
  return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w200` : raw;
}

function showSection(id) {
  document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

// Helper function to get auth headers with JWT token
function getAuthHeaders(isFormData = false) {
  const token = localStorage.getItem("adminToken");
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

// Check if token is valid (not expired)
function isTokenValid() {
  const token = localStorage.getItem("adminToken");
  if (!token) return false;

  try {
    // Decode JWT payload (middle part)
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Check if expired (exp is in seconds)
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      // Token expired, clear storage
      localStorage.removeItem("adminToken");
      localStorage.removeItem("isAdmin");
      return false;
    }
    return true;
  } catch (e) {
    // Invalid token format
    return false;
  }
}

// Check if already logged in with valid token
if (localStorage.getItem("isAdmin") === "true" && isTokenValid()) {
  adminLogin.style.display = "none";
  adminPanel.style.display = "block";
  renderCandidates();
} else {
  // Clear invalid session
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("adminToken");
}

// Admin login - calls backend API
adminLoginForm.onsubmit = async function (e) {
  e.preventDefault();
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value.trim();

  try {
    showLoader();
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Login failed");
    }

    const data = await res.json();

    if (data.token) {
      // Store JWT token
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("isAdmin", "true");

      adminLogin.style.display = "none";
      adminPanel.style.display = "block";

      // Show matrimony section by default
      document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
      document.getElementById('matrimonySection').style.display = 'block';

      await renderCandidates();
      showToast("Login successful!", "success");

      // Trigger Security Alert
      sendLoginAlert(user);

      // Start Inactivity Timer
      startInactivityTracking();
    } else {
      throw new Error("No token received from server");
    }
  } catch (err) {
    console.error("Login error:", err);
    console.log("Error details:", err.message);
    showToast(err.message || "Login failed. Please check your credentials.", "error");
  } finally {
    hideLoader();
  }
};

// Send Security Alert Email via Backend (Nodemailer)
async function sendLoginAlert(username) {
  try {
    // 1. Get User IP
    const ipRes = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipRes.json();
    const userIP = ipData.ip;

    // 2. Gather Device Info
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      time: new Date().toLocaleString()
    };

    console.log("Triggering Backend Security Alert...", { username, userIP, deviceInfo });

    // 3. Call Backend API to send email
    // The backend should handle Nodemailer sending to nikhilaodishapandarasamaja.com
    await fetch(`${API_BASE_URL}/api/auth/notify-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include token if strictly required, usually logging in implies we have it or it's a secured endpoint
        'Authorization': `Bearer ${localStorage.getItem("adminToken")}`
      },
      body: JSON.stringify({
        username,
        userIP,
        deviceInfo
      })
    });

  } catch (err) {
    console.error("Failed to trigger security alert:", err);
  }
}

// Logout function
function logout() {
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("adminToken");
  location.reload();
}

// Add logout event listener if button exists
if (document.getElementById("adminLogoutBtn")) {
  document.getElementById("adminLogoutBtn").addEventListener("click", logout);
}

/* =========================================
   AUTO-LOGOUT ON INACTIVITY
   ========================================= */
let inactivityTimer;
const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 Minutes

function resetInactivityTimer() {
  // Only track if logged in
  if (!localStorage.getItem("adminToken")) return;

  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    alert("You have been logged out due to inactivity (10 mins).");
    logout();
  }, INACTIVITY_LIMIT);
}

function startInactivityTracking() {
  const events = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
  events.forEach(evt => document.addEventListener(evt, resetInactivityTimer, true));
  resetInactivityTimer(); // Init
}

// Start tracking if already logged in or on login
if (localStorage.getItem("adminToken")) {
  startInactivityTracking();
}

// Toast notification helper
function showToast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  el.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    background: ${type === 'success' ? '#28a745' : '#dc3545'};
    color: white;
    border-radius: 4px;
    z-index: 9999;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
  `;
  document.body.appendChild(el);

  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// Add or update candidate

// Add or update candidate
addCandidateForm.onsubmit = async e => {
  e.preventDefault();

  const id = document.getElementById("candidateId").value;
  const photo = document.getElementById("adminPhotoFile").files[0];

  // Validation: Photo is mandatory for new candidates, OR existing candidates with no photo
  let existingCandidate = null;
  if (id) {
    existingCandidate = candidates.find(c => (c.id || c._id) == id);
  }

  const hasExistingPhoto = existingCandidate && existingCandidate.photo;

  if (!photo && !hasExistingPhoto) {
    return showToast("Marriage Form (Photo) is mandatory!", "error");
  }

  if (!photo && !hasExistingPhoto) {
    return showToast("Marriage Form (Photo) is mandatory!", "error");
  }

  try {
    showLoader();
    const url = id
      ? `${API_BASE_URL}/api/candidates/${id}`
      : `${API_BASE_URL}/api/candidates`;

    let options = {};

    if (id && !photo) {
      // Update without file -> Use JSON to prevent overwriting photo with null
      const data = {};
      ["name", "gender"].forEach(f => {
        const el = document.getElementById("admin" + capitalize(f));
        if (el) data[f] = el.value.trim();
      });

      options = {
        method: "PUT",
        headers: getAuthHeaders(false), // JSON
        body: JSON.stringify(data)
      };
    } else {
      // Create OR Update with file -> Use FormData
      const fd = new FormData();
      ["name", "gender"].forEach(f => {
        const el = document.getElementById("admin" + capitalize(f));
        if (el) fd.append(f, el.value.trim());
      });
      if (photo) fd.append("photo", photo);

      options = {
        method: id ? "PUT" : "POST",
        headers: getAuthHeaders(true), // FormData (no Content-Type)
        body: fd
      };
    }

    const res = await fetch(url, options);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to save candidate");
    }

    showToast(id ? "Candidate updated!" : "Candidate saved!", "success");
    resetCandidateForm();
    await renderCandidates();
  } catch (err) {
    console.error(err);
    showToast("Failed to save candidate: " + err.message, "error");
  } finally {
    hideLoader();
  }
};

/* ---------- Candidate Management ---------- */
async function renderCandidates() {
  if (!candidatesTableBody) return;
  candidatesTableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;">Loading...</td></tr>`;
  try {
    showLoader();
    const res = await fetch(`${API_BASE_URL}/api/candidates`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch");
    candidates = await res.json();
    filteredCandidates = [...candidates];

    renderCandidatesTable();
  } catch (err) {
    console.error(err);
    candidatesTableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:red;">Failed to load data</td></tr>`;
  } finally {
    hideLoader();
  }
}

function renderCandidatesTable() {
  if (!candidatesTableBody) return;
  if (!filteredCandidates.length) {
    candidatesTableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#666;">No candidates found</td></tr>`;
    return;
  }

  candidatesTableBody.innerHTML = filteredCandidates.map(c => {
    const id = c.id || c._id;
    return `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 12px;">
           <span style="font-weight:600;">${escapeHtml(c.name)}</span>
           ${c.age ? `<span style="font-size:0.85em; color:#666; margin-left:5px;">(${c.age} yrs)</span>` : ''}
        </td>
        <td style="padding: 12px; text-transform:capitalize;">${c.gender}</td>
        <td style="padding: 12px; text-align: right;">
          <button class="action-btn edit" onclick="editCandidate('${id}')">Edit</button>
          <button class="action-btn delete" onclick="deleteCandidate('${id}')">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function searchCandidates() {
  const term = document.getElementById("candidateSearchInput").value.trim().toLowerCase();
  if (!term) {
    filteredCandidates = [...candidates];
  } else {
    filteredCandidates = candidates.filter(c =>
      c.name.toLowerCase().includes(term) ||
      (c.gender && c.gender.toLowerCase().startsWith(term))
    );
  }
  renderCandidatesTable();
}

function clearCandidateSearch() {
  document.getElementById("candidateSearchInput").value = "";
  filteredCandidates = [...candidates];
  renderCandidatesTable();
}

function editCandidate(id) {
  const c = candidates.find(item => (item.id || item._id) == id);
  if (!c) return;

  document.getElementById("candidateId").value = id;
  document.getElementById("adminName").value = c.name;
  document.getElementById("adminGender").value = c.gender;

  // UI Updates
  document.getElementById("candidateFormTitle").textContent = "Edit Candidate";
  document.getElementById("cancelCandidateEdit").style.display = "inline-block";
  addCandidateForm.querySelector("button[type='submit']").textContent = "Update Candidate";
}

function resetCandidateForm() {
  addCandidateForm.reset();
  document.getElementById("candidateId").value = "";
  document.getElementById("candidateFormTitle").textContent = "Add New Candidate";
  document.getElementById("cancelCandidateEdit").style.display = "none";
  addCandidateForm.querySelector("button[type='submit']").textContent = "Save Candidate";
}

async function deleteCandidate(id) {
  if (!confirm("Delete this candidate permanently?")) return;
  try {
    showLoader();
    const res = await fetch(`${API_BASE_URL}/api/candidates/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete");

    showToast("Candidate deleted", "success");
    await renderCandidates();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    hideLoader();
  }
}

/* ---------- section switch helper (unchanged) ---------- */
function showSection(id) {
  document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}



if (uploadBtn) {
  uploadBtn.onclick = async () => {
    if (!excelInput.files[0]) {
      excelStatus.textContent = "Please choose an .xlsx file first.";
      return;
    }

    excelStatus.textContent = "Reading file…";

    try {
      /* 1 → read the workbook */
      const wb = XLSX.read(await excelInput.files[0].arrayBuffer(), {
        type: "array"
      });
      const ws = wb.Sheets[wb.SheetNames[0]];      // first sheet only
      let rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

      rows = rows.map(r => ({
        membership_no: String(r['MEMBERSHIP NO.'] ?? '').trim(),
        name: String(r['NAME OF THE FAMILY (HEAD)'] ?? '').trim(),
        mobile: String(r['MOB.NO.'] ?? '').replace(/\D/g, ''),
        male: Number.isFinite(Number(r['MALE '])) ? Number(r['MALE ']) : '',
        female: Number.isFinite(Number(r['FEMALE'])) ? Number(r['FEMALE']) : '',
        district: String(r['DISTRICT'] ?? '').trim(),
        taluka: String(r["TALUKA "] ?? '').trim(),
        panchayat: String(r['PANCHAYATA'] ?? '').trim(),
        village: String(r['VILLAGE'] ?? '').trim(),
      }))
        .filter(r => r.name && r.membership_no); // <- require membership number


      if (rows.length === 0) {
        excelStatus.textContent = "No usable rows found.";
        return;
      }

      /* 3 → POST in bulk */
      excelStatus.textContent = `Uploading ${rows.length} members…`;

      const res = await fetch(`${API_BASE_URL}/api/members/import-rows`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ rows })
      });
      if (!res.ok) throw new Error(await res.text());

      excelStatus.textContent = "Import complete ✓";
      excelStatus.className = "status success";
      showToast(`Successfully imported ${rows.length} members!`, 'success');
      excelInput.value = "";           // clear file chooser

      // Reload members table if we're on the member section
      await loadMembers();

      // Close modal after 2 seconds
      setTimeout(() => {
        closeBulkUpload();
      }, 2000);
    } catch (err) {
      console.error(err);
      excelStatus.textContent = "Import failed: " + err.message;
      excelStatus.className = "status error";
    }
  };
}

/* ---------- Member-management pane switching ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const show = id => {
    document.querySelectorAll("#memberSection > *")
      .forEach(el => {
        if (el.classList?.contains("member-action-grid") ||
          el.classList?.contains("member-pane"))
          el.style.display = "none";
      });
    document.getElementById(id).style.display = "block";
  };

  document.getElementById("bulkUploadCard")
    .addEventListener("click", () => show("bulkUploadPane"));
  document.getElementById("singleUpdateCard")
    .addEventListener("click", () => show("singleUpdatePane"));
  document.querySelectorAll(".backBtn")
    .forEach(btn => btn.addEventListener("click",
      e => show(e.target.dataset.target)));
});

/* ---------- Loader / status hookup for Excel upload ---------- */
if (document.getElementById("uploadExcelBtn")) {
  const loader = document.getElementById("excelLoader");
  const status = document.getElementById("excelStatus");
  const upload = document.getElementById("uploadExcelBtn");
  const fileInp = document.getElementById("excelFileInput");

  upload.addEventListener("click", () => {
    status.textContent = "";
    status.className = "status";
    loader.hidden = false;
  });

  /* patch the promise chain in your existing uploadExcelBtn handler */
  const oldHandler = upload.onclick;
  upload.onclick = async () => {
    loader.hidden = false;               // show spinner
    await oldHandler();                  // run original logic
    loader.hidden = true;                // hide spinner (in both paths)
    if (status.textContent.includes("complete")) status.classList.add("success");
    else status.classList.add("error");
  };
}

/* ---------- Post Management ---------- */

postForm.onsubmit = async e => {
  e.preventDefault();
  const title = document.getElementById("postTitle").value.trim();
  const content = document.getElementById("postContent").value.trim();
  const id = document.getElementById("postId").value;

  if (!title || !content) return showToast("Fill out all fields!", "error");

  try {
    showLoader();
    const url = id
      ? `${API_BASE_URL}/api/posts/${id}`
      : `${API_BASE_URL}/api/posts`;

    const method = id ? "PUT" : "POST";

    const res = await fetch(url, {
      method: method,
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, content })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to save post");
    }

    showToast(id ? "Post updated!" : "Post added!", "success");
    resetPostForm();
    await renderPosts();
  } catch (err) {
    console.error("Post Error:", err);
    showToast("Error adding/updating post: " + err.message, "error");
  } finally {
    hideLoader();
  }
};

async function renderPosts() {
  postsTableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;">Loading...</td></tr>`;
  try {
    const res = await fetch(`${API_BASE_URL}/api/posts`, {
      headers: getAuthHeaders()
    });
    posts = await res.json();
    filteredPosts = [...posts];

    renderPostsTable();
  } catch (err) {
    postsTableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:red;">Failed to load posts</td></tr>`;
  }
}

function renderPostsTable() {
  if (!filteredPosts.length) {
    postsTableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#666;">No posts found</td></tr>`;
    return;
  }

  postsTableBody.innerHTML = filteredPosts.map(p => {
    // Create a short preview of the content for the table
    const preview = p.content.length > 50 ? p.content.substring(0, 50) + "..." : p.content;
    return `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 12px; font-weight: 600;">${escapeHtml(p.title)}</td>
        <td style="padding: 12px; color: #555;">${escapeHtml(preview)}</td>
        <td style="padding: 12px; text-align: right;">
            <button class="action-btn edit" onclick="editPost('${p.id}')">Edit</button>
            <button class="action-btn delete" onclick="deletePost('${p.id}')">Delete</button>
        </td>
      </tr>
      `;
  }).join('');
}

function searchPosts() {
  const term = document.getElementById("postSearchInput").value.trim().toLowerCase();
  if (!term) {
    filteredPosts = [...posts];
  } else {
    filteredPosts = posts.filter(p => p.title.toLowerCase().includes(term));
  }
  renderPostsTable();
}

function clearPostSearch() {
  document.getElementById("postSearchInput").value = "";
  filteredPosts = [...posts];
  renderPostsTable();
}

function editPost(id) {
  const p = posts.find(item => item.id == id);
  if (!p) return;

  document.getElementById("postId").value = id;
  document.getElementById("postTitle").value = p.title;
  document.getElementById("postContent").value = p.content;

  document.getElementById("postFormTitle").textContent = "Edit Post";
  document.getElementById("cancelPostEdit").style.display = "inline-block";
  document.getElementById("savePostBtn").textContent = "Update Post";
}

function resetPostForm() {
  postForm.reset();
  document.getElementById("postId").value = "";
  document.getElementById("postFormTitle").textContent = "Add New Post";
  document.getElementById("cancelPostEdit").style.display = "none";
  document.getElementById("savePostBtn").textContent = "Save Post";
}

async function deletePost(id) {
  if (!confirm("Delete this post?")) return;
  try {
    showLoader();
    const res = await fetch(`${API_BASE_URL}/api/posts/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete");
    }
    showToast("Post deleted", "success");
    await renderPosts();
  } catch (err) {
    console.error(err);
    showToast("Failed to delete post: " + err.message, "error");
  } finally {
    hideLoader();
  }
}

function setActiveSection(id, btn) {
  // show section
  document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
  document.getElementById(id).style.display = 'block';

  // highlight tab
  document.querySelectorAll('.section-tabs .tab').forEach(t => {
    t.setAttribute('aria-selected', 'false');
  });
  if (btn) btn.setAttribute('aria-selected', 'true');

  // Load data based on section
  if (id === 'postSection') {
    renderPosts();
  } else if (id === 'memberSection') {
    loadMembers();
  } else if (id === 'reviewSection') {
    loadSheetConfig();
  }
}

function toast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type} `;
  el.textContent = message;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 200);
  }, 2500);
}

// Helper function to escape HTML and prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* =========================================
   MEMBER MANAGEMENT FUNCTIONS
   ========================================= */

let allMembers = [];
let filteredMembers = [];
let currentPage = 1;
const membersPerPage = 10;

// Load all members on page load or when section becomes active
async function loadMembers() {
  try {
    showLoader();
    const res = await fetch(`${API_BASE_URL}/api/members`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to load members");
    }

    allMembers = await res.json();
    filteredMembers = [...allMembers];
    populateDistrictFilter(); // Initialize filters
    renderMembersTable();
  } catch (err) {
    console.error("Error loading members:", err);
    document.getElementById('membersTableBody').innerHTML = `
        < tr >
        <td colspan="7" style="padding: 40px; text-align: center; color: #dc3545;">
          Error loading members: ${err.message}
        </td>
      </tr >
        `;
  } finally {
    hideLoader();
  }
}

// Render members table with pagination
function renderMembersTable(page = 1) {
  currentPage = page;
  const tbody = document.getElementById('membersTableBody');

  if (filteredMembers.length === 0) {
    tbody.innerHTML = `
        < tr >
        <td colspan="7" style="padding: 40px; text-align: center; color: #999;">
          No members found
        </td>
      </tr >
        `;
    document.getElementById('membersPagination').innerHTML = '';
    return;
  }

  const startIndex = (currentPage - 1) * membersPerPage;
  const endIndex = startIndex + membersPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

  tbody.innerHTML = paginatedMembers.map(member => {
    // Try multiple common ID field names
    const id = member.id || member._id || member.Id || member.ID || member.memberId || member.membership_no || '';

    // Debug log for the first item to help troubleshoot
    if (member === paginatedMembers[0]) {
      console.log('First member data:', member);
      console.log('Extracted ID:', id);
    }

    return `
      <tr>
      <td>${escapeHtml(member.membership_no || 'N/A')}</td>
      <td>${escapeHtml(member.name || 'N/A')}</td>
      <td>${escapeHtml(member.mobile || 'N/A')}</td>      
      <td>${escapeHtml(member.district || 'N/A')}</td>
      <td>${escapeHtml(member.taluka || 'N/A')}</td>
      <td>
        <button class="action-btn edit" onclick="editMember('${id}')">✏️ Edit</button>
        <button class="action-btn delete" onclick="deleteMember('${id}')">🗑️ Delete</button>
      </td>
    </tr>
        `}).join('');

  renderPagination();
}

// Render pagination controls
function renderPagination() {
  const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
  const pagination = document.getElementById('membersPagination');

  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let html = '';

  // Previous button
  if (currentPage > 1) {
    html += `<button class="btn ghost" onclick="renderMembersTable(${currentPage - 1})">← Previous</button>`;
  }

  // Page numbers
  html += `<span style="padding: 8px 16px; background: #f0f0f0; border-radius: 8px; font-weight: 600;">
        Page ${currentPage} of ${totalPages}
  </span>`;

  // Next button
  if (currentPage < totalPages) {
    html += `<button class="btn ghost" onclick="renderMembersTable(${currentPage + 1})">Next →</button>`;
  }

  pagination.innerHTML = html;
}

// Search members - calls backend API
async function searchMembers() {
  const searchTerm = document.getElementById('memberSearchInput').value.trim();

  try {
    showLoader();
    // Build URL with search parameter
    let url = `${API_BASE_URL}/api/members`;
    if (searchTerm) {
      url += `?search=${encodeURIComponent(searchTerm)}`;
    }

    const res = await fetch(url, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search members");
    }

    const searchResults = await res.json();

    // Update both allMembers and filteredMembers with search results
    allMembers = searchResults;
    filteredMembers = searchResults;

    renderMembersTable(1);

    // Show result count
    if (searchTerm) {
      showToast(`Found ${searchResults.length} member(s)`, 'success');
    }
  } catch (err) {
    console.error("Error searching members:", err);
    showToast("Search failed: " + err.message, "error");
  } finally {
    hideLoader();
  }
}

// Clear search
async function clearSearch() {
  document.getElementById('memberSearchInput').value = '';
  await loadMembers(); // Reload all members from API
}

// Show add member modal
function showAddMemberModal() {
  document.getElementById('memberModalTitle').textContent = 'Add New Member';
  document.getElementById('memberForm').reset();
  document.getElementById('memberId').value = '';
  // Enable membership number input for new members
  document.getElementById('membershipNo').disabled = false;
  document.getElementById('membershipNo').readOnly = false;
  document.getElementById('memberAadhaar').value = '';
  document.getElementById('memberAddress').value = '';

  // Clear and add one empty family member row
  document.getElementById('familyMembersContainer').innerHTML = '';
  addFamilyMemberRow();

  document.getElementById('memberModal').style.display = 'flex';
}

// Close member modal
function closeMemberModal() {
  document.getElementById('memberModal').style.display = 'none';
}

// Show bulk upload modal
function showBulkUpload() {
  document.getElementById('bulkUploadModal').style.display = 'flex';
}

// Close bulk upload modal
function closeBulkUpload() {
  document.getElementById('bulkUploadModal').style.display = 'none';
}

// Edit member
async function editMember(id) {
  console.log(id);
  if (!id || id === 'undefined') {
    showToast('Invalid Member ID', 'error');
    return;
  }
  const member = allMembers.find(m => {
    const mId = m.id || m._id || m.Id || m.ID || m.memberId || m.membership_no;
    return String(mId) === String(id);
  });
  if (!member) {
    showToast('Member not found', 'error');
    return;
  }

  document.getElementById('memberModalTitle').textContent = 'Edit Member';
  document.getElementById('memberId').value = id;
  document.getElementById('membershipNo').value = member.membership_no || '';
  // Make membership number read-only when editing (it's the identifier)
  document.getElementById('membershipNo').disabled = false;
  document.getElementById('membershipNo').readOnly = true;
  document.getElementById('memberName').value = member.name || '';
  document.getElementById('memberMobile').value = member.mobile || '';
  document.getElementById('memberAadhaar').value = member.aadhar_no || '';
  document.getElementById('memberDistrict').value = member.district || '';
  document.getElementById('memberTaluka').value = member.taluka || '';
  document.getElementById('memberPanchayat').value = member.panchayat || '';
  document.getElementById('memberVillage').value = member.village || '';
  document.getElementById('memberAddress').value = member.address || '';

  // Populate family members
  document.getElementById('familyMembersContainer').innerHTML = '';
  if (member.family_members && Array.isArray(member.family_members) && member.family_members.length > 0) {
    member.family_members.forEach(fm => {
      addFamilyMemberRow(fm.name, fm.relation, fm.gender, fm.age);
    });
  } else {
    // Fallback: add head of family as first row + use male/female counts
    addFamilyMemberRow(member.name || '', 'Self', 'Male', '');
  }

  document.getElementById('memberModal').style.display = 'flex';
}

// Delete member
async function deleteMember(id) {
  if (!confirm('Are you sure you want to delete this member?')) return;

  try {
    showLoader();
    const res = await fetch(`${API_BASE_URL}/api/members/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete member');
    }

    showToast('Member deleted successfully!', 'success');
    await loadMembers();
  } catch (err) {
    console.error('Error deleting member:', err);
    showToast('Error deleting member: ' + err.message, 'error');
  } finally {
    hideLoader();
  }
}

// Handle member form submission
if (document.getElementById('memberForm')) {
  document.getElementById('memberForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Use the hidden memberId field to determine add vs edit
    const editId = document.getElementById('memberId').value;
    const isEditing = !!editId;

    const memberData = {
      membership_no: document.getElementById('membershipNo').value.trim(),
      name: document.getElementById('memberName').value.trim(),
      mobile: document.getElementById('memberMobile').value.trim(),
      aadhar_no: document.getElementById('memberAadhaar').value.trim(),
      district: document.getElementById('memberDistrict').value.trim(),
      taluka: document.getElementById('memberTaluka').value.trim(),
      panchayat: document.getElementById('memberPanchayat').value.trim(),
      village: document.getElementById('memberVillage').value.trim(),
      address: document.getElementById('memberAddress').value.trim()
    };

    // Collect family members from dynamic rows
    const familyMembers = collectFamilyMembers();
    memberData.family_members = familyMembers;

    // Auto-calculate male/female counts from family members
    memberData.male = familyMembers.filter(fm => fm.gender === 'Male').length;
    memberData.female = familyMembers.filter(fm => fm.gender === 'Female').length;

    if (!memberData.membership_no) {
      showToast('Please enter a Membership No.', 'error');
      return;
    }

    try {
      showLoader();

      let res;
      if (isEditing) {
        // Update existing member
        res = await fetch(`${API_BASE_URL}/api/members/${editId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(memberData)
        });
      } else {
        // Create new member using import-rows endpoint
        res = await fetch(`${API_BASE_URL}/api/members/import-rows`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ rows: [memberData] })
        });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save member');
      }

      showToast(isEditing ? 'Member updated successfully!' : 'Member added successfully!', 'success');
      closeMemberModal();
      await loadMembers();
    } catch (err) {
      console.error('Error saving member:', err);
      showToast('Error saving member: ' + err.message, 'error');
    } finally {
      hideLoader();
    }
  });
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
  }
});

// Load members when member section becomes active
document.getElementById('tab-members')?.addEventListener('click', () => {
  if (allMembers.length === 0) {
    loadMembers();
  }
});

// Search on Enter key
document.getElementById('memberSearchInput')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchMembers();
  }
});

/* =========================================
   FILTER & EXPORT FUNCTIONS
   ========================================= */

const filterDistrict = document.getElementById('filterDistrict');
const filterTaluka = document.getElementById('filterTaluka');
const filterPanchayat = document.getElementById('filterPanchayat');

function populateDistrictFilter() {
  if (!filterDistrict) return;
  const districts = [...new Set(allMembers.map(m => m.district).filter(Boolean))].sort();

  filterDistrict.innerHTML = '<option value="">All Districts</option>';
  districts.forEach(d => {
    filterDistrict.innerHTML += `< option value = "${d}" > ${d}</option > `;
  });

  // Reset dependents
  filterTaluka.innerHTML = '<option value="">All Talukas</option>';
  filterTaluka.disabled = true;
  filterPanchayat.innerHTML = '<option value="">All Panchayats</option>';
  filterPanchayat.disabled = true;
}

if (filterDistrict) {
  filterDistrict.addEventListener('change', () => {
    applyFilters();
    const d = filterDistrict.value;

    // Populate Taluka
    filterTaluka.innerHTML = '<option value="">All Talukas</option>';
    filterTaluka.disabled = !d;

    if (d) {
      const talukas = [...new Set(allMembers
        .filter(m => m.district === d)
        .map(m => m.taluka)
        .filter(Boolean))].sort();

      talukas.forEach(t => {
        filterTaluka.innerHTML += `< option value = "${t}" > ${t}</option > `;
      });
    }

    // Reset Panchayat
    filterPanchayat.innerHTML = '<option value="">All Panchayats</option>';
    filterPanchayat.disabled = true;
  });

  filterTaluka.addEventListener('change', () => {
    applyFilters();
    const d = filterDistrict.value;
    const t = filterTaluka.value;

    // Populate Panchayat
    filterPanchayat.innerHTML = '<option value="">All Panchayats</option>';
    filterPanchayat.disabled = !t;

    if (t) {
      const panchayats = [...new Set(allMembers
        .filter(m => m.district === d && m.taluka === t)
        .map(m => m.panchayat)
        .filter(Boolean))].sort();

      panchayats.forEach(p => {
        filterPanchayat.innerHTML += `< option value = "${p}" > ${p}</option > `;
      });
    }
  });

  filterPanchayat.addEventListener('change', () => {
    applyFilters();
  });
}

function applyFilters() {
  const d = filterDistrict ? filterDistrict.value : '';
  const t = filterTaluka ? filterTaluka.value : '';
  const p = filterPanchayat ? filterPanchayat.value : '';
  const search = document.getElementById('memberSearchInput').value.toLowerCase().trim();

  filteredMembers = allMembers.filter(m => {
    const matchesDistrict = !d || m.district === d;
    const matchesTaluka = !t || m.taluka === t;
    const matchesPanchayat = !p || m.panchayat === p;

    let matchesSearch = true;
    if (search) {
      const text = `${m.membership_no} ${m.name} ${m.mobile} `.toLowerCase();
      matchesSearch = text.includes(search);
    }

    return matchesDistrict && matchesTaluka && matchesPanchayat && matchesSearch;
  });

  renderMembersTable(1);
}

// Override searchMembers to use new local filtering if preferred, 
// or keep API search? The existing searchMembers calls API. 
// For "export wise", local filtering is better if we have all data.
// Since loadMembers fetches all, let's switch to local filtering for consistency.
window.searchMembers = function () {
  applyFilters();
}

window.exportMembers = function () {
  if (!filteredMembers.length) {
    showToast("No members to export", "error");
    return;
  }

  // Format data for Excel
  const data = filteredMembers.map(m => ({
    "Membership No": m.membership_no,
    "Name": m.name,
    "Mobile": m.mobile,
    "District": m.district,
    "Taluka": m.taluka,
    "Panchayat": m.panchayat,
    "Village": m.village,
    "Male": m.male,
    "Female": m.female
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Members");

  const fileName = `Members_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

window.printMembers = function () {
  if (!filteredMembers.length) {
    showToast("No members to print", "error");
    return;
  }

  const printWindow = window.open('', '', 'height=600,width=800');

  let html = `
        < html >
    <head>
      <title>Print Members</title>
      <style>
        table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        h2 { font-family: Arial, sans-serif; text-align: center; }
      </style>
    </head>
    <body>
      <h2>Members List</h2>
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>Name</th>
            <th>Mobile</th>
            <th>District</th>
            <th>Taluka</th>
            <th>Panchayat</th>
            <th>Village</th>
          </tr>
        </thead>
        <tbody>
  `;

  filteredMembers.forEach(m => {
    html += `
      <tr>
        <td>${m.membership_no || ''}</td>
        <td>${m.name || ''}</td>
        <td>${m.mobile || ''}</td>
        <td>${m.district || ''}</td>
        <td>${m.taluka || ''}</td>
        <td>${m.panchayat || ''}</td>
        <td>${m.village || ''}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </body>
    </html >
        `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  // Wait for content to load before printing
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}

/* =========================================
   MATCHED CANDIDATE FUNCTIONS
   ========================================= */

window.openMatchModal = function (id) {
  console.log("Opening match modal for", id);
  const el = document.getElementById('matchCandidateId');
  if (el) el.value = id;
  const modal = document.getElementById('matchModal');
  if (modal) modal.style.display = 'flex';
}

window.closeMatchModal = function () {
  document.getElementById('matchModal').style.display = 'none';
  const form = document.getElementById('matchForm');
  if (form) form.reset();
}

if (document.getElementById('matchForm')) {
  document.getElementById('matchForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('matchCandidateId').value;
    const partnerName = document.getElementById('partnerName').value.trim();
    const partnerGender = document.getElementById('partnerGender').value;

    if (!id || !partnerName || !partnerGender) {
      showToast("Please fill all fields", "error");
      return;
    }

    try {
      // Using PUT to update existing record with match info
      const payload = {
        isMatched: true,
        partnerName: partnerName,
        partnerGender: partnerGender
      };

      const res = await fetch(`${API_BASE_URL}/api/candidates/${id}/match`, {
        method: 'PUT',
        headers: getAuthHeaders(false),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to mark as matched");
      }

      showToast("Candidate matched successfully!", "success");
      closeMatchModal();
      renderCandidates();

    } catch (err) {
      console.error(err);
      showToast("Error: " + err.message, "error");
    }
  });
}

/* =========================================
   GOOGLE FORM SUBMISSIONS REVIEW
   ========================================= */

let allSubmissions = [];
let currentFilter = 'all';

// Expected Google Form column headers (in order)
// Adjust these if your Google Form questions differ
const FORM_COLUMNS = {
  TIMESTAMP: 0,
  MEMBERSHIP_NO: 1,
  HEAD_NAME: 2,
  MOBILE: 3,
  DISTRICT: 4,
  TALUKA: 5,
  PANCHAYAT: 6,
  VILLAGE: 7,
  MALE_COUNT: 8,
  FEMALE_COUNT: 9,
  FAMILY_MEMBERS: 10,
  HEAD_PHOTO: 11
};

// Load saved Google Sheet config from localStorage
function loadSheetConfig() {
  const savedId = localStorage.getItem('googleSheetId');
  const savedTab = localStorage.getItem('googleSheetTab');
  if (savedId) document.getElementById('googleSheetId').value = savedId;
  if (savedTab) document.getElementById('googleSheetTab').value = savedTab;
}

// Save Google Sheet config to localStorage
window.saveSheetConfig = function () {
  const sheetId = document.getElementById('googleSheetId').value.trim();
  const sheetTab = document.getElementById('googleSheetTab').value.trim();

  if (!sheetId) {
    showToast('Please enter a Google Sheet ID', 'error');
    return;
  }

  localStorage.setItem('googleSheetId', sheetId);
  localStorage.setItem('googleSheetTab', sheetTab || 'Form Responses 1');
  showToast('Sheet configuration saved!', 'success');
}

// Fetch submissions from Google Sheet using the Visualization API
window.fetchGoogleSheetSubmissions = async function () {
  const sheetId = document.getElementById('googleSheetId').value.trim();
  const sheetTab = document.getElementById('googleSheetTab').value.trim() || 'Form Responses 1';

  if (!sheetId) {
    showToast('Please enter a Google Sheet ID first', 'error');
    return;
  }

  // Save config automatically
  localStorage.setItem('googleSheetId', sheetId);
  localStorage.setItem('googleSheetTab', sheetTab);

  try {
    showLoader();

    // Use Google Visualization API (works for published sheets, no API key needed)
    const encodedTab = encodeURIComponent(sheetTab);
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodedTab}`;

    const response = await fetch(gvizUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet (HTTP ${response.status}). Make sure the sheet is published to web.`);
    }

    const text = await response.text();

    // Parse the gviz JSONP-like response
    // Format: google.visualization.Query.setResponse({...});
    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);?\s*$/);
    if (!match) {
      throw new Error('Could not parse Google Sheet response. Make sure the sheet is published to web.');
    }

    const data = JSON.parse(match[1]);

    if (data.status === 'error') {
      throw new Error(data.errors?.[0]?.detailed_message || 'Google Sheet returned an error');
    }

    const cols = data.table.cols;
    const rows = data.table.rows;

    console.log('Sheet columns:', cols.map(c => c.label));
    console.log('Total rows:', rows.length);

    // Parse rows into submission objects
    const submissions = rows.map((row, idx) => {
      const getCellValue = (colIdx) => {
        if (!row.c || !row.c[colIdx]) return '';
        const cell = row.c[colIdx];
        // For dates, prefer formatted value
        if (cell.f) return cell.f;
        return cell.v != null ? String(cell.v) : '';
      };

      return {
        _rowIndex: idx + 2, // 1-indexed + header row
        timestamp: getCellValue(FORM_COLUMNS.TIMESTAMP),
        membership_no: getCellValue(FORM_COLUMNS.MEMBERSHIP_NO).trim(),
        name: getCellValue(FORM_COLUMNS.HEAD_NAME).trim(),
        mobile: getCellValue(FORM_COLUMNS.MOBILE).trim(),
        district: getCellValue(FORM_COLUMNS.DISTRICT).trim(),
        taluka: getCellValue(FORM_COLUMNS.TALUKA).trim(),
        panchayat: getCellValue(FORM_COLUMNS.PANCHAYAT).trim(),
        village: getCellValue(FORM_COLUMNS.VILLAGE).trim(),
        male: parseInt(getCellValue(FORM_COLUMNS.MALE_COUNT)) || 0,
        female: parseInt(getCellValue(FORM_COLUMNS.FEMALE_COUNT)) || 0,
        family_members: getCellValue(FORM_COLUMNS.FAMILY_MEMBERS).trim(),
        head_photo_url: getCellValue(FORM_COLUMNS.HEAD_PHOTO).trim(),
        _status: 'pending'
      };
    }).filter(s => s.membership_no); // Skip empty rows

    // Cross-reference with existing members to find already-approved ones
    try {
      const membersRes = await fetch(`${API_BASE_URL}/api/members`, {
        headers: getAuthHeaders()
      });
      if (membersRes.ok) {
        const existingMembers = await membersRes.json();
        const existingNos = new Set(existingMembers.map(m => String(m.membership_no)));

        submissions.forEach(s => {
          if (existingNos.has(String(s.membership_no))) {
            s._status = 'approved';
          }
        });
      }
    } catch (e) {
      console.warn('Could not cross-reference existing members:', e);
    }

    allSubmissions = submissions;
    updateReviewStats();
    renderSubmissions();

    const pending = submissions.filter(s => s._status === 'pending').length;
    showToast(`Fetched ${submissions.length} submissions (${pending} pending review)`, 'success');

  } catch (err) {
    console.error('Error fetching Google Sheet:', err);
    showToast('Error: ' + err.message, 'error');
    document.getElementById('submissionsContainer').innerHTML = `
      <div style="text-align: center; padding: 3rem 2rem; color: #dc3545;">
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">⚠️</div>
        <p style="font-weight: 600; font-size: 1.1rem;">Failed to fetch submissions</p>
        <p style="font-size: 0.9rem; color: #666; max-width: 500px; margin: 0.5rem auto;">${escapeHtml(err.message)}</p>
        <p style="font-size: 0.85rem; color: #888; margin-top: 1rem;">Checklist:<br>
          ✅ Sheet ID is correct<br>
          ✅ Sheet is <strong>published to web</strong> (File → Share → Publish to web)<br>
          ✅ Sheet tab name matches (default: "Form Responses 1")
        </p>
      </div>
    `;
  } finally {
    hideLoader();
  }
}

// Update the stats counters
function updateReviewStats() {
  const total = allSubmissions.length;
  const pending = allSubmissions.filter(s => s._status === 'pending').length;
  const approved = allSubmissions.filter(s => s._status === 'approved').length;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statApproved').textContent = approved;

  document.getElementById('reviewStats').style.display = total > 0 ? 'block' : 'none';
  document.getElementById('reviewFilterBar').style.display = total > 0 ? 'flex' : 'none';
}

// Filter submissions by status
window.filterSubmissions = function (filter) {
  currentFilter = filter;

  // Update filter button styles
  ['filterAll', 'filterPending', 'filterApproved'].forEach(id => {
    const btn = document.getElementById(id);
    if (id === 'filter' + filter.charAt(0).toUpperCase() + filter.slice(1) || (filter === 'all' && id === 'filterAll')) {
      btn.style.background = '#0a4a96';
      btn.style.color = 'white';
      btn.className = 'btn';
    } else {
      btn.style.background = '';
      btn.style.color = '';
      btn.className = 'btn ghost';
    }
  });

  renderSubmissions();
}

// Render submission cards
function renderSubmissions() {
  const container = document.getElementById('submissionsContainer');

  let filtered = allSubmissions;
  if (currentFilter === 'pending') {
    filtered = allSubmissions.filter(s => s._status === 'pending');
  } else if (currentFilter === 'approved') {
    filtered = allSubmissions.filter(s => s._status === 'approved');
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 2rem; color: #999;">
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">${currentFilter === 'pending' ? '🎉' : '📋'}</div>
        <p style="font-weight: 600;">${currentFilter === 'pending' ? 'No pending submissions!' : 'No submissions found'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((sub, idx) => {
    const isPending = sub._status === 'pending';
    const statusBadge = isPending
      ? '<span style="background: #fff3cd; color: #856404; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">⏳ Pending</span>'
      : '<span style="background: #d4edda; color: #155724; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">✅ Approved</span>';

    const photoHtml = sub.head_photo_url
      ? `<div style="margin-top: 0.8rem;"><a href="${escapeHtml(sub.head_photo_url)}" target="_blank" style="color: #0a4a96; text-decoration: none; font-size: 0.85rem;">📷 View Uploaded Photo</a></div>`
      : '';

    const familyHtml = sub.family_members
      ? `<div style="margin-top: 0.8rem; padding: 0.8rem; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #667eea;">
           <div style="font-weight: 600; font-size: 0.8rem; color: #555; margin-bottom: 0.3rem;">👨‍👩‍👧‍👦 Family Members:</div>
           <div style="font-size: 0.9rem; color: #333; white-space: pre-line;">${escapeHtml(sub.family_members)}</div>
         </div>`
      : '';

    return `
      <div style="background: white; border: 1px solid ${isPending ? '#ffc107' : '#28a745'}; border-left: 4px solid ${isPending ? '#ffc107' : '#28a745'}; border-radius: 10px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: all 0.2s;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
          <div>
            <span style="font-size: 1.15rem; font-weight: 700; color: #0a2540;">${escapeHtml(sub.name || 'No Name')}</span>
            <span style="margin-left: 0.5rem; font-size: 0.85rem; color: #666;">Membership: <strong>${escapeHtml(sub.membership_no)}</strong></span>
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            ${statusBadge}
            <span style="font-size: 0.75rem; color: #999;">${escapeHtml(sub.timestamp)}</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.6rem; font-size: 0.9rem;">
          <div><span style="color: #888;">📞 Mobile:</span> <strong>${escapeHtml(sub.mobile || 'N/A')}</strong></div>
          <div><span style="color: #888;">📍 District:</span> <strong>${escapeHtml(sub.district || 'N/A')}</strong></div>
          <div><span style="color: #888;">🏘️ Taluka:</span> <strong>${escapeHtml(sub.taluka || 'N/A')}</strong></div>
          <div><span style="color: #888;">🏠 Village:</span> <strong>${escapeHtml(sub.village || 'N/A')}</strong></div>
          <div><span style="color: #888;">👨 Male:</span> <strong>${sub.male}</strong></div>
          <div><span style="color: #888;">👩 Female:</span> <strong>${sub.female}</strong></div>
        </div>

        ${familyHtml}
        ${photoHtml}

        ${isPending ? `
        <div style="display: flex; gap: 0.5rem; margin-top: 1.2rem; padding-top: 1rem; border-top: 1px solid #eee;">
          <button onclick="approveSubmission(${allSubmissions.indexOf(sub)})" class="btn"
            style="background: #28a745; color: white; padding: 8px 20px; font-size: 0.85rem; flex: 1;">✅ Approve & Add to DB</button>
          <button onclick="editBeforeApprove(${allSubmissions.indexOf(sub)})" class="btn"
            style="background: #17a2b8; color: white; padding: 8px 20px; font-size: 0.85rem;">✏️ Edit & Approve</button>
          <button onclick="rejectSubmission(${allSubmissions.indexOf(sub)})" class="btn"
            style="background: #dc3545; color: white; padding: 8px 20px; font-size: 0.85rem;">❌ Reject</button>
        </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// Approve a submission — push to backend DB
window.approveSubmission = async function (index) {
  const sub = allSubmissions[index];
  if (!sub) return;

  if (!confirm(`Approve and add member "${sub.name}" (${sub.membership_no}) to the database?`)) return;

  try {
    showLoader();

    const memberData = {
      membership_no: sub.membership_no,
      name: sub.name,
      mobile: sub.mobile,
      male: sub.male,
      female: sub.female,
      district: sub.district,
      taluka: sub.taluka,
      panchayat: sub.panchayat,
      village: sub.village
    };

    // Add family_members and head_photo_url if backend supports them
    if (sub.family_members) memberData.family_members = sub.family_members;
    if (sub.head_photo_url) memberData.head_photo_url = sub.head_photo_url;

    // Use import-rows endpoint (backend doesn't have POST /api/members)
    const res = await fetch(`${API_BASE_URL}/api/members/import-rows`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rows: [memberData] })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to add member');
    }

    sub._status = 'approved';
    updateReviewStats();
    renderSubmissions();
    showToast(`Member "${sub.name}" approved and added to database!`, 'success');

  } catch (err) {
    console.error('Approve error:', err);
    showToast('Error approving: ' + err.message, 'error');
  } finally {
    hideLoader();
  }
}

// Edit before approving — opens the member modal with pre-filled data
window.editBeforeApprove = function (index) {
  const sub = allSubmissions[index];
  if (!sub) return;

  // Switch to member management tab
  const memberTab = document.getElementById('tab-members');
  setActiveSection('memberSection', memberTab);

  // Open the add member modal with pre-filled data
  setTimeout(() => {
    document.getElementById('memberModalTitle').textContent = 'Add Member (from Form Submission)';
    document.getElementById('memberId').value = ''; // empty = new member (POST)
    document.getElementById('membershipNo').value = sub.membership_no;
    document.getElementById('membershipNo').disabled = false;
    document.getElementById('membershipNo').readOnly = false;
    document.getElementById('memberName').value = sub.name;
    document.getElementById('memberMobile').value = sub.mobile;
    document.getElementById('memberAadhaar').value = sub.aadhar_no || '';
    document.getElementById('memberDistrict').value = sub.district;
    document.getElementById('memberTaluka').value = sub.taluka;
    document.getElementById('memberPanchayat').value = sub.panchayat || '';
    document.getElementById('memberVillage').value = sub.village || '';
    document.getElementById('memberAddress').value = sub.address || '';

    // Parse family members from the text field
    document.getElementById('familyMembersContainer').innerHTML = '';
    if (sub.family_members) {
      // Try to parse lines like "Name - Relation" or "Name (Relation)"
      const lines = sub.family_members.split('\n').filter(l => l.trim());
      lines.forEach(line => {
        const parts = line.split(/[-–]/).map(s => s.trim());
        const fmName = parts[0] || '';
        const fmRelation = parts[1] || '';
        // Try to match relation to known relations
        const matchedRelation = Object.keys(RELATION_GENDER_MAP).find(r =>
          r.toLowerCase() === fmRelation.toLowerCase().replace(/[()]/g, '').trim()
        ) || '';
        const mappedGender = matchedRelation ? RELATION_GENDER_MAP[matchedRelation] : '';
        addFamilyMemberRow(fmName, matchedRelation, mappedGender, '');
      });
    } else {
      addFamilyMemberRow(sub.name, 'Self', '', '');
    }

    document.getElementById('memberModal').style.display = 'flex';
  }, 300);
}

// Reject a submission — just mark locally (doesn't affect Google Sheet)
window.rejectSubmission = function (index) {
  const sub = allSubmissions[index];
  if (!sub) return;

  if (!confirm(`Reject submission from "${sub.name}" (${sub.membership_no})?\n\nThis will remove it from the review list (it will reappear on next fetch).`)) return;

  // Add to rejected list in localStorage so it doesn't show again
  const rejectedList = JSON.parse(localStorage.getItem('rejectedSubmissions') || '[]');
  rejectedList.push({
    membership_no: sub.membership_no,
    timestamp: sub.timestamp,
    rejectedAt: new Date().toISOString()
  });
  localStorage.setItem('rejectedSubmissions', JSON.stringify(rejectedList));

  // Remove from current list
  allSubmissions.splice(index, 1);
  updateReviewStats();
  renderSubmissions();
  showToast(`Submission from "${sub.name}" rejected`, 'success');
}

/* =========================================
   FAMILY MEMBER ROW MANAGEMENT
   ========================================= */

let familyMemberRowCounter = 0;

// Relation-to-gender auto-mapping
const RELATION_GENDER_MAP = {
  'Self': '',
  'Wife': 'Female',
  'Husband': 'Male',
  'Father': 'Male',
  'Mother': 'Female',
  'Son': 'Male',
  'Daughter': 'Female',
  'Brother': 'Male',
  'Sister': 'Female',
  'Grandfather': 'Male',
  'Grandmother': 'Female',
  'Father-in-law': 'Male',
  'Mother-in-law': 'Female',
  'Son-in-law': 'Male',
  'Daughter-in-law': 'Female',
  'Grandson': 'Male',
  'Granddaughter': 'Female',
  'Uncle': 'Male',
  'Aunt': 'Female',
  'Nephew': 'Male',
  'Niece': 'Female',
  'Other': ''
};

// Add a family member row
window.addFamilyMemberRow = function (name, relation, gender, age) {
  const container = document.getElementById('familyMembersContainer');
  const rowId = 'fm-row-' + (++familyMemberRowCounter);

  const row = document.createElement('div');
  row.id = rowId;
  row.style.cssText = 'display: grid; grid-template-columns: 2fr 1.5fr 1fr 0.8fr 40px; gap: 0.5rem; align-items: center; padding: 6px 0; border-bottom: 1px solid #f0e0d0; animation: fadeIn 0.2s ease;';

  const relationOptions = Object.keys(RELATION_GENDER_MAP).map(r =>
    `<option value="${r}" ${r === (relation || '') ? 'selected' : ''}>${r}</option>`
  ).join('');

  row.innerHTML = `
    <input type="text" class="fm-name" value="${escapeHtml(name || '')}" placeholder="Full Name"
      style="padding: 8px 10px; border: 1.5px solid #e0e0e0; border-radius: 6px; font-size: 13px;">
    <select class="fm-relation" onchange="onRelationChange(this, '${rowId}')"
      style="padding: 8px 6px; border: 1.5px solid #e0e0e0; border-radius: 6px; font-size: 13px; background: white;">
      <option value="">Select...</option>
      ${relationOptions}
    </select>
    <select class="fm-gender" onchange="updateFamilyMemberCounts()"
      style="padding: 8px 6px; border: 1.5px solid #e0e0e0; border-radius: 6px; font-size: 13px; background: white;">
      <option value="" ${!gender ? 'selected' : ''}>--</option>
      <option value="Male" ${gender === 'Male' ? 'selected' : ''}>Male</option>
      <option value="Female" ${gender === 'Female' ? 'selected' : ''}>Female</option>
    </select>
    <input type="number" class="fm-age" value="${age || ''}" min="0" max="150" placeholder="Age"
      style="padding: 8px 6px; border: 1.5px solid #e0e0e0; border-radius: 6px; font-size: 13px; width: 100%;">
    <button type="button" onclick="removeFamilyMemberRow('${rowId}')"
      style="background: #ff4d4d; color: white; border: none; border-radius: 6px; width: 32px; height: 32px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center;"
      title="Remove">✕</button>
  `;

  container.appendChild(row);
  updateFamilyMemberCounts();
}

// Auto-set gender when relation changes
window.onRelationChange = function (select, rowId) {
  const relation = select.value;
  const mappedGender = RELATION_GENDER_MAP[relation];
  const row = document.getElementById(rowId);

  if (mappedGender && row) {
    const genderSelect = row.querySelector('.fm-gender');
    if (genderSelect) {
      genderSelect.value = mappedGender;
    }
  }
  updateFamilyMemberCounts();
}

// Remove a family member row
window.removeFamilyMemberRow = function (rowId) {
  const row = document.getElementById(rowId);
  if (row) {
    row.style.opacity = '0';
    row.style.transform = 'translateX(-20px)';
    row.style.transition = 'all 0.2s ease';
    setTimeout(() => {
      row.remove();
      updateFamilyMemberCounts();
    }, 200);
  }
}

// Update male/female/total counts from family member rows
window.updateFamilyMemberCounts = function () {
  const container = document.getElementById('familyMembersContainer');
  if (!container) return;

  const genders = container.querySelectorAll('.fm-gender');
  let male = 0, female = 0;

  genders.forEach(sel => {
    if (sel.value === 'Male') male++;
    else if (sel.value === 'Female') female++;
  });

  const maleEl = document.getElementById('autoMaleCount');
  const femaleEl = document.getElementById('autoFemaleCount');
  const totalEl = document.getElementById('autoTotalCount');

  if (maleEl) maleEl.textContent = male;
  if (femaleEl) femaleEl.textContent = female;
  if (totalEl) totalEl.textContent = male + female;

  // Update hidden fields
  document.getElementById('memberMale').value = male;
  document.getElementById('memberFemale').value = female;
}

// Collect all family members data from the dynamic rows
function collectFamilyMembers() {
  const container = document.getElementById('familyMembersContainer');
  if (!container) return [];

  const rows = container.children;
  const members = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = (row.querySelector('.fm-name')?.value || '').trim();
    const relation = (row.querySelector('.fm-relation')?.value || '').trim();
    const gender = (row.querySelector('.fm-gender')?.value || '').trim();
    const age = parseInt(row.querySelector('.fm-age')?.value) || null;

    if (name) { // Only include rows with a name
      members.push({ name, relation, gender, age });
    }
  }

  return members;
}

// Add a CSS animation for new rows
(function () {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
})();
