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
fn parse_register(name: &str) -> Result<String, EmuError> {
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
    let line = line.trim(); // ignores empty lines 
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
            format!("Line {}: Unrecognized instruction syntax", line_num)
        ));
    }
    
    if !operands_str.contains(',') {
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
    let insn = match opcode.as_str() {
        "add"| "sub" => { // added sub as well 
            if operands.len() != 3 {
                return Err(EmuError::ParsingError(format!("Line {}: Invalid Instruction Syntax", line_num)))
            }
            
            match opcode.as_str() {
                "add" => Instruction::Add {
                rd: parse_register(operands[0])?,
                rs: parse_register(operands[1])?,
                rt: parse_register(operands[2])? 
            },
            "sub" => Instruction::Sub {
                rd: parse_register(operands[0])?,
                rs: parse_register(operands[1])?,
                rt: parse_register(operands[2])?
            },
            _ => unreachable!(),
            }
            
        },
        "addi" => {
            if operands.len() != 3 {
                 return Err(EmuError::ParsingError(format!("Line {}: Invalid Instruction Syntax", line_num)))
            }

            Instruction::Addi {
                rt: parse_register(operands[0])?,
                rs: parse_register(operands[1])?,
                imm: parse_immediate::<i32>(operands[2])?
            }
        },

        "addiu" => { // accepted instructions 
            if operands.len() != 3 {
                 return Err(EmuError::ParsingError(format!("Line {}: Invalid Instruction Syntax", line_num)))
            }

            Instruction::Addiu {
                rt: parse_register(operands[0])?,
                rs: parse_register(operands[1])?,
                imm: parse_immediate::<u32>(operands[2])?
            }
        },
        "li" => {
            if operands.len() != 2 {
                return Err(EmuError::ParsingError(format!("Line {}: Invalid Instruction Syntax", line_num)))
            }

            Instruction::Li {
                rd: parse_register(operands[0])?,
                imm: parse_immediate::<u32>(operands[1])?
            }
        }
        "lw" | "sw" => { // added lw/sw to be accepted as insutrcitons 
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

            let imm: i32 = match imm_str.parse(){
                Ok(val) => val,
                Err(_) => {
                    return Err(EmuError::ParsingError(format!("Line {} invalid immediate in load/store", line_num)));
                }
            };

// only doing base 10 not hex allowed 
            if rs_str.is_empty(){
                return Err(EmuError::ParsingError(
                    format!("Line {}: missing register in load/store", line_num)
                ));
            }

            let rs = parse_register(rs_str)?;


           /* let imm_rs = operands[1].split('(');
            if imm_rs.clone().count() != 2 || !imm._rs.clone().nth(1).unwrap().ends_with(')') {
                return Err(EmuError::ParsingError(format!("Line {}: load/store must use imm(rs) format", line_num)));
            }*/

            match opcode.as_str(){
                "lw" => Instruction::Lw {
                    rt: parse_register(operands[0])?,
                    rs,
                    imm,
                },
                "sw" => Instruction::Sw { 
                    rt: parse_register(operands[0])?,
                    rs,
                    imm,
                },
                _ => unreachable!(),
            }
        },
        _ => {
            return Err(
                EmuError::ParsingError(format!("Line {}: Unknown instruction", line_num))
            );
        }
    };

    Ok(Some(insn))
}