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

/// checks a register against a list of currently supported registers 
fn is_valid_register(name: &str) -> bool {
    matches!(name,
        "$zero" | "$0" | "$t0" | "$t1" | "$t2" | "$s1" | "$s2" | "$a0"
        | "$v0"
        | "$sp" | "$fp" | "$ra"
    )
}

/// checks whether the register is supported ($t0, $t1, $t2 only supported atm)
fn parse_register(name: &str, line_num: usize) -> Result<String, EmuError> {
    if is_valid_register(name) {
        Ok(name.to_string())
    } else {
        Err(
            EmuError::InvalidReg(format!("Line {}: Invalid Register {}", line_num, name.to_string()))
        )
    }
}

/// generic function that will parse an expected immediate and return a type `T`
fn parse_immediate<T: std::str::FromStr>(s: &str, line_num: usize) -> Result<T, EmuError> {
    s.trim()
        .parse::<T>()
        .map_err(|_| EmuError::InvalidImm(format!("Line {}: Invalid Immediate {}", line_num, s.to_string())))
}

/// parses a provided instruction string given a line number and line 
/// 
/// returns an `Instruction` enum or `EmuError`
pub fn parse_instruction(line_num: usize, line: &str) -> Result<Option<Instruction>, EmuError> {
    // skip comments
    let line = line.split('#').next().unwrap().trim(); // ignores empty lines 
    if line.is_empty() { //|| line.starts_with('#') {
        return Ok(None);
    }

    let mut parts = line.split_whitespace();
    let opcode = match parts.next() {
        Some(op) => op.to_lowercase(),
        None => return Ok(None),
    };
    
    // do some bsaic checks on the operands like comma checks
    let operands_str: String = parts.collect::<Vec<&str>>().join(" ");
    if operands_str.is_empty() {
        return Err(EmuError::ParsingError(
            format!("Line {}: Unrecognized instruction syntax", line_num)
        ));
    }
    
    if !operands_str.contains(',') && !opcode.starts_with("j") {
        return Err(EmuError::ParsingError(
            format!("Line {}: Invalid Instruction syntax", line_num) // specifying error more specificially 
        ));
    }
    
    // split operands by comma (delimator)
    let operands: Vec<&str> = operands_str
            .split(',')
            .map(|s| s.trim())
            .collect();
    
    // this is the CORE of the parser itself 
    // check against supported instructions

    // in the future we can use the lexer to extract the relevant tokens 

    let insn = match opcode.as_str() {
        "add" | "sub" | "addu" | "subu" => { 
            if operands.len() != 3 {
                return Err(EmuError::ParsingError(format!("Line {}: Invalid Instruction Syntax", line_num)))
            }
            
            match opcode.as_str() {
                "add" => Instruction::Add {
                    rd: parse_register(operands[0], line_num)?,
                    rs: parse_register(operands[1], line_num)?,
                    rt: parse_register(operands[2], line_num)? 
                },
                "sub" => Instruction::Sub {
                    rd: parse_register(operands[0], line_num)?,
                    rs: parse_register(operands[1], line_num)?,
                    rt: parse_register(operands[2], line_num)?
                },
                "addu" => Instruction::Addu {
                    rd: parse_register(operands[0], line_num)?,
                    rs: parse_register(operands[1], line_num)?,
                    rt: parse_register(operands[2], line_num)?
                },
                "subu" => Instruction::Subu {
                    rd: parse_register(operands[0], line_num)?,
                    rs: parse_register(operands[1], line_num)?,
                    rt: parse_register(operands[2], line_num)?
                },
                _ => unreachable!()
            }
            
        },
        "addi" => {
            if operands.len() != 3 {
                 return Err(EmuError::ParsingError(format!("Line {}: Invalid Instruction Syntax", line_num)))
            }

            Instruction::Addi {
                rt: parse_register(operands[0], line_num)?,
                rs: parse_register(operands[1], line_num)?,
                imm: parse_immediate::<i32>(operands[2], line_num)?
            }
        },
        "addiu" => { 
            // accepted instructions 
            if operands.len() != 3 {
                 return Err(EmuError::ParsingError(format!("Line {}: Invalid Instruction Syntax", line_num)))
            }

            Instruction::Addiu {
                rt: parse_register(operands[0], line_num)?,
                rs: parse_register(operands[1], line_num)?,
                imm: parse_immediate::<u32>(operands[2], line_num)?
            }
        },
        "li" => {
            if operands.len() != 2 {
                return Err(EmuError::ParsingError(format!("Line {}: Invalid Instruction Syntax", line_num)))
            }

            Instruction::Li {
                rd: parse_register(operands[0], line_num)?,
                imm: parse_immediate::<u32>(operands[1], line_num)?
            }
        }
        "lw" | "sw" => { 
            // added lw/sw to be accepted as instructions
            if operands.len()  != 2 {
                return Err(EmuError::ParsingError(
                    format!("Line {}: load/store must have 2 operands", line_num)
                ));
            }
            
            let mem_operand = operands[1].replace(" ",""); // inside spaces removed

            if !mem_operand.contains('(') || !mem_operand.ends_with(')') {
                return Err(EmuError::ParsingError(format!("Line {}: missing parenthesis in load/store", line_num)));
            }

            let parent_idx = mem_operand.find('(').unwrap();
            let imm_str = &mem_operand[..parent_idx];
            let rs_str = &mem_operand[parent_idx + 1..mem_operand.len() -1];

            // only doing base 10 not hex allowed 
            if rs_str.is_empty(){
                return Err(EmuError::ParsingError(
                    format!("Line {}: missing register in load/store", line_num)
                ));
            }

            match opcode.as_str(){
                "lw" => Instruction::Lw {
                    rt: parse_register(operands[0], line_num)?,
                    rs: parse_register(rs_str, line_num)?,
                    imm: parse_immediate::<i32>(imm_str, line_num)?,
                },
                "sw" => Instruction::Sw { 
                    rt: parse_register(operands[0], line_num)?,
                    rs: parse_register(rs_str, line_num)?,
                    imm: parse_immediate::<i32>(imm_str, line_num)?,
                },
                _ => unreachable!(),
            }
        },
        "j" => {
            if operands.len() != 1 {
                return Err(EmuError::ParsingError(
                    format!("Line {}: missing label in jump instruction", line_num)
                ));
            }

            Instruction::J {
                label: operands[0].to_string()
            }
        },
        "jal" => {
            if operands.len() != 1 {
                return Err(EmuError::ParsingError(
                    format!("Line {}: missing label in jal instruction", line_num)
                ));
            }

            Instruction::Jal {
                label: operands[0].to_string()
            }
        },
        "jr" => {
            if operands.len() != 1 {
                return Err(EmuError::ParsingError(
                    format!("Line {}: invalid register in jr instruction", line_num)
                ));
            }

            Instruction::Jr {
                rs: parse_register(operands[0], line_num)?
            }
        }

        "or" => {
            if operands.len() != 3 {
                return Err(EmuError::ParsingError(
                    format!("Line {}: invalid register in or instruction", line_num)
                ));
            }
            Instruction::Or {
                rd: parse_register(operands[0], line_num)?,
                rs: parse_register(operands[1], line_num)?,
                rt: parse_register(operands[2], line_num)?,

            }
        },

        "ori" => {
            if operands.len() != 3 {
                return Err(EmuError::ParsingError(
                    format!("Line {}: invalid register in ori instruction", line_num)
                ));
            }

            Instruction::Ori {
                rt: parse_register(operands[0], line_num)?,
                rs: parse_register(operands[1], line_num)?,
                imm: parse_immediate::<u32>(operands[2], line_num)?
            }
        },

        "and" => {
            if operands.len() != 3 {
                return Err(EmuError::ParsingError(
                    format!("Line {}: invalid register in and instruction", line_num)
                ));
            }

            Instruction::And {
                rd: parse_register(operands[0], line_num)?,
                rs: parse_register(operands[1], line_num)?,
                rt: parse_register(operands[2], line_num)?,
            }
        },

        "andi" => {
            if operands.len() != 3 {
                return Err(EmuError::ParsingError(
                    format!("Line {}: invalid register in andi instruction", line_num)
                ));
            }

            Instruction::Andi {
                rt: parse_register(operands[0], line_num)?,
                rs: parse_register(operands[1], line_num)?,
                imm: parse_immediate::<u32>(operands[2], line_num)?
            }
        }

        "beq" | "bne" => {
            if operands.len() != 3 {
                return Err(EmuError::ParsingError(
                    format!("Line {}: Invalid Instruction Syntax", line_num)
                ));
            }

            match opcode.as_str() {
                "beq" => Instruction::Beq {
                    rs: parse_register(operands[0], line_num)?,
                    rt: parse_register(operands[1], line_num)?,
                    label: operands[2].to_string(),
                },
                "bne" => Instruction::Bne {
                    rs: parse_register(operands[0], line_num)?,
                    rt: parse_register(operands[1], line_num)?,
                    label: operands[2].to_string(),
                },
                _ => unreachable!(),
            }
        },

        _ => {
            return Err(
                EmuError::ParsingError(format!("Line {}: Unknown instruction", line_num)
            ));
        }
    };

    Ok(Some(insn))
}