// auth.js
import { auth, db } from './firebase-config.js';
import { signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const provider = new GoogleAuthProvider();

// Google Sign In
document.getElementById('login-google')?.addEventListener('click', async () => {
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

// Email Sign In (you'll need to create this form)
document.getElementById('login-email')?.addEventListener('click', () => {
    alert('Email login coming soon! Use Google for now.');
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
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(`view-${viewName}`).classList.remove('hidden');
    
    if (viewName !== 'login') {
        document.getElementById('bottom-nav').classList.remove('hidden');
    } else {
        document.getElementById('bottom-nav').classList.add('hidden');
    }
}

// Check auth state on load
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    if (user) {
        showView('discover');
    } else {
        showView('login');
    }
});
