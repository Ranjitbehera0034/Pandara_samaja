const adminLogin = document.getElementById("admin-login");
const adminPanel = document.getElementById("admin-panel");
const adminLoginForm = document.getElementById("adminLoginForm");
const addCandidateForm = document.getElementById("addCandidateForm");
const adminCandidates = document.getElementById("adminCandidates");

let candidates = JSON.parse(localStorage.getItem("candidates") || "[]");

function saveCandidates() {
  localStorage.setItem("candidates", JSON.stringify(candidates));
}

function renderCandidates() {
  adminCandidates.innerHTML = "";
  if (candidates.length === 0) {
    adminCandidates.innerHTML = "<p>No candidates added yet.</p>";
    return;
  }
  candidates.forEach((c, idx) => {
    const div = document.createElement("div");
    div.className = "profile-card";
    div.innerHTML = `
      <img src="${c.photo}" alt="${c.name}" />
      <p>${c.name} (${c.gender}, ${c.age})</p>
      <button class="editBtn" data-idx="${idx}">Edit</button>
      <button class="deleteBtn" data-idx="${idx}">Delete</button>
    `;
    adminCandidates.appendChild(div);
  });

  // Edit
  adminCandidates.querySelectorAll(".editBtn").forEach(btn => {
    btn.onclick = function() {
      const idx = this.dataset.idx;
      const c = candidates[idx];
      document.getElementById("adminName").value = c.name;
      document.getElementById("adminGender").value = c.gender;
      document.getElementById("adminAge").value = c.age;
      document.getElementById("adminPhoto").value = c.photo;
      candidates.splice(idx, 1);
      saveCandidates();
      renderCandidates();
    };
  });

  // Delete
  adminCandidates.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.onclick = function() {
      const idx = this.dataset.idx;
      if (confirm("Delete this candidate?")) {
        candidates.splice(idx, 1);
        saveCandidates();
        renderCandidates();
      }
    };
  });
}

adminLoginForm.onsubmit = function(e) {
  e.preventDefault();
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value.trim();
  if (user === "admin" && pass === "pandara123") {
    adminLogin.style.display = "none";
    adminPanel.style.display = "block";
    renderCandidates();
  } else {
    alert("Invalid credentials");
  }
};

addCandidateForm.onsubmit = function(e) {
  e.preventDefault();
  const name = document.getElementById("adminName").value.trim();
  const gender = document.getElementById("adminGender").value;
  const age = parseInt(document.getElementById("adminAge").value);
  const photo = document.getElementById("adminPhoto").value.trim();
  if (!name || !gender || !age || !photo) {
    alert("Fill all fields");
    return;
  }
  candidates.push({ name, gender, age, photo });
  saveCandidates();
  renderCandidates();
  addCandidateForm.reset();
};