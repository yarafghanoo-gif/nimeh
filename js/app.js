import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { loadDiscover } from './discover.js';

// ================= NAV =================
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const viewName = item.dataset.view;

    document.querySelectorAll('.nav-item').forEach(nav =>
      nav.classList.remove('active')
    );

    item.classList.add('active');

    document.querySelectorAll('.view').forEach(view =>
      view.classList.remove('active')
    );

    document.getElementById(`view-${viewName}`)?.classList.add('active');

    if (viewName === 'discover') {
      loadDiscover();
    }
  });
});

// ================= LOGOUT =================
document.getElementById('btn-signout')?.addEventListener('click', async () => {
  await signOut(auth);
});

// ================= AUTH =================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log('✅ Logged in');

    document.getElementById('auth-screen')?.classList.remove('active');
    document.getElementById('app-screen')?.classList.add('active');

    await loadDiscover();

  } else {
    console.log('❌ Logged out');

    document.getElementById('auth-screen')?.classList.add('active');
    document.getElementById('app-screen')?.classList.remove('active');
  }
});
