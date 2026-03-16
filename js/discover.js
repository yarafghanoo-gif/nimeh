const photoUrl = user.photoURL  user.photoUrl  '';
  const name = user.displayName  user.name  'No name';
  const email = user.email  '';

  card.innerHTML = `
    <div class="discover-card-photo" style="background-image:url(${photoUrl})"></div>
    <div class="discover-card-info">
      <div class="discover-card-name">${escapeHtml(name)}</div>
      <div class="discover-card-email">${escapeHtml(email)}</div>
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
      handleSwipe(currentUserId, user.id, action, card, cardsEl, document.getElementById('discover-empty'));
    });
  });

  cardsEl.appendChild(card);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Handle like / dislike / superlike and optionally create match.
 */
async function handleSwipe(currentUserId, targetUserId, action, cardEl, cardsEl, emptyEl) {
  const swipeRef = doc(db, USERS_COLLECTION, currentUserId, SWIPES_SUB, targetUserId);

  // Write our swipe first
  await setDoc(swipeRef, {
    targetId: targetUserId,
    action,
    timestamp: new Date().toISOString(),
  });

  let isMatch = false;
  if (action === 'like'  action === 'superlike') {
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
    // Optional: show match toast / modal
    if (typeof window.showMatchNotification === 'function') {
      window.showMatchNotification(targetUserId);
    }
  }
}

/**
 * Remove card from DOM and show empty state if no cards left.
 */
function removeCard(cardEl, cardsEl, emptyEl) {
  cardEl.classList.add('discover-card-removed');
  cardEl.addEventListener('transitionend', () => {
    cardEl.remove();
    if (cardsEl && cardsEl.querySelectorAll('.discover-card').length === 0 && emptyEl) {
      showEmptyState(cardsEl, emptyEl);
    }
  });
  // Force reflow so transition runs
  cardEl.offsetHeight;
  cardEl.style.opacity = '0';
  cardEl.style.transform = 'scale(0.8)';
}

function showEmptyState(cardsEl, emptyEl) {
  if (!emptyEl) return;
  emptyEl.classList.remove('hidden');
  emptyEl.textContent = 'No more people to show. Check back later!';
}

function renderEmptyState(message) {
  const emptyEl = document.getElementById('discover-empty');
  const cardsEl = document.getElementById('discover-cards');
  if (emptyEl) {
    emptyEl.textContent = message;
    emptyEl.classList.remove('hidden');
  }
  if (cardsEl) cardsEl.innerHTML = '';
}

export { getAuth, getFirestore };
