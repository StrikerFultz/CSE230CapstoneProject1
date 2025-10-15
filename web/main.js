import init, { WasmCpu } from "./pkg/mips_emu_wasm.js"; 

const wasm = await init();
const cpu = new WasmCpu();

const lineEl = document.getElementById("line");
const outEl = document.getElementById("out");

document.getElementById("run").onclick = () => {
  const json = cpu.execute_line(lineEl.value || "");
  const state = JSON.parse(json);
  outEl.textContent = JSON.stringify(state.registers, null, 2);
};