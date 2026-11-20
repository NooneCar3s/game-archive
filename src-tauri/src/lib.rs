use image::ImageReader;
use image::imageops::FilterType;
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::io::{BufWriter, Read};
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
    game: Option<String>,
}

#[derive(Clone, Serialize, serde::Deserialize)]
struct ScannedFile {
    source_path: String,
    size_bytes: String,
    modified_ns: String,
    content_hash: String,
    game: Option<String>,
}

#[derive(Serialize)]
struct ScreenshotGameUpdate {
    content_hash: String,
    game: String,
}

#[derive(Serialize)]
struct ScanResult {
    imported: Vec<ImportedScreenshot>,
    scanned_files: Vec<ScannedFile>,
    game_updates: Vec<ScreenshotGameUpdate>,
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
    let file = fs::File::open(path).map_err(|e| format!("Failed to read image: {e}"))?;
    let mut reader = std::io::BufReader::new(file);
    let mut hasher = Sha256::new();
    let mut buffer = [0; 64 * 1024];

    loop {
        let bytes_read = reader
            .read(&mut buffer)
            .map_err(|e| format!("Failed to read image: {e}"))?;
        if bytes_read == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_read]);
    }

    Ok(format!("{:x}", hasher.finalize()))
}

fn file_fingerprint(path: &Path) -> Result<(String, String), String> {
    let metadata = fs::metadata(path).map_err(|e| format!("Failed to read file metadata: {e}"))?;
    let modified_ns = metadata
        .modified()
        .map_err(|e| format!("Failed to read file modification time: {e}"))?
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| format!("Invalid file modification time: {e}"))?
        .as_nanos()
        .to_string();

    Ok((metadata.len().to_string(), modified_ns))
}

fn game_for_nvidia_path(root: &Path, image_path: &Path) -> Option<String> {
    let relative_path = image_path.strip_prefix(root).ok()?;
    let mut components = relative_path.components();
    let game_folder = components.next()?.as_os_str().to_str()?;
    // A file directly inside ScreenShots has no game folder to infer from.
    components.next()?;
    let game = game_folder.trim();
    (!game.is_empty()).then(|| game.to_string())
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

    import_image_with_hash(
        source,
        images_dir,
        thumbnails_dir,
        known_hashes,
        content_hash,
        None,
    )
}

fn import_image_with_hash(
    source: &Path,
    images_dir: &Path,
    thumbnails_dir: &Path,
    known_hashes: &mut HashSet<String>,
    content_hash: String,
    game: Option<String>,
) -> Result<Option<ImportedScreenshot>, String> {
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
        game,
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
    cached_files: &HashMap<String, ScannedFile>,
    scanned_files: &mut Vec<ScannedFile>,
    game_updates: &mut Vec<ScreenshotGameUpdate>,
    imported: &mut Vec<ImportedScreenshot>,
    assign_game_from_folder: bool,
    root: &Path,
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
                scan_directory(
                    &path,
                    images_dir,
                    thumbnails_dir,
                    known_hashes,
                    cached_files,
                    scanned_files,
                    game_updates,
                    imported,
                    assign_game_from_folder,
                    root,
                );
            }
        } else if file_type.is_file() {
            if !supported_image(&path) {
                continue;
            }
            let source_path = path.to_string_lossy().to_string();
            let game = if assign_game_from_folder {
                game_for_nvidia_path(root, &path)
            } else {
                None
            };
            let (size_bytes, modified_ns) = match file_fingerprint(&path) {
                Ok(fingerprint) => fingerprint,
                Err(error) => {
                    eprintln!("{error}");
                    continue;
                }
            };
            if let Some(cached) = cached_files.get(&source_path).filter(|cached| {
                cached.size_bytes == size_bytes && cached.modified_ns == modified_ns
            }) {
                // A regular watched folder must not erase an NVIDIA game
                // assignment if the same root is configured in both lists.
                if cached.game == game || (!assign_game_from_folder && cached.game.is_some()) {
                    continue;
                }
                if let Some(game_name) = game.as_ref() {
                    game_updates.push(ScreenshotGameUpdate {
                        content_hash: cached.content_hash.clone(),
                        game: game_name.clone(),
                    });
                }
                scanned_files.push(ScannedFile {
                    source_path,
                    size_bytes,
                    modified_ns,
                    content_hash: cached.content_hash.clone(),
                    game,
                });
                continue;
            }
            let content_hash = match calculate_hash(&path) {
                Ok(hash) => hash,
                Err(error) => {
                    eprintln!("{error}");
                    continue;
                }
            };
            if known_hashes.contains(&content_hash) {
                if let Some(game_name) = game.as_ref() {
                    game_updates.push(ScreenshotGameUpdate {
                        content_hash: content_hash.clone(),
                        game: game_name.clone(),
                    });
                }
                scanned_files.push(ScannedFile {
                    source_path,
                    size_bytes,
                    modified_ns,
                    content_hash,
                    game,
                });
                continue;
            }
            match import_image_with_hash(
                &path,
                images_dir,
                thumbnails_dir,
                known_hashes,
                content_hash,
                game.clone(),
            ) {
                Ok(Some(screenshot)) => {
                    scanned_files.push(ScannedFile {
                        source_path,
                        size_bytes,
                        modified_ns,
                        content_hash: screenshot.content_hash.clone(),
                        game,
                    });
                    imported.push(screenshot);
                }
                Ok(None) => unreachable!("new content hash was inserted before import"),
                Err(error) => eprintln!("{error}"),
            }
        }
    }
}

#[tauri::command]
async fn scan_watched_folders(
    app: AppHandle,
    folders: Vec<String>,
    nvidia_folders: Vec<String>,
    existing_hashes: Vec<String>,
    cached_files: Vec<ScannedFile>,
) -> Result<ScanResult, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

    let images_dir = app_data_dir.join("images");
    let thumbnails_dir = app_data_dir.join("thumbnails");

    fs::create_dir_all(&images_dir).map_err(|e| format!("Failed to create images folder: {e}"))?;

    fs::create_dir_all(&thumbnails_dir)
        .map_err(|e| format!("Failed to create thumbnails folder: {e}"))?;

    let mut known_hashes: HashSet<String> = existing_hashes.into_iter().collect();
    let cached_files: HashMap<String, ScannedFile> = cached_files
        .into_iter()
        .map(|file| (file.source_path.clone(), file))
        .collect();
    let mut imported = Vec::new();
    let mut scanned_files = Vec::new();
    let mut game_updates = Vec::new();

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
            &cached_files,
            &mut scanned_files,
            &mut game_updates,
            &mut imported,
            false,
            directory,
        );
    }

    for folder in nvidia_folders {
        let directory = Path::new(&folder);
        if !directory.is_dir() {
            continue;
        }

        scan_directory(
            directory,
            &images_dir,
            &thumbnails_dir,
            &mut known_hashes,
            &cached_files,
            &mut scanned_files,
            &mut game_updates,
            &mut imported,
            true,
            directory,
        );
    }

    Ok(ScanResult {
        imported,
        scanned_files,
        game_updates,
    })
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
