
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ScanSearch } from "lucide-react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import CreateAlbumModal from "../components/CreateAlbumModal";

import {
    createAlbum,
    deleteAlbum,
    deleteGame,
    getAlbums,
    getGames,
    initializeDatabase,
    getWatchedFolders,
    getScreenshotHashes,
    saveScreenshot,
    type AlbumRecord,
} from "../lib/database";

type Props = {
    children: (state: {
        active: string;
        query: string;
        refreshKey: number;
        refreshSidebar: () => Promise<void>;
        onImported: () => void;
    }) => ReactNode;
};

type ImportedScreenshot = {
    thumbnail_path: string;
    id: string;
    file_name: string;
    file_path: string;
    content_hash: string;
};

export default function MainLayout({ children }: Props) {
    const [active, setActive] = useState("all");
    const [query, setQuery] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    const [albums, setAlbums] = useState<AlbumRecord[]>([]);
    const [games, setGames] = useState<string[]>([]);

    const initializationStarted = useRef(false);

    const loadSidebarData = async () => {
        try {
            const [albumRecords, gameRecords] = await Promise.all([
                getAlbums(),
                getGames(),
            ]);

            setAlbums(albumRecords);
            setGames(gameRecords);
        } catch (error) {
            console.error("Failed to load sidebar data:", error);
        }
    };

    useEffect(() => {
        if (initializationStarted.current) return;

        initializationStarted.current = true;

        async function initializeApp() {
            try {
                await initializeDatabase();

                const folders = await getWatchedFolders();

                if (folders.length > 0) {
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
                        setRefreshKey((current) => current + 1);
                    }
                }

                await loadSidebarData();
            } catch (error) {
                console.error("Application initialization failed:", error);
            } finally {
                setIsInitializing(false);
            }
        }

        initializeApp();
    }, []);

    const handleImported = () => {
        setRefreshKey((current) => current + 1);
        loadSidebarData();
    };

    const handleCreateAlbum = async (
        name: string,
        description: string
    ) => {
        await createAlbum(name, description);

        await loadSidebarData();

        setRefreshKey((current) => current + 1);
    };

    const handleDeleteAlbum = async (id: string) => {
        await deleteAlbum(id);

        if (active === `album:${id}`) {
            setActive("all");
        }

        await loadSidebarData();
        setRefreshKey((current) => current + 1);
    };

    const handleDeleteGame = async (game: string) => {
        await deleteGame(game);

        if (active === `game:${game}`) {
            setActive("all");
        }

        await loadSidebarData();
        setRefreshKey((current) => current + 1);
    };

    return (
        <div className="app-shell">
            <Sidebar
                active={active}
                onChange={setActive}
                onCreateAlbum={() => setIsAlbumModalOpen(true)}
                albums={albums}
                games={games}
                onDeleteAlbum={handleDeleteAlbum}
                onDeleteGame={handleDeleteGame}
            />

            <main className="main-content">
                <Topbar onImported={handleImported} />

                {children({
                    active,
                    query,
                    refreshKey,
                    refreshSidebar: loadSidebarData,
                    onImported: handleImported,
                })}
            </main>

            <CreateAlbumModal
                open={isAlbumModalOpen}
                onClose={() => setIsAlbumModalOpen(false)}
                onCreate={handleCreateAlbum}
            />

            {isInitializing && (
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

                        <span>
                            This may take a moment
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
