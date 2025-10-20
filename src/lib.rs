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

pub fn execute_line(cpu: &mut CPU, line: &str) {
    let cleaned = line.replace(",", "");
    let parts: Vec<&str> = cleaned.split_whitespace().collect();
    if parts.is_empty() { return; }

    match parts[0] {
        "add" => cpu.add(parts[1], parts[2], parts[3]),
        "addi" => cpu.addi(parts[1], parts[2], parts[3].parse().unwrap_or(0)),
        "addiu" => cpu.addiu(parts[1], parts[2], parts[3].parse().unwrap_or(0)),
        "sub" => cpu.sub(parts[1], parts[2], parts[3]),
        "subi"  => cpu.subi(parts[1], parts[2], parts[3].parse().unwrap_or(0)),
        "subiu" => cpu.subiu(parts[1], parts[2], parts[3].parse().unwrap_or(0)),

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


#[cfg(test)]
mod tests {
    use super::{CPU, execute_line};

    #[test]
    fn addi_test_1() {
        let mut cpu = CPU::new();
        execute_line(&mut cpu, "addi $t0, $t0, 5");

        assert_eq!(cpu.get_reg("$t0"), 5);
    }

    #[test]
    fn addiu_test() {
        let mut cpu = CPU::new();
        execute_line(&mut cpu, "li $t0, 100");
        execute_line(&mut cpu, "addiu $t1, $t0, 55");
        assert_eq!(cpu.get_reg("$t1"), 155);
    }

    #[test]
    fn subi_test() {
        let mut cpu = CPU::new();
        execute_line(&mut cpu, "li $t0, 10");
        execute_line(&mut cpu, "subi $t1, $t0, 4");
        assert_eq!(cpu.get_reg("$t1"), 6);
    }


    #[test]
    fn subiu_test() {
        let mut cpu = CPU::new();
        execute_line(&mut cpu, "li $t0, 20");
        execute_line(&mut cpu, "subiu $t1, $t0, 5");
        assert_eq!(cpu.get_reg("$t1"), 15);
    }

}