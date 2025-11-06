use crate::lexer::Token;
use crate::parser::Parser;
use crate::instruction::Instruction;
use crate::instruction::BasicInstruction;
use crate::instruction::ExtendedInstruction;
use crate::program::EmuError; 
use crate::memory::Memory;

use crate::lexer::alert;

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

    pub fn assemble(&mut self, code: &str, memory: &mut Memory) -> Result<(Vec<BasicInstruction>, HashMap<String, u32>, Vec<usize>), EmuError> {
        let result = self.parser.parse_program(code, memory);

        match result {
            Ok((instructions, labels, errors)) => {
                let mut basic_instructions: Vec<BasicInstruction> = Vec::new();
                for instruction in &instructions {
                    match instruction {
                        Instruction::Basic(basic) => {
                            basic_instructions.push(basic.clone());
                            alert(format!("Basic instruction: {:?}", basic).as_str());
                        },
                        Instruction::Extended(extended) => {
                            match extended {
                                ExtendedInstruction::Lw { rt, label } => {
                                    let address = self.parser.symbol_table.get(label).cloned().unwrap_or(0);

                                    let inst_1 = BasicInstruction::Lui {
                                        rt: "$at".to_string(),
                                        imm: (address >> 16) as u32,
                                    };
                                    let inst_2 = BasicInstruction::Lw {
                                        rt: rt.clone(),
                                        rs: "$at".to_string(), // Assuming base register is $zero
                                        imm: (address & 0xFFFF) as i32,
                                    };

                                    basic_instructions.push(inst_1);
                                    basic_instructions.push(inst_2);

                                    alert(format!("Extended instruction: Lw with rt: {} and label: {} and address: 0x{:x} and imm: 0x{:x} and offset: 0x{:x}", rt, label, address, address >> 16, address & 0xFFFF).as_str());
                                },
                                ExtendedInstruction::La { rt, label } => {
                                    let address = self.parser.symbol_table.get(label).cloned().unwrap_or(0);
                                    let inst_1 = BasicInstruction::Lui {
                                        rt: "$at".to_string(),
                                        imm: (address >> 16) as u32,
                                    };
                                    let inst_2 = BasicInstruction::Ori {
                                        rt: rt.clone(),
                                        rs: "$at".to_string(),
                                        imm: (address & 0xFFFF) as u32,
                                    };

                                    basic_instructions.push(inst_1);
                                    basic_instructions.push(inst_2);

                                    alert(format!("Extended instruction: La with rt: {} and label: {} and address: 0x{:x} and imm: 0x{:x} and offset: 0x{:x}", rt, label, address, address >> 16, address & 0xFFFF).as_str());
                                }
                            }
                            alert(format!("Extended instruction: {:?}", extended).as_str());
                        }
                        _ => {}
                    }
                    // Process each instruction as needed
                }
                Ok((basic_instructions, labels, errors))
            }
            Err(e) => return Err(e),
        }
    }

    pub fn syntax_error_message(&self) -> String {
        self.parser.syntax_error_message.clone()
    }
}
