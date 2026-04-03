import init, { WasmCPU } from "./pkg/mips_emu_wasm.js";

const API_BASE = '/api';

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

// ─── WASM + CPU ───

let cpu = null;
let wasmReady = false;
let isProgramLoaded = false;
let lastRegs = {};
let allRegsSnapshot = {};

// ─── CodeMirror MIPS mode ───

CodeMirror.defineSimpleMode("mips-custom", {
  start: [
    {
      regex: /(?:add|addu|addi|addiu|sub|subu|li|sw|lw|sb|lb|sh|lh|lui|la|j|jal|jr|or|ori|and|andi|beq|bne|slt|slti|sltiu|sltu|blt|bgt|ble|bge|move|mult|multu|mflo|mfhi|xor|xori|div|divu|nor|sll|srl|sra)\b/i,
      token: "keyword",
    },
    {
      regex: /\$(?:zero|at|v[01]|a[0-3]|t[0-9]|s[0-7]|k[01]|gp|sp|fp|ra)\b/,
      token: "variable-2",
    },
    { regex: /#.*/, token: "comment" },
    { regex: /0x[0-9a-fA-F]+|-?\d+/, token: "number" },
    { regex: /\.(?:data|text|globl|asciiz|word|space|align|extern)/, token: "meta" },
    { regex: /[a-zA-Z_]\w*:/, token: "tag" },
    { regex: /"(?:[^\\]|\\.)*?"/, token: "string" },
  ],
});

const codeEl = document.getElementById("tg-code");
const cmEditor = CodeMirror.fromTextArea(codeEl, {
  lineNumbers: true,
  mode: "mips-custom",
  theme: "default",
  gutters: ["CodeMirror-linenumbers", "breakpoints"],
});

// ─── DOM refs ───

const labSelect     = document.getElementById('tg-lab-select');
const tcNameEl      = document.getElementById('tg-tc-name');
const tcPointsEl    = document.getElementById('tg-tc-points');
const tcHiddenEl    = document.getElementById('tg-tc-hidden');
const runBtn        = document.getElementById('tg-run');
const stepBtn       = document.getElementById('tg-step');
const stopBtn       = document.getElementById('tg-stop');
const runStatus     = document.getElementById('tg-run-status');
const consoleOut    = document.getElementById('tg-console-output');
const resultRegsEl  = document.getElementById('tg-result-regs');
const selectAllBtn  = document.getElementById('tg-select-all-regs');
const memAddrInput  = document.getElementById('tg-mem-addr');
const memGoBtn      = document.getElementById('tg-mem-go');
const memViewEl     = document.getElementById('tg-mem-view');
const capturedMemEl = document.getElementById('tg-captured-mem');
const saveBtn       = document.getElementById('tg-save');
const loadStarterBtn = document.getElementById('tg-load-starter');

let labsCache = {};

// ─── Helpers ───

function log(msg) {
  if (!consoleOut) return;
  consoleOut.textContent += msg + "\n";
  consoleOut.scrollTop = consoleOut.scrollHeight;
}

function hex32(n) {
  return "0x" + ((n >>> 0).toString(16).toUpperCase().padStart(8, "0"));
}

function toNumber(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'bigint') return Number(v);
  return Number(v) || 0;
}

function coerceRegs(raw) {
  if (!raw) return {};
  if (raw instanceof Map) return Object.fromEntries(raw);
  if (Array.isArray(raw)) return Object.fromEntries(raw);
  if (typeof raw === 'object') return raw;
  return {};
}

// Key-value row helpers (shared with teacher page pattern)
function addKVRow(containerId, keyPH, valPH, keyVal, valVal) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'tc-kv-row';
  row.innerHTML = `
    <input placeholder="${keyPH}" value="${keyVal || ''}" />
    <input placeholder="${valPH}" value="${valVal || ''}" />
    <button type="button" class="tc-remove-row" title="Remove">×</button>
  `;
  row.querySelector('.tc-remove-row').addEventListener('click', () => row.remove());
  container.appendChild(row);
}

document.querySelectorAll('.tc-add-row').forEach(btn => {
  btn.addEventListener('click', () => {
    addKVRow(btn.dataset.target, btn.dataset.placeholderKey || 'key', btn.dataset.placeholderVal || 'value', '', '');
  });
});

function readKV(containerId) {
  const container = document.getElementById(containerId);
  const obj = {};
  if (!container) return obj;
  container.querySelectorAll('.tc-kv-row').forEach(row => {
    const inputs = row.querySelectorAll('input');
    const k = inputs[0].value.trim();
    const v = inputs[1].value.trim();
    if (k) { obj[k] = isNaN(Number(v)) ? v : Number(v); }
  });
  return obj;
}

// ─── Lab loader ───

async function loadLabs() {
  try {
    labsCache = await apiRequest('/labs');
    labSelect.innerHTML = '<option value="">— select a lab —</option>';
    Object.entries(labsCache)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([id, data]) => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = `${data.title} (${id})`;
        labSelect.appendChild(opt);
      });
  } catch (err) {
    labSelect.innerHTML = `<option value="">Error loading labs</option>`;
  }
}

// Load starter code from selected lab
if (loadStarterBtn) {
  loadStarterBtn.addEventListener('click', () => {
    const labId = labSelect.value;
    if (!labId || !labsCache[labId]) { alert('Select a lab first.'); return; }
    const code = labsCache[labId].starter_code || '';
    if (!code) { alert('This lab has no starter code.'); return; }
    cmEditor.setValue(code);
    log('Loaded starter code for ' + labId);
  });
}

// ─── Emulator controls ───

function applyInitialValues() {
  if (!cpu || !wasmReady) return;
  const regs = readKV('tg-init-regs');
  const mem  = readKV('tg-init-mem');
  for (const [reg, val] of Object.entries(regs)) {
    try { cpu.set_register(reg, Number(val)); } catch(e) { log(`Warn: ${reg}: ${e.message}`); }
  }
  for (const [addr, val] of Object.entries(mem)) {
    try { cpu.set_memory_word(Number(addr), Number(val)); } catch(e) { log(`Warn: mem[${addr}]: ${e.message}`); }
  }
  if (Object.keys(regs).length || Object.keys(mem).length) {
    log(`Applied ${Object.keys(regs).length} register(s), ${Object.keys(mem).length} memory value(s).`);
  }
}

function resetEmulator() {
  if (cpu && wasmReady) cpu.reset();
  consoleOut.textContent = 'Ready.\n';
  isProgramLoaded = false;
  lastRegs = {};
  allRegsSnapshot = {};
  if (runBtn) runBtn.disabled = false;
  if (stepBtn) stepBtn.disabled = false;
  runStatus.textContent = '';
  resultRegsEl.innerHTML = '<div class="tg-placeholder">Run code to see results</div>';
  memViewEl.innerHTML = '';
}

function loadProgram() {
  if (!cpu || !wasmReady) { log('WASM not ready.'); return false; }
  consoleOut.textContent = 'Loading…\n';
  lastRegs = {};

  const src = cmEditor.getValue() || '';
  const result = cpu.load_source(src);
  if (result && result.error) { log('Load error: ' + result.error); return false; }

  log('Program loaded.');
  isProgramLoaded = true;
  applyInitialValues();
  return true;
}

function handleResult(result, { fromRun = false } = {}) {
  const rawRegs = (result?.snapshot?.registers) || (result?.registers) || {};
  allRegsSnapshot = coerceRegs(rawRegs);

  updateMemView();

  if (result?.error === 'Termination' || fromRun) {
    isProgramLoaded = false;
    if (stepBtn) stepBtn.disabled = true;
    if (runBtn) runBtn.disabled = true;
    runStatus.textContent = '✓ Finished';
    runStatus.style.color = '#2e7d32';

    log('\nProgram finished.');
    renderResultRegisters(allRegsSnapshot);
    return;
  }

  if (result?.error === 'Breakpoint') {
    runStatus.textContent = 'Breakpoint';
    renderResultRegisters(allRegsSnapshot);
    return;
  }

  if (result?.error) {
    isProgramLoaded = false;
    if (stepBtn) stepBtn.disabled = true;
    if (runBtn) runBtn.disabled = true;
    runStatus.textContent = 'Error';
    runStatus.style.color = '#c62828';
    log('Error: ' + result.error);
    renderResultRegisters(allRegsSnapshot);
  }

  lastRegs = allRegsSnapshot;
}

runBtn?.addEventListener('click', async () => {
  if (!wasmReady || !cpu) { log('WASM not ready.'); return; }
  if (!isProgramLoaded) { if (!loadProgram()) return; }
  log('Running…');
  runStatus.textContent = '…';
  runStatus.style.color = '#555';
  await new Promise(requestAnimationFrame);
  const result = cpu.run();
  handleResult(result, { fromRun: true });
});

stepBtn?.addEventListener('click', async () => {
  if (!wasmReady || !cpu) { log('WASM not ready.'); return; }
  if (!isProgramLoaded) { if (!loadProgram()) return; return; }
  const nextInsn = cpu.next_instruction();
  log(nextInsn);
  if (nextInsn === '---') {
    handleResult({ error: 'Termination', snapshot: { registers: lastRegs } });
    return;
  }
  await new Promise(requestAnimationFrame);
  const result = cpu.step();
  handleResult(result);
});

stopBtn?.addEventListener('click', () => resetEmulator());

// ─── Result registers with checkboxes ───

const INTERESTING_RE = /^\$(?:s[0-7]|t[0-9]|a[0-3]|v[0-1])$/i;
const SYSTEM_RE      = /^\$(?:zero|gp|sp|fp|ra|at|k0|k1|lo|hi)$/i;

function renderResultRegisters(regs) {
  if (!resultRegsEl) return;
  const entries = Object.entries(regs).sort(([a], [b]) => a.localeCompare(b));
  if (!entries.length) {
    resultRegsEl.innerHTML = '<div class="tg-placeholder">No register data</div>';
    return;
  }

  let html = `<table class="tg-reg-table">
    <thead><tr><th></th><th>Register</th><th>Decimal</th><th>Hex</th></tr></thead><tbody>`;

  for (const [name, val] of entries) {
    const v = toNumber(val) >>> 0;
    const signed = v > 0x7FFFFFFF ? v - 0x100000000 : v;
    const isZero = v === 0;
    const isSys = SYSTEM_RE.test(name);

    // Pre-check interesting non-zero registers
    const preChecked = (!isSys && !isZero) || INTERESTING_RE.test(name) && !isZero;
    const dimClass = (isSys && isZero) ? 'tg-reg-dim' : '';

    html += `<tr class="${dimClass}">
      <td><input type="checkbox" class="tg-reg-cb" data-reg="${name}" data-val="${v}" ${preChecked ? 'checked' : ''} /></td>
      <td class="reg-name">${name}</td>
      <td>${signed}</td>
      <td style="font-family:monospace;">${hex32(v)}</td>
    </tr>`;
  }

  html += '</tbody></table>';
  resultRegsEl.innerHTML = html;
}

selectAllBtn?.addEventListener('click', () => {
  const cbs = resultRegsEl.querySelectorAll('.tg-reg-cb');
  const allChecked = [...cbs].every(cb => cb.checked);
  cbs.forEach(cb => cb.checked = !allChecked);
  selectAllBtn.textContent = allChecked ? 'Select all' : 'Deselect all';
});

// ─── Memory viewer ───

const MEM_CHUNK = 128;

function updateMemView() {
  if (!cpu || !wasmReady || !memViewEl) return;
  let addrStr = memAddrInput?.value || '0x10000000';
  let startAddr = parseInt(addrStr, 16);
  if (isNaN(startAddr)) startAddr = 0x10000000;

  let bytes;
  try { bytes = cpu.get_memory(startAddr, MEM_CHUNK); } catch(e) { return; }

  let html = '';
  for (let i = 0; i < bytes.length; i += 16) {
    const rowAddr = startAddr + i;
    const slice = bytes.subarray(i, i + 16);
    const addrFmt = '0x' + rowAddr.toString(16).toUpperCase().padStart(8, '0');

    let hexStr = '', asciiStr = '';
    for (let j = 0; j < 16; j++) {
      if (j < slice.length) {
        hexStr += slice[j].toString(16).toUpperCase().padStart(2, '0') + ' ';
        const c = slice[j];
        asciiStr += (c >= 32 && c <= 126) ? String.fromCharCode(c) : '.';
      } else { hexStr += '   '; }
      if (j === 7) hexStr += ' ';
    }

    // Each row is clickable to capture a word
    html += `<div class="mem-row tg-mem-row" data-addr="${rowAddr}">
      <span class="m-addr">${addrFmt}</span>
      <span class="m-hex">${hexStr}</span>
      <span class="m-ascii">${asciiStr}</span>
    </div>`;
  }

  memViewEl.innerHTML = html;

  // Click to capture a memory word
  memViewEl.querySelectorAll('.tg-mem-row').forEach(row => {
    row.addEventListener('click', () => {
      const addr = parseInt(row.dataset.addr);
      if (isNaN(addr)) return;
      // Read the 4-byte word at this address
      try {
        const wordBytes = cpu.get_memory(addr, 4);
        const val = wordBytes[0] | (wordBytes[1] << 8) | (wordBytes[2] << 16) | (wordBytes[3] << 24);
        const uval = val >>> 0;
        addKVRow('tg-captured-mem', '268435456', '0', String(addr), String(uval));
        log(`Captured mem[${addr}] = ${uval} (${hex32(uval)})`);
      } catch(e) {
        log('Could not read memory at ' + addr);
      }
    });
  });
}

memGoBtn?.addEventListener('click', () => updateMemView());

// ─── Collapse inputs ───

const collapseInputsBtn = document.getElementById('btn-collapse-inputs');
const inputsBody = document.getElementById('tg-inputs-body');
if (collapseInputsBtn && inputsBody) {
  collapseInputsBtn.addEventListener('click', () => {
    const collapsed = inputsBody.classList.toggle('collapsed');
    collapseInputsBtn.textContent = collapsed ? 'Show' : 'Hide';
  });
}

// ─── Save test case ───

saveBtn?.addEventListener('click', async () => {
  const labId = labSelect.value;
  if (!labId) { alert('Select a lab first.'); return; }

  const name = tcNameEl.value.trim();
  if (!name) { alert('Enter a test case name.'); return; }

  // Gather selected registers
  const expectedRegs = {};
  resultRegsEl.querySelectorAll('.tg-reg-cb:checked').forEach(cb => {
    expectedRegs[cb.dataset.reg] = Number(cb.dataset.val);
  });

  // Gathered captured memory
  const expectedMem = readKV('tg-captured-mem');

  if (!Object.keys(expectedRegs).length && !Object.keys(expectedMem).length) {
    alert('Select at least one register or memory address to use as expected output.');
    return;
  }

  const payload = {
    test_name: name,
    test_type: 'register',
    points: parseInt(tcPointsEl.value) || 10,
    is_hidden: tcHiddenEl.checked,
    timeout_seconds: 5,
    input_data: {
      registers: readKV('tg-init-regs'),
      memory:    readKV('tg-init-mem'),
    },
    expected_output: {
      registers: expectedRegs,
      memory:    expectedMem,
    },
  };

  try {
    const res = await apiRequest(`/labs/${labId}/test-cases`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    log(`✓ Saved test case "${name}" (${res.test_case_id})`);
    alert(`Test case "${name}" saved to ${labId}!`);
  } catch (err) {
    alert('Failed to save: ' + err.message);
  }
});

// ─── Logout ───

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  try { await apiRequest('/auth/logout', { method: 'POST' }); } catch (_) {}
  window.location.href = 'login.html';
});

// ─── Init ───

(async () => {
  await loadLabs();
})();

init()
  .then(() => {
    cpu = new WasmCPU();
    wasmReady = true;
    log('WASM emulator initialized.');
  })
  .catch((err) => {
    log('Error initializing WASM: ' + err);
  });