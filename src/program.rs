use std::collections::HashMap;
use crate::instruction::{parse_instruction, Instruction};
use crate::memory::*;

/// enum used to indicate a runtime emulation error (e.g. parsing error)
#[derive(Debug, Clone)]
pub enum EmuError {
    /// indicates an error with instruction syntax 
    ParsingError(String),
    
    /// indicates an error with provided register 
    InvalidReg(String),

    /// indicates an invalid immediate when parsing 
    InvalidImm(String),

    // indicates unaligned memory access during runtime execution
    UnalignedAccess(u32),

    // indicates invalid jump target during runtime 
    InvalidJump(u32),

    // indicates a label that does not exist 
    UndefinedLabel(String),

    /// indicates emulation termination
    Termination
}

/// structure used to hold a list of Instructions
#[derive(Debug, Clone)]
pub struct Program {
    /// list of `Instruction` 
    pub instructions: Vec<Instruction>,

    /// mapping from label to line number 
    pub labels: HashMap<String, u32>,

    // list of line numbers 
    pub line_numbers: Vec<usize>
}  

impl Program {
    pub fn parse(src: &str) -> Result<Self, EmuError> {
        let mut instructions = Vec::new();
        let mut labels = HashMap::new();
        let mut line_numbers = Vec::new();

        for (line_num, line) in src.lines().enumerate() {
            let line = line.trim();

            // check for labels (e.g. start:) and avoid comments 
            if line.ends_with(':') && !line.starts_with('#') {
                let label = line[..line.len() - 1].trim();

                // set the label address to base with an offset of 4 for fixed size instruction length
                let address = DEFAULT_TEXT_BASE_ADDRESS + (instructions.len() as u32 * 4);
                labels.insert(label.to_string(), address);

                continue;
            }

            match parse_instruction(line_num, line)? {
                Some(insn) => {
                    instructions.push(insn);
                    line_numbers.push(line_num);
                },
                None => {} 
            }
        }

        // check if all labels from certain instructions are valid 
        for insn in &instructions {
            match insn {
                Instruction::J { label } |
                Instruction::Jal { label } |
                Instruction::Beq { label, .. } |
                Instruction::Bne { label, .. } => {
                    if !labels.contains_key(label) {
                        return Err(EmuError::UndefinedLabel(label.clone()));
                    }
                }
                _ => {}
            }
        }

        Ok(Program { 
            instructions,
            labels,
            line_numbers
        })
    }

    /// get the line number for a label 
    pub fn get_label_address(&self, label: &str) -> Option<u32> {
        self.labels.get(label).copied()
    }

    /// convert $pc to an index to an instruction in the instruction array 
    pub fn pc_to_index(&self, pc: u32) -> Option<usize> {
        if pc < DEFAULT_TEXT_BASE_ADDRESS {
            return None;
        }

        // check alignment since $pc is 4-byte aligned
        let offset: u32 = pc - DEFAULT_TEXT_BASE_ADDRESS;
        if offset % 4 != 0 {
            return None; 
        }

        let index: usize = (offset / 4) as usize;
        if index < self.instructions.len() {
            Some(index)
        } else {
            None
        }
    }

    /// get the $pc for an index in the instruction array 
    pub fn index_to_pc(&self, index: usize) -> u32 {
        DEFAULT_TEXT_BASE_ADDRESS + (index as u32 * 4)
    }
}