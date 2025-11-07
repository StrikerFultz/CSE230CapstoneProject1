use crate::lexer::Token;
use crate::parser::Parser;
use crate::instruction::Instruction;
use crate::instruction::CoreInstruction;
use crate::instruction::PseudoInstruction;
use crate::program::EmuError; 
use crate::memory::Memory;

// use crate::lexer::alert;

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

    pub fn assemble(&mut self, code: &str, memory: &mut Memory) -> Result<(Vec<CoreInstruction>, HashMap<String, u32>, Vec<usize>), EmuError> {
        let result = self.parser.parse_program(code, memory);

        match result {
            Ok((instructions, symbol_table, errors)) => {
                let mut core_instructions: Vec<CoreInstruction> = Vec::new();
                for instruction in &instructions {
                    match instruction {
                        Instruction::Core(core) => {
                            core_instructions.push(core.clone());
                            // alert(format!("Core instruction: {:?}", core).as_str());
                        },
                        Instruction::Pseudo(pseudo) => {
                            match pseudo {
                                // PseudoInstruction::Lw { rt, label } => {
                                //     let address = self.parser.symbol_table.get(label).cloned().unwrap_or(0);

                                //     let inst_1 = CoreInstruction::Lui {
                                //         rt: "$at".to_string(),
                                //         imm: (address >> 16) as u32,
                                //     };
                                //     let inst_2 = CoreInstruction::Lw {
                                //         rt: rt.clone(),
                                //         rs: "$at".to_string(), // Assuming base register is $zero
                                //         imm: (address & 0xFFFF) as i32,
                                //     };

                                //     core_instructions.push(inst_1);
                                //     core_instructions.push(inst_2);

                                //     alert(format!("Pseudo instruction: Lw with rt: {} and label: {} and address: 0x{:x} and imm: 0x{:x} and offset: 0x{:x}", rt, label, address, address >> 16, address & 0xFFFF).as_str());
                                // },
                                // Load address pseudo-instruction
                                PseudoInstruction::La { rt, label } => {
                                    let address = self.parser.symbol_table.get(label).cloned().unwrap_or(0);
                                    let inst_1 = CoreInstruction::Lui {
                                        rt: "$at".to_string(),
                                        imm: (address >> 16) as u32,
                                    };
                                    let inst_2 = CoreInstruction::Ori {
                                        rt: rt.clone(),
                                        rs: "$at".to_string(),
                                        imm: (address & 0xFFFF) as u32,
                                    };

                                    core_instructions.push(inst_1);
                                    core_instructions.push(inst_2);

                                    // alert(format!("Pseudo instruction: La with rt: {} and label: {} and address: 0x{:x} and imm: 0x{:x} and offset: 0x{:x}", rt, label, address, address >> 16, address & 0xFFFF).as_str());
                                }
                                _ => {}
                            }
                            // alert(format!("Pseudo instruction: {:?}", pseudo).as_str());
                        }
                        _ => {}
                    }
                    // Process each instruction as needed
                }
                Ok((core_instructions, symbol_table, errors))
            }
            Err(e) => return Err(e),
        }
    }

    pub fn syntax_error_message(&self) -> String {
        self.parser.syntax_error_message.clone()
    }
}
