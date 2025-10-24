use crate::instruction_set::InstructionSet;

pub struct Globals {
    pub instruction_set: InstructionSet,
}

impl Globals {
    pub fn new() -> Self {
        Globals {
            instruction_set: InstructionSet::new(),
        }
    }
}