import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { logout } from './auth.js';

// منوی پایین – فقط آیتمی که کلیک شده فعال بشه
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const viewName = item.dataset.view;
    
    // اول همه رو غیرفعال کن
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    // فقط همین یکی فعال باشه
    item.classList.add('active');
    
    // نمایش صفحه مربوطه
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(`view-${viewName}`)?.classList.add('active');
  });
});

// دکمه خروج
document.getElementById('btn-signout')?.addEventListener('click', logout);

// تشخیص ورود یا خروج کاربر
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('✅ کاربر وارد شد:', user.email);
    // صفحه لاگین رو مخفی کن، برنامه اصلی رو نشون بده
    document.getElementById('auth-screen')?.classList.remove('active');
    document.getElementById('app-screen')?.classList.add('active');
  } else {
    console.log('❌ کاربر خارج شد');
    // صفحه لاگین رو نشون بده
    document.getElementById('auth-screen')?.classList.add('active');
    document.getElementById('app-screen')?.classList.remove('active');
  }
});
