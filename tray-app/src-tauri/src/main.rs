#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{ClickType, TrayIconBuilder};
use tauri::Manager;

use sysinfo::System;

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      let quit = MenuItemBuilder::new("Quit").id("quit").build(app).unwrap();
      let hide = MenuItemBuilder::new("Hide").id("hide").build(app).unwrap();
      let show = MenuItemBuilder::new("Show").id("show").build(app).unwrap();
      // we could opt handle an error case better than calling unwrap
      let menu = MenuBuilder::new(app)
        .items(&[&quit, &hide, &show])
        .build()
        .unwrap();

      let _ = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(|app, event| match event.id().as_ref() {
          "quit" => app.exit(0),
          "hide" => {
            dbg!("menu item hide clicked");
            let window = app.get_webview_window("main").unwrap();
            window.hide().unwrap();
          }
          "show" => {
            dbg!("menu item show clicked");
            let window = app.get_webview_window("main").unwrap();
            window.show().unwrap();
          }
          _ => {}
        })
        .on_tray_icon_event(|tray_icon, event| match event.click_type {
          ClickType::Left => {
            dbg!("system tray received a left click");

            let window = tray_icon.app_handle().get_webview_window("main").unwrap();
            let _ = window.show().unwrap();
            let logical_size = tauri::LogicalSize::<f64> {
              width: 300.00,
              height: 400.00,
            };
            let logical_s = tauri::Size::Logical(logical_size);
            let _ = window.set_size(logical_s);
            let logical_position = tauri::LogicalPosition::<f64> {
              x: event.x - logical_size.width,
              y: event.y - logical_size.height - 70.,
            };
            let logical_pos: tauri::Position = tauri::Position::Logical(logical_position);
            let _ = window.set_position(logical_pos);
            let _ = window.set_focus();
          }
          ClickType::Right => {
            dbg!("system tray received a right click");
            let window = tray_icon.app_handle().get_webview_window("main").unwrap();
            window.hide().unwrap();
          }
          ClickType::Double => {
            dbg!("system tray received a double click");
          }
        })
        .build(app);

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![get_system_memory])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn get_system_memory() -> String {
  println!("I was invoked from JS!");
  let mut sys = System::new_all();

  // First we update all information of our `System` struct.
  sys.refresh_all();

  println!("total memory: {} KB", sys.total_memory());
  println!("used memory : {} KB", sys.used_memory());
  sys.used_memory().to_string()
}
