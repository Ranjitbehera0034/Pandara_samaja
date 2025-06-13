// File: assets/js/matrimony.js

const container = document.getElementById("profile-list");
const modal = document.getElementById("profile-modal");
const closeBtn = document.querySelector(".close-btn");
const genderSelection = document.getElementById("gender-selection");
const maleBtn = document.getElementById("selectMale");
const femaleBtn = document.getElementById("selectFemale");
const backToGender = document.getElementById("backToGender");

function imageURL(raw) {
  const m = raw.match(/id=([^&]+)/);
  return m ? `https://lh3.googleusercontent.com/d/${m[1]}` : raw;
}

async function renderProfiles(gender) {
  container.innerHTML = "<p>Loading profiles...</p>";
  try {
    const res = await fetch(`${API_BASE_URL}/api/candidates?gender=${gender}`);
    const filtered = await res.json();

    filtered.sort((a, b) => b.age - a.age); // Oldest to youngest

    container.innerHTML = "";
    const cardList = document.createElement("div");
    cardList.className = "card-list";

    filtered.forEach(person => {
       const imgUrl = imageURL(person.photo);  // ← convert here
       console.log(imgUrl);
       const card = document.createElement("div");
       card.className = "profile-card";       
    card.innerHTML = `
  <img src="${imageURL(person.photo)}" alt="${person.name}">
  <p>${person.name}</p>
`;

document.getElementById('modal-photo').src =
  imageURL(person.photo);
       card.querySelector("img")
           .addEventListener("click", () => showModal(person));
       cardList.appendChild(card);
     });

    container.appendChild(cardList);
    backToGender.style.display = "block";
  } catch (err) {
    console.error("Error loading profiles:", err);
    container.innerHTML = "<p>Failed to load profiles</p>";
  }
}

function showModal(p) {
  document.getElementById("modal-photo").src      = imageURL(p.photo);
  document.getElementById("modal-name").textContent   = p.name;
  document.getElementById("modal-age").textContent    = p.age;
  document.getElementById("modal-height").textContent = p.height;
  document.getElementById("modal-blood").textContent  = p.blood_group || p.bloodGroup;
  document.getElementById("modal-gotra").textContent  = p.gotra;
  document.getElementById("modal-edu").textContent    = p.education;
  document.getElementById("modal-occ").textContent    = p.occupation;
  document.getElementById("modal-father").textContent = p.father;
  document.getElementById("modal-mother").textContent = p.mother;
  document.getElementById("modal-phone").textContent  = p.phone;
  document.getElementById("modal-email").textContent  = p.email || "—";
  document.getElementById("modal-address").textContent= p.address;

  modal.classList.remove("hidden");
}

closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
window.addEventListener("click", e => {
  if (e.target === modal) modal.classList.add("hidden");
});

maleBtn.addEventListener("click", () => {
  genderSelection.style.display = "none";
  renderProfiles("male");
});

femaleBtn.addEventListener("click", () => {
  genderSelection.style.display = "none";
  renderProfiles("female");
});

backToGender.addEventListener("click", () => {
  container.innerHTML = "";
  backToGender.style.display = "none";
  genderSelection.style.display = "block";
});
