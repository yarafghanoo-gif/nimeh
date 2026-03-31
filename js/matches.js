import { db, auth } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function loadMatches() {
  const currentUserId = auth.currentUser.uid;
  const matchesRef = collection(db, "matches");
  const q = query(matchesRef, where("users", "array-contains", currentUserId));
  const snapshot = await getDocs(q);
  const matches = [];
  for (const matchDoc of snapshot.docs) {
    const matchData = matchDoc.data();
    const otherUserId = matchData.users.find(uid => uid !== currentUserId);
    const userDoc = await getDoc(doc(db, "users", otherUserId));
    if (userDoc.exists()) {
      matches.push({
        id: matchDoc.id,
        userId: otherUserId,
        ...userDoc.data()
      });
    }
  }
  return matches;
}
