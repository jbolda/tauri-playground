#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{
    api::process::{Command, CommandEvent},
};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn start_deno(window: tauri::Window) {
    println!("Window: {}", window.label());

    let (mut rx, _child) = Command::new_sidecar("deno-server")
        .expect("failed to create `deno-server` binary command")
        .spawn()
        .expect("Failed to spawn sidecar");
    
    tauri::async_runtime::spawn(async move {
        // read events such as stdout
        while let Some(event) = rx.recv().await {
            println!("{:?}", event);
            match event {
                CommandEvent::Stdout(line) => window
                    .emit("deno-server://logs", Some(format!("{}", line)))
                    .expect("failed to emit event"),
                CommandEvent::Stderr(line) => window
                    .emit("deno-server://logs", Some(format!("{}", line)))
                    .expect("failed to emit event"),
                CommandEvent::Terminated(payload) => window
                    .emit("deno-server://logs", Some(format!("{:?}", payload)))
                    .expect("failed to emit event"),
                _ => println!("{:?}", event)
            };
        }
    });
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, start_deno])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
