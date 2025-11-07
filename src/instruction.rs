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

    /// 
    Slt { rd: String, rs: String, rt: String},

    ///
    Slti { rt: String, rs: String, imm: i32 },

    ///
    Sltiu { rt: String, rs:String,imm:u32 },

    ///
    Sltu{ rd:String, rs:String, rt:String},

    ///
    Blt { rs: String, rt: String, label:String},

    ///
    Bgt { rs: String, rt: String, label:String},

    ///
    Ble { rs: String, rt: String, label:String},

    ///
    Bge { rs: String, rt: String, label:String},

    ///
    Move { rd:String, rs:String },

    /// 
    Xor { rd: String, rs: String, rt: String },

    ///
    Xori { rt: String, rs: String, imm: u32 },

    /// {Hi,Lo} = R[rs] * R[rt] 
    Mult { rs: String, rt: String },

    /// R[rd] = Hi
    Mfhi { rd: String },

    /// R[rd] = Lo 
    Mflo { rd: String } 
}
