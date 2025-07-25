// File: assets/js/admin.js


const adminLogin = document.getElementById("admin-login");
const adminPanel = document.getElementById("admin-panel");
const adminLoginForm = document.getElementById("adminLoginForm");
const addCandidateForm = document.getElementById("addCandidateForm");
const adminCandidates = document.getElementById("adminCandidates");
const excelInput  = document.getElementById("excelFileInput");
const uploadBtn   = document.getElementById("uploadExcelBtn");
const excelStatus = document.getElementById("excelStatus");
const postForm = document.getElementById("addPostForm");
const postList = document.getElementById("adminPosts");

let candidates = [];

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function showSection(id) {
    document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
    document.getElementById(id).style.display = 'block';
  }

// Admin login
adminLoginForm.onsubmit = async function(e) {
  e.preventDefault();
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value.trim();
  if (user === "admin" && pass === "pandara123") {
    adminLogin.style.display = "none";
    adminPanel.style.display = "block";
    document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
    await renderCandidates();
  } else {
    alert("Invalid credentials");
  }
};

// Add or update candidate
addCandidateForm.onsubmit = async e => {
  e.preventDefault();

  const fd = new FormData();
  [
    "name","gender","dob","age","height","bloodGroup","gotra","bansha",
    "education","technicalEducation","professionalEducation","occupation",
    "father","mother","address","phone","email"
  ].forEach(f => {
    const el = document.getElementById("admin"+capitalize(f));
    fd.append(f, el.value.trim());
  });

  const photo = document.getElementById("adminPhotoFile").files[0];
  if (!photo) return alert("Please choose a candidate photo");
  fd.append("photo", photo);

  try {
    await fetch(`${API_BASE_URL}/api/candidates`, { method:"POST", body:fd });
    alert("Candidate saved!");
    addCandidateForm.reset();
    await renderCandidates();
  } catch (err) {
    console.error(err);
    alert("Failed to save candidate – see console");
  }
};

/* ---------- Candidate grid ---------- */
async function renderCandidates () {
  adminCandidates.textContent = "Loading…";
  try {
    const res = await fetch(`${API_BASE_URL}/api/candidates`);
    candidates = await res.json();

    if (!candidates.length) {
      return (adminCandidates.textContent = "No candidates yet");
    }

    adminCandidates.innerHTML = "";
    candidates.forEach(c => {
      const card = document.createElement("div");
      card.className = "profile-card";
      card.innerHTML = `
        <img src="${c.photo}" alt="${c.name}">
        <p>${c.name} (${c.gender}, ${c.age})</p>
        <button class="deleteBtn" data-id="${c.id}">Delete</button>
      `;
      adminCandidates.appendChild(card);
    });

    adminCandidates.querySelectorAll(".deleteBtn").forEach(btn => {
      btn.onclick = async () => {
        if (!confirm("Delete this candidate?")) return;
        await fetch(`${API_BASE_URL}/api/candidates/${btn.dataset.id}`, { method:"DELETE" });
        renderCandidates();
      };
    });
  } catch (err) {
    console.error(err);
    adminCandidates.textContent = "Failed to load candidates";
  }
}

/* ---------- section switch helper (unchanged) ---------- */
function showSection (id) {
  document.querySelectorAll('.admin-section').forEach(s => s.style.display='none');
  document.getElementById(id).style.display = 'block';
}



if (uploadBtn) {
  uploadBtn.onclick = async () => {
    if (!excelInput.files[0]) {
      excelStatus.textContent = "Please choose an .xlsx file first.";
      return;
    }

    excelStatus.textContent = "Reading file…";

    /* 1 → read the workbook */
    const wb = XLSX.read(await excelInput.files[0].arrayBuffer(), {
      type: "array"
    });
    const ws = wb.Sheets[wb.SheetNames[0]];      // first sheet only
    let rows = XLSX.utils.sheet_to_json(ws, {defval:""});

    /* 2 → map headings → API fields
          (trim spaces because your sample sheet has them) */
          rows = rows.map(r => ({
            membership_no : String(r['MEMBERSHIP NO.'] ?? '').trim(), 
            name: String(r["NAME OF THE FAMILY (HEAD)"] ?? '').trim(),
            mobile: String(r["MOB.NO."] ?? '').replace(/\D/g,""),
            male: Number(r["MALE "]||0),
            female: Number(r["FEMALE"]||0),
            district: String(r["DISTRICT"] ?? '').trim(),
            taluka: String(r["TALUKA /"] ?? '').trim(),
            panchayat: String(r["PANCHAYATA"] ?? '').trim(),
            village: String(r["VILLAGE"] ?? '').trim()
          })).filter(r => r.name && r.membership_no); // drop blank rows

    if (rows.length === 0) {
      excelStatus.textContent = "No usable rows found.";
      return;
    }

    /* 3 → POST in bulk */
    excelStatus.textContent = `Uploading ${rows.length} members…`;

    try {
      const fd  = new FormData();
      fd.append("file", excelInput.files[0]);
      const res = await fetch(`${API_BASE_URL}/api/members/import`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({rows})
      });
      if (!res.ok) throw new Error(await res.text());

      excelStatus.textContent = "Import complete ✓";
      excelInput.value = "";           // clear file chooser
      await renderCandidates();        // refresh list/grid
    } catch (err) {
      console.error(err);
      excelStatus.textContent = "Import failed: " + err.message;
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
  const loader  = document.getElementById("excelLoader");
  const status  = document.getElementById("excelStatus");
  const upload  = document.getElementById("uploadExcelBtn");
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

postForm.onsubmit = async e => {
  e.preventDefault();
  const title = document.getElementById("postTitle").value.trim();
  const content = document.getElementById("postContent").value.trim();

  if (!title || !content) return alert("Fill out all fields!");

  try {
    await fetch(`${API_BASE_URL}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content })
    });
    alert("Post added!");
    postForm.reset();
    renderPosts();
  } catch (err) {
    console.error("Post Error:", err);
    alert("Error adding post.");
  }
};

async function renderPosts() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/posts`);
    const posts = await res.json();

    postList.innerHTML = posts.map(p => `
      <div class="post-card">
        <h4>${p.title}</h4>
        <p>${p.content}</p>
        <button onclick="deletePost(${p.id})">Delete</button>
      </div>
    `).join('');
  } catch (err) {
    postList.innerHTML = "<p>Failed to load posts</p>";
  }
}

async function deletePost(id) {
  if (!confirm("Delete this post?")) return;
  await fetch(`${API_BASE_URL}/api/posts/${id}`, { method: "DELETE" });
  renderPosts();
}





