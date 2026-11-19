
use serde::Serialize;
use std::fs;
use std::path::Path;
use tauri::{AppHandle, Manager};
use uuid::Uuid;

#[derive(Serialize)]
struct ImportedScreenshot {
    id: String,
    file_name: String,
    file_path: String,
}

#[tauri::command]
async fn import_screenshots(
    app: AppHandle,
    paths: Vec<String>,
) -> Result<Vec<ImportedScreenshot>, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let images_dir = app_data_dir.join("images");

    fs::create_dir_all(&images_dir)
        .map_err(|e| format!("Не удалось создать папку: {e}"))?;

    let mut imported = Vec::new();

    for source_path in paths {
        let source = Path::new(&source_path);

        if !source.is_file() {
            continue;
        }

        let extension = source
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("")
            .to_lowercase();

        if !["png", "jpg", "jpeg", "webp"].contains(&extension.as_str()) {
            continue;
        }

        let id = Uuid::new_v4().to_string();

        let file_name = source
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("screenshot")
            .to_string();

        let destination = images_dir.join(format!("{id}.{extension}"));

        fs::copy(source, &destination)
            .map_err(|e| format!("Ошибка копирования {file_name}: {e}"))?;

        imported.push(ImportedScreenshot {
            id,
            file_name,
            file_path: destination.to_string_lossy().to_string(),
        });
    }

    Ok(imported)
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
            import_screenshots
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
