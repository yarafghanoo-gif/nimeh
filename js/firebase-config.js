// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBlmIJ41RVLLhh_YRwrLyuSCzoX4RnYDbw",
  authDomain: "nimeh-eed5f.firebaseapp.com",
  projectId: "nimeh-eed5f",
  storageBucket: "nimeh-eed5f.firebasestorage.app",
  messagingSenderId: "253740796446",
  appId: "1:253740796446:web:40e000e46e4c51a547bc0f",
  measurementId: "G-S63ZWYYWSV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
