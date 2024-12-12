use serde::{Deserialize, Serialize};
use specta_typescript::Typescript;
use tauri::{
    command,
    ipc::{Channel, Request, Response},
    window, AppHandle, State, Window,
};
use tauri_specta::{collect_commands, Builder};

#[command(async)]
#[specta::specta]
fn window_label(window: Window, arg: Option<String>) {
    println!("arg: {}", arg.unwrap());
    println!("window label: {}", window.label());
}

#[derive(Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
enum DownloadEvent<'a> {
    #[serde(rename_all = "camelCase")]
    Started {
        url: &'a str,
        download_id: u32,
        content_length: u32,
    },
    #[serde(rename_all = "camelCase")]
    Progress { download_id: u32, chunk_length: u32 },
    #[serde(rename_all = "camelCase")]
    Finished { download_id: u32 },
}

#[command(async)]
#[specta::specta]
fn download_chunked_json(app: AppHandle, url: String, on_event: Channel<DownloadEvent>) {
    let content_length = 1000;
    let download_id = 1;

    on_event
        .send(DownloadEvent::Started {
            url: &url,
            download_id,
            content_length,
        })
        .unwrap();

    // as an example, we hard code what a sample buffer might look like
    for chunk_length in [15, 150, 35, 500, 300] {
        on_event
            .send(DownloadEvent::Progress {
                download_id,
                chunk_length,
            })
            .unwrap();
    }

    on_event
        .send(DownloadEvent::Finished { download_id })
        .unwrap();
}

// #[derive(Deserialize, specta::Type)]
// struct Person<'a> {
//     name: &'a str,
//     age: u8,
// }

// #[command(async)]
// #[specta::specta]
// fn command_arguments_struct(Person { name, age }: Person<'_>) {
//     println!("received person struct with name: {name} | age: {age}")
// }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = Builder::<tauri::Wry>::new()
        // Then register them (separated by a comma)
        .commands(collect_commands![window_label, download_chunked_json]);

    #[cfg(debug_assertions)] // <- Only export on non-release builds
    builder
        .export(Typescript::default(), "../src/bindings.ts")
        .expect("Failed to export typescript bindings");

    tauri::Builder::default()
        .invoke_handler(builder.invoke_handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
