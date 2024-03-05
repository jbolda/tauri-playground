use tauri::{LogicalPosition, LogicalSize, WebviewUrl};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let width = 800.;
            let height = 600.;
            let window = tauri::window::WindowBuilder::new(app, "main")
                .inner_size(width, height)
                .build()?;

            let _webview1 = window.add_child(
                tauri::webview::WebviewBuilder::new("main1", WebviewUrl::App("index1.html".into()))
                    .auto_resize(),
                LogicalPosition::new(0., 0.),
                LogicalSize::new(width / 2., height / 2.),
            )?;
            let _webview2 = window.add_child(
                tauri::webview::WebviewBuilder::new("main2", WebviewUrl::App("index2.html".into()))
                    .auto_resize(),
                LogicalPosition::new(width / 2., 0.),
                LogicalSize::new(width / 2., height / 2.),
            )?;
            let _webview3 = window.add_child(
                tauri::webview::WebviewBuilder::new("main3", WebviewUrl::App("index3.html".into()))
                    .auto_resize(),
                LogicalPosition::new(0., height / 2.),
                LogicalSize::new(width / 2., height / 2.),
            )?;
            let _webview4 = window.add_child(
                tauri::webview::WebviewBuilder::new("main4", WebviewUrl::App("index4.html".into()))
                    .auto_resize(),
                LogicalPosition::new(width / 2., height / 2.),
                LogicalSize::new(width / 2., height / 2.),
            )?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
