/**
 * Discover: card stack, swipe gestures, like/skip/superlike.
 */
import { addLike, getLikesSent, getDiscoverUsers, checkMatch, createMatch } from './firestore.js';
import { getCurrentUser } from './auth.js';

let discoverStack = [];
let likedIds = new Set();
let unsubMatches = null;

function getCardContainer() {
  return document.getElementById('discover-stack');
}

function getEmptyState() {
  return document.getElementById('discover-empty');
}

function createCardElement(user) {
  const div = document.createElement('div');
  div.className = 'discover-card';
  div.dataset.uid = user.id;
  div.innerHTML = `
    <span class="overlay-like">Like</span>
    <span class="overlay-skip">Skip</span>
    <img class="card-photo" src="${user.photoURL || 'https://via.placeholder.com/400x500?text=No+photo'}" alt="" />
    <div class="card-gradient"></div>
    <div class="card-info">
      <div class="card-name">${escapeHtml(user.displayName || 'Unknown')}</div>
      <div class="card-meta">${user.age != null ? user.age + ' · ' : ''}Nearby</div>
    </div>
  `;
  return div;
}

function escapeHtml(s) {
  const el = document.createElement('div');
  el.textContent = s;
  return el.innerHTML;
}

function setupSwipe(cardEl) {
  let startX = 0, startY = 0, currentX = 0;

  function onStart(e) {
    const t = e.touches ? e.touches[0] : e;
    startX = t.clientX;
    startY = t.clientY;
    currentX = startX;
    cardEl.classList.add('dragging');
  }

  function onMove(e) {
    e.preventDefault();
    const t = e.touches ? e.touches[0] : e;
    currentX = t.clientX;
    const dx = currentX - startX;
    cardEl.style.transform = `translateX(calc(-50% + ${dx}px)) rotate(${dx * 0.03}deg)`;
    cardEl.classList.toggle('dragging-right', dx > 40);
    cardEl.classList.toggle('dragging-left', dx < -40);
  }

  function onEnd() {
    cardEl.classList.remove('dragging', 'dragging-right', 'dragging-left');
    const dx = currentX - startX;
    if (dx > 100) {
      cardEl.classList.add('swipe-right');
      setTimeout(() => performLike(cardEl), 200);
    } else if (dx < -100) {
      cardEl.classList.add('swipe-left');
      setTimeout(() => performSkip(cardEl), 200);
    } else {
      cardEl.style.transform = 'translateX(-50%)';
    }
  }

  cardEl.addEventListener('touchstart', onStart, { passive: true });
  cardEl.addEventListener('touchmove', onMove, { passive: false });
  cardEl.addEventListener('touchend', onEnd);

  cardEl.addEventListener('mousedown', onStart);
  document.addEventListener('mousemove', function move(e) {
    if (!cardEl.classList.contains('dragging')) return;
    currentX = e.clientX;
    const dx = currentX - startX;
    cardEl.style.transform = `translateX(calc(-50% + ${dx}px)) rotate(${dx * 0.03}deg)`;
    cardEl.classList.toggle('dragging-right', dx > 40);
    cardEl.classList.toggle('dragging-left', dx < -40);
  });
  document.addEventListener('mouseup', function up() {
    if (!cardEl.classList.contains('dragging')) return;
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
    onEnd();
  });
}

function removeCardByUid(uid) {
  const container = getCardContainer();
  const card = container.querySelector(`.discover-card[data-uid="${uid}"]`);
  if (card) card.remove();
  discoverStack = discoverStack.filter((u) => u.id !== uid);
  if (discoverStack.length === 0) {
    getEmptyState().classList.remove('hidden');
  }
  const remaining = container.querySelectorAll('.discover-card');
  remaining.forEach((el, i) => {
    el.style.zIndex = i;
  });
}

async function performLike(cardEl, isSuperLike = false) {
  const uid = cardEl.dataset.uid;
  const me = getCurrentUser();
  if (!me || !uid) return;
  const targetUser = discoverStack.find((u) => u.id === uid);
  if (!targetUser) return;

  await addLike(me.uid, uid, isSuperLike);
  likedIds.add(uid);

  const matched = await checkMatch(me.uid, uid);
  if (matched) {
    await createMatch(me.uid, uid);
    window.dispatchEvent(new CustomEvent('nimeh:match', { detail: targetUser }));
  }

  removeCardByUid(uid);
}

function performSkip(cardEl) {
  const uid = cardEl.dataset.uid;
  likedIds.add(uid);
  removeCardByUid(uid);
}

export async function loadDiscover() {
  const me = getCurrentUser();
  if (!me) return;

  likedIds = new Set(await getLikesSent(me.uid));
  const users = await getDiscoverUsers(me.uid, [...likedIds], 20);
  discoverStack = users;

  const container = getCardContainer();
  const empty = getEmptyState();
  container.innerHTML = '';
  empty.classList.add('hidden');

  if (users.length === 0) {
    empty.classList.remove('hidden');
    return;
  }

  users.forEach((user, i) => {
    const card = createCardElement(user);
    card.style.zIndex = i;
    setupSwipe(card);
    container.appendChild(card);
  });
}

export function bindDiscoverButtons(showMatchPopup) {
  window.addEventListener('nimeh:match', (e) => showMatchPopup(e.detail));

  document.getElementById('btn-like').addEventListener('click', () => {
    const top = getCardContainer().querySelector('.discover-card:last-child');
    if (top) {
      top.classList.add('swipe-right');
      setTimeout(() => performLike(top, false), 200);
    }
  });

  document.getElementById('btn-skip').addEventListener('click', () => {
    const top = getCardContainer().querySelector('.discover-card:last-child');
    if (top) {
      top.classList.add('swipe-left');
      setTimeout(() => performSkip(top), 200);
    }
  });

  document.getElementById('btn-superlike').addEventListener('click', () => {
    const top = getCardContainer().querySelector('.discover-card:last-child');
    if (top) {
      top.classList.add('swipe-right');
      setTimeout(() => performLike(top, true), 200);
    }
  });
}
