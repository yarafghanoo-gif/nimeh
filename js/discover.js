/**
 * Load discover feed with optional filters.
 * @param {Object} [options] - Optional filters (client-side after fetch).
 * @param {number} [options.ageMin] - Minimum age (inclusive).
 * @param {number} [options.ageMax] - Maximum age (inclusive).
 * @param {number} [options.limit] - Max number of users (default 20).
 */
export async function loadDiscover(options = {}) {
  const me = getCurrentUser();
  if (!me) return;

  const container = getCardContainer();
  const empty = getEmptyState();
  if (!container) return;

  swipeListeners = [];
  ensureEmptyStateMarkup(empty);
  container.innerHTML = '';
  empty.classList.add('hidden');
  showSpinner(true);

  try {
    const limit = options.limit ?? 20;
    likedIds = new Set(await getLikesSent(me.uid));
    let users = await getDiscoverUsers(me.uid, [...likedIds], limit);

    const ageMin = options.ageMin != null ? Number(options.ageMin) : null;
    const ageMax = options.ageMax != null ? Number(options.ageMax) : null;
    // اصلاح: اضافه شدن عملگر ||
    if (ageMin != null || ageMax != null) {
      users = users.filter((u) => {
        const a = u.age;
        if (a == null) return true;
        if (ageMin != null && a < ageMin) return false;
        if (ageMax != null && a > ageMax) return false;
        return true;
      });
    }

    discoverStack = users;

    if (users.length === 0) {
      empty.classList.remove('hidden');
      const text = empty.querySelector('.discover-empty-text');
      if (text) text.textContent = 'No more profiles right now. Check back later!';
      empty.querySelector('.discover-empty-refresh')?.classList.remove('hidden');
      return;
    }

    users.forEach((user, i) => {
      const card = createCardElement(user);
      card.style.zIndex = String(users.length - i);
      setupSwipe(card);
      container.appendChild(card);
    });
  } catch (e) {
    // اصلاح: اضافه شدن عملگر ||
    if (typeof showToast === 'function') showToast(e?.message || 'Could not load discover');
    empty.classList.remove('hidden');
    const text = empty?.querySelector('.discover-empty-text');
    if (text) text.textContent = 'Something went wrong. Try again.';
    empty?.querySelector('.discover-empty-refresh')?.classList.remove('hidden');
  } finally {
    showSpinner(false);
  }
}

export function bindDiscoverButtons(showMatchPopup) {
  const unbind = () => {
    swipeListeners.forEach(({ card, onPointerDown, onPointerMove, onPointerUp }) => {
      card.removeEventListener('pointerdown', onPointerDown);
      card.removeEventListener('pointermove', onPointerMove);
      card.removeEventListener('pointerup', onPointerUp);
      card.removeEventListener('pointercancel', onPointerUp);
    });
    swipeListeners = [];
  };

  window.addEventListener('nimeh:match', (e) => {
    const user = e.detail;
    // تابع showMatchPopupWithUser باید تعریف شده باشد (مثلاً در auth.js یا app.js)
    if (typeof showMatchPopupWithUser === 'function') {
      showMatchPopupWithUser(user);
    }
    if (typeof showMatchPopup === 'function') showMatchPopup(user);
  });

  function getTopCard() {
    return getCardContainer()?.querySelector('.discover-card:last-child');
  }

  function triggerSwipe(direction, isSuperLike = false) {
    const top = getTopCard();
    // isAnimating و SWIPE_DURATION_MS باید تعریف شده باشند (مثلاً با const در ابتدای فایل)
    if (!top || isAnimating) return;
    isAnimating = true;
    if (direction === 'right') {
      top.classList.add('swipe-right');
      if (isSuperLike) top.classList.add('swipe-superlike');
      setTimeout(() => performLike(top, isSuperLike), SWIPE_DURATION_MS);
    } else {
      top.classList.add('swipe-left');
      setTimeout(() => performSkip(top), SWIPE_DURATION_MS);
    }
  }

  const btnLike = document.getElementById('btn-like');
  const btnSkip = document.getElementById('btn-skip');
  const btnSuperlike = document.getElementById('btn-superlike');

  if (btnLike) btnLike.addEventListener('click', () => triggerSwipe('right', false));
  if (btnSkip) btnSkip.addEventListener('click', () => triggerSwipe('left'));
  if (btnSuperlike) btnSuperlike.addEventListener('click', () => triggerSwipe('right', true));

  window.addEventListener('beforeunload', unbind);
}
