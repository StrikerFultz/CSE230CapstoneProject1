use crate::lexer::Token;
use crate::parser::Parser;
use crate::instruction::Instruction;
use crate::program::EmuError; 

use std::collections::{VecDeque, HashMap};

pub struct Assembler {
    pub parser: Parser,
}

impl Assembler {
    pub fn new() -> Self {
        Assembler {
            parser: Parser::new(),
        }
    }

    pub fn assemble(&mut self, code: &str) -> Result<(Vec<Instruction>, HashMap<String, u32>, Vec<usize>), EmuError> {
        self.parser.parse_program(code)
    }

    pub fn syntax_error_message(&self) -> String {
        self.parser.syntax_error_message.clone()
    }
}
