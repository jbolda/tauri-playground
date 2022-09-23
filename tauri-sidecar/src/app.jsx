import { useState } from "preact/hooks";
import preactLogo from "./assets/preact.svg";
import { invoke } from "@tauri-apps/api/tauri";
import { Command } from "@tauri-apps/api/shell";
import { emit, listen } from "@tauri-apps/api/event";
import "./app.css";

export function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [graphgenOutput, setCommandOutput] = useState({
    code: -1,
    stdout: "",
    stderr: "",
  });
  const [graphgenStream, setCommandStream] = useState("");
  const graphgen = Command.sidecar("../bin/graphgen");

  listen("message", (event) => {
    // event.event is the event name (useful if you want to use a single callback fn for multiple event types)
    // event.payload is the payload object
    console.log(event);
  });

  const greet = async () => {
    setGreetMsg(await invoke("greet", { name }));
  };

  const executeGraphgen = async () => {
    setCommandOutput(await graphgen.execute());
  };

  const startGraphgen = async () => {
    const output = await invoke("start_graphgen");
    setCommandStream();
  };

  return (
    <div class="container">
      <h1>Welcome to Tauri!</h1>
      <div class="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" class="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" class="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://preactjs.com" target="_blank">
          <img src={preactLogo} class="logo preact" alt="Preact logo" />
        </a>
      </div>

      <p>Click on the Tauri, Vite, and Preact logos to learn more.</p>

      <div class="row">
        <div>
          <input
            id="greet-input"
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="Enter a name..."
          />
          <button type="button" onClick={() => greet()}>
            Greet
          </button>
        </div>
      </div>
      <p>{greetMsg}</p>

      <hr />

      <div class="row">
        <div>
          <button type="button" onClick={() => executeGraphgen()}>
            Invoke Hello World CLI
          </button>
        </div>
      </div>
      <p>code: {graphgenOutput.code}</p>
      <p>stdout: {graphgenOutput.stdout.trim()}</p>
      <p>stderr: {graphgenOutput.stderr.trim()}</p>

      <hr />

      <div class="row">
        <div>
          <button type="button" onClick={() => startGraphgen()}>
            Start Graphgen Server
          </button>
        </div>
      </div>
    </div>
  );
}
