import { db, auth } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function getChats() {
  const currentUserId = auth.currentUser.uid;
  const chatsRef = collection(db, "chats");
  const q = query(chatsRef, where("participants", "array-contains", currentUserId));
  const snapshot = await getDocs(q);
  const chats = [];
  for (const chatDoc of snapshot.docs) {
    const data = chatDoc.data();
    const otherUserId = data.participants.find(uid => uid !== currentUserId);
    const userDoc = await getDoc(doc(db, "users", otherUserId));
    if (userDoc.exists()) {
      chats.push({
        id: chatDoc.id,
        userId: otherUserId,
        userName: userDoc.data().displayName,
        userPhoto: userDoc.data().photoURL
      });
    }
  }
  return chats;
}

export function listenMessages(chatId, callback) {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp"));
  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach(doc => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    callback(messages);
  });
}

export async function sendMessage(chatId, text) {
  const messagesRef = collection(db, "chats", chatId, "messages");
  await addDoc(messagesRef, {
    text: text,
    senderId: auth.currentUser.uid,
    timestamp: new Date(),
    read: false
  });
  const chatRef = doc(db, "chats", chatId);
  await updateDoc(chatRef, {
    lastMessage: text,
    lastUpdated: new Date()
  });
}

export async function createChat(userId1, userId2) {
  const chatId = `${userId1}_${userId2}`;
  const chatRef = doc(db, "chats", chatId);
  await setDoc(chatRef, {
    participants: [userId1, userId2],
    createdAt: new Date(),
    lastMessage: ""
  });
  return chatId;
}
