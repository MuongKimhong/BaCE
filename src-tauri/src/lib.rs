#[cfg_attr(mobile, tauri::mobile_entry_point)]

use std::fs;
use std::env;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::path::{PathBuf};
use std::io::{Write, Read};

pub mod syntax_highlight;
pub mod file_handler;
pub mod commands;
pub mod settings;
pub mod folder;
pub mod errors;

use crate::settings::*;

pub type AppStateStartUpErrors = Vec<String>;
pub type AppStateSettingConfig = Option<Settings>;
pub type LineContentsString = Arc<Vec<String>>;
pub type ContentDOM = Arc<Vec<String>>;
pub type Langauge = Arc<String>;
pub type AppStateFileContentCaches = HashMap<String, (LineContentsString, ContentDOM, Langauge)>;

#[derive(Debug)]
pub struct AppState {
    pub settings_config: Arc<Mutex<AppStateSettingConfig>>,
    pub app_startup_errors: Arc<Mutex<AppStateStartUpErrors>>,
    pub file_content_caches: Arc<Mutex<AppStateFileContentCaches>>
}

fn handle_create_pvt_directory(startup_errors: &mut AppStateStartUpErrors) {
    const FAIL_MSG: &str = "Failed to create pvt_editor folder in home directory";

    let home_dir = match env::var("HOME") {
        Ok(path) => PathBuf::from(path),
        Err(_) => {
            startup_errors.push(FAIL_MSG.to_string());
            return;
        }
    };
    let pvt_editor_dir = home_dir.join("pvt_editor");
    if !pvt_editor_dir.exists() {
        match fs::create_dir_all(&pvt_editor_dir) {
            Ok(_) => (),
            Err(_) => startup_errors.push(FAIL_MSG.to_string())
        }
    }
}

pub fn run() {
    let mut startup_errors: AppStateStartUpErrors = Vec::new();
    let file_content_caches: AppStateFileContentCaches = HashMap::new();

    handle_create_pvt_directory(&mut startup_errors); 

    init_settings_file().unwrap_or_else(|e| {
        startup_errors.push(format!("{e}"));
    });

    let mut settings_config: AppStateSettingConfig = match read_settings_file() {
        Ok(s) => Some(s),
        Err(e) => {
            startup_errors.push(format!("{e}"));
            None
        },
    };  

    if let Some(ref mut settings) = settings_config {
        if settings.app.bg_type == "image" && !settings.app.bg_image_path.is_empty() {
            match settings.encode_bg_image_base64() {
                Ok(_) => (),
                Err(e) => startup_errors.push(format!("{e}")),
            }
        }
    }
    let app_state = AppState {
        settings_config: Arc::new(Mutex::new(settings_config)),
        app_startup_errors: Arc::new(Mutex::new(startup_errors)),
        file_content_caches: Arc::new(Mutex::new(file_content_caches))
    };
    tauri::Builder::default()
      .manage(app_state)
      .invoke_handler(tauri::generate_handler![
        commands::check_app_startup_errs, // first command to get invoked by frontend when app started
        commands::read_setting_configs, 
        commands::read_file_content,
        commands::read_folder_content,
        commands::get_settings_file_path_cmd,
        commands::save_file,
        commands::update_file_content_cache,
        commands::delete_file_content_cache,
        commands::create_empty_file,
        commands::create_empty_dir,
        commands::exit_app
      ])
      .plugin(tauri_plugin_fs::init())
      .plugin(tauri_plugin_dialog::init())
      .run(tauri::generate_context!())
      .expect("error while running tauri application");
}
