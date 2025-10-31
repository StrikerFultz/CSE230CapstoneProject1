use serde::{Serialize, Deserialize};
use std::fmt;

use std::collections::VecDeque;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum TokenType {
    /*
    If it starts with a ".", it's a directive like .data or .text
    */
    Directive,
    /*
    An operator like add, sub, lw, sw, etc.
    */
    Mnemonic,
    /*
    If it starts with a "#", the rest of the line is a comment.
    */
    Comment,
    /*
    "," or "\n"
    */
    Delimiter,
    /*
    a "$t0" register name
    */
    RegisterName,
    /*
    a "$8" register number instead of "$t0"
    */
    RegisterNumber,
    /*
    a quoted string like "Hello, World!"
    */
    QuotedString,
    LeftParen,
    RightParen,
    Integer,
    /*
    A unknown token type
    */
    Unknown,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Token {
    pub lexeme: String,
    pub token_type: TokenType,
    pub line_number: usize,
}

#[derive(Clone)]
pub struct Lexer {
    code: String,
    tokens: VecDeque<Token>,
    index: usize,
    line_number: usize,
}

impl Lexer {
    pub fn new() -> Self {
        Lexer {
            code: String::new(),
            tokens: VecDeque::new(),
            index: 0,
            line_number: 1,
        }
    }

    pub fn tokenize(&mut self, code: &str) -> VecDeque<Token> {
        self.code = code.to_string();
        self.line_number = 1;
        self.tokens.clear();

        for line in code.lines() {
            // // green(format!("Tokenizing line: {}", line).as_str());
            let mut i = 0;

            while i < line.len() {  
                let c = line.chars().nth(i).unwrap();
                let mut tokenFound = false;

                // Start of comment
                if c == '#' {   
                    // // green("Found comment, ignoring rest of line");
                    let new_token = Token {
                        lexeme: line[i..].to_string(),
                        token_type: TokenType::Comment,
                        line_number: self.line_number,
                    };
                    self.tokens.push_back(new_token);
                    i = line.len(); // Move index to end of line
                    tokenFound = true;
                    continue;
                }

                // Start of quoted string
                if c == '"' {   
                    let closing_index_option = findClosingQuoteString(&line[i + 1..]);
                    // // green(format!("Closing index option: {:?}", closing_index_option).as_str());
                    if let Some(closing_index) = closing_index_option {
                        let new_token = Token {
                            lexeme: line[i..i + 1 + closing_index + 1].to_string(),
                            token_type: TokenType::QuotedString,
                            line_number: self.line_number,
                        };
                        self.tokens.push_back(new_token);
                        i += closing_index + 1; // Move index to character after closing quote
                        tokenFound = true;
                        // // green(format!("next i value: {}", line.chars().nth(i).unwrap()).as_str());
                    } else {
                        // // green("Error: Unterminated string literal");
                    }
                    // // green(format!("i: {} line length: {}", i, line.len()).as_str());
                }

                // , indicates delimiter
                if c == ',' { 
                    let new_token = Token {
                        lexeme: c.to_string(),
                        token_type: TokenType::Delimiter,
                        line_number: self.line_number,
                    };
                    self.tokens.push_back(new_token);
                    tokenFound = true;
                    // // green("Found delimiter token");
                }

                // dot indicates possible directive
                if c == '.' {   
                    let mut directive_end = consumeTilPuncAndWs(i + 1, line);
                    let possible_directive = &line[i..directive_end];
                    if matchDirective(possible_directive) {
                        let new_token = Token {
                            lexeme: possible_directive.to_string(),
                            token_type: TokenType::Directive,
                            line_number: self.line_number,
                        };
                        self.tokens.push_back(new_token);
                        // // green(format!("Found directive token: {}", possible_directive).as_str());
                        tokenFound = true;
                        i = directive_end - 1; // Move index to end of directive
                    } else {
                        // green(format!("Not a directive: {}", possible_directive).as_str());
                    }
                }

                // dollar sign indicates possible register
                if c == '$' {
                    let mut register_end = consumeTilPuncAndWs(i + 1, line);
                    let possible_register = &line[i..register_end];
                    let new_token = Token {
                        lexeme: possible_register.to_string(),
                        token_type: TokenType::RegisterName, // For simplicity, treat all as RegisterName
                        line_number: self.line_number,
                    };
                    self.tokens.push_back(new_token);
                    // // green(format!("Found register token: {}", possible_register).as_str());
                    tokenFound = true;
                    i = register_end - 1; // Move index to end of register
                }

                if c == '(' {
                    let new_token = Token {
                        lexeme: c.to_string(),
                        token_type: TokenType::LeftParen,
                        line_number: self.line_number,
                    };
                    self.tokens.push_back(new_token);
                    tokenFound = true;
                    // // green("Found left parenthesis token");
                }

                if c == ')' {
                    let new_token = Token {
                        lexeme: c.to_string(),
                        token_type: TokenType::RightParen,
                        line_number: self.line_number,
                    };
                    self.tokens.push_back(new_token);
                    tokenFound = true;
                    // // green("Found right parenthesis token");
                }
                
                // handle negative integers also 
                if c == '-' {
                    if let Some(next_char) = line.chars().nth(i + 1) {
                        if next_char.is_ascii_digit() {
                            let integer_end = consumeInteger(i + 1, line); 

                            // get entire integer 
                            let possible_integer = &line[i..integer_end]; 
                            let new_token = Token {
                                lexeme: possible_integer.to_string(),
                                token_type: TokenType::Integer,
                                line_number: self.line_number,
                            };
                            self.tokens.push_back(new_token);
                            tokenFound = true;
                            i = integer_end - 1; 
                        }
                    }
                }

                // digit indicates possible integer
                if !tokenFound && c.is_ascii_digit() {
                    let mut integer_end = consumeInteger(i + 1, line);
                    let possible_integer = &line[i..integer_end];
                    let new_token = Token {
                        lexeme: possible_integer.to_string(),
                        token_type: TokenType::Integer,
                        line_number: self.line_number,
                    };
                    self.tokens.push_back(new_token);
                    // // green(format!("Found integer token: {}", possible_integer).as_str());
                    tokenFound = true;
                    i = integer_end - 1; // Move index to end of integer
                }

                // alphabetic indicates possible Mnemonic
                if c.is_ascii_alphabetic() || c == '_' {
                    let mut end = consumeTilPuncAndWs(i + 1, line);
                    
                    // check if label
                    let mut is_label = false;
                    if let Some(next_char) = line.chars().nth(end) {
                        if next_char == ':' {
                            is_label = true;
                            end += 1; // consume token
                        }
                    }

                    let lexeme = &line[i..end];
                    
                    let new_token = if is_label {
                        // label 
                        Token {
                            lexeme: lexeme.to_string(),
                            token_type: TokenType::Unknown, 
                            line_number: self.line_number,
                        }
                    } else {
                        Token {
                            lexeme: lexeme.to_string(),
                            token_type: TokenType::Mnemonic,
                            line_number: self.line_number,
                        }
                    };
                    
                    self.tokens.push_back(new_token);
                    tokenFound = true;
                    i = end - 1; // Move index to end of the token
                }

                // If no token matched, and not whitespace, it's an unknown token
                if !tokenFound && !c.is_whitespace() {
                    let mut unknown_end = consumeTilPuncAndWs(i + 1, line);
                    let possible_unknown = &line[i..unknown_end];
                    let new_token = Token {
                        lexeme: possible_unknown.to_string(),
                        token_type: TokenType::Unknown,
                        line_number: self.line_number,
                    };
                    self.tokens.push_back(new_token);
                    i = unknown_end - 1; // Move index to end of unknown token
                    // // green(format!("Found unknown token: {}", possible_unknown).as_str());
                }
                // // green(format!("Checking character... {}", c).as_str());
                i += 1;
            }

            // // green(format!("{}", line[line.len() - 1..].to_string()).as_str());

            for token in &self.tokens {
                // // green(format!("Token: {} Token Type: {:?}", token.value, token.token_type).as_str());
            }

            self.line_number += 1;
        }

        return self.tokens.clone();
    }

    pub fn matchTokenType(&self) {

    }

    pub fn getToken(&mut self) -> Option<Token> {
        self.tokens.pop_front()
    }

    pub fn peek(&self) -> Option<&Token> {
        self.tokens.front()
    }
}

fn findClosingQuoteString(s: &str) -> Option<usize> {
    let mut index = 0;
    let mut prev_char = '\0';
    for c in s.chars() {
        if c == '"' && prev_char != '\\' {
            // // green("Found closing quote string");
            return Some(index);
        }
        prev_char = c;

        index += 1;
        // // green(format!("Index: {} Char: {}", index, c).as_str());
    }
    return None;
}

fn matchDirective(s: &str) -> bool {
    let directives = vec![
        ".data",
        ".text",
        ".globl",
        ".asciiz",
        ".word",
        ".byte",
        ".half",
        ".space",
    ];

    for directive in directives {
        if s == directive {
            return true;
        }
    }
    return false;
}

fn consumeTilPuncAndWs(i: usize, s: &str) -> usize {
    let mut index = i;
    for c in s.chars().skip(i) {
        // skip underscores since those are used by labels
        if c.is_whitespace() || (c.is_ascii_punctuation() && c != '_') { 
            return index;
        }
        index += 1;
    }
    return index;
}

fn consumeInteger(i: usize, s: &str) -> usize {
    let mut index = i;
    for c in s.chars().skip(i) {
        if !c.is_ascii_digit() {
            return index;
        }
        index += 1;
    }
    return index;
}

impl fmt::Display for TokenType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let s = match self {
            TokenType::Directive => "Directive",
            TokenType::Mnemonic => "Mnemonic",
            TokenType::Comment => "Comment",
            TokenType::Delimiter => "Delimiter",
            TokenType::RegisterName => "RegisterName",
            TokenType::RegisterNumber => "RegisterNumber",
            TokenType::QuotedString => "QuotedString",
            TokenType::LeftParen => "LeftParen",
            TokenType::RightParen => "RightParen",
            TokenType::Integer => "Integer",
            TokenType::Unknown => "Unknown",
        };
        write!(f, "{}", s)
    }
}