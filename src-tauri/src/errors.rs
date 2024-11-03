use thiserror;

#[derive(Debug, thiserror::Error, PartialEq)]
pub enum FileError {
    #[error("Failed to read the file")]
    ReadFileFail,
    
    #[error("Failed to update the file")]
    UpdateFileFail,
    
    #[error("Failed to create the file")]
    CreateFileFail,
    
    #[error("The file does not exist")]
    FileDoesNotExist,
}

#[derive(Debug, thiserror::Error, PartialEq)]
pub enum SettingsError {
    #[error("Failed to read settings.json file")]
    ReadSettingsFileFail,

    #[error("Failed to update settings.json file")]
    UpdateSettingsFileFail,

    #[error("Failed to create settings.json file in /home/pvt_editor directory")]
    CreateSettingsFileFail,

    #[error("Couldn't find settings.json file in /home/pvt_editor directory")]
    SettingsFileNotFound,

    #[error("Fail to convert settings file data to struct data")]
    ReadSettingsFromFileToStructFail,

    #[error("Provided value in settings file is invalid")]
    InvalidSettingsFieldValue,

    #[error("Fail to encode background image to base64")]
    EncodeBgImageToBase64Fail
}

#[derive(Debug, thiserror::Error, PartialEq)]
pub enum PVTEditorDirectoryError {
    #[error("Failed to create pvt_editor folder inside home directory")]
    CreatePVTEditorDirectoryFail,

    #[error("Failed to read pvt_editor folder inside home directory")]
    ReadPVTEditorDirectoryFail,
}

#[derive(Debug, thiserror::Error, PartialEq)]
pub enum FolderError {
    #[error("Failed to read folder content")]
    ReadContentsFail,
}


#[derive(Debug, thiserror::Error)]
pub enum WebPDecoderError {
    #[error("Failed to initialize WebP decoder options")]
    OptionsInitFailed,
    
    #[error("Failed to decode WebP animation")]
    DecodeFailed,

    #[error("Failed to get information from WebP animation decoder")]
    DecoderGetInfoFailed,

    #[error("Buffer is empty")]
    ZeroSizeBuffer,

    #[error("Canvas size is too large")]
    TooLargeCanvas(u32, u32, usize),
    
    #[error("Join thread error")]
    TaskJoinError(String),

    #[error("Other webp erro")]
    Other(String),
}