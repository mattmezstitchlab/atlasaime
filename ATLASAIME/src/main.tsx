import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary label="racine" onReset={() => {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      window.location.reload();
    }}>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
