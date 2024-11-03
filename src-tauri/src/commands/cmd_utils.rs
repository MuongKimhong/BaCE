use std::sync::Arc;
use std::path::Path;
use std::fs::File;
use std::io::{BufRead, BufReader};
use tauri::{AppHandle, Emitter};
use rayon::prelude::*;

use crate::syntax_highlight::{Token, TokenType};
use crate::syntax_highlight::languages::*;
use crate::{AppStateFileContentCaches};
use crate::settings::Settings;

pub fn tokenize(
    language: &str, 
    settings_config: &Settings, 
    content: &str
) -> Vec<Token> {

    // use python by default
    let tokens = match language {
        "rust" => tokenize_rust_code(settings_config, content),
        "javascript" => tokenize_javascript_code(settings_config, content),
        "typescript" => tokenize_typescript_code(settings_config, content),
        _ => tokenize_python_code(settings_config, content),
    };
    tokens
}

pub fn line_processing(tokens: &Vec<Token>) -> String {
    if tokens.is_empty() || (tokens.len() == 1 && tokens[0].token_type == TokenType::Whitespace) {
        return "<span class=\"empty-line\">A</span>".to_string();
    }
    let process_result: String = tokens
        .par_iter()
        .map(|token| {
            let processed_value = token.value.replace(" ", "&nbsp;").replace("\t", "&nbsp;&nbsp;&nbsp;&nbsp;");
            format!("<span style=\"color: {}\">{}</span>", token.color, processed_value)
        })
        .collect();

    process_result
}

pub fn insert_file_content_into_cache(
    file_content_caches_state: &mut AppStateFileContentCaches,
    line_contents_string: &Vec<String>,
    line_contents_dom: &Vec<String>,
    language: &String,
    file_path: &str, 
) {
    file_content_caches_state.insert(
        file_path.to_string(), 
        (
            Arc::new(line_contents_string.clone()),
            Arc::new(line_contents_dom.clone()), 
            Arc::new(language.clone())
        )
    );
}

pub fn read_file_content_from_cache(
    file_content_caches_state: &AppStateFileContentCaches, 
    file_path: &str
) -> Option<(Arc<Vec<String>>, Arc<Vec<String>>, Arc<String>)> {

    if let Some((line_contents, content_dom, language)) = file_content_caches_state.get(file_path) {
        return Some((
            Arc::clone(line_contents),
            Arc::clone(content_dom),
            Arc::clone(language),
        ));
    }
    None
}

pub fn detect_bg_image_path_change(
    app: &AppHandle, 
    old_settings: &Settings, 
    new_settings: &mut Settings
) {
    if old_settings.app.bg_image_path != new_settings.app.bg_image_path {
        match new_settings.encode_bg_image_base64() {
            Ok(_) => (),
            Err(e) => {
                app.emit("internal_error", format!("{e}")).unwrap();
                return;
            }
        }
        app.emit("bg-image-change", &new_settings.app.bg_image_base64).unwrap();
    }
}

pub fn detect_bg_type_change(
    app: &AppHandle, 
    old_settings: &Settings, 
    new_settings: &mut Settings
) {
    if old_settings.app.bg_type != new_settings.app.bg_type {
        if new_settings.app.bg_type.as_str() == "image" {
            match new_settings.encode_bg_image_base64() {
                Ok(_) => (),
                Err(e) => {
                    app.emit("internal_error", format!("{e}")).unwrap();
                    return;
                }
            }
            app.emit("bg-image-change", &new_settings.app.bg_image_base64).unwrap();
        }
        else if new_settings.app.bg_type.as_str() == "color" {
            app.emit("bg-type-change-image-to-color", &new_settings.app.bg_color).unwrap();
        }
    }
}

pub fn detect_language(file_path: &str) -> String {
    let path = Path::new(file_path);
    let language = path.extension().and_then(|ext| ext.to_str())
        .map(|ext| match ext {
            "js" => "javascript",
            "rs" => "rust",
            "ts" => "typescript",
            _ => "python",
        })
        .unwrap_or("python")
        .to_string();

    language
}

pub fn get_lines_from_file(file_path: &str) -> Vec<String> {
    let file = File::open(file_path).unwrap();
    let reader = BufReader::new(file);
    let lines: Vec<String> = reader.lines().filter_map(|line| line.ok()).collect();
    lines
}


#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    use std::sync::Arc;

    use crate::settings::Settings;
    use crate::syntax_highlight::{Token, TokenType};

    type AppStateFileContentCaches = HashMap<String, (Arc<Vec<String>>, Arc<Vec<String>>, Arc<String>)>;

    #[test]
    fn test_tokenize() {
        let language = "javascript";
        let settings_config = Settings::init_default_values();
        let content = "Hello world";

        let tokens = tokenize(language, &settings_config, content);
        assert_eq!(tokens.len(), 3);
    }

    #[test]
    fn test_line_processing_empty() {
        let tokens: Vec<Token> = Vec::new();
        let result = line_processing(&tokens);
        assert_eq!(result, "<span class=\"empty-line\">A</span>".to_string());
    }

    #[test]
    fn test_line_processing_not_empty() {
        let language = "javascript";
        let settings_config = Settings::init_default_values();
        let content = "dummy dummy";
        let tokens = tokenize(language, &settings_config, content);

        // #26ffd7 default color for identifier
        let result = line_processing(&tokens);
        assert_eq!(
            result,
            "<span style=\"color: #26ffd7\">dummy</span><span style=\"color: white\">&nbsp;</span><span style=\"color: #26ffd7\">dummy</span>"
        );
    }

    #[test]
    fn test_insert_file_content_into_cache() {
        let mut file_content_caches_state: AppStateFileContentCaches = HashMap::new();
        
        let line_contents_string = vec!["Line 1".to_string(), "Line 2".to_string()];
        let line_contents_dom = vec![
            "<span style=\"color: #26ffd7\">dummy</span>".to_string(), 
            "<span style=\"color: #26ffd7\">dummy</span>".to_string()
        ];
        let language = "javascript".to_string();
        let file_path = "path/to/file.js";

        insert_file_content_into_cache(
            &mut file_content_caches_state,
            &line_contents_string,
            &line_contents_dom,
            &language,
            file_path,
        );
        let cached_data = file_content_caches_state.get(file_path).expect("File path not found in cache");

        assert_eq!(*cached_data.0, **Arc::new(line_contents_string));
        assert_eq!(*cached_data.1, **Arc::new(line_contents_dom));
        assert_eq!(*cached_data.2, **Arc::new(language));
    }

    #[test]
    fn test_read_file_content_from_cache() {
        let mut file_content_caches_state: AppStateFileContentCaches = HashMap::new();
        
        let line_contents_string = vec!["Line 1".to_string(), "Line 2".to_string()];
        let line_contents_dom = vec![
            "<span style=\"color: #26ffd7\">dummy</span>".to_string(), 
            "<span style=\"color: #26ffd7\">dummy</span>".to_string()
        ];
        let language = "javascript".to_string();
        let file_path = "path/to/file.js";

        insert_file_content_into_cache(
            &mut file_content_caches_state,
            &line_contents_string,
            &line_contents_dom,
            &language,
            file_path,
        );

        if let Some((line_contents, content_dom, lang)) = read_file_content_from_cache(
            &file_content_caches_state,
            file_path
        ) {
            assert_eq!(*line_contents, **Arc::new(line_contents_string));
            assert_eq!(*content_dom, **Arc::new(line_contents_dom));
            assert_eq!(*lang, **Arc::new(language));
        } else {
            panic!("Expected content not found in cache for file path: {}", file_path);
        }
    }

    #[test]
    fn test_read_file_content_from_cache_not_found() {
        let file_content_caches_state: AppStateFileContentCaches = HashMap::new();
        let file_path = "path/to/file.js";

        // not inserting

        let result = read_file_content_from_cache(
            &file_content_caches_state,
            file_path
        );
        assert_eq!(result, None);
    }

    #[test]
    fn test_detect_language() {
        let file_path_1 = "/path/to/v8engine.rs";
        let file_path_2 = "/path/to/v8engine.js";
        let file_path_3 = "/path/to/v8engine.jesuschrist";
        let result_1 = detect_language(file_path_1);
        let result_2 = detect_language(file_path_2);
        let result_3 = detect_language(file_path_3);
        assert_eq!(result_1, "rust");
        assert_eq!(result_2, "javascript");
        assert_eq!(result_3, "python");
    }
}
