use std::io::{self, Read};
use std::path::Path;
use std::fs::File;

const NON_TEXT_EXTENSIONS: [&str; 11] = [
    "jpg", "jpeg", "png", "gif", 
    "mp4", "mov", "avi", "mp3", "pdf", 
    "bmp", "tiff"
];

fn check_extension(path: &Path) -> bool {
    let file_extension = path
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();
        
    NON_TEXT_EXTENSIONS.contains(&file_extension.as_str())
}

fn check_valid_utf8(file_buffer: &Vec<u8>) -> bool {
    std::str::from_utf8(&file_buffer).is_ok()
}

fn check_file_buffer_valid(path: &Path) -> bool {
    let mut file = File::open(path).unwrap();
    let mut buffer = Vec::new();

    if file.read_to_end(&mut buffer).is_err() {
        return false;
    }
    if !check_valid_utf8(&buffer) {
        return false;
    }
    true
}


pub fn is_readable_text_file(file_path: &str) -> bool {
    let path = Path::new(file_path);
    
    if check_extension(&path) {
        return false;
    }

    if !check_file_buffer_valid(&path) {
        return false;
    }
    return true;
}