/**
 * Firestore: users, likes, matches, messages.
 */
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db } from './firebase-config.js';

const USERS = 'users';
const LIKES = 'likes';
const MATCHES = 'matches';
const MESSAGES = 'messages';

export async function getOrCreateUserProfile(firebaseUser) {
  const ref = doc(db, USERS, firebaseUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  const profile = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    photoURL: firebaseUser.photoURL || '',
    age: null,
    bio: '',
    interests: [],
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
  };
  await setDoc(ref, profile);
  return { id: firebaseUser.uid, ...profile };
}

export async function updateUserProfile(uid, data) {
  const ref = doc(db, USERS, uid);
  await setDoc(ref, { ...data, lastSeen: serverTimestamp() }, { merge: true });
}

export async function getUser(uid) {
  const ref = doc(db, USERS, uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getDiscoverUsers(currentUid, excludeIds = [], limitCount = 50) {
  const usersRef = collection(db, USERS);
  const snapshot = await getDocs(usersRef);
  const ids = new Set([currentUid, ...excludeIds]);
  const users = [];
  snapshot.forEach((d) => {
    const u = { id: d.id, ...d.data() };
    if (!ids.has(d.id) && (u.age == null || (u.age >= 18 && u.age <= 120))) users.push(u);
  });
  return users.slice(0, limitCount);
}

export async function getUsersNotLikedOrSkipped(currentUid, likedIds, limitCount = 20) {
  const all = await getDiscoverUsers(currentUid, likedIds);
  return all.slice(0, limitCount);
}

export function likeId(uid, targetId) {
  return `${uid}_${targetId}`;
}

export async function addLike(uid, targetId, isSuperLike = false) {
  const id = likeId(uid, targetId);
  await setDoc(doc(db, LIKES, id), {
    fromId: uid,
    toId: targetId,
    isSuperLike,
    createdAt: serverTimestamp(),
  });
}

export async function getLikesReceived(uid) {
  const q = query(
    collection(db, LIKES),
    where('toId', '==', uid),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getLikesSent(uid) {
  const q = query(
    collection(db, LIKES),
    where('fromId', '==', uid)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().toId);
}

export async function checkMatch(uid, targetId) {
  const sent = await getDoc(doc(db, LIKES, likeId(uid, targetId)));
  const received = await getDoc(doc(db, LIKES, likeId(targetId, uid)));
  return sent.exists() && received.exists();
}

export async function createMatch(uid, otherId) {
  const matchId = [uid, otherId].sort().join('_');
  const ref = doc(db, MATCHES, matchId);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();
  await setDoc(ref, {
    users: [uid, otherId],
    createdAt: serverTimestamp(),
  });
  return { id: matchId, users: [uid, otherId] };
}

export async function getMatches(uid) {
  const q = query(
    collection(db, MATCHES),
    where('users', 'array-contains', uid)
  );
  const snap = await getDocs(q);
  const matches = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  matches.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
  return matches;
}

export function subscribeMatches(uid, callback) {
  const q = query(
    collection(db, MATCHES),
    where('users', 'array-contains', uid)
  );
  return onSnapshot(q, (snap) => {
    const matches = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    matches.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
    callback(matches);
  });
}

function chatId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

export function getChatId(uid1, uid2) {
  return chatId(uid1, uid2);
}

export async function sendMessage(chatId, senderId, text) {
  await addDoc(collection(db, MESSAGES), {
    chatId,
    senderId,
    text: (text || '').trim(),
    createdAt: serverTimestamp(),
  });
}

export function subscribeMessages(chatId, callback) {
  const q = query(
    collection(db, MESSAGES),
    where('chatId', '==', chatId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toMillis?.() ?? Date.now(),
      }))
    );
  });
}

export function formatMessageTime(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString();
}
