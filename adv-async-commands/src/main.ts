import { commands } from "./bindings";
import { transformCallback } from "@tauri-apps/api/core";

let commandSelectEl: HTMLSelectElement | null;
let argInputEl: HTMLInputElement | null;

export const SERIALIZE_TO_IPC_FN = "__TAURI_TO_IPC_KEY__";
class Channel<T = unknown> {
  id: number;
  // @ts-expect-error field used by the IPC serializer
  private readonly __TAURI_CHANNEL_MARKER__ = true;
  #onmessage: (response: T) => void = () => {
    // no-op
  };
  #nextMessageId = 0;
  #pendingMessages: Record<string, T> = {};

  constructor() {
    this.id = transformCallback(
      ({ message, id }: { message: T; id: number }) => {
        console.log({ message, id, next: this.#nextMessageId });
        // the id is used as a mechanism to preserve message order
        if (id === this.#nextMessageId) {
          this.#nextMessageId = id + 1;
          this.#onmessage(message);

          // process pending messages
          const pendingMessageIds = Object.keys(this.#pendingMessages);
          if (pendingMessageIds.length > 0) {
            let nextId = id + 1;
            for (const pendingId of pendingMessageIds.sort()) {
              // if we have the next message, process it
              if (parseInt(pendingId) === nextId) {
                const pendingMessage = this.#pendingMessages[pendingId];
                delete this.#pendingMessages[pendingId];

                this.#onmessage(pendingMessage);

                console.log({ loopMessage: message });
                // move the id counter to the next message to check
                if (message?.event === "finished") {
                  nextId = id;
                } else {
                  nextId += 1;
                }
              } else {
                // we do not have the next message, let's wait
                break;
              }
            }
            this.#nextMessageId = nextId;
          }
        } else {
          this.#pendingMessages[id.toString()] = message;
          // this.#nextMessageId = 0;
        }
      }
    );
  }

  set onmessage(handler: (response: T) => void) {
    this.#onmessage = handler;
  }

  get onmessage(): (response: T) => void {
    return this.#onmessage;
  }

  [SERIALIZE_TO_IPC_FN]() {
    return `__CHANNEL__:${this.id}`;
  }

  toJSON(): string {
    // eslint-disable-next-line security/detect-object-injection
    return this[SERIALIZE_TO_IPC_FN]();
  }
}

const onEvent = new Channel<DownloadEvent>();
onEvent.onmessage = (message) => {
  console.log(`got download event ${message.event}`, message.data);
};

async function fire_off_command() {
  const command = commandSelectEl?.value;
  if (argInputEl && command) {
    switch (command) {
      case "window_label":
        return await commands.windowLabel(argInputEl.value);
      case "download_chunked_json":
        // @ts-expect-error
        return await commands.downloadChunkedJson("any random thing", onEvent);
    }
    console.log(`ran ${command}`);
  } else {
    console.warn("no command ran", argInputEl?.value, command);
  }
}

type DownloadEvent =
  | {
      event: "started";
      data: {
        url: string;
        downloadId: number;
        contentLength: number;
      };
    }
  | {
      event: "progress";
      data: {
        downloadId: number;
        chunkLength: number;
      };
    }
  | {
      event: "finished";
      data: {
        downloadId: number;
      };
    };

window.addEventListener("DOMContentLoaded", () => {
  commandSelectEl = document.querySelector("#command-selector");
  argInputEl = document.querySelector("#arg-input");
  document.querySelector("#fire-command")?.addEventListener("click", (e) => {
    fire_off_command();
  });
});
