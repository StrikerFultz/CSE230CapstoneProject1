use wasm_bindgen::prelude::*;
use crate::lexer::Lexer;
use crate::lexer::Token;
use crate::parser::Parser;
use crate::instruction_set::InstructionSet;

use std::collections::VecDeque;

pub struct Assembler {
    pub parser: Parser,
}

impl Assembler {
    pub fn new() -> Self {
        Assembler {
            parser: Parser::new(),
        }
    }

    pub fn assemble(&mut self, code: &str) -> VecDeque<Token> {
        // let token_types: Vec<String> = tokens.iter().map(|t| format!("{:?}", t.token_type)).collect();
        // greet(format!("Tokens: {:?}", token_types).as_str());
        let tokens: VecDeque<Token> = self.parser.parse_program(code);
        return tokens;
    }

    pub fn syntax_error_message(&self) -> String {
        self.parser.syntax_error_message.clone()
    }

    // pub fn set_instruction_set(&mut self, instruction_set: InstructionSet) {
    //     self.instruction_set = Some(instruction_set.clone());
    // }
}

#[wasm_bindgen]
extern {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    alert(&format!("{}", name));
}