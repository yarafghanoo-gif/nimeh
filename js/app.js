import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { logout } from './auth.js';

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const viewName = item.dataset.view;
        
        // Update active state for nav items
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        
        // Show selected view (remove 'active' from all, add to selected)
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${viewName}`).classList.add('active');
    });
});

// Sign out button
document.getElementById('btn-signout')?.addEventListener('click', logout);

// Check auth state and show appropriate screen
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('✅ User logged in:', user.email);
        document.getElementById('auth-screen')?.classList.remove('active');
        document.getElementById('app-screen')?.classList.add('active');
    } else {
        console.log('❌ User logged out');
        document.getElementById('auth-screen')?.classList.add('active');
        document.getElementById('app-screen')?.classList.remove('active');
    }
});
