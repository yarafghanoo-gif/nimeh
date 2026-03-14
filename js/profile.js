/**
 * Profile view and edit (photo, name, age, bio, interests).
 */
import { getUser, updateUserProfile } from './firestore.js';
import { getCurrentUser } from './auth.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { storage } from './firebase-config.js';

function getModal() {
  return document.getElementById('edit-profile-modal');
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

export async function renderProfile() {
  const me = getCurrentUser();
  if (!me) return;
  const profile = await getUser(me.uid);
  if (!profile) return;

  const photoEl = document.getElementById('profile-photo');
  photoEl.src = profile.photoURL || me.photoURL || 'https://via.placeholder.com/140?text=Photo';
  document.getElementById('profile-name').textContent = profile.displayName || me.displayName || '—';
  document.getElementById('profile-age').textContent =
    profile.age != null ? `${profile.age} years old` : '—';
  document.getElementById('profile-bio').textContent = profile.bio || '—';

  const interestsEl = document.getElementById('profile-interests');
  const tags = Array.isArray(profile.interests) ? profile.interests : [];
  interestsEl.innerHTML = tags.map((t) => `<span class="tag">${escapeHtml(String(t))}</span>`).join('');
}

export function bindProfileUI() {
  document.getElementById('btn-edit-profile').addEventListener('click', async () => {
    const me = getCurrentUser();
    if (!me) return;
    const profile = await getUser(me.uid);
    document.getElementById('edit-displayName').value = profile?.displayName || me.displayName || '';
    document.getElementById('edit-age').value = profile?.age ?? '';
    document.getElementById('edit-bio').value = profile?.bio || '';
    document.getElementById('edit-interests').value = Array.isArray(profile?.interests)
      ? profile.interests.join(', ')
      : '';
    getModal().classList.remove('hidden');
  });

  document.getElementById('edit-cancel').addEventListener('click', () => getModal().classList.add('hidden'));
  document.getElementById('edit-save').addEventListener('click', async () => {
    const me = getCurrentUser();
    if (!me) return;
    const displayName = document.getElementById('edit-displayName').value.trim();
    const age = parseInt(document.getElementById('edit-age').value, 10);
    const bio = document.getElementById('edit-bio').value.trim();
    const interestsStr = document.getElementById('edit-interests').value.trim();
    const interests = interestsStr ? interestsStr.split(',').map((s) => s.trim()).filter(Boolean) : [];
    await updateUserProfile(me.uid, {
      displayName: displayName || undefined,
      age: isNaN(age) ? null : age,
      bio: bio || '',
      interests,
    });
    getModal().classList.add('hidden');
    renderProfile();
  });

  document.getElementById('btn-edit-photo').addEventListener('click', () => {
    document.getElementById('photo-input').click();
  });

  document.getElementById('photo-input').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const me = getCurrentUser();
    if (!me) return;
    try {
      const path = `photos/${me.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      await updateUserProfile(me.uid, { photoURL });
      document.getElementById('profile-photo').src = photoURL;
      window.showToast?.('Photo updated');
    } catch (err) {
      window.showToast?.(err.message || 'Upload failed');
    }
    e.target.value = '';
  });
}
