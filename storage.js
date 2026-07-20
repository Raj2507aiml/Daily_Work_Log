/**
 * Daily Work Log — LocalStorage layer
 * Per-user tasks/profile/settings + change events for live UI updates.
 */

const Storage = (() => {
  const BASE_KEYS = {
    TASKS: 'dwl_tasks',
    PROFILE: 'dwl_profile',
    SETTINGS: 'dwl_settings',
    SEEDED: 'dwl_seeded',
  };

  const DEFAULT_SETTINGS = {
    theme: 'dark',
    notifications: true,
    weekStartsOn: 0,
  };

  const listeners = new Set();

  /** Scope keys to the logged-in user so each account has isolated data. */
  function key(base) {
    const uid =
      (typeof Auth !== 'undefined' && Auth.getCurrentUserId && Auth.getCurrentUserId()) ||
      null;
    return uid ? `${base}__${uid}` : base;
  }

  function read(storageKey, fallback) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function write(storageKey, value) {
    localStorage.setItem(storageKey, JSON.stringify(value));
  }

  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function dateOffset(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function uid() {
    return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function createdDateISO(task) {
    if (!task?.createdAt) return task?.dueDate || todayISO();
    return task.createdAt.slice(0, 10);
  }

  /** Subscribe to task/data changes (dashboard live updates). */
  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function emit(type = 'tasks:changed', detail = {}) {
    listeners.forEach((fn) => {
      try {
        fn({ type, ...detail });
      } catch (_) {
        /* ignore subscriber errors */
      }
    });
    document.dispatchEvent(new CustomEvent('dwl:change', { detail: { type, ...detail } }));
  }

  function defaultProfileFromUser() {
    const user = typeof Auth !== 'undefined' && Auth.getCurrentUser ? Auth.getCurrentUser() : null;
    return {
      name: user?.name || 'User',
      email: user?.email || '',
      role: user?.role || 'Member',
      bio: user?.bio || 'Building better habits, one task at a time.',
      avatar: '',
    };
  }

  function seedIfNeeded() {
    if (read(key(BASE_KEYS.SEEDED), false)) return;
    if (!Auth?.getCurrentUserId?.()) return;

    const sample = [
      {
        id: uid(),
        title: 'Review sprint backlog',
        description: 'Prioritize tickets for the upcoming sprint.',
        notes: 'Focus on P0 blockers first.',
        priority: 'high',
        category: 'Work',
        dueDate: todayISO(),
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uid(),
        title: 'Design system tokens audit',
        description: 'Align spacing and color tokens.',
        notes: '',
        priority: 'medium',
        category: 'Design',
        dueDate: todayISO(),
        completed: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uid(),
        title: 'Ship landing page polish',
        description: 'Micro-interactions and responsive QA.',
        notes: 'Check mobile nav last.',
        priority: 'high',
        category: 'Work',
        dueDate: dateOffset(1),
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uid(),
        title: 'Morning workout',
        description: '45-minute strength session.',
        notes: '',
        priority: 'low',
        category: 'Health',
        dueDate: todayISO(),
        completed: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uid(),
        title: 'Read system design chapter',
        description: 'Finish caching strategies section.',
        notes: 'Take notes in Notion.',
        priority: 'medium',
        category: 'Learning',
        dueDate: dateOffset(2),
        completed: false,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: uid(),
        title: 'Team standup notes',
        description: 'Capture action items.',
        notes: '',
        priority: 'low',
        category: 'Work',
        dueDate: dateOffset(-1),
        completed: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: uid(),
        title: 'Update portfolio case study',
        description: 'Add metrics from the latest project.',
        notes: '',
        priority: 'medium',
        category: 'Personal',
        dueDate: dateOffset(3),
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uid(),
        title: 'Refactor storage module',
        description: 'Add validation and clearer boundaries.',
        notes: 'Covered in PR review.',
        priority: 'high',
        category: 'Work',
        dueDate: dateOffset(-2),
        completed: true,
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ];

    write(key(BASE_KEYS.TASKS), sample);
    write(key(BASE_KEYS.PROFILE), defaultProfileFromUser());
    write(key(BASE_KEYS.SETTINGS), DEFAULT_SETTINGS);
    write(key(BASE_KEYS.SEEDED), true);
  }

  /* ---- Tasks ---- */

  function getTasks() {
    seedIfNeeded();
    return read(key(BASE_KEYS.TASKS), []);
  }

  function saveTasks(tasks, action = 'save') {
    write(key(BASE_KEYS.TASKS), tasks);
    emit('tasks:changed', { action });
  }

  function getTaskById(id) {
    return getTasks().find((t) => t.id === id) || null;
  }

  function addTask(data) {
    const tasks = getTasks();
    const now = new Date().toISOString();
    const task = {
      id: uid(),
      title: data.title.trim(),
      description: (data.description || '').trim(),
      notes: (data.notes || '').trim(),
      priority: data.priority || 'medium',
      category: data.category || 'Work',
      dueDate: data.dueDate || todayISO(),
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    tasks.unshift(task);
    saveTasks(tasks, 'add');
    return task;
  }

  function updateTask(id, patch, action = 'edit') {
    const tasks = getTasks();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    const prev = tasks[idx];
    tasks[idx] = {
      ...prev,
      ...patch,
      title: patch.title !== undefined ? String(patch.title).trim() : prev.title,
      description:
        patch.description !== undefined ? String(patch.description).trim() : prev.description,
      notes: patch.notes !== undefined ? String(patch.notes).trim() : prev.notes || '',
      updatedAt: new Date().toISOString(),
    };

    if (patch.completed !== undefined && patch.completed !== prev.completed) {
      action = patch.completed ? 'complete' : 'restore';
    }

    saveTasks(tasks, action);
    return tasks[idx];
  }

  function deleteTask(id) {
    const tasks = getTasks().filter((t) => t.id !== id);
    saveTasks(tasks, 'delete');
    return true;
  }

  function toggleTask(id) {
    const task = getTaskById(id);
    if (!task) return null;
    return updateTask(id, { completed: !task.completed });
  }

  /* ---- Profile & settings ---- */

  function getProfile() {
    seedIfNeeded();
    const stored = read(key(BASE_KEYS.PROFILE), {});
    const fromUser = defaultProfileFromUser();
    return { ...fromUser, ...stored, email: fromUser.email || stored.email };
  }

  function saveProfile(profile) {
    const next = { ...getProfile(), ...profile };
    write(key(BASE_KEYS.PROFILE), next);
    if (typeof Auth !== 'undefined' && Auth.updateCurrentUserProfile) {
      Auth.updateCurrentUserProfile({
        name: next.name,
        role: next.role,
        bio: next.bio,
      });
    }
    emit('profile:changed', { action: 'profile' });
    return getProfile();
  }

  function getSettings() {
    seedIfNeeded();
    return { ...DEFAULT_SETTINGS, ...read(key(BASE_KEYS.SETTINGS), {}) };
  }

  function saveSettings(settings) {
    write(key(BASE_KEYS.SETTINGS), { ...getSettings(), ...settings });
    return getSettings();
  }

  /* ---- Analytics helpers ---- */

  function getTasksByDate(dateStr) {
    return getTasks().filter((t) => t.dueDate === dateStr);
  }

  function getTasksInRange(startISO, endISO) {
    return getTasks().filter((t) => t.dueDate >= startISO && t.dueDate <= endISO);
  }

  function getProductivityScore() {
    const tasks = getTasks();
    if (!tasks.length) return 0;

    const today = todayISO();
    const todayTasks = tasks.filter((t) => t.dueDate === today);
    const todayDone = todayTasks.filter((t) => t.completed).length;
    const todayRate = todayTasks.length ? todayDone / todayTasks.length : 0.5;

    const completed = tasks.filter((t) => t.completed).length;
    const overallRate = completed / tasks.length;

    const overdue = tasks.filter((t) => !t.completed && t.dueDate < today).length;
    const overduePenalty = Math.min(overdue * 5, 25);

    const score = Math.round(todayRate * 55 + overallRate * 45 - overduePenalty);
    return Math.max(0, Math.min(100, score));
  }

  function getStreak() {
    const tasks = getTasks().filter((t) => t.completed);
    if (!tasks.length) return 0;

    const doneDates = new Set(tasks.map((t) => t.dueDate));
    let streak = 0;
    const cursor = new Date();

    if (!doneDates.has(todayISO())) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (true) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, '0');
      const d = String(cursor.getDate()).padStart(2, '0');
      const iso = `${y}-${m}-${d}`;
      if (doneDates.has(iso)) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /** Longest consecutive-day completion streak across all history. */
  function getLongestStreak() {
    const doneDates = [
      ...new Set(getTasks().filter((t) => t.completed).map((t) => t.dueDate)),
    ].sort();

    if (!doneDates.length) return 0;

    let longest = 1;
    let current = 1;

    for (let i = 1; i < doneDates.length; i++) {
      const prev = new Date(doneDates[i - 1] + 'T12:00:00');
      const curr = new Date(doneDates[i] + 'T12:00:00');
      const diff = Math.round((curr - prev) / 86400000);
      if (diff === 1) {
        current += 1;
        longest = Math.max(longest, current);
      } else if (diff > 1) {
        current = 1;
      }
    }

    return longest;
  }

  /** All dashboard metrics derived from stored tasks (no hardcoded values). */
  function getDashboardStats() {
    const tasks = getTasks();
    const today = todayISO();
    const todayTasks = tasks.filter((t) => t.dueDate === today);
    const completedToday = todayTasks.filter((t) => t.completed).length;
    const pendingToday = todayTasks.filter((t) => !t.completed).length;
    const completedOverall = tasks.filter((t) => t.completed).length;
    const pendingOverall = tasks.filter((t) => !t.completed).length;

    return {
      todayTasks: todayTasks.length,
      completedToday,
      pendingToday,
      totalTasks: tasks.length,
      completedOverall,
      pendingOverall,
      productivityScore: getProductivityScore(),
      currentStreak: getStreak(),
      longestStreak: getLongestStreak(),
    };
  }

  /**
   * Last 7 days overview: created, completed, productivity %.
   * Created = tasks whose createdAt falls on that day.
   * Completed = tasks due that day and marked complete (or completed that day via dueDate).
   */
  function getWeeklyOverview(days = 7) {
    const tasks = getTasks();
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = dateOffset(-i);
      const created = tasks.filter((t) => createdDateISO(t) === date).length;
      const dueThatDay = tasks.filter((t) => t.dueDate === date);
      const completed = dueThatDay.filter((t) => t.completed).length;
      const totalDue = dueThatDay.length;
      const productivity = totalDue ? Math.round((completed / totalDue) * 100) : created ? 0 : 0;

      result.push({
        date,
        label: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
        created,
        completed,
        total: totalDue,
        productivity,
        isToday: date === todayISO(),
      });
    }

    return result;
  }

  function getWeeklyCompletions(days = 7) {
    return getWeeklyOverview(days).map((d) => ({
      date: d.date,
      label: d.label,
      total: d.total,
      completed: d.completed,
      isToday: d.isToday,
    }));
  }

  function getMonthlyProductivity() {
    const tasks = getTasks();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const weeks = [0, 0, 0, 0, 0];
    const weeksTotal = [0, 0, 0, 0, 0];

    tasks.forEach((t) => {
      const d = new Date(t.dueDate + 'T12:00:00');
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const weekIdx = Math.min(4, Math.floor((d.getDate() - 1) / 7));
      weeksTotal[weekIdx] += 1;
      if (t.completed) weeks[weekIdx] += 1;
    });

    return weeks.map((done, i) => ({
      label: `W${i + 1}`,
      completed: done,
      total: weeksTotal[i],
      productivity: weeksTotal[i] ? Math.round((done / weeksTotal[i]) * 100) : 0,
    }));
  }

  function getCategoryBreakdown() {
    const tasks = getTasks();
    const map = {};
    tasks.forEach((t) => {
      map[t.category] = map[t.category] || { total: 0, completed: 0 };
      map[t.category].total += 1;
      if (t.completed) map[t.category].completed += 1;
    });
    return map;
  }

  function clearUserData() {
    Object.values(BASE_KEYS).forEach((base) => {
      localStorage.removeItem(key(base));
    });
    emit('tasks:changed', { action: 'reset' });
  }

  return {
    KEYS: BASE_KEYS,
    todayISO,
    dateOffset,
    getTasks,
    saveTasks,
    getTaskById,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    getProfile,
    saveProfile,
    getSettings,
    saveSettings,
    getTasksByDate,
    getTasksInRange,
    getProductivityScore,
    getStreak,
    getLongestStreak,
    getDashboardStats,
    getWeeklyOverview,
    getWeeklyCompletions,
    getMonthlyProductivity,
    getCategoryBreakdown,
    seedIfNeeded,
    onChange,
    emit,
    clearUserData,
  };
})();

window.Storage = Storage;
