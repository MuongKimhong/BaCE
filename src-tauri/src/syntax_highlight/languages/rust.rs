use crate::settings::Settings;
use crate::syntax_highlight::{Token, TokenType, create_token};

const RUST_KEYWORDS: [&str; 41] = [
    "as", "break", "const", "continue", "crate", "else", "enum", "extern",
    "false", "fn", "for", "if", "impl", "in", "let", "loop", "match",
    "mod", "move", "mut", "pub", "ref", "return", "self", "Self", "static",
    "struct", "super", "trait", "true", "type", "unsafe", "use", "where",
    "while", "async", "await", "dyn", "abstract", "final", "override"
];

fn handle_macro(
    tokens: &mut Vec<Token>, 
    settings_config: &Settings, 
    input_chars: &[char], 
    pos: &mut usize
) {
    let start_pos = *pos;
    while *pos < input_chars.len() && (input_chars[*pos].is_alphanumeric() || input_chars[*pos] == '_') {
        *pos += 1;
    }
    if *pos < input_chars.len() && input_chars[*pos] == '!' {
        *pos += 1; // Include the '!' in the macro name
        let value: String = input_chars[start_pos..*pos].iter().collect();
        tokens.push(create_token(settings_config, "rust", TokenType::FunctionName, &value));
    }
}

fn handle_lifetime(
    tokens: &mut Vec<Token>, 
    settings_config: &Settings, 
    input_chars: &[char], 
    pos: &mut usize
) {
    let start_pos = *pos;
    *pos += 1; // Move past the apostrophe
    while *pos < input_chars.len() && input_chars[*pos].is_alphanumeric() {
        *pos += 1;
    }
    let value: String = input_chars[start_pos..*pos].iter().collect();
    tokens.push(create_token(settings_config, "rust", TokenType::Identifier, &value));
}

fn handle_string_literal(
    tokens: &mut Vec<Token>, 
    settings: &Settings, 
    input_chars: &[char], 
    pos: &mut usize
) {
    let start_char = input_chars[*pos];
    let start_pos = *pos;
    *pos += 1; // Move past the opening quote

    if start_char == 'r' {
        // Handle raw strings in Rust
        let mut hash_count = 0;
        while *pos < input_chars.len() && input_chars[*pos] == '#' {
            hash_count += 1;
            *pos += 1;
        }

        // Check if it's a raw string with double quotes after the hashes
        if *pos < input_chars.len() && input_chars[*pos] == '"' {
            *pos += 1; // Move past the opening quote
            let closing_sequence: Vec<char> = std::iter::repeat('#').take(hash_count).collect();

            // Process until we find the closing raw string sequence
            while *pos + hash_count < input_chars.len() {
                if input_chars[*pos] == '"' && &input_chars[*pos + 1..*pos + 1 + hash_count] == closing_sequence.as_slice() {
                    *pos += 1 + hash_count; // Move past the closing quote and hashes
                    break;
                }
                *pos += 1;
            }
        }
    } else if start_char == '\'' {
        // Handle single-quoted characters
        while *pos < input_chars.len() && input_chars[*pos] != '\'' {
            // Allow escaped single-quote within single character
            if input_chars[*pos] == '\\' && *pos + 1 < input_chars.len() {
                *pos += 2;
                continue;
            }
            *pos += 1;
        }
        *pos += 1; // Move past the closing single quote
    } else {
        // Handle double-quoted strings
        while *pos < input_chars.len() && input_chars[*pos] != '"' {
            // Allow for escaped quotes within double-quoted strings
            if input_chars[*pos] == '\\' && *pos + 1 < input_chars.len() {
                *pos += 2;
                continue;
            }
            *pos += 1;
        }
        *pos += 1; // Move past the closing double quote
    }

    // Collect the entire string value including quotes
    let value: String = input_chars[start_pos..*pos.min(&mut input_chars.len())].iter().collect();
    tokens.push(create_token(settings, "rust", TokenType::StringLiteral, &value));
}


fn handle_attribute(
    tokens: &mut Vec<Token>, 
    settings_config: &Settings, 
    input_chars: &[char], 
    pos: &mut usize
) {
    let start_pos = *pos;
    *pos += 1; // Move past the opening `#`

    if *pos < input_chars.len() && input_chars[*pos] == '[' {
        *pos += 1;
        while *pos < input_chars.len() && input_chars[*pos] != ']' {
            *pos += 1;
        }
        *pos += 1; // Move past the closing `]`
    }

    let value: String = input_chars[start_pos..*pos].iter().collect();
    tokens.push(create_token(settings_config, "rust", TokenType::FunctionName, &value));
}

fn handle_whitespace(
    tokens: &mut Vec<Token>, 
    settings_config: &Settings, 
    input_chars: &[char], 
    pos: &mut usize
) {
    let start_pos = *pos;
    while *pos < input_chars.len() && input_chars[*pos].is_whitespace() {
        *pos += 1;
    }
    let value: String = input_chars[start_pos..*pos].iter().collect();
    tokens.push(create_token(settings_config, "rust", TokenType::Whitespace, &value));
}

fn handle_comment(
    tokens: &mut Vec<Token>, 
    settings_config: &Settings, 
    input_chars: &[char], 
    pos: &mut usize
) {
    let start_pos = *pos;
    while *pos < input_chars.len() && input_chars[*pos] != '\n' {
        *pos += 1;
    }
    let value: String = input_chars[start_pos..*pos].iter().collect();
    tokens.push(create_token(settings_config, "rust", TokenType::Comment, &value));
}

fn handle_number(
    tokens: &mut Vec<Token>, 
    settings_config: &Settings, 
    input_chars: &[char], 
    pos: &mut usize
) {
    let start_pos = *pos;
    while *pos < input_chars.len() && input_chars[*pos].is_digit(10) {
        *pos += 1;
    }
    let value: String = input_chars[start_pos..*pos].iter().collect();
    tokens.push(create_token(settings_config, "rust", TokenType::Number, &value));
}

fn handle_operator(
    tokens: &mut Vec<Token>, 
    settings_config: &Settings, 
    current_char: char, 
    input_chars: &[char], 
    pos: &mut usize
) {
    let mut value = current_char.to_string();
    *pos += 1;

    // Handle multi-character operators like ==, ===, =>, etc.
    if let Some(next_char) = input_chars.get(*pos) {
        if current_char == '=' && (*next_char == '=' || *next_char == '>') {
            value.push(*next_char);
            *pos += 1;

            // Handle === case
            if *next_char == '=' && *pos < input_chars.len() && input_chars[*pos] == '=' {
                value.push('=');
                *pos += 1;
            }
        } else if current_char == '!' && *next_char == '=' {
            value.push(*next_char);
            *pos += 1;
        }
    }

    tokens.push(create_token(settings_config, "rust", TokenType::Operator, &value));
}

fn handle_identifier(
    tokens: &mut Vec<Token>, 
    settings_config: &Settings, 
    input_chars: &[char], 
    pos: &mut usize
) {
    let start_pos = *pos;
    while *pos < input_chars.len() && (input_chars[*pos].is_alphanumeric() || input_chars[*pos] == '_') {
        *pos += 1;
    }
    let value: String = input_chars[start_pos..*pos].iter().collect();
    let next_char = input_chars.get(*pos).unwrap_or(&' ');

    // Identify function calls and class names in JavaScript
    if *next_char == '(' {
        tokens.push(create_token(settings_config, "rust", TokenType::FunctionName, &value));
    } else {
        let token_type;
        if RUST_KEYWORDS.contains(&value.as_str()) {
            token_type = TokenType::Keyword;
        } else if value.chars().next().unwrap().is_uppercase() {
            token_type = TokenType::ClassName;
        } else {
            token_type = TokenType::Identifier;
        }
        tokens.push(create_token(settings_config, "rust", token_type, &value));
    }
}

fn handle_punctuation(
    tokens: &mut Vec<Token>, 
    settings_config: &Settings, 
    current_char: char, 
    pos: &mut usize
) {
    let value = current_char.to_string();
    tokens.push(create_token(settings_config, "rust", TokenType::Punctuation, &value));
    *pos += 1;
}

fn handle_unknown(
    tokens: &mut Vec<Token>, 
    settings_config: &Settings, 
    current_char: char, 
    pos: &mut usize
) {
    let value = current_char.to_string();
    tokens.push(create_token(settings_config, "rust", TokenType::Unknown, &value));
    *pos += 1;
}

pub fn tokenize_rust_code(settings_config: &Settings, input: &str) -> Vec<Token> {
    let mut tokens = Vec::new();
    let mut pos = 0;
    let input_chars: Vec<char> = input.chars().collect();

    while pos < input_chars.len() {
        let current_char = input_chars[pos];

        if current_char.is_whitespace() {
            handle_whitespace(&mut tokens, settings_config, input_chars.as_slice(), &mut pos);
        } 
        else if current_char == '#' {
            handle_attribute(&mut tokens, settings_config, input_chars.as_slice(), &mut pos);
        } 
        else if current_char == '/' && (input_chars.get(pos + 1) == Some(&'/') || input_chars.get(pos + 1) == Some(&'*')) {
            handle_comment(&mut tokens, settings_config, input_chars.as_slice(), &mut pos);
        } 
        else if current_char == '"' || current_char == '\'' {
            handle_string_literal(&mut tokens, settings_config, input_chars.as_slice(), &mut pos);
        } 
        else if current_char == '\'' && input_chars.get(pos + 1).map(|c| c.is_alphanumeric()).unwrap_or(false) {
            handle_lifetime(&mut tokens, settings_config, input_chars.as_slice(), &mut pos);
        } 
        else if current_char.is_digit(10) {
            handle_number(&mut tokens, settings_config, input_chars.as_slice(), &mut pos);
        } 
        else if "+-*/=%><!".contains(current_char) {
            handle_operator(&mut tokens, settings_config, current_char, input_chars.as_slice(), &mut pos);
        } 
        else if current_char.is_alphabetic() || current_char == '_' {
            if input_chars.get(pos + 1) == Some(&'!') {
                handle_macro(&mut tokens, settings_config, input_chars.as_slice(), &mut pos);
            } else {
                handle_identifier(&mut tokens, settings_config, input_chars.as_slice(), &mut pos);
            }
        } 
        else if ",.:;()[]{}<>".contains(current_char) {
            handle_punctuation(&mut tokens, settings_config, current_char, &mut pos);
        } 
        else {
            handle_unknown(&mut tokens, settings_config, current_char, &mut pos);
        }
    }

    tokens
}
