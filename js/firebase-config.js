import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBlmIJ41RVLLhh_YRwrLyuSCzoX4RnYDbw",
  authDomain: "nimeh-eed5f.firebaseapp.com",
  projectId: "nimeh-eed5f",
  storageBucket: "nimeh-eed5f.firebasestorage.app",
  messagingSenderId: "253740796446",
  appId: "1:253740796446:web:40e000e46e4c51a547bc0f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
