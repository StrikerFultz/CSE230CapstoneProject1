use crate::lexer::{Lexer, Token, TokenType};
use crate::instruction::Instruction;
use crate::program::EmuError;
use std::collections::{HashMap, VecDeque};

#[derive(Clone)]
pub struct Parser {
    lexer: Lexer,
    syntax_error: bool,
    pub syntax_error_message: String,

    instructions: Vec<Instruction>,
    labels: HashMap<String, u32>,
    line_numbers: Vec<usize>,
    current_line: usize,
    instruction_index: u32,
    tokens: VecDeque<Token>,
}

impl Parser {
    pub fn new() -> Self {
        Parser { 
            lexer: Lexer::new(), 
            syntax_error: false, 
            syntax_error_message: String::from("No Errors"),
            instructions: Vec::new(),
            labels: HashMap::new(),
            line_numbers: Vec::new(),
            current_line: 0,
            instruction_index: 0,
            tokens: VecDeque::new(),
        }
    }

    pub fn parse_program(&mut self, code: &str) -> Result<(Vec<Instruction>, HashMap<String, u32>, Vec<usize>), EmuError> {
        self.reset();
        
        let all_tokens = self.lexer.tokenize(code);
        
        // group tokens by line then sort them
        let mut tokens_by_line = HashMap::new();
        for token in all_tokens {
            tokens_by_line.entry(token.line_number).or_insert(Vec::new()).push(token);
        }

        let mut sorted_lines: Vec<_> = tokens_by_line.keys().cloned().collect();
        sorted_lines.sort();

        // extract labels 
        for line_num in &sorted_lines {

            let line_tokens = tokens_by_line.get(line_num).unwrap();
            let first_token = line_tokens
                .iter()
                .find(|t| t.token_type != TokenType::Comment).cloned();

            // basically insert the label to the label mapping using a counter for the instruction index
            if let Some(token) = first_token {
                
                if (token.token_type == TokenType::Unknown || token.token_type == TokenType::Mnemonic) && token.lexeme.ends_with(':') {
                    let label = &token.lexeme[..token.lexeme.len() - 1];
                    let address = crate::memory::DEFAULT_TEXT_BASE_ADDRESS + (self.instruction_index * 4);
                    
                    // insert with correct "memory" address relative to .text start 
                    if self.labels.insert(label.to_string(), address).is_some() {
                        return Err(self.error(format!("Line {}: Duplicate label {}", line_num, label)));
                    }
                } else if token.token_type == TokenType::Mnemonic {
                    self.instruction_index += 1;
                }
            }
        }

        // parse each line using Paul's code
        for line_num in sorted_lines {
            self.tokens = tokens_by_line.get(&line_num).unwrap().clone().into(); 
            self.current_line = line_num;
            
            self.parse_statement()?; 
        }

        // validate labels
        for insn in &self.instructions {
             match insn {
                Instruction::J { label } |
                Instruction::Jal { label } |
                Instruction::Beq { label, .. } |
                Instruction::Bne { label, .. } => {
                    if !self.labels.contains_key(label) {
                        return Err(EmuError::UndefinedLabel(label.clone()));
                    }
                }
                _ => {}
            }
        }

        Ok((self.instructions.clone(), self.labels.clone(), self.line_numbers.clone()))
    }

    pub fn parse_statement(&mut self) -> Result<(), EmuError> {
        let x = self.peek();
        if let Some(token) = x {
            if token.token_type == TokenType::Mnemonic {
                let insn = self.parse_instruction()?;

                // return instruction from parsing 
                self.instructions.push(insn);
                self.line_numbers.push(self.current_line);
            } else if (token.token_type == TokenType::Unknown || token.token_type == TokenType::Mnemonic) && token.lexeme.ends_with(':') {
                // ignore labels
            } else if token.token_type != TokenType::Comment {
                 // nothing recognized
                return Err(self.error(format!("At line {}: Unexpected token {:?}", token.line_number, token.lexeme)));
            }
        }
        Ok(())
    }

    pub fn parse_instruction(&mut self) -> Result<Instruction, EmuError> {
        let x = self.peek();

        if let Some(token_ref) = x {
            let lexeme = token_ref.lexeme.clone();

            // match the instruction by lexeme to the right parsing fn
            match lexeme.as_str() {
                "add" | "sub" | "or" | "addu" | "subu" | "and" => self.parse_r_type(&lexeme),
                "j" | "jal" | "jr" => self.parse_j_type(&lexeme),
                "li" => self.parse_li(),
                "addi" | "addiu" | "lw" | "sw" | "ori" | "beq" | "bne" | "andi" => self.parse_i_type(&lexeme),
                _ => Err(self.error(format!("Line {}: Unknown instruction {}", self.current_line, lexeme)))
            }
        } else {
             Err(self.error(format!("Line {}: Expected instruction", self.current_line)))
        }
    }

    fn is_valid_register(&self, name: &str) -> bool {
        matches!(name,
            "$zero" | "$at" |
            "$v0" | "$v1" |
            "$a0" | "$a1" | "$a2" | "$a3" |
            "$t0" | "$t1" | "$t2" | "$t3" | "$t4" | "$t5" | "$t6" | "$t7" |
            "$s0" | "$s1" | "$s2" | "$s3" | "$s4" | "$s5" | "$s6" | "$s7" |
            "$t8" | "$t9" |
            "$k0" | "$k1" |
            "$gp" | "$sp" | "$fp" | "$ra" | "$pc"
        )
    }

    fn parse_register(&mut self) -> Result<String, EmuError> {
        let token = self.expect(TokenType::RegisterName)?;
        
        if self.is_valid_register(&token.lexeme) {
            Ok(token.lexeme)
        } else {
            let err_msg = format!("Line {}: Invalid Register {}", self.current_line, token.lexeme);
            
            self.syntax_error = true;
            self.syntax_error_message = err_msg.clone();
            Err(EmuError::InvalidReg(err_msg))
        }
    }

    fn parse_immediate<T: std::str::FromStr>(&mut self) -> Result<T, EmuError> {
        let token = self.expect(TokenType::Integer)?;
        token.lexeme.parse::<T>().map_err(|_| {
            self.error(format!("Line {}: Invalid immediate value", self.current_line))
        })
    }
    
    fn parse_label(&mut self) -> Result<String, EmuError> {
        let token = self.next_token().ok_or_else(|| self.error("Expected label".to_string()))?;
        if token.token_type == TokenType::Mnemonic || token.token_type == TokenType::Unknown || token.token_type == TokenType::Directive {
            Ok(token.lexeme)
        } else {
            Err(self.error(format!("Line {}: Expected label", self.current_line)))
        }
    }

    pub fn parse_r_type(&mut self, mnemonic: &str) -> Result<Instruction, EmuError> {
        self.expect(TokenType::Mnemonic)?; 
        let rd = self.parse_register()?;
        self.expect(TokenType::Delimiter)?;
        let rs = self.parse_register()?;
        self.expect(TokenType::Delimiter)?;
        let rt = self.parse_register()?;

        match mnemonic {
            "add" => Ok(Instruction::Add { rd, rs, rt }),
            "sub" => Ok(Instruction::Sub { rd, rs, rt }),
            "or"  => Ok(Instruction::Or { rd, rs, rt }),
            "addu" => Ok(Instruction::Addu { rd, rs, rt }),
            "subu" => Ok(Instruction::Subu { rd, rs, rt }),
            "and"  => Ok(Instruction::And { rd, rs, rt }),
            _ => Err(self.error(format!("Line {}: Unknown R-Type", self.current_line)))
        }
    }

    pub fn parse_i_type(&mut self, mnemonic: &str) -> Result<Instruction, EmuError> {
        self.expect(TokenType::Mnemonic)?;
        
        if mnemonic == "lw" || mnemonic == "sw" {
            let rt = self.parse_register()?;
            self.expect(TokenType::Delimiter)?;
            let imm = self.parse_immediate::<i32>()?;
            self.expect(TokenType::LeftParen)?;
            let rs = self.parse_register()?;
            self.expect(TokenType::RightParen)?;

            if mnemonic == "lw" {
                Ok(Instruction::Lw { rt, rs, imm })
            } else {
                Ok(Instruction::Sw { rt, rs, imm })
            }
        } else if mnemonic == "beq" || mnemonic == "bne" {
            let rs = self.parse_register()?;
            self.expect(TokenType::Delimiter)?;
            let rt = self.parse_register()?;
            self.expect(TokenType::Delimiter)?;
            let label = self.parse_label()?;

            if mnemonic == "beq" {
                Ok(Instruction::Beq { rs, rt, label })
            } else {
                Ok(Instruction::Bne { rs, rt, label })
            }
        } else {
            let rt = self.parse_register()?;
            self.expect(TokenType::Delimiter)?;
            let rs = self.parse_register()?;
            self.expect(TokenType::Delimiter)?;
            
            match mnemonic {
                "addi" => Ok(Instruction::Addi { rt, rs, imm: self.parse_immediate::<i32>()? }),
                "addiu" => Ok(Instruction::Addiu { rt, rs, imm: self.parse_immediate::<u32>()? }),
                "ori" => Ok(Instruction::Ori { rt, rs, imm: self.parse_immediate::<u32>()? }),
                "andi" => Ok(Instruction::Andi { rt, rs, imm: self.parse_immediate::<u32>()? }),
                 _ => Err(self.error(format!("Line {}: Unhandled I-Type", self.current_line)))
            }
        }
    }

    pub fn parse_li(&mut self) -> Result<Instruction, EmuError> {
        self.expect(TokenType::Mnemonic)?;
        let rd = self.parse_register()?;
        self.expect(TokenType::Delimiter)?;

        let imm_token = self.expect(TokenType::Integer)?;

        // parse as i32 first (for negative number support like -1 as signed)
        if let Ok(imm) = imm_token.lexeme.parse::<i32>() {
            Ok(Instruction::Li { rd, imm: imm as u32 })
        } else if let Ok(imm) = imm_token.lexeme.parse::<u32>() {
            Ok(Instruction::Li { rd, imm: imm })
        } else {
            Err(self.error(format!("Line {}: Invalid immediate value {}", self.current_line, imm_token.lexeme)))
        }
    }

    pub fn parse_j_type(&mut self, mnemonic: &str) -> Result<Instruction, EmuError> {
        self.expect(TokenType::Mnemonic)?;

        match mnemonic {
            "j" => Ok(Instruction::J { label: self.parse_label()? }),
            "jal" => Ok(Instruction::Jal { label: self.parse_label()? }),
            "jr" => Ok(Instruction::Jr { rs: self.parse_register()? }),
            _ => Err(self.error(format!("Line {}: Unknown J-Type", self.current_line)))
        }
    }

    fn error(&mut self, msg: String) -> EmuError {
        self.syntax_error = true;
        self.syntax_error_message = msg.clone();

        EmuError::ParsingError(msg)
    }

    fn next_token(&mut self) -> Option<Token> {
        loop {
            match self.tokens.pop_front() {
                Some(token) if token.token_type == TokenType::Comment => continue,
                other => return other,
            }
        }
    }

    fn peek(&self) -> Option<&Token> {
        self.tokens.iter().find(|t| t.token_type != TokenType::Comment)
    }

    pub fn expect(&mut self, expected: TokenType) -> Result<Token, EmuError> {
        if self.syntax_error {
            return Err(self.error("Parser already in error state".to_string()));
        }

        let token_option = self.next_token();
        if let Some(token) = token_option {
            if token.token_type != expected {
                let err = self.error(format!("At line {}: Expected token {}, found {:?}", token.line_number, expected, token.lexeme));
                Err(err)
            } else {
                Ok(token)
            }
        } else {
            let err = self.error(format!("At line {}: Expected token {}, found end of line", self.current_line, expected));
            Err(err)
        }
    }

    pub fn reset(&mut self) {
        self.syntax_error = false;
        self.syntax_error_message = String::from("No Errors");

        self.instructions.clear();
        self.labels.clear();
        self.line_numbers.clear();
        self.tokens.clear();
        self.current_line = 0;
        self.instruction_index = 0;
    }
}