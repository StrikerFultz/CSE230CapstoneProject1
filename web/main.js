import init, { WasmCPU } from "./pkg/mips_emu_wasm.js";
import { LESSONS } from "./lessons.js";

const consoleOut   = document.getElementById("console-output");
const runBtn       = document.getElementById("run");
const stepBtn      = document.getElementById("step");
const stopBtn      = document.getElementById("stop");
const registersDiv = document.getElementById("registers");
const codeEl       = document.querySelector(".assembler textarea");

// lesson underlined in hedder
const lessonContainer = document.getElementById("lesson-container");
const lessonTitle     = document.getElementById("lesson-title");
const lessonBody      = document.getElementById("lesson-body");
const lessonHide      = document.getElementById("lesson-hide");
const fileItems       = document.querySelectorAll(".file-item");

function showLesson(id) {
  const data = LESSONS[id];
  if (!data) return;
  lessonTitle.textContent = data.title;
  lessonBody.innerHTML = data.html;
  lessonContainer.classList.remove("hidden");
  //keeps page stable (scrolls to top so can see lesson when u click on lab)
  window.scrollTo({ top: 0, behavior: "smooth" });
}

fileItems.forEach((item) => {
  item.addEventListener("click", () => showLesson(item.dataset.lesson));
});

lessonHide.addEventListener("click", () => {
  lessonContainer.classList.add("hidden");
});

//emultor stuff
function log(msg) {
  consoleOut.textContent += msg + "\n";
  consoleOut.scrollTop = consoleOut.scrollHeight;
}

function toNumber(v) {
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v);
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
}
function hex32(n) {
  return "0x" + toNumber(n).toString(16).toUpperCase().padStart(8, "0");
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

let lastRegs = {};
const INTERESTING = /^\$(?:s[0-7]|t[0-9]|a[0-3]|v[0-1])$/i; //show in tab
const SYSTEM      = /^\$(?:zero|gp|sp|fp|ra|at|k0|k1)$/i; //hide unless changed

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
      if (changed) out[name] = now; //only if modified vs previous
      continue;
    }
    //other regs show only if nonzero or changed
    if (nonZero || changed) out[name] = now;
  }
  return out;
}

function paintRegisters(regObj) {
  const entries = Object.entries(regObj).sort(([a], [b]) => a.localeCompare(b));
  if (!entries.length) {
    registersDiv.innerHTML = "<p>(no relevant registers changed)</p>";
    return;
  }
  let html = `
    <table class="reg-table">
      <thead>
        <tr><th>Register</th><th>Base 10</th><th>Base 16</th></tr>
      </thead><tbody>
  `;
  for (const [r, v] of entries) {
    html += `<tr><td class="reg-name">${r}</td><td>${toNumber(v)}</td><td>${hex32(
      v
    )}</td></tr>`;
  }
  html += "</tbody></table>";
  registersDiv.innerHTML = html;
}

await init();

CodeMirror.defineSimpleMode("mips-custom", {
  start: [
    // main instructions that we want to highlight
    {regex: /(?:add|addu|addi|addiu|sub|subu|li|sw|lw|j|jal|jr|or|ori|and|andi|beq|bne)\b/i, token: "keyword"},

    {regex: /\$(?:zero|at|v[01]|a[0-3]|t[0-9]|s[0-7]|k[01]|gp|sp|fp|ra)\b/, token: "variable-2"},
    {regex: /#.*/, token: "comment"},
    {regex: /0x[0-9a-fA-F]+|-?\d+/, token: "number"},
    {regex: /\.(?:data|text|globl|asciiz|word|space|align|extern)/, token: "meta"},
    {regex: /[a-zA-Z_]\w*:/, token: "tag"},
    {regex: /"(?:[^\\]|\\.)*?"/, token: "string"},
  ],
});

const cpuEditor = CodeMirror.fromTextArea(codeEl, {
  lineNumbers: true, 
  mode: "mips-custom", 
  theme: "default",
  autoCloseBrackets: true,
});

const cpu = new WasmCPU();
let isProgramLoaded = false;

function resetEmulator() {
  cpu.reset();
  consoleOut.textContent = "Ready to load program.\n";
  paintRegisters({});
  lastRegs = {};
  isProgramLoaded = false;
  stepBtn.disabled = false;
  runBtn.disabled = false;
}

function loadProgram() {
  consoleOut.textContent = "Loading program...\n";
  paintRegisters({}); //clear old registers
  lastRegs = {};

  const src = cpuEditor.getValue() || "";
  const result = cpu.load_source(src);

  if (result.error) {
    log(result.error);
    isProgramLoaded = false;
    return false;
  }

  log("Program loaded successfully.");
  isProgramLoaded = true;
  return true;
}

// used to display the registers or step over an instruction
function handleWasmResult(result, isStep = false) {
  const rawRegs = result?.snapshot?.registers ?? null;
  const allRegs = coerceRegs(rawRegs);
  const tabRegs = filterForTab(allRegs, lastRegs);

  //only shows nes reg in tab
  paintRegisters(tabRegs);

  if (result.error) {
    if (result.error === "Termination") {
      log("\n--- Program Finished ---");
      
      //for the console to show all
      log("All Registers (decimal + hex):");
      log("--------------------------------");
      for (const [r, v] of Object.entries(allRegs).sort(([a], [b]) =>
        a.localeCompare(b)
      )) {
        log(`  ${r}: ${fmt(v)}`);
      }
      isProgramLoaded = false;
      stepBtn.disabled = true;
      runBtn.disabled = true;
    } else {
      log(`\n--- ${result.error} ---`);
      isProgramLoaded = false;
      stepBtn.disabled = true;
      runBtn.disabled = true;
    }
  } else if (isStep) {

  }

  lastRegs = allRegs; //baseline for next run
}

runBtn.addEventListener("click", async () => {
  if (!isProgramLoaded) {
    if (!loadProgram()) {
      return;
    }
  }

  log("Running program...");
  await new Promise(requestAnimationFrame);
  
  const result = cpu.run();
  handleWasmResult(result, false);
});

stepBtn.addEventListener("click", async () => {
  if (!isProgramLoaded) {
    if (!loadProgram()) {
      return;
    }
    handleWasmResult({ snapshot: { registers: lastRegs } }, true);
  }

  const nextInsn = cpu.next_instruction();
  if (nextInsn === "---" && isProgramLoaded) {
    log("\n--- Program Finished ---");
    isProgramLoaded = false;
    stepBtn.disabled = true;
    runBtn.disabled = true;
    return;
  }
  log(`\n${nextInsn}`);

  await new Promise(requestAnimationFrame);

  const result = cpu.step();
  handleWasmResult(result, true);
});

stopBtn.addEventListener("click", () => {
  resetEmulator();
});

log("MIPS Emulator Initialized. Ready to load program.");