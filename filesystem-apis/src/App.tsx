import "./App.css";

function App() {
  async function filesystemAction() {
    console.log("howdy friends");

    const opfsRoot = await navigator.storage.getDirectory();
    const fileHandle = await opfsRoot.getFileHandle("my first file", {
      create: true,
    });
    console.log({ fileHandle });
    const directoryHandle = await opfsRoot.getDirectoryHandle(
      "my first folder",
      {
        create: true,
      }
    );
    console.log({ directoryHandle });

    // @ts-expect-error
    for await (let [name, handle] of directoryHandle) {
      alert(JSON.stringify({ name, handle }));
    }
    // @ts-expect-error
    for await (let [name, handle] of directoryHandle.entries()) {
      alert(JSON.stringify({ name, handle }));
    }
    // @ts-expect-error
    for await (let handle of directoryHandle.values()) {
      alert(JSON.stringify({ handle }));
    }
    // @ts-expect-error
    for await (let name of directoryHandle.keys()) {
      alert(JSON.stringify({ name }));
    }

    const nestedFileHandle = await directoryHandle.getFileHandle(
      "my first nested file",
      { create: true }
    );
    console.log({ nestedFileHandle });
    const nestedDirectoryHandle = await directoryHandle.getDirectoryHandle(
      "my first nested folder",
      { create: true }
    );
    console.log({ nestedDirectoryHandle });
  }

  return (
    <main className="container">
      <h1>Welcome to The Filesystem</h1>

      <button onClick={() => filesystemAction()}>do an action</button>
    </main>
  );
}

export default App;
