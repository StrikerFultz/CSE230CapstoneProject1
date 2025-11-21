use crate::lexer::Token;
use crate::parser::Parser;
use crate::parser::ProgramStatement;
use crate::parser::Label;
use crate::instruction::Instruction;
use crate::instruction::CoreInstruction;
use crate::instruction::PseudoInstruction;
use crate::program::EmuError; 
use crate::memory::Memory;

// use crate::lexer::alert;

use std::collections::{VecDeque, HashMap};

pub struct Assembler {
    instruction_index: u32,

    pub parser: Parser,
}

impl Assembler {
    pub fn new() -> Self {
        Assembler {
            instruction_index: 0,

            parser: Parser::new(),
        }
    }

    pub fn assemble(&mut self, code: &str, memory: &mut Memory) -> Result<(Vec<CoreInstruction>, HashMap<String, u32>, Vec<usize>), EmuError> {
        let result = self.parser.parse_program(code, memory);

        match result {
            Ok((program_statements, mut symbol_table, errors)) => {
                let mut core_instructions: Vec<CoreInstruction> = Vec::new();
                for program_statement in &program_statements {
                    match program_statement {
                        ProgramStatement::Instruction(insn) => {
                            match insn {
                                Instruction::Core(core) => {
                                    core_instructions.push(core.clone());
                                    self.instruction_index += 1;
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

                                        PseudoInstruction::Move { rd, rs } => {
                                            let insn = CoreInstruction::Addu {
                                                rd: rd.clone(),
                                                rs: rs.clone(),
                                                rt: "$zero".to_string()
                                            };

                                            core_instructions.push(insn);
                                            self.instruction_index += 1;
                                        },

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

                                            self.instruction_index += 2;

                                            // alert(format!("Pseudo instruction: La with rt: {} and label: {} and address: 0x{:x} and imm: 0x{:x} and offset: 0x{:x}", rt, label, address, address >> 16, address & 0xFFFF).as_str());
                                        },
                                        PseudoInstruction::Li { rd, imm } => {
                                            let imm_signed_16_bits: bool = is_16_bit_signed(*imm as i32);
                                            let imm_unsigned_16_bits: bool = is_16_bit_unsigned(*imm);
                                            let imm_signed_32_bits: bool = is_32_bit_signed(*imm as i32);
                                            let imm_unsigned_32_bits: bool = is_32_bit_unsigned(*imm);

                                            if imm_signed_16_bits {
                                                let inst = CoreInstruction::Addi {
                                                    rt: rd.clone(),
                                                    rs: "$zero".to_string(),
                                                    imm: *imm as i32,
                                                };
                                                core_instructions.push(inst);

                                                self.instruction_index += 1;
                                            } else if imm_unsigned_16_bits {
                                                let inst = CoreInstruction::Ori {
                                                    rt: rd.clone(),
                                                    rs: "$zero".to_string(),
                                                    imm: *imm,
                                                };
                                                core_instructions.push(inst);
                                                self.instruction_index += 1;
                                            } else if imm_signed_32_bits || imm_unsigned_32_bits {
                                                let upper_imm = (*imm >> 16) as u32;
                                                let lower_imm = (*imm & 0xFFFF) as u32;

                                                let inst_1 = CoreInstruction::Lui {
                                                    rt: "$at".to_string(),
                                                    imm: upper_imm,
                                                };
                                                let inst_2 = CoreInstruction::Ori {
                                                    rt: rd.clone(),
                                                    rs: "$at".to_string(),
                                                    imm: lower_imm,
                                                };

                                                core_instructions.push(inst_1);
                                                core_instructions.push(inst_2);

                                                self.instruction_index += 2;
                                            }
                                        },
                                        PseudoInstruction::Blt { rs, rt, label } => {
                                            let inst_1 = CoreInstruction::Slt {
                                                rd: "$at".to_string(),
                                                rs: rs.clone(),
                                                rt: rt.clone(),
                                            };
                                            let inst_2 = CoreInstruction::Bne {
                                                rs: "$at".to_string(),
                                                rt: "$zero".to_string(),
                                                label: label.clone(),
                                            };

                                            core_instructions.push(inst_1);
                                            core_instructions.push(inst_2);

                                            self.instruction_index += 2;
                                        },
                                        PseudoInstruction::Bgt { rs, rt, label } => {
                                            let inst_1 = CoreInstruction::Slt {
                                                rd: "$at".to_string(),
                                                rs: rt.clone(),
                                                rt: rs.clone(),
                                            };
                                            let inst_2 = CoreInstruction::Bne {
                                                rs: "$at".to_string(),
                                                rt: "$zero".to_string(),
                                                label: label.clone(),
                                            };

                                            core_instructions.push(inst_1);
                                            core_instructions.push(inst_2);

                                            self.instruction_index += 2;
                                        },
                                        PseudoInstruction::Ble { rs, rt, label } => {
                                            let inst_1 = CoreInstruction::Slt {
                                                rd: "$at".to_string(),
                                                rs: rt.clone(),
                                                rt: rs.clone(),
                                            };
                                            let inst_2 = CoreInstruction::Beq {
                                                rs: "$at".to_string(),
                                                rt: "$zero".to_string(),
                                                label: label.clone(),
                                            };

                                            core_instructions.push(inst_1);
                                            core_instructions.push(inst_2);

                                            self.instruction_index += 2;
                                        },
                                        PseudoInstruction::Bge { rs, rt, label } => {
                                            let inst_1 = CoreInstruction::Slt {
                                                rd: "$at".to_string(),
                                                rs: rs.clone(),
                                                rt: rt.clone(),
                                            };
                                            let inst_2 = CoreInstruction::Beq {
                                                rs: "$at".to_string(),
                                                rt: "$zero".to_string(),
                                                label: label.clone(),
                                            };

                                            core_instructions.push(inst_1);
                                            core_instructions.push(inst_2);

                                            self.instruction_index += 2;
                                        },
                                        _ => {}
                                    }
                                }
                                // alert(format!("Pseudo instruction: {:?}", pseudo).as_str());
                            }
                        },
                        ProgramStatement::Label(label) => {
                            let address = crate::memory::DEFAULT_TEXT_BASE_ADDRESS + (self.instruction_index * 4);
                            symbol_table.insert(label.name.clone(), address);
                            // alert(format!("Label: {} at address: 0x{:x}", label.name, label.address).as_str());
                        },
                        _ => {
                            // alert(format!("Processing statement: {:?}", program_statement).as_str());
                        }
                    }
                    // Process each instruction as needed
                }
                Ok((core_instructions, symbol_table, errors))
            },
            Err(e) => return Err(e),
        }


    }

    pub fn syntax_error_message(&self) -> String {
        self.parser.syntax_error_message.clone()
    }
}

pub fn is_16_bit_signed(value: i32) -> bool {
    value >= i16::MIN as i32 && value <= i16::MAX as i32
}

pub fn is_16_bit_unsigned(value: u32) -> bool {
    value <= u16::MAX as u32
}

pub fn is_32_bit_signed(value: i32) -> bool {
    value >= i32::MIN as i32 && value <= i32::MAX as i32
}

pub fn is_32_bit_unsigned(value: u32) -> bool {
    value <= u32::MAX as u32
}