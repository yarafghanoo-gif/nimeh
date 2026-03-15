// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyAA0xYFglY_0NI-PstgS4nP3uNIpyAq0_A",
    authDomain: "nimeh-gomsodeh.firebaseapp.com",
    projectId: "nimeh-gomsodeh",
    storageBucket: "nimeh-gomsodeh.firebasestorage.app",
    messagingSenderId: "815930956932",
    appId: "1:815930956932:web:e8696a6a69b4458fd936d1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
