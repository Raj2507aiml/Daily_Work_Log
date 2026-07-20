/**
 * Daily Work Log — Dashboard (fully dynamic + Chart.js weekly overview)
 */

const DashboardPage = (() => {
  let weekChart = null;

  function chartColors() {
    const dark = Theme.isDark();
    return {
      text: dark ? '#a1a1aa' : '#52525b',
      grid: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      blue: '#3b82f6',
      blueSoft: 'rgba(59,130,246,0.35)',
      green: '#22c55e',
      greenSoft: 'rgba(34,197,94,0.35)',
    };
  }

  function renderWelcome() {
    const profile = Storage.getProfile();
    const greeting = App.getGreeting();
    const el = document.getElementById('welcome-greeting');
    const nameEl = document.getElementById('welcome-name');
    if (el) el.textContent = `${greeting},`;
    if (nameEl) nameEl.textContent = (profile.name || 'there').split(' ')[0];
  }

  function renderStats() {
    const s = Storage.getDashboardStats();

    const map = {
      'stat-today': s.todayTasks,
      'stat-today-done': s.completedToday,
      'stat-today-pending': s.pendingToday,
      'stat-total': s.totalTasks,
      'stat-completed': s.completedOverall,
      'stat-pending': s.pendingOverall,
      'stat-streak': s.currentStreak,
      'stat-longest': s.longestStreak,
    };

    Object.entries(map).forEach(([id, value]) => {
      App.animateCounter(document.getElementById(id), value);
    });
  }

  function renderScore() {
    const score = Storage.getDashboardStats().productivityScore;
    const valueEl = document.getElementById('score-value');
    const ring = document.getElementById('score-fill');
    const label = document.getElementById('score-label');

    App.animateCounter(valueEl, score);

    if (ring) {
      const circumference = 2 * Math.PI * 46;
      const offset = circumference - (score / 100) * circumference;
      requestAnimationFrame(() => {
        ring.style.strokeDasharray = String(circumference);
        ring.style.strokeDashoffset = String(offset);
      });
    }

    if (label) {
      if (score >= 80) label.textContent = 'Excellent focus today. Keep the momentum.';
      else if (score >= 55) label.textContent = 'Solid progress. A few more wins will push you higher.';
      else if (score >= 30) label.textContent = 'Getting started. Clear one priority task next.';
      else label.textContent = 'Room to grow — pick one task and finish it.';
    }
  }

  function renderWeekChart() {
    const canvas = document.getElementById('week-chart');
    if (!canvas || typeof Chart === 'undefined') {
      renderWeekFallback();
      return;
    }

    const week = Storage.getWeeklyOverview(7);
    const colors = chartColors();
    const labels = week.map((d) => d.label);
    const created = week.map((d) => d.created);
    const completed = week.map((d) => d.completed);
    const productivity = week.map((d) => d.productivity);

    const legendEl = document.getElementById('week-legend');
    if (legendEl) {
      const avg =
        productivity.length &&
        Math.round(productivity.reduce((a, b) => a + b, 0) / productivity.length);
      legendEl.textContent = `Avg productivity ${avg || 0}% · last 7 days`;
    }

    if (weekChart) weekChart.destroy();

    weekChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Created',
            data: created,
            backgroundColor: colors.blueSoft,
            borderColor: colors.blue,
            borderWidth: 1,
            borderRadius: 8,
            barPercentage: 0.7,
          },
          {
            label: 'Completed',
            data: completed,
            backgroundColor: colors.greenSoft,
            borderColor: colors.green,
            borderWidth: 1,
            borderRadius: 8,
            barPercentage: 0.7,
          },
          {
            type: 'line',
            label: 'Productivity %',
            data: productivity,
            yAxisID: 'y1',
            borderColor: colors.blue,
            backgroundColor: 'transparent',
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: colors.blue,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 700 },
        plugins: {
          legend: {
            labels: { color: colors.text, boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 11 } },
          },
          tooltip: {
            callbacks: {
              afterBody(items) {
                const i = items[0]?.dataIndex;
                if (i == null) return '';
                return `Productivity: ${productivity[i]}%`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.text },
          },
          y: {
            beginAtZero: true,
            ticks: { color: colors.text, precision: 0 },
            grid: { color: colors.grid },
          },
          y1: {
            position: 'right',
            min: 0,
            max: 100,
            ticks: { color: colors.text, callback: (v) => `${v}%` },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  }

  function renderWeekFallback() {
    const container = document.getElementById('week-bars');
    if (!container) return;
    const week = Storage.getWeeklyOverview(7);
    const max = Math.max(1, ...week.map((d) => Math.max(d.created, d.completed)));
    container.innerHTML = week
      .map((d) => {
        const h = Math.round((d.completed / max) * 100);
        return `
          <div class="week-bar-col ${d.isToday ? 'today' : ''}" data-tooltip="${d.created} created · ${d.completed} done · ${d.productivity}%">
            <div class="week-bar-track">
              <div class="week-bar-fill" data-height="${Math.max(h, d.completed ? 8 : 0)}%"></div>
            </div>
            <span class="week-bar-label">${d.label}</span>
          </div>
        `;
      })
      .join('');
    requestAnimationFrame(() => {
      container.querySelectorAll('.week-bar-fill').forEach((bar) => {
        bar.style.height = bar.dataset.height;
      });
    });
  }

  function renderTodayTasks() {
    const list = document.getElementById('today-task-list');
    const empty = document.getElementById('today-empty');
    if (!list) return;

    const tasks = Storage.getTasksByDate(Storage.todayISO()).slice(0, 6);

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

    list.onclick = (e) => {
      const btn = e.target.closest('[data-action="toggle"]');
      if (!btn) return;
      const id = btn.closest('[data-id]')?.dataset.id;
      if (!id) return;
      Storage.toggleTask(id);
      App.toast('Task updated.', 'success');
    };
  }

  function refreshAll() {
    renderWelcome();
    renderStats();
    renderScore();
    renderWeekChart();
    renderTodayTasks();
  }

  function init() {
    if (!document.getElementById('dashboard-root')) return;

    refreshAll();
    App.startClock('#live-clock', '#live-date');

    // Live updates when tasks change (same tab)
    Storage.onChange(() => refreshAll());
    document.addEventListener('dwl:change', () => refreshAll());
    document.addEventListener('themechange', () => renderWeekChart());
  }

  return { init, refreshAll };
})();

document.addEventListener('DOMContentLoaded', () => DashboardPage.init());
