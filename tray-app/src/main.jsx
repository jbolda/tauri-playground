import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { Menu, MenuItem } from "@tauri-apps/api/menu";

// it is _very_ alpha and only worked on stream
//  based on code in a PR
async function createMenu() {
  let i = 0;
  let menu;
  const boop = await MenuItem.new({
    text: `Boop${i}`,
    action: async () => {
      console.log(`clicked boop ${i}`);
      i++;
      const newMenuItem = await MenuItem.new({
        text: `Boop${i}`,
        action: () => console.log(`clicked boop ${i}`),
      });
      menu.append(newMenuItem);
    },
  });
  menu = await Menu.new({ items: [boop] });

  await menu.setAsAppMenu();
}
createMenu();

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
