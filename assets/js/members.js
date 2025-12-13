/* assets/js/members.js – cascading dropdowns + DataTable + leader gallery */

let allMembers = [];
let dataTable = null;

// Helper function to get auth headers with JWT token
function getAuthHeaders() {
  const token = localStorage.getItem("adminToken");
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

const districtSelect = document.getElementById('districtSelect');
const talukaSelect = document.getElementById('talukaSelect');
const panchayatSelect = document.getElementById('panchayatSelect');
const leaderContainer = document.getElementById('leaderContainer');

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
      img.onerror = null;
      console.warn('Image not found:', src);
      img.src = PLACEHOLDER;
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

/* ────────────────────────────────────────────────────────────────
   1) Fetch data and initialise table
   ──────────────────────────────────────────────────────────────── */
(async function init() {
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  try {
    const res = await fetch(`${API_BASE_URL}/api/members`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    allMembers = await res.json();
    console.log(`Loaded ${allMembers.length} members`);
  } catch (err) {
    console.error("Failed to load members:", err);
    allMembers = [];
  }

  // populate District dropdown
  if (allMembers.length > 0) {
    [...new Set(allMembers.map(m => m.district))]
      .filter(Boolean)
      .sort()
      .forEach(d => {
        districtSelect.insertAdjacentHTML(
          'beforeend',
          `<option value="${d}">${d}</option>`
        );
      });
  }

  // Helper function to mask mobile numbers (show only last 4 digits)
  function maskMobile(mobile) {
    if (!mobile || mobile.length < 4) return '******';
    return '******' + mobile.slice(-4);
  }

  // Build columns - mask mobile for non-admin users
  const columns = [
    { data: 'membership_no', title: 'Membership No.', defaultContent: '' },
    { data: 'name', title: 'Name', defaultContent: '' },
    {
      data: 'mobile',
      title: 'Mobile',
      defaultContent: '',
      render: function (data, type, row) {
        // Only mask for display, not for sorting/filtering
        if (type === 'display' && !isAdmin) {
          return maskMobile(data);
        }
        return data || '';
      }
    },
    { data: 'male', title: 'Male', defaultContent: '0' },
    { data: 'female', title: 'Female', defaultContent: '0' },
    { data: 'district', title: 'District', defaultContent: '' },
    { data: 'taluka', title: 'Taluka', defaultContent: '' },
    { data: 'panchayat', title: 'Panchayat', defaultContent: '' },
    { data: 'village', title: 'Village', defaultContent: '' }
  ];

  // Add actions column for admin - but also need to add the column to HTML table
  if (isAdmin) {
    // Check if Actions column header exists, if not add it
    const thead = document.querySelector('#memberTable thead tr');
    if (thead && !thead.querySelector('th:nth-child(10)')) {
      const th = document.createElement('th');
      th.textContent = 'Actions';
      thead.appendChild(th);
    }

    columns.push({
      data: null,
      title: 'Actions',
      orderable: false,
      render: function (data, type, row) {
        const id = row.id || row._id;
        if (!id) return '';
        return `<button class="btn-delete" data-id="${id}" style="background:#dc3545; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Delete</button>`;
      }
    });
  }

  // Destroy existing DataTable if present
  if ($.fn.DataTable.isDataTable('#memberTable')) {
    $('#memberTable').DataTable().destroy();
    // Clear the table body to prevent column mismatch
    $('#memberTable tbody').empty();
  }

  // Initialize DataTable
  dataTable = $('#memberTable').DataTable({
    data: allMembers,
    columns: columns,
    dom: 'Bfrtip',
    buttons: ['csv'],
    language: {
      emptyTable: "No members found"
    },
    destroy: true // Allow reinitialization
  });

  // Add delete handler for admin
  if (isAdmin) {
    $('#memberTable tbody').off('click', 'button.btn-delete'); // Remove any existing handlers
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

          // Remove row from DataTable
          dataTable.row($(this).parents('tr')).remove().draw();

          // Update local data array
          allMembers = allMembers.filter(m => (m.id || m._id) != id);
        } catch (err) {
          alert('Failed to delete member: ' + err.message);
          console.error(err);
        }
      }
    });
  }
})();

/* ────────────────────────────────────────────────────────────────
   2) Cascading dropdown logic
   ──────────────────────────────────────────────────────────────── */

districtSelect.addEventListener('change', () => {
  const d = districtSelect.value;

  // show leader gallery
  showLeader(d);

  // rebuild Taluka list
  talukaSelect.disabled = !d;
  talukaSelect.innerHTML = '<option value="">Select Taluka</option>';
  if (d) {
    [...new Set(allMembers.filter(m => m.district === d).map(m => m.taluka))]
      .filter(Boolean)
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
      .filter(Boolean)
      .sort()
      .forEach(p => {
        panchayatSelect.insertAdjacentHTML('beforeend', `<option value="${p}">${p}</option>`);
      });
  }

  filterTable({ district: d, taluka: t });
});

panchayatSelect.addEventListener('change', () => {
  filterTable({
    district: districtSelect.value,
    taluka: talukaSelect.value,
    panchayat: panchayatSelect.value
  });
});

/* ────────────────────────────────────────────────────────────────
   3) Helper to apply filtering
   ──────────────────────────────────────────────────────────────── */
function filterTable(f) {
  const filtered = allMembers.filter(m =>
    (!f.district || m.district === f.district) &&
    (!f.taluka || m.taluka === f.taluka) &&
    (!f.panchayat || m.panchayat === f.panchayat)
  );
  dataTable.clear().rows.add(filtered).draw();
}