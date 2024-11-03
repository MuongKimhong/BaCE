pub mod cmd_utils;

use std::fs::{File, create_dir};
use tauri::State;
use std::path::PathBuf;
use std::io::{self, BufRead, BufReader, Write};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use std::sync::{Arc};
use rayon::prelude::*;

use crate::settings::*;
use crate::folder;
use crate::{AppState, AppStateStartUpErrors, AppStateSettingConfig};
use crate::file_handler;
use crate::syntax_highlight::LineContent;

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
pub struct ReadFileContentSuccessResult {
    pub line_contents_string: Arc<Vec<String>>,
    pub line_contents_dom: Arc<Vec<String>>,
    pub language: Arc<String>,
}

// first command to get invoked by frontend when app started
#[tauri::command]
pub fn check_app_startup_errs(state: State<AppState>) -> AppStateStartUpErrors {
    let errs = state.app_startup_errors.lock().unwrap();
    errs.to_vec()
}

#[tauri::command]
pub fn read_setting_configs(state: State<AppState>) -> AppStateSettingConfig {
    let config = state.settings_config.lock().unwrap();
    config.clone()
}

#[tauri::command]
pub async fn read_file_content(
    app: AppHandle,
    state: State<'_, AppState>, 
    file_path: &str
) -> Result<ReadFileContentSuccessResult, ()> {

    if !file_handler::is_readable_text_file(file_path) {
        app.emit("internal_error", "File is not Editable").unwrap();
        return Err(());
    }
    let file_content_caches = state.file_content_caches.lock().unwrap();
    
    if let Some((line_contents, content_dom, language)) = cmd_utils::read_file_content_from_cache(
        &file_content_caches,
        file_path
    ) {
        return Ok(ReadFileContentSuccessResult {
            line_contents_string: Arc::clone(&line_contents),
            line_contents_dom: Arc::clone(&content_dom),
            language: Arc::clone(&language),
        });
    }
    let language: String = cmd_utils::detect_language(file_path);
    let lines: Vec<String> = cmd_utils::get_lines_from_file(file_path);

    // clone from mutexguard and get underlying value of Option<Settings>
    let settings_config = state.settings_config.lock().unwrap().clone().unwrap();

    let line_contents: Vec<(LineContent, String)> = lines.into_par_iter()
        .map(|content| {
            let processed_content = content.replace("\u{a0}", " ").replace("\t", "    ");

            let mut line_content = LineContent { tokens: Vec::new() }; 
            line_content.tokens = cmd_utils::tokenize(language.as_str(), &settings_config, &processed_content);

            (line_content, processed_content)
        })
        .collect();

    let (line_contents_string, line_contents_dom): (Vec<_>, Vec<_>) = line_contents.par_iter()
        .map(|(line_content, processed_content)| {
            (
                processed_content.clone(),
                cmd_utils::line_processing(&line_content.tokens),
            )
        })
        .unzip();

    let result = ReadFileContentSuccessResult {
        line_contents_string: Arc::new(line_contents_string.clone()),
        line_contents_dom: Arc::new(line_contents_dom.clone()),
        language: Arc::new(language.clone())
    };

    let file_content_caches = Arc::clone(&state.file_content_caches);
    let file_path = file_path.to_string();
    tokio::spawn(async move {
        let mut file_content_caches = file_content_caches.lock().unwrap();
        cmd_utils::insert_file_content_into_cache(
            &mut file_content_caches,
            &line_contents_string,
            &line_contents_dom,
            &language,
            &file_path
        );
    });

    Ok(result)
}

#[tauri::command]
pub async fn update_file_content_cache(
    state: State<'_, AppState>,
    file_path: &str,
    line_contents_string: Vec<String>,
    line_contents_dom: Vec<String>
) -> Result<(), String> {
    let mut file_content_caches = state.file_content_caches.lock().unwrap();

    if let Some((line_contents, content_dom, _)) = file_content_caches.get_mut(file_path) {
        *line_contents = Arc::new(line_contents_string.clone());
        *content_dom = Arc::new(line_contents_dom.clone());
    } else {
        return Err(format!("File '{}' not found in cache", file_path));
    }
    Ok(())
}

#[tauri::command]
pub fn delete_file_content_cache(
    state: State<AppState>, 
    file_path: &str
) -> Result<(), ()> {
    let mut file_content_caches = state.file_content_caches.lock().unwrap();
    file_content_caches.remove(file_path);
    Ok(())
}


#[tauri::command]
pub fn read_folder_content(
    app: AppHandle,
    folder_path: &str, 
    layer_level: u8
) -> Result<Vec<folder::FolderItem>, ()> {

    let folder_items = match folder::read_folder_content(folder_path, layer_level) {
        Ok(items) => items,
        Err(_) => {
            app.emit("internal_error", "Fail to read folder content").unwrap();
            return Err(());
        },
    };
    Ok(folder_items)
}

#[tauri::command]
pub fn get_settings_file_path_cmd() -> String {
    let file_path: PathBuf = get_settings_file_path();
    file_path.to_string_lossy().into_owned()
}

#[tauri::command]
pub async fn save_file(
    app: AppHandle, 
    state: State<'_, AppState>, 
    file_path: &str, 
    content: &str
) -> Result<String, ()> {

    let mut file = match File::create(file_path) {
        Ok(f) => f,
        Err(_) => {
            app.emit("internal_error", "File does not exist").unwrap();
            return Err(());
        },
    };
    let content = content.replace("\u{a0}", " ").replace("\t", "    ");
    match file.write_all(content.as_bytes()) {
        Ok(_) => {
            if file_path.to_string() == get_settings_file_path_cmd() {
                let mut settings_state = state.settings_config.lock().unwrap();
                let mut new_settings_config: Settings = read_settings_file().unwrap();

                if let Some(ref mut settings) = *settings_state {
                    cmd_utils::detect_bg_image_path_change(&app, &settings, &mut new_settings_config);
                    cmd_utils::detect_bg_type_change(&app, &settings, &mut new_settings_config);
                    *settings = new_settings_config;
                }
            }
            return Ok("success".to_string());
        },
        Err(_) => {
            app.emit("internal_error", "Fail to save file").unwrap();
            return Err(());
        }
    }
}

#[tauri::command]
pub fn create_empty_file(
    app: AppHandle,
    file_path: &str, 
    file_name: &str, 
    layer_level: u8
) -> Result<folder::FolderItem, ()> {

    match File::create(file_path) {
        Ok(_) => Ok(folder::FolderItem::new_item_as_empty_file(file_name, file_path, layer_level)),
        Err(_) => {
            app.emit("internal_error", "Fail to create empty file").unwrap();
            Err(())
        }
    }
}

#[tauri::command]
pub fn create_empty_dir(
    app: AppHandle,
    dir_path: &str, 
    dir_name: &str, 
    layer_level: u8
) -> Result<folder::FolderItem, ()> {

    match create_dir(dir_path) {
        Ok(_) => Ok(folder::FolderItem::new_item_as_empty_dir(dir_path, dir_name, layer_level)),
        Err(_) => {
            app.emit("internal_error", "Fail to create empty directory").unwrap();
            Err(())
        }
    }
}

#[tauri::command]
pub fn exit_app() {
    std::process::exit(0);
}