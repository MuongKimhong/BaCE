use crate::settings::Settings;
use crate::syntax_highlight::{Token, TokenType, create_token};

const TYPESCRIPT_KEYWORDS: [&str; 46] = [
    "break", "case", "catch", "class", "const", "continue", "debugger", 
    "default", "delete", "do", "else", "export", "extends", "finally", 
    "for", "function", "if", "import", "in", "instanceof", "let", "new", 
    "return", "super", "switch", "this", "throw", "try", "typeof", 
    "var", "void", "while", "with", "yield", "await", "async", 
    "enum", "interface", "implements", "private", "public", "protected",
    "readonly", "as", "never", "unknown"
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
    tokens.push(create_token(settings_config, "typescript", TokenType::Whitespace, &value));
}

fn handle_comment(
    tokens: &mut Vec<Token>, 
    settings_config: &Settings, 
    input_chars: &[char], 
    pos: &mut usize
) {
    let start_pos = *pos;
    *pos += 1; // Move past the initial '/' character

    if *pos < input_chars.len() && input_chars[*pos] == '/' {
        // Single-line comment (//)
        while *pos < input_chars.len() && input_chars[*pos] != '\n' {
            *pos += 1;
        }
    } else if *pos < input_chars.len() && input_chars[*pos] == '*' {
        // Multi-line comment (/* ... */)
        *pos += 1;
        while *pos + 1 < input_chars.len() {
            if input_chars[*pos] == '*' && input_chars[*pos + 1] == '/' {
                *pos += 2; // Move past the closing */
                break;
            }
            *pos += 1;
        }
    }

    let value: String = input_chars[start_pos..*pos].iter().collect();
    tokens.push(create_token(settings_config, "typescript", TokenType::Comment, &value));
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

    // Handle template literals for JavaScript
    if start_char == '`' {
        while *pos < input_chars.len() {
            if input_chars[*pos] == '`' {
                *pos += 1; // Move past the closing backtick
                break;
            }
            // Handle escaped backticks within template literals
            if input_chars[*pos] == '\\' && *pos + 1 < input_chars.len() {
                *pos += 2;
                continue;
            }
            *pos += 1;
        }
    } else {
        // Handle single and double-quoted strings
        while *pos < input_chars.len() && input_chars[*pos] != start_char {
            // Handle escaped quotes within strings
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
    tokens.push(create_token(settings, "typescript", TokenType::StringLiteral, &value));
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
    tokens.push(create_token(settings_config, "typescript", TokenType::Number, &value));
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

    tokens.push(create_token(settings_config, "typescript", TokenType::Operator, &value));
}

fn handle_punctuation(
    tokens: &mut Vec<Token>, 
    settings_config: &Settings, 
    current_char: char, 
    pos: &mut usize
) {
    let value = current_char.to_string();
    tokens.push(create_token(settings_config, "typescript", TokenType::Punctuation, &value));
    *pos += 1;
}

fn handle_unknown(
    tokens: &mut Vec<Token>, 
    settings_config: &Settings, 
    current_char: char, 
    pos: &mut usize
) {
    let value = current_char.to_string();
    tokens.push(create_token(settings_config, "typescript", TokenType::Unknown, &value));
    *pos += 1;
}

fn handle_type_annotation(
    tokens: &mut Vec<Token>, 
    settings_config: &Settings, 
    input_chars: &[char], 
    pos: &mut usize
) {
    // Expecting a colon followed by a type name
    if input_chars.get(*pos) == Some(&':') {
        *pos += 1; // Move past the colon
        let start_pos = *pos;

        // Collect the type name (alphanumeric or generic types)
        while *pos < input_chars.len() && (input_chars[*pos].is_alphanumeric() || input_chars[*pos] == '<' || input_chars[*pos] == '>' || input_chars[*pos] == '_') {
            *pos += 1;
        }

        let value: String = input_chars[start_pos..*pos].iter().collect();
        tokens.push(create_token(settings_config, "typescript", TokenType::Identifier, &value));
    }
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

    // Identify function calls and class names in TypeScript
    if *next_char == '(' {
        tokens.push(create_token(settings_config, "typescript", TokenType::FunctionName, &value));
    } else {
        let token_type;
        if TYPESCRIPT_KEYWORDS.contains(&value.as_str()) {
            token_type = TokenType::Keyword;
        } else if value.chars().next().unwrap().is_uppercase() {
            token_type = TokenType::ClassName;
        } else {
            token_type = TokenType::Identifier;
        }
        tokens.push(create_token(settings_config, "typescript", token_type, &value));
    }
}

pub fn tokenize_typescript_code(settings_config: &Settings, input: &str) -> Vec<Token> {
    let mut tokens = Vec::new();
    let mut pos = 0;
    let input_chars: Vec<char> = input.chars().collect();

    while pos < input_chars.len() {
        let current_char = input_chars[pos];

        if current_char.is_whitespace() {
            handle_whitespace(&mut tokens, settings_config, input_chars.as_slice(), &mut pos);
        } 
        else if current_char == '/' && (input_chars.get(pos + 1) == Some(&'/') || input_chars.get(pos + 1) == Some(&'*')) {
            handle_comment(&mut tokens, settings_config, input_chars.as_slice(), &mut pos);
        } 
        else if current_char == '"' || current_char == '\'' || current_char == '`' {
            handle_string_literal(&mut tokens, settings_config, input_chars.as_slice(), &mut pos);
        } 
        else if current_char.is_digit(10) {
            handle_number(&mut tokens, settings_config, input_chars.as_slice(), &mut pos);
        } 
        else if current_char == ':' {
            handle_type_annotation(&mut tokens, settings_config, input_chars.as_slice(), &mut pos);
        } 
        else if "+-*/=%><!".contains(current_char) {
            handle_operator(&mut tokens, settings_config, current_char, input_chars.as_slice(), &mut pos);
        } 
        else if current_char.is_alphabetic() || current_char == '_' {
            handle_identifier(&mut tokens, settings_config, input_chars.as_slice(), &mut pos);
        } 
        else if ",.:;()[]{}".contains(current_char) {
            handle_punctuation(&mut tokens, settings_config, current_char, &mut pos);
        } 
        else {
            handle_unknown(&mut tokens, settings_config, current_char, &mut pos);
        }
    }

    tokens
}
