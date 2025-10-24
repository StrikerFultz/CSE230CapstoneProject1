use crate::lexer::Lexer;
use crate::lexer::Token;
use crate::lexer::TokenType;
use crate::assembler::greet;
use crate::instruction_set::InstructionSet;
use crate::instruction_set::Instruction;

use std::collections::VecDeque;

#[derive(Clone)]
pub struct Parser {
    lexer: Lexer,
    instruction_set: InstructionSet,
    syntax_error: bool,
    pub syntax_error_message: String,
}

impl Parser {
    pub fn new() -> Self {
        Parser { 
            lexer: Lexer::new(), 
            instruction_set: InstructionSet::new(), 
            syntax_error: false, 
            syntax_error_message: String::from("No Errors") 
        }
    }
    pub fn parse_program(&mut self, code: &str) -> VecDeque<Token> {
        self.reset();
        
        let tokens: VecDeque<Token> = self.lexer.tokenize(code);

        greet("Parsing Program");
        self.parse_statement();

        return tokens;
    }
    pub fn parse_statement(&mut self) {
        greet("Parsing Statement");
        let x = self.lexer.peek();
        if let Some(token) = x {
            if token.token_type == TokenType::Mnemonic {
                self.parse_instruction();
            } else {
                self.syntax_error_message = format!("At line {}: Unexpected token {:?}", token.line_number, token.lexeme);
                self.syntax_error = true;
                return;
            }
            let x = self.lexer.peek();
            if let Some(token) = x {
                if token.token_type == TokenType::Comment {
                    self.expect(TokenType::Comment);
                }
            }
            if self.syntax_error {
                greet("Syntax error encountered. Stopping parsing.");
                return;
            }
            self.parse_statement();
        } else {
            return;
        }
    }
    pub fn parse_instruction(&mut self) {
        greet("Parsing Instruction");
        let x = self.lexer.peek();
        if let Some(token_ref) = x {
            let lexeme = token_ref.lexeme.clone();
            let instruction = self.instruction_set.instructions.get(&lexeme).unwrap();
            if instruction.opcode == 0 {
                // R-type instruction parsing
                self.parse_r_type();
            } else if instruction.opcode == 2 || instruction.opcode == 3 {
                // J-type instruction parsing
                self.parse_j_type();
            } else {
                // I-type instruction parsing
                self.parse_i_type();
            }
        } else {
            panic!("Unknown instruction: {:?}", x);
        }
    }
    pub fn parse_r_type(&mut self) {
        greet("Parsing R-Type Instruction");
        let Some(token) = self.lexer.peek() else { return; };
        
        self.expect(TokenType::Mnemonic);
        self.expect(TokenType::RegisterName); // rs
        self.expect(TokenType::Delimiter);    // ,
        self.expect(TokenType::RegisterName); // rt
        self.expect(TokenType::Delimiter);    // ,
        self.expect(TokenType::RegisterName); // rd
    }
    pub fn parse_i_type(&mut self) {
        greet("Parsing I-Type Instruction");
        let Some(token) = self.lexer.peek() else { return; };
        let lexeme = token.lexeme.clone();
        
        self.expect(TokenType::Mnemonic);

        if lexeme == "lw" || lexeme == "sw" {
            self.expect(TokenType::RegisterName); // rt
            self.expect(TokenType::Delimiter);    // ,
            self.expect(TokenType::Integer);    // integer immediate
            self.expect(TokenType::LeftParen);    // (
            self.expect(TokenType::RegisterName); // rs
            self.expect(TokenType::RightParen);    // )
        } else {
            self.expect(TokenType::RegisterName); // rs
            self.expect(TokenType::Delimiter);    // ,
            self.expect(TokenType::RegisterName); // rt
            self.expect(TokenType::Delimiter);    // ,
            self.expect(TokenType::Integer);    // integer immediate
        }
    }
    pub fn parse_j_type(&mut self) {
        greet("Parsing J-Type Instruction");
        let Some(token) = self.lexer.peek() else { return; };
        self.expect(TokenType::Mnemonic);
        self.expect(TokenType::Integer);    // address immediate
    }
    pub fn expect(&mut self, expected: TokenType) {
        if self.syntax_error {
            return;
        }

        let token_option = self.lexer.getToken();
        if let Some(token) = token_option {
            if token.token_type != expected {
                greet(&format!("Expected token {}, found {:?}", expected, token.token_type));
                self.syntax_error_message = format!("At line {}: Expected token {}, found {:?}", token.line_number, expected, token.lexeme);
                self.syntax_error = true;
            }
        } else {
            greet(&format!("Expected token {}, found None", expected));
            self.syntax_error_message = format!("Expected token {}, found None", expected);
            self.syntax_error = true;
        }
    }
    pub fn reset(&mut self) {
        self.syntax_error = false;
        self.syntax_error_message.clear();
    }
}