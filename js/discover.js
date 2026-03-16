// discover.js
import { auth, db } from './firebase-config.js';
import { collection, query, where, getDocs, doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const USERS_COLLECTION = 'users';
const SWIPES_SUB = 'swipes';
const MATCHES_SUB = 'matches';

let currentUserId = null;
let usersList = [];
let currentIndex = 0;

// Wait for auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserId = user.uid;
    loadUsers();
  } else {
    // Redirect to login if not logged in
    window.location.href = 'index.html';
  }
});

async function loadUsers() {
  const cardsEl = document.getElementById('discover-stack');
  const emptyEl = document.getElementById('discover-empty');
  if (!cardsEl) return;

  try {
    // Fetch all users except current user
    const usersQuery = query(collection(db, USERS_COLLECTION));
    const querySnapshot = await getDocs(usersQuery);
    
    usersList = [];
    querySnapshot.forEach((doc) => {
      if (doc.id !== currentUserId) {
        usersList.push({ id: doc.id, ...doc.data() });
      }
    });

    if (usersList.length === 0) {
      showEmptyState(emptyEl, 'No users found.');
      return;
    }

    currentIndex = 0;
    renderCard(currentIndex);
  } catch (error) {
    console.error('Error loading users:', error);
    showEmptyState(emptyEl, 'Error loading users.');
  }
}

function renderCard(index) {
  const cardsEl = document.getElementById('discover-stack');
  const emptyEl = document.getElementById('discover-empty');
  if (!cardsEl) return;

  // Clear previous cards
  cardsEl.innerHTML = '';

  if (index >= usersList.length) {
    showEmptyState(emptyEl, 'No more people to show. Check back later!');
    return;
  }

  const user = usersList[index];
  const card = createCardElement(user);
  cardsEl.appendChild(card);
}

function createCardElement(user) {
  const card = document.createElement('div');
  card.className = 'discover-card';

  const photoUrl = user.photoURL || user.photoUrl || 'https://via.placeholder.com/150';
  const name = user.displayName || user.name || 'No name';
  const age = user.age || '?';
  const bio = user.bio || '';

  card.innerHTML = `
    <div class="discover-card-photo" style="background-image:url('${photoUrl}')"></div>
    <div class="discover-card-info">
      <div class="discover-card-name">${escapeHtml(name)}</div>
      <div class="discover-card-age">${escapeHtml(age)} years</div>
      <div class="discover-card-bio">${escapeHtml(bio)}</div>
    </div>
    <div class="discover-card-actions">
      <button type="button" class="discover-btn discover-btn-dislike" data-action="dislike" aria-label="Dislike">✕</button>
      <button type="button" class="discover-btn discover-btn-superlike" data-action="superlike" aria-label="Super like">★</button>
      <button type="button" class="discover-btn discover-btn-like" data-action="like" aria-label="Like">♥️</button>
    </div>
  `;

  card.querySelectorAll('.discover-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      handleSwipe(currentUserId, user.id, action, card);
    });
  });

  return card;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function handleSwipe(currentUserId, targetUserId, action, cardEl) {
  const cardsEl = document.getElementById('discover-stack');
  const emptyEl = document.getElementById('discover-empty');
  const swipeRef = doc(db, USERS_COLLECTION, currentUserId, SWIPES_SUB, targetUserId);

  try {
    // Write our swipe
    await setDoc(swipeRef, {
      targetId: targetUserId,
      action,
      timestamp: new Date().toISOString(),
    });

    let isMatch = false;
    if (action === 'like' || action === 'superlike') {
      const theirSwipeRef = doc(db, USERS_COLLECTION, targetUserId, SWIPES_SUB, currentUserId);
      const theirSwipe = await getDoc(theirSwipeRef);
      if (theirSwipe.exists() && (theirSwipe.data().action === 'like' || theirSwipe.data().action === 'superlike')) {
        isMatch = true;
        const batch = writeBatch(db);
        const myMatchRef = doc(db, USERS_COLLECTION, currentUserId, MATCHES_SUB, targetUserId);
        const theirMatchRef = doc(db, USERS_COLLECTION, targetUserId, MATCHES_SUB, currentUserId);
        batch.set(myMatchRef, { userId: targetUserId, createdAt: new Date().toISOString() });
        batch.set(theirMatchRef, { userId: currentUserId, createdAt: new Date().toISOString() });
        await batch.commit();
      }
    }

    removeCard(cardEl, cardsEl, emptyEl);
    if (isMatch) {
      showMatchNotification(targetUserId);
    }
  } catch (error) {
    console.error('Error handling swipe:', error);
  }
}

function removeCard(cardEl, cardsEl, emptyEl) {
  cardEl.classList.add('discover-card-removed');
  
  // Move to next card after animation
  setTimeout(() => {
    cardEl.remove();
    currentIndex++;
    
    if (currentIndex >= usersList.length) {
      showEmptyState(emptyEl, 'No more people to show. Check back later!');
    } else {
      renderCard(currentIndex);
    }
  }, 300);
  
  cardEl.style.opacity = '0';
  cardEl.style.transform = 'scale(0.8)';
}

function showEmptyState(emptyEl, message) {
  if (!emptyEl) return;
  emptyEl.textContent = message;
  emptyEl.classList.remove('hidden');
  
  const cardsEl = document.getElementById('discover-stack');
  if (cardsEl) cardsEl.innerHTML = '';
}

function showMatchNotification(targetUserId) {
  // Show match popup if exists
  const matchPopup = document.getElementById('match-popup');
  if (matchPopup) {
    matchPopup.classList.remove('hidden');
    setTimeout(() => matchPopup.classList.add('hidden'), 3000);
  } else {
    alert('It\'s a match!');
  }
}
