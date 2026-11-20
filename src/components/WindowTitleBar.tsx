import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";

const appWindow = getCurrentWindow();

export default function WindowTitleBar() {
  return (
    <header className="window-titlebar" data-tauri-drag-region>
      <div className="window-titlebar-brand" data-tauri-drag-region>
        <span className="window-titlebar-mark">G</span>
        <span data-tauri-drag-region>GAME ARCHIVE</span>
      </div>

      <div className="window-titlebar-controls">
        <button
          type="button"
          className="window-control-button"
          title="Minimize"
          aria-label="Minimize window"
          onClick={() => void appWindow.minimize()}
        >
          <Minus size={15} />
        </button>
        <button
          type="button"
          className="window-control-button"
          title="Maximize or restore"
          aria-label="Maximize or restore window"
          onClick={() => void appWindow.toggleMaximize()}
        >
          <Square size={12} />
        </button>
        <button
          type="button"
          className="window-control-button window-control-close"
          title="Close"
          aria-label="Close window"
          onClick={() => void appWindow.close()}
        >
          <X size={16} />
        </button>
      </div>
    </header>
  );
}
