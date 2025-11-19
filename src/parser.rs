use crate::lexer::{Lexer, Token, TokenType};
// use crate::lexer::alert;
use crate::instruction::Instruction;
use crate::instruction::CoreInstruction;
use crate::instruction::PseudoInstruction;
use crate::program::EmuError;
use crate::memory::Memory;
use std::collections::{HashMap, VecDeque};
    
#[derive(Debug, Clone)]
pub struct Label {
    pub name: String,
}

#[derive(Debug, Clone)]
pub enum ProgramStatement {
    Instruction(Instruction),
    Label(Label),
}

#[derive(Clone)]
enum Section {
    Text,
    Data,
}

#[derive(Clone)]
pub struct Parser {
    lexer: Lexer,
    syntax_error: bool,
    pub syntax_error_message: String,
    section: Section,
    data_section_pointer: u32,

    program_statements: Vec<ProgramStatement>,
    pub symbol_table: HashMap<String, u32>,
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
            program_statements: Vec::new(),
            symbol_table: HashMap::new(),
            line_numbers: Vec::new(),
            current_line: 0,
            instruction_index: 0,
            tokens: VecDeque::new(),
            section: Section::Text,
            data_section_pointer: crate::memory::DEFAULT_STATIC_DATA_BASE_ADDRESS,
        }
    }

    pub fn parse_program(&mut self, code: &str, memory: &mut Memory) -> Result<(Vec<ProgramStatement>, HashMap<String, u32>, Vec<usize>), EmuError> {
        self.reset();
        
        let all_tokens = self.lexer.tokenize(code);
        
        // group tokens by line then sort them
        let mut tokens_by_line = HashMap::new();
        for token in all_tokens {
            tokens_by_line.entry(token.line_number).or_insert(Vec::new()).push(token);
        }

        let mut sorted_lines: Vec<_> = tokens_by_line.keys().cloned().collect();
        sorted_lines.sort();

        // let mut tokens_strings = String::new();
        // for line_num in &sorted_lines {
        //     let line_tokens = tokens_by_line.get(line_num).unwrap();
        //     for token in line_tokens {
        //         tokens_strings.push_str(&format!("{} ", token.token_type));
        //     }
        //     tokens_strings.push('\n');
        // }

        // alert(format!("Tokens:\n{}", tokens_strings).as_str());

        // extract labels 
        // for line_num in &sorted_lines {

        //     let line_tokens = tokens_by_line.get(line_num).unwrap();
        //     let first_token = line_tokens
        //         .iter()
        //         .find(|t| t.token_type != TokenType::Comment).cloned();
            
        //     let second_token = line_tokens
        //         .iter()
        //         .skip(1)
        //         .find(|t| t.token_type != TokenType::Comment).cloned();

        //     // basically insert the label to the label mapping using a counter for the instruction index
        //     if let Some(token) = first_token {
        //         if let Some(second_token) = second_token {
        //             if (token.token_type == TokenType::Identifier || token.token_type == TokenType::Mnemonic) && second_token.token_type == TokenType::Colon {
        //                 let label = &token.lexeme[..token.lexeme.len()];
        //                 let address = crate::memory::DEFAULT_TEXT_BASE_ADDRESS + (self.instruction_index * 4);
                        
        //                 // insert with correct "memory" address relative to .text start 
        //                 if self.symbol_table.insert(label.to_string(), address).is_some() {
        //                     return Err(self.error(format!("Line {}: Duplicate label {}", line_num, label)));
        //                 }
        //                 // alert(format!("Inserted label: {} at address: {}", self.symbol_table.get(label.to_string()), address).as_str());
        //             } else if token.token_type == TokenType::Mnemonic {
        //                 self.instruction_index += 1;
        //             }
        //         }
        //     }
        // }

        
        // parse each line using Paul's code
        for line_num in sorted_lines {
            self.tokens = tokens_by_line.get(&line_num).unwrap().clone().into(); 
            self.current_line = line_num;
            
            self.parse_statement(memory)?; 
        }
        // alert(format!("identifiers: {:?}", self.symbol_table).as_str());
        // let mut string = String::from("Identifiers:\n");
        // for label in self.symbol_table.keys() {
        //     string.push_str(&format!("{}: {:x}\n", label, self.symbol_table.get(label).unwrap()));
        //     if memory.load_byte(*self.symbol_table.get(label).unwrap()) != 0 {
        //         string.push_str(&format!("Value: {}\n", memory.load_byte(*self.symbol_table.get(label).unwrap())));
        //     }
        // }
        // alert(string.as_str());

        // let mut memory_string = String::from("Data Segment Memory in bytes:\n");
        // let num_of_bytes_in_memory = 16;
        // for i in 0..num_of_bytes_in_memory {
        //     let byte = memory.load_byte(crate::memory::DEFAULT_STATIC_DATA_BASE_ADDRESS + i);
        //     memory_string.push_str(&format!("Memory[0x{:x}]: {:02}\n", crate::memory::DEFAULT_STATIC_DATA_BASE_ADDRESS + i, byte));
        // }
        // alert(memory_string.as_str());

        // validate labels
        for program_statement in &self.program_statements {
            
             match program_statement {
                ProgramStatement::Instruction(Instruction::Core(CoreInstruction::J { label })) |
                ProgramStatement::Instruction(Instruction::Core(CoreInstruction::Jal { label })) |
                ProgramStatement::Instruction(Instruction::Core(CoreInstruction::Beq { label, .. })) |
                ProgramStatement::Instruction(Instruction::Core(CoreInstruction::Bne { label, .. })) => {
                    if !self.symbol_table.contains_key(label) {
                        return Err(EmuError::UndefinedLabel(label.clone()));
                    }
                }
                _ => {}
            }
        }

        Ok((self.program_statements.clone(), self.symbol_table.clone(), self.line_numbers.clone()))
    }

    pub fn parse_statement(&mut self, memory: &mut Memory) -> Result<(), EmuError> {
        let x = self.peek(0);
        if let Some(token) = x {
            if token.token_type == TokenType::Directive && token.lexeme == ".data" {
                self.section = Section::Data;
            } else if token.token_type == TokenType::Directive && token.lexeme == ".text" {
                self.section = Section::Text;
            } else {
                match self.section {
                    Section::Data => self.parse_data(memory)?,
                    Section::Text => self.parse_text()?,
                }
            }
        }
        Ok(())
    }

    pub fn parse_data(&mut self, memory: &mut Memory) -> Result<(), EmuError> {
        // alert("Parsing data section");

        let x = self.peek(0);
        if let Some(token) = x {
            let label = self.expect(TokenType::Identifier)?;
            self.expect(TokenType::Colon)?;
            let directive = self.expect(TokenType::Directive)?;
            // alert(format!("Label: {}, Directive: {}", label.lexeme, directive.lexeme).as_str());

            if self.symbol_table.contains_key(&label.lexeme) {
                return Err(self.error(format!("Line {}: Duplicate label {}", label.line_number, label.lexeme)));
            }

            let mut address = self.data_section_pointer;

            // Handle address alignment for data types that require it.
            match directive.lexeme.as_str() {
                ".half" => {
                    let alignment = 2;
                    address = (self.data_section_pointer + alignment - 1) & !(alignment - 1);
                },
                ".word" => {
                    let alignment = 4;
                    address = (self.data_section_pointer + alignment - 1) & !(alignment - 1);
                },
                ".double" => {
                    let alignment = 8;
                    address = (self.data_section_pointer + alignment - 1) & !(alignment - 1);
                },
                ".float" => {
                    let alignment = 4;
                    address = (self.data_section_pointer + alignment - 1) & !(alignment - 1);
                },
                _ => {}
            }
            
            self.symbol_table.insert(label.lexeme.clone(), address);
            self.data_section_pointer = address;

            self.parse_data_operands(&label, &directive.lexeme, memory)?;
        }
        // Implementation for parsing data section goes here
        Ok(())
    }
    pub fn parse_data_operands(&mut self, label_token: &Token, directive: &str, memory: &mut Memory) -> Result<(), EmuError> {
        // Implementation for parsing data operands goes here
        let x = self.peek(0);
        if let Some(token) = x {
            match directive {
                ".word" | ".half" | ".byte" => {
                    let value = self.expect(TokenType::Integer)?;
                    // alert(format!("Parsed {} value: {}", directive, value.lexeme).as_str());

                    let label = label_token.lexeme.clone();
                    let line_num = label_token.line_number;
                    let address = self.data_section_pointer; 

                    match directive {
                        ".byte" => {
                            if value.lexeme.parse::<i8>().is_err() {
                                return Err(self.error(format!("At line {}: Value {} is out of range for .byte", line_num, value.lexeme)));
                            }
                            memory.set_byte(address, value.lexeme.parse::<i8>().unwrap());

                            self.data_section_pointer += 1;
                        },
                        ".half" => {
                            if value.lexeme.parse::<i16>().is_err() {
                                return Err(self.error(format!("At line {}: Value {} is out of range for .half", line_num, value.lexeme)));
                            }
                            memory.set_halfword(address, value.lexeme.parse::<i16>().unwrap());

                            self.data_section_pointer += 2;
                        },
                        ".word" => {
                            if value.lexeme.parse::<i32>().is_err() {
                                return Err(self.error(format!("At line {}: Value {} is out of range for .word", line_num, value.lexeme)));
                            }
                            memory.set_word(address, value.lexeme.parse::<i32>().unwrap());

                            self.data_section_pointer += 4;
                        },
                        _ => {}
                    }

                    let x = self.peek(0);
                    if let Some(token) = x {
                        if token.token_type == TokenType::Delimiter {
                            self.expect(TokenType::Delimiter)?;
                            self.parse_data_operands(label_token, directive, memory)?;
                        } else {
                            return Err(self.error(format!("At line {}: Unexpected token {:?}", self.current_line, token.lexeme)));
                        }
                    }
                },
                ".double" | ".float" => {
                    let value = self.peek(0);

                    if let Some(token) = value {
                        if token.token_type == TokenType::RealNumber || token.token_type == TokenType::Integer {
                            // alert(format!("Parsed {} value: {}", directive, token.lexeme).as_str());
                            
                            let address = self.data_section_pointer;
                            let line_num = token.line_number;
                            let lexeme = token.lexeme.clone();

                            if token.token_type == TokenType::RealNumber {
                                self.expect(TokenType::RealNumber)?;
                            } else if token.token_type == TokenType::Integer {
                                self.expect(TokenType::Integer)?;
                            }

                            match directive {
                                ".double" => {
                                    if lexeme.parse::<f64>().is_err() {
                                        return Err(self.error(format!("At line {}: Value {} is out of range for .double", line_num, lexeme)));
                                    }
                                    memory.set_double(address, lexeme.parse::<f64>().unwrap());

                                    self.data_section_pointer += 8;
                                },
                                ".float" => {
                                    if lexeme.parse::<f32>().is_err() {
                                        return Err(self.error(format!("At line {}: Value {} is out of range for .float", line_num, lexeme)));
                                    }
                                    memory.set_float(address, lexeme.parse::<f32>().unwrap());

                                    self.data_section_pointer += 4;
                                },
                                _ => {}
                            }

                            let x = self.peek(0);
                            if let Some(token) = x {
                                if token.token_type == TokenType::Delimiter {
                                    self.expect(TokenType::Delimiter)?;
                                    self.parse_data_operands(label_token, directive, memory)?;
                                } else {
                                    return Err(self.error(format!("At line {}: Unexpected token {:?}", self.current_line, token.lexeme)));
                                }
                            }
                        } else {
                            return Err(self.error(format!("At line {}: Expected real number or integer for {}, found {:?}", self.current_line, directive, token.lexeme)));
                        }
                    }
                },
                ".space" => {
                    let value = self.expect(TokenType::Integer)?;
                    // alert(format!("Parsed .space value: {}", value.lexeme).as_str());

                    let line_num = label_token.line_number;

                    if value.lexeme.parse::<u32>().is_err() {
                        return Err(self.error(format!("At line {}: Value {} is out of range for .space", line_num, value.lexeme)));
                    }

                    self.data_section_pointer += value.lexeme.parse::<u32>().unwrap();
                },
                ".ascii" => {
                    let value = self.expect(TokenType::QuotedString)?;
                    // alert(format!("Parsed .ascii value: {}", value.lexeme).as_str());

                    let address = self.data_section_pointer;

                    memory.set_string(address, value.lexeme.as_str());

                    self.data_section_pointer += value.lexeme.len() as u32;
                },
                ".asciiz" => {
                    let value = self.expect(TokenType::QuotedString)?;
                    // alert(format!("Parsed .asciiz value: {}", value.lexeme).as_str());

                    let mut lexeme = value.lexeme.clone();
                    let address = self.data_section_pointer;

                    lexeme.push('\0');
                    memory.set_string(address, lexeme.as_str());

                    self.data_section_pointer += lexeme.len() as u32;
                },
                _ => {
                    // Handle other directives or return an error
                }
            }
        }
        Ok(())
    }

    pub fn parse_text(&mut self) -> Result<(), EmuError> {
        // alert("Parsing text section");
        let x = self.peek(0);
        let second_token = self.peek(1);
        if let Some(token) = x {
            if token.token_type == TokenType::Mnemonic {
                let insn = self.parse_instruction()?;
                // return instruction from parsing 
                self.program_statements.push(ProgramStatement::Instruction(insn));
                self.line_numbers.push(self.current_line);
                self.instruction_index += 1;

            } else if token.token_type == TokenType::Identifier 
                && let Some(second) = second_token && second.token_type == TokenType::Colon {

                let label = token.lexeme.clone();
                let line_num = token.line_number;
                if self.symbol_table.insert(label.to_string(), 0).is_some() {
                    return Err(self.error(format!("Line {}: Duplicate label {}", line_num, label)));
                } else {
                    // alert(format!("Inserted label: {} at address: {}", label, self.symbol_table.get(&label).unwrap_or(&0)).as_str());
                    self.program_statements.push(ProgramStatement::Label(Label { name: label }));
                }

            } else if token.token_type != TokenType::Comment {
                 // nothing recognized
                return Err(self.error(format!("At line {}: Unexpected token {:?}", token.line_number, token.lexeme)));
            }
        }
        Ok(())
    }

    pub fn parse_instruction(&mut self) -> Result<Instruction, EmuError> {
        let x = self.peek(0);

        if let Some(token_ref) = x {
            let lexeme = token_ref.lexeme.clone();

            // match the instruction by lexeme to the right parsing fn
            match lexeme.as_str() {
                "add" | "sub" | "or" | "addu" | "subu" | "and" | "slt" => self.parse_r_type(&lexeme),
                "j" | "jal" | "jr" => self.parse_j_type(&lexeme),
                //"li" => self.parse_li(),
                "addi" | "addiu" | "lb" | "sb" | "lh" | "sh" | "lw" | "sw" | "ori" | "beq" | "bne" | "andi" => self.parse_i_type(&lexeme),
                "la" | "li" | "blt" | "bgt" | "ble" | "bge" => self.parse_pseudo_instruction(&lexeme),
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
        if token.token_type == TokenType::Mnemonic || token.token_type == TokenType::Identifier || token.token_type == TokenType::Directive {
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
            "add" => Ok(Instruction::Core(CoreInstruction::Add { rd, rs, rt })),
            "sub" => Ok(Instruction::Core(CoreInstruction::Sub { rd, rs, rt })),
            "or"  => Ok(Instruction::Core(CoreInstruction::Or { rd, rs, rt })),
            "addu" => Ok(Instruction::Core(CoreInstruction::Addu { rd, rs, rt })),
            "subu" => Ok(Instruction::Core(CoreInstruction::Subu { rd, rs, rt })),
            "and"  => Ok(Instruction::Core(CoreInstruction::And { rd, rs, rt })),
            "slt"  => Ok(Instruction::Core(CoreInstruction::Slt { rd, rs, rt })),
            _ => Err(self.error(format!("Line {}: Unknown R-Type", self.current_line)))
        }
    }

    pub fn parse_i_type(&mut self, mnemonic: &str) -> Result<Instruction, EmuError> {
        self.expect(TokenType::Mnemonic)?;

        if mnemonic == "lw" || mnemonic == "sw" || mnemonic == "lb" || mnemonic == "lh" || mnemonic == "sb" || mnemonic == "sh" {
            let rt = self.parse_register()?;
            self.expect(TokenType::Delimiter)?;

            let x = self.peek(0);

            if let Some(token) = x {
                if token.token_type == TokenType::Integer {
                    let imm = self.parse_immediate::<i32>()?;
                    self.expect(TokenType::LeftParen)?;
                    let rs = self.parse_register()?;
                    self.expect(TokenType::RightParen)?;
                    match mnemonic {
                        "lw" => Ok(Instruction::Core(CoreInstruction::Lw { rt, rs, imm })),
                        "sw" => Ok(Instruction::Core(CoreInstruction::Sw { rt, rs, imm })),
                        "lb" => Ok(Instruction::Core(CoreInstruction::Lb { rt, rs, imm })),
                        "sb" => Ok(Instruction::Core(CoreInstruction::Sb { rt, rs, imm })),
                        "lh" => Ok(Instruction::Core(CoreInstruction::Lh { rt, rs, imm })),
                        "sh" => Ok(Instruction::Core(CoreInstruction::Sh { rt, rs, imm })),
                        _ => Err(self.error(format!("At line {}: Unexpected token {:?}", self.current_line, mnemonic))),
                    }
                } else if token.token_type == TokenType::Identifier {
                    let label = self.expect(TokenType::Identifier)?;
                    if mnemonic == "lw" {
                        Ok(Instruction::Pseudo(PseudoInstruction::Lw { rt, label: label.lexeme }))
                    } else {
                        Err(self.error(format!("At line {}: Unsupported pseudo instruction", self.current_line)))
                    }
                } else {
                    return Err(self.error(format!("At line {}: Unexpected token {:?}", self.current_line, token.lexeme)));
                }
            } else {
                return Err(self.error(format!("At line {}: Unexpected end of input", self.current_line)));
            }
        } else if mnemonic == "beq" || mnemonic == "bne" {
            let rs = self.parse_register()?;
            self.expect(TokenType::Delimiter)?;
            let rt = self.parse_register()?;
            self.expect(TokenType::Delimiter)?;
            let label = self.parse_label()?;

            if mnemonic == "beq" {
                Ok(Instruction::Core(CoreInstruction::Beq { rs, rt, label }))
            } else {
                Ok(Instruction::Core(CoreInstruction::Bne { rs, rt, label }))
            }
        } else {
            let rt = self.parse_register()?;
            self.expect(TokenType::Delimiter)?;
            let rs = self.parse_register()?;
            self.expect(TokenType::Delimiter)?;
            
            match mnemonic {
                "addi" => Ok(Instruction::Core(CoreInstruction::Addi { rt, rs, imm: self.parse_immediate::<i32>()? })),
                "addiu" => Ok(Instruction::Core(CoreInstruction::Addiu { rt, rs, imm: self.parse_immediate::<u32>()? })),
                "ori" => Ok(Instruction::Core(CoreInstruction::Ori { rt, rs, imm: self.parse_immediate::<u32>()? })),
                "andi" => Ok(Instruction::Core(CoreInstruction::Andi { rt, rs, imm: self.parse_immediate::<u32>()? })),
                 _ => Err(self.error(format!("Line {}: Unhandled I-Type", self.current_line)))
            }
        }
    }

    // pub fn parse_li(&mut self) -> Result<Instruction, EmuError> {
    //     self.expect(TokenType::Mnemonic)?;
    //     let rd = self.parse_register()?;
    //     self.expect(TokenType::Delimiter)?;

    //     let imm_token = self.expect(TokenType::Integer)?;

    //     // parse as i32 first (for negative number support like -1 as signed)
    //     if let Ok(imm) = imm_token.lexeme.parse::<i32>() {
    //         Ok(Instruction::Core(CoreInstruction::Li { rd, imm: imm as u32 }))
    //     } else if let Ok(imm) = imm_token.lexeme.parse::<u32>() {
    //         Ok(Instruction::Core(CoreInstruction::Li { rd, imm: imm }))
    //     } else {
    //         Err(self.error(format!("Line {}: Invalid immediate value {}", self.current_line, imm_token.lexeme)))
    //     }
    // }

    pub fn parse_j_type(&mut self, mnemonic: &str) -> Result<Instruction, EmuError> {
        self.expect(TokenType::Mnemonic)?;

        match mnemonic {
            "j" => Ok(Instruction::Core(CoreInstruction::J { label: self.parse_label()? })),
            "jal" => Ok(Instruction::Core(CoreInstruction::Jal { label: self.parse_label()? })),
            "jr" => Ok(Instruction::Core(CoreInstruction::Jr { rs: self.parse_register()? })),
            _ => Err(self.error(format!("Line {}: Unknown J-Type", self.current_line)))
        }
    }

    pub fn parse_pseudo_instruction(&mut self, mnemonic: &str) -> Result<Instruction, EmuError> {
        self.expect(TokenType::Mnemonic)?;

        match mnemonic {
            "la" => {
                let rt = self.parse_register()?;
                self.expect(TokenType::Delimiter)?;
                let label = self.parse_label()?;
                Ok(Instruction::Pseudo(PseudoInstruction::La { rt, label }))
            },
            "li" => {
                let rd = self.parse_register()?;
                self.expect(TokenType::Delimiter)?;
                let imm_token = self.expect(TokenType::Integer)?;

                // parse as i32 first (for negative number support like -1 as signed)
                if let Ok(imm) = imm_token.lexeme.parse::<i32>() {
                    Ok(Instruction::Pseudo(PseudoInstruction::Li { rd, imm: imm as u32 }))
                } else if let Ok(imm) = imm_token.lexeme.parse::<u32>() {
                    Ok(Instruction::Pseudo(PseudoInstruction::Li { rd, imm: imm }))
                } else {
                    Err(self.error(format!("Line {}: Invalid immediate value {}", self.current_line, imm_token.lexeme)))
                }
            },
            "blt" => {
                let rs = self.parse_register()?;
                self.expect(TokenType::Delimiter)?;
                let rt = self.parse_register()?;
                self.expect(TokenType::Delimiter)?;
                let label = self.parse_label()?;
                Ok(Instruction::Pseudo(PseudoInstruction::Blt { rs, rt, label }))
            },
            "bgt" => {
                let rs = self.parse_register()?;
                self.expect(TokenType::Delimiter)?;
                let rt = self.parse_register()?;
                self.expect(TokenType::Delimiter)?;
                let label = self.parse_label()?;
                Ok(Instruction::Pseudo(PseudoInstruction::Bgt { rs, rt, label }))
            },
            "ble" => {
                let rs = self.parse_register()?;
                self.expect(TokenType::Delimiter)?;
                let rt = self.parse_register()?;
                self.expect(TokenType::Delimiter)?;
                let label = self.parse_label()?;
                Ok(Instruction::Pseudo(PseudoInstruction::Ble { rs, rt, label }))
            },
            "bge" => {
                let rs = self.parse_register()?;
                self.expect(TokenType::Delimiter)?;
                let rt = self.parse_register()?;
                self.expect(TokenType::Delimiter)?;
                let label = self.parse_label()?;
                Ok(Instruction::Pseudo(PseudoInstruction::Bge { rs, rt, label }))
            },
            _ => Err(self.error(format!("Line {}: Unknown pseudo-instruction", self.current_line)))
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

    fn peek(&self, offset: usize) -> Option<&Token> {
        self.tokens.iter()
        .skip(offset)
        .find(|t| t.token_type != TokenType::Comment)
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

        self.program_statements.clear();
        self.symbol_table.clear();
        self.line_numbers.clear();
        self.tokens.clear();
        self.current_line = 0;
        self.instruction_index = 0;
    }
}