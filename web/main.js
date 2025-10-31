import init, { WasmEmulator } from "./pkg/mips_emu_wasm.js";

async function main() {
  await init();
  
  const emulator = new WasmEmulator(); 

  const codeEl = document.getElementById("code");
  const outEl = document.getElementById("out");
  const runBtn = document.getElementById("run");

  runBtn.onclick = () => {
    const sourceCode = codeEl.value;
    
    const result = emulator.run_program(sourceCode); 

    if (result.error) {
      outEl.textContent = result.error;
    } else if (result.snapshot) {
      const regs = Object.fromEntries(result.snapshot.registers);
      outEl.textContent = JSON.stringify(regs, null, 2);
    } else {
      outEl.textContent = "Failure.";
    }
  }; 
}

main();