/**
 * Daily Work Log — Authentication (LocalStorage)
 * Register / login / logout with per-user sessions.
 */

const Auth = (() => {
  const KEYS = {
    USERS: 'dwl_users',
    SESSION: 'dwl_session',
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /** Lightweight sync hash for demo LocalStorage auth (not production crypto). */
  function hashPassword(password, salt) {
    const str = `${salt}:${password}:dwl`;
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }

  function getUsers() {
    return read(KEYS.USERS, []);
  }

  function saveUsers(users) {
    write(KEYS.USERS, users);
  }

  function getSession() {
    return read(KEYS.SESSION, null);
  }

  function setSession(user, remember = true) {
    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      remember: !!remember,
      loggedInAt: new Date().toISOString(),
    };
    write(KEYS.SESSION, session);
    return session;
  }

  function clearSession() {
    localStorage.removeItem(KEYS.SESSION);
  }

  function getCurrentUser() {
    const session = getSession();
    if (!session?.id) return null;
    const user = getUsers().find((u) => u.id === session.id);
    if (!user) {
      clearSession();
      return null;
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'Member',
      bio: user.bio || '',
      createdAt: user.createdAt,
    };
  }

  function getCurrentUserId() {
    return getSession()?.id || null;
  }

  function isAuthenticated() {
    return !!getCurrentUser();
  }

  /**
   * @returns {{ ok: boolean, error?: string, user?: object }}
   */
  function register({ name, email, password }) {
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '');

    if (!cleanName || cleanName.length < 2) {
      return { ok: false, error: 'Please enter your name (at least 2 characters).' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }
    if (cleanPassword.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }

    const users = getUsers();
    if (users.some((u) => u.email === cleanEmail)) {
      return { ok: false, error: 'An account with this email already exists.' };
    }

    const salt = Math.random().toString(36).slice(2, 10);
    const user = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: cleanName,
      email: cleanEmail,
      passwordHash: hashPassword(cleanPassword, salt),
      salt,
      role: 'Member',
      bio: '',
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    saveUsers(users);
    setSession(user, true);

    return { ok: true, user: getCurrentUser() };
  }

  /**
   * @returns {{ ok: boolean, error?: string, user?: object }}
   */
  function login({ email, password, remember = true }) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '');
    const users = getUsers();
    const user = users.find((u) => u.email === cleanEmail);

    if (!user) {
      return { ok: false, error: 'No account found with that email.' };
    }

    const hash = hashPassword(cleanPassword, user.salt);
    if (hash !== user.passwordHash) {
      return { ok: false, error: 'Incorrect password. Please try again.' };
    }

    setSession(user, remember);
    return { ok: true, user: getCurrentUser() };
  }

  function logout() {
    clearSession();
  }

  function updateCurrentUserProfile(patch) {
    const session = getSession();
    if (!session?.id) return null;
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === session.id);
    if (idx === -1) return null;

    if (patch.name !== undefined) users[idx].name = String(patch.name).trim();
    if (patch.role !== undefined) users[idx].role = String(patch.role).trim();
    if (patch.bio !== undefined) users[idx].bio = String(patch.bio).trim();
    // email stays tied to account identity

    saveUsers(users);
    setSession(users[idx], session.remember);
    return getCurrentUser();
  }

  /** Redirect to login if page requires auth. Skip on auth pages. */
  function requireAuth() {
    const path = (location.pathname.split('/').pop() || '').toLowerCase();
    const publicPages = ['login.html', 'register.html'];
    if (publicPages.includes(path)) {
      if (isAuthenticated()) {
        location.replace('dashboard.html');
      }
      return false;
    }

    if (!isAuthenticated()) {
      location.replace('login.html');
      return false;
    }
    return true;
  }

  return {
    KEYS,
    register,
    login,
    logout,
    getCurrentUser,
    getCurrentUserId,
    isAuthenticated,
    requireAuth,
    updateCurrentUserProfile,
    getSession,
  };
})();

window.Auth = Auth;

/** Login / Register page handlers */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Auth === 'undefined') return;

  const onAuthPage =
    document.getElementById('login-form') || document.getElementById('register-form');
  if (onAuthPage) {
    Auth.requireAuth();
  }

  document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const err = document.getElementById('login-error');
    const result = Auth.login({
      email: document.getElementById('login-email').value,
      password: document.getElementById('login-password').value,
      remember: document.getElementById('login-remember')?.checked !== false,
    });
    if (!result.ok) {
      if (err) {
        err.textContent = result.error;
        err.classList.remove('hidden');
      }
      return;
    }
    err?.classList.add('hidden');
    if (window.App) App.toast('Welcome back!', 'success');
    location.href = 'dashboard.html';
  });

  document.getElementById('register-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const err = document.getElementById('register-error');
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    if (password !== confirm) {
      if (err) {
        err.textContent = 'Passwords do not match.';
        err.classList.remove('hidden');
      }
      return;
    }
    const result = Auth.register({
      name: document.getElementById('reg-name').value,
      email: document.getElementById('reg-email').value,
      password,
    });
    if (!result.ok) {
      if (err) {
        err.textContent = result.error;
        err.classList.remove('hidden');
      }
      return;
    }
    if (window.Storage) Storage.seedIfNeeded();
    if (window.App) App.toast('Account created. Welcome!', 'success');
    location.href = 'dashboard.html';
  });
});
