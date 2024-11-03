use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use uuid::Uuid;

use crate::errors::FolderError;

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FolderItem {
    pub id: String,
    pub name: String,
    pub layer_level: u8,
    pub is_dir: bool,
    pub is_file: bool,
    pub is_focus: bool,
    pub full_path: String,
    pub dir_opened: bool,
    pub file_content_changed: bool
}

impl FolderItem {
    pub fn new_item_as_empty_file(file_name: &str, file_path: &str, layer_level: u8) -> FolderItem {
        FolderItem {
            id: Uuid::new_v4().to_string()[..6].to_string(),
            name: file_name.to_string(),
            layer_level: layer_level,
            is_dir: false,
            is_file: true,
            is_focus: false,
            full_path: file_path.to_string(),
            dir_opened: false,
            file_content_changed: false,
        }
    }

    pub fn new_item_as_empty_dir(dir_name: &str, dir_path: &str, layer_level: u8) -> FolderItem {
        FolderItem {
            id: Uuid::new_v4().to_string()[..6].to_string(),
            name: dir_name.to_string(),
            layer_level: layer_level,
            is_dir: true,
            is_file: false,
            is_focus: false,
            full_path: dir_path.to_string(),
            dir_opened: false,
            file_content_changed: false,
        }
    }
}

pub fn read_folder_content(folder_path: &str, layer_level: u8) -> Result<Vec<FolderItem>, FolderError> {
    let mut folder_items: Vec<FolderItem> = Vec::new();
    let mut folder_items_as_dir: Vec<FolderItem> = Vec::new();
    let mut folder_items_as_file: Vec<FolderItem> = Vec::new();

    let items = fs::read_dir(Path::new(folder_path)).unwrap();

    for item in items {
        match item {
            Ok(item) => {
                let item_path = item.path().to_string_lossy().to_string();
                let item_type = item.file_type().unwrap();
                let mut item_name = String::new();
                
                if let Some(name) = item.file_name().to_str() {
                    item_name = name.to_string();
                }
                
                let folder_item = FolderItem {
                    id: Uuid::new_v4().to_string()[..6].to_string(),
                    name: item_name,
                    layer_level: layer_level,
                    is_dir: item_type.is_dir(),
                    is_file: item_type.is_file(),
                    is_focus: false,
                    full_path: item_path.to_string(),
                    dir_opened: false,
                    file_content_changed: false,
                };
                if item_type.is_file() {
                    folder_items_as_file.push(folder_item);
                } 
                else if item_type.is_dir() {
                    folder_items_as_dir.push(folder_item);
                } 
            },
            Err(_) => return Err(FolderError::ReadContentsFail),
        }
    }
    folder_items.append(&mut folder_items_as_dir);
    folder_items.append(&mut folder_items_as_file);
    Ok(folder_items)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;
    use std::fs::{self, File};

    #[test]
    fn test_new_item_as_empty_file() {
        let file_name = "test_file.txt";
        let file_path = "/path/to/test_file.txt";
        let layer_level = 1;
        let file_item = FolderItem::new_item_as_empty_file(file_name, file_path, layer_level);

        assert_eq!(file_item.name, file_name);
        assert_eq!(file_item.full_path, file_path);
        assert_eq!(file_item.layer_level, layer_level);
        assert!(file_item.is_file);
        assert!(!file_item.is_dir);
        assert!(!file_item.is_focus);
    }

    #[test]
    fn test_new_item_as_empty_dir() {
        let dir_name = "test_dir";
        let dir_path = "/path/to/test_dir";
        let layer_level = 2;
        let dir_item = FolderItem::new_item_as_empty_dir(dir_name, dir_path, layer_level);

        assert_eq!(dir_item.name, dir_name);
        assert_eq!(dir_item.full_path, dir_path);
        assert_eq!(dir_item.layer_level, layer_level);
        assert!(dir_item.is_dir);
        assert!(!dir_item.is_file);
        assert!(!dir_item.is_focus);
    }

    #[test]
    fn test_read_folder_content() {
        // Set up a temporary directory
        let temp_dir = tempdir().unwrap();
        let temp_dir_path = temp_dir.path();

        let sub_dir_path = temp_dir_path.join("sub_dir");
        let file_path = temp_dir_path.join("test_file.txt");

        fs::create_dir(&sub_dir_path).unwrap();
        File::create(&file_path).unwrap();

        let folder_items = read_folder_content(temp_dir_path.to_str().unwrap(), 0).unwrap();

        assert_eq!(folder_items.len(), 2);

        let dir_item = folder_items.iter().find(|item| item.name == "sub_dir").unwrap();
        assert_eq!(dir_item.name, "sub_dir");
        assert!(dir_item.is_dir);
        assert!(!dir_item.is_file);
        assert_eq!(dir_item.layer_level, 0);

        let file_item = folder_items.iter().find(|item| item.name == "test_file.txt").unwrap();
        assert_eq!(file_item.name, "test_file.txt");
        assert!(!file_item.is_dir);
        assert!(file_item.is_file);
        assert_eq!(file_item.layer_level, 0);
    }
}
