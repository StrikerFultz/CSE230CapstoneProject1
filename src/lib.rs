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

    #[wasm_bindgen]
    pub fn run_program(&mut self, source_code: &str) -> JsValue {
        self.cpu.reset();

        // parse the program then run using provided code from HTML
        match Program::parse(source_code) {
            Ok(program) => {
                self.cpu.load_program(program);

                match self.cpu.run() {
                    Ok(_) => {
                        let snap = self.cpu.snapshot();
                        let result = WasmResult {
                            error: String::new(),
                            snapshot: Some(snap),
                        };
                        serde_wasm_bindgen::to_value(&result).unwrap()
                    }
                    Err(e) => {
                        let result: WasmResult = WasmResult {
                            error: format!("Runtime Error: {:?}", e),
                            snapshot: None,
                        };
                        serde_wasm_bindgen::to_value(&result).unwrap()
                    }
                }
            }
            Err(e) => {
                let result = WasmResult {
                    error: format!("Syntax Error: {:?}", e),
                    snapshot: None,
                };
                serde_wasm_bindgen::to_value(&result).unwrap()
            }
        }
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

    #[test]
    fn add_test() {
        let mut cpu = CPU::new();
        let program = r#"
            li  $t0, 7
            li  $t1, 8
            add $t2, $t0, $t1
        "#;
    
        cpu.run_input(program).unwrap();
        assert_eq!(cpu.get_reg("$t2"), 15);
    }
    
    #[test]
    fn sub_test() {
        let mut cpu = CPU::new();
        let program = r#"
            li  $t0, 20
            li  $t1, 5
            sub $t2, $t0, $t1
        "#;
    
        cpu.run_input(program).unwrap();
        assert_eq!(cpu.get_reg("$t2"), 15);
    }
    
    #[test]
    fn li_test() {
        let mut cpu = CPU::new();
        let program = r#"
            li $t0, 12345
        "#;
    
        cpu.run_input(program).unwrap();
        assert_eq!(cpu.get_reg("$t0"), 12345);
    }

    #[test]
    fn beq_not_taken() {
        let mut cpu = CPU::new();
        let program = r#"
            li $t0, 6
            li $t1, 7
            beq $t0, $t1, skip   
            li $t2, 1 
            j end
            skip:
            li $t2, 2
            end:
        "#;
    
        cpu.run_input(program).unwrap();
        assert_eq!(cpu.get_reg("$t2"), 2);
    }

    #[test]
    fn lw_sw_offset() {
        let mut cpu = CPU::new();
        let program = r#"
            li $t0, 1
            li $t1, 2
            li $t2, 3
            sw $t1, 0($t0)
            sw $t2, 4($t0)
            lw $t3, 4($t0)
        "#;
    
        cpu.run_input(program).unwrap();
        assert_eq!(cpu.get_reg("$t3"), 3);
    }

    #[test]
    fn lw_sw_overwrite() {
        let mut cpu = CPU::new();
        let program = r#"
            li $t0, 10
            li $t1, 1
            li $t2, 2
            sw $t1, 0($t0)
            sw $t2, 0($t0)
            lw $t3, 0($t0)
        "#;
    
        cpu.run_input(program).unwrap();
        assert_eq!(cpu.get_reg("$t3"), 2);
    }

    #[test]
    fn jr_nested_calls() {
        let mut cpu = CPU::new();
        let program = r#"
            jal func1
            j end
    
            func1:
            li $t0, 10
            jal func2
            jr $ra
    
            func2:
            addi $t0, $t0, 5
            jr $ra
    
            end:
        "#;
    
        cpu.run_input(program).unwrap();
        // func1 sets $t0=10, func2 adds 5, total = 15
        assert_eq!(cpu.get_reg("$t0"), 15);
    }
}
