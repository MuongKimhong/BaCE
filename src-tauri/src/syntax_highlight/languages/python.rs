use crate::settings::Settings;
use crate::syntax_highlight::{Token, TokenType, create_token};

const PYTHON_KEYWORDS: [&str; 38] = [
    "and", "as", "assert", "break", "class", "continue", 
    "def", "del", "elif", "else", "except", "False", 
    "finally", "for", "from", "global", "if", "import", 
    "in", "is", "lambda", "None", "nonlocal", "not", 
    "or", "pass", "raise", "return", "True", "try", 
    "while", "with", "yield", "async", "await", "self", 
    "match", "case"
];

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
    tokens.push(create_token(settings_config, "python", TokenType::Whitespace, &value));
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
    tokens.push(create_token(settings_config, "python", TokenType::Comment, &value));
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

    // Check if this is a triple-quoted string
    let is_triple_quote = *pos + 1 < input_chars.len() && input_chars[*pos] == start_char && input_chars[*pos + 1] == start_char;

    if is_triple_quote {
        *pos += 2; // Move past the opening triple quotes

        // Process the content inside the triple quotes
        while *pos + 2 < input_chars.len() {
            // Check if we've reached the closing triple quotes
            if input_chars[*pos] == start_char && input_chars[*pos + 1] == start_char && input_chars[*pos + 2] == start_char {
                *pos += 3; // Move past the closing triple quotes
                break;
            }
            *pos += 1;
        }
    } else {
        // Handle single-line strings (delimited by ' or ")
        while *pos < input_chars.len() && input_chars[*pos] != start_char {
            // Allow for escaped quotes within single-line strings
            if input_chars[*pos] == '\\' && *pos + 1 < input_chars.len() {
                *pos += 2;
                continue;
            }
            *pos += 1;
        }
        *pos += 1; // Move past the closing quote
    }

    // Collect the entire string value including quotes
    let value: String = input_chars[start_pos..*pos.min(&mut input_chars.len())].iter().collect();
    tokens.push(create_token(settings, "python", TokenType::StringLiteral, &value));
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
    tokens.push(create_token(settings_config, "python", TokenType::Number, &value));
}

fn handle_return_operator(
    tokens: &mut Vec<Token>, 
    settings_config: &Settings, 
    pos: &mut usize
) {
    let value = "->".to_string();
    tokens.push(create_token(settings_config, "python", TokenType::Operator, &value));
    *pos += 2;
}

fn handle_operator(
    tokens: &mut Vec<Token>, 
    settings_config: &Settings, 
    current_char: char, 
    pos: &mut usize
) {
    let value = current_char.to_string();
    tokens.push(create_token(settings_config, "python", TokenType::Operator, &value));
    *pos += 1;
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

    if *next_char == '(' || input_chars.get(start_pos.wrapping_sub(1)) == Some(&'.') {
        tokens.push(create_token(settings_config, "python", TokenType::FunctionName, &value));
    } else {
        let token_type;
        if PYTHON_KEYWORDS.contains(&value.as_str()) {
            token_type = TokenType::Keyword;
        } else if value.chars().next().unwrap().is_uppercase() {
            token_type = TokenType::ClassName;
        } else {
            token_type = TokenType::Identifier;
        }
        tokens.push(create_token(settings_config, "python", token_type, &value));
    }
}

fn handle_punctuation(
    tokens: &mut Vec<Token>, 
    settings_config: &Settings, 
    current_char: char, 
    pos: &mut usize
) {
    let value = current_char.to_string();
    tokens.push(create_token(settings_config, "python", TokenType::Punctuation, &value));
    *pos += 1;
}

fn handle_unknown(
    tokens: &mut Vec<Token>, 
    settings_config: &Settings, 
    current_char: char, 
    pos: &mut usize
) {
    let value = current_char.to_string();
    tokens.push(create_token(settings_config, "python", TokenType::Unknown, &value));
    *pos += 1;
}

pub fn tokenize_python_code(settings_config: &Settings, input: &str) -> Vec<Token> {
    let mut tokens = Vec::new();
    let mut pos = 0;
    let input_chars: Vec<char> = input.chars().collect();

    while pos < input_chars.len() {
        let current_char = input_chars[pos];

        if current_char.is_whitespace() {
            handle_whitespace(&mut tokens, settings_config, input_chars.as_slice(), &mut pos);
        } 
        else if current_char == '#' {
            handle_comment(&mut tokens, settings_config, input_chars.as_slice(), &mut pos);
        } 
        else if current_char == '"' || current_char == '\'' {
            handle_string_literal(&mut tokens, settings_config, input_chars.as_slice(), &mut pos);
        } 
        else if current_char.is_digit(10) {
            handle_number(&mut tokens, settings_config, input_chars.as_slice(), &mut pos);
        } 
        else if current_char == '-' && input_chars.get(pos + 1) == Some(&'>') {
            handle_return_operator(&mut tokens, settings_config, &mut pos);
        } 
        else if "+-*/=%".contains(current_char) {
            handle_operator(&mut tokens, settings_config, current_char, &mut pos);
        } 
        else if current_char.is_alphabetic() || current_char == '_' {
            handle_identifier(&mut tokens, settings_config, input_chars.as_slice(), &mut pos);
        } 
        else if ",.:;()[]{}'\"".contains(current_char) {
            handle_punctuation(&mut tokens, settings_config, current_char, &mut pos);
        } 
        else {
            handle_unknown(&mut tokens, settings_config, current_char, &mut pos);
        }
    }

    tokens
}