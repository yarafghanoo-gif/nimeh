import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth, googleProvider, db } from "./firebase-config.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function initAuth(callbacks) {
  getRedirectResult(auth).catch(console.error);

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          displayName: user.displayName || "کاربر",
          email: user.email,
          photoURL: user.photoURL || "images/default-avatar.png",
          age: null,
          bio: "",
          interests: [],
          createdAt: new Date()
        });
      }
      callbacks?.onLoggedIn?.(user);
    } else {
      callbacks?.onLoggedOut?.();
    }
  });
}

export async function signInWithGoogle() {
  await signInWithRedirect(auth, googleProvider);
}

export async function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  await signOut(auth);
}
