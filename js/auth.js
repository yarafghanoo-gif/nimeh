import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { auth, googleProvider } from "./firebase-config.js";

export function initAuth(callbacks) {
  // نتیجه برگشت از گوگل
  getRedirectResult(auth).catch(console.error);

  onAuthStateChanged(auth, (user) => {
    if (user) {
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

export function getCurrentUser() {
  return auth.currentUser;
}
