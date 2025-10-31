use crate::program::EmuError;

/// enum used to represent each MIPS instruction
#[derive(Debug, Clone)]
pub enum Instruction {
    /// R[rd] = R[rs] + R[rt] 
    Add { rd: String, rs: String, rt: String },

    /// R[rd] = R[rs] + R[rt]
    Addu { rd: String, rs: String, rt: String },

    /// R[rt] = R[rs] + SignExtImm 
    Addi { rt: String, rs: String, imm: i32 },

    /// R[rt] = R[rs] + SignExtImm
    Addiu { rt: String, rs: String, imm: u32 },

    /// R[rd] = R[rs] - R[rt]
    Sub { rd: String, rs: String, rt: String },

    /// R[rd] = R[rs] - R[rt] 
    Subu { rd: String, rs: String, rt: String },

    /// R[rd] = immediate
    Li { rd: String, imm: u32 },

    /// M[R[rs]+SignExtImm] = R[rt] 
    Sw { rs: String, imm: i32, rt: String },

    /// R[rt] = M[R[rs]+SignExtImm]
    Lw { rt: String, rs: String, imm: i32 },

    /// PC=JumpAddr
    J { label: String },

    /// R[$ra]=PC+8;PC=JumpAddr
    Jal { label: String },

    /// PC=R[rs] 
    Jr { rs: String },

    /// R[rd] = R[rs] | R[rt]
    Or { rd: String, rs: String, rt: String },

    /// R[rt] = R[rs] | ZeroExtImm
    Ori { rt: String, rs: String, imm: u32 },

    /// R[rd] = R[rs] & R[rt] 
    And { rd: String, rs: String, rt: String },

    /// R[rt] = R[rs] & ZeroExtImm
    Andi { rt: String, rs: String, imm: u32 },

    /// if(R[rs] == R[rt]) PC=JumpAddr
    Beq { rs: String, rt: String, label: String },

    /// if(R[rs] != R[rt]) PC=JumpAddr
    Bne { rs: String, rt: String, label: String },
}
