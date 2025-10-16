import init, { WasmCpu } from "./pkg/mips_emu_wasm.js"; 


async function main(){
  await init(); // for WASM
  const cpu = new WasmCpu();

  const codeEl = document.getElementById("code");
  const outEl = document.getElementById("out");
  const runBtn = document.getElementById("run");

  let lastLineCount = 0;

  runBtn.onclick = async () => {
    const lines = codeEl.value.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const newLines = lines.slice(lastLineCount);
    lastLineCount = lines.length;

    let state;

    for (const line of newLines) {
      const json = cpu.execute_line(line);
      state = JSON.parse(json);
      outEl.textContent = JSON.stringify(state.registers, null, 2);

      await new Promise(r => setTimeout(r,800)); // delay so see updates
    }
  }; 
}

main();

