// Modules
mod memory;

// Structs
use memory::Memory;

use std::collections::HashMap;

// partial base from https://github.com/insou22/mipsy (simplified HLE example)
// updated version adds negative support + addi/subi instructions
// added subi,addi, addui, subiu but they only work with decimal values NOT hex 
// // canimplemtn if needed by instructor 

struct CPU {
    registers: HashMap<String, i32>,
    memory: Memory, // simple memory: address -> value
}

impl CPU {
    fn new() -> Self {
        let mut registers = HashMap::new();
        // initialize registers
        registers.insert("$t0".to_string(), 0);
        registers.insert("$t1".to_string(), 0);
        registers.insert("$t2".to_string(), 0);
        CPU { registers, memory: HashMap::new() }
    }

    fn add(&mut self, dest: &str, src1: &str, src2: &str) {
        let val1 = *self.registers.get(src1).unwrap_or(&0);
        let val2 = *self.registers.get(src2).unwrap_or(&0);
        self.registers.insert(dest.to_string(), val1 + val2);
    }

    fn sub(&mut self, dest: &str, src1: &str, src2: &str) {
        let val1 = *self.registers.get(src1).unwrap_or(&0);
        let val2 = *self.registers.get(src2).unwrap_or(&0);
        self.registers.insert(dest.to_string(), val1 - val2);
    }

    fn subi(&mut self, dest: &str, src: &str, imm: i32) {
        let val = *self.registers.get(src).unwrap_or(&0);
        self.registers.insert(dest.to_string(), val - imm);
    }

    fn subiu(&mut self, dest: &str, src: &str, imm: i32) {
        let val = *self.registers.get(src).unwrap_or(&0);
        self.registers.insert(dest.to_string(), val.wrapping_sub(imm));
    }

    fn li(&mut self, dest: &str, imm: i32) {
        self.registers.insert(dest.to_string(), imm);
    }


    fn print_registers(&self) {
        let regs = ["$t0", "$t1", "$t2"];
        for r in regs {
            let val = self.registers.get(r).unwrap_or(&0);
            print!("{}: {}  ", r, val);
        }
        println!();
    }
}

fn execute_line(cpu: &mut CPU, line: &str) {
    let cleaned = line.replace(",", "");
    let parts: Vec<&str> = cleaned.split_whitespace().collect();
    if parts.is_empty() {
        return;
    }

    match parts[0] {
        "add" => cpu.add(parts[1], parts[2], parts[3]),
        "addi" => cpu.addi(parts[1], parts[2], parts[3].parse().unwrap_or(0)),
        "sub" => cpu.sub(parts[1], parts[2], parts[3]),
        "li" => {
            if let Ok(imm) = parts[2].parse::<i32>() {
                cpu.li(parts[1], imm);
            } else {
                println!("Invalid immediate: {}", parts[2]);
            }
        }
        _ => println!("Unknown instruction: {}", parts[0]),
    }
}

use std::io::{self, Write};

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
