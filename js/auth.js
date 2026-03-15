import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { auth } from "./firebase-config.js";
import { getOrCreateUserProfile } from "./firestore.js";

const googleProvider = new GoogleAuthProvider();

export function initAuth(callbacks) {

  // وقتی از گوگل برمی‌گردیم
  getRedirectResult(auth)
    .then((result) => {
      if (result?.user) {
        console.log("Google login success");
      }
    })
    .catch((error) => {
      console.error(error);
    });

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await getOrCreateUserProfile(user);
      callbacks.onLoggedIn?.(user);
    } else {
      callbacks.onLoggedOut?.();
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

export async function signOut() {
  await firebaseSignOut(auth);
}

export function getCurrentUser() {
  return auth.currentUser;
}
