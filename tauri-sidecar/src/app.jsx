import { useState, useEffect } from "preact/hooks";
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
  const [denoStream, setCommandStream] = useState("");
  const graphgen = Command.sidecar("../bin/graphgen");

  useEffect(() => {
    console.log("setting up listen");
    const unlisten = listen("deno-server://logs", (event) => {
      // event.event is the event name (useful if you want to use a single callback fn for multiple event types)
      // event.payload is the payload object
      console.log(event);
      setCommandStream((text) => `${!text ? "" : text}<p>${event.payload}</p>`);
    });
    return async () => {
      console.log("unlistening");
      await unlisten();
    };
  }, []);

  const greet = async () => {
    setGreetMsg(await invoke("greet", { name }));
  };

  const executeGraphgen = async () => {
    setCommandOutput(await graphgen.execute());
  };

  const startDeno = async () => {
    await invoke("start_deno");
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
          <button type="button" onClick={() => startDeno()}>
            Start Deno Server
          </button>
        </div>
      </div>
      <p>stdout stream:</p>
      <div dangerouslySetInnerHTML={{ __html: denoStream }} />
    </div>
  );
}
