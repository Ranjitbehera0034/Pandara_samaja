/* assets/js/members.js — cascading dropdowns + DataTable (fixed) */

const districtSelect  = document.getElementById('districtSelect');
const talukaSelect    = document.getElementById('talukaSelect');
const panchayatSelect = document.getElementById('panchayatSelect');

let allMembers = [];
let dataTable;

/* ───── 1. Fetch data and initialise table ───── */
(async function init () {
  const res = await fetch(`${API_BASE_URL}/api/members`);
  allMembers = await res.json();

  /* populate District dropdown */
  [...new Set(allMembers.map(m => m.district))]        // unique districts
    .sort()
    .forEach(d =>
      districtSelect.insertAdjacentHTML('beforeend',
        `<option value="${d}">${d}</option>`));

  /* boot DataTable */
  dataTable = $('#memberTable').DataTable({
    data   : allMembers,
    columns: [
      { data: 'name'      },
      { data: 'mobile'    },
      { data: 'male'      },
      { data: 'female'    },
      { data: 'district'  },
      { data: 'taluka'    },
      { data: 'panchayat' },
      { data: 'village',  defaultContent: '' }  // ← fix: safe fallback
    ],
    dom     : 'Bfrtip',            // Buttons, filter, table, pagination
    buttons : ['csv']              // needs DataTables Buttons extension
  });
})();

/* ───── 2. Cascading dropdown logic ───── */
districtSelect.addEventListener('change', () => {
  const d = districtSelect.value;

  /* rebuild Taluka list */
  talukaSelect.disabled = !d;
  talukaSelect.innerHTML = '<option value="">Select Taluka</option>';
  if (d) {
    [...new Set(allMembers.filter(m => m.district === d)
                          .map(m => m.taluka))]
      .sort()
      .forEach(t =>
        talukaSelect.insertAdjacentHTML('beforeend',
          `<option value="${t}">${t}</option>`));
  }

  /* reset Panchayat dropdown */
  panchayatSelect.disabled = true;
  panchayatSelect.innerHTML = '<option value="">Select Panchayat</option>';

  filterTable({ district: d });
});

talukaSelect.addEventListener('change', () => {
  const d = districtSelect.value;
  const t = talukaSelect.value;

  /* rebuild Panchayat list */
  panchayatSelect.disabled = !t;
  panchayatSelect.innerHTML = '<option value="">Select Panchayat</option>';
  if (t) {
    [...new Set(allMembers.filter(m =>
        m.district === d && m.taluka === t).map(m => m.panchayat))]
      .sort()
      .forEach(p =>
        panchayatSelect.insertAdjacentHTML('beforeend',
          `<option value="${p}">${p}</option>`));
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

/* ───── 3. Helper to apply filtering ───── */
function filterTable (f) {
  const filtered = allMembers.filter(m =>
    (!f.district  || m.district  === f.district ) &&
    (!f.taluka    || m.taluka    === f.taluka   ) &&
    (!f.panchayat || m.panchayat === f.panchayat)
  );
  dataTable.clear().rows.add(filtered).draw();
}
