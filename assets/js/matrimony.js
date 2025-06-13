// File: assets/js/matrimony.js

const container = document.getElementById("profile-list");
const modal = document.getElementById("profile-modal");
const closeBtn = document.querySelector(".close-btn");
const genderSelection = document.getElementById("gender-selection");
const maleBtn = document.getElementById("selectMale");
const femaleBtn = document.getElementById("selectFemale");
const backToGender = document.getElementById("backToGender");

async function renderProfiles(gender) {
  container.innerHTML = "<p>Loading profiles...</p>";
  try {
    const res = await fetch(`http://localhost:5000/api/candidates?gender=${gender}`);
    const filtered = await res.json();

    filtered.sort((a, b) => b.age - a.age); // Oldest to youngest

    container.innerHTML = "";
    const cardList = document.createElement("div");
    cardList.className = "card-list";

    filtered.forEach(person => {
      const card = document.createElement("div");
      card.className = "profile-card";
      card.innerHTML = `
        <img src="${person.photo}" alt="${person.name}" />
        <p>${person.name}</p>
      `;
      card.querySelector("img").addEventListener("click", () => showModal(person));
      cardList.appendChild(card);
    });

    container.appendChild(cardList);
    backToGender.style.display = "block";
  } catch (err) {
    console.error("Error loading profiles:", err);
    container.innerHTML = "<p>Failed to load profiles</p>";
  }
}

function showModal(person) {
  document.getElementById("modal-photo").src = person.photo;
  document.getElementById("modal-name").textContent = person.name;
  document.getElementById("modal-age").textContent = person.age;
  document.getElementById("modal-height").textContent = person.height;
  document.getElementById("modal-blood").textContent = person.bloodGroup;
  document.getElementById("modal-gotra").textContent = person.gotra;
  document.getElementById("modal-edu").textContent = person.education;
  document.getElementById("modal-occ").textContent = person.occupation;
  document.getElementById("modal-father").textContent = person.father;
  document.getElementById("modal-mother").textContent = person.mother;
  document.getElementById("modal-phone").textContent = person.phone;
  document.getElementById("modal-email").textContent = person.email;
  document.getElementById("modal-address").textContent = person.address;
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
