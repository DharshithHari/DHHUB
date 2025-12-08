
  import { createRoot } from "react-dom/client";
  import App from "./App";
  import "./index.css";
  import ErrorBoundary from "./ErrorBoundary";
  import { Toaster } from './components/ui/sonner';

  // Global runtime error handler to surface uncaught errors to the page
  window.addEventListener("error", (ev) => {
    try {
      const root = document.getElementById("root");
      if (!root) return;
      root.innerHTML = `\n      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial; padding:24px;">\n        <h2 style=\"color:#b91c1c;\">Runtime Error</h2>\n        <pre style=\"white-space:pre-wrap; background:#111827; color:#e5e7eb; padding:12px; border-radius:6px;\">${(ev && ev.error && ev.error.stack) || ev.message || String(ev)}</pre>\n        <button id=\"__reload_btn\" style=\"margin-top:12px;padding:8px 12px;background:#2563eb;color:#fff;border-radius:6px;border:none;\">Reload</button>\n      </div>`;
      const btn = document.getElementById("__reload_btn");
      btn?.addEventListener("click", () => location.reload());
    } catch (e) {
      // ignore
    }
  });

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <>
        <App />
        <Toaster />
      </>
    </ErrorBoundary>
  );
  