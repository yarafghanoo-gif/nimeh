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
      if ((e.ctrlKey  e.metaKey) && e.key.toLowerCase() === 'z') {
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
      if (typeof showMatchPopup === 'function') showMatchPopup(user);
    });
  }
}
