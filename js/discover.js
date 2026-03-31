import { db, auth } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function fetchDiscoverProfiles() {
  const currentUserId = auth.currentUser.uid;
  const interactionsRef = collection(db, "interactions");
  const q = query(interactionsRef, where("userId", "==", currentUserId));
  const snapshot = await getDocs(q);
  const excludedIds = [currentUserId];
  snapshot.forEach(doc => {
    excludedIds.push(doc.data().targetId);
  });

  const usersRef = collection(db, "users");
  const usersQuery = query(usersRef, where("uid", "not-in", excludedIds));
  const usersSnapshot = await getDocs(usersQuery);
  const profiles = [];
  usersSnapshot.forEach(doc => {
    profiles.push({ id: doc.id, ...doc.data() });
  });
  return profiles;
}

export async function likeUser(targetId) {
  const currentUserId = auth.currentUser.uid;
  const interactionRef = doc(db, "interactions", `${currentUserId}_${targetId}`);
  await setDoc(interactionRef, {
    userId: currentUserId,
    targetId: targetId,
    type: "like",
    timestamp: new Date()
  }, { merge: true });

  const reverseRef = doc(db, "interactions", `${targetId}_${currentUserId}`);
  const reverseSnap = await getDoc(reverseRef);
  if (reverseSnap.exists() && (reverseSnap.data().type === "like" || reverseSnap.data().type === "superlike")) {
    const matchRef = doc(db, "matches", `${currentUserId}_${targetId}`);
    await setDoc(matchRef, {
      users: [currentUserId, targetId],
      createdAt: new Date()
    });
    return true;
  }
  return false;
}

export async function skipUser(targetId) {
  const currentUserId = auth.currentUser.uid;
  const interactionRef = doc(db, "interactions", `${currentUserId}_${targetId}`);
  await setDoc(interactionRef, {
    userId: currentUserId,
    targetId: targetId,
    type: "skip",
    timestamp: new Date()
  }, { merge: true });
  return false;
}

export async function superlikeUser(targetId) {
  const currentUserId = auth.currentUser.uid;
  const interactionRef = doc(db, "interactions", `${currentUserId}_${targetId}`);
  await setDoc(interactionRef, {
    userId: currentUserId,
    targetId: targetId,
    type: "superlike",
    timestamp: new Date()
  }, { merge: true });

  const reverseRef = doc(db, "interactions", `${targetId}_${currentUserId}`);
  const reverseSnap = await getDoc(reverseRef);
  if (reverseSnap.exists() && (reverseSnap.data().type === "like" || reverseSnap.data().type === "superlike")) {
    const matchRef = doc(db, "matches", `${currentUserId}_${targetId}`);
    await setDoc(matchRef, {
      users: [currentUserId, targetId],
      createdAt: new Date()
    });
    return true;
  }
  return false;
}
