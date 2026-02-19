import init, { WasmCPU } from "./pkg/mips_emu_wasm.js";
import { LESSONS as BASE_LESSONS } from "./lessons.js";

// API Configuration
const API_BASE = 'http://localhost:5000/api';

//for the lesson and files
const STORAGE_KEY = "customLessons";

// Fetch lessons from API
async function fetchLessonsFromAPI() {
  try {
    const response = await fetch(`${API_BASE}/labs`, {
      credentials: 'include'
    });
    if (response.ok) {
      const labs = await response.json();
      console.log('Fetched labs from database:', Object.keys(labs).length, 'labs');
      return labs;
    }
  } catch (error) {
    console.warn('Could not fetch labs from API, using local storage:', error);
  }
  return {};
}

function getCustomLessons() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch (_) {
    return {};
  }
}

async function allLessons() {
  const apiLessons = await fetchLessonsFromAPI();
  const customLessons = getCustomLessons();
  return { ...BASE_LESSONS, ...apiLessons, ...customLessons };
}

// lesson underlined in hedder
const lessonContainer = document.getElementById("lesson-container");
const lessonTitle = document.getElementById("lesson-title");
const lessonBody = document.getElementById("lesson-body");
const lessonHide = document.getElementById("lesson-hide");
const filesListEl = document.querySelector(".files-list");

async function renderFiles(selectedId) {
  const lessons = await allLessons();
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

function applyInitialValues(labData) {
  if (!cpu || !wasmReady) return;

  // lab-level initial_values (from DB or lessons.js)
  const labInitial = labData.initial_values || labData.initialValues || {};

  const testCases = labData.test_cases || labData.testCases || [];
  const tcInitial = testCases.length > 0
    ? (testCases[0].inputs || testCases[0].initialRegisters || {})
    : {};

  const merged = { ...tcInitial, ...labInitial };

  for (const [reg, val] of Object.entries(merged)) {
    try {
      cpu.set_register(reg, Number(val));
    } catch (e) {
      console.warn(`Could not set initial register ${reg}:`, e);
    }
  }

  // Also apply initial memory values if present
  const labMem = labData.initial_memory || labData.initialMemory || {};
  const tcMem = testCases.length > 0
    ? (testCases[0].initialMemory || {})
    : {};
  const mergedMem = { ...tcMem, ...labMem };

  for (const [addr, val] of Object.entries(mergedMem)) {
    try {
      cpu.set_memory_word(Number(addr), Number(val));
    } catch (e) {
      console.warn(`Could not set initial memory at ${addr}:`, e);
    }
  }

  // Update the UI to reflect the new state
  if (Object.keys(merged).length > 0) {
    const display = {};
    for (const [reg, val] of Object.entries(merged)) {
      display[reg] = Number(val) >>> 0;
    }
    paintRegisters(display);
    lastRegs = display;
    log(`Loaded initial values for ${Object.keys(merged).length} register(s).`);
  }

  updateMemoryView();
}

async function showLesson(id) {
  const lessons = await allLessons();
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

  // Reset emulator state when switching labs
  if (cpu && wasmReady) {
    resetEmulator();
  }

  // Load starter code if available
  if (cpuEditor) {
      cpuEditor.setValue(data.starter_code || "");
  }

  currentLabData = data;

  // Apply initial register values from lab-level config
  applyInitialValues(data);

  // Render test cases - support both field names
  const testCases = data.test_cases || data.testCases;
  renderTestCases(testCases);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

if (lessonHide) {
  lessonHide.addEventListener("click", () => {
    lessonContainer.classList.add("hidden");
  });
}

// Test cases rendering
const testCasesSection = document.getElementById("test-cases-section");
const testCasesToggle = document.getElementById("test-cases-toggle");
const testCasesContent = document.getElementById("test-cases-content");
const testCasesList = document.getElementById("test-cases-list");

if (testCasesToggle) {
  testCasesToggle.addEventListener("click", () => {
    const isHidden = testCasesContent.classList.toggle("hidden");
    testCasesToggle.textContent = isHidden ? "▼ Show Test Cases" : "▲ Hide Test Cases";
  });
}

function renderTestCases(testCases) {
  if (!testCasesSection || !testCasesList) return;
  
  // Hide section if no test cases
  if (!testCases || testCases.length === 0) {
    testCasesSection.classList.add("hidden");
    return;
  }
  
  // Show section and render test cases
  testCasesSection.classList.remove("hidden");
  testCasesList.innerHTML = "";
  
  testCases.forEach((testCase, index) => {
    const item = document.createElement("div");
    item.className = "test-case-item";
    
    // Support both naming conventions: inputs/initialRegisters and expected/expectedRegisters
    const initialRegs = testCase.inputs || testCase.initialRegisters || {};
    const expectedRegs = testCase.expected || testCase.expectedRegisters || {};
    const initialMem = testCase.initialMemory || {};
    const expectedMem = testCase.expectedMemory || {};
    
    // Build inputs section (registers + memory)
    let inputsHTML = "";
    
    // Initial registers table
    if (Object.keys(initialRegs).length > 0) {
      inputsHTML += `
        <table class="test-case-table">
          <thead>
            <tr>
              <th>Register</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(initialRegs).map(([reg, val]) => `
              <tr>
                <td>${reg}</td>
                <td>${val}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
    
    // Initial memory table
    if (Object.keys(initialMem).length > 0) {
      inputsHTML += `
        <table class="test-case-table" style="margin-top: 10px;">
          <thead>
            <tr>
              <th>Address</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(initialMem)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([addr, val]) => `
              <tr>
                <td>${addr}</td>
                <td>${val}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
    
    if (inputsHTML === "") {
      inputsHTML = '<p style="font-size: 12px; color: #666;">No input values</p>';
    }
    
    // Build expected outputs section (registers + memory)
    let outputsHTML = "";
    
    // Expected registers table
    if (Object.keys(expectedRegs).length > 0) {
      outputsHTML += `
        <table class="test-case-table">
          <thead>
            <tr>
              <th>Register</th>
              <th>Expected Value</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(expectedRegs).map(([reg, val]) => `
              <tr>
                <td>${reg}</td>
                <td>${val}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
    
    // Expected memory table
    if (Object.keys(expectedMem).length > 0) {
      outputsHTML += `
        <table class="test-case-table" style="margin-top: 10px;">
          <thead>
            <tr>
              <th>Address</th>
              <th>Expected Value</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(expectedMem)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([addr, val]) => `
              <tr>
                <td>${addr}</td>
                <td>${val}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
    
    if (outputsHTML === "") {
      outputsHTML = '<p style="font-size: 12px; color: #666;">No expected outputs</p>';
    }
    
    item.innerHTML = `
      <div class="test-case-header">
        <div class="test-case-name">${testCase.name || `Test Case ${index + 1}`}</div>
        <div class="test-case-points">${testCase.points || 0} points</div>
      </div>
      <div class="test-case-body">
        <div class="test-case-column">
          <h4>Initial Values</h4>
          ${inputsHTML}
        </div>
        <div class="test-case-column">
          <h4>Expected Outputs</h4>
          ${outputsHTML}
        </div>
      </div>
    `;
    
    testCasesList.appendChild(item);
  });
}

const urlParams = new URLSearchParams(window.location.search);
const initialLessonId =
  urlParams.get("lesson") || Object.keys(BASE_LESSONS)[0] || null;

// Initialize lessons async
(async () => {
  await renderFiles(initialLessonId);
  const lessons = await allLessons();
  if (initialLessonId && lessons[initialLessonId]) {
    showLesson(initialLessonId);
  }
})();

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
  const d = toNumber(n) >>> 0;
  const signed = d > 0x7FFFFFFF ? d - 0x100000000 : d;
  return `${signed} (${hex32(d)})`;
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
    const signed = d >>> 0 > 0x7FFFFFFF ? d - 0x100000000 : d;

    html += `
      <tr>
        <td class="reg-name">${name}</td>
        <td>
          <input
            class="reg-edit"
            data-reg="${name}"
            type="number"
            value="${signed}"
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
let currentLabData = null;

//uses coldmirror

CodeMirror.defineSimpleMode("mips-custom", {
  start: [
    {
      //instructions
      regex:
        /(?:add|addu|addi|addiu|sub|subu|li|sw|lw|sb|lb|sh|lh|lui|la|j|jal|jr|or|ori|and|andi|beq|bne|slt|slti|sltiu|sltu|blt|bgt|ble|bge|move|mult|multu|mflo|mfhi|xor|xori|div|divu|nor|sll|srl|sra)\b/i,
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

const memStartInput = document.getElementById("mem-start-input");
const memGoBtn = document.getElementById("mem-go-btn");
const memView = document.getElementById("memory-view");

const MEM_CHUNK_SIZE = 128; // 128 bytes at a time max

function getSafeChar(code) {
  if (code >= 32 && code <= 126) {
    return String.fromCharCode(code);
  }

  return ".";
}

function updateMemoryView(highlightAddr = null, highlightSize = 0) {
  if (!cpu || !wasmReady || !memView) return;

  // get address
  let addrStr = memStartInput ? memStartInput.value : "0x10000000";
  let startAddr = parseInt(addrStr, 16);

  // default to 0x10000000 if input is empty or garbage (NaN)
  if (isNaN(startAddr)) {
    startAddr = 0x10000000;
  }

  // fix go button so check if number type
  if (typeof highlightAddr === 'number') {
      const rowStart = Math.floor(highlightAddr / 16) * 16;
      startAddr = rowStart;
      
      if (memStartInput) {
        memStartInput.value = "0x" + startAddr.toString(16).toUpperCase();
      }
  }

  // read memory
  let bytes;
  try {
    bytes = cpu.get_memory(startAddr, MEM_CHUNK_SIZE || 128);
  } catch (e) {
    console.error("Memory read error:", e);
    return;
  }

  // render
  let html = "";
  
  for (let i = 0; i < bytes.length; i += 16) {
    const currentAddr = startAddr + i;
    const slice = bytes.subarray(i, i + 16);

    const addrFmt = "0x" + currentAddr.toString(16).toUpperCase().padStart(8, "0");

    let hexFmt = "";
    let asciiFmt = "";

    for (let j = 0; j < 16; j++) {
      const byteAddr = currentAddr + j;
      let classStr = "byte-val";

      if (typeof highlightAddr === 'number' && 
          byteAddr >= highlightAddr && 
          byteAddr < highlightAddr + highlightSize) {
            
        classStr += " mem-highlight";
      }

      if (j < slice.length) {
        const val = slice[j];
        hexFmt += `<span class="${classStr}">${val.toString(16).toUpperCase().padStart(2, "0")}</span> `;
        asciiFmt += getSafeChar(val);
      } else {
        hexFmt += "   "; 
      }
      if (j === 7) hexFmt += " "; 
    }

    html += `
      <div class="mem-row">
        <span class="m-addr">${addrFmt}</span>
        <span class="m-hex">${hexFmt}</span>
        <span class="m-ascii">${asciiFmt}</span>
      </div>
    `;
  }
  
  memView.innerHTML = html;
}

if (memGoBtn) {
  memGoBtn.addEventListener("click", () => updateMemoryView());
}

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
  updateMemoryView();

  if (cpu && wasmReady) {
    updateWidgets(cpu.get_mmio_state());
    console.log("MMIO state:", cpu.get_mmio_state());
  } else {
    updateWidgets({});
  }
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

  // Re-apply initial values since load_source resets the CPU
  if (currentLabData) {
    applyInitialValues(currentLabData);
  }

  cpu.set_breakpoints(Array.from(breakpoints));
  highlightCurrentLine();
  updateWidgets(cpu.get_mmio_state());

  return true;
}

function handleWasmResult(result, { fromRun = false } = {}) {
  // Support both result formats (raw registers or snapshot object)
  const rawRegs = (result && result.snapshot && result.snapshot.registers) || 
                  (result && result.registers) || {};
                  
  const allRegs = coerceRegs(rawRegs);
  const tabRegs = filterForTab(allRegs, lastRegs);
  paintRegisters(tabRegs);

  // handle memory read/write
  let hlAddr = null;
  let hlSize = 0;

  if (result && result.snapshot && 
      typeof result.snapshot.memory_access_addr === 'number') {
      
      hlAddr = result.snapshot.memory_access_addr;
      hlSize = result.snapshot.memory_access_size || 4;
  }

  updateMemoryView(hlAddr, hlSize);

  if (cpu && wasmReady) {
    updateWidgets(cpu.get_mmio_state());
    console.log("MMIO state:", cpu.get_mmio_state());
  }

  if (result && result.error) {
    // we have some kind of status / error string
    if (result.error === "Termination") {
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
      log("\n--- Hit Breakpoint ---");
      highlightCurrentLine();
      isProgramLoaded = true;
      if (stepBtn) stepBtn.disabled = false;
      if (runBtn) runBtn.disabled = false;

    } else {
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

function updateWidgets(mmioMap) {
  const widgetsDiv = document.getElementById("widgets");
  if (!widgetsDiv) return;

  let entries = [];
  if (mmioMap instanceof Map) {
    entries = Array.from(mmioMap.entries());
  } else if (Array.isArray(mmioMap)) {
    entries = mmioMap;
  } else if (mmioMap && typeof mmioMap === "object") {
    entries = Object.entries(mmioMap);
  }

  if (entries.length === 0) {
    widgetsDiv.innerHTML = `<div style="padding:15px; color:#aaa; font-size:11px; text-align:center;">No active MMIO peripherals</div>`;
    return;
  }

  let html = "";
  for (const [addrKey, device] of entries) {
    const address = typeof addrKey === "string" ? parseInt(addrKey, 10) : addrKey;
    const hexAddr = "0x" + address.toString(16).toUpperCase();

    if (device && device.type === "Led") {
      const isOn = (device.data?.value ?? 0) !== 0;
      const colorInt = device.data?.color ?? 0x00FF00; 
      const colorHex = colorInt.toString(16).toUpperCase().padStart(6, "0");
      
      const dotColor = isOn ? `#${colorHex}` : "#444444";
      const glow = isOn ? `0 0 8px #${colorHex}AA` : "inset 0 1px 2px rgba(0,0,0,0.5)";

      html += `
        <div class="widget-item">
          <div class="led-status-dot" style="background: ${dotColor}; box-shadow: ${glow};"></div>
          
          <div class="widget-main">
            <span class="widget-label">LED Indicator</span>
            <span class="widget-meta">${hexAddr}</span>
          </div>

          <div class="widget-right">
            <span class="hex-chip" style="color: ${isOn ? `#${colorHex}` : '#888'};">#${colorHex}</span>
            <span class="status-text" style="color: ${isOn ? '#2e7d32' : '#757575'};">
              ${isOn ? "ACTIVE" : "OFF"}
            </span>
          </div>
        </div>
      `;
    }
  }

  widgetsDiv.innerHTML = html;
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