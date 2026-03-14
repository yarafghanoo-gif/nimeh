/**
 * Authentication: email/password and Google sign-in.
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { auth, googleProvider } from './firebase-config.js';
import { getOrCreateUserProfile } from './firestore.js';

export function initAuth(callbacks) {
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
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
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
