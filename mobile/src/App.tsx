import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { sendNotification } from "@tauri-apps/plugin-notification";
import { scan, Format } from "@tauri-apps/plugin-barcode-scanner";
import {
  vibrate,
  impactFeedback,
  notificationFeedback,
  selectionFeedback,
} from "@tauri-apps/plugin-haptics";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
    // Once permission has been granted we can send the notification
    sendNotification({ title: "Tauri", body: "Tauri is awesome!" });
  }
  console.log("hello from debug");

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>
      <h2>Trying out the hot reload on Android Studio</h2>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg}</p>

      <div className="row">
        <button
          onClick={
            // `windowed: true` actually sets the webview to transparent
            // instead of opening a separate view for the camera
            // make sure your user interface is ready to show what is underneath with a transparent element
            () =>
              scan({ windowed: true, formats: [Format.QRCode] }).catch(
                (error) => console.log(error)
              )
          }
        >
          Scan
        </button>
      </div>
      <div className="row">
        <button
          onClick={async () => {
            console.log("haptic-ing");
            await vibrate(1);
            await impactFeedback("medium");
            await notificationFeedback("warning");
            await selectionFeedback();
            console.log("haptic-ing done");
          }}
        >
          All The Haptic Feedback
        </button>
      </div>
    </main>
  );
}

export default App;
