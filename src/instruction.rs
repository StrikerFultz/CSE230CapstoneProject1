use crate::program::EmuError;

/// enum used to represent each MIPS instruction
#[derive(Debug, Clone)]
pub enum Instruction {
    /// R[rd] = R[rs] + R[rt] 
    Add { rd: String, rs: String, rt: String },

    /// R[rt] = R[rs] + SignExtImm 
    Addi { rt: String, rs: String, imm: i32 },

    /// R[rt] = R[rs] + SignExtImm
    Addiu { rt: String, rs: String, imm: u32 },

    /// R[rd] = R[rs] - R[rt]
    Sub { rd: String, rs: String, rt: String },

    /// R[rd] = immediate
    Li { rd: String, imm: u32 },

    /// M[R[rs]+SignExtImm] = R[rt] 
    Sw { rs: String, imm: i32, rt: String },

    /// R[rt] = M[R[rs]+SignExtImm]
    Lw { rt: String, rs: String, imm: i32 }
}

/// checks a register against a list of currently supported registers 
fn is_valid_register(name: &str) -> bool {
    matches!(name,
        "$zero" | "$0" | "$t0" | "$t1" | "$t2"
        | "$sp" | "$fp" | "$ra"
    )
}

/// checks whether the register is supported ($t0, $t1, $t2 only supported atm)
fn validate_register(name: &str) -> Result<String, EmuError> {
    if is_valid_register(name) {
        Ok(name.to_string())
    } else {
        Err(
            // probably match the error name with the one on ZyLabs later
            EmuError::InvalidReg(format!("{} is not a valid register name", name.to_string()))
        )
    }
}

/// generic function that will parse an expected immediate and return a type `T`
fn parse_immediate<T: std::str::FromStr>(s: &str) -> Result<T, EmuError> {
    s.trim()
        .parse::<T>()
        .map_err(|_| EmuError::InvalidImm(s.to_string()))
}

/// parses a provided instruction string given a line number and line 
/// 
/// returns an `Instruction` enum or `EmuError`
pub fn parse_instruction(line_num: usize, line: &str) -> Result<Option<Instruction>, EmuError> {
    // skip comments
    if line.is_empty() || line.starts_with('#') {
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
            format!("Line {}: Unrecognized syntax", line_num)
        ));
    }
    
    if !operands_str.contains(',') {
        return Err(EmuError::ParsingError(
            format!("Line {}: Unrecognized syntax", line_num)
        ));
    }
    
    // split operands by comma (delimator)
    let operands: Vec<&str> = operands_str
            .split(',')
            .map(|s| s.trim())
            .collect();
    
    // this is the CORE of the parser itself 
    // check against supported instructions
    let insn = match opcode.as_str() {
        "add" => {
            if operands.len() != 3 {
                return Err(EmuError::ParsingError(format!("Line {}", line_num)))
            }

            Instruction::Add {
                rd: validate_register(operands[0])?,
                rs: validate_register(operands[1])?,
                rt: validate_register(operands[2])?
            }
        },
        "li" => {
            if operands.len() != 2 {
                return Err(EmuError::ParsingError(format!("Line {}", line_num)))
            }

            Instruction::Li {
                rd: validate_register(operands[0])?,
                imm: parse_immediate::<u32>(operands[1])?
            }
        }
        _ => {
            return Err(
                EmuError::ParsingError(format!("Line {}: Unknown instruction", line_num))
            );
        }
    };

    Ok(Some(insn))
}