/**
 * Nimeh — App entry: auth, navigation, views, toast, match popup.
 */
import { initAuth, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, getCurrentUser } from './auth.js';
import { loadDiscover, bindDiscoverButtons } from './discover.js';
import { initMatches } from './matches.js';
import { renderChatList, openChatWithMatch, bindChatUI, hideChatRoom } from './chat.js';
import { renderProfile, bindProfileUI } from './profile.js';

// Screens
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');

// Views
const views = {
  discover: document.getElementById('view-discover'),
  matches: document.getElementById('view-matches'),
  chat: document.getElementById('view-chat'),
  profile: document.getElementById('view-profile'),
};

function showScreen(screen) {
  authScreen.classList.toggle('active', screen === 'auth');
  appScreen.classList.toggle('active', screen === 'app');
}

function showView(viewId) {
  Object.keys(views).forEach((id) => {
    views[id].classList.toggle('active', id === viewId);
  });
  document.querySelectorAll('.nav-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.view === viewId);
  });
  if (viewId !== 'chat') hideChatRoom();
}

// Toast
function showToast(message) {
  window.showToast = showToast;
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(el._toastTimer);
  el._toastTimer = setTimeout(() => el.classList.add('hidden'), 3000);
}

// Match popup
function showMatchPopup(user) {
  const popup = document.getElementById('match-popup');
  document.getElementById('match-popup-name').textContent = user?.displayName || 'Someone';
  popup.classList.remove('hidden');
  document.getElementById('match-popup-close').onclick = () => {
    popup.classList.add('hidden');
    renderChatList();
  };
}

// Auth UI
document.getElementById('btn-google').addEventListener('click', async () => {
  try {
    await signInWithGoogle();
  } catch (e) {
    showToast(e.message || 'Google sign-in failed');
  }
});

document.getElementById('btn-email-toggle').addEventListener('click', () => {
  document.getElementById('email-form').classList.toggle('hidden');
});

document.getElementById('btn-signin').addEventListener('click', async () => {
  const email = document.getElementById('input-email').value.trim();
  const password = document.getElementById('input-password').value;
  if (!email || !password) {
    showToast('Enter email and password');
    return;
  }
  try {
    await signInWithEmail(email, password);
  } catch (e) {
    showToast(e.message || 'Sign in failed');
  }
});

document.getElementById('btn-signup').addEventListener('click', async () => {
  const email = document.getElementById('input-email').value.trim();
  const password = document.getElementById('input-password').value;
  if (!email || !password) {
    showToast('Enter email and password');
    return;
  }
  if (password.length < 6) {
    showToast('Password must be at least 6 characters');
    return;
  }
  try {
    await signUpWithEmail(email, password);
  } catch (e) {
    showToast(e.message || 'Sign up failed');
  }
});

// Bottom nav
document.querySelectorAll('.nav-item').forEach((btn) => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});

// Sign out
document.getElementById('btn-signout').addEventListener('click', async () => {
  await signOut();
});

// Init modules
const matchesModule = initMatches(openChatWithMatch);
bindChatUI();
bindProfileUI();
bindDiscoverButtons(showMatchPopup);

// Auth state
initAuth({
  onLoggedIn(user) {
    showScreen('app');
    showView('discover');
    loadDiscover();
    matchesModule.start(user.uid);
    renderChatList();
    renderProfile();
  },
  onLoggedOut() {
    showScreen('auth');
    document.getElementById('email-form').classList.add('hidden');
    matchesModule.stop();
  },
});
