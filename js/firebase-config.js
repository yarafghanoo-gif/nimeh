import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// 🔁 این مقادیر را با تنظیمات پروژه nimeh-gomsodeh جایگزین کنید
const firebaseConfig = {
  apiKey: "AIzaSyAA0xYFgLY_...",      // ← از کنسول Firebase کپی کنید
  authDomain: "nimeh-gomsodeh.firebaseapp.com",
  projectId: "nimeh-gomsodeh",
  storageBucket: "nimeh-gomsodeh.firebasestorage.app",
  messagingSenderId: "81593...",      // ← کپی کنید
  appId: "1:815930956932:web:..."     // ← کپی کنید
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
