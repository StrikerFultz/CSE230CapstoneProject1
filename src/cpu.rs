use serde::{Serialize, Deserialize};
use std::collections::HashMap;

use crate::{program::*, Instruction};
use crate::memory::*;

/// represents the state of the CPU at an instruction
pub struct ExecutionState {
    pc: u32,
    instruction: Instruction
}

pub struct CPU { 
    // processor state 
    registers: HashMap<String, u32>,
    pc: u32,

    // program + memory
    program: Option<Program>,
    memory: Memory,     

    // log of all executed instructions 
    state_history: Vec<ExecutionState>
}

impl CPU {
    pub fn new() -> Self {
        let mut registers: HashMap<String, u32> = HashMap::new();

        // general purpose registers
        registers.insert("$t0".to_string(), 0);
        registers.insert("$t1".to_string(), 0);
        registers.insert("$t2".to_string(), 0);

        // special registers
        registers.insert("$zero".to_string(), 0);
        registers.insert("$ra".to_string(), 0);
        registers.insert("$sp".to_string(), DEFAULT_STACK_POINTER); 

        // $pc should be modified by accessing `self.pc`

        CPU { 
            registers, 
            pc: DEFAULT_TEXT_BASE_ADDRESS, 
            program: None, 
            memory: Memory::new(),
            state_history: Vec::new()
        }
    }

    /// returns the value of a register as a 32-bit unsigned integer
    pub fn get_reg(&self, name: &str) -> u32 {
        *self.registers.get(name).unwrap_or(&0)
    }

    /// sets a register value to a 32-bit unsigned integer 
    pub fn set_reg(&mut self, name: &str, value: u32) {
        self.registers.insert(name.to_string(), value);
    }

    pub fn load_program(&mut self, program: Program) {
        self.program = Some(program);
        self.pc = DEFAULT_TEXT_BASE_ADDRESS;
    }

    pub fn execute(&mut self, insn: &Instruction) -> Result<(), EmuError> {
        let mut is_branch = false;
        println!("{:?}", insn);

        // TODO: probably have to handle overflow or integer bounds for 32-bit signed integer
        
        // handle instruction based on type
        match insn {
            Instruction::Add { rd, rs, rt } => {
                let r1 = self.get_reg(rs) as i32; 
                let r2 = self.get_reg(rt) as i32;
                
                self.set_reg(rd, r1.wrapping_add(r2) as u32);
            },

            Instruction::Addi { rt, rs, imm } => {
                let r = self.get_reg(rs) as i32;
                self.set_reg(rt, r.wrapping_add(*imm) as u32);
            },

            Instruction::Addiu { rt, rs, imm } => {
                let r = self.get_reg(rs) as i32;
                self.set_reg(rt, r.wrapping_add(*imm as i32) as u32);
            },

            Instruction::Sub { rd, rs, rt } => {
                let r1 = self.get_reg(rs) as i32;
                let r2 = self.get_reg(rt) as i32;

                self.set_reg(rd, r1.wrapping_sub(r2) as u32);
            },
            
            Instruction::Lw { rt, rs, imm } => {
                let base = self.get_reg(rs);
                let addr = base.wrapping_add(*imm as u32);
                let val = self.memory.load_word(addr);

                self.set_reg(rt, val as u32);
            },

            Instruction::Sw { rs, rt, imm } => {
                let base = self.get_reg(rs);
                let addr = base.wrapping_add(*imm as u32);
                let val = self.get_reg(rt)as i32;

                self.memory.set_word(addr, val);
            },

            Instruction::Li { rd, imm } => {
                self.set_reg(rd, *imm as u32);
            },

            Instruction::J { label } => {
                let target = self.program.as_ref()
                    .unwrap()
                    .get_label_address(label)
                    .ok_or(EmuError::UndefinedLabel(label.clone()))?;

                self.pc = target;
                is_branch = true;
            },

            Instruction::Jal { label } => {
                let return_addr = self.pc + 4;
                self.set_reg("$ra", return_addr);

                let target = self.program.as_ref()
                    .unwrap()
                    .get_label_address(label)
                    .unwrap();

                self.pc = target;
                is_branch = true;       
            },

            Instruction::Jr { rs } => {
                let target = self.get_reg(rs);
                
                // check if 4-byte aligned
                if target % 4 != 0 {
                    return Err(EmuError::UnalignedAccess(target));
                }
            
                // check if $pc maps to some instruction in the array 
                if let Some(program) = &self.program {
                    if program.pc_to_index(target).is_none() {
                        return Err(EmuError::InvalidJump(target));
                    }
                }
            
                self.pc = target;
                is_branch = true;
            }
        }

        // branch instructions will modify the PC to another address instead of the sequential instruction
        if !is_branch {
            self.pc += 4;
        }

        Ok(())
    }

    /// executes a single MIPS instruction 
    pub fn next(&mut self) -> Result<(), EmuError> {
        let program = self.program.as_ref().unwrap();

        // get the current instruction using the $pc register
        // we could iterate the array but this is better when we also deal with branches and jumps 
        let index = program.pc_to_index(self.pc)
            .ok_or(EmuError::Termination)?;
        
        let insn = program.instructions[index].clone();
        self.execute(&insn)?;

        Ok(())
    }

    /// launches the emulator instance and executes line-by-line using a `Program`
    pub fn run(&mut self) -> Result<(), EmuError> {
        loop {
            match self.next() {
                Ok(_) => {},
                Err(EmuError::Termination) => {
                    println!("Finished execution!");
                    break;
                },
                Err(e) => return Err(e)
            }
        }   

        Ok(())
    }   

    /// used to run a multiline string directly 
    pub fn run_input(&mut self, source: &str) -> Result<(), EmuError> {
        let program = Program::parse(source)?;

        self.load_program(program);
        self.run()
    }
}