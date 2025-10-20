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

        // initialize registers
        registers.insert("$t0".to_string(), 0);
        registers.insert("$t1".to_string(), 0);
        registers.insert("$t2".to_string(), 0);
        registers.insert("$sp".to_string(), DEFAULT_STACK_POINTER); // Stack Pointer

        CPU { 
            registers, 
            pc: DEFAULT_TEXT_BASE_ADDRESS, 
            program: None, 
            memory: Memory::new(),
            state_history: Vec::new()
        }
    }

    /// returns the value of a register (as u32)
    pub fn get_reg(&self, name: &str) -> u32 {
        *self.registers.get(name).unwrap_or(&0)
    }

    /// sets a register value (as u32)
    pub fn set_reg(&mut self, name: &str, value: u32) {
        self.registers.insert(name.to_string(), value);
    }

    pub fn load_program(&mut self, program: Program) {
        self.program = Some(program);
        self.pc = DEFAULT_TEXT_BASE_ADDRESS;
    }

    /// executes a single MIPS instruction 
    pub fn execute(&mut self) -> Result<(), EmuError> {
        let program = self.program.as_ref().unwrap();

        // get the current instruction using the $pc register
        // we could iterate the array but this is better when we also deal with branches and jumps 
        let index = program.pc_to_index(self.pc)
            .ok_or(EmuError::Termination)?;
        
        let insn = program.instructions[index].clone();
        println!("{:?}", insn);

        self.pc += 4;
        Ok(())
    }

    /// launches the emulator instance and executes line-by-line using a `Program`
    pub fn run(&mut self) -> Result<(), EmuError> {
        loop {
            match self.execute() {
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