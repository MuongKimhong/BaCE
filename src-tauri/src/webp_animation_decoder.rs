// for decoding animated webp frames
// originally, there are 3 types of background, color, image & animation &
// animation background has to be a animated webp file.

// code below was copied & modified from https://github.com/blaind/webp-animation
// as we only need Vec<u8> data.


use std::{fmt::Debug, mem, pin::Pin};
use libwebp_sys as webp;

use crate::errors::WebPDecoderError;

const MAX_CANVAS_SIZE: usize = 3840 * 2160; // 4k

#[derive(Copy, Clone, PartialEq, Debug)]
pub enum ColorMode {
    Rgb,
    Rgba,
    Bgra,
    Bgr,
}

impl ColorMode {
    /// Return the pixel bytesize for the color mode
    pub fn size(&self) -> usize {
        match self {
            Self::Rgb | Self::Bgr => 3,
            Self::Rgba | Self::Bgra => 4,
        }
    }
}

 #[derive(PartialEq, Debug, Clone)]
pub struct DecoderOptions {
    pub use_threads: bool,
    pub color_mode: ColorMode,
}

impl Default for DecoderOptions {
    fn default() -> Self {
        Self {
            use_threads: true,
            color_mode: ColorMode::Rgba,
        }
    }
}

#[derive(Clone, Debug)]
pub struct Decoder{
    buffer: Vec<u8>,
    decoder_wr: DecoderWrapper,
    info: webp::WebPAnimInfo,
    options: DecoderOptions,
}

impl Decoder {
    pub fn new(buffer: Vec<u8>) -> Result<Self, WebPDecoderError> {
        if buffer.is_empty() {
            return Err(WebPDecoderError::ZeroSizeBuffer);
        }
        Decoder::new_with_options(buffer, Default::default())
    }

    pub fn new_with_options(buffer: Vec<u8>, options: DecoderOptions) -> Result<Self, WebPDecoderError> {
        if buffer.is_empty() {
            return Err(WebPDecoderError::ZeroSizeBuffer);
        }
        let mut decoder_options = Box::pin(unsafe {
            let mut options = mem::zeroed();
            if webp::WebPAnimDecoderOptionsInit(&mut options) != 1 {
                return Err(WebPDecoderError::OptionsInitFailed);
            }
            options
        });

        decoder_options.use_threads = if options.use_threads { 1 } else { 0 };
        decoder_options.color_mode = match options.color_mode {
            ColorMode::Rgba => libwebp_sys::MODE_RGBA,
            ColorMode::Bgra => libwebp_sys::MODE_BGRA,
            ColorMode::Rgb => libwebp_sys::MODE_RGB,
            ColorMode::Bgr => libwebp_sys::MODE_BGR,
        };
        // pin data (& options above) because decoder takes reference to them
        let data = Box::pin(webp::WebPData {
            bytes: buffer.as_ptr(),
            size: buffer.len(),
        });
        let decoder_wr = DecoderWrapper::new(data, decoder_options)?;

        let info = unsafe {
            let mut info = mem::zeroed();
            if webp::WebPAnimDecoderGetInfo(decoder_wr.decoder, &mut info) != 1 {
                return Err(WebPDecoderError::DecoderGetInfoFailed);
            }
            info
        };
        // prevent too large allocations
        if info.canvas_width * info.canvas_height > MAX_CANVAS_SIZE as u32 {
            return Err(WebPDecoderError::TooLargeCanvas(
                info.canvas_width,
                info.canvas_height,
                MAX_CANVAS_SIZE,
            ));
        }
        Ok(Self {
            buffer,
            decoder_wr,
            info,
            options,
        })
    }

    pub fn dimensions(&self) -> (u32, u32) {
        (self.info.canvas_width, self.info.canvas_height)
    }

    fn has_more_frames(&self) -> bool {
        let frames = unsafe { webp::WebPAnimDecoderHasMoreFrames(self.decoder_wr.decoder) };
        frames > 0
    }

    pub fn frame_count(&self) -> usize {
        self.info.frame_count as usize
    }
}

#[derive(Debug, Clone)]
struct DecoderWrapper {
    decoder: *mut webp::WebPAnimDecoder,
    #[allow(dead_code)]
    data: Pin<Box<webp::WebPData>>,
    #[allow(dead_code)]
    options: Pin<Box<webp::WebPAnimDecoderOptions>>,
}

impl DecoderWrapper {
    pub fn new(data: Pin<Box<webp::WebPData>>, options: Pin<Box<webp::WebPAnimDecoderOptions>>) -> Result<Self, WebPDecoderError> {
        let decoder = unsafe { webp::WebPAnimDecoderNew(&*data, &*options) };
        if decoder.is_null() {
            return Err(WebPDecoderError::DecodeFailed);
        }
        Ok(Self { decoder, data, options })
    }
}

impl Drop for DecoderWrapper {
    fn drop(&mut self) {
        unsafe { webp::WebPAnimDecoderDelete(self.decoder) };
    }
}

impl IntoIterator for Decoder {
    type Item = Vec<u8>;
    type IntoIter = DecoderIterator;

    fn into_iter(self) -> Self::IntoIter {
        DecoderIterator::new(self)
    }
}

pub struct DecoderIterator {
    animation_decoder: Decoder,
    frames_processed: usize,
}

impl DecoderIterator {
    fn new(animation_decoder: Decoder) -> Self {
        Self { animation_decoder, frames_processed: 0 }
    }

    fn frame_count(&self) -> usize {
        self.animation_decoder.frame_count()
    }
}

impl Iterator for DecoderIterator {
    type Item = Vec<u8>;

    fn next(&mut self) -> Option<Self::Item> {
        if self.frames_processed >= self.frame_count() {
            return None;
        }
        let mut output_buffer = std::ptr::null_mut();
        let mut timestamp: i32 = 0;

        if unsafe {
            webp::WebPAnimDecoderGetNext(
                self.animation_decoder.decoder_wr.decoder,
                &mut output_buffer,
                &mut timestamp,
            )
        } != 1 {
            // Handle error or return None if failed
            panic!("crash decoder");
        }

        let info = &self.animation_decoder.info;
        let opts = &self.animation_decoder.options;
        let data = unsafe {
            std::slice::from_raw_parts(
                output_buffer,
                info.canvas_width as usize * info.canvas_height as usize * opts.color_mode.size(),
            ).to_vec()
        };
        self.frames_processed += 1;
        Some(data)
    }
}