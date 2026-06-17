import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";

try {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (e) {
  document.getElementById("root")!.innerHTML = `<div style="padding:40px;font-family:Inter,sans-serif;color:#111">
    <h2>Something went wrong</h2>
    <pre style="color:red;margin-top:12px;font-size:13px">${e instanceof Error ? e.message : String(e)}</pre>
  </div>`;
}
