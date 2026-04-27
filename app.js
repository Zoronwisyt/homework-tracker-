// ── Constants ─────────────────────────────────────
const CLASS_COLORS = [
  '#c8f04a', '#7c6af7', '#ff5c6a', '#40d4bc',
  '#ffb347', '#e879f9', '#38bdf8', '#fb923c',
  '#a3e635', '#f472b6'
];

const STORAGE_KEY = 'classwork_data_v1';

// ── State ─────────────────────────────────────────
let state = {
  classes: [],       // [{ id, name, color, assignments: [{id, name, due, done}] }]
  activeClassId: null,
  filter: 'pending'
};

// ── Persistence ───────────────────────────────────
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
    }
  } catch (e) {
    console.warn('Could not load from localStorage:', e);
  }
}

// ── Helpers ───────────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatDue(dateStr) {
  if (!dateStr) return { label: '', cls: 'none' };
  const due = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, cls: 'overdue' };
  if (diff === 0) return { label: 'Due today', cls: 'today' };
  if (diff === 1) return { label: 'Due tomorrow', cls: 'upcoming' };
  return { label: `Due in ${diff}d`, cls: 'upcoming' };
}

function getClass(id) {
  return state.classes.find(c => c.id === id);
}

// ── DOM Refs ──────────────────────────────────────
const addClassBtn    = document.getElementById('addClassBtn');
const addClassForm   = document.getElementById('addClassForm');
const classNameInput = document.getElementById('classNameInput');
const colorPicker    = document.getElementById('colorPicker');
const cancelClassBtn = document.getElementById('cancelClassBtn');
const confirmClassBtn= document.getElementById('confirmClassBtn');
const classList      = document.getElementById('classList');
const sidebarEmpty   = document.getElementById('sidebarEmpty');

const emptyState  = document.getElementById('emptyState');
const classView   = document.getElementById('classView');
const classDot    = document.getElementById('classDot');
const classTitle  = document.getElementById('classTitle');
const classStats  = document.getElementById('classStats');
const deleteClassBtn = document.getElementById('deleteClassBtn');

const hwName   = document.getElementById('hwName');
const hwDue    = document.getElementById('hwDue');
const addHwBtn = document.getElementById('addHwBtn');
const hwList   = document.getElementById('hwList');
const hwEmpty  = document.getElementById('hwEmpty');

const tabs = document.querySelectorAll('.tab');

// ── Color picker init ─────────────────────────────
let selectedColor = CLASS_COLORS[0];

CLASS_COLORS.forEach((color, i) => {
  const swatch = document.createElement('div');
  swatch.className = 'color-swatch' + (i === 0 ? ' selected' : '');
  swatch.style.background = color;
  swatch.dataset.color = color;
  swatch.addEventListener('click', () => {
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    swatch.classList.add('selected');
    selectedColor = color;
  });
  colorPicker.appendChild(swatch);
});

// ── Render sidebar ────────────────────────────────
function renderSidebar() {
  classList.innerHTML = '';
  const isEmpty = state.classes.length === 0;
  sidebarEmpty.classList.toggle('hidden', !isEmpty);

  state.classes.forEach(cls => {
    const pending = cls.assignments.filter(a => !a.done).length;
    const li = document.createElement('li');
    li.className = 'class-item' + (cls.id === state.activeClassId ? ' active' : '');
    li.innerHTML = `
      <div class="class-item-dot" style="background:${cls.color}"></div>
      <span class="class-item-name">${escHtml(cls.name)}</span>
      ${pending > 0 ? `<span class="class-item-count">${pending}</span>` : ''}
    `;
    li.addEventListener('click', () => selectClass(cls.id));
    classList.appendChild(li);
  });
}

// ── Render main panel ─────────────────────────────
function renderMain() {
  const cls = getClass(state.activeClassId);
  if (!cls) {
    emptyState.classList.remove('hidden');
    classView.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  classView.classList.remove('hidden');

  classDot.style.background = cls.color;
  classTitle.textContent = cls.name;

  const total = cls.assignments.length;
  const done  = cls.assignments.filter(a => a.done).length;
  classStats.textContent = `${done} / ${total} completed`;

  renderHwList(cls);
}

function renderHwList(cls) {
  hwList.innerHTML = '';
  let items = cls.assignments;

  if (state.filter === 'pending') items = items.filter(a => !a.done);
  if (state.filter === 'done')    items = items.filter(a => a.done);

  const hasItems = items.length > 0;
  hwEmpty.classList.toggle('hidden', hasItems);

  // Sort: pending first by due date, overdue on top
  items = [...items].sort((a, b) => {
    if (!a.due && !b.due) return 0;
    if (!a.due) return 1;
    if (!b.due) return -1;
    return a.due.localeCompare(b.due);
  });

  items.forEach(hw => {
    const { label, cls: dueCls } = formatDue(hw.due);
    const li = document.createElement('li');
    li.className = 'hw-item' + (hw.done ? ' done' : '');
    li.dataset.id = hw.id;
    li.innerHTML = `
      <div class="hw-checkbox" data-check="${hw.id}">${hw.done ? '✓' : ''}</div>
      <span class="hw-name">${escHtml(hw.name)}</span>
      <span class="hw-due ${dueCls}">${label}</span>
      <button class="btn-delete-hw" data-del="${hw.id}" title="Delete">✕</button>
    `;
    hwList.appendChild(li);
  });
}

// ── Actions ───────────────────────────────────────
function selectClass(id) {
  state.activeClassId = id;
  save();
  renderSidebar();
  renderMain();
}

function addClass() {
  const name = classNameInput.value.trim();
  if (!name) { classNameInput.focus(); return; }
  const cls = { id: uid(), name, color: selectedColor, assignments: [] };
  state.classes.push(cls);
  state.activeClassId = cls.id;
  save();
  hideAddForm();
  renderSidebar();
  renderMain();
}

function deleteActiveClass() {
  if (!state.activeClassId) return;
  const cls = getClass(state.activeClassId);
  if (!cls) return;
  if (!confirm(`Delete "${cls.name}" and all its assignments?`)) return;
  state.classes = state.classes.filter(c => c.id !== state.activeClassId);
  state.activeClassId = state.classes.length ? state.classes[0].id : null;
  save();
  renderSidebar();
  renderMain();
}

function addHomework() {
  const name = hwName.value.trim();
  if (!name) { hwName.focus(); return; }
  const cls = getClass(state.activeClassId);
  if (!cls) return;
  const due = hwDue.value || '';
  cls.assignments.push({ id: uid(), name, due, done: false });
  hwName.value = '';
  hwDue.value  = '';
  save();
  renderSidebar();
  renderMain();
  hwName.focus();
}

function toggleDone(hwId) {
  const cls = getClass(state.activeClassId);
  if (!cls) return;
  const hw = cls.assignments.find(a => a.id === hwId);
  if (hw) hw.done = !hw.done;
  save();
  renderSidebar();
  renderMain();
}

function deleteHw(hwId) {
  const cls = getClass(state.activeClassId);
  if (!cls) return;
  cls.assignments = cls.assignments.filter(a => a.id !== hwId);
  save();
  renderSidebar();
  renderMain();
}

// ── Add class form ────────────────────────────────
function showAddForm() {
  addClassForm.classList.remove('hidden');
  classNameInput.value = '';
  classNameInput.focus();
  addClassBtn.textContent = '−';
}

function hideAddForm() {
  addClassForm.classList.add('hidden');
  addClassBtn.textContent = '+';
}

// ── Escape HTML ───────────────────────────────────
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Event listeners ───────────────────────────────
addClassBtn.addEventListener('click', () => {
  if (addClassForm.classList.contains('hidden')) showAddForm();
  else hideAddForm();
});

cancelClassBtn.addEventListener('click', hideAddForm);
confirmClassBtn.addEventListener('click', addClass);
classNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') addClass(); });

deleteClassBtn.addEventListener('click', deleteActiveClass);

addHwBtn.addEventListener('click', addHomework);
hwName.addEventListener('keydown', e => { if (e.key === 'Enter') addHomework(); });

// Delegated events for hw list
hwList.addEventListener('click', e => {
  const checkEl = e.target.closest('[data-check]');
  const delEl   = e.target.closest('[data-del]');
  if (checkEl) toggleDone(checkEl.dataset.check);
  if (delEl)   deleteHw(delEl.dataset.del);
});

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.filter = tab.dataset.filter;
    const cls = getClass(state.activeClassId);
    if (cls) renderHwList(cls);
  });
});

// ── Init ──────────────────────────────────────────
load();
renderSidebar();
renderMain();
