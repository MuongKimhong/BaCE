use std::io::{Read, Write, Cursor};
use std::path::{Path, PathBuf};
use std::env;
use std::fs::{File, read};

use serde::{Deserialize, Serialize};
// use image::{ImageBuffer, Rgba, DynamicImage, ImageOutputFormat};
use base64::encode;

use crate::errors::{FileError, SettingsError};

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SidebarSetting {
    pub font_size: String,
    pub color: String,
    pub width: String, // percent
    pub width_adjustable: bool,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TabBarSetting {
    pub font_size: String,
    pub color: String,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EditorSetting {
    pub font_size: String,
    pub font_weight: String,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LanguageSyntaxHighlight {
    pub language: String,
    pub keyword_color: String,
    pub identifier_color: String,
    pub number_color: String,
    pub operator_color: String,
    pub punctuation_color: String,
    pub string_literal_color: String,
    pub whitespace_color: String,
    pub unknown_color: String,
    pub comment_color: String,
    pub class_name_color: String,
    pub function_name_color: String,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
pub struct SyntaxHighlight {
    pub languages: Vec<LanguageSyntaxHighlight>,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub bg_type: String, // image, color, default: color
    pub bg_color: String, // color name: default #212121
    pub bg_image_path: String, // full path to image on system: default ""
    pub bg_image_base64: String,
    pub font_family: String,
    pub side_bar: SidebarSetting,
    pub tab_bar: TabBarSetting,
    pub editor: EditorSetting,
    pub syntax_highlight: SyntaxHighlight
}

#[derive(Serialize, Deserialize)]
pub struct SettingsValidation {
    pub passed: bool,
    pub msg: String
}

impl SidebarSetting {
    fn init_default_values() -> SidebarSetting {
        SidebarSetting {
            font_size: "14px".to_string(),
            color: "white".to_string(),
            width: "100px".to_string(),
            width_adjustable: false
        }
    }
}

impl TabBarSetting {
    fn init_default_values() -> TabBarSetting {
        TabBarSetting {
            font_size: "13px".to_string(),
            color: "white".to_string(),
        }
    }
}

impl EditorSetting {
    fn init_default_values() -> EditorSetting {
        EditorSetting {
            font_size: "15px".to_string(),
            font_weight: "bold".to_string(),
        }
    }
}

impl LanguageSyntaxHighlight {
    fn init_default_values(language: String) -> LanguageSyntaxHighlight {
        LanguageSyntaxHighlight {
            language: language,
            keyword_color: "#bd00ff".to_string(),
            identifier_color: "#26ffd7".to_string(),
            number_color: "#ffb521".to_string(),
            operator_color: "white".to_string(),
            punctuation_color: "white".to_string(),
            string_literal_color: "#70ff00".to_string(),
            whitespace_color: "white".to_string(),
            unknown_color: "#ff7cf9".to_string(),
            comment_color: "grey".to_string(),
            class_name_color: "#ffe000".to_string(),
            function_name_color: "#4bb5ff".to_string()
        }
    }
}

impl SyntaxHighlight {
    fn init_default_values() -> SyntaxHighlight {
        let mut languages: Vec<LanguageSyntaxHighlight> = Vec::new();
        let support_languages = ["python", "javascript", "typescript", "rust"];

        for language in &support_languages {
            let language_syntax = LanguageSyntaxHighlight::init_default_values(
                language.to_string()
            );
            languages.push(language_syntax);
        }
        SyntaxHighlight {
            languages: languages
        }
    }
}

impl Settings {
    pub fn init_default_values() -> Settings {
        Settings {
            bg_type: "color".to_string(),
            bg_color: "#212121".to_string(),
            bg_image_path: "".to_string(),
            bg_image_base64: "".to_string(),
            font_family: "monospace".to_string(),
            side_bar: SidebarSetting::init_default_values(),
            tab_bar: TabBarSetting::init_default_values(),
            editor: EditorSetting::init_default_values(),
            syntax_highlight: SyntaxHighlight::init_default_values(),
        }
    }

    fn validate_file_extension(&self, path: &str, allowed_exts: &[&str]) -> Result<(), String> {
        let file_path = Path::new(path);
        if let Some(ext) = file_path.extension() {
            if let Some(ext_str) = ext.to_str() {
                if !allowed_exts.contains(&ext_str.to_lowercase().as_str()) {
                    return Err("Provided file type is not allowed.".to_string());
                }
            }
        }
        Ok(())
    }

    pub fn validate_settings(&self) -> SettingsValidation {
        let allowed_bg_types = ["image", "color"];
        let allowed_bg_image_types = ["jpeg", "jpg", "webp", "png"];

        // Check if background type is valid
        if !allowed_bg_types.contains(&self.bg_type.as_str()) {
            return SettingsValidation { 
                passed: false, 
                msg: "Provided background type is not allowed.".to_string() 
            };
        }
        if self.bg_type == "image" {
            if let Err(msg) = self.validate_file_extension(&self.bg_image_path, &allowed_bg_image_types) {
                return SettingsValidation { passed: false, msg };
            }
        }

        SettingsValidation { 
            passed: true, 
            msg: String::from("Settings valid.")
        }
    }

    pub fn encode_bg_image_base64(&mut self) -> Result<(), FileError> {
        match read(&self.bg_image_path) {
            Ok(image_data) => {
                let base64_image = format!(
                    "data:image/jpeg;base64, {}", 
                    encode(image_data)
                );
                self.bg_image_base64 = base64_image;
                Ok(())
            },
            Err(_) => Err(FileError::ReadFileFail)
        }
    }

    // pub fn read_webp_animation_file(&self) -> Result<Vec<u8>, FileError> {
    //     match read(&self.bg_animation_path) {
    //         Ok(animation_data) => Ok(animation_data),
    //         Err(_) => Err(FileError::ReadFileFail)
    //     }
    // }

    // pub fn convert_image_buffer_to_base64(&self, image: ImageBuffer<Rgba<u8>, Vec<u8>>) -> String {
    //     let mut buffer = Vec::new();

    //     DynamicImage::ImageRgba8(image)
    //         .write_to(&mut Cursor::new(&mut buffer), ImageOutputFormat::WebP)
    //         .unwrap();
        
    //     format!("data:image/webp;base64,{}", encode(&buffer))
    // }

    // pub fn create_image_buffer(&self, dimensions: (u32, u32), frame_buf_raw: Vec<u8>) -> Vec<u8> {
    //     let mut buf: Vec<u8> = Vec::with_capacity(dimensions.0 as usize * dimensions.1 as usize * 4);
    //     let img_buf = ImageBuffer::from_vec(dimensions.0, dimensions.1, frame_buf_raw).unwrap();

    //     DynamicImage::ImageRgba8(img_buf)
    //         .write_to(&mut Cursor::new(&mut buf), ImageOutputFormat::WebP)
    //         .unwrap();

    //     buf
    // }
}

pub fn get_settings_file_path() -> PathBuf {
    let mut file_path = PathBuf::from(env::var("HOME").unwrap());
    file_path.push("pvt_editor/settings.json");
    file_path
}

fn settings_file_exists() -> bool {      
    let settings_file_path: PathBuf = get_settings_file_path();
    settings_file_path.exists()
}

// create settings.json in $HOME/pvt_editor/settings.json
// when app start if file does not exist
pub fn init_settings_file() -> Result<(), SettingsError> {
    if settings_file_exists() {
        return Ok(());
    }
    update_settings_file(&Settings::init_default_values())?;
    Ok(()) 
}

pub fn update_settings_file(settings: &Settings) -> Result<(), SettingsError> {
    let mut file = File::create(get_settings_file_path())
        .map_err(|_| SettingsError::CreateSettingsFileFail)?;

    let json_data = serde_json::to_string_pretty(settings)
        .map_err(|_| SettingsError::UpdateSettingsFileFail)?;

    file.write_all(json_data.as_bytes())
        .map_err(|_| SettingsError::UpdateSettingsFileFail)?;

    Ok(())
}

pub fn read_settings_file() -> Result<Settings, SettingsError> {
    let file_path: PathBuf = get_settings_file_path();

    let mut file = File::open(&file_path)
        .map_err(|_| SettingsError::ReadSettingsFileFail)?;

    let mut data = String::new();
    file.read_to_string(&mut data).map_err(|_| SettingsError::ReadSettingsFileFail)?;

    data = data
        .replace("\u{a0}", " ")
        .replace("\t", "    ")
        .replace("\\\"", "\"");
    
    let settings: Settings = serde_json::from_str(&data)
        .map_err(|_| SettingsError::ReadSettingsFromFileToStructFail)?;

    if !settings.validate_settings().passed {
        return Err(SettingsError::InvalidSettingsFieldValue);
    }
    Ok(settings)
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sidebar_setting_defaults() {
        let default_sidebar = SidebarSetting::init_default_values();
        assert_eq!(default_sidebar.font_size, "14px");
        assert_eq!(default_sidebar.color, "white");
        assert_eq!(default_sidebar.width, "100px");
        assert_eq!(default_sidebar.width_adjustable, false);
    }

    #[test]
    fn test_tab_bar_setting_defaults() {
        let default_tab_bar = TabBarSetting::init_default_values();
        assert_eq!(default_tab_bar.font_size, "13px");
        assert_eq!(default_tab_bar.color, "white");
    }

    #[test]
    fn test_editor_setting_defaults() {
        let default_editor = EditorSetting::init_default_values();
        assert_eq!(default_editor.font_size, "15px");
        assert_eq!(default_editor.font_weight, "bold");
    }

    #[test]
    fn test_language_syntax_highlight_defaults() {
        let default_syntax = LanguageSyntaxHighlight::init_default_values("python".to_string());
        assert_eq!(default_syntax.language, "python");
        assert_eq!(default_syntax.keyword_color, "#bd00ff");
        assert_eq!(default_syntax.identifier_color, "#26ffd7");
        assert_eq!(default_syntax.number_color, "#ffb521");
        assert_eq!(default_syntax.operator_color, "white");
        assert_eq!(default_syntax.punctuation_color, "white");
        assert_eq!(default_syntax.string_literal_color, "#70ff00");
        assert_eq!(default_syntax.whitespace_color, "white");
        assert_eq!(default_syntax.unknown_color, "#ff7cf9");
        assert_eq!(default_syntax.comment_color, "grey");
        assert_eq!(default_syntax.class_name_color, "#ffe000");
        assert_eq!(default_syntax.function_name_color, "#4bb5ff");
    }

    #[test]
    fn test_syntax_highlight_defaults() {
        let default_syntax_highlight = SyntaxHighlight::init_default_values();
        let expected_languages = ["python", "javascript", "typescript", "rust"];

        for (i, language) in expected_languages.iter().enumerate() {
            assert_eq!(default_syntax_highlight.languages[i].language, *language);
        }
    }
}
