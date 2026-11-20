
import { useState } from "react";
import { Plus, Trash2, X, AlertTriangle } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import {
    saveScreenshot,
    getScreenshotHashes,
    deleteAllScreenshots,
} from "../lib/database";

type TopbarProps = {
    onImported: () => void;
};

type ImportedScreenshot = {
    thumbnail_path: string;
    id: string;
    file_name: string;
    file_path: string;
    content_hash: string;
};

export default function Topbar({ onImported }: TopbarProps) {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const handleAddScreenshots = async () => {
        if (isImporting || isDeleting) return;

        try {
            setIsImporting(true);

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
            const existingHashes = await getScreenshotHashes();

            const imported = await invoke<ImportedScreenshot[]>(
                "import_screenshots",
                {
                    paths,
                    existingHashes,
                }
            );

            for (const screenshot of imported) {
                await saveScreenshot(screenshot);
            }

            if (imported.length > 0) {
                onImported();
            }

            console.log(`Successfully imported ${imported.length} screenshots!`);
        } catch (error) {
            console.error("Screenshot import failed:", error);
        } finally {
            setIsImporting(false);
        }
    };

    const handleDeleteAll = async () => {
        if (isDeleting || isImporting) return;

        try {
            setIsDeleting(true);

            await invoke("delete_all_screenshot_files");
            await deleteAllScreenshots();

            onImported();
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error("Failed to clear archive:", error);
            alert("Failed to clear the archive. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <header className="topbar">
                <div className="breadcrumb">
                    <span>LIBRARY</span>
                    <span className="breadcrumb-divider">/</span>
                    <strong>All screenshots</strong>
                </div>

                <div className="topbar-actions">
                    <button
                        className="delete-all-button"
                        onClick={() => setIsDeleteModalOpen(true)}
                        disabled={isImporting || isDeleting}
                    >
                        <Trash2 size={17} />
                        <span>Delete All</span>
                    </button>

                    <button
                        className="add-button"
                        onClick={handleAddScreenshots}
                        disabled={isImporting || isDeleting}
                    >
                        <Plus size={18} />
                        <span>{isImporting ? "Importing..." : "Add screenshots"}</span>
                    </button>
                </div>
            </header>

            {isDeleteModalOpen && (
                <div className="delete-all-overlay">
                    <div className="delete-all-modal">
                        <button
                            className="delete-all-close"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isDeleting}
                            aria-label="Close"
                        >
                            <X size={19} />
                        </button>

                        <div className="delete-all-icon">
                            <AlertTriangle size={25} />
                        </div>

                        <h2>Clear your archive?</h2>

                        <p>
                            This will permanently delete all imported screenshots
                            and their metadata from Game Archive.
                        </p>

                        <div className="delete-all-warning">
                            <strong>This action cannot be undone.</strong>
                            <span>
                                Your original files in NVIDIA captures and watched
                                folders will remain untouched. Albums and watched
                                folders will also be preserved.
                            </span>
                        </div>

                        <div className="delete-all-actions">
                            <button
                                className="delete-all-cancel"
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>

                            <button
                                className="delete-all-confirm"
                                onClick={handleDeleteAll}
                                disabled={isDeleting}
                            >
                                <Trash2 size={16} />
                                {isDeleting ? "Deleting..." : "Delete Everything"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
