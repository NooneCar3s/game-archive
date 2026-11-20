use image::ImageReader;
use image::imageops::FilterType;
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::collections::HashSet;
use std::fs;
use std::io::BufWriter;
use std::path::Path;
use tauri::{AppHandle, Manager};
use uuid::Uuid;

#[derive(Serialize)]
struct ImportedScreenshot {
    id: String,
    file_name: String,
    file_path: String,
    thumbnail_path: String,
    content_hash: String,
}

fn create_thumbnail(source: &Path, thumbnails_dir: &Path, id: &str) -> Result<String, String> {
    fs::create_dir_all(thumbnails_dir)
        .map_err(|e| format!("Failed to create thumbnails folder: {e}"))?;

    let image = ImageReader::open(source)
        .map_err(|e| format!("Failed to open image: {e}"))?
        .decode()
        .map_err(|e| format!("Failed to decode image: {e}"))?;

    let thumbnail = image.resize(800, 800, FilterType::Lanczos3);

    let thumbnail_path = thumbnails_dir.join(format!("{id}.jpg"));
    let file = fs::File::create(&thumbnail_path)
        .map_err(|e| format!("Failed to create thumbnail: {e}"))?;

    let mut writer = BufWriter::new(file);

    let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut writer, 82);

    thumbnail
        .write_with_encoder(encoder)
        .map_err(|e| format!("Failed to save thumbnail: {e}"))?;

    Ok(thumbnail_path.to_string_lossy().to_string())
}

fn supported_image(path: &Path) -> bool {
    let extension = path
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_lowercase();

    ["png", "jpg", "jpeg", "webp"].contains(&extension.as_str())
}

fn calculate_hash(path: &Path) -> Result<String, String> {
    let contents = fs::read(path).map_err(|e| format!("Failed to read image: {e}"))?;

    let hash = Sha256::digest(&contents);

    Ok(format!("{:x}", hash))
}

fn import_image(
    source: &Path,
    images_dir: &Path,
    thumbnails_dir: &Path,
    known_hashes: &mut HashSet<String>,
) -> Result<Option<ImportedScreenshot>, String> {
    if !source.is_file() || !supported_image(source) {
        return Ok(None);
    }

    let content_hash = calculate_hash(source)?;

    if !known_hashes.insert(content_hash.clone()) {
        return Ok(None);
    }

    let id = Uuid::new_v4().to_string();

    let extension = source
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("png")
        .to_lowercase();

    let file_name = source
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("screenshot")
        .to_string();

    let destination = images_dir.join(format!("{id}.{extension}"));

    if let Err(error) = fs::copy(source, &destination) {
        known_hashes.remove(&content_hash);
        return Err(format!("Failed to copy {file_name}: {error}"));
    }

    let thumbnail_path = match create_thumbnail(&destination, thumbnails_dir, &id) {
        Ok(path) => path,
        Err(error) => {
            eprintln!("Thumbnail generation failed for {file_name}: {error}");
            destination.to_string_lossy().to_string()
        }
    };

    Ok(Some(ImportedScreenshot {
        id,
        file_name,
        file_path: destination.to_string_lossy().to_string(),
        thumbnail_path,
        content_hash,
    }))
}

#[tauri::command]
async fn import_screenshots(
    app: AppHandle,
    paths: Vec<String>,
    existing_hashes: Vec<String>,
) -> Result<Vec<ImportedScreenshot>, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

    let images_dir = app_data_dir.join("images");
    let thumbnails_dir = app_data_dir.join("thumbnails");

    fs::create_dir_all(&images_dir).map_err(|e| format!("Failed to create images folder: {e}"))?;

    fs::create_dir_all(&thumbnails_dir)
        .map_err(|e| format!("Failed to create thumbnails folder: {e}"))?;

    let mut known_hashes: HashSet<String> = existing_hashes.into_iter().collect();
    let mut imported = Vec::new();

    for source_path in paths {
        let source = Path::new(&source_path);

        match import_image(source, &images_dir, &thumbnails_dir, &mut known_hashes) {
            Ok(Some(screenshot)) => imported.push(screenshot),
            Ok(None) => {}
            Err(error) => eprintln!("{error}"),
        }
    }

    Ok(imported)
}

fn scan_directory(
    directory: &Path,
    images_dir: &Path,
    thumbnails_dir: &Path,
    known_hashes: &mut HashSet<String>,
    imported: &mut Vec<ImportedScreenshot>,
) {
    let entries = match fs::read_dir(directory) {
        Ok(entries) => entries,
        Err(_) => return,
    };

    for entry in entries {
        let entry = match entry {
            Ok(entry) => entry,
            Err(_) => continue,
        };

        let path = entry.path();

        let file_type = match entry.file_type() {
            Ok(file_type) => file_type,
            Err(_) => continue,
        };

        if file_type.is_dir() {
            let is_images_dir = path.canonicalize().ok() == images_dir.canonicalize().ok();

            let is_thumbnails_dir = path.canonicalize().ok() == thumbnails_dir.canonicalize().ok();

            if !is_images_dir && !is_thumbnails_dir {
                scan_directory(&path, images_dir, thumbnails_dir, known_hashes, imported);
            }
        } else if file_type.is_file() {
            match import_image(&path, images_dir, thumbnails_dir, known_hashes) {
                Ok(Some(screenshot)) => imported.push(screenshot),
                Ok(None) => {}
                Err(error) => eprintln!("{error}"),
            }
        }
    }
}

#[tauri::command]
async fn scan_watched_folders(
    app: AppHandle,
    folders: Vec<String>,
    existing_hashes: Vec<String>,
) -> Result<Vec<ImportedScreenshot>, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

    let images_dir = app_data_dir.join("images");
    let thumbnails_dir = app_data_dir.join("thumbnails");

    fs::create_dir_all(&images_dir).map_err(|e| format!("Failed to create images folder: {e}"))?;

    fs::create_dir_all(&thumbnails_dir)
        .map_err(|e| format!("Failed to create thumbnails folder: {e}"))?;

    let mut known_hashes: HashSet<String> = existing_hashes.into_iter().collect();
    let mut imported = Vec::new();

    for folder in folders {
        let directory = Path::new(&folder);

        if !directory.is_dir() {
            continue;
        }

        scan_directory(
            directory,
            &images_dir,
            &thumbnails_dir,
            &mut known_hashes,
            &mut imported,
        );
    }

    Ok(imported)
}

#[tauri::command]
fn delete_screenshot_file(app: AppHandle, file_path: String) -> Result<(), String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

    let images_dir = app_data_dir.join("images");
    let thumbnails_dir = app_data_dir.join("thumbnails");

    let images_dir = images_dir
        .canonicalize()
        .map_err(|e| format!("Failed to find images folder: {e}"))?;

    let target = Path::new(&file_path)
        .canonicalize()
        .map_err(|e| format!("Failed to find image: {e}"))?;

    if !target.starts_with(&images_dir) || !target.is_file() {
        return Err("Invalid image path".to_string());
    }

    let file_stem = target
        .file_stem()
        .and_then(|name| name.to_str())
        .ok_or_else(|| "Invalid image filename".to_string())?;

    fs::remove_file(&target).map_err(|e| format!("Failed to delete image: {e}"))?;

    let thumbnail_path = thumbnails_dir.join(format!("{file_stem}.jpg"));

    if thumbnail_path.is_file() {
        fs::remove_file(&thumbnail_path).map_err(|e| format!("Failed to delete thumbnail: {e}"))?;
    }

    Ok(())
}

#[tauri::command]
fn delete_all_screenshot_files(app: AppHandle) -> Result<(), String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

    let images_dir = app_data_dir.join("images");
    let thumbnails_dir = app_data_dir.join("thumbnails");

    for directory in [&images_dir, &thumbnails_dir] {
        if !directory.exists() {
            continue;
        }

        if !directory.is_dir() {
            return Err(format!("Path is not a directory: {}", directory.display()));
        }

        for entry in
            fs::read_dir(directory).map_err(|e| format!("Failed to read directory: {e}"))?
        {
            let entry = entry.map_err(|e| format!("Failed to read directory entry: {e}"))?;
            let path = entry.path();

            if path.is_file() {
                fs::remove_file(&path).map_err(|e| format!("Failed to delete file: {e}"))?;
            }
        }
    }

    Ok(())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            scan_watched_folders,
            delete_screenshot_file,
            import_screenshots,
            delete_all_screenshot_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
