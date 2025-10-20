use serde::{Serialize, Deserialize};
use std::collections::HashMap;

use crate::instruction::Instruction;
use crate::program::Program;
use crate::memory::Memory;

pub struct CPU { 
    // processor state 
    registers: HashMap<String, i32>,
    pc: usize,

    // program + memory
    program: Option<Program>,
    memory: Memory, 
}

// serialize registers to JSON for debug logging 
#[derive(Serialize, Deserialize, Default)]
pub struct Snapshot {
    pub registers: HashMap<String, i32>,
}

impl CPU {
    pub fn new() -> Self {
        let mut registers = HashMap::new();

        // initialize registers
        registers.insert("$t0".to_string(), 0);
        registers.insert("$t1".to_string(), 0);
        registers.insert("$t2".to_string(), 0);
        registers.insert("$sp".to_string(), 0); // Stack Pointer

        CPU { registers, pc: 0, program: None, memory: Memory::new() }
    }

    pub fn get_reg(&self, name: &str) -> i32 {
        *self.registers.get(name).unwrap_or(&0)
    }

    pub fn set_reg(&mut self, name: &str, value: i32) {
        self.registers.insert(name.to_string(), value);
    }

    pub fn add(&mut self, dest: &str, src1: &str, src2: &str) {
        self.set_reg(dest, self.get_reg(src1) + self.get_reg(src2));
    }

    pub fn addi(&mut self, dest: &str, src: &str, imm: i32) {
        self.set_reg(dest, self.get_reg(src) + imm);
    }

    pub fn addiu(&mut self, dest: &str, src: &str, imm: i32) {
        self.set_reg(dest, self.get_reg(src) + imm);
    }

    pub fn sub(&mut self, dest: &str, src1: &str, src2: &str) {
        self.set_reg(dest, self.get_reg(src1) - self.get_reg(src2));
    }

    pub fn subi(&mut self, dest: &str, src: &str, imm: i32) {
        self.set_reg(dest, self.get_reg(src) - imm);
    }

    pub fn subiu(&mut self, dest: &str, src: &str, imm: i32) {
        self.set_reg(dest, self.get_reg(src) - imm);
    }

    pub fn li(&mut self, dest: &str, imm: i32) {
        self.set_reg(dest, imm);
    }
    
    pub fn sw(&mut self, src: &str, address: u32) {
        self.memory.set_word(address, self.get_reg(src));
    }

    pub fn lw(&mut self, dest: &str, address: u32) {
        let val = self.memory.load_word(address);
        self.set_reg(dest, val);
    }

    pub fn print_registers(&self) {
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

    pub fn load_program(&mut self, program: Program) {
        self.program = Some(program);
        self.pc = 0;
    }
}