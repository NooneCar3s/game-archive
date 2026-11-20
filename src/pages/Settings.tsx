
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import {
    Settings as SettingsIcon,
    FolderSync,
    FolderPlus,
    Folder,
    Trash2,
    ScanSearch,
} from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";

import {
    getWatchedFolders,
    addWatchedFolder,
    deleteWatchedFolder,
    getScreenshotHashes,
    saveScreenshot,
    type WatchedFolderRecord,
} from "../lib/database";

type SettingsProps = {
    onImported: () => void;
};

type ImportedScreenshot = {
    thumbnail_path: string;
    id: string;
    file_name: string;
    file_path: string;
    content_hash: string;
};

export default function Settings({ onImported }: SettingsProps) {
    const [folders, setFolders] = useState<WatchedFolderRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    async function loadFolders() {
        try {
            const result = await getWatchedFolders();
            setFolders(result);
        } catch (error) {
            console.error("Failed to load watched folders:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadFolders();
    }, []);

    async function handleAddFolder() {
        try {
            setAdding(true);

            const selected = await open({
                directory: true,
                multiple: false,
                title: "Select a folder to watch",
            });

            if (!selected || typeof selected !== "string") {
                return;
            }

            await addWatchedFolder(selected);
            await loadFolders();
        } catch (error) {
            console.error("Failed to add watched folder:", error);
            alert("Failed to add folder.");
        } finally {
            setAdding(false);
        }
    }

    async function handleDeleteFolder(id: string) {
        try {
            await deleteWatchedFolder(id);
            await loadFolders();
        } catch (error) {
            console.error("Failed to delete watched folder:", error);
            alert("Failed to remove folder.");
        }
    }

    async function handleScanNow() {
        if (folders.length === 0 || adding || isScanning) {
            return;
        }

        try {
            setIsScanning(true);
            setAdding(true);

            const existingHashes = await getScreenshotHashes();

            const imported = await invoke<ImportedScreenshot[]>(
                "scan_watched_folders",
                {
                    folders: folders.map((folder) => folder.path),
                    existingHashes,
                }
            );

            for (const screenshot of imported) {
                await saveScreenshot(screenshot);
            }

            if (imported.length > 0) {
                onImported();
                alert(`Successfully imported ${imported.length} screenshot(s).`);
            } else {
                alert("No new screenshots found.");
            }
        } catch (error) {
            console.error("Failed to scan folders:", error);
            alert("Failed to scan folders.");
        } finally {
            setIsScanning(false);
            setAdding(false);
        }
    }

    return (
        <>
            <section className="settings-page">
                <div className="gallery-heading">
                    <div>
                        <div className="eyebrow">
                            <SettingsIcon size={13} />
                            PERSONALIZE YOUR EXPERIENCE
                        </div>

                        <h1>Settings</h1>
                        <p>Manage your Game Archive preferences.</p>
                    </div>
                </div>

                <div className="settings-section">
                    <div className="settings-section-heading">
                        <div className="settings-section-icon">
                            <FolderSync size={19} />
                        </div>

                        <div>
                            <h2>Auto Import</h2>
                            <p>
                                Automatically import new screenshots from
                                your selected folders.
                            </p>
                        </div>
                    </div>

                    <div className="watched-folders-header">
                        <div>
                            <h3>Watched Folders</h3>
                            <p>
                                Choose folders where your screenshots are saved.
                            </p>
                        </div>

                        <div className="watched-folder-actions">
                            <button
                                className="settings-add-button"
                                onClick={handleAddFolder}
                                disabled={adding}
                            >
                                <FolderPlus size={16} />
                                {adding ? "Selecting..." : "Add Folder"}
                            </button>

                            <button
                                className="settings-scan-button"
                                onClick={handleScanNow}
                                disabled={adding || folders.length === 0}
                            >
                                <ScanSearch size={16} />
                                {isScanning ? "Scanning..." : "Scan Now"}
                            </button>
                        </div>
                    </div>

                    <div className="watched-folders-list">
                        {loading ? (
                            <div className="settings-empty">
                                Loading folders...
                            </div>
                        ) : folders.length === 0 ? (
                            <div className="settings-empty">
                                <FolderSync size={24} />
                                <span>No folders added yet.</span>
                                <span>
                                    Add a folder to start building your screenshot archive.
                                </span>
                            </div>
                        ) : (
                            folders.map((folder) => (
                                <div className="watched-folder-item" key={folder.id}>
                                    <div className="watched-folder-icon">
                                        <Folder size={19} />
                                    </div>

                                    <div className="watched-folder-info">
                                        <span className="watched-folder-name">
                                            {folder.path.split(/[\\/]/).filter(Boolean).pop() || folder.path}
                                        </span>

                                        <span className="watched-folder-path">
                                            {folder.path}
                                        </span>
                                    </div>

                                    <button
                                        className="watched-folder-delete"
                                        onClick={() => handleDeleteFolder(folder.id)}
                                        title="Remove folder"
                                        disabled={adding}
                                    >
                                        <Trash2 size={17} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {isScanning && (
                <div className="archive-loading-overlay">
                    <div className="archive-loading-modal">
                        <div className="archive-loading-logo">
                            <ScanSearch size={30} />
                        </div>

                        <h2>Preparing your archive</h2>

                        <p>
                            Scanning folders and importing new screenshots...
                        </p>

                        <div className="archive-loading-progress">
                            <div className="archive-loading-progress-bar" />
                        </div>

                        <span>This may take a moment</span>
                    </div>
                </div>
            )}
        </>
    );
}
