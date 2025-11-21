import init, { WasmCPU } from "./pkg/mips_emu_wasm.js";
import { LESSONS as BASE_LESSONS } from "./lessons.js";

//for the lesson and files
const STORAGE_KEY = "customLessons";

function getCustomLessons() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch (_) {
    return {};
  }
}

function allLessons() {
  return { ...BASE_LESSONS, ...getCustomLessons() };
}

// lesson underlined in hedder
const lessonContainer = document.getElementById("lesson-container");
const lessonTitle = document.getElementById("lesson-title");
const lessonBody = document.getElementById("lesson-body");
const lessonHide = document.getElementById("lesson-hide");
const filesListEl = document.querySelector(".files-list");

function renderFiles(selectedId) {
  const lessons = allLessons();
  if (!filesListEl) return;

  filesListEl.innerHTML = "";

  Object.entries(lessons)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([id, info]) => {
      const item = document.createElement("div");
      item.className = "file-item";
      item.dataset.lesson = id;
      item.textContent = info.title || id;

      if (id === selectedId) {
        item.classList.add("active");
      }

      item.addEventListener("click", () => {
        showLesson(id);
      });

      filesListEl.appendChild(item);
    });
}

function showLesson(id) {
  const lessons = allLessons();
  const data = lessons[id];
  if (!data) return;

  lessonTitle.textContent = data.title || id;
  lessonBody.innerHTML = data.html || "";
  lessonContainer.classList.remove("hidden");

  if (filesListEl) {
    filesListEl.querySelectorAll(".file-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.lesson === id);
    });
  }
  //keeps page stable (scrolls to top so can see lesson when u click on lab)
  window.scrollTo({ top: 0, behavior: "smooth" });
}

if (lessonHide) {
  lessonHide.addEventListener("click", () => {
    lessonContainer.classList.add("hidden");
  });
}

const urlParams = new URLSearchParams(window.location.search);
const initialLessonId =
  urlParams.get("lesson") || Object.keys(BASE_LESSONS)[0] || null;

renderFiles(initialLessonId);
if (initialLessonId && allLessons()[initialLessonId]) {
  showLesson(initialLessonId);
}

//console and reg ui

const consoleOut = document.getElementById("console-output");
const runBtn = document.getElementById("run");
const stepBtn = document.getElementById("step");
const stopBtn = document.getElementById("stop");
const registersDiv = document.getElementById("registers");
const codeEl = document.querySelector(".assembler textarea");

//emultor stuff
function log(msg) {
  if (!consoleOut) return;
  consoleOut.textContent += msg + "\n";
  consoleOut.scrollTop = consoleOut.scrollHeight;
}

// Helpers for numbers / registers
function toNumber(v) {
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v);
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
}

function hex32(n) {
  const d = toNumber(n) >>> 0;
  return "0x" + d.toString(16).toUpperCase().padStart(8, "0");
}

function fmt(n) {
  const d = toNumber(n);
  return `${d} (${hex32(d)})`;
}

function coerceRegs(raw) {
  if (!raw) return {};
  if (raw instanceof Map) return Object.fromEntries(raw);
  if (Array.isArray(raw)) return Object.fromEntries(raw);
  if (typeof raw === "object") return raw;
  return {};
}

//filters to show the used regs

//show in tab
const INTERESTING = /^\$(?:s[0-7]|t[0-9]|a[0-3]|v[0-1])$/i;
//hide unless changed
const SYSTEM = /^\$(?:zero|gp|sp|fp|ra|at|k0|k1|lo|hi)$/i;

function filterForTab(curr, prev) {
  const out = {};

  for (const [name, val] of Object.entries(curr)) {
    const now = toNumber(val);

    //if don't have a previous snapshot treat it as "same as now"
    //so changed will be false on first run
    const hadPrev = Object.prototype.hasOwnProperty.call(prev, name);
    const was = hadPrev ? toNumber(prev[name]) : now;

    const changed = now !== was;
    const nonZero = now !== 0;

    if (INTERESTING.test(name)) {
      if (nonZero || changed) out[name] = now;
      continue;
    }

    if (SYSTEM.test(name)) {
      if (changed) out[name] = now;
      continue;
    }
    //other regs show only if nonzero or changed
    if (nonZero || changed) out[name] = now;
  }

  return out;
}

//add 11/14 (make reg table editable)

function paintRegisters(regObj) {
  if (!registersDiv) return;

  const entries = Object.entries(regObj).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  if (!entries.length) {
    registersDiv.innerHTML = "<p>(no relevant registers changed)</p>";
    return;
  }

  let html = `
    <table class="reg-table">
      <thead>
        <tr><th>Register</th><th>Value(decimal)</th><th>Hex</th></tr>
      </thead>
      <tbody>
  `;

  for (const [name, val] of entries) {
    const d = toNumber(val);

    html += `
      <tr>
        <td class="reg-name">${name}</td>
        <td>
          <input
            class="reg-edit"
            data-reg="${name}"
            type="number"
            value="${d}"
            style="width:80px"
          >
        </td>
        <td>${hex32(val)}</td>
      </tr>
    `;
  }

  html += "</tbody></table>";
  registersDiv.innerHTML = html;

  //hook up "change" handlers: editing input changes register value
  registersDiv.querySelectorAll(".reg-edit").forEach((input) => {
    input.addEventListener("change", () => {
      const regName = input.dataset.reg;
      const newVal = Number(input.value) || 0;

      //updates the CPU if API supports it
      try {
        if (cpu && typeof cpu.set_register === "function") {
          cpu.set_register(regName, newVal);
          log(`Set ${regName} = ${newVal}`);
        } else {
          log(`(UI only) ${regName} = ${newVal}`);
        }
      } catch (e) {
        console.error("Error setting register:", e);
        log("Error setting register: " + e.message);
      }

      //keeps local snapshots in sync until next run/step
      regObj[regName] = newVal;
      lastRegs[regName] = newVal;
    });
  });
}

//easm and cpu

let cpu = null;
let wasmReady = false;
let isProgramLoaded = false;
let lastRegs = {};
let breakpoints = new Set();
let currentLineMarker = null;

//uses coldmirror

CodeMirror.defineSimpleMode("mips-custom", {
  start: [
    {
      //instructions
      regex:
        /(?:add|addu|addi|addiu|sub|subu|li|sw|lw|sb|lb|sh|lh|lui|la|j|jal|jr|or|ori|and|andi|beq|bne|slt|slti|sltiu|sltu|blt|bgt|ble|bge|move|mult|mflo|mfhi|xor|xori|div|nor|sll|srl)\b/i,
      token: "keyword",
    },
    {
      //registers
      regex: /\$(?:zero|at|v[01]|a[0-3]|t[0-9]|s[0-7]|k[01]|gp|sp|fp|ra)\b/,
      token: "variable-2",
    },
    { regex: /#.*/, token: "comment" },
    { regex: /0x[0-9a-fA-F]+|-?\d+/, token: "number" },
    {
      regex: /\.(?:data|text|globl|asciiz|word|space|align|extern)/,
      token: "meta",
    },
    { regex: /[a-zA-Z_]\w*:/, token: "tag" },
    { regex: /"(?:[^\\]|\\.)*?"/, token: "string" },
  ],
});

const cpuEditor = CodeMirror.fromTextArea(codeEl, {
  lineNumbers: true,
  mode: "mips-custom",
  theme: "default",
  autoCloseBrackets: true,
  gutters: ["CodeMirror-linenumbers", "breakpoints"],
});

//highlight current line
function clearHighlight() {
  if (currentLineMarker != null) {
    cpuEditor.removeLineClass(
      currentLineMarker,
      "background",
      "cm-highlighted-line"
    );
    currentLineMarker = null;
  }
}

function highlightCurrentLine() {
  clearHighlight();
  if (!cpu) return;
  const line = cpu.get_current_line();
  if (line >= 0) {
    currentLineMarker = cpuEditor.addLineClass(
      line,
      "background",
      "cm-highlighted-line"
    );
    cpuEditor.scrollIntoView({ line, ch: 0 }, 50);
  }
}

//breakpoints via gutter click
cpuEditor.on("gutterClick", (cm, lineIndex, gutter) => {
  if (gutter !== "breakpoints") return;

  const info = cm.lineInfo(lineIndex);
  if (info.gutterMarkers && info.gutterMarkers.breakpoints) {
    cm.setGutterMarker(lineIndex, "breakpoints", null);
    breakpoints.delete(lineIndex);
  } else {
    const marker = document.createElement("div");
    marker.innerHTML = "●";
    marker.style.cursor = "pointer";
    marker.style.padding = "0 3px";
    marker.style.fontSize = "13px";
    marker.style.color = "#f00";
    cm.setGutterMarker(lineIndex, "breakpoints", marker);
    breakpoints.add(lineIndex);
  }
});

//control for the emulator

function resetEmulator() {
  if (cpu && wasmReady) {
    cpu.reset();
  }
  if (consoleOut) {
    consoleOut.textContent = "Ready to load program.\n";
  }
  paintRegisters({});
  lastRegs = {};
  isProgramLoaded = false;
  if (stepBtn) stepBtn.disabled = false;
  if (runBtn) runBtn.disabled = false;

  breakpoints.clear();
  cpuEditor.clearGutter("breakpoints");
  clearHighlight();
}

function loadProgram() {
  if (!cpu || !wasmReady) {
    log("WASM not initialized yet.");
    return false;
  }

  if (consoleOut) {
    consoleOut.textContent = "Loading program...\n";
  }
  paintRegisters({});
  lastRegs = {};

  const src = cpuEditor.getValue() || "";
  const result = cpu.load_source(src);

  if (result && result.error) {
    log("Load error: " + result.error);
    isProgramLoaded = false;
    return false;
  }

  log("Program loaded successfully.");
  isProgramLoaded = true;
  cpu.set_breakpoints(Array.from(breakpoints));
  highlightCurrentLine();
  return true;
}

function handleWasmResult(result, { fromRun = false } = {}) {
  const rawRegs =
    (result && result.snapshot && result.snapshot.registers) ||
    (result && result.registers) ||
    null;
  const allRegs = coerceRegs(rawRegs);
  const tabRegs = filterForTab(allRegs, lastRegs);

  paintRegisters(tabRegs);

  if (result && result.error) {
    // we have some kind of status / error string
    if (result.error === "Termination") {
      // normal “finished” case
      clearHighlight();
      if (Object.keys(allRegs).length) {
        log("All Registers (decimal + hex):");
        log("--------------------------------");
        for (const [r, v] of Object.entries(allRegs).sort(([a, b]) =>
          a.localeCompare(b)
        )) {
          log(`  ${r}: ${fmt(v)}`);
        }
        log("\nProgram Finished");
      }
      isProgramLoaded = false;
      if (stepBtn) stepBtn.disabled = true;
      if (runBtn) runBtn.disabled = true;
    } else if (result.error === "Breakpoint") {
      // breakpoint case – don't dump everything, just pause
      log("\n--- Hit Breakpoint ---");
      highlightCurrentLine();
      isProgramLoaded = true;
      if (stepBtn) stepBtn.disabled = false;
      if (runBtn) runBtn.disabled = false;
    } else {
      // some other error (e.g. invalid instruction)
      clearHighlight();
      log(`\n--- ${result.error} ---`);
      if (Object.keys(allRegs).length) {
        log("All Registers (decimal + hex):");
        log("--------------------------------");
        for (const [r, v] of Object.entries(allRegs).sort(([a, b]) =>
          a.localeCompare(b)
        )) {
          log(`  ${r}: ${fmt(v)}`);
        }
      }
      isProgramLoaded = false;
      if (stepBtn) stepBtn.disabled = true;
      if (runBtn) runBtn.disabled = true;
    }
  } else if (fromRun) {
    clearHighlight();
    if (Object.keys(allRegs).length) {
      log("All Registers (decimal + hex):");
      log("--------------------------------");
      for (const [r, v] of Object.entries(allRegs).sort(([a, b]) =>
        a.localeCompare(b)
      )) {
        log(`  ${r}: ${fmt(v)}`);
      }
    }
    isProgramLoaded = false;
    if (stepBtn) stepBtn.disabled = true;
    if (runBtn) runBtn.disabled = true;
    log("\nProgram Finished");
  }

  // keep snapshots in sync
  lastRegs = allRegs;
}


//buttons
if (runBtn) {
  runBtn.addEventListener("click", async () => {
    if (!wasmReady || !cpu) {
      log("WASM not initialized yet.");
      return;
    }

    clearHighlight();

    if (!isProgramLoaded) {
      if (!loadProgram()) return;
    } else {
      cpu.set_breakpoints(Array.from(breakpoints));
    }

    log("Running program...");
    await new Promise(requestAnimationFrame);
    const result = cpu.run();
    handleWasmResult(result, { fromRun: true });

  });
}

if (stepBtn) {
  stepBtn.addEventListener("click", async () => {
    if (!wasmReady || !cpu) {
      log("WASM not initialized yet.");
      return;
    }

    if (!isProgramLoaded) {
      if (!loadProgram()) return;
      return;
    }

    cpu.set_breakpoints(Array.from(breakpoints));

    const nextInsn = cpu.next_instruction();
    log(`\n${nextInsn}`);

    if (nextInsn === "---") {
      handleWasmResult({
        error: "Termination",
        snapshot: { registers: lastRegs },
      });
      return;
    }

    await new Promise(requestAnimationFrame);
    const result = cpu.step();
    handleWasmResult(result);

    if (isProgramLoaded) {
      highlightCurrentLine();
    }
  });
}

if (stopBtn) {
  stopBtn.addEventListener("click", () => {
    resetEmulator();
  });
}

//init wasm

init()
  .then(() => {
    cpu = new WasmCPU();
    wasmReady = true;
    resetEmulator();
    log("WASM initialized.");
  })
  .catch((err) => {
    console.error("Error initializing WASM:", err);
    log("Error initializing WASM: " + err);
  });

