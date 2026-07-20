/**
 * Daily Work Log — Theme manager (global preference)
 */

const Theme = (() => {
  const ATTR = 'data-theme';
  const GLOBAL_KEY = 'dwl_theme';

  function getPreferred() {
    try {
      const saved = localStorage.getItem(GLOBAL_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (_) {
      /* ignore */
    }
    if (typeof Storage !== 'undefined' && Storage.getSettings) {
      const fromUser = Storage.getSettings().theme;
      if (fromUser === 'light' || fromUser === 'dark') return fromUser;
    }
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function apply(theme) {
    const next = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute(ATTR, next);
    try {
      localStorage.setItem(GLOBAL_KEY, next);
    } catch (_) {
      /* ignore */
    }
    if (typeof Storage !== 'undefined' && Storage.saveSettings && Auth?.isAuthenticated?.()) {
      Storage.saveSettings({ theme: next });
    }
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
  }

  function toggle() {
    const current = document.documentElement.getAttribute(ATTR) || 'dark';
    apply(current === 'dark' ? 'light' : 'dark');
  }

  function init() {
    apply(getPreferred());
  }

  function isDark() {
    return (document.documentElement.getAttribute(ATTR) || 'dark') === 'dark';
  }

  return { init, apply, toggle, isDark, getPreferred };
})();

window.Theme = Theme;
