#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri::Manager;
use tauri::{CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};

use sysinfo::{System, SystemExt};

fn main() {
  let quit = CustomMenuItem::new("quit".to_string(), "Quit");
  let hide = CustomMenuItem::new("hide".to_string(), "Hide");
  let show = CustomMenuItem::new("show".to_string(), "Show");
  let tray_menu = SystemTrayMenu::new()
    .add_item(show)
    .add_item(hide)
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(quit);

  let system_tray = SystemTray::new().with_menu(tray_menu);

  tauri::Builder::default()
    .setup(|app| {
      let window = app.get_window("main").unwrap();
      Ok(window.hide().unwrap())
    })
    .invoke_handler(tauri::generate_handler![get_system_memory])
    .system_tray(system_tray)
    .on_system_tray_event(move |app, event| match event {
      SystemTrayEvent::LeftClick {
        position, size: _, ..
      } => {
        dbg!("system tray received a left click");
        let window = app.get_window("main").unwrap();
        window.show().unwrap();
        let logical_size = tauri::LogicalSize::<f64> {
          width: 300.00,
          height: 400.00,
        };
        let logical_s = tauri::Size::Logical(logical_size);
        window.set_size(logical_s);
        let logical_position = tauri::LogicalPosition::<f64> {
          x: position.x - logical_size.width,
          y: position.y - logical_size.height - 70.,
        };
        let logical_pos: tauri::Position = tauri::Position::Logical(logical_position);
        window.set_position(logical_pos);
        window.set_focus();
      }
      SystemTrayEvent::RightClick {
        position: _,
        size: _,
        ..
      } => {
        dbg!("system tray received a right click");
        let window = app.get_window("main").unwrap();
        window.hide().unwrap();
      }
      SystemTrayEvent::DoubleClick {
        position: _,
        size: _,
        ..
      } => {
        dbg!("system tray received a double click");
      }
      SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
        "quit" => {
          std::process::exit(0);
        }
        "hide" => {
          let window = app.get_window("main").unwrap();
          window.hide().unwrap();
        }
        "show" => {
          let window = app.get_window("main").unwrap();
          window.show().unwrap();
        }
        _ => {}
      },
      _ => {}
    })
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
