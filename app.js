const APP_VERSION = '1.1.0';

// === Wake Lock (prevent screen sleep) ===
let wakeLock = null;

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    }
  } catch {}
}

// iOS fallback: silent video keeps screen awake
let noSleepVideo = null;

function initNoSleep() {
  const video = document.createElement('video');
  video.playsInline = true;
  video.muted = true;
  video.loop = true;
  video.style.cssText = 'position:fixed;opacity:0;width:1px;height:1px;pointer-events:none;';

  // Minimal silent MP4 — WebM fallback for broader compat
  const mp4 = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAu1tZGF0AAACrQYF//+p3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1MiByMjg1NCBlOWE1OTAzIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTMgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAbWWIhAAz//727L4FNf2f0teleS2mvZiGBCnBkOhIl4iCAAADAADbBYIOBSAnMAABeAAFhISEAAAAA0BAAAAMA8YAAAaUBAAYogAAAAAUQ0MYAAANAMAAADAAADAA1MBGkAAAANkQAAAA==';
  video.src = mp4;
  document.body.appendChild(video);
  noSleepVideo = video;
}

function playNoSleep() {
  if (!noSleepVideo) return;
  // Re-assert muted (iOS can lose it across visibility changes)
  noSleepVideo.muted = true;
  if (noSleepVideo.paused) {
    noSleepVideo.play().catch(() => {});
  }
}

requestWakeLock();
initNoSleep();

// Retry video on every user interaction (iOS needs gesture)
function onUserGesture() {
  playNoSleep();
  requestWakeLock();
}
document.addEventListener('click', onUserGesture);
document.addEventListener('touchstart', onUserGesture);

// Re-acquire both wake methods when app comes back to foreground
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    requestWakeLock();
    playNoSleep();
  }
});

// Safety net: periodically check and restart video if it stopped
setInterval(() => {
  if (noSleepVideo && noSleepVideo.paused) {
    noSleepVideo.play().catch(() => {});
  }
}, 30000);

// === Storage ===
const DEFAULTS = { focus: 25, short: 5, long: 15 };

function loadSettings() {
  try {
    return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem('pomo-settings')));
  } catch { return { ...DEFAULTS }; }
}

function saveSettings(s) {
  localStorage.setItem('pomo-settings', JSON.stringify(s));
}

function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem('pomo-sessions')) || [];
  } catch { return []; }
}

function saveSessions(s) {
  localStorage.setItem('pomo-sessions', JSON.stringify(s));
}

function logSession(type, durationMin, task) {
  const sessions = loadSessions();
  sessions.push({
    type,
    duration: durationMin,
    task: task || '',
    timestamp: Date.now()
  });
  saveSessions(sessions);
}

// === Shared flip logic ===
let flipGeneration = 0;

function flipCard(topId, bottomId, flipTopId, flipBottomId, cardId, newValue) {
  const card = document.getElementById(cardId);
  const top = document.getElementById(topId);
  const bottom = document.getElementById(bottomId);
  const flipTop = document.getElementById(flipTopId);
  const flipBottom = document.getElementById(flipBottomId);

  const currentValue = top.querySelector('span').textContent;
  if (currentValue === newValue) return;

  flipTop.querySelector('span').textContent = currentValue;
  top.querySelector('span').textContent = newValue;
  flipBottom.querySelector('span').textContent = newValue;

  card.classList.remove('flipping');
  void card.offsetWidth;
  card.classList.add('flipping');

  const gen = flipGeneration;
  setTimeout(() => {
    if (gen !== flipGeneration) return;
    bottom.querySelector('span').textContent = newValue;
    card.classList.remove('flipping');
    flipTop.querySelector('span').textContent = newValue;
  }, 700);
}

function setAll(ids, value) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    el.querySelector('span').textContent = value;
    el.classList.remove('flipping');
  });
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function sizeDigits() {
  const ratio = 3 / 4; // card width:height
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const portrait = vh > vw;

  let cardW, cardH;

  if (portrait) {
    // Stacked vertically — 2 cards top/bottom
    const pad = { x: vw * 0.03, y: vh * 0.02 };
    const gap = Math.min(vh * 0.015, 24);
    const availW = vw - pad.x * 2;
    const availH = vh - pad.y * 2 - gap;

    cardH = availH / 2;
    cardW = cardH * ratio;

    // If too wide, constrain by width
    if (cardW > availW) {
      cardW = availW;
      cardH = cardW / ratio;
    }
  } else {
    // Side by side — 2 cards left/right
    const pad = { x: vw * 0.03, y: vh * 0.02 };
    const gap = Math.min(vw * 0.015, 24);
    const availW = vw - pad.x * 2 - gap;
    const availH = vh - pad.y * 2;

    cardW = availW / 2;
    cardH = cardW / ratio;

    if (cardH > availH) {
      cardH = availH;
      cardW = cardH * ratio;
    }
  }

  const root = document.documentElement;
  root.style.setProperty('--card-w', cardW + 'px');
  root.style.setProperty('--card-h', cardH + 'px');

  const fontSize = Math.min(cardH * 1.05, cardW * 0.9);
  root.style.setProperty('--digit-size', fontSize + 'px');
}

// === Clock ===
let clockInterval = null;

function formatHour(h) {
  return String(h % 12 || 12);
}

function updateClock() {
  const now = new Date();
  const h = now.getHours();
  document.getElementById('period').textContent = h >= 12 ? 'PM' : 'AM';
  document.getElementById('period-flip').textContent = h >= 12 ? 'PM' : 'AM';
  flipCard('hours-top', 'hours-bottom', 'hours-flip-top', 'hours-flip-bottom', 'hours', formatHour(h));
  flipCard('mins-top', 'mins-bottom', 'mins-flip-top', 'mins-flip-bottom', 'minutes', pad(now.getMinutes()));
}

function initClock() {
  const now = new Date();
  const h = now.getHours();
  document.getElementById('period').textContent = h >= 12 ? 'PM' : 'AM';
  document.getElementById('period-flip').textContent = h >= 12 ? 'PM' : 'AM';
  setAll(['hours-top', 'hours-bottom', 'hours-flip-top', 'hours-flip-bottom'], formatHour(h));
  setAll(['mins-top', 'mins-bottom', 'mins-flip-top', 'mins-flip-bottom'], pad(now.getMinutes()));
}

function startClock() {
  initClock();
  clockInterval = setInterval(updateClock, 1000);
}

function stopClock() {
  clearInterval(clockInterval);
  clockInterval = null;
}

// === Timer ===
let timerDuration = 25 * 60;
let timerSeconds = timerDuration;
let timerInterval = null;
let timerType = 'focus';
let currentTask = '';
let timerStartedDuration = 0;

function updateTimerDisplay() {
  const m = pad(Math.floor(timerSeconds / 60));
  const s = pad(timerSeconds % 60);
  flipCard('t-mins-top', 't-mins-bottom', 't-mins-flip-top', 't-mins-flip-bottom', 't-minutes', m);
  flipCard('t-secs-top', 't-secs-bottom', 't-secs-flip-top', 't-secs-flip-bottom', 't-seconds', s);
}

function timerTick() {
  if (timerSeconds <= 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    document.getElementById('t-minutes').classList.add('finished');
    document.getElementById('t-seconds').classList.add('finished');
    document.title = 'Done! - Flipo';
    logSession(timerType, timerStartedDuration, currentTask);
    return;
  }
  timerSeconds--;
  updateTimerDisplay();
  const m = Math.floor(timerSeconds / 60);
  const s = timerSeconds % 60;
  document.title = pad(m) + ':' + pad(s) + ' - Flipo';
}

function initTimerDisplay() {
  flipGeneration++;
  const m = pad(Math.floor(timerSeconds / 60));
  const s = pad(timerSeconds % 60);
  setAll(['t-mins-top', 't-mins-bottom', 't-mins-flip-top', 't-mins-flip-bottom'], m);
  setAll(['t-secs-top', 't-secs-bottom', 't-secs-flip-top', 't-secs-flip-bottom'], s);
  document.getElementById('t-minutes').classList.remove('finished');
  document.getElementById('t-seconds').classList.remove('finished');
}

function startTimer(type, durationMin, task) {
  stopTimer();
  timerType = type;
  timerDuration = durationMin * 60;
  timerSeconds = timerDuration;
  timerStartedDuration = durationMin;
  currentTask = task || '';
  initTimerDisplay();

  // Labels inside left card
  const labels = { focus: 'Focus', short: 'Short Break', long: 'Long Break' };
  ['session-label', 'session-label-flip'].forEach(id => {
    const el = document.getElementById(id);
    el.textContent = labels[type];
    el.className = 'timer-label session-label ' + type;
  });
  ['task-label', 'task-label-flip'].forEach(id => {
    const el = document.getElementById(id);
    el.textContent = currentTask;
    el.className = 'timer-label task-label';
  });

  document.title = pad(durationMin) + ':00 - Flipo';
  timerInterval = setInterval(timerTick, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer() {
  stopTimer();
  timerSeconds = timerDuration;
  initTimerDisplay();
  document.title = pad(Math.floor(timerDuration / 60)) + ':00 - Flipo';
  timerInterval = setInterval(timerTick, 1000);
}

// === Mode switching ===
let currentMode = 'clock';

function hideLabels() {
  ['session-label', 'session-label-flip'].forEach(id => {
    document.getElementById(id).textContent = '';
  });
  ['task-label', 'task-label-flip'].forEach(id => {
    document.getElementById(id).textContent = '';
  });
}

function updateMenuActive(mode) {
  document.querySelectorAll('.menu-btn[data-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

function switchToClock() {
  if (currentMode === 'clock') return;
  stopTimer();
  flipGeneration++;
  hideLabels();
  document.getElementById('timer-view').classList.add('hidden');
  document.getElementById('clock-view').classList.remove('hidden');
  document.title = 'Flipo';
  currentMode = 'clock';
  updateMenuActive('clock');
  startClock();
  requestAnimationFrame(sizeDigits);
}

function switchToTimer(type) {
  const settings = loadSettings();
  const duration = settings[type];

  if (type === 'focus') {
    // Show task input modal
    showTaskModal(type, duration);
    return;
  }

  beginTimer(type, duration, '');
}

function beginTimer(type, duration, task) {
  if (currentMode === 'clock') {
    stopClock();
    flipGeneration++;
    document.getElementById('clock-view').classList.add('hidden');
    document.getElementById('timer-view').classList.remove('hidden');
  } else {
    stopTimer();
    flipGeneration++;
  }
  currentMode = 'timer';
  updateMenuActive(type);
  startTimer(type, duration, task);
  requestAnimationFrame(sizeDigits);
}

// === Task Modal ===
function showTaskModal(type, duration) {
  const overlay = document.getElementById('task-overlay');
  const input = document.getElementById('task-input');
  overlay.classList.remove('hidden');
  input.value = '';
  input.focus();

  // Store pending info
  overlay.dataset.type = type;
  overlay.dataset.duration = duration;
}

document.getElementById('task-start').addEventListener('click', () => {
  const overlay = document.getElementById('task-overlay');
  const task = document.getElementById('task-input').value.trim();
  overlay.classList.add('hidden');
  beginTimer(overlay.dataset.type, Number(overlay.dataset.duration), task);
});

document.getElementById('task-skip').addEventListener('click', () => {
  const overlay = document.getElementById('task-overlay');
  overlay.classList.add('hidden');
  beginTimer(overlay.dataset.type, Number(overlay.dataset.duration), '');
});

document.getElementById('task-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('task-start').click();
  }
  if (e.key === 'Escape') {
    document.getElementById('task-skip').click();
  }
});

// === Settings Modal ===
function showSettings() {
  const settings = loadSettings();
  document.getElementById('focus-duration').textContent = settings.focus;
  document.getElementById('short-duration').textContent = settings.short;
  document.getElementById('long-duration').textContent = settings.long;
  document.getElementById('settings-overlay').classList.remove('hidden');
}

document.querySelectorAll('.stepper-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    const step = Number(btn.dataset.step);
    const current = Number(target.textContent);
    const next = Math.max(1, Math.min(90, current + step));
    target.textContent = next;
  });
});

document.getElementById('settings-save').addEventListener('click', () => {
  const settings = {
    focus: Number(document.getElementById('focus-duration').textContent),
    short: Number(document.getElementById('short-duration').textContent),
    long: Number(document.getElementById('long-duration').textContent)
  };
  saveSettings(settings);
  document.getElementById('settings-overlay').classList.add('hidden');
});

// === Dashboard ===
function showDashboard() {
  const overlay = document.getElementById('dashboard-overlay');
  overlay.classList.remove('hidden');
  renderDashboard();
}

function renderDashboard() {
  const sessions = loadSessions();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySessions = sessions.filter(s => s.timestamp >= today.getTime());

  // Stats
  const focusSessions = todaySessions.filter(s => s.type === 'focus');
  const totalFocusMin = focusSessions.reduce((sum, s) => sum + s.duration, 0);
  const breakSessions = todaySessions.filter(s => s.type !== 'focus');
  const totalBreakMin = breakSessions.reduce((sum, s) => sum + s.duration, 0);

  document.getElementById('dashboard-stats').innerHTML = `
    <div class="stat">
      <div class="stat-value focus-color">${focusSessions.length}</div>
      <div class="stat-label">Sessions</div>
    </div>
    <div class="stat">
      <div class="stat-value focus-color">${totalFocusMin}</div>
      <div class="stat-label">Focus min</div>
    </div>
    <div class="stat">
      <div class="stat-value break-color">${totalBreakMin}</div>
      <div class="stat-label">Break min</div>
    </div>
  `;

  // List
  const list = document.getElementById('dashboard-list');
  if (todaySessions.length === 0) {
    list.innerHTML = '<div class="dashboard-empty">No sessions yet today</div>';
    return;
  }

  list.innerHTML = todaySessions
    .slice()
    .reverse()
    .map(s => {
      const time = new Date(s.timestamp);
      const h = time.getHours() % 12 || 12;
      const ampm = time.getHours() >= 12 ? 'PM' : 'AM';
      const timeStr = h + ':' + pad(time.getMinutes()) + ' ' + ampm;
      const labels = { focus: 'Focus', short: 'Short Break', long: 'Long Break' };
      const taskText = s.task || labels[s.type];
      return `
        <div class="session-item">
          <div class="session-dot ${s.type}"></div>
          <div class="session-info">
            <div class="session-task">${escapeHtml(taskText)}</div>
            <div class="session-meta">${timeStr}</div>
          </div>
          <div class="session-duration">${s.duration}m</div>
        </div>
      `;
    })
    .join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById('dashboard-close').addEventListener('click', () => {
  document.getElementById('dashboard-overlay').classList.add('hidden');
});

document.getElementById('dashboard-clear').addEventListener('click', () => {
  saveSessions([]);
  renderDashboard();
});

// Close overlays on backdrop click
document.querySelectorAll('.overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.add('hidden');
    }
  });
});

// === Menu ===
const menuZone = document.querySelector('.menu-zone');
const menuToggle = document.getElementById('menu-toggle');

// Desktop: hover
menuZone.addEventListener('mouseenter', () => {
  document.body.classList.add('menu-visible');
});

menuZone.addEventListener('mouseleave', () => {
  document.body.classList.remove('menu-visible');
});

// Mobile: tap toggle button to show, tap outside to hide
menuToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  document.body.classList.toggle('menu-visible');
});

document.addEventListener('click', (e) => {
  if (!menuZone.contains(e.target) && e.target !== menuToggle) {
    document.body.classList.remove('menu-visible');
  }
});

// Menu button handlers
document.querySelectorAll('.menu-btn[data-mode]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.mode === 'clock') {
      switchToClock();
    } else {
      switchToTimer(btn.dataset.mode);
    }
  });
});

document.querySelector('[data-action="reset"]').addEventListener('click', () => {
  if (currentMode === 'timer') resetTimer();
});

document.querySelector('[data-action="dashboard"]').addEventListener('click', showDashboard);
document.querySelector('[data-action="settings"]').addEventListener('click', showSettings);

window.addEventListener('resize', sizeDigits);

// === Start ===
document.getElementById('settings-version').textContent = 'Flipo v' + APP_VERSION;
startClock();
sizeDigits();
