// File: assets/js/matrimony.js

const candidates = [
  {
    name: "Puja Badatya",
    gender: "female",
    dob: "1998-04-16",
    age: 27,
    height: "",
    bloodGroup: "",
    gotra: "4218",
    bansha: "Choudhury",
    education: "9th Pass",
    technicalEducation: "Tailoring (Ladies)",
    professionalEducation: "",
    occupation: "Tailoring",
    father: "Alekh Badatya",
    mother: "Sanjukta Badatya",
    address: "Kotilingi, Ganjam, Odisha",
    phone: "6372472773",
    email: "badityasumitara@gmail.com",
    photo: "assets/img/puja-badatya.jpeg"
  },
  {
    name: "Amrita Badatya",
    gender: "female",
    dob: "2006-04-28",
    age: 18,
    height: "5'1\"",
    bloodGroup: "A+",
    gotra: "Nageswara",
    bansha: "Surya Bansha",
    education: "BA Continue",
    technicalEducation: "",
    professionalEducation: "",
    occupation: "",
    father: "Rupak Badatya",
    mother: "Anusaya Badatya",
    address: "Hirakud, Sambalpur",
    phone: "7377800723",
    email: "madhusmitabadatya2020@gmail.com",
    photo: "assets/img/amrita-badatya.jpeg"
  },
  {
    name: "Madhusmita Badatya",
    gender: "female",
    dob: "2003-07-04",
    age: 21,
    height: "5'1\"",
    bloodGroup: "A+",
    gotra: "Nageswara",
    bansha: "Surya Bansha",
    education: "M.Com (Continue)",
    technicalEducation: "",
    professionalEducation: "",
    occupation: "",
    father: "Rupak Badatya",
    mother: "Anusaya Badatya",
    address: "Hirakud, Sambalpur",
    phone: "7377800723",
    email: "madhusmitabadatya2020@gmail.com",
    photo: "assets/img/madhusmita-badatya.jpeg"
  },
  {
    name: "Snehalata Badatya",
    gender: "female",
    dob: "2000-12-03",
    age: 24,
    height: "5'1\"",
    bloodGroup: "O+ve",
    gotra: "Nageswara",
    bansha: "Dash",
    education: "Graduate (B.Com)",
    technicalEducation: "",
    professionalEducation: "",
    occupation: "CA Madhusudan Agraval & Co.",
    father: "Rajendra Badatya",
    mother: "Mamini Badatya",
    address: "Hirakud, Sambalpur",
    phone: "7538055623",
    email: "rajendrabadatya48@gmail.com",
    photo: "assets/img/snehalata-badatya.jpeg"
  },
  {
    name: "Priyanka Badatya",
    gender: "female",
    dob: "1997-07-30",
    age: 27,
    height: "5'1\"",
    bloodGroup: "O+ve",
    gotra: "Nageswara",
    bansha: "Dash",
    education: "Graduate (B.Com)",
    technicalEducation: "",
    professionalEducation: "",
    occupation: "IDFC First Bank Ltd.",
    father: "Rajendra Badatya",
    mother: "Mamini Badatya",
    address: "Hirakud, Sambalpur",
    phone: "7538055623",
    email: "rajendrabadatya48@gmail.com",
    photo: "assets/img/priyanka-badatya.jpeg"
  },
  {
    name: "Sunil Kumar Badatya",
    gender: "male",
    dob: "1994-07-08",
    age: 30,
    height: "5'9\"",
    bloodGroup: "A+ve",
    gotra: "Nageswara",
    bansha: "Dash",
    education: "B.Tech (Software Engineer)",
    technicalEducation: "",
    professionalEducation: "",
    occupation: "Navsoft",
    father: "Rajendra Badatya",
    mother: "Mamini Badatya",
    address: "Hirakud, Sambalpur",
    phone: "7538055623",
    email: "rajendrabadatya48@gmail.com",
    photo: "assets/img/sunil-badatya.jpeg"
  }
];

const container = document.getElementById("profile-list");
const modal = document.getElementById("profile-modal");
const closeBtn = document.querySelector(".close-btn");

function groupByAge(list) {
  const grouped = {};
  list.forEach(c => {
    if (!grouped[c.age]) grouped[c.age] = [];
    grouped[c.age].push(c);
  });
  return grouped;
}

function renderProfiles(gender) {
  container.innerHTML = "";
  const filtered = candidates.filter(c => c.gender === gender);
  const grouped = groupByAge(filtered);
  const sortedAges = Object.keys(grouped).sort((a, b) => b - a);

  sortedAges.forEach(age => {
    const groupSection = document.createElement("div");
    groupSection.className = "age-group";
    groupSection.innerHTML = `<h3>Age: ${age}</h3>`;

    const cardList = document.createElement("div");
    cardList.className = "card-list";

    grouped[age].forEach(person => {
      const card = document.createElement("div");
      card.className = "profile-card";
      card.innerHTML = `
        <img src="${person.photo}" alt="${person.name}" />
        <p>${person.name}</p>
      `;
      card.addEventListener("click", () => showModal(person));
      cardList.appendChild(card);
    });

    groupSection.appendChild(cardList);
    container.appendChild(groupSection);
  });
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

document.getElementById("showGirls").addEventListener("click", () => renderProfiles("female"));
document.getElementById("showBoys").addEventListener("click", () => renderProfiles("male"));

// Load girls by default
renderProfiles("female");
