use std::io::{self, Write};
use mips_emu_wasm::{CPU, execute_line};

fn main() {
    let mut cpu = CPU::new();
    // let mut memory = Memory::new(); // Initialize memory module
    // memory.set_word(0x00400000, 42); // Example usage of memory module
    // let val = memory.get_word(0x00400000);
    // println!("Memory at 0x00400000: {}", val);

    println!("MIPS Emulator started! Type MIPS instructions below.");
    println!("Type 'exit' to quit.\n");

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

        let lines: Vec<&str> = trimmed
        .split('/n') // can handle new or empty lines
        .flat_map(|s| s.split(';')) // this is for lines seperated by ;
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .collect();

        for line in lines {
            execute_line(&mut cpu, line);
            print!("Executed: {}\n", line);
            cpu.print_registers();
        }
        
    }
}
