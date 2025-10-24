use std::collections::HashMap;

#[derive(Clone)]
pub struct Instruction {
    pub opcode: u8,
    pub rs: u8,
    pub rt: u8,
    pub rd: u8,
    pub shamt: u8,
    pub funct: u8,
    pub immediate: u16,
    pub address: u32,
}

impl Instruction {
    pub fn new() -> Self {
        Instruction {
            opcode: 0,
            rs: 0,
            rt: 0,
            rd: 0,
            shamt: 0,
            funct: 0,
            immediate: 0,
            address: 0,
        }
    }
}

#[derive(Clone)]
pub struct InstructionSet {
    pub instructions: HashMap<String, Instruction>,
}

impl InstructionSet {
    pub fn new() -> Self {
        let mut instructions = HashMap::new();

        // Example instructions
        instructions.insert("add".to_string(), Instruction {
            opcode: 0,
            rs: 0,
            rt: 0,
            rd: 0,
            shamt: 0,
            funct: 32,
            immediate: 0,
            address: 0,
        });
        instructions.insert("addi".to_string(), Instruction {
            opcode: 8,
            rs: 0,
            rt: 0,
            rd: 0,
            shamt: 0,
            funct: 0,
            immediate: 0,
            address: 0,
        });
        instructions.insert("sub".to_string(), Instruction {
            opcode: 0,
            rs: 0,
            rt: 0,
            rd: 0,
            shamt: 0,
            funct: 34,
            immediate: 0,
            address: 0,
        });
        instructions.insert("lw".to_string(), Instruction {
            opcode: 35,
            rs: 0,
            rt: 0,
            rd: 0,
            shamt: 0,
            funct: 0,
            immediate: 0,
            address: 0,
        });
        instructions.insert("sw".to_string(), Instruction {
            opcode: 43,
            rs: 0,
            rt: 0,
            rd: 0,
            shamt: 0,
            funct: 0,
            immediate: 0,
            address: 0,
        });

        InstructionSet { instructions }
    }
}