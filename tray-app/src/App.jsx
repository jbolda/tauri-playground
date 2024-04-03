import { useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [sysData, setSysData] = useState(null);

  return (
    <div className="App">
      <header className="App-header">
        <p>Hello Vite + React!</p>
        <p>
          <button
            type="button"
            onClick={async () =>
              setSysData(await invoke("get_system_memory").then((data) => data))
            }
          >
            click me
          </button>
          <pre>{sysData}</pre>
        </p>
      </header>
    </div>
  );
}

export default App;
