/**
 * Daily Work Log — Calendar view
 */

const CalendarPage = (() => {
  let viewDate = new Date();
  let selected = Storage.todayISO();

  function ymd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function renderHeader() {
    const el = document.getElementById('cal-month-label');
    if (!el) return;
    el.textContent = viewDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  function tasksForDay(iso) {
    return Storage.getTasksByDate(iso);
  }

  function renderGrid() {
    const grid = document.getElementById('cal-grid');
    if (!grid) return;

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const first = new Date(year, month, 1);
    const startPad = first.getDay(); // Sunday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = Storage.todayISO();

    const cells = [];

    for (let i = 0; i < startPad; i++) {
      cells.push('<button class="cal-day empty" type="button" tabindex="-1"></button>');
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const iso = ymd(new Date(year, month, day));
      const dayTasks = tasksForDay(iso);
      const classes = ['cal-day'];
      if (iso === today) classes.push('today');
      if (iso === selected) classes.push('selected');

      let dots = '';
      if (dayTasks.length) {
        const hasHigh = dayTasks.some((t) => !t.completed && t.priority === 'high');
        const allDone = dayTasks.every((t) => t.completed);
        const shown = dayTasks.slice(0, 3);
        dots = `<div class="cal-dots">${shown
          .map((t) => {
            let cls = '';
            if (t.completed) cls = 'done';
            else if (t.priority === 'high') cls = 'high';
            return `<span class="${cls}"></span>`;
          })
          .join('')}</div>`;
        if (allDone) classes.push('all-done');
        if (hasHigh) classes.push('has-high');
      }

      cells.push(`
        <button type="button" class="${classes.join(' ')}" data-date="${iso}" aria-label="${iso}">
          <span>${day}</span>
          ${dots}
        </button>
      `);
    }

    grid.innerHTML = cells.join('');
  }

  function renderDayPanel() {
    const title = document.getElementById('day-panel-title');
    const sub = document.getElementById('day-panel-sub');
    const list = document.getElementById('day-task-list');
    const empty = document.getElementById('day-empty');
    if (!list) return;

    const d = new Date(selected + 'T12:00:00');
    if (title) {
      title.textContent = d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    }

    const tasks = tasksForDay(selected);
    if (sub) {
      sub.textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'} · ${tasks.filter((t) => t.completed).length} completed`;
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
      <article class="task-item ${t.completed ? 'completed' : ''}" data-id="${t.id}">
        <button class="task-check ${t.completed ? 'checked' : ''}" data-action="toggle" aria-label="Toggle">
          <i data-lucide="check"></i>
        </button>
        <div class="task-body">
          <h3 class="task-title">${App.escapeHtml(t.title)}</h3>
          <div class="task-meta">
            <span class="badge priority-${t.priority}">${App.priorityLabel(t.priority)}</span>
            <span class="badge badge-gray">${App.escapeHtml(t.category)}</span>
          </div>
        </div>
      </article>
    `
      )
      .join('');

    App.refreshIcons(list);
  }

  function bind() {
    document.getElementById('cal-prev')?.addEventListener('click', () => {
      viewDate.setMonth(viewDate.getMonth() - 1);
      render();
    });

    document.getElementById('cal-next')?.addEventListener('click', () => {
      viewDate.setMonth(viewDate.getMonth() + 1);
      render();
    });

    document.getElementById('cal-today')?.addEventListener('click', () => {
      viewDate = new Date();
      selected = Storage.todayISO();
      render();
    });

    document.getElementById('cal-grid')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-date]');
      if (!btn) return;
      selected = btn.dataset.date;
      render();
    });

    document.getElementById('day-task-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="toggle"]');
      if (!btn) return;
      const id = btn.closest('[data-id]')?.dataset.id;
      if (!id) return;
      Storage.toggleTask(id);
      render();
      App.toast('Task updated.', 'success');
    });
  }

  function render() {
    renderHeader();
    renderGrid();
    renderDayPanel();
  }

  function init() {
    if (!document.getElementById('calendar-root')) return;
    bind();
    render();
    Storage.onChange(() => render());
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => CalendarPage.init());
