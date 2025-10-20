use std::io::{self, Write};
use mips_emu_wasm::{CPU, Program};

fn main() {
    let mut cpu = CPU::new();

    println!("Type MIPS instructions below. Specify 'exit' to finish.\n");

    let mut source = String::new();

    loop {
        let mut line = String::new();
        if io::stdin().read_line(&mut line).is_err() {
            break;
        }

        if line.trim() == "exit" {
            break;
        }

        source.push_str(&line);
    }

    match Program::parse(&source) {
        Ok(program) => cpu.load_program(program),
        Err(e) => print!("Syntax Error -- {:?}", e),
    }

    if let Err(e) = cpu.run() {
        print!("Runtime Error -- {:?}", e);
    }
}
