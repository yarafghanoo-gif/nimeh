showToastSafe('Last swipe undone.');
} catch (error) {
  showToastSafe(error?.message || 'Could not undo swipe.');
}

async function softLoad() {
  renderFromQueue();
  await ensureBuffer();
  renderFromQueue();
}

export async function loadDiscover(options = {}) {
  const me = getCurrentUser();
  if (!me?.uid) return;

  ensureCss();
  ensureEmptyMarkup();
  showSpinner(true);

  state.options = options || {};
  state.queue = [];
  state.shownUsers = [];
  state.seenIds = await getActedUserIds(me.uid);
  state.seenIds.add(me.uid);
  state.lastCursor = null;
  state.hasMore = true;
  state.isLoading = false;
  state.isSwiping = false;
  state.lastSwipe = null;

  const container = stackEl();
  if (!container) return;

  container.innerHTML = '';
  emptyEl()?.classList.add('hidden');

  try {
    await fetchNextBatch();
    await softLoad();
  } catch (error) {
    showToastSafe(error?.message || 'Could not load discover feed.');
    emptyEl()?.classList.remove('hidden');
  } finally {
    showSpinner(false);
    updateEmptyState();
  }
}

export function bindDiscoverButtons(showMatchPopup) {
  if (state.boundButtons) return;
  state.boundButtons = true;

  const likeBtn = document.getElementById('btn-like');
  const skipBtn = document.getElementById('btn-skip');
  const superBtn = document.getElementById('btn-superlike');

  likeBtn?.addEventListener('click', () => {
    const top = getTopCard();
    if (top) animateAndCommit('right', top);
  });

  skipBtn?.addEventListener('click', () => {
    const top = getTopCard();
    if (top) animateAndCommit('left', top);
  });

  superBtn?.addEventListener('click', () => {
    const top = getTopCard();
    if (top) animateAndCommit('up', top);
  });

  if (!state.touchBound) {
    state.touchBound = true;

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        const top = getTopCard();
        if (top) animateAndCommit('left', top);
      }

      if (e.key === 'ArrowRight') {
        const top = getTopCard();
        if (top) animateAndCommit('right', top);
      }

      if (e.key === 'ArrowUp') {
        const top = getTopCard();
        if (top) animateAndCommit('up', top);
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        undoLastSwipe();
      }
    });
  }

  if (!state.matchPopupBound) {
    state.matchPopupBound = true;

    window.addEventListener('nimeh:match', (event) => {
      const user = event.detail || null;
      if (!user) return;

      showMatchPopupWithUser(user, Boolean(user.isSuperLike));

      if (typeof showMatchPopup === 'function') {
        showMatchPopup(user);
      }
    });
  }
}
