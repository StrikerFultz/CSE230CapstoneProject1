mod assembler;
mod lexer;
mod parser;
mod cpu;
mod memory;
mod instruction_set;
mod globals;

use globals::Globals;
use cpu::CPU;
use assembler::Assembler;
use instruction_set::InstructionSet;
use lexer::Token;

use wasm_bindgen::prelude::*;
use std::collections::VecDeque;

// Do not export a Rust struct with non-wasm-compatible fields. `assemble` will return a JsValue instead.

#[derive(serde::Serialize)]
struct AssembledResult {
    error: String,
    tokens: VecDeque<Token>,
}

#[wasm_bindgen]
pub struct MIPSProgram {
    cpu: CPU,
    assembler: Assembler,
    instruction_set: InstructionSet,
}

#[wasm_bindgen]
impl MIPSProgram {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let mut instruction_set = InstructionSet::new();
        let mut assembler = Assembler::new();
        let cpu = CPU::new();

        MIPSProgram {
            cpu,
            assembler,
            instruction_set,
        }
    }

    #[wasm_bindgen]
    pub fn execute_line(&mut self, code: &str) -> String {
        return cpu::execute_line(&mut self.cpu, code);
    }

    #[wasm_bindgen]
    pub fn assemble(&mut self, code: &str) -> JsValue {
        let assembled: VecDeque<Token> = self.assembler.assemble(code);

        let result = AssembledResult {
            error: self.assembler.parser.syntax_error_message.clone(),
            tokens: assembled,
        };

        serde_wasm_bindgen::to_value(&result).unwrap()
    }
}