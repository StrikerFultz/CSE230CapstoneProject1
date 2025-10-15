mod memory;
use memory::Memory;

use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

//https://github.com/insou22/mipsy partial code used since its a rough outline of the code 
// only li add and sub; shows register history as lineis entered (as changed) 

#[derive(Serialize, Deserialize, Default)]
pub struct Snapshot {
    pub registers: HashMap<String, i32>,
}

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
        registers.insert("$sp".to_string(), 0); // Stack Pointer

        CPU { registers, memory: Memory::new() }
    }

    fn get_reg(&self, name: &str) -> i32 {
        *self.registers.get(name).unwrap_or(&0)
    }

    fn set_reg(&mut self, name: &str, value: i32) {
        self.registers.insert(name.to_string(), value);
    }

    fn add(&mut self, dest: &str, src1: &str, src2: &str) {
        self.set_reg(dest, self.get_reg(src1) + self.get_reg(src2));
    }

    fn addi(&mut self, dest: &str, src: &str, imm: i32) {
        self.set_reg(dest, self.get_reg(src) + imm);
    }

    fn sub(&mut self, dest: &str, src1: &str, src2: &str) {
        self.set_reg(dest, self.get_reg(src1) - self.get_reg(src2));
    }

    fn li(&mut self, dest: &str, imm: i32) {
        self.set_reg(dest, imm);
    }
    
    fn sw(&mut self, src: &str, address: u32) {
        self.memory.set_word(address, self.get_reg(src));
    }

    fn lw(&mut self, dest: &str, address: u32) {
        let val = self.memory.load_word(address);
        self.set_reg(dest, val);
    }

    fn print_registers(&self) {
        let regs = ["$t0", "$t1", "$t2"];
        for r in regs {
            let val = self.get_reg(r);

            print!("{}: {}  ", r, val);
        }
        println!();
    }

    pub fn snapshot(&self) -> Snapshot {
        Snapshot { registers: self.registers.clone() }
    }
}

fn execute_line(cpu: &mut CPU, line: &str) {
    let cleaned = line.replace(",", "");
    let parts: Vec<&str> = cleaned.split_whitespace().collect();
    if parts.is_empty() { return; }

    match parts[0] {
        "add" => cpu.add(parts[1], parts[2], parts[3]),
        "addi" => cpu.addi(parts[1], parts[2], parts[3].parse().unwrap_or(0)),
        "sub" => cpu.sub(parts[1], parts[2], parts[3]),
        "li"  => {
            if let Ok(imm) = parts[2].parse::<i32>() {
                cpu.li(parts[1], imm);
            } else {
                println!("Invalid immediate: {}", parts[2]);
            }
        }
        "sw" => cpu.sw(parts[1], parts[2].parse().unwrap_or(0)),
        "lw" => cpu.lw(parts[1], parts[2].parse().unwrap_or(0)),
        _ => println!("Unknown instruction: {}", parts[0]),
    }
}

#[wasm_bindgen]
pub struct WasmCpu {
    inner: CPU
}

#[wasm_bindgen]
impl WasmCpu {
    #[wasm_bindgen(constructor)]
    pub fn new() -> WasmCpu {
        WasmCpu { inner: CPU::new() }
    }

    #[wasm_bindgen]
    pub fn execute_line(&mut self, line: &str) -> String {
        execute_line(&mut self.inner, line);
        let snap = self.inner.snapshot();

        serde_json::to_string(&snap).unwrap()
    }

    #[wasm_bindgen]
    // we want to print out values on the web browser so we'll serialize it to JSON using Serde 
    pub fn registers_json(&self) -> JsValue {
        serde_wasm_bindgen::to_value(&self.inner.snapshot()).unwrap()
    }
}