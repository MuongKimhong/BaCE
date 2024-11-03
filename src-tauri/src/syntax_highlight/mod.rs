pub mod languages;

use serde::{Serialize, Deserialize};
use crate::settings::{LanguageSyntaxHighlight, Settings};

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone, Copy)]
pub enum TokenType {
    Operator,
    Keyword,
    Identifier,
    Number,
    Punctuation,
    StringLiteral,
    Whitespace,
    Unknown,
    Comment,
    ClassName,
    FunctionName
}

// Define the PythonToken struct
#[derive(Debug, PartialEq, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Token {
    pub token_type: TokenType,
    pub value: String,
    pub color: String,
}

// a file content consists of multiple lines
// each line consist of each word that represent by Token 

#[derive(Debug, PartialEq, Serialize, Deserialize, Clone)]
pub struct LineContent {
    pub tokens: Vec<Token>
}

pub fn create_token(
    settings_config: &Settings, 
    language: &str, 
    token_type: TokenType, 
    value: &str
) -> Token {

    let languages:  Vec<LanguageSyntaxHighlight> = settings_config.syntax_highlight.languages.clone();
    
    let language_syntax = if let Some(lang_syntax) = languages.iter().find(|&lang| lang.language == language) {
        lang_syntax
    } else if let Some(lang_syntax) = languages.iter().find(|&lang| lang.language == "python") {
        lang_syntax  // use python as default
    } else {
        panic!("Neither the provided language nor 'python' were found");
    };

    let color = match token_type {
        TokenType::Keyword => &language_syntax.keyword_color,
        TokenType::Identifier => &language_syntax.identifier_color,
        TokenType::Number => &language_syntax.number_color,
        TokenType::Operator => &language_syntax.operator_color,
        TokenType::Punctuation => &language_syntax.punctuation_color,
        TokenType::StringLiteral => &language_syntax.string_literal_color,
        TokenType::Whitespace => &language_syntax.whitespace_color,
        TokenType::Unknown => &language_syntax.unknown_color,
        TokenType::Comment => &language_syntax.comment_color,
        TokenType::ClassName => &language_syntax.class_name_color,
        TokenType::FunctionName => &language_syntax.function_name_color,
    }.to_string();

    Token {
        token_type,
        value: value.to_string(),
        color,
    }
}