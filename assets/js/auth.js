// ============================================================
// SOPHIA — auth.js
// Simple localStorage-based auth. No backend required.
// Upgrade path: replace localStorage calls with API calls later.
// ============================================================

const USERS_KEY   = 'sophia_users';
const SESSION_KEY = 'sophia_session';

// ---- Storage helpers ----

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
  catch { return {}; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
  catch { return null; }
}

function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ---- Modal control ----

function openAuthModal(panel) {
  panel = panel || 'login';
  document.getElementById('auth-overlay').classList.add('open');
  document.getElementById('auth-modal').classList.add('open');
  switchPanel(panel);
  // Focus first input
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
  ['login', 'register', 'success'].forEach(function(p) {
    var el = document.getElementById('panel-' + p);
    if (el) el.style.display = (p === name) ? 'block' : 'none';
  });
  clearErrors();
}

function clearErrors() {
  ['login-error', 'register-error'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

// ---- Register ----

function handleRegister() {
  var name     = (document.getElementById('reg-name')     || {}).value || '';
  var email    = (document.getElementById('reg-email')    || {}).value || '';
  var password = (document.getElementById('reg-password') || {}).value || '';
  var errEl    = document.getElementById('register-error');

  name     = name.trim();
  email    = email.trim().toLowerCase();
  password = password.trim();

  if (!name)                         { errEl.textContent = 'Nama tidak boleh kosong.'; return; }
  if (!validateEmail(email))         { errEl.textContent = 'Format email tidak valid.'; return; }
  if (password.length < 6)           { errEl.textContent = 'Password minimal 6 karakter.'; return; }

  var users = getUsers();
  if (users[email])                  { errEl.textContent = 'Email ini sudah terdaftar.'; return; }

  // Store user (password stored in plain text — fine for demo; hash in production)
  users[email] = { name: name, email: email, password: password, joinedAt: Date.now() };
  saveUsers(users);

  var user = { name: name, email: email };
  saveSession(user);
  onLoginSuccess(user, 'Selamat datang, ' + name + '! Akun kamu sudah dibuat.');
}

// ---- Login ----

function handleLogin() {
  var email    = (document.getElementById('login-email')    || {}).value || '';
  var password = (document.getElementById('login-password') || {}).value || '';
  var errEl    = document.getElementById('login-error');

  email    = email.trim().toLowerCase();
  password = password.trim();

  if (!validateEmail(email)) { errEl.textContent = 'Format email tidak valid.'; return; }
  if (!password)             { errEl.textContent = 'Password tidak boleh kosong.'; return; }

  var users = getUsers();
  var user  = users[email];

  if (!user || user.password !== password) {
    errEl.textContent = 'Email atau password salah.';
    return;
  }

  var sessionUser = { name: user.name, email: user.email };
  saveSession(sessionUser);
  onLoginSuccess(sessionUser, 'Selamat datang kembali, ' + user.name + '!');
}

// ---- Logout ----

function logoutUser() {
  clearSession();
  updateNavAuth(null);
  // Reload so paywalled articles re-apply
  window.location.reload();
}

// ---- Post-login ----

function onLoginSuccess(user, message) {
  updateNavAuth(user);
  var msgEl = document.getElementById('success-message');
  if (msgEl) msgEl.textContent = message || 'Kamu sudah masuk ke Sophia.';
  switchPanel('success');

  // After 1.8 seconds, close modal and reload if on a member-only article
  setTimeout(function() {
    closeAuthModal();
    if (document.getElementById('article-paywall')) {
      window.location.reload();
    }
  }, 1800);
}

// ---- Nav state ----

function updateNavAuth(user) {
  var guestEl = document.getElementById('nav-auth-guest');
  var userEl  = document.getElementById('nav-auth-user');
  var nameEl  = document.getElementById('nav-user-name');

  if (!guestEl || !userEl) return;

  if (user) {
    guestEl.style.display = 'none';
    userEl.style.display  = 'flex';
    if (nameEl) nameEl.textContent = user.name.split(' ')[0]; // first name only
  } else {
    guestEl.style.display = 'flex';
    userEl.style.display  = 'none';
  }
}

// ---- Keyboard close ----

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeAuthModal();
});

// Enter key submits active form
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Enter') return;
  var loginPanel    = document.getElementById('panel-login');
  var registerPanel = document.getElementById('panel-register');
  if (loginPanel    && loginPanel.style.display    !== 'none' && document.getElementById('auth-modal').classList.contains('open')) handleLogin();
  if (registerPanel && registerPanel.style.display !== 'none' && document.getElementById('auth-modal').classList.contains('open')) handleRegister();
});

// ---- Utility ----

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---- Init ----

document.addEventListener('DOMContentLoaded', function() {
  updateNavAuth(getCurrentUser());
});
