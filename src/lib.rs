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
}