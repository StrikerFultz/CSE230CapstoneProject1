pub mod instruction;
pub mod program;
pub mod cpu;
pub mod memory;

pub use instruction::*;
pub use program::*;
pub use cpu::*;
pub use memory::*;

use wasm_bindgen::prelude::*;

//https://github.com/insou22/mipsy partial code used since its a rough outline of the code 
// only li add and sub; shows register history as lineis entered (as changed) 

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