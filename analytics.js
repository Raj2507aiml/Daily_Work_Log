/**
 * Daily Work Log — Analytics with Chart.js (live updates)
 */

const AnalyticsPage = (() => {
  const charts = {};

  function colors() {
    const dark = Theme.isDark();
    return {
      text: dark ? '#a1a1aa' : '#52525b',
      grid: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      blue: '#3b82f6',
      blueSoft: 'rgba(59,130,246,0.45)',
      green: '#22c55e',
      amber: '#f59e0b',
      sky: '#38bdf8',
      slate: '#94a3b8',
    };
  }

  function destroy(name) {
    if (charts[name]) {
      charts[name].destroy();
      charts[name] = null;
    }
  }

  function renderSummary() {
    const tasks = Storage.getTasks();
    const completed = tasks.filter((t) => t.completed).length;
    const pending = tasks.filter((t) => !t.completed).length;
    const rate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    const streak = Storage.getStreak();
    const score = Storage.getProductivityScore();

    App.animateCounter(document.getElementById('an-completed'), completed);
    App.animateCounter(document.getElementById('an-pending'), pending);
    App.animateCounter(document.getElementById('an-rate'), rate);
    App.animateCounter(document.getElementById('an-streak'), streak);
    App.animateCounter(document.getElementById('an-score'), score);

    const rateBar = document.getElementById('rate-bar');
    if (rateBar) {
      requestAnimationFrame(() => {
        rateBar.style.width = `${rate}%`;
      });
    }

    const streakEl = document.getElementById('streak-text');
    if (streakEl) {
      const longest = Storage.getLongestStreak();
      streakEl.textContent =
        streak === 0
          ? 'Complete a task today to start a streak'
          : `${streak}-day streak · best ${longest}`;
    }
  }

  function renderStatusChart() {
    const el = document.getElementById('chart-status');
    if (!el || typeof Chart === 'undefined') return;

    const tasks = Storage.getTasks();
    const completed = tasks.filter((t) => t.completed).length;
    const pending = tasks.filter((t) => !t.completed).length;
    const c = colors();

    destroy('status');
    charts.status = new Chart(el, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Pending'],
        datasets: [
          {
            data: [completed, pending],
            backgroundColor: [c.green, c.amber],
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: c.text, boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 12 } },
          },
        },
      },
    });
  }

  function renderWeeklyChart() {
    const el = document.getElementById('chart-weekly');
    if (!el || typeof Chart === 'undefined') return;

    const week = Storage.getWeeklyOverview(7);
    const c = colors();

    destroy('weekly');
    charts.weekly = new Chart(el, {
      type: 'bar',
      data: {
        labels: week.map((d) => d.label),
        datasets: [
          {
            label: 'Completed',
            data: week.map((d) => d.completed),
            backgroundColor: c.blueSoft,
            borderColor: c.blue,
            borderWidth: 1,
            borderRadius: 8,
          },
          {
            type: 'line',
            label: 'Productivity %',
            data: week.map((d) => d.productivity),
            yAxisID: 'y1',
            borderColor: c.sky,
            tension: 0.35,
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: c.text }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { color: c.text, precision: 0 }, grid: { color: c.grid } },
          y1: {
            position: 'right',
            min: 0,
            max: 100,
            ticks: { color: c.text, callback: (v) => `${v}%` },
            grid: { drawOnChartArea: false },
          },
        },
        plugins: {
          legend: { labels: { color: c.text, boxWidth: 12 } },
        },
      },
    });
  }

  function renderMonthlyChart() {
    const el = document.getElementById('chart-monthly');
    if (!el || typeof Chart === 'undefined') return;

    const month = Storage.getMonthlyProductivity();
    const c = colors();
    const label = document.getElementById('month-progress-label');
    if (label) {
      label.textContent = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    destroy('monthly');
    charts.monthly = new Chart(el, {
      type: 'line',
      data: {
        labels: month.map((d) => d.label),
        datasets: [
          {
            label: 'Completed',
            data: month.map((d) => d.completed),
            borderColor: c.blue,
            backgroundColor: c.blueSoft,
            fill: true,
            tension: 0.35,
          },
          {
            label: 'Productivity %',
            data: month.map((d) => d.productivity),
            borderColor: c.green,
            tension: 0.35,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: c.text }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { color: c.text, precision: 0 }, grid: { color: c.grid } },
          y1: {
            position: 'right',
            min: 0,
            max: 100,
            ticks: { color: c.text, callback: (v) => `${v}%` },
            grid: { drawOnChartArea: false },
          },
        },
        plugins: { legend: { labels: { color: c.text, boxWidth: 12 } } },
      },
    });
  }

  function renderCategoryChart() {
    const el = document.getElementById('chart-category');
    if (!el || typeof Chart === 'undefined') return;

    const breakdown = Storage.getCategoryBreakdown();
    const entries = Object.entries(breakdown).sort((a, b) => b[1].total - a[1].total);
    const c = colors();
    const palette = [c.blue, c.sky, c.green, c.amber, c.slate, '#0ea5e9'];

    destroy('category');
    charts.category = new Chart(el, {
      type: 'doughnut',
      data: {
        labels: entries.map(([name]) => name),
        datasets: [
          {
            data: entries.map(([, d]) => d.total),
            backgroundColor: entries.map((_, i) => palette[i % palette.length]),
            borderWidth: 0,
          },
        ],
      },
      options: {
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: c.text, boxWidth: 12, font: { size: 11 } },
          },
        },
      },
    });

    // Keep metric list in sync
    const list = document.getElementById('category-metrics');
    if (list) {
      list.innerHTML = entries
        .map(([name, data], i) => {
          const pct = data.total ? Math.round((data.completed / data.total) * 100) : 0;
          return `
            <div class="metric-row">
              <span class="metric-label-row">
                <span class="legend-dot" data-color="${palette[i % palette.length]}"></span>
                ${App.escapeHtml(name)}
              </span>
              <strong>${data.completed}/${data.total} · ${pct}%</strong>
            </div>
          `;
        })
        .join('') || '<p class="text-muted">No category data yet.</p>';

      list.querySelectorAll('.legend-dot[data-color]').forEach((dot) => {
        dot.style.background = dot.dataset.color;
      });
    }
  }

  function renderPrioritySplit() {
    const tasks = Storage.getTasks();
    const el = document.getElementById('priority-metrics');
    if (!el) return;

    el.innerHTML = ['high', 'medium', 'low']
      .map((p) => {
        const subset = tasks.filter((t) => t.priority === p);
        const done = subset.filter((t) => t.completed).length;
        return `
          <div class="metric-row">
            <span class="badge priority-${p}">${App.priorityLabel(p)}</span>
            <strong>${done} / ${subset.length}</strong>
          </div>
        `;
      })
      .join('');
  }

  function refreshAll() {
    renderSummary();
    renderStatusChart();
    renderWeeklyChart();
    renderMonthlyChart();
    renderCategoryChart();
    renderPrioritySplit();
  }

  function init() {
    if (!document.getElementById('analytics-root')) return;
    refreshAll();
    Storage.onChange(() => refreshAll());
    document.addEventListener('themechange', () => refreshAll());
  }

  return { init, refreshAll };
})();

document.addEventListener('DOMContentLoaded', () => AnalyticsPage.init());
