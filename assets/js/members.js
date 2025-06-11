// assets/js/members.js
const districtEl   = document.getElementById('districtContainer');
const talukaEl     = document.getElementById('talukaContainer');
const panchayatEl  = document.getElementById('panchayatContainer');
const searchInput  = document.getElementById('searchInput');
const tblBody      = document.querySelector('#memberTable tbody');
const memberWrap   = document.getElementById('memberWrapper');
const membersTitle = document.getElementById('membersTitle');
const downloadBtn  = document.getElementById('downloadBtn');

const hdDistrict = document.getElementById('districtHeading');
const hdTaluka   = document.getElementById('talukaHeading');
const hdPanchayat= document.getElementById('panchayatHeading');

let allMembers = [];
let currentDistrict='', currentTaluka='', currentPanchayat='';

(async function init(){
  const res = await fetch('http://localhost:5000/api/members');
  allMembers = await res.json();
  renderDistrictCards();
})();

function renderDistrictCards(){
  resetBelow('district');
  const districts = uniq(allMembers.map(m=>m.district));
  hdDistrict.hidden = false;
  districtEl.innerHTML = districts.map(d=>card(d)).join('');
  addCardHandlers(districtEl,'district');
}
function renderTalukaCards(){
  resetBelow('taluka');
  const talukas = uniq(allMembers
    .filter(m=>m.district===currentDistrict)
    .map(m=>m.taluka));
  hdTaluka.hidden = false;
  talukaEl.innerHTML = talukas.map(t=>card(t)).join('');
  addCardHandlers(talukaEl,'taluka');
}
function renderPanchayatCards(){
  resetBelow('panchayat');
  const panchayats = uniq(allMembers
    .filter(m=>m.district===currentDistrict && m.taluka===currentTaluka)
    .map(m=>m.panchayat));
  hdPanchayat.hidden = false;
  panchayatEl.innerHTML = panchayats.map(p=>card(p)).join('');
  addCardHandlers(panchayatEl,'panchayat');
}
async function renderMembersTable(){
  if(!currentDistrict||!currentTaluka||!currentPanchayat)return;
  const res = await fetch(
    `http://localhost:5000/api/members/by-location?district=${currentDistrict}&taluka=${currentTaluka}&panchayat=${currentPanchayat}`
  );
  const members = await res.json();
  membersTitle.textContent =
    `${currentPanchayat}, ${currentTaluka}, ${currentDistrict}`;
  tblBody.innerHTML = members.map(m=>`
    <tr>
      <td>${m.name}</td><td>${m.mobile}</td>
      <td>${m.male}</td><td>${m.female}</td>
    </tr>`).join('');
  memberWrap.hidden = false;
}
/* ------- helpers ------- */
function card(text){return `<div class="card" data-val="${text}">${text}</div>`;}
function uniq(arr){return [...new Set(arr)].sort();}
function addCardHandlers(container,level){
  container.querySelectorAll('.card').forEach(card=>{
    card.addEventListener('click',e=>{
      // visual selection
      container.querySelectorAll('.card').forEach(c=>c.classList.remove('selected'));
      card.classList.add('selected');
      // set state and cascade
      if(level==='district'){currentDistrict = card.dataset.val; renderTalukaCards();}
      else if(level==='taluka'){currentTaluka = card.dataset.val; renderPanchayatCards();}
      else if(level==='panchayat'){currentPanchayat = card.dataset.val; renderMembersTable();}
    });
  });
}
function resetBelow(level){
  if(level==='district'){
    talukaEl.innerHTML = panchayatEl.innerHTML = '';
    hdTaluka.hidden = hdPanchayat.hidden = true;
    memberWrap.hidden = true; tblBody.innerHTML = '';
    currentTaluka=currentPanchayat='';
  }
  else if(level==='taluka'){
    panchayatEl.innerHTML = ''; hdPanchayat.hidden = true;
    memberWrap.hidden = true; tblBody.innerHTML = '';
    currentPanchayat='';
  }
}
/* search still works, overrides selection */
searchInput.addEventListener('input',async e=>{
  const kw = e.target.value.trim().toLowerCase();
  if(!kw){memberWrap.hidden=true;tblBody.innerHTML='';return;}
  const res = await fetch(`http://localhost:5000/api/members/search?keyword=${kw}`);
  const members = await res.json();
  membersTitle.textContent = `Search results (${members.length})`;
  tblBody.innerHTML = members.map(m=>`
    <tr><td>${m.name}</td><td>${m.mobile}</td>
        <td>${m.male}</td><td>${m.female}</td></tr>`).join('');
  memberWrap.hidden=false;
});
/* CSV download */
downloadBtn.addEventListener('click',()=>{
  const rows=[['Name','Mobile','Male','Female']].concat(
    [...tblBody.querySelectorAll('tr')].map(tr=>[...tr.children].map(td=>td.textContent))
  );
  const csv = rows.map(r=>r.map(v=>`"${v.replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const link=Object.assign(document.createElement('a'),{
    href:URL.createObjectURL(blob),
    download:`members_${Date.now()}.csv`
  });
  link.click(); URL.revokeObjectURL(link.href);
});
