import { initAuth, signInWithGoogle, signInWithEmail, signUpWithEmail, logout } from "./auth.js";
import { fetchDiscoverProfiles, likeUser, skipUser, superlikeUser } from "./discover.js";
import { loadMatches } from "./matches.js";
import { getChats, listenMessages, sendMessage, createChat } from "./chat.js";
import { loadProfile, updateProfile } from "./profile.js";
import { db, auth } from "./firebase-config.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// DOM elements
const authScreen = document.getElementById("auth-screen");
const appScreen = document.getElementById("app-screen");
const navBtns = document.querySelectorAll(".nav-btn");
const cardStack = document.getElementById("card-stack");
const matchesList = document.getElementById("matches-list");
const chatList = document.getElementById("chat-list");
const profileName = document.getElementById("profile-name");
const profileAge = document.getElementById("profile-age");
const profileBio = document.getElementById("profile-bio");
const profileInterests = document.getElementById("profile-interests");
const profilePhoto = document.getElementById("profile-photo");
const editModal = document.getElementById("edit-modal");
const matchPopup = document.getElementById("match-popup");

let currentUser = null;
let discoverProfiles = [];
let currentIndex = 0;
let currentChatId = null;
let messagesUnsub = null;

// ----- Auth state -----
initAuth({
  onLoggedIn: async (user) => {
    currentUser = user;
    authScreen.classList.remove("active");
    appScreen.classList.add("active");
    await refreshProfile();
    await refreshDiscover();
    await refreshMatches();
    await refreshChats();
    showView("discover");
  },
  onLoggedOut: () => {
    currentUser = null;
    authScreen.classList.add("active");
    appScreen.classList.remove("active");
    if (messagesUnsub) messagesUnsub();
    currentChatId = null;
  }
});

// ----- UI helpers -----
function showView(viewId) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(`${viewId}-view`).classList.add("active");
  navBtns.forEach(btn => {
    if (btn.dataset.view === viewId) btn.classList.add("active");
    else btn.classList.remove("active");
  });
}

function showToast(message, isError = false) {
  alert(message);
}

// ----- Discover -----
async function refreshDiscover() {
  discoverProfiles = await fetchDiscoverProfiles();
  currentIndex = 0;
  renderCard();
}

function renderCard() {
  cardStack.innerHTML = "";
  if (currentIndex >= discoverProfiles.length) {
    document.getElementById("discover-empty").classList.remove("hidden");
    return;
  }
  document.getElementById("discover-empty").classList.add("hidden");
  const profile = discoverProfiles[currentIndex];
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <img class="card-img" src="${profile.photoURL || 'images/default-avatar.png'}" alt="${profile.displayName}">
    <div class="card-info">
      <div class="card-name">${profile.displayName}</div>
      <div class="card-age">${profile.age || '?'} سال</div>
      <div class="card-bio">${profile.bio || ''}</div>
      <div class="interests">${(profile.interests || []).map(i => `<span class="interest-tag">${i}</span>`).join('')}</div>
    </div>
  `;
  cardStack.appendChild(card);
}

async function handleLike() {
  if (currentIndex >= discoverProfiles.length) return;
  const target = discoverProfiles[currentIndex];
  const isMatch = await likeUser(target.id);
  if (isMatch) {
    const chatId = `${currentUser.uid}_${target.id}`;
    await setDoc(doc(db, "chats", chatId), {
      participants: [currentUser.uid, target.id],
      createdAt: new Date(),
      lastMessage: ""
    });
    showMatchPopup(target);
  }
  currentIndex++;
  renderCard();
  if (currentIndex >= discoverProfiles.length) await refreshDiscover();
}

async function handleSkip() {
  if (currentIndex >= discoverProfiles.length) return;
  await skipUser(discoverProfiles[currentIndex].id);
  currentIndex++;
  renderCard();
  if (currentIndex >= discoverProfiles.length) await refreshDiscover();
}

async function handleSuperlike() {
  if (currentIndex >= discoverProfiles.length) return;
  const target = discoverProfiles[currentIndex];
  const isMatch = await superlikeUser(target.id);
  if (isMatch) {
    const chatId = `${currentUser.uid}_${target.id}`;
    await setDoc(doc(db, "chats", chatId), {
      participants: [currentUser.uid, target.id],
      createdAt: new Date(),
      lastMessage: ""
    });
    showMatchPopup(target);
  }
  currentIndex++;
  renderCard();
  if (currentIndex >= discoverProfiles.length) await refreshDiscover();
}

function showMatchPopup(profile) {
  document.getElementById("match-name").innerText = profile.displayName;
  document.getElementById("match-photo").src = profile.photoURL || "images/default-avatar.png";
  matchPopup.classList.remove("hidden");
}

// ----- Matches -----
async function refreshMatches() {
  const matches = await loadMatches();
  if (matches.length === 0) {
    matchesList.innerHTML = "";
    document.getElementById("matches-empty").style.display = "block";
    return;
  }
  document.getElementById("matches-empty").style.display = "none";
  matchesList.innerHTML = matches.map(m => `
    <div class="match-item" data-user-id="${m.userId}">
      <img class="match-avatar" src="${m.photoURL || 'images/default-avatar.png'}" alt="${m.displayName}">
      <span class="match-name">${m.displayName}</span>
    </div>
  `).join("");
  document.querySelectorAll(".match-item").forEach(el => {
    el.addEventListener("click", () => openChat(el.dataset.userId));
  });
}

// ----- Chat -----
async function refreshChats() {
  const chats = await getChats();
  if (chats.length === 0) {
    chatList.innerHTML = "";
    const emptyDiv = document.getElementById("chat-list-empty");
    if (emptyDiv) emptyDiv.classList.remove("hidden");
    return;
  }
  const emptyDiv = document.getElementById("chat-list-empty");
  if (emptyDiv) emptyDiv.classList.add("hidden");
  chatList.innerHTML = chats.map(c => `
    <div class="match-item" data-chat-id="${c.id}" data-user-id="${c.userId}">
      <img class="match-avatar" src="${c.userPhoto || 'images/default-avatar.png'}" alt="${c.userName}">
      <span class="match-name">${c.userName}</span>
    </div>
  `).join("");
  document.querySelectorAll("[data-chat-id]").forEach(el => {
    el.addEventListener("click", () => {
      const chatId = el.dataset.chatId;
      const userId = el.dataset.userId;
      openChatRoom(chatId, userId);
    });
  });
}

function openChatRoom(chatId, otherUserId) {
  currentChatId = chatId;
  if (messagesUnsub) messagesUnsub();
  messagesUnsub = listenMessages(chatId, (messages) => {
    const container = document.getElementById("chat-messages");
    container.innerHTML = messages.map(msg => `
      <div class="message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}">
        ${msg.text}
      </div>
    `).join("");
    container.scrollTop = container.scrollHeight;
  });
  getDoc(doc(db, "users", otherUserId)).then(userDoc => {
    if (userDoc.exists()) {
      document.getElementById("chat-user-name").innerText = userDoc.data().displayName;
    }
  });
  document.getElementById("chat-list").classList.add("hidden");
  document.getElementById("chat-room").classList.remove("hidden");
}

function closeChatRoom() {
  if (messagesUnsub) messagesUnsub();
  currentChatId = null;
  document.getElementById("chat-room").classList.add("hidden");
  document.getElementById("chat-list").classList.remove("hidden");
}

async function sendMessageFromInput() {
  const input = document.getElementById("message-input");
  const text = input.value.trim();
  if (!text || !currentChatId) return;
  await sendMessage(currentChatId, text);
  input.value = "";
}

// ----- Profile -----
async function refreshProfile() {
  const profile = await loadProfile();
  if (profile) {
    profileName.innerText = profile.displayName || "کاربر";
    profileAge.innerText = profile.age ? `${profile.age} سال` : "";
    profileBio.innerText = profile.bio || "";
    profileInterests.innerHTML = (profile.interests || []).map(i => `<span class="interest-tag">${i}</span>`).join("");
    profilePhoto.src = profile.photoURL || "images/default-avatar.png";
  }
}

function showEditModal() {
  loadProfile().then(profile => {
    document.getElementById("edit-name").value = profile.displayName || "";
    document.getElementById("edit-age").value = profile.age || "";
    document.getElementById("edit-bio").value = profile.bio || "";
    document.getElementById("edit-interests").value = (profile.interests || []).join(", ");
    editModal.classList.remove("hidden");
  });
}

async function saveProfile() {
  const name = document.getElementById("edit-name").value.trim();
  const age = parseInt(document.getElementById("edit-age").value);
  const bio = document.getElementById("edit-bio").value.trim();
  const interestsStr = document.getElementById("edit-interests").value.trim();
  const interests = interestsStr ? interestsStr.split(",").map(s => s.trim()).filter(Boolean) : [];
  const photoFile = document.getElementById("edit-photo").files[0];

  const updateData = {
    displayName: name || "کاربر",
    age: isNaN(age) ? null : age,
    bio: bio,
    interests: interests
  };
  await updateProfile(updateData, photoFile);
  editModal.classList.add("hidden");
  await refreshProfile();
}

// ----- Event listeners -----
document.getElementById("google-login").onclick = () => signInWithGoogle();
document.getElementById("show-email-form").onclick = () => document.getElementById("email-form").classList.toggle("hidden");
document.getElementById("email-login").onclick = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signInWithEmail(email, password);
  } catch (err) {
    showToast(err.message, true);
  }
};
document.getElementById("email-signup").onclick = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signUpWithEmail(email, password);
  } catch (err) {
    showToast(err.message, true);
  }
};
document.getElementById("logout-btn").onclick = async () => {
  await logout();
};
document.getElementById("like-btn").onclick = handleLike;
document.getElementById("skip-btn").onclick = handleSkip;
document.getElementById("superlike-btn").onclick = handleSuperlike;
document.getElementById("edit-profile-btn").onclick = showEditModal;
document.getElementById("edit-cancel").onclick = () => editModal.classList.add("hidden");
document.getElementById("edit-save").onclick = saveProfile;
document.getElementById("chat-back").onclick = closeChatRoom;
document.getElementById("send-btn").onclick = sendMessageFromInput;
document.getElementById("message-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessageFromInput();
});

// ** مهم: بستن پاپ‌آپ match با کلیک روی دکمه **
const matchCloseBtn = document.getElementById("match-close");
if (matchCloseBtn) {
  matchCloseBtn.onclick = () => {
    matchPopup.classList.add("hidden");
    showView("chat");
    refreshChats();
  };
}

// ناوبری
navBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view;
    showView(view);
    if (view === "matches") refreshMatches();
    if (view === "chat") refreshChats();
    if (view === "profile") refreshProfile();
  });
});
