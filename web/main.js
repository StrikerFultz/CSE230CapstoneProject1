import init, { WasmCPU } from "./pkg/mips_emu_wasm.js";
import { LESSONS } from "./lessons.js";


const consoleOut   = document.getElementById("console-output");
const runBtn       = document.getElementById("run");
const registersDiv = document.getElementById("registers");
const codeEl       = document.querySelector(".assembler textarea");

// lesson underlined in hedder
const lessonContainer = document.getElementById("lesson-container");
const lessonTitle = document.getElementById("lesson-title");
const lessonBody  = document.getElementById("lesson-body");
const lessonHide  = document.getElementById("lesson-hide");
const fileItems   = document.querySelectorAll(".file-item");

function showLesson(id) {
  const data = LESSONS[id];
  if (!data) return;
  lessonTitle.textContent = data.title;
  lessonBody.innerHTML = data.html;
  lessonContainer.classList.remove("hidden");
  //keeps page stable (scrolls to top so can see lesson when u click on lab)
  window.scrollTo({ top: 0, behavior: "smooth" });
}

fileItems.forEach(item => {
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
  if (Array.isArray(raw))  return Object.fromEntries(raw);
  if (typeof raw === "object") return raw;
  return {};
}

let lastRegs = {};
const INTERESTING = /^\$(?:s[0-7]|t[0-9]|a[0-3]|v[0-1])$/i;//show in tab
const SYSTEM      = /^\$(?:zero|gp|sp|fp|ra|at|k0|k1)$/i;//hide unless changed

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
  const entries = Object.entries(regObj).sort(([a],[b]) => a.localeCompare(b));
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
    html += `<tr><td class="reg-name">${r}</td><td>${toNumber(v)}</td><td>${hex32(v)}</td></tr>`;
  }
  html += "</tbody></table>";
  registersDiv.innerHTML = html;
}

await init();
const cpu = new WasmCPU();

runBtn.addEventListener("click", async () => {
  consoleOut.textContent = "Running program...\n";
  paintRegisters({}); //clear old registers
  await new Promise(requestAnimationFrame);

  const src = codeEl.value || "";
  

  let result;
  try {
    result = cpu.run_program(src);
  } catch (e) {
    log("Runtime error: " + e);
    return;
  }

  const rawRegs =
    result?.snapshot?.registers ??
    result?.registers ??
    result?.cpu?.registers ??
    null;

  const allRegs  = coerceRegs(rawRegs);
  const tabRegs  = filterForTab(allRegs, lastRegs);

  //for the console to show all
  log("Program finished successfully!");
   log("");
  log("All Registers (decimal + hex):");
   log("--------------------------------");
  for (const [r, v] of Object.entries(allRegs).sort(([a],[b]) => a.localeCompare(b))) {
    log(`  ${r}: ${fmt(v)}`);
  }

  //only shows nes reg in tab
  paintRegisters(tabRegs);

  lastRegs = allRegs; //baseline for next run
});
