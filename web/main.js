import init, { MIPSProgram } from "./pkg/mips_emu_wasm.js"; 


async function main(){
  await init(); // for WASM
  const mips = new MIPSProgram();
  // const cpu = mips.cpu;

  const codeEl = document.getElementById("code");
  const outEl = document.getElementById("out");
  const runBtn = document.getElementById("run");

  let lastLineCount = 0;

  runBtn.onclick = async () => {
    outEl.textContent = "";
    const lines = codeEl.value.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const newLines = lines.slice(lastLineCount);
    lastLineCount = lines.length;

    let state;

    const json = mips.assemble(codeEl.value);
    const error = json.error;
    const jsonData = json.tokens;
    console.log(json);
    alert(jsonData[0]);
    // const json = JSON.parse(jsonString);
    // console.log(json);
    console.log(jsonData[0].token_type);
    outEl.textContent = "Error: " + error + "\n\nTokens:\n";
    let line_num = 1;
    for (const obj of jsonData) {
      if (obj.line_number !== line_num) {
        outEl.textContent += "\n";
      }
      outEl.textContent += obj.token_type + " ";
      line_num = obj.line_number;
    }

    // for (const line of newLines) {
    //   const json = mips.execute_line(line);
    //   state = JSON.parse(json);
    //   outEl.textContent = JSON.stringify(state.registers, null, 2);

    //   await new Promise(r => setTimeout(r,800)); // delay so see updates
    // }


  }; 
}

main();

