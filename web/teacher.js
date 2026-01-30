import { LESSONS as BASE_LESSONS } from "./lessons.js";

const STORAGE_KEY = "customLessons";
const AUTH_KEY = "professorAuthed";

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

const allLessons = () => ({ ...BASE_LESSONS, ...getCustom() });

// DOM elements
const idEl        = document.getElementById("lesson-id");
const titleEl     = document.getElementById("lesson-title");
const editor      = document.getElementById("editor");
const preview     = document.getElementById("preview");
const saveBtn     = document.getElementById("btn-save");
const newBtn      = document.getElementById("btn-new");
const deleteBtn   = document.getElementById("btn-delete");
const openBtn     = document.getElementById("btn-open");
const exportBtn   = document.getElementById("btn-export");
const importInput = document.getElementById("file-import");
const lessonListEl= document.getElementById("lesson-list");
const docChipTitle= document.getElementById("doc-title");
const timeEl      = document.getElementById("doc-time");
const countEl     = document.getElementById("doc-count");
const saveStatus  = document.getElementById("save-status");
const collapseBtn = document.getElementById("btn-collapse-library");
const libraryEl   = document.getElementById("library");

let currentId = null;

//login and ui
document.addEventListener("DOMContentLoaded", () => {
  const overlay   = document.getElementById("login-overlay");
  const userInput = document.getElementById("login-username");
  const passInput = document.getElementById("login-password");
  const submitBtn = document.getElementById("login-submit");
  const errorEl   = document.getElementById("login-error");
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

  // hide on load
  syncOverlayWithAuth();

  // handle login whenn click
  submitBtn.addEventListener("click", () => {
    const username = userInput.value.trim();
    const password = passInput.value;

    //temp place to store credentials
    // Username: 1
    // Password: 1
    if (username === "1" && password === "1") {
      localStorage.setItem(AUTH_KEY, "true");
      overlay.style.display = "none";
      errorEl.textContent = "";
    } else {
      errorEl.textContent = "Incorrect username or password.";
    }
  });

  //this makes it so when u press enter in either field it submits
  [userInput, passInput].forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        submitBtn.click();
      }
    });
  });

  //logout buttons
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem(AUTH_KEY);
      window.location.href="index.html";
    });
  }
});

//helpers
function updateCount() {
  const baseCount   = Object.keys(BASE_LESSONS).length;
  const customCount = Object.keys(getCustom()).length;
  if (countEl) {
    countEl.textContent = `Base: ${baseCount} · Custom: ${customCount}`;
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

function loadLesson(id) {
  const lessons = allLessons();
  const data = lessons[id];
  if (!data) return;

  currentId = id;
  idEl.value = id;
  titleEl.value = data.title || id;
  editor.innerHTML = data.html || "";
  renderPreview();
  selectListItem(id);
  if (timeEl) {
    timeEl.textContent = "";
  }
  if (saveStatus) {
    saveStatus.textContent = "Loaded";
  }
}

function renderList(selectId = null) {
  const lessons = allLessons();
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

//actions
function ensureId() {
  let id = idEl.value.trim();
  if (!id) {
    const t = titleEl.value.trim() || "lesson";
    id = t.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
    idEl.value = id;
  }
  return id;
}

function saveCurrent() {
  const id = ensureId();
  if (!id) return;

  const title = titleEl.value.trim() || id;
  const html  = editor.innerHTML;

  const custom = getCustom();
  custom[id] = { title, html };
  setCustom(custom);

  currentId = id;
  renderList(id);
  renderPreview();

  const now = new Date().toLocaleString();
  if (timeEl) {
    timeEl.textContent = "Last saved " + now;
  }
  if (saveStatus) {
    saveStatus.textContent = "Saved " + now;
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

function deleteCurrent() {
  const id = idEl.value.trim();
  if (!id) return;

  const custom = getCustom();
  if (!(id in custom)) {
    alert("Only custom lessons can be deleted.");
    return;
  }
  delete custom[id];
  setCustom(custom);

  newLesson();
  renderList(null);
}

function openInLabs() {
  const id = idEl.value.trim();
  if (!id) return;
  window.location.href = `index.html?lesson=${encodeURIComponent(id)}`;
}

function exportCurrent() {
  const id = idEl.value.trim();
  if (!id) return;

  const lessons = allLessons();
  const data = lessons[id];
  if (!data) return;

  const payload = { id, title: data.title || id, html: data.html || "" };
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

function importFromFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = String(e.target.result || "");
      const obj = JSON.parse(text);

      let toSave = {};
      if (obj && typeof obj === "object" && obj.id && obj.html) {
        //single file lessons
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

      const custom = getCustom();
      const merged = { ...custom, ...toSave };
      setCustom(merged);
      renderList(null);
      updateCount();
      alert("Imported lesson(s).");
    } catch (err) {
      console.error(err);
      alert("Could not read lesson file.");
    }
  };
  reader.readAsText(file);
}

//to close or expand lib
if (collapseBtn && libraryEl) {
  collapseBtn.addEventListener("click", () => {
    const collapsed = libraryEl.classList.toggle("collapsed");
    collapseBtn.textContent = collapsed ? "Show" : "Hide";
  });
}

//wires the events
if (saveBtn)   saveBtn.addEventListener("click", saveCurrent);
if (newBtn)    newBtn.addEventListener("click", newLesson);
if (deleteBtn) deleteBtn.addEventListener("click", deleteCurrent);
if (openBtn)   openBtn.addEventListener("click", openInLabs);
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

//renders

renderList(null);
updateCount();

//auto select the first base lesson if present
const firstBase = Object.keys(BASE_LESSONS)[0];
if (firstBase) {
  loadLesson(firstBase);
}
