use tauri_runtime_verso::{
    INVOKE_SYSTEM_SCRIPTS, VersoRuntime, set_verso_path, set_verso_resource_directory,
};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // You need to set this to the path of the versoview executable
    // before creating any of the webview windows
    set_verso_path(r"C:\Users\Jacob\AppData\Local\verso\versoview.exe");
    // Set this to verso/servo's resources directory before creating any of the webview windows
    // this is optional but recommended, this directory will include very important things
    // like user agent stylesheet
    set_verso_resource_directory(r"C:\Users\Jacob\AppData\Local\verso\resources");
    tauri::Builder::<VersoRuntime>::new()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
