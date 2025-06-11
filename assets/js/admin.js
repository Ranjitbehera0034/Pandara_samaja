// File: assets/js/admin.js
import { API_BASE_URL } from './config.js';

const adminLogin = document.getElementById("admin-login");
const adminPanel = document.getElementById("admin-panel");
const adminLoginForm = document.getElementById("adminLoginForm");
const addCandidateForm = document.getElementById("addCandidateForm");
const adminCandidates = document.getElementById("adminCandidates");
const excelInput  = document.getElementById("excelFileInput");
const uploadBtn   = document.getElementById("uploadExcelBtn");
const excelStatus = document.getElementById("excelStatus");

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
addCandidateForm.onsubmit = async function (e) {
  e.preventDefault();

  const formData = new FormData();
  const fields = [
    "name", "gender", "dob", "age", "height", "bloodGroup", "gotra", "bansha",
    "education", "technicalEducation", "professionalEducation", "occupation",
    "father", "mother", "address", "phone", "email"
  ];
  for (const field of fields) {
    const el = document.getElementById("admin" + capitalize(field));
    formData.append(field, el.value.trim());
  }

  const photoFile = document.getElementById("adminPhotoFile").files[0];
  if (!photoFile) return alert("Please upload a photo");
  formData.append("photo", photoFile);

  try {
    await fetch(`${API_BASE_URL}/api/candidates`, {
      method: "POST",
      body: formData,
    });
    alert("Candidate added");
    addCandidateForm.reset();
    await renderCandidates();
  } catch (err) {
    console.error("Upload failed", err);
    alert("Failed to add candidate");
  }
};


// Render all candidates
async function renderCandidates() {
  adminCandidates.innerHTML = "<p>Loading...</p>";
  try {
    const res = await fetch(`${API_BASE_URL}/api/candidates`);
    candidates = await res.json();

    if (candidates.length === 0) {
      adminCandidates.innerHTML = "<p>No candidates added yet.</p>";
      return;
    }

    adminCandidates.innerHTML = "";
    candidates.forEach((c, idx) => {
      const div = document.createElement("div");
      div.className = "profile-card";
      div.innerHTML = `
        <img src="${c.photo}" alt="${c.name}" />
        <p>${c.name} (${c.gender}, ${c.age})</p>
        <button class="deleteBtn" data-id="${c._id}">Delete</button>
      `;
      adminCandidates.appendChild(div);
    });

    // Handle delete
    document.querySelectorAll(".deleteBtn").forEach(btn => {
      btn.onclick = async function () {
        const id = this.getAttribute("data-id");
        if (confirm("Delete this candidate?")) {
          try {
            await fetch(`${API_BASE_URL}/api/candidates/${id}`, {
              method: "DELETE"
            });
            await renderCandidates();
          } catch (err) {
            alert("Failed to delete candidate.");
            console.error(err);
          }
        }
      };
    });

 

  } catch (err) {
    console.error("Error fetching candidates:", err);
    adminCandidates.innerHTML = "<p>Failed to load candidates</p>";
  }
}

 function initOCR() {
  const ocrBtn    = document.getElementById("ocrUploadBtn");
  const fileInput = document.getElementById("ocrImageInput");
  const statusDiv = document.getElementById("ocrStatus");

  if (!ocrBtn || !fileInput) return;   // section might still be hidden

  /* attach only once */
  if (ocrBtn.dataset.bound) return;
  ocrBtn.dataset.bound = "true";

  ocrBtn.onclick = async () => {
    if (!fileInput.files[0]) {
      statusDiv.textContent = "Please select an image file.";
      return;
    }

    statusDiv.textContent = "Extracting data, please wait…";

    const reader = new FileReader();
    reader.onload = async ({ target }) => {
  console.log("OCR button clicked");         //  <-- NEW

  const { data: { text } } = await Tesseract.recognize(
    target.result, "ori",
    { logger: m => (statusDiv.textContent = m.status) }
  );
  console.log("RAW OCR →\n", text);          //  <-- NEW

  const formData = parseOcrToFields(text);
  console.log("PARSED DATA →", formData);    //  <-- NEW

  for (const [field, value] of Object.entries(formData)) {
    if (value == null || value === "") continue;
    const el = document.getElementById("admin" + capitalize(field));
    if (el && !el.value) {
      console.log(`FILL ${el.id} → "${value}"`);  //  <-- NEW
      el.value = value;
    }
  }
  statusDiv.textContent = "Extraction complete. Please verify.";
};


    reader.readAsDataURL(fileInput.files[0]);
  };}

  document.addEventListener("click", e => {
  if (e.target.matches('button[onclick*="matrimonySection"]')) {
    setTimeout(initOCR, 0);
  }
});

/* ----------  OCR → form-field mapper  ---------- */
/* ------------------------------------------------------------------
   Robust OCR → form-field mapper for Pandara matrimony sheets
   Put this in admin.js **instead of** the old parseOcrToFields().
   ------------------------------------------------------------------ */
function parseOcrToFields(raw) {
  /* 1 ───────────── NORMALISE THE BLOCK ───────────── */
  const text = raw
    .replace(/\r\n?/g, "\n")            // CRLF → LF
    .replace(/[|‖¦]+/g, " ")            // vertical bar artefacts
    .replace(/[_\-]{2,}/g, " ")         // long underlines
    .replace(/\s{2,}/g, " ")            // collapse double spaces
    .toUpperCase();

  /* split into lines once, keep index for “next line” logic */
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  /* helper: get the portion after a keyword on the *same* line,
             or the very next non-empty line if nothing after keyword */
  const after = (needle) => {
    const i = lines.findIndex(l => l.includes(needle));
    if (i === -1) return "";
    const cut = lines[i].split(needle)[1].trim();
    return cut || (lines[i + 1] || "").trim();
  };

  /* 2 ───────────── DIRECT PATTERN GRABS ───────────── */
  const out = {};

  // Name  (look after “SON/DAUGHTER” or just “NAME” + take next line)
  out.name = after("NAME OF THE SON")  ||
             after("NAME OF THE DAUGHTER") ||
             after("NAME ");

  // Height (digits + optional ' , . or ″ )
  const heightMatch = text.match(/HEIGHT[^A-Z0-9]{0,5}([\d.'″ ]{2,7})/);
  out.height = heightMatch ? heightMatch[1].replace(/\s+/g,"").replace(/[′″]/g,"'") : "";

  // Blood group  (A, B, AB, O + optional + / - )
  const bloodMatch = text.match(/BLOOD GROUP[^A-Z0-9]{0,5}([ABO]{1,2}[+-]?)/);
  out.bloodGroup = bloodMatch ? bloodMatch[1] : "";

  // DOB  → ISO yyyy-mm-dd
  const dobLine = after("DATE ") || after("DATE OF BIRTH");
  const dmy = dobLine.match(/(\d{1,2})[^A-Z0-9]+([A-Z]{3,9})[^A-Z0-9]+(\d{4})/);
  if (dmy) {
    const [, d, monText, y] = dmy;
    const month = ["JAN","FEB","MAR","APR","MAY","JUN",
                   "JUL","AUG","SEP","OCT","NOV","DEC"]
                   .indexOf(monText.slice(0,3)) + 1;
    if (month) out.dob = `${y}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  }

  // Age  → first 1-3 digit run *after “AGE” OR computed from DOB*
  const ageMatch = text.match(/AGE[^0-9]{0,4}(\d{1,3})/);
  if (ageMatch) out.age = ageMatch[1];
  else if (out.dob) {
    const thisYear = new Date().getFullYear();
    out.age = thisYear - Number(out.dob.slice(0,4));
  }

  // Gotra + Bansha
  out.gotra  = after("GOTRA")  || after("GOTR");
  out.bansha = after("BANSHA") || after("BANS");

  // Education blocks
  out.education              = after("ACADEMIC EDUCATION");
  out.technicalEducation     = after("TECHNICAL EDUCATION");
  out.professionalEducation  = after("PROFESSIONAL EDUCATION");

  // Occupation   (NON-GOVT / GOVT etc. → use first word on that row)
  const occLine = after("OCCUPATIONAL GROUND") || after("OCCUPATION") ||
                  after("OCCUPATIONAL");
  out.occupation = occLine.split(" ")[0];

  // Father / Mother
  out.father = after("NAME OF THE FATHER") || after("FATHER");
  out.mother = after("NAME OF THE MOTHER") || after("MOTHER");

  // Phone  – pick the first 10-digit number
  const phone = (text.match(/\d{10}/g) || [])[0];
  if (phone) out.phone = phone;

  // Address  – join district + panchayat + village
  const addrLine = after("DISTRICT NAME");
  if (addrLine) {
    const district = addrLine.split(" ")[0];
    const village  = after("VILLAGE NAME");
    out.address = [district, village].filter(Boolean).join(", ");
  } else {
    // fallback: first occurrence of GANJAM/ CUTTACK/ etc.
    const addrMatch = text.match(/\b(KENDRAPARA|GANJAM|CUTTACK|KHORDHA|PURI)\b[^\n]{0,40}/);
    out.address = addrMatch ? addrMatch[0] : "";
  }

  // Gender
  if (/SON/.test(text))       out.gender = "male";
  else if (/DAUGHTER/.test(text)) out.gender = "female";

  /* 3 ───────────── CLEAN-UPS ───────────── */
  Object.keys(out).forEach(k => {
    out[k] = out[k]?.replace(/[^0-9A-Z.'+\- ]/gi, " ").trim(); // strip junk
    if (!out[k]) delete out[k];                               // drop empties
  });

  return out;
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
      name:               r["NAME OF THE FAMILY (HEAD)"]?.trim(),
      mobile:             String(r["MOB.NO."]).replace(/\D/g,""),
      male:               Number(r["MALE "]||0),
      female:             Number(r["FEMALE"]||0),
      district:           r["DISTRICT"]?.trim(),
      taluka:             r["TALUKA /"]?.trim(),      // note column name
      panchayat:          r["PANCHAYATA"]?.trim(),
      village:            r["VILLAGE"]?.trim()
    })).filter(r => r.name && r.mobile);  // drop blank rows

    if (rows.length === 0) {
      excelStatus.textContent = "No usable rows found.";
      return;
    }

    /* 3 → POST in bulk */
    excelStatus.textContent = `Uploading ${rows.length} members…`;

    try {
      const res = await fetch(`${API_BASE_URL}/api/members/bulk-import`, {
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





