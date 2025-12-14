// File: assets/js/admin.js


const adminLogin = document.getElementById("admin-login");
const adminPanel = document.getElementById("admin-panel");
const adminLoginForm = document.getElementById("adminLoginForm");
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
      document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');

      await renderCandidates();
      showToast("Login successful!", "success");
    } else {
      throw new Error("No token received from server");
    }
  } catch (err) {
    console.error("Login error:", err);
    console.log("Error details:", err.message);
    showToast(err.message || "Login failed. Please check your credentials.", "error");
  }
};

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
  const fd = new FormData();

  ["name", "gender"].forEach(f => {
    const el = document.getElementById("admin" + capitalize(f));
    if (el) fd.append(f, el.value.trim());
  });

  const photo = document.getElementById("adminPhotoFile").files[0];
  if (photo) {
    fd.append("photo", photo);
  } else if (!id) {
    return showToast("Please choose a candidate photo", "error");
  }

  try {
    const url = id
      ? `${API_BASE_URL}/api/candidates/${id}`
      : `${API_BASE_URL}/api/candidates`;

    // For update, we might need a different logic or endpoint if the backend strictly separates
    // PUT (JSON) vs POST (FormData). Assuming the backend handles multipart/form-data for updates too 
    // or we might need to change strategy.
    // If backend only supports JSON for PUT, we'd need to handle photo upload separately or check backend capability.
    // Standard approach: Use the same endpoint logic or PUT with FormData if backend supports it.

    // NOTE: Based on previous context, update might be tricky with images. 
    // If the backend doesn't support FormData on PUT, this might fail. 
    // Let's assume standard REST behavior or we might need to fix the backend later.

    // Fix: If updating and no new photo, backend should handle it. 
    // If ID exists, use PUT, otherwise POST.

    const res = await fetch(url, {
      method: id ? "PUT" : "POST",
      body: fd,
      headers: getAuthHeaders(true)
    });

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
  }
};

/* ---------- Candidate Management ---------- */
async function renderCandidates() {
  if (!candidatesTableBody) return;
  candidatesTableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;">Loading...</td></tr>`;
  try {
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
    const res = await fetch(`${API_BASE_URL}/api/candidates/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete");

    showToast("Candidate deleted", "success");
    await renderCandidates();
  } catch (err) {
    showToast(err.message, "error");
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
        < tr >
      <td>${escapeHtml(member.membership_no || 'N/A')}</td>
      <td>${escapeHtml(member.name || 'N/A')}</td>
      <td>${escapeHtml(member.mobile || 'N/A')}</td>      
      <td>${escapeHtml(member.district || 'N/A')}</td>
      <td>${escapeHtml(member.taluka || 'N/A')}</td>
      <td>
        <button class="action-btn edit" onclick="editMember('${id}')">✏️ Edit</button>
        <button class="action-btn delete" onclick="deleteMember('${id}')">🗑️ Delete</button>
      </td>
    </tr >
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
    html += `< button class="btn ghost" onclick = "renderMembersTable(${currentPage - 1})" >← Previous</button > `;
  }

  // Page numbers
  html += `< span style = "padding: 8px 16px; background: #f0f0f0; border-radius: 8px; font-weight: 600;" >
        Page ${currentPage} of ${totalPages}
  </span > `;

  // Next button
  if (currentPage < totalPages) {
    html += `< button class="btn ghost" onclick = "renderMembersTable(${currentPage + 1})" > Next →</button > `;
  }

  pagination.innerHTML = html;
}

// Search members - calls backend API
async function searchMembers() {
  const searchTerm = document.getElementById('memberSearchInput').value.trim();

  try {
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
  document.getElementById('memberName').value = member.name || '';
  document.getElementById('memberMobile').value = member.mobile || '';
  document.getElementById('memberMale').value = member.male || '';
  document.getElementById('memberFemale').value = member.female || '';
  document.getElementById('memberDistrict').value = member.district || '';
  document.getElementById('memberTaluka').value = member.taluka || '';
  document.getElementById('memberPanchayat').value = member.panchayat || '';
  document.getElementById('memberVillage').value = member.village || '';

  document.getElementById('memberModal').style.display = 'flex';
}

// Delete member
async function deleteMember(id) {
  if (!confirm('Are you sure you want to delete this member?')) return;

  try {
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
  }
}

// Handle member form submission
if (document.getElementById('memberForm')) {
  document.getElementById('memberForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const memberId = document.getElementById('membershipNo').value;
    console.log(memberId);
    if (memberId === 'undefined') {
      showToast("Error: Invalid Member ID. Please refresh and try again.", "error");
      return;
    }

    const memberData = {
      membership_no: document.getElementById('membershipNo').value.trim(),
      name: document.getElementById('memberName').value.trim(),
      mobile: document.getElementById('memberMobile').value.trim(),
      male: Number(document.getElementById('memberMale').value) || 0,
      female: Number(document.getElementById('memberFemale').value) || 0,
      district: document.getElementById('memberDistrict').value.trim(),
      taluka: document.getElementById('memberTaluka').value.trim(),
      panchayat: document.getElementById('memberPanchayat').value.trim(),
      village: document.getElementById('memberVillage').value.trim()
    };

    try {
      const url = memberId
        ? `${API_BASE_URL}/api/members/${memberId}`
        : `${API_BASE_URL}/api/members`;
      const method = memberId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(memberData)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save member');
      }

      showToast(memberId ? 'Member updated successfully!' : 'Member added successfully!', 'success');
      closeMemberModal();
      await loadMembers();
    } catch (err) {
      console.error('Error saving member:', err);
      showToast('Error saving member: ' + err.message, 'error');
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

      const res = await fetch(`${API_BASE_URL} /api/candidates / ${id}/match`, {
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
