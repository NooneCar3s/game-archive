
import { Plus } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { saveScreenshot } from "../lib/database";

type TopbarProps = {
  onImported: () => void;
};

type ImportedScreenshot = {
  id: string;
  file_name: string;
  file_path: string;
};

export default function Topbar({ onImported }: TopbarProps) {
  const handleAddScreenshots = async () => {
    try {
      const selected = await open({
        multiple: true,
        directory: false,
        filters: [
          {
            name: "Images",
            extensions: ["png", "jpg", "jpeg", "webp"],
          },
        ],
      });

      if (!selected) return;

      const paths = Array.isArray(selected) ? selected : [selected];

      const imported = await invoke<ImportedScreenshot[]>(
        "import_screenshots",
        { paths }
      );

      for (const screenshot of imported) {
        await saveScreenshot(screenshot);
      }

      if (imported.length > 0) {
        onImported();
      }

      console.log(`Successfully imported ${imported.length} screenshots!`);
      console.log("Imported files:", imported);
    } catch (error) {
      console.error("Screenshot import failed:", error);
    }
  };

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>LIBRARY</span>
        <span className="breadcrumb-divider">/</span>
        <strong>All screenshots</strong>
      </div>

      <div className="topbar-actions">
        <button className="add-button" onClick={handleAddScreenshots}>
          <Plus size={18} />
          <span>Add screenshots</span>
        </button>
      </div>
    </header>
  );
}
