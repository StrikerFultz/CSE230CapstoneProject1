use crate::instruction::Instruction;
use crate::memory::*;
use crate::program::{EmuError, Program};
use crate::Snapshot;
use std::collections::HashMap;

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
        CPU { 
            registers: Self::create_register_map(), 
            pc: DEFAULT_TEXT_BASE_ADDRESS, 
            program: None, 
            memory: Memory::new(),
            state_history: Vec::new()
        }
    }

    fn create_register_map() -> HashMap<String, u32> {
        let mut registers: HashMap<String, u32> = HashMap::new();
        // $pc should be modified by accessing `self.pc`

        // general purpose
        registers.insert("$zero".to_string(), 0);
        registers.insert("$at".to_string(), 0);
        registers.insert("$v0".to_string(), 0);
        registers.insert("$v1".to_string(), 0);
        registers.insert("$a0".to_string(), 0);
        registers.insert("$a1".to_string(), 0);
        registers.insert("$a2".to_string(), 0);
        registers.insert("$a3".to_string(), 0);
        registers.insert("$t0".to_string(), 0);
        registers.insert("$t1".to_string(), 0);
        registers.insert("$t2".to_string(), 0);
        registers.insert("$t3".to_string(), 0);
        registers.insert("$t4".to_string(), 0);
        registers.insert("$t5".to_string(), 0);
        registers.insert("$t6".to_string(), 0);
        registers.insert("$t7".to_string(), 0);
        registers.insert("$s0".to_string(), 0);
        registers.insert("$s1".to_string(), 0);
        registers.insert("$s2".to_string(), 0);
        registers.insert("$s3".to_string(), 0);
        registers.insert("$s4".to_string(), 0);
        registers.insert("$s5".to_string(), 0);
        registers.insert("$s6".to_string(), 0);
        registers.insert("$s7".to_string(), 0);
        registers.insert("$t8".to_string(), 0);
        registers.insert("$t9".to_string(), 0);
        registers.insert("$k0".to_string(), 0);
        registers.insert("$k1".to_string(), 0);
        registers.insert("$ra".to_string(), 0);

        // special
        registers.insert("$gp".to_string(), DEFAULT_STATIC_DATA_BASE_ADDRESS);
        registers.insert("$sp".to_string(), DEFAULT_STACK_POINTER); 
        registers.insert("$fp".to_string(), DEFAULT_STACK_BASE_ADDRESS); 

        registers
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
            
            Instruction::Addu { rd, rs, rt } => {
                let r1 = self.get_reg(rs);
                let r2 = self.get_reg(rt);
                self.set_reg(rd,r1.wrapping_add(r2));
            },   

            Instruction::Sub { rd, rs, rt } => {
                let r1 = self.get_reg(rs) as i32;
                let r2 = self.get_reg(rt) as i32;

                self.set_reg(rd, r1.wrapping_sub(r2) as u32);
            },

            Instruction::Subu { rd, rs, rt } => {
                let r1 = self.get_reg(rs) as u32;
                let r2 = self.get_reg(rt) as u32;

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
            },

            Instruction::Or {rd, rs, rt } => {
                let r1 = self.get_reg(rs);
                let r2 = self.get_reg(rt);
                self.set_reg(rd, r1 | r2);
            },

            Instruction::Ori {rt, rs, imm} => {
                let r = self.get_reg(rs);
                self.set_reg(rt, r | *imm);
            },

            Instruction::And { rd, rs, rt } => {
                let r1 = self.get_reg(rs);
                let r2 = self.get_reg(rt);
                self.set_reg(rd, r1 & r2);
            },

            Instruction::Andi { rt, rs, imm } => {
                let r = self.get_reg(rs);
                self.set_reg(rt, r & *imm);
            },

            Instruction::Beq { rs, rt, label } => {
                let r1 = self.get_reg(rs);
                let r2 = self.get_reg(rt);

                if r1 == r2 {
                    let target = self.program.as_ref()
                        .unwrap()
                        .get_label_address(label)
                        .ok_or(EmuError::UndefinedLabel(label.clone()))?;
                    
                    self.pc = target;
                    is_branch = true;
                }
            },

            Instruction::Bne { rs, rt, label } => {
                let r1 = self.get_reg(rs);
                let r2 = self.get_reg(rt);

                if r1 != r2 {
                    let target = self.program.as_ref()
                        .unwrap()
                        .get_label_address(label)
                        .ok_or(EmuError::UndefinedLabel(label.clone()))?;
                    
                    self.pc = target;
                    is_branch = true;
                }
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

                    for (reg, val) in &self.registers {
                        println!("{}: {}", reg, *val as i32);
                    }

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

    // below functions are used for Web Assembly only
    pub fn reset(&mut self) {
        self.registers = Self::create_register_map();
        self.memory = Memory::new();
        self.pc = DEFAULT_TEXT_BASE_ADDRESS;
        self.program = None;

        self.state_history.clear(); 
    }

    pub fn snapshot(&self) -> Snapshot {
        Snapshot {
            registers: self.registers.clone(),
        }
    }
}