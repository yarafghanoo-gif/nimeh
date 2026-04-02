import { initAuth, signInWithGoogle, signInWithEmail, signUpWithEmail, logout } from "./auth.js";
import { fetchDiscoverProfiles, likeUser, skipUser, superlikeUser } from "./discover.js";
import { loadMatches } from "./matches.js";
import { getChats, listenMessages, sendMessage } from "./chat.js";
import { loadProfile, updateProfile } from "./profile.js";
import { db } from "./firebase-config.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// DOM
const authScreen = document.getElementById("auth-screen");
const appScreen = document.getElementById("app-screen");
const navBtns = document.querySelectorAll(".nav-btn");
const cardStack = document.getElementById("card-stack");
const matchesList = document.getElementById("matches-list");
const chatList = document.getElementById("chat-list");
const matchPopup = document.getElementById("match-popup");

let currentUser = null;
let discoverProfiles = [];
let currentIndex = 0;
let currentChatId = null;
let messagesUnsub = null;

// ---------- AUTH ----------
initAuth({
  onLoggedIn: async (user) => {
    currentUser = user;
    authScreen.classList.remove("active");
    appScreen.classList.add("active");

    await refreshDiscover();
    await refreshMatches();
    await refreshChats();

    showView("discover");
  },
  onLoggedOut: () => {
    currentUser = null;
    authScreen.classList.add("active");
    appScreen.classList.remove("active");
  }
});

// ---------- VIEW ----------
function showView(viewId) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(`view-${viewId}`)?.classList.add("active");

  navBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === viewId);
  });
}

// ---------- DISCOVER ----------
async function refreshDiscover() {
  discoverProfiles = await fetchDiscoverProfiles();
  currentIndex = 0;
  renderCard();
}

function renderCard() {
  cardStack.innerHTML = "";

  if (!discoverProfiles.length || currentIndex >= discoverProfiles.length) {
    document.getElementById("discover-empty")?.classList.remove("hidden");
    return;
  }

  document.getElementById("discover-empty")?.classList.add("hidden");

  const profile = discoverProfiles[currentIndex];

  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <img src="${profile.photo || "images/default-avatar.png"}">
    <h2>${profile.displayName || "کاربر"}</h2>
    <p>${profile.bio || ""}</p>
  `;

  cardStack.appendChild(card);
}

async function handleLike() {
  const target = discoverProfiles[currentIndex];
  const isMatch = await likeUser(target.id);

  if (isMatch) {
    const chatId = `${currentUser.uid}_${target.id}`;
    await setDoc(doc(db, "chats", chatId), {
      users: [currentUser.uid, target.id]
    });

    showMatchPopup(target);
  }

  currentIndex++;
  renderCard();
}

async function handleSkip() {
  currentIndex++;
  renderCard();
}

async function handleSuperlike() {
  const target = discoverProfiles[currentIndex];
  const isMatch = await superlikeUser(target.id);

  if (isMatch) showMatchPopup(target);

  currentIndex++;
  renderCard();
}

// ---------- MATCH POPUP (🔥 FIXED) ----------
function showMatchPopup(profile) {
  const nameEl = document.getElementById("match-popup-name");

  if (nameEl) {
    nameEl.innerText = profile.displayName || "کاربر";
  }

  matchPopup.classList.remove("hidden");
}

// بستن پاپاپ
const closeBtn = document.getElementById("match-popup-close");

closeBtn?.addEventListener("click", () => {
  matchPopup.classList.add("hidden");
  showView("chat");
  refreshChats();
});

// بستن با کلیک بیرون
matchPopup?.addEventListener("click", (e) => {
  if (e.target === matchPopup) {
    matchPopup.classList.add("hidden");
  }
});

// ---------- MATCHES ----------
async function refreshMatches() {
  const matches = await loadMatches();

  matchesList.innerHTML = matches.map(m => `
    <div data-user="${m.userId}">${m.displayName}</div>
  `).join("");
}

// ---------- CHAT ----------
async function refreshChats() {
  const chats = await getChats();

  chatList.innerHTML = chats.map(c => `
    <div data-id="${c.id}">${c.userName}</div>
  `).join("");
}

// ---------- EVENTS ----------
document.getElementById("google-login").onclick = signInWithGoogle;
document.getElementById("like-btn").onclick = handleLike;
document.getElementById("skip-btn").onclick = handleSkip;
document.getElementById("superlike-btn").onclick = handleSuperlike;

navBtns.forEach(btn => {
  btn.onclick = () => showView(btn.dataset.view);
});
