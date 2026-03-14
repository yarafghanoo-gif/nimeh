/**
 * Matches list and rendering.
 */
import { subscribeMatches, getUser } from './firestore.js';

let matches = [];
let unsub = null;

export function initMatches(openChatWithMatch) {
  const listEl = document.getElementById('matches-list');
  const emptyEl = document.getElementById('matches-empty');

  function render() {
    if (matches.length === 0) {
      listEl.innerHTML = '';
      emptyEl.classList.remove('hidden');
      return;
    }
    emptyEl.classList.add('hidden');
    Promise.all(matches.map(async (m) => {
      const otherId = m.users.find((id) => id !== (window.__currentUid || ''));
      const user = await getUser(otherId);
      return { match: m, otherId, user: user || { displayName: 'Unknown', photoURL: '' } };
    })).then((rows) => {
      listEl.innerHTML = rows.map(({ match, otherId, user }) => {
        const createdAt = match.createdAt?.toMillis?.();
        const timeStr = createdAt ? new Date(createdAt).toLocaleDateString() : '';
        return `
          <div class="match-item" data-match-id="${match.id}" data-other-id="${otherId}">
            <img src="${user.photoURL || 'https://via.placeholder.com/56?text=?'}" alt="" />
            <div>
              <div class="match-name">${escapeHtml(user.displayName || 'Unknown')}</div>
              <div class="match-time">Matched ${timeStr}</div>
            </div>
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('.match-item').forEach((el) => {
        el.addEventListener('click', () => {
          openChatWithMatch(el.dataset.otherId, el.dataset.matchId);
        });
      });
    });
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  return {
    start(uid) {
      window.__currentUid = uid;
      if (unsub) unsub();
      unsub = subscribeMatches(uid, (data) => {
        matches = data;
        render();
      });
    },
    stop() {
      if (unsub) unsub();
      unsub = null;
    },
  };
}
