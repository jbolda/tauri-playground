use tauri::{AppHandle, Emitter, Manager};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            println!("a new app instance was opened with {argv:?} and the deep link event was already triggered");
            let _ = show_window(app);
            let _ = app.emit("single-instance", ());
            // when defining deep link schemes at runtime, you must also check `argv` here
          }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet])
        // .setup(|app| {
        //     #[cfg(any(windows, target_os = "linux"))]
        //     {
        //         use tauri_plugin_deep_link::DeepLinkExt;
        //         app.deep_link().register_all()?;
        //     }
        //     Ok(())
        // })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// from example in docs: https://v2.tauri.app/plugin/single-instance/#focusing-on-new-instance
fn show_window(app: &AppHandle) {
    let windows = app.webview_windows();

    windows
        .values()
        .next()
        .expect("Sorry, no window found")
        .set_focus()
        .expect("Can't Bring Window to Focus");
}
