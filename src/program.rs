use std::collections::HashMap;
use crate::instruction::{parse_instruction, Instruction};


/// enum used to indicate a runtime emulation error (e.g. parsing error)
#[derive(Debug, Clone)]
pub enum EmuError {
    /// indicates an error with instruction syntax 
    ParsingError(String),
    
    /// indicates an error with provided register 
    InvalidReg(String),

    /// indicates an invalid immediate when parsing 
    InvalidImm(String)
}

/// structure used to hold a list of Instructions
pub struct Program {
    /// list of `Instruction` 
    instructions: Vec<Instruction>,

    /// mapping from label to line number 
    labels: HashMap<String, usize>,

    // list of line numbers 
    line_numbers: Vec<usize>
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
                labels.insert(label.to_string(), instructions.len());

                continue;
            }

            match parse_instruction(line_num + 1, line)? {
                Some(insn) => {
                    instructions.push(insn);
                    line_numbers.push(line_num + 1);
                },
                None => {} 
            }
        }

        Ok(Program { 
            instructions,
            labels,
            line_numbers
        })
    }
}