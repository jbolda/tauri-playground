import ReactDOM from "react-dom/client";
import App from "./App";

import {
  isPermissionGranted,
  requestPermission,
} from "@tauri-apps/plugin-notification";

import { requestPermissions as requestPermissionForBarcodeScanner } from "@tauri-apps/plugin-barcode-scanner";

// Do you have permission to send a notification?
let permissionGranted = await isPermissionGranted();
await requestPermissionForBarcodeScanner();

// If not we need to request it
if (!permissionGranted) {
  const permission = await requestPermission();
  permissionGranted = permission === "granted";
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>,
);
