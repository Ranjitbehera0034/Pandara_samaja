/* assets/js/members.js — cascading dropdowns + DataTable + leader gallery */

const districtSelect  = document.getElementById('districtSelect');
const talukaSelect    = document.getElementById('talukaSelect');
const panchayatSelect = document.getElementById('panchayatSelect');
const leaderContainer = document.getElementById('leaderContainer');

const districtLeaderImages ={
  "GANJAM": [
    { "name": "Ashok Kumar Badatya",      "src": "assets/img/GANJAM/Ashok Kumar Badatya.png" },
    { "name": "Hrisikesh Badatya",        "src": "assets/img/GANJAM/Hrisikesh Badatya.png" },
    { "name": "Pramod Badatya",           "src": "assets/img/GANJAM/Pramod Badatya.png" },
    { "name": "Santosh Badatya",          "src": "assets/img/GANJAM/Santosh Badatya.png" },
    { "name": "Jagannath Badatya",        "src": "assets/img/GANJAM/Jagannath Badatya.png" },
    { "name": "BanchhaNidhi Behera",      "src": "assets/img/GANJAM/BanchhaNidhi Behera.png" },  
    { "name": "Santosh",                  "src": "assets/img/GANJAM/Santosh.png" },
    { "name": "Sudama Behera",            "src": "assets/img/GANJAM/Sudama Behera.png" },
    { "name": "Susanta Kumar Badatya",    "src": "assets/img/GANJAM/Susanta Kumar Badatya.png" },
    { "name": "Trilochan Badatya",        "src": "assets/img/GANJAM/Trilochan Badatya.png" },
    { "name": "Upendra Badatya",          "src": "assets/img/GANJAM/Upendra Badatya.png" }
  ],
  "JHARSAGUDA": [
    { "name": "RankaMani Badatya",        "src": "assets/img/JHARSAGUDA/RankaMani Badatya.jpg" },
    { "name": "Dhoba Badatya",            "src": "assets/img/JHARSAGUDA/Dhoba Badatya.jpg" },
    { "name": "Manoj Kumar Badatya",      "src": "assets/img/JHARSAGUDA/Manoj Kumar Badatya.jpg" },
    { "name": "Dillip Kumar Badatya",     "src": "assets/img/JHARSAGUDA/Dillip Kumar Badatya.jpg" },    
    { "name": "Manoranjan Badatya",       "src": "assets/img/JHARSAGUDA/Manoranjan Badatya.jpg" },    
    { "name": "Tuna Badatya",             "src": "assets/img/JHARSAGUDA/Tuna Badatya.jpg" }
  ],
  "SAMBALAPUR": [
    { "name": "IMG-20250630-WA0003",      "src": "assets/img/SAMBALAPUR/IMG-20250630-WA0003.jpg" },
    { "name": "IMG-20250630-WA0002",      "src": "assets/img/SAMBALAPUR/IMG-20250630-WA0002.jpg" },
    { "name": "IMG-20250630-WA0006",      "src": "assets/img/SAMBALAPUR/IMG-20250630-WA0006.jpg" },
    { "name": "IMG-20250630-WA0005",      "src": "assets/img/SAMBALAPUR/IMG-20250630-WA0005.jpg" },
    { "name": "IMG-20250630-WA0001",      "src": "assets/img/SAMBALAPUR/IMG-20250630-WA0001.jpg" }, 
    { "name": "IMG-20250630-WA0004",      "src": "assets/img/SAMBALAPUR/IMG-20250630-WA0004.jpg" },
    { "name": "IMG-20250630-WA0008",      "src": "assets/img/SAMBALAPUR/IMG-20250630-WA0008.jpg" },    
    { "name": "IMG-20250630-WA0007",      "src": "assets/img/SAMBALAPUR/IMG-20250630-WA0007.jpg" },    
    { "name": "IMG-20250711-WA0011",      "src": "assets/img/SAMBALAPUR/IMG-20250711-WA0011.jpg" },
    { "name": "IMG-20250711-WA0013",      "src": "assets/img/SAMBALAPUR/IMG-20250711-WA0013.jpg" },
    { "name": "IMG-20250711-WA0014",      "src": "assets/img/SAMBALAPUR/IMG-20250711-WA0014.jpg" },
    { "name": "IMG-20250711-WA0018",      "src": "assets/img/SAMBALAPUR/IMG-20250711-WA0018.jpg" }
  ]
}


function showLeader(district) {
  const key = district.toUpperCase().replace(/\s+/g, '');
  const leaders = districtLeaderImages[key] || [];

  leaderContainer.innerHTML = '';

  if (leaders.length === 0) {
    leaderContainer.style.display = 'none';
    return;
  }

  leaders.forEach(({ name, src }) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'inline-block';
    wrapper.style.textAlign = 'center';
    wrapper.style.margin = '10px';

    const img = document.createElement('img');
    img.src = src;
    img.alt = name;

    const PLACEHOLDER = 'assets/img/placeholder.png';
    
    img.onerror = () => {
      img.onerror = null;                  // prevent infinite loop
      console.warn('Image not found:', src);
      img.src = PLACEHOLDER;               // make sure this file exists!
      img.alt = name + ' (photo unavailable)';
    };
    

    img.style.maxHeight = '200px';
    img.style.borderRadius = '8px';
    img.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';
    img.style.display = 'block';
    img.style.marginBottom = '5px';   

    wrapper.appendChild(img);
    
    leaderContainer.appendChild(wrapper);
  });

  leaderContainer.style.display = 'block';
}



/* ──────────────────────────────────────────────────────────────
   1) Fetch data and initialise table
   ────────────────────────────────────────────────────────────── */
(async function init () {
  const res = await fetch(`${API_BASE_URL}/api/members`);
  allMembers = await res.json();

  // populate District dropdown
  [...new Set(allMembers.map(m => m.district))]
    .sort()
    .forEach(d => {
      districtSelect.insertAdjacentHTML(
        'beforeend',
        `<option value="${d}">${d}</option>`
      );
    });

  // boot DataTable
  dataTable = $('#memberTable').DataTable({
    data   : allMembers,
    columns: [
      { data: 'membership_no', title: 'Membership No.' },
      { data: 'name'      },
      { data: 'mobile'    },
      { data: 'male'      },
      { data: 'female'    },
      { data: 'district'  },
      { data: 'taluka'    },
      { data: 'panchayat' },
      { data: 'village',  defaultContent: '' }
    ],
    dom     : 'Bfrtip',
    buttons : ['csv']
  });
})();

/* ──────────────────────────────────────────────────────────────
   2) Cascading dropdown logic
   ────────────────────────────────────────────────────────────── */

// NOTE: You had two separate 'change' listeners for district.
// Merge into one to avoid duplicate work.
districtSelect.addEventListener('change', () => {
  const d = districtSelect.value;

  // show leader gallery
  showLeader(d);

  // rebuild Taluka list
  talukaSelect.disabled = !d;
  talukaSelect.innerHTML = '<option value="">Select Taluka</option>';
  if (d) {
    [...new Set(allMembers.filter(m => m.district === d).map(m => m.taluka))]
      .sort()
      .forEach(t => {
        talukaSelect.insertAdjacentHTML('beforeend', `<option value="${t}">${t}</option>`);
      });
  }

  // reset Panchayat
  panchayatSelect.disabled = true;
  panchayatSelect.innerHTML = '<option value="">Select Panchayat</option>';

  filterTable({ district: d });
});

talukaSelect.addEventListener('change', () => {
  const d = districtSelect.value;
  const t = talukaSelect.value;

  // rebuild Panchayat list
  panchayatSelect.disabled = !t;
  panchayatSelect.innerHTML = '<option value="">Select Panchayat</option>';
  if (t) {
    [...new Set(
      allMembers
        .filter(m => m.district === d && m.taluka === t)
        .map(m => m.panchayat)
    )]
      .sort()
      .forEach(p => {
        panchayatSelect.insertAdjacentHTML('beforeend', `<option value="${p}">${p}</option>`);
      });
  }

  filterTable({ district: d, taluka: t });
});

panchayatSelect.addEventListener('change', () => {
  filterTable({
    district : districtSelect.value,
    taluka   : talukaSelect.value,
    panchayat: panchayatSelect.value
  });
});

/* ──────────────────────────────────────────────────────────────
   3) Helper to apply filtering
   ────────────────────────────────────────────────────────────── */
function filterTable (f) {
  const filtered = allMembers.filter(m =>
    (!f.district  || m.district  === f.district ) &&
    (!f.taluka    || m.taluka    === f.taluka   ) &&
    (!f.panchayat || m.panchayat === f.panchayat)
  );
  dataTable.clear().rows.add(filtered).draw();
}
