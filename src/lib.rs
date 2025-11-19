pub mod assembler;
pub mod cpu;
pub mod instruction;
pub mod lexer;
pub mod memory;
pub mod parser;
pub mod program;

use cpu::CPU;
use program::Program;
use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

use std::collections::HashMap;
use program::EmuError;


//https://github.com/insou22/mipsy partial code used since its a rough outline of the code 
// only li add and sub; shows register history as lineis entered (as changed) 

#[derive(Serialize, Deserialize, Default)]
pub struct Snapshot {
    pub registers: HashMap<String, u32>,
}

#[derive(Serialize, Deserialize)]
pub struct WasmResult {
    error: String,
    snapshot: Option<Snapshot>,
}

#[wasm_bindgen]
pub struct WasmCPU {
    cpu: CPU,
}

#[wasm_bindgen]
impl WasmCPU {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            cpu: CPU::new(),
        }
    }
//added a reset method so it lets the frontend reset the emulator without remaking the WasmCPU
    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.cpu.reset()
    }

    //loads t he strings in mips source code as a program(resets the cpu before loading the new program)
    #[wasm_bindgen]
    pub fn load_source(&mut self, source: &str) -> JsValue {
        self.cpu.reset();

        // parse the program then run using provided code from HTML
        match Program::parse(source, &mut self.cpu.memory) {
            Ok(program) => {
                self.cpu.load_program(program);
                //added in 2nd file the old one just did "self.cpu.load_program(program);"
                serde_wasm_bindgen::to_value(&WasmResult {
                    error: String::new(),
                    snapshot: None
                }).unwrap()
            },
            Err(e) => {
                serde_wasm_bindgen::to_value(&WasmResult {
                    error: format!("Syntax Error -- {:?}", e),
                    snapshot: None
                }).unwrap()
            }
        }
    }

    #[wasm_bindgen]
    pub fn set_breakpoints(&mut self, lines: Vec<usize>) {
        self.cpu.set_breakpoints(lines);
    }

    //emulate a single instruction using the MIPS CPU
    #[wasm_bindgen]
    pub fn step(&mut self) -> JsValue {
        match self.cpu.next() {
            Ok(_) => {
                let snap = self.cpu.snapshot();

                serde_wasm_bindgen::to_value(&WasmResult {
                    error: String::new(),
                    snapshot: Some(snap),
                }).unwrap()
            }
            Err(EmuError::Termination) => {
                serde_wasm_bindgen::to_value(&WasmResult {
                    error: "Termination".to_string(),
                    snapshot: Some(self.cpu.snapshot()),
                }).unwrap()
            },
            Err(EmuError::Breakpoint) => {  
                serde_wasm_bindgen::to_value(&WasmResult {
                    error: "Breakpoint".to_string(),
                    snapshot: Some(self.cpu.snapshot()),
                }).unwrap()
            }
            Err(e) => {
                serde_wasm_bindgen::to_value(&WasmResult {
                    error: format!("Runtime Error -- {:?}", e),
                    snapshot: Some(self.cpu.snapshot()),
                }).unwrap()
            }
        }
    }

    //emulate the entire source using the CPU
    #[wasm_bindgen]
    pub fn run(&mut self) -> JsValue {
        match self.cpu.run() {
            Ok(_) => {
                let snapshot = self.cpu.snapshot();
                serde_wasm_bindgen::to_value(&WasmResult {
                    error: "Termination".to_string(),
                    snapshot: Some(snapshot)
                }).unwrap()
            },
            Err(EmuError::Breakpoint) => {
                serde_wasm_bindgen::to_value(&WasmResult {
                    error: "Breakpoint".to_string(),
                    snapshot: Some(self.cpu.snapshot()),
                }).unwrap()
            }
            Err(e) => {
                serde_wasm_bindgen::to_value(&WasmResult {
                    error: format!("Runtime Error -- {:?}", e),
                    snapshot: Some(self.cpu.snapshot()),
                })
                .unwrap()
            }
        }
    }

    /// returns next instruction to be emulated as a string 
    /// this is to provide some additional context in the console (although could be replaced with just $PC register)
    #[wasm_bindgen]
    pub fn next_instruction(&self) -> String {
        let pc = self.cpu.pc;
        if let Some(program) = self.cpu.get_program() {
            if let Some(index) = program.pc_to_index(pc) {
                if index < program.core_instructions.len() {
                    return format!("0x{:08x}: {:?}", pc, program.core_instructions[index]);
                }
            }
        }
        
        //to help the UI know when the next instruction is empty
        "---".to_string()
    }

    //gets the current line number using $PC register (due to mapping)
    #[wasm_bindgen]
    pub fn get_current_line(&self) -> i32 {
        let pc = self.cpu.pc;

        if let Some(program) = self.cpu.get_program() {
            if let Some(index) = program.pc_to_index(pc) {
                if index < program.line_numbers.len() {
                    return (program.line_numbers[index] as i32) - 1;
                }
            }
        }

        -1
    }
}

#[cfg(test)]
mod tests {
    use super::{CPU};

    #[test]
    fn addi_test_1() {
        let mut cpu = CPU::new();
        let program = r#"
            addi $t0, $t0, 5
        "#;

        cpu.run_input(program).unwrap();
        assert_eq!(cpu.get_reg("$t0"), 5);
    }

    #[test]
    fn addiu_test_1() { // multiple inputs 
        let mut cpu = CPU::new();
        let program = r#"
            addiu $t1, $t1, 10
            addiu $t2, $t1, 20
        "#;

        cpu.run_input(program).unwrap();
        assert_eq!(cpu.get_reg("$t1"), 10);
        assert_eq!(cpu.get_reg("$t2"), 30);
    }

    #[test]
    fn addu_test() {
        let mut cpu = CPU::new();
        let program = r#"
            li  $t0, 4294967295   # max 32-bit unsigned in decimal
            li  $t1, 2
            addu $t2, $t0, $t1
        "#;

        cpu.run_input(program).unwrap();
        // Unsigned wrap-around: 4294967295 + 2 = 1 (32-bit wrap)
        assert_eq!(cpu.get_reg("$t2"), 1);
    }

    #[test]
    fn subu_test() {
        let mut cpu = CPU::new();
        let program = r#"
            li  $t0, 5
            li  $t1, 10
            subu $t2, $t0, $t1
        "#;

        cpu.run_input(program).unwrap();
        // 5 - 10 = 4294967291 (wrap-around in 32-bit unsigned)
        assert_eq!(cpu.get_reg("$t2"), 4294967291); // 2^32 -1 = 4294967295 <-- unsigned 32 bit integers 
        // 5 - 10 = -5
        // -5 + 2^32 = 4294967291
    }

    #[test]
    fn lw_sw_test() {
        let mut cpu = CPU::new();
        let program = r#"
            li  $t1, 100           # base addr
            li  $t2, 42            # store value
            sw  $t2, 0($t1)        # memory[100] = 42
            lw  $t0, 0($t1)        # load back into t0
        "#;

        cpu.run_input(program).unwrap();
        assert_eq!(cpu.get_reg("$t0"), 42);
    }

    #[test]
    fn jump_test() {
        let mut cpu = CPU::new();
        let program = r#"
            j skip
            addi $t0, $zero, 100

            skip:
            addi $t0, $zero, 50
        "#;

        cpu.run_input(program).unwrap();
        assert_eq!(cpu.get_reg("$t0"), 50); 
    }
    
    #[test]
    fn jal_test() {
        let mut cpu = CPU::new();
        let program = r#"
            start:
            j main
        
            add_five:
            addi $t1, $t0, 5
            jr $ra
        
            main:
            addi $t0, $zero, 10
            jal add_five
            add $t0, $t0, $t1
        "#;

        cpu.run_input(program).unwrap();
        assert_eq!(cpu.get_reg("$t0"), 25); 
    }

        #[test]
    fn or_test() {
        let mut cpu = CPU::new();
        let program = r#"
            li  $t0, 5     # 0b0101
            li  $t1, 8     # 0b1000
            or  $t2, $t0, $t1
        "#;

        cpu.run_input(program).unwrap();
        assert_eq!(cpu.get_reg("$t2"), 13);
    }

    #[test]
    fn ori_test() {
        let mut cpu = CPU::new();
        let program = r#"
            li   $t0, 3     # 0b0011
            ori  $t1, $t0, 12  # 0b1100
        "#;

        cpu.run_input(program).unwrap();
        assert_eq!(cpu.get_reg("$t1"), 15);
    }

    #[test]
    fn beq_test() {
        let mut cpu = CPU::new();
        let program = r#"
            li $t0, 10
            li $t1, 10
            beq $t0, $t1, skip
            li $t2, 100
            j exit
            skip:
            li $t2, 50
            exit:
        "#;

        cpu.run_input(program).unwrap();
        assert_eq!(cpu.get_reg("$t2"), 50);
    }

    #[test]
    fn bne_test() {
        let mut cpu = CPU::new();
        let program = r#"
            li $t0, 10
            li $t1, 11
            bne $t0, $t1, skip
            li $t2, 100
            j exit
            skip:
            li $t2, 50
            exit:
        "#;
        
        cpu.run_input(program).unwrap();
        assert_eq!(cpu.get_reg("$t2"), 50);
    }

    #[test]
    fn and_test() {
        let mut cpu = CPU::new();
        let program = r#"
            li  $t0, 13     # 0b1101
            li  $t1, 7      # 0b0111
            and $t2, $t0, $t1
        "#;

        cpu.run_input(program).unwrap();
        // 0b1101 & 0b0111 = 0b0101 = 5
        assert_eq!(cpu.get_reg("$t2"), 5);
    }


    #[test]
    fn andi_test() {
        let mut cpu = CPU::new();
        let program = r#"
            li   $t0, 15      # 0b1111
            andi $t1, $t0, 6  # 0b0110
        "#;

        cpu.run_input(program).unwrap();
        // 0b1111 & 0b0110 = 0b0110 = 6
        assert_eq!(cpu.get_reg("$t1"), 6);
    }
}