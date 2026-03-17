import { auth, db } from './firebase-config.js';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

const provider = new GoogleAuthProvider();

// Helper voor toast (als je die nog niet hebt, definieer hem hier of in app.js)
function showToast(message) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
  } else {
    alert(message);
  }
}

// Google Sign In
document.getElementById('btn-google')?.addEventListener('click', async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Controleer of gebruiker al in Firestore bestaat
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Nieuw profiel aanmaken
      await setDoc(userDocRef, {
        name: user.displayName || 'User',
        email: user.email,
        photo: user.photoURL || '',
        age: null,
        bio: '',
        interests: [],
        coins: 100,
        createdAt: new Date().toISOString()
      });
    }
    
    showToast('✅ Login successful!');
    // De app-screen wordt al getoond via onAuthStateChanged in app.js
  } catch (error) {
    console.error('Login error:', error);
    showToast('❌ ' + error.message);
  }
});

// Email toggle (optioneel, als je het gebruikt)
document.getElementById('btn-email-toggle')?.addEventListener('click', () => {
  document.getElementById('email-form')?.classList.toggle('hidden');
});

// Email sign in
document.getElementById('btn-signin')?.addEventListener('click', async () => {
  const email = document.getElementById('input-email')?.value;
  const password = document.getElementById('input-password')?.value;
  if (!email || !password) {
    showToast('Please enter email and password');
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showToast('✅ Signed in');
  } catch (error) {
    showToast('❌ ' + error.message);
  }
});

// Email sign up
document.getElementById('btn-signup')?.addEventListener('click', async () => {
  const email = document.getElementById('input-email')?.value;
  const password = document.getElementById('input-password')?.value;
  if (!email || !password) {
    showToast('Please enter email and password');
    return;
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Profiel aanmaken
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name: email.split('@')[0],
      email: email,
      photo: '',
      age: null,
      bio: '',
      interests: [],
      coins: 100,
      createdAt: new Date().toISOString()
    });
    showToast('✅ Account created');
  } catch (error) {
    showToast('❌ ' + error.message);
  }
});

// Sign out
export async function logout() {
  try {
    await signOut(auth);
    showToast('👋 Signed out');
  } catch (error) {
    console.error('Logout error:', error);
  }
}
