// app.js
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { logout } from './auth.js';

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const viewName = item.dataset.view;
        
        // Update active state
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        
        // Show selected view
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        document.getElementById(`view-${viewName}`).classList.remove('hidden');
    });
});

// Sign out button
document.getElementById('btn-signout')?.addEventListener('click', logout);

// Check auth state
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User logged in:', user.email);
    } else {
        console.log('User logged out');
    }
});
