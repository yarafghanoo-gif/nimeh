// auth.js
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { auth, googleProvider } from "./firebase-config.js";

/**
 * مقداردهی اولیه احراز هویت
 * @param {Object} callbacks - شامل onLoggedIn و onLoggedOut
 */
export function initAuth(callbacks) {
  // مدیریت نتیجه برگشتی از Google Redirect
  getRedirectResult(auth)
    .then((result) => {
      if (result && result.user) {
        console.log("Google sign-in result:", result.user);
        callbacks?.onLoggedIn?.(result.user);
      }
    })
    .catch((error) => {
      console.error("Redirect result error:", error);
    });

  // نظارت بر تغییر وضعیت کاربر
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User logged in:", user);
      callbacks?.onLoggedIn?.(user);
    } else {
      console.log("User logged out");
      callbacks?.onLoggedOut?.();
    }
  });
}

/**
 * ورود با گوگل (با ریدایرکت)
 */
export async function signInWithGoogle() {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
}

/**
 * ورود با ایمیل و رمز عبور
 */
export async function signInWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    console.error("Email sign-in error:", error);
    throw error;
  }
}

/**
 * ثبت‌نام با ایمیل و رمز عبور
 */
export async function signUpWithEmail(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    console.error("Email sign-up error:", error);
    throw error;
  }
}

/**
 * خروج از حساب کاربری
 */
export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

/**
 * دریافت کاربر فعلی
 */
export function getCurrentUser() {
  return auth.currentUser;
}
