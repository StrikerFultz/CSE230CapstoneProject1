use std::io::{self, Write};
use mips_emu_wasm::{CPU, execute_line};

fn main() {
    let mut cpu = CPU::new();
    // let mut memory = Memory::new(); // Initialize memory module
    // memory.set_word(0x00400000, 42); // Example usage of memory module
    // let val = memory.get_word(0x00400000);
    // println!("Memory at 0x00400000: {}", val);

    loop {
        print!("> ");
        io::stdout().flush().unwrap();

        let mut input = String::new();
        if io::stdin().read_line(&mut input).is_err() {
            break;
        }
        
        let line = input.trim();
        if line == "exit" {
            break;
        }

        execute_line(&mut cpu, line);
        cpu.print_registers();
    }
}
