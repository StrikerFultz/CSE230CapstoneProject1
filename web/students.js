// Students browser — teacher-only page
const API_BASE = 'http://localhost:5000/api';

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'API request failed');
  }
  return response.json();
}

// ─── DOM refs ───

const rosterEl    = document.getElementById('stu-roster');
const countEl     = document.getElementById('student-count');
const searchEl    = document.getElementById('stu-search');
const placeholder = document.getElementById('stu-placeholder');
const detailEl    = document.getElementById('stu-detail');
const headerCard  = document.getElementById('stu-header-card');
const statsRow    = document.getElementById('stu-stats-row');
const labsList    = document.getElementById('stu-labs-list');

let allStudents = [];
let selectedUserId = null;

// ─── Logout ───

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  try { await apiRequest('/auth/logout', { method: 'POST' }); } catch (_) {}
  window.location.href = 'login.html';
});

// ─── Roster ───

async function loadRoster() {
  try {
    allStudents = await apiRequest('/students');
    renderRoster(allStudents);
    if (countEl) countEl.textContent = `${allStudents.length} student(s)`;
  } catch (err) {
    rosterEl.innerHTML = `<div class="stu-loading" style="color:#c62828;">Error: ${err.message}</div>`;
  }
}

function renderRoster(students) {
  if (!students.length) {
    rosterEl.innerHTML = '<div class="stu-loading">No students found</div>';
    return;
  }

  rosterEl.innerHTML = '';
  students.forEach(s => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'stu-roster-item';
    item.dataset.userId = s.user_id;
    if (s.user_id === selectedUserId) item.classList.add('active');

    const pct = s.avg_score_pct;
    const barColor = pct >= 80 ? '#4caf50' : pct >= 50 ? '#ff9800' : '#e53935';
    const labRatio = `${s.labs_attempted}/${s.total_labs}`;

    item.innerHTML = `
      <div class="stu-roster-top">
        <span class="stu-roster-name">${s.full_name || s.username}</span>
        <span class="stu-roster-score" style="color:${barColor}">${pct}%</span>
      </div>
      <div class="stu-roster-bottom">
        <span class="stu-roster-id">${s.asu_id || s.username}</span>
        <span class="stu-roster-labs">${labRatio} labs</span>
      </div>
    `;

    item.addEventListener('click', () => selectStudent(s.user_id));
    rosterEl.appendChild(item);
  });
}

// ─── Search / filter ───

if (searchEl) {
  searchEl.addEventListener('input', () => {
    const q = searchEl.value.toLowerCase().trim();
    if (!q) { renderRoster(allStudents); return; }
    const filtered = allStudents.filter(s =>
      (s.full_name || '').toLowerCase().includes(q) ||
      (s.username || '').toLowerCase().includes(q) ||
      (s.asu_id || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
    renderRoster(filtered);
  });
}

// ─── Student detail ───

async function selectStudent(userId) {
  selectedUserId = userId;

  // Highlight in roster
  rosterEl.querySelectorAll('.stu-roster-item').forEach(el => {
    el.classList.toggle('active', el.dataset.userId === userId);
  });

  placeholder.style.display = 'none';
  detailEl.style.display = '';
  headerCard.innerHTML = '<div class="stu-loading">Loading…</div>';
  statsRow.innerHTML = '';
  labsList.innerHTML = '';

  try {
    const data = await apiRequest(`/students/${userId}`);
    renderDetail(data);
  } catch (err) {
    headerCard.innerHTML = `<div class="stu-loading" style="color:#c62828;">Error: ${err.message}</div>`;
  }
}

function renderDetail(data) {
  const stu = data.student;
  const labs = data.labs;

  // ── Header card ──
  const joined = stu.created_at ? new Date(stu.created_at).toLocaleDateString() : '—';
  const lastLogin = stu.last_login ? new Date(stu.last_login).toLocaleString() : 'Never';

  headerCard.innerHTML = `
    <div class="stu-hdr-left">
      <div class="stu-hdr-avatar">${(stu.full_name || stu.username).charAt(0).toUpperCase()}</div>
      <div>
        <div class="stu-hdr-name">${stu.full_name || stu.username}</div>
        <div class="stu-hdr-meta">${stu.asu_id || stu.username} · ${stu.email || ''}</div>
      </div>
    </div>
    <div class="stu-hdr-right">
      <div class="stu-hdr-label">Joined</div><div class="stu-hdr-val">${joined}</div>
      <div class="stu-hdr-label">Last login</div><div class="stu-hdr-val">${lastLogin}</div>
    </div>
  `;

  // ── Summary stats ──
  const attempted = labs.filter(l => l.attempt_count > 0).length;
  const totalLabs = labs.length;
  const totalSubs = labs.reduce((n, l) => n + l.attempt_count, 0);

  const scoresWithAttempts = labs.filter(l => l.best_score !== null);
  const avgPct = scoresWithAttempts.length
    ? (scoresWithAttempts.reduce((a, l) => a + (l.best_score / l.best_possible) * 100, 0) / scoresWithAttempts.length).toFixed(1)
    : 0;

  const perfect = scoresWithAttempts.filter(l => l.best_score === l.best_possible).length;

  // Compute average time per attempt across all submissions
  const allSubs = labs.flatMap(l => l.submissions || []);
  const subsWithTime = allSubs.filter(s => s.duration_seconds != null);
  const avgTimeSec = subsWithTime.length
    ? Math.round(subsWithTime.reduce((a, s) => a + s.duration_seconds, 0) / subsWithTime.length)
    : null;
  const avgRuns = subsWithTime.length
    ? (subsWithTime.reduce((a, s) => a + (s.run_count || 0), 0) / subsWithTime.length).toFixed(1)
    : null;

  statsRow.innerHTML = `
    <div class="stu-stat">
      <div class="stu-stat-num">${attempted}<small>/${totalLabs}</small></div>
      <div class="stu-stat-label">Labs attempted</div>
    </div>
    <div class="stu-stat">
      <div class="stu-stat-num">${totalSubs}</div>
      <div class="stu-stat-label">Total submissions</div>
    </div>
    <div class="stu-stat">
      <div class="stu-stat-num">${avgPct}%</div>
      <div class="stu-stat-label">Avg best score</div>
    </div>
    <div class="stu-stat">
      <div class="stu-stat-num">${perfect}</div>
      <div class="stu-stat-label">Perfect scores</div>
    </div>
    <div class="stu-stat">
      <div class="stu-stat-num">${avgTimeSec != null ? formatDuration(avgTimeSec) : '—'}</div>
      <div class="stu-stat-label">Avg time / attempt</div>
    </div>
    <div class="stu-stat">
      <div class="stu-stat-num">${avgRuns != null ? avgRuns : '—'}</div>
      <div class="stu-stat-label">Avg runs / attempt</div>
    </div>
  `;

  // ── Per-lab list ──
  labsList.innerHTML = '';
  labs.forEach(lab => {
    const card = document.createElement('div');
    card.className = 'stu-lab-card';

    const hasAttempt = lab.attempt_count > 0;
    const pct = hasAttempt ? ((lab.best_score / lab.best_possible) * 100).toFixed(0) : null;
    const barColor = !hasAttempt ? '#bbb' : pct >= 80 ? '#4caf50' : pct >= 50 ? '#ff9800' : '#e53935';
    const statusText = !hasAttempt ? 'Not attempted' : pct == 100 ? 'Perfect' : `${pct}%`;
    const statusClass = !hasAttempt ? 'stu-status-none' : pct == 100 ? 'stu-status-perfect' : '';

    let latestDate = '';
    if (lab.latest_submission) {
      latestDate = new Date(lab.latest_submission.submitted_at).toLocaleString();
    }

    card.innerHTML = `
      <div class="stu-lab-header">
        <div class="stu-lab-header-left">
          <span class="stu-lab-title">${lab.title}</span>
          <span class="stu-lab-id">${lab.lab_id}</span>
        </div>
        <div class="stu-lab-header-right">
          <span class="stu-lab-status ${statusClass}" style="color:${barColor}">${statusText}</span>
          <span class="stu-lab-score">${hasAttempt ? lab.best_score + '/' + lab.best_possible : '—'}</span>
          ${hasAttempt ? `<button class="btn-ghost stu-reset-btn" data-lab-id="${lab.lab_id}" style="color:#e53935;font-size:11px;" title="Delete all submissions and reset attempt counter">Reset Attempts</button>` : ''}
          <span class="stu-lab-toggle">▾</span>
        </div>
      </div>
      <div class="stu-lab-body">
        ${!hasAttempt ? '<div class="stu-lab-empty">No submissions yet</div>' : renderSubmissionTable(lab)}
      </div>
    `;

    // Toggle expand (ignore clicks on the reset button)
    card.querySelector('.stu-lab-header').addEventListener('click', (e) => {
      if (e.target.classList.contains('stu-reset-btn')) return;
      card.querySelector('.stu-lab-body').classList.toggle('open');
    });

    labsList.appendChild(card);
  });
}

function renderSubmissionTable(lab) {
  let rows = '';
  lab.submissions.forEach((sub, idx) => {
    const date = new Date(sub.submitted_at).toLocaleString();
    const pct = sub.total_possible > 0 ? ((sub.score / sub.total_possible) * 100).toFixed(0) : 0;
    const isBest = sub.score === lab.best_score;
    const rowClass = isBest ? 'stu-sub-best' : '';
    const uniqueId = `sub-${lab.lab_id}-${idx}`;

    // Parse test results
    let detailHTML = '';
    let results = sub.test_results;
    if (typeof results === 'string') { try { results = JSON.parse(results); } catch(_) { results = []; } }

    if (results && results.length) {
      detailHTML += '<div class="stu-sub-tests">';
      results.forEach(t => {
        const icon = t.status === 'PASS' ? '✓' : '✗';
        const color = t.status === 'PASS' ? '#2e7d32' : '#d32f2f';
        detailHTML += `<div class="stu-sub-test-row">
          <span style="color:${color};font-weight:700;width:16px;">${icon}</span>
          <span>${t.name}</span>
          <span style="margin-left:auto;color:#666;">${t.earned}/${t.points}</span>
        </div>`;

        if (t.mismatches && t.mismatches.length) {
          t.mismatches.forEach(m => {
            detailHTML += `<div class="stu-sub-mismatch">
              ${m.register}: expected <b>${m.expected}</b>, got <b>${m.actual}</b>
            </div>`;
          });
        }
      });
      detailHTML += '</div>';
    }

    // Source code preview
    const codeTruncated = (sub.source_code || '').replace(/\\n/g, '\n');
    detailHTML += `<details class="stu-sub-code-details">
      <summary>View source code</summary>
      <pre class="stu-sub-code">${escapeHTML(codeTruncated)}</pre>
    </details>`;

    rows += `
      <tr class="${rowClass}">
        <td>${isBest ? '★ ' : ''}#${lab.submissions.length - idx}</td>
        <td>${date}</td>
        <td>${sub.score}/${sub.total_possible}</td>
        <td style="font-weight:600;">${pct}%</td>
        <td>${formatDuration(sub.duration_seconds)}</td>
        <td>${sub.run_count != null ? sub.run_count : '—'}</td>
        <td><button class="btn-ghost stu-expand-btn" data-target="${uniqueId}">Details</button></td>
      </tr>
      <tr class="stu-sub-detail-row" id="${uniqueId}">
        <td colspan="7">${detailHTML}</td>
      </tr>
    `;
  });

  return `
    <table class="stu-sub-table">
      <thead>
        <tr><th>#</th><th>Submitted</th><th>Score</th><th>%</th><th>Time Spent</th><th>Runs</th><th></th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDuration(seconds) {
  if (seconds == null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

// Delegate detail expand buttons
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('stu-expand-btn')) {
    const target = document.getElementById(e.target.dataset.target);
    if (target) target.classList.toggle('open');
  }
});

// Delegate reset-attempts buttons
document.addEventListener('click', async (e) => {
  if (!e.target.classList.contains('stu-reset-btn')) return;

  e.stopPropagation(); // don't toggle the lab card expand

  const labId = e.target.dataset.labId;
  const userId = selectedUserId;
  if (!labId || !userId) return;

  if (!confirm(`This will permanently delete all submissions for this student on "${labId}".\n\nAre you sure?`)) return;

  try {
    await apiRequest(`/grade/attempts/${labId}/${userId}`, { method: 'DELETE' });
    // Refresh the student detail to reflect the reset
    selectStudent(userId);
  } catch (err) {
    alert('Failed to reset attempts: ' + err.message);
  }
});

// ─── Init ───

(async () => {
  await loadRoster();
})();