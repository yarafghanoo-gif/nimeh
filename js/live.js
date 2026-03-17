/**
 * Nimeh Live — Agora video streams + Firestore rooms & chat.
 * Uses: firebase-config (db, auth), auth (getCurrentUser), Agora SDK (global).
 */
import { collection, doc, addDoc, onSnapshot, query, where, orderBy, serverTimestamp, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db, auth } from './firebase-config.js';
import { getCurrentUser } from './auth.js';

const AGORA_APP_ID = 'YOUR_AGORA_APP_ID'; // Replace with your Agora App ID

// DOM
const liveListView = document.getElementById('live-list-view');
const liveRoomView = document.getElementById('live-room-view');
const liveRoomsList = document.getElementById('live-rooms-list');
const liveListEmpty = document.getElementById('live-list-empty');
const btnStartLive = document.getElementById('btn-start-live');
const btnLiveBack = document.getElementById('btn-live-back');
const liveRoomTitle = document.getElementById('live-room-title');
const btnSendGift = document.getElementById('btn-send-gift');
const liveVideoRemote = document.getElementById('live-video-remote');
const liveVideoRemotePlaceholder = document.getElementById('live-video-remote-placeholder');
const liveVideoLocal = document.getElementById('live-video-local');
const liveChatMessages = document.getElementById('live-chat-messages');
const liveChatInput = document.getElementById('live-chat-input');
const liveChatSend = document.getElementById('live-chat-send');
const btnMuteAudio = document.getElementById('btn-mute-audio');
const btnMuteVideo = document.getElementById('btn-mute-video');
const btnEndCall = document.getElementById('btn-end-call');
const startLiveModal = document.getElementById('start-live-modal');
const liveTitleInput = document.getElementById('live-title-input');
const startLiveCancel = document.getElementById('start-live-cancel');
const startLiveGo = document.getElementById('start-live-go');

// Toast (fallback if not from app.js)
function showToast(message) {
  window.showToast = showToast;
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(el._toastTimer);
  el._toastTimer = setTimeout(() => el.classList.add('hidden'), 3000);
}

// Placeholder: deduct coins when sending gift (implement in app when ready)
function updateUserCoins(delta) {
  if (typeof window.updateUserCoins === 'function') {
    window.updateUserCoins(delta);
  } else {
    console.log('Gift sent (coins placeholder):', delta);
  }
}

// --- View switching ---
function showLiveList() {
  liveListView.classList.remove('hidden');
  liveRoomView.classList.add('hidden');
}

function showLiveRoom() {
  liveListView.classList.add('hidden');
  liveRoomView.classList.remove('hidden');
}

// --- Agora state ---
let agoraClient = null;
let localAudioTrack = null;
let localVideoTrack = null;
let currentRoomId = null;
let isHost = false;
let messagesUnsubscribe = null;

function getAgora() {
  if (typeof AgoraRTC !== 'undefined') return AgoraRTC;
  if (typeof window.AgoraRTC !== 'undefined') return window.AgoraRTC;
  return null;
}

async function initAgoraAndJoin(roomId, isHostMode) {
  const AgoraRTC = getAgora();
  if (!AgoraRTC) {
    showToast('Agora SDK not loaded');
    return false;
  }
  try {
    agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

    const uid = await agoraClient.join(AGORA_APP_ID, roomId, null, auth.currentUser?.uid || null);
    if (isHostMode) {
      const [audio, video] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localAudioTrack = audio;
      localVideoTrack = video;
      await agoraClient.publish([audio, video]);
      if (liveVideoLocal) {
        video.play(liveVideoLocal);
      }
      btnMuteAudio.classList.remove('hidden');
      btnMuteVideo.classList.remove('hidden');
    } else {
      btnMuteAudio.classList.add('hidden');
      btnMuteVideo.classList.add('hidden');
    }

    agoraClient.on('user-published', async (user, mediaType) => {
      await agoraClient.subscribe(user, mediaType);
      if (mediaType === 'video') {
        const remoteTrack = user.videoTrack;
        if (remoteTrack && liveVideoRemote) {
          liveVideoRemotePlaceholder.classList.add('hidden');
          remoteTrack.play(liveVideoRemote);
        }
      }
      if (mediaType === 'audio') {
        const remoteTrack = user.audioTrack;
        if (remoteTrack) remoteTrack.play();
      }
    });

    agoraClient.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'video' && liveVideoRemote) {
        const el = liveVideoRemote.querySelector('[data-uid]');
        if (el) el.remove();
      }
    });

    return true;
  } catch (err) {
    console.error('Agora join error:', err);
    showToast(err.message || 'Could not join stream');
    return false;
  }
}

async function leaveAgora() {
  try {
    if (localAudioTrack) {
      localAudioTrack.close();
      localAudioTrack = null;
    }
    if (localVideoTrack) {
      localVideoTrack.close();
      localVideoTrack = null;
    }
    if (agoraClient) {
      await agoraClient.leave();
      agoraClient = null;
    }
  } catch (e) {
    console.error('Agora leave error:', e);
  }
  if (liveVideoRemote) {
    liveVideoRemote.innerHTML = '';
    liveVideoRemotePlaceholder.classList.remove('hidden');
  }
  if (liveVideoLocal) liveVideoLocal.innerHTML = '';
}

// --- Firestore: live rooms ---
function subscribeLiveRooms() {
  const q = query(
    collection(db, 'live_rooms'),
    where('active', '==', true)
  );
  return onSnapshot(q, (snap) => {
    liveRoomsList.innerHTML = '';
    const rooms = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (rooms.length === 0) {
      liveListEmpty.classList.remove('hidden');
      return;
    }
    liveListEmpty.classList.add('hidden');
    rooms.forEach((room) => {
      const card = document.createElement('div');
      card.className = 'live-room-card';
      card.innerHTML = `
        <div class="room-info">
          <div class="room-host">${escapeHtml(room.hostName || 'Host')}</div>
          <div class="room-title">${escapeHtml(room.title || 'Live')}</div>
        </div>
        <button class="btn btn-primary btn-join-live" data-room-id="${escapeHtml(room.id)}" data-host-name="${escapeHtml(room.hostName || '')}" data-title="${escapeHtml(room.title || '')}">Join</button>
      `;
      card.querySelector('.btn-join-live').addEventListener('click', () => joinRoom(room.id, room.hostName, room.title));
      liveRoomsList.appendChild(card);
    });
  });
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

async function createRoom(title) {
  const user = getCurrentUser();
  if (!user) {
    showToast('Please sign in first');
    return;
  }
  try {
    const ref = await addDoc(collection(db, 'live_rooms'), {
      hostId: user.uid,
      hostName: user.displayName || user.email || 'Anonymous',
      title: title || 'Live stream',
      active: true,
      createdAt: serverTimestamp(),
    });
    currentRoomId = ref.id;
    isHost = true;
    liveRoomTitle.textContent = title || 'Live';
    showLiveRoom();
    const ok = await initAgoraAndJoin(ref.id, true);
    if (!ok) {
      await updateDoc(ref, { active: false });
      showLiveList();
      currentRoomId = null;
      isHost = false;
    } else {
      subscribeMessages(ref.id);
    }
  } catch (e) {
    console.error('Create room error:', e);
    showToast(e.message || 'Could not start live');
  }
}

async function joinRoom(roomId, hostName, title) {
  const user = getCurrentUser();
  if (!user) {
    showToast('Please sign in first');
    return;
  }
  currentRoomId = roomId;
  isHost = false;
  liveRoomTitle.textContent = title || hostName || 'Live';
  showLiveRoom();
  const ok = await initAgoraAndJoin(roomId, false);
  if (!ok) {
    showLiveList();
    currentRoomId = null;
  } else {
    subscribeMessages(roomId);
  }
}

// --- Firestore: chat messages ---
function subscribeMessages(roomId) {
  if (messagesUnsubscribe) messagesUnsubscribe();
  const messagesRef = collection(db, 'live_rooms', roomId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  messagesUnsubscribe = onSnapshot(q, (snap) => {
    liveChatMessages.innerHTML = '';
    snap.docs.forEach((d) => {
      const msg = d.data();
      appendChatMessage(msg.senderName, msg.text, msg.timestamp, msg.isGift);
    });
    liveChatMessages.scrollTop = liveChatMessages.scrollHeight;
  });
}

function appendChatMessage(senderName, text, timestamp, isGift) {
  const div = document.createElement('div');
  div.className = 'msg received';
  const timeStr = timestamp?.toDate ? timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  div.innerHTML = `<strong>${escapeHtml(senderName || '')}</strong>: ${escapeHtml(text)}${timeStr ? `<span class="msg-time">${timeStr}</span>` : ''}`;
  if (isGift) div.classList.add('msg-gift');
  liveChatMessages.appendChild(div);
}

async function sendChatMessage(text, isGift = false) {
  if (!currentRoomId || !text.trim()) return;
  const user = getCurrentUser();
  if (!user) return;
  try {
    await addDoc(collection(db, 'live_rooms', currentRoomId, 'messages'), {
      senderId: user.uid,
      senderName: user.displayName || user.email || 'Anonymous',
      text: text.trim(),
      timestamp: serverTimestamp(),
      isGift: !!isGift,
    });
  } catch (e) {
    console.error('Send message error:', e);
    showToast(e.message || 'Could not send message');
  }
}

async function sendGift() {
  const GIFT_COST = 10;
  const GIFT_EMOJI = '❤️';
  if (typeof window.updateUserCoins === 'function') {
    try {
      window.updateUserCoins(-GIFT_COST);
    } catch (e) {
      showToast('Not enough coins');
      return;
    }
  } else {
    updateUserCoins(-GIFT_COST);
  }
  await sendChatMessage(GIFT_EMOJI + ' sent a gift!', true);
  showToast('Gift sent!');
}

// --- Controls: mute / end ---
function toggleMuteAudio() {
  if (!localAudioTrack) return;
  const enabled = !localAudioTrack.enabled;
  localAudioTrack.setEnabled(enabled);
  btnMuteAudio.textContent = enabled ? '🔊' : '🔇';
  showToast(enabled ? 'Microphone on' : 'Microphone off');
}

function toggleMuteVideo() {
  if (!localVideoTrack) return;
  const enabled = !localVideoTrack.enabled;
  localVideoTrack.setEnabled(enabled);
  btnMuteVideo.textContent = enabled ? '📹' : '📷‍♂️';
  showToast(enabled ? 'Camera on' : 'Camera off');
}

async function endCall() {
  if (currentRoomId && isHost) {
    try {
      const roomRef = doc(db, 'live_rooms', currentRoomId);
      await updateDoc(roomRef, { active: false });
    } catch (e) {
      console.error('Update room active error:', e);
    }
  }
  if (messagesUnsubscribe) {
    messagesUnsubscribe();
    messagesUnsubscribe = null;
  }
  await leaveAgora();
  currentRoomId = null;
  isHost = false;
  liveChatMessages.innerHTML = '';
  liveChatInput.value = '';
  btnMuteAudio.classList.remove('hidden');
  btnMuteVideo.classList.remove('hidden');
  showLiveList();
  showToast('Left the stream');
}

// --- UI bindings ---
btnStartLive.addEventListener('click', () => {
  const user = getCurrentUser();
  if (!user) {
    showToast('Please sign in first');
    return;
  }
  startLiveModal.classList.remove('hidden');
  liveTitleInput.value = '';
  liveTitleInput.focus();
});

startLiveCancel.addEventListener('click', () => {
  startLiveModal.classList.add('hidden');
});

startLiveGo.addEventListener('click', async () => {
  const title = liveTitleInput.value.trim() || 'Live stream';
  startLiveModal.classList.add('hidden');
  await createRoom(title);
});

btnLiveBack.addEventListener('click', endCall);

liveChatSend.addEventListener('click', () => {
  const text = liveChatInput.value.trim();
  if (text) {
    sendChatMessage(text);
    liveChatInput.value = '';
  }
});

liveChatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const text = liveChatInput.value.trim();
    if (text) {
      sendChatMessage(text);
      liveChatInput.value = '';
    }
  }
});

btnSendGift.addEventListener('click', sendGift);

btnMuteAudio.addEventListener('click', toggleMuteAudio);
btnMuteVideo.addEventListener('click', toggleMuteVideo);
btnEndCall.addEventListener('click', endCall);

// Auth: redirect if not logged in (optional)
auth.onAuthStateChanged((user) => {
  if (!user) {
    liveListEmpty.innerHTML = '<p>Sign in to view and start live streams.</p>';
    btnStartLive.disabled = true;
  } else {
    btnStartLive.disabled = false;
  }
});

// Load active rooms
subscribeLiveRooms();
