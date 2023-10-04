import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

//   ReactDOM.createRoot(document.body).render(<App />)
addEventListener("load", () =>
  ReactDOM.createRoot(document.body).render(
    // <React.StrictMode>
    <App />
    // </React.StrictMode>
  )
);
