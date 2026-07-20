/**
 * Daily Work Log — Shared UI utilities
 * Toasts, modals, navigation, counters, scroll reveal
 */

const App = (() => {
  /* ---- Toast ---- */

  function ensureToastContainer() {
    let el = document.getElementById('toast-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast-container';
      el.className = 'toast-container';
      document.body.appendChild(el);
    }
    return el;
  }

  /**
   * @param {string} message
   * @param {'success'|'error'|'info'} [type]
   * @param {string} [title]
   */
  function toast(message, type = 'info', title) {
    const container = ensureToastContainer();
    const titles = {
      success: title || 'Success',
      error: title || 'Error',
      info: title || 'Notice',
    };
    const icons = {
      success: 'check-circle',
      error: 'alert-circle',
      info: 'info',
    };

    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <div class="toast-icon"><i data-lucide="${icons[type]}"></i></div>
      <div class="toast-content">
        <strong>${titles[type]}</strong>
        <p>${escapeHtml(message)}</p>
      </div>
      <button class="toast-close" aria-label="Dismiss">
        <i data-lucide="x"></i>
      </button>
    `;

    const remove = () => {
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 250);
    };

    el.querySelector('.toast-close').addEventListener('click', remove);
    container.appendChild(el);
    refreshIcons(el);
    setTimeout(remove, 3600);
  }

  /* ---- Confirm modal ---- */

  function confirm({
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = true,
  } = {}) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div class="confirm-icon"><i data-lucide="${danger ? 'trash-2' : 'help-circle'}"></i></div>
          <div class="modal-header">
            <div>
              <h2 id="confirm-title">${escapeHtml(title)}</h2>
              <p>${escapeHtml(message)}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-action="cancel">${escapeHtml(cancelText)}</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm">${escapeHtml(confirmText)}</button>
          </div>
        </div>
      `;

      const close = (result) => {
        overlay.classList.remove('open');
        setTimeout(() => {
          overlay.remove();
          resolve(result);
        }, 200);
      };

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(false);
      });
      overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => close(false));
      overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => close(true));

      document.body.appendChild(overlay);
      refreshIcons(overlay);
      requestAnimationFrame(() => overlay.classList.add('open'));
    });
  }

  /* ---- Generic modal helpers ---- */

  function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('open');
    document.body.style.overflow = '';
  }

  function bindModalDismiss() {
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
      overlay.querySelectorAll('[data-close-modal]').forEach((btn) => {
        btn.addEventListener('click', () => {
          overlay.classList.remove('open');
          document.body.style.overflow = '';
        });
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach((o) => {
          o.classList.remove('open');
        });
        document.body.style.overflow = '';
      }
    });
  }

  /* ---- Icons ---- */

  function refreshIcons(root = document) {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons({
        attrs: { 'stroke-width': 1.75 },
        nameAttr: 'data-lucide',
      });
    }
  }

  /* ---- Animated counter ---- */

  function animateCounter(el, target, duration = 900) {
    if (!el) return;
    const end = Number(target) || 0;
    const start = 0;
    const startTime = performance.now();

    function frame(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(start + (end - start) * eased);
      if (t < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  /* ---- Scroll reveal ---- */

  function initReveal() {
    const nodes = document.querySelectorAll('.reveal');
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    nodes.forEach((n) => io.observe(n));
  }

  /* ---- Page loader ---- */

  function hideLoader() {
    const loader = document.getElementById('page-loader');
    if (!loader) return;
    setTimeout(() => loader.classList.add('hidden'), 280);
  }

  /* ---- Sidebar profile chip ---- */

  function renderNavUser() {
    const profile = Storage.getProfile();
    document.querySelectorAll('[data-nav-name]').forEach((el) => {
      el.textContent = profile.name;
    });
    document.querySelectorAll('[data-nav-role]').forEach((el) => {
      el.textContent = profile.role;
    });
    document.querySelectorAll('[data-nav-initials]').forEach((el) => {
      el.textContent = getInitials(profile.name);
    });
  }

  function getInitials(name) {
    return String(name || 'U')
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatRelative(iso) {
    const today = Storage.todayISO();
    if (iso === today) return 'Today';
    if (iso === Storage.dateOffset(-1)) return 'Yesterday';
    if (iso === Storage.dateOffset(1)) return 'Tomorrow';
    return formatDate(iso);
  }

  function priorityLabel(p) {
    return { low: 'Low', medium: 'Medium', high: 'High' }[p] || p;
  }

  /* ---- Live clock ---- */

  function startClock(timeSelector, dateSelector) {
    const timeEl = document.querySelector(timeSelector);
    const dateEl = document.querySelector(dateSelector);
    if (!timeEl && !dateEl) return;

    const tick = () => {
      const now = new Date();
      if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: undefined,
          hour12: true,
        });
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }
    };

    tick();
    setInterval(tick, 1000);
  }

  /* ---- Greeting ---- */

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  /* ---- Boot ---- */

  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const tag = (e.target && e.target.tagName) || '';
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable;

      // N = new task (tasks page or global FAB)
      if (!typing && (e.key === 'n' || e.key === 'N') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const addBtn = document.getElementById('btn-add-task') || document.getElementById('fab-add-task');
        if (addBtn) {
          e.preventDefault();
          addBtn.click();
        }
      }

      // / = focus search
      if (!typing && e.key === '/' && document.getElementById('task-search')) {
        e.preventDefault();
        document.getElementById('task-search').focus();
      }

      // Ctrl/Cmd + K = search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const search = document.getElementById('task-search');
        if (search) {
          e.preventDefault();
          search.focus();
        }
      }
    });
  }

  function initFab() {
    const fab = document.getElementById('fab-add-task');
    if (!fab) return;
    fab.addEventListener('click', () => {
      if (window.TasksPage && typeof TasksPage.openForm === 'function') {
        TasksPage.openForm();
      } else {
        location.href = 'index.html?add=1';
      }
    });
  }

  function init() {
    // Guard protected pages (login/register handle their own redirect)
    if (typeof Auth !== 'undefined') {
      const path = (location.pathname.split('/').pop() || '').toLowerCase();
      const publicPages = ['login.html', 'register.html'];
      if (!publicPages.includes(path)) {
        if (!Auth.requireAuth()) return;
      }
    }

    if (typeof Storage !== 'undefined' && Auth?.isAuthenticated?.()) {
      Storage.seedIfNeeded();
    }

    Theme.init();
    bindModalDismiss();
    renderNavUser();
    initReveal();
    initKeyboardShortcuts();
    initFab();
    refreshIcons();
    hideLoader();

    window.addEventListener('load', () => refreshIcons());
  }

  return {
    toast,
    confirm,
    openModal,
    closeModal,
    refreshIcons,
    animateCounter,
    initReveal,
    hideLoader,
    renderNavUser,
    getInitials,
    escapeHtml,
    formatDate,
    formatRelative,
    priorityLabel,
    startClock,
    getGreeting,
    init,
  };
})();

window.App = App;

document.addEventListener('DOMContentLoaded', () => App.init());

/**
 * Task management page (index.html)
 */
const TasksPage = (() => {
  let editId = null;
  let filters = {
    search: '',
    priority: 'all',
    status: 'all',
    category: 'all',
    sort: 'dueDate',
  };

  function getFiltered() {
    let tasks = Storage.getTasks();

    if (filters.search) {
      const q = filters.search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (t.category || '').toLowerCase().includes(q)
      );
    }

    if (filters.priority !== 'all') {
      tasks = tasks.filter((t) => t.priority === filters.priority);
    }

    if (filters.status === 'completed') {
      tasks = tasks.filter((t) => t.completed);
    } else if (filters.status === 'pending') {
      tasks = tasks.filter((t) => !t.completed);
    }

    if (filters.category !== 'all') {
      tasks = tasks.filter((t) => t.category === filters.category);
    }

    const order = { high: 0, medium: 1, low: 2 };

    tasks.sort((a, b) => {
      switch (filters.sort) {
        case 'priority':
          return (order[a.priority] ?? 9) - (order[b.priority] ?? 9);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'dueDate':
        default: {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          return a.dueDate.localeCompare(b.dueDate);
        }
      }
    });

    return tasks;
  }

  function renderCategories() {
    const select = document.getElementById('filter-category');
    const formSelect = document.getElementById('task-category');
    if (!select) return;

    const cats = [...new Set(Storage.getTasks().map((t) => t.category))].sort();
    const defaults = ['Work', 'Personal', 'Health', 'Learning', 'Design'];
    const all = [...new Set([...defaults, ...cats])].sort();

    const current = select.value || 'all';
    select.innerHTML =
      '<option value="all">All categories</option>' +
      all.map((c) => `<option value="${App.escapeHtml(c)}">${App.escapeHtml(c)}</option>`).join('');
    select.value = current;

    if (formSelect && formSelect.tagName === 'SELECT') {
      const val = formSelect.value;
      formSelect.innerHTML = all
        .map((c) => `<option value="${App.escapeHtml(c)}">${App.escapeHtml(c)}</option>`)
        .join('');
      if (val) formSelect.value = val;
    }
  }

  function renderList() {
    const list = document.getElementById('task-list');
    const empty = document.getElementById('tasks-empty');
    const countEl = document.getElementById('task-count');
    if (!list) return;

    const tasks = getFiltered();
    if (countEl) {
      countEl.textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'}`;
    }

    if (!tasks.length) {
      list.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }

    if (empty) empty.classList.add('hidden');

    list.innerHTML = tasks
      .map(
        (t) => `
      <article class="task-item ${t.completed ? 'completed' : ''}" data-id="${t.id}" draggable="true">
        <button class="task-check ${t.completed ? 'checked' : ''}" data-action="toggle" aria-label="Toggle complete">
          <i data-lucide="check"></i>
        </button>
        <div class="task-body">
          <h3 class="task-title">${App.escapeHtml(t.title)}</h3>
          <div class="task-meta">
            <span class="badge priority-${t.priority}">${App.priorityLabel(t.priority)}</span>
            <span class="badge badge-gray">${App.escapeHtml(t.category)}</span>
            <span>${App.formatRelative(t.dueDate)}</span>
            ${t.notes ? `<span class="task-notes-hint" data-tooltip="${App.escapeHtml(t.notes)}"><i data-lucide="sticky-note"></i></span>` : ''}
          </div>
          ${t.description ? `<p class="task-desc">${App.escapeHtml(t.description)}</p>` : ''}
        </div>
        <div class="task-actions">
          <button class="btn-icon btn-sm" data-action="edit" data-tooltip="Edit" aria-label="Edit">
            <i data-lucide="pencil"></i>
          </button>
          <button class="btn-icon btn-sm" data-action="delete" data-tooltip="Delete" aria-label="Delete">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </article>
    `
      )
      .join('');

    App.refreshIcons(list);
    bindDragDrop();
  }

  function openForm(task = null) {
    editId = task ? task.id : null;
    const title = document.getElementById('modal-task-title');
    const form = document.getElementById('task-form');

    if (title) title.textContent = task ? 'Edit task' : 'Add task';
    if (!form) return;

    form.reset();
    document.getElementById('task-title').value = task?.title || '';
    document.getElementById('task-description').value = task?.description || '';
    const notesEl = document.getElementById('task-notes');
    if (notesEl) notesEl.value = task?.notes || '';
    document.getElementById('task-priority').value = task?.priority || 'medium';
    document.getElementById('task-due').value = task?.dueDate || Storage.todayISO();

    renderCategories();
    document.getElementById('task-category').value = task?.category || 'Work';

    App.openModal('task-modal');
    setTimeout(() => document.getElementById('task-title')?.focus(), 100);
  }

  async function handleDelete(id) {
    const ok = await App.confirm({
      title: 'Delete task?',
      message: 'This task will be permanently removed from your log.',
      confirmText: 'Delete',
    });
    if (!ok) return;
    Storage.deleteTask(id);
    renderList();
    renderCategories();
    App.toast('Task deleted successfully.', 'success');
  }

  function bindDragDrop() {
    const list = document.getElementById('task-list');
    if (!list) return;

    let dragId = null;

    list.querySelectorAll('.task-item').forEach((item) => {
      item.addEventListener('dragstart', () => {
        dragId = item.dataset.id;
        item.classList.add('is-dragging');
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('is-dragging');
        dragId = null;
      });
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        item.classList.add('drag-over');
      });
      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over');
      });
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');
        const targetId = item.dataset.id;
        if (!dragId || dragId === targetId) return;

        const tasks = Storage.getTasks();
        const from = tasks.findIndex((t) => t.id === dragId);
        const to = tasks.findIndex((t) => t.id === targetId);
        if (from < 0 || to < 0) return;

        const [moved] = tasks.splice(from, 1);
        tasks.splice(to, 0, moved);
        Storage.saveTasks(tasks);
        renderList();
      });
    });
  }

  function bindEvents() {
    document.getElementById('btn-add-task')?.addEventListener('click', () => openForm());
    document.getElementById('btn-empty-add')?.addEventListener('click', () => openForm());
    document.getElementById('fab-add-task')?.addEventListener('click', () => openForm());

    document.getElementById('task-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-description').value,
        notes: document.getElementById('task-notes')?.value || '',
        priority: document.getElementById('task-priority').value,
        category: document.getElementById('task-category').value,
        dueDate: document.getElementById('task-due').value,
      };

      if (!data.title.trim()) {
        App.toast('Please enter a task title.', 'error');
        return;
      }

      if (editId) {
        Storage.updateTask(editId, data);
        App.toast('Task updated.', 'success');
      } else {
        Storage.addTask(data);
        App.toast('Task added to your log.', 'success');
      }

      App.closeModal('task-modal');
      renderList();
      renderCategories();
    });

    document.getElementById('task-list')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const item = btn.closest('[data-id]');
      const id = item?.dataset.id;
      if (!id) return;

      const action = btn.dataset.action;
      if (action === 'toggle') {
        Storage.toggleTask(id);
        renderList();
        App.toast('Task status updated.', 'info');
      } else if (action === 'edit') {
        openForm(Storage.getTaskById(id));
      } else if (action === 'delete') {
        await handleDelete(id);
      }
    });

    const search = document.getElementById('task-search');
    search?.addEventListener('input', () => {
      filters.search = search.value.trim();
      renderList();
    });

    ['filter-priority', 'filter-status', 'filter-category', 'filter-sort'].forEach((fid) => {
      document.getElementById(fid)?.addEventListener('change', (e) => {
        const map = {
          'filter-priority': 'priority',
          'filter-status': 'status',
          'filter-category': 'category',
          'filter-sort': 'sort',
        };
        filters[map[fid]] = e.target.value;
        renderList();
      });
    });

    document.querySelectorAll('[data-status-chip]').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('[data-status-chip]').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        filters.status = chip.dataset.statusChip;
        const sel = document.getElementById('filter-status');
        if (sel) sel.value = filters.status;
        renderList();
      });
    });
  }

  function init() {
    if (!document.getElementById('tasks-root')) return;
    renderCategories();
    renderList();
    bindEvents();
    Storage.onChange(() => {
      renderList();
      renderCategories();
    });

    if (new URLSearchParams(location.search).get('add') === '1') {
      openForm();
    }
  }

  return { init, renderList, openForm };
})();

window.TasksPage = TasksPage;
document.addEventListener('DOMContentLoaded', () => TasksPage.init());

/**
 * Profile page (profile.html)
 */
const ProfilePage = (() => {
  function fillForm() {
    const p = Storage.getProfile();
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    set('profile-name', p.name);
    set('profile-email', p.email);
    set('profile-role', p.role);
    set('profile-bio', p.bio);

    document.querySelectorAll('[data-profile-name]').forEach((el) => {
      el.textContent = p.name;
    });
    document.querySelectorAll('[data-profile-role]').forEach((el) => {
      el.textContent = p.role;
    });
    document.querySelectorAll('[data-profile-email]').forEach((el) => {
      el.textContent = p.email;
    });
    document.querySelectorAll('[data-profile-initials]').forEach((el) => {
      el.textContent = App.getInitials(p.name);
    });

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.checked = Theme.isDark();

    const notifToggle = document.getElementById('notif-toggle');
    if (notifToggle) notifToggle.checked = !!Storage.getSettings().notifications;
  }

  function bind() {
    document.getElementById('profile-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      Storage.saveProfile({
        name: document.getElementById('profile-name').value.trim(),
        email: document.getElementById('profile-email').value.trim(),
        role: document.getElementById('profile-role').value.trim(),
        bio: document.getElementById('profile-bio').value.trim(),
      });
      fillForm();
      App.renderNavUser();
      App.toast('Profile saved.', 'success');
    });

    document.getElementById('theme-toggle')?.addEventListener('change', (e) => {
      Theme.apply(e.target.checked ? 'dark' : 'light');
      App.toast(e.target.checked ? 'Dark mode on' : 'Light mode on', 'info');
    });

    document.getElementById('notif-toggle')?.addEventListener('change', (e) => {
      Storage.saveSettings({ notifications: e.target.checked });
      App.toast(
        e.target.checked ? 'Notifications enabled' : 'Notifications disabled',
        'info'
      );
    });

    document.getElementById('btn-logout')?.addEventListener('click', async () => {
      const ok = await App.confirm({
        title: 'Sign out?',
        message: 'You will need to log in again to access your tasks.',
        confirmText: 'Sign out',
        danger: false,
      });
      if (!ok) return;
      Auth.logout();
      App.toast('Signed out successfully.', 'info');
      location.href = 'login.html';
    });

    document.getElementById('btn-clear-data')?.addEventListener('click', async () => {
      const ok = await App.confirm({
        title: 'Reset all data?',
        message: 'This clears your tasks and profile for this account and restores sample content.',
        confirmText: 'Reset',
      });
      if (!ok) return;
      Storage.clearUserData();
      Storage.seedIfNeeded();
      fillForm();
      App.renderNavUser();
      App.toast('Data reset to defaults.', 'success');
    });
  }

  function init() {
    if (!document.getElementById('profile-root')) return;
    fillForm();
    bind();
  }

  return { init };
})();

window.ProfilePage = ProfilePage;
document.addEventListener('DOMContentLoaded', () => ProfilePage.init());
