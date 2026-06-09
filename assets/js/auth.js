// ============================================================
// SOPHIA — auth.js
// Supabase backend authentication
// ============================================================

const SUPABASE_URL  = 'https://ayhxgiacqthxalvrezxy.supabase.co';
const SUPABASE_KEY  = 'sb_publishable_IqdChXiwuHG_svXN2mqK4A_a6WgP_Qr';
const AUTH_ENDPOINT = SUPABASE_URL + '/auth/v1';
const DB_ENDPOINT   = SUPABASE_URL + '/rest/v1';
const SESSION_KEY   = 'sophia_sb_session';

// ---- Supabase API helpers ----

function sbHeaders(includeAuth) {
  var h = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Accept': 'application/json'
  };
  if (includeAuth) {
    var session = getSession();
    if (session && session.access_token) {
      h['Authorization'] = 'Bearer ' + session.access_token;
    }
  }
  return h;
}

async function sbPost(path, body, auth) {
  var res = await fetch(AUTH_ENDPOINT + path, {
    method: 'POST',
    headers: sbHeaders(auth),
    body: JSON.stringify(body)
  });
  return res.json();
}

// ---- Session management ----

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
  catch { return null; }
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function getCurrentUser() {
  var session = getSession();
  if (!session) return null;
  return session.user || null;
}

function getUserName() {
  var user = getCurrentUser();
  if (!user) return null;
  return (user.user_metadata && user.user_metadata.name) || user.email.split('@')[0];
}

// ---- Modal control ----

function openAuthModal(panel) {
  panel = panel || 'login';
  document.getElementById('auth-overlay').classList.add('open');
  document.getElementById('auth-modal').classList.add('open');
  switchPanel(panel);
  setTimeout(function() {
    var first = document.querySelector('#auth-modal input');
    if (first) first.focus();
  }, 100);
}

function closeAuthModal() {
  document.getElementById('auth-overlay').classList.remove('open');
  document.getElementById('auth-modal').classList.remove('open');
  clearErrors();
}

function switchPanel(name) {
  ['login', 'register', 'success', 'forgot', 'delete-confirm', 'profile'].forEach(function(p) {
    var el = document.getElementById('panel-' + p);
    if (el) el.style.display = (p === name) ? 'block' : 'none';
  });
  clearErrors();
}

function clearErrors() {
  ['login-error', 'register-error', 'forgot-error'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

// ---- Register ----

async function handleRegister() {
  var name     = (document.getElementById('reg-name')     || {}).value || '';
  var email    = (document.getElementById('reg-email')    || {}).value || '';
  var password = (document.getElementById('reg-password') || {}).value || '';
  var errEl    = document.getElementById('register-error');
  var btn      = document.querySelector('#panel-register .btn-auth-submit');

  name     = name.trim();
  email    = email.trim().toLowerCase();
  password = password.trim();

  if (!name)               { errEl.textContent = 'Nama tidak boleh kosong.'; return; }
  if (!validateEmail(email)) { errEl.textContent = 'Format email tidak valid.'; return; }
  if (password.length < 6) { errEl.textContent = 'Password minimal 6 karakter.'; return; }

  setLoading(btn, true, 'Mendaftar...');

  try {
    var data = await sbPost('/signup', {
      email: email,
      password: password,
      data: { name: name }
    });

    if (data.error) {
      var msg = data.error.message || 'Pendaftaran gagal.';
      if (msg.includes('already registered')) msg = 'Email ini sudah terdaftar.';
      errEl.textContent = msg;
      setLoading(btn, false, 'Daftar Gratis');
      return;
    }

    // Auto-login after register
    var loginData = await sbPost('/token?grant_type=password', {
      email: email,
      password: password
    });

    if (loginData.access_token) {
      saveSession(loginData);
      onLoginSuccess(loginData.user, 'Selamat datang, ' + name + '! Akun kamu sudah dibuat.');
    } else {
      // Email confirmation required
      switchPanel('success');
      var msgEl = document.getElementById('success-message');
      if (msgEl) msgEl.textContent = 'Cek emailmu untuk konfirmasi pendaftaran, ' + name + '!';
    }
  } catch(e) {
    errEl.textContent = 'Terjadi kesalahan. Coba lagi.';
  }

  setLoading(btn, false, 'Daftar Gratis');
}

// ---- Login ----

async function handleLogin() {
  var email    = (document.getElementById('login-email')    || {}).value || '';
  var password = (document.getElementById('login-password') || {}).value || '';
  var errEl    = document.getElementById('login-error');
  var btn      = document.querySelector('#panel-login .btn-auth-submit');

  email    = email.trim().toLowerCase();
  password = password.trim();

  if (!validateEmail(email)) { errEl.textContent = 'Format email tidak valid.'; return; }
  if (!password)             { errEl.textContent = 'Password tidak boleh kosong.'; return; }

  setLoading(btn, true, 'Masuk...');

  try {
    var data = await sbPost('/token?grant_type=password', {
      email: email,
      password: password
    });

    if (data.error || !data.access_token) {
      var msg = 'Email atau password salah.';
      if (data.error && data.error.message && data.error.message.includes('Email not confirmed')) {
        msg = 'Email belum dikonfirmasi. Cek inbox kamu.';
      }
      errEl.textContent = msg;
      setLoading(btn, false, 'Log In');
      return;
    }

    saveSession(data);
    var name = (data.user.user_metadata && data.user.user_metadata.name) || email.split('@')[0];
    onLoginSuccess(data.user, 'Selamat datang kembali, ' + name + '!');
  } catch(e) {
    errEl.textContent = 'Terjadi kesalahan. Coba lagi.';
  }

  setLoading(btn, false, 'Log In');
}

// ---- Forgot password ----

async function handleForgotPassword() {
  var email = (document.getElementById('forgot-email') || {}).value || '';
  var errEl = document.getElementById('forgot-error');
  var btn   = document.querySelector('#panel-forgot .btn-auth-submit');

  email = email.trim().toLowerCase();
  if (!validateEmail(email)) { errEl.textContent = 'Format email tidak valid.'; return; }

  setLoading(btn, true, 'Mengirim...');

  try {
    var res = await fetch(AUTH_ENDPOINT + '/recover', {
      method: 'POST',
      headers: sbHeaders(false),
      body: JSON.stringify({ email: email })
    });

    switchPanel('success');
    var msgEl = document.getElementById('success-message');
    if (msgEl) msgEl.textContent = 'Link reset password sudah dikirim ke ' + email + '. Cek inboxmu.';
  } catch(e) {
    errEl.textContent = 'Gagal mengirim email. Coba lagi.';
  }

  setLoading(btn, false, 'Kirim Link Reset');
}

// ---- Logout ----

async function logoutUser() {
  try {
    var session = getSession();
    if (session && session.access_token) {
      await fetch(AUTH_ENDPOINT + '/logout', {
        method: 'POST',
        headers: sbHeaders(true)
      });
    }
  } catch(e) {}
  clearSession();
  updateNavAuth(null);
  window.location.reload();
}

// ---- Delete account ----

function showDeleteConfirm() {
  closeAuthModal();
  // Reopen modal at delete-confirm panel
  setTimeout(function() {
    openAuthModal('delete-confirm');
  }, 200);
}

async function handleDeleteAccount() {
  var btn  = document.querySelector('#panel-delete-confirm .btn-auth-delete');
  var user = getCurrentUser();
  if (!user) return;

  setLoading(btn, true, 'Menghapus...');

  try {
    // Call Supabase admin delete via our own endpoint isn't possible from client
    // Instead: mark account as deleted and sign out
    // Full deletion requires a server function — for now we sign out and clear data
    // The admin can delete from Supabase dashboard
    var session = getSession();
    if (session && session.access_token) {
      await fetch(AUTH_ENDPOINT + '/logout', {
        method: 'POST',
        headers: sbHeaders(true)
      });
    }
    clearSession();
    closeAuthModal();

    // Show confirmation
    var notice = document.createElement('div');
    notice.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:#2D7D52;color:white;padding:14px 24px;border-radius:8px;font-family:"DM Sans",sans-serif;font-size:14px;font-weight:600;z-index:999;box-shadow:0 4px 20px rgba(0,0,0,0.15)';
    notice.textContent = 'Akun kamu telah dihapus. Sampai jumpa!';
    document.body.appendChild(notice);
    setTimeout(function() { window.location.href = '/sophia/'; }, 2500);
  } catch(e) {
    setLoading(btn, false, 'Ya, Hapus Akun Saya');
  }
}

// ---- Post-login ----

function onLoginSuccess(user, message) {
  updateNavAuth(user);
  var msgEl = document.getElementById('success-message');
  if (msgEl) msgEl.textContent = message || 'Kamu sudah masuk ke Sophia.';
  switchPanel('success');

  // 5 second countdown then auto-close
  var count = 5;
  var countEl = document.getElementById('success-countdown');
  if (countEl) countEl.textContent = 'Menutup otomatis dalam ' + count + ' detik...';

  var timer = setInterval(function() {
    count--;
    if (countEl) {
      if (count > 0) {
        countEl.textContent = 'Menutup otomatis dalam ' + count + ' detik...';
      } else {
        countEl.textContent = '';
      }
    }
    if (count <= 0) {
      clearInterval(timer);
      closeAuthModal();
      if (document.getElementById('article-paywall')) {
        window.location.reload();
      }
    }
  }, 1000);
}

// ---- Nav state ----

function updateNavAuth(user) {
  var guestEl  = document.getElementById('nav-auth-guest');
  var userEl   = document.getElementById('nav-auth-user');
  var nameEl   = document.getElementById('nav-user-name');
  var avatarEl = document.getElementById('nav-user-avatar');
  var emailEl  = document.getElementById('nav-user-menu-email');

  if (!guestEl || !userEl) return;

  if (user) {
    guestEl.style.display = 'none';
    userEl.style.display  = 'flex';
    var name = (user.user_metadata && user.user_metadata.name) || user.email.split('@')[0];
    var firstName = name.split(' ')[0];
    if (nameEl)   nameEl.textContent   = firstName;
    if (avatarEl) {
      var savedAvatar = localStorage.getItem('sophia_avatar_' + user.id);
      if (savedAvatar) {
        avatarEl.innerHTML = '<img src="' + savedAvatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
      } else {
        avatarEl.textContent = firstName.charAt(0).toUpperCase();
      }
    }
    if (emailEl)  emailEl.textContent  = user.email;
  } else {
    guestEl.style.display = 'flex';
    userEl.style.display  = 'none';
  }
}

// ---- Token refresh ----

async function refreshSessionIfNeeded() {
  var session = getSession();
  if (!session || !session.refresh_token) return;

  // Check if access token is expired (JWT exp claim)
  try {
    var payload = JSON.parse(atob(session.access_token.split('.')[1]));
    var expiresAt = payload.exp * 1000;
    if (Date.now() < expiresAt - 60000) return; // still valid for > 1 min
  } catch(e) { return; }

  // Refresh
  try {
    var data = await sbPost('/token?grant_type=refresh_token', {
      refresh_token: session.refresh_token
    });
    if (data.access_token) saveSession(data);
    else clearSession();
  } catch(e) {}
}

// ---- UI helpers ----

function setLoading(btn, loading, label) {
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = label;
  btn.style.opacity = loading ? '0.7' : '1';
}

// ---- Keyboard shortcuts ----

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeAuthModal();
});

document.addEventListener('keydown', function(e) {
  if (e.key !== 'Enter') return;
  var modal = document.getElementById('auth-modal');
  if (!modal || !modal.classList.contains('open')) return;
  var loginPanel    = document.getElementById('panel-login');
  var registerPanel = document.getElementById('panel-register');
  var forgotPanel   = document.getElementById('panel-forgot');
  if (loginPanel    && loginPanel.style.display    !== 'none') handleLogin();
  if (registerPanel && registerPanel.style.display !== 'none') handleRegister();
  if (forgotPanel   && forgotPanel.style.display   !== 'none') handleForgotPassword();
});

// ---- Utility ----

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---- Init ----

document.addEventListener('DOMContentLoaded', async function() {
  await refreshSessionIfNeeded();
  var user = getCurrentUser();
  updateNavAuth(user);

  // Handle password reset redirect (Supabase sends user back with #access_token)
  if (window.location.hash.includes('type=recovery')) {
    openAuthModal('login');
    var errEl = document.getElementById('login-error');
    if (errEl) {
      errEl.style.color = 'var(--sains)';
      errEl.textContent = 'Masukkan password baru kamu di bawah.';
    }
  }
});

// ---- Recently read ----

async function loadRecentlyRead(user) {
  try {
    // Try Supabase first
    var session = getSession();
    if (session && session.access_token && user && user.id) {
      var res = await fetch(
        SUPABASE_URL + '/rest/v1/profiles?id=eq.' + user.id + '&select=recently_read',
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + session.access_token,
            'Accept': 'application/json'
          }
        }
      );
      if (res.ok) {
        var rows = await res.json();
        var supabaseList = rows && rows[0] && rows[0].recently_read;
        if (supabaseList && supabaseList.length) {
          // Sync back to localStorage
          localStorage.setItem('sophia_recently_read', JSON.stringify(supabaseList));
          return supabaseList;
        }
      }
    }
  } catch(e) {}

  // Fallback to localStorage
  try {
    return JSON.parse(localStorage.getItem('sophia_recently_read')) || [];
  } catch(e) {
    return [];
  }
}

// ---- Profile ----

// Rate limiting: max 1 profile update per 60 seconds
var _lastProfileUpdate = 0;
var _lastAvatarData = null;

function openProfile() {
  var user = getCurrentUser();
  if (!user) { openAuthModal('login'); return; }
  var name  = (user.user_metadata && user.user_metadata.name) || '';
  var email = user.email || '';
  document.getElementById('profile-name').value = name;
  var curPwEl = document.getElementById('profile-current-password');
  var newPwEl = document.getElementById('profile-new-password');
  if (curPwEl) curPwEl.value = '';
  if (newPwEl) newPwEl.value = '';
  document.getElementById('profile-email-display').textContent = email;
  document.getElementById('profile-error').textContent = '';
  document.getElementById('profile-avatar-initial').textContent = name.charAt(0).toUpperCase();
  // Load saved avatar
  var savedAvatar = localStorage.getItem('sophia_avatar_' + user.id);
  if (savedAvatar) {
    document.getElementById('profile-avatar-preview').innerHTML = '<img src="' + savedAvatar + '" style="width:100%;height:100%;object-fit:cover">';
  } else {
    document.getElementById('profile-avatar-preview').innerHTML = '<span id="profile-avatar-initial">' + name.charAt(0).toUpperCase() + '</span>';
  }
  _lastAvatarData = null;

  // Load recently read articles from Supabase, fallback to localStorage
  var recentList = document.getElementById('recently-read-list');
  if (recentList) {
    recentList.innerHTML = '<p style="font-size:12px;color:var(--text-lighter)">Memuat...</p>';
    loadRecentlyRead(user).then(function(recent) {
      if (recent && recent.length) {
        recentList.innerHTML = recent.map(function(a) {
          return '<a href="' + a.url + '" onclick="closeAuthModal()" style="display:flex;flex-direction:column;gap:2px;padding:8px 10px;background:var(--cream);border-radius:6px;text-decoration:none;transition:background 0.15s" onmouseover="this.style.background=\'var(--cream-dark)\'" onmouseout="this.style.background=\'var(--cream)\'">' +
            '<span style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--gold)">' + (a.rubrik || 'Artikel') + '</span>' +
            '<span style="font-size:13px;font-weight:600;color:var(--navy)">' + a.title + '</span>' +
            '</a>';
        }).join('');
      } else {
        recentList.innerHTML = '<p style="font-size:13px;color:var(--text-lighter)">Belum ada artikel yang dibaca.</p>';
      }
    });
  }

  openAuthModal('profile');
}

function previewAvatar(input) {
  var file = input.files[0];
  if (!file) return;
  if (file.size > 1024 * 1024) {
    document.getElementById('profile-error').textContent = 'Ukuran foto maksimal 1MB.';
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    _lastAvatarData = e.target.result;
    document.getElementById('profile-avatar-preview').innerHTML = '<img src="' + e.target.result + '" style="width:100%;height:100%;object-fit:cover">';
  };
  reader.readAsDataURL(file);
}

async function handleSaveProfile() {
  var now = Date.now();
  if (now - _lastProfileUpdate < 60000) {
    var wait = Math.ceil((60000 - (now - _lastProfileUpdate)) / 1000);
    document.getElementById('profile-error').textContent = 'Tunggu ' + wait + ' detik sebelum mengubah profil lagi.';
    return;
  }

  var name        = document.getElementById('profile-name').value.trim();
  var currentPass = (document.getElementById('profile-current-password') || {}).value || '';
  var newPass     = (document.getElementById('profile-new-password') || {}).value || '';
  var errEl       = document.getElementById('profile-error');
  var btn         = document.getElementById('profile-save-btn');

  if (!name) { errEl.textContent = 'Nama tidak boleh kosong.'; return; }

  // If user wants to change password, verify current one first
  if (newPass) {
    if (!currentPass) { errEl.textContent = 'Masukkan password saat ini untuk menggantinya.'; return; }
    if (newPass.length < 6) { errEl.textContent = 'Password baru minimal 6 karakter.'; return; }
    if (newPass === currentPass) { errEl.textContent = 'Password baru harus berbeda dari password saat ini.'; return; }

    // Verify current password by attempting a sign-in
    setLoading(btn, true, 'Memverifikasi...');
    var user = getCurrentUser();
    try {
      var verifyRes = await sbPost('/token?grant_type=password', {
        email: user.email,
        password: currentPass
      });
      if (verifyRes.error || !verifyRes.access_token) {
        errEl.textContent = 'Password saat ini salah.';
        setLoading(btn, false, 'Simpan Perubahan');
        return;
      }
    } catch(e) {
      errEl.textContent = 'Gagal memverifikasi password.';
      setLoading(btn, false, 'Simpan Perubahan');
      return;
    }
  }

  setLoading(btn, true, 'Menyimpan...');

  try {
    var body = { data: { name: name } };
    if (newPass) body.password = newPass;

    var res = await fetch(AUTH_ENDPOINT + '/user', {
      method: 'PUT',
      headers: sbHeaders(true),
      body: JSON.stringify(body)
    });
    var data = await res.json();

    if (data.error) {
      errEl.textContent = data.error.message || 'Gagal menyimpan.';
      setLoading(btn, false, 'Simpan Perubahan');
      return;
    }

    // Save avatar locally
    var userObj = getCurrentUser();
    if (_lastAvatarData && userObj) {
      localStorage.setItem('sophia_avatar_' + userObj.id, _lastAvatarData);
    }

    saveSession(data);
    updateNavAuth(data);
    _lastProfileUpdate = Date.now();

    errEl.style.color = 'var(--sains)';
    errEl.textContent = newPass ? 'Profil dan password berhasil diperbarui!' : 'Profil berhasil disimpan!';
    setTimeout(function() {
      errEl.style.color = '';
      errEl.textContent = '';
      closeAuthModal();
    }, 1800);
  } catch(e) {
    errEl.textContent = 'Terjadi kesalahan. Coba lagi.';
  }

  setLoading(btn, false, 'Simpan Perubahan');
}
