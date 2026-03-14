/**
 * Chat list and chat room (real-time messages).
 */
import {
  getMatches,
  getChatId,
  sendMessage,
  subscribeMessages,
  getUser,
  formatMessageTime,
} from './firestore.js';
import { getCurrentUser } from './auth.js';

let currentChatId = null;
let unsubMessages = null;
let matchesCache = [];

function getChatListEl() {
  return document.getElementById('chat-list');
}
function getChatListEmpty() {
  return document.getElementById('chat-list-empty');
}
function getChatRoom() {
  return document.getElementById('chat-room');
}
function getChatListContainer() {
  return document.getElementById('chat-list-container');
}
function getChatTitle() {
  return document.getElementById('chat-title');
}
function getChatBack() {
  return document.getElementById('chat-back');
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

export async function renderChatList() {
  const me = getCurrentUser();
  if (!me) return;
  const list = getChatListEl();
  const empty = getChatListEmpty();
  matchesCache = await getMatches(me.uid);
  if (matchesCache.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  const rows = await Promise.all(
    matchesCache.map(async (m) => {
      const otherId = m.users.find((id) => id !== me.uid);
      const user = await getUser(otherId);
      return { otherId, user: user || { displayName: 'Unknown', photoURL: '' } };
    })
  );
  list.innerHTML = rows
    .map(
      (r) => `
    <div class="chat-item" data-other-id="${r.otherId}">
      <img src="${r.user.photoURL || 'https://via.placeholder.com/48?text=?'}" alt="" />
      <div class="chat-preview">
        <div class="chat-preview-name">${escapeHtml(r.user.displayName || 'Unknown')}</div>
        <div class="chat-preview-msg">Tap to open chat</div>
      </div>
    </div>
  `
    )
    .join('');
  list.querySelectorAll('.chat-item').forEach((el) => {
    el.addEventListener('click', () => openChat(el.dataset.otherId));
  });
}

function showChatRoom(show) {
  getChatListContainer().classList.toggle('hidden', show);
  getChatRoom().classList.toggle('hidden', !show);
  getChatBack().classList.toggle('hidden', !show);
}

export function openChat(otherId) {
  const me = getCurrentUser();
  if (!me) return;
  currentChatId = getChatId(me.uid, otherId);
  getChatTitle().textContent = 'Chat';
  getUser(otherId).then((user) => {
    getChatTitle().textContent = user?.displayName || 'Chat';
  });
  showChatRoom(true);
  const messagesEl = document.getElementById('chat-messages');
  messagesEl.innerHTML = '';

  if (unsubMessages) unsubMessages();
  unsubMessages = subscribeMessages(currentChatId, (messages) => {
    messagesEl.innerHTML = messages
      .map((msg) => {
        const isSent = msg.senderId === me.uid;
        return `<div class="msg ${isSent ? 'sent' : 'received'}">
          <div>${escapeHtml(msg.text)}</div>
          <div class="msg-time">${formatMessageTime(msg.createdAt)}</div>
        </div>`;
      })
      .join('');
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
}

export function openChatWithMatch(otherId, _matchId) {
  openChat(otherId);
}

export function bindChatUI() {
  getChatBack().addEventListener('click', () => {
    showChatRoom(false);
    getChatTitle().textContent = 'Chat';
    if (unsubMessages) {
      unsubMessages();
      unsubMessages = null;
    }
    currentChatId = null;
  });

  const input = document.getElementById('chat-input');
  document.getElementById('chat-send').addEventListener('click', () => sendCurrentMessage());
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendCurrentMessage();
  });

  function sendCurrentMessage() {
    const text = input.value.trim();
    if (!text || !currentChatId) return;
    const me = getCurrentUser();
    if (!me) return;
    sendMessage(currentChatId, me.uid, text);
    input.value = '';
  }
}

export function hideChatRoom() {
  showChatRoom(false);
  if (unsubMessages) unsubMessages();
  unsubMessages = null;
  currentChatId = null;
}
