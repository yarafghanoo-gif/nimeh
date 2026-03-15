import { auth, db } from './firebase-config.js';
import { signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const provider = new GoogleAuthProvider();

// Google Sign In
document.getElementById('btn-google')?.addEventListener('click', async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Check if user exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
            // Create new user profile
            await setDoc(doc(db, 'users', user.uid), {
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
        showView('discover');
        
    } catch (error) {
        console.error('Login error:', error);
        showToast('❌ Login failed: ' + error.message);
    }
});

// Email toggle
document.getElementById('btn-email-toggle')?.addEventListener('click', () => {
    document.getElementById('email-form')?.classList.toggle('hidden');
});

// Email Sign In
document.getElementById('btn-signin')?.addEventListener('click', async () => {
    const email = document.getElementById('input-email')?.value;
    const password = document.getElementById('input-password')?.value;
    
    if (!email || !password) {
        showToast('Please enter email and password');
        return;
    }
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        showToast('✅ Login successful!');
        showView('discover');
    } catch (error) {
        showToast('❌ ' + error.message);
    }
});

// Email Sign Up
document.getElementById('btn-signup')?.addEventListener('click', async () => {
    const email = document.getElementById('input-email')?.value;
    const password = document.getElementById('input-password')?.value;
    
    if (!email || !password) {
        showToast('Please enter email and password');
        return;
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create user profile
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
        
        showToast('✅ Account created!');
        showView('discover');
    } catch (error) {
        showToast('❌ ' + error.message);
    }
});

// Sign Out
export async function logout() {
    try {
        await signOut(auth);
        showView('login');
        showToast('👋 Signed out');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Helper functions
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function showView(viewName) {
    // Show/hide main screens
    if (viewName === 'login') {
        document.getElementById('auth-screen')?.classList.add('active');
        document.getElementById('app-screen')?.classList.remove('active');
    } else {
        document.getElementById('auth-screen')?.classList.remove('active');
        document.getElementById('app-screen')?.classList.add('active');
        
        // Show specific view inside app
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${viewName}`)?.classList.add('active');
        
        // Update bottom nav
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.dataset.view === viewName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
}

// Check auth state on load
onAuthStateChanged(auth, (user) => {
    if (user) {
        showView('discover');
    } else {
        showView('login');
    }
});
