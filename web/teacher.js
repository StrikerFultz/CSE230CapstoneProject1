import { LESSONS as BASE_LESSONS } from "./lessons.js";

// API Configuration
const API_BASE = 'http://localhost:5000/api';

const STORAGE_KEY = "customLessons";
const AUTH_KEY = "professorAuthed";

// API helper functions
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

async function fetchLessonsFromAPI() {
  try {
    const labs = await apiRequest('/labs');
    console.log('Fetched from database:', Object.keys(labs).length, 'labs');
    return labs;
  } catch (error) {
    console.warn('Could not fetch labs from API:', error);
    return {};
  }
}

async function saveLessonToAPI(labId, title, html) {
  try {
    const labData = {
      lab_id: labId,
      title: title,
      instructions: html,
      is_published: true,
      difficulty: 'beginner',
      points: 100
    };
    
    // Try to update first
    try {
      await apiRequest(`/labs/${labId}`, {
        method: 'PUT',
        body: JSON.stringify(labData)
      });
      console.log('Lab updated in database');
      return true;
    } catch (updateError) {
      // If update fails, try to create
      await apiRequest('/labs', {
        method: 'POST',
        body: JSON.stringify(labData)
      });
      console.log('Lab created in database');
      return true;
    }
  } catch (error) {
    console.error('Failed to save lab to database:', error);
    alert('Failed to save to database: ' + error.message + '\n\nSaved locally only.');
    return false;
  }
}

async function deleteLessonFromAPI(labId) {
  try {
    await apiRequest(`/labs/${labId}`, {
      method: 'DELETE'
    });
    console.log('Lab deleted from database');
    return true;
  } catch (error) {
    console.error('Failed to delete lab from database:', error);
    alert('Failed to delete from database: ' + error.message);
    return false;
  }
}

// Local storage fallback
const getCustom = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch (_) {
    return {};
  }
};

const setCustom = (obj) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
};

const allLessons = async () => {
  const apiLessons = await fetchLessonsFromAPI();
  const customLessons = getCustom();
  return { ...BASE_LESSONS, ...apiLessons, ...customLessons };
};

// DOM elements
const idEl = document.getElementById("lesson-id");
const titleEl = document.getElementById("lesson-title");
const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const saveBtn = document.getElementById("btn-save");
const newBtn = document.getElementById("btn-new");
const deleteBtn = document.getElementById("btn-delete");
const openBtn = document.getElementById("btn-open");
const exportBtn = document.getElementById("btn-export");
const importInput = document.getElementById("file-import");
const lessonListEl = document.getElementById("lesson-list");
const docChipTitle = document.getElementById("doc-title");
const timeEl = document.getElementById("doc-time");
const countEl = document.getElementById("doc-count");
const saveStatus = document.getElementById("save-status");
const collapseBtn = document.getElementById("btn-collapse-library");
const libraryEl = document.getElementById("library");

let currentId = null;

// Login and UI
document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("login-overlay");
  const userInput = document.getElementById("login-username");
  const passInput = document.getElementById("login-password");
  const submitBtn = document.getElementById("login-submit");
  const errorEl = document.getElementById("login-error");
  const logoutBtn = document.getElementById("logout-prof");

  if (!overlay || !userInput || !passInput || !submitBtn) {
    console.warn("Login UI not found on page");
    return;
  }

  function syncOverlayWithAuth() {
    if (localStorage.getItem(AUTH_KEY) === "true") {
      overlay.style.display = "none";
    } else {
      overlay.style.display = "flex";
    }
  }

  syncOverlayWithAuth();

  // Handle login
  submitBtn.addEventListener("click", async () => {
    const username = userInput.value.trim();
    const password = passInput.value;

    // Try API login first
    try {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      
      if (result.user) {
        localStorage.setItem(AUTH_KEY, "true");
        overlay.style.display = "none";
        errorEl.textContent = "";
        console.log('✓ Logged in as:', result.user.username);
        alert(`Welcome, ${result.user.first_name || username}!`);
        renderList(null);
        return;
      }
    } catch (apiError) {
      console.warn('API login failed, trying local auth:', apiError);
    }

    // Fallback to local auth (username: 1, password: 1)
    if (username === "1" && password === "1") {
      localStorage.setItem(AUTH_KEY, "true");
      overlay.style.display = "none";
      errorEl.textContent = "";
      console.log('✓ Logged in locally');
    } else {
      errorEl.textContent = "Incorrect username or password.";
    }
  });

  // Enter key support
  [userInput, passInput].forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        submitBtn.click();
      }
    });
  });

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await apiRequest('/auth/logout', { method: 'POST' });
      } catch (error) {
        console.warn('API logout failed:', error);
      }
      localStorage.removeItem(AUTH_KEY);
      window.location.href = "index.html";
    });
  }
});

// Helper functions
async function updateCount() {
  const baseCount = Object.keys(BASE_LESSONS).length;
  const customCount = Object.keys(getCustom()).length;
  
  try {
    const apiLessons = await fetchLessonsFromAPI();
    const apiCount = Object.keys(apiLessons).length;
    
    if (countEl) {
      countEl.textContent = `Base: ${baseCount} · Database: ${apiCount} · Local: ${customCount}`;
    }
  } catch (error) {
    if (countEl) {
      countEl.textContent = `Base: ${baseCount} · Custom: ${customCount}`;
    }
  }
}

function renderPreview() {
  const title = titleEl.value.trim() || "(Untitled document)";
  preview.innerHTML = `
    <h3 style="text-align:center;margin:12px 0;">${title}</h3>
    ${editor.innerHTML || '<p style="text-align:center;color:#666">(Empty lesson)</p>'}
  `;
  docChipTitle.textContent = title;
}

function selectListItem(id) {
  const nodes = lessonListEl.querySelectorAll(".lesson-item");
  nodes.forEach((n) => {
    n.classList.toggle("active", n.dataset.lessonId === id);
  });
}

async function loadLesson(id) {
  const lessons = await allLessons();
  const data = lessons[id];
  if (!data) return;

  currentId = id;
  idEl.value = id;
  titleEl.value = data.title || id;
  editor.innerHTML = data.html || data.instructions || "";
  renderPreview();
  selectListItem(id);
  if (timeEl) {
    timeEl.textContent = "";
  }
  if (saveStatus) {
    saveStatus.textContent = "Loaded";
  }
}

async function renderList(selectId = null) {
  const lessons = await allLessons();
  lessonListEl.innerHTML = "";

  Object.entries(lessons)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([id, data]) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "lesson-item";
      item.dataset.lessonId = id;

      item.innerHTML = `
        <span class="ltitle">${data.title || id}</span>
        <span class="lid">${id}</span>
      `;

      item.addEventListener("click", () => loadLesson(id));

      if (id === selectId) {
        item.classList.add("active");
      }

      lessonListEl.appendChild(item);
    });

  updateCount();
}

// Actions
function ensureId() {
  let id = idEl.value.trim();
  if (!id) {
    const t = titleEl.value.trim() || "lesson";
    id = t.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
    idEl.value = id;
  }
  return id;
}

async function saveCurrent() {
  const id = ensureId();
  if (!id) return;

  const title = titleEl.value.trim() || id;
  const html = editor.innerHTML;

  // Save to API first
  const apiSuccess = await saveLessonToAPI(id, title, html);
  
  // Also save to local storage as backup
  const custom = getCustom();
  custom[id] = { title, html };
  setCustom(custom);

  currentId = id;
  await renderList(id);
  renderPreview();

  const now = new Date().toLocaleString();
  if (timeEl) {
    timeEl.textContent = "Last saved " + now + (apiSuccess ? " (database)" : " (local only)");
  }
  if (saveStatus) {
    saveStatus.textContent = "Saved " + now + (apiSuccess ? " ✓ DB" : " ⚠ Local");
  }
}

function newLesson() {
  currentId = null;
  idEl.value = "";
  titleEl.value = "";
  editor.innerHTML = "";
  renderPreview();
  selectListItem(null);
  if (timeEl) timeEl.textContent = "";
  if (saveStatus) saveStatus.textContent = "New lesson (unsaved)";
}

async function deleteCurrent() {
  const id = idEl.value.trim();
  if (!id) return;

  if (!confirm(`Are you sure you want to delete "${id}"?`)) {
    return;
  }

  // Try to delete from API
  await deleteLessonFromAPI(id);

  // Also delete from local storage
  const custom = getCustom();
  if (id in custom) {
    delete custom[id];
    setCustom(custom);
  }

  newLesson();
  await renderList(null);
}

function openInLabs() {
  const id = idEl.value.trim();
  if (!id) return;
  window.location.href = `index.html?lesson=${encodeURIComponent(id)}`;
}

function exportCurrent() {
  const id = idEl.value.trim();
  if (!id) return;

  const title = titleEl.value.trim() || id;
  const html = editor.innerHTML;

  const payload = { id, title, html };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${id}.lesson.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function importFromFile(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const text = String(e.target.result || "");
      const obj = JSON.parse(text);

      let toSave = {};
      if (obj && typeof obj === "object" && obj.id && obj.html) {
        toSave[obj.id] = { title: obj.title || obj.id, html: obj.html };
      } else {
        for (const [id, val] of Object.entries(obj)) {
          if (val && typeof val === "object" && val.html) {
            toSave[id] = { title: val.title || id, html: val.html };
          }
        }
      }

      if (!Object.keys(toSave).length) {
        alert("File did not look like a lesson export.");
        return;
      }

      // Save to API and local storage
      for (const [id, data] of Object.entries(toSave)) {
        await saveLessonToAPI(id, data.title, data.html);
      }

      const custom = getCustom();
      const merged = { ...custom, ...toSave };
      setCustom(merged);
      
      await renderList(null);
      await updateCount();
      alert("Imported lesson(s).");
    } catch (err) {
      console.error(err);
      alert("Could not read lesson file.");
    }
  };
  reader.readAsText(file);
}

// Collapse/expand library
if (collapseBtn && libraryEl) {
  collapseBtn.addEventListener("click", () => {
    const collapsed = libraryEl.classList.toggle("collapsed");
    collapseBtn.textContent = collapsed ? "Show" : "Hide";
  });
}

// Wire up events
if (saveBtn) saveBtn.addEventListener("click", saveCurrent);
if (newBtn) newBtn.addEventListener("click", newLesson);
if (deleteBtn) deleteBtn.addEventListener("click", deleteCurrent);
if (openBtn) openBtn.addEventListener("click", openInLabs);
if (exportBtn) exportBtn.addEventListener("click", exportCurrent);

if (importInput) {
  importInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      importFromFile(file);
      importInput.value = "";
    }
  });
}

if (editor) {
  editor.addEventListener("input", () => {
    renderPreview();
    if (saveStatus) saveStatus.textContent = "Unsaved changes";
  });
}

if (titleEl) {
  titleEl.addEventListener("input", () => {
    renderPreview();
    if (saveStatus) saveStatus.textContent = "Unsaved changes";
  });
}

// Initial render
(async () => {
  await renderList(null);
  await updateCount();

  const firstBase = Object.keys(BASE_LESSONS)[0];
  if (firstBase) {
    loadLesson(firstBase);
  }
})();