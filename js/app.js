import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { signOut as firebaseSignOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { loadDiscover } from './discover.js';

// =========================
// Bottom Navigation
// =========================
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const viewName = item.dataset.view;

    // remove active
    document.querySelectorAll('.nav-item').forEach(nav =>
      nav.classList.remove('active')
    );

    item.classList.add('active');

    // switch view
    document.querySelectorAll('.view').forEach(view =>
      view.classList.remove('active')
    );

    document.getElementById(`view-${viewName}`)?.classList.add('active');

    // اگر رفت روی discover دوباره لود کن
    if (viewName === 'discover') {
      loadDiscover();
    }
  });
});

// =========================
// Sign out
// =========================
document.getElementById('btn-signout')?.addEventListener('click', async () => {
  await firebaseSignOut(auth);
});

// =========================
// Auth State
// =========================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log('✅ Logged in:', user.email);

    // show app
    document.getElementById('auth-screen')?.classList.remove('active');
    document.getElementById('app-screen')?.classList.add('active');

    // 👇 مهم‌ترین خط
    await loadDiscover();

  } else {
    console.log('❌ Logged out');

    document.getElementById('auth-screen')?.classList.add('active');
    document.getElementById('app-screen')?.classList.remove('active');
  }
});
