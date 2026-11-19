
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import CreateAlbumModal from "../components/CreateAlbumModal";

import {
    createAlbum,
    getAlbums,
    getGames,
    initializeDatabase,
    type AlbumRecord,
} from "../lib/database";

type Props = {
    children: (state: {
        active: string;
        query: string;
        refreshKey: number;
        refreshSidebar: () => Promise<void>;
    }) => ReactNode;
};

export default function MainLayout({ children }: Props) {
    const [active, setActive] = useState("all");
    const [query, setQuery] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);

    const [albums, setAlbums] = useState<AlbumRecord[]>([]);
    const [games, setGames] = useState<string[]>([]);

    const loadSidebarData = async () => {
        try {
            await initializeDatabase();

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
        loadSidebarData();
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

    return (
        <div className="app-shell">
            <Sidebar
                active={active}
                onChange={setActive}
                onCreateAlbum={() => setIsAlbumModalOpen(true)}
                albums={albums}
                games={games}
            />

            <main className="main-content">
                <Topbar onImported={handleImported} />

                {children({
                    active,
                    query,
                    refreshKey,
                    refreshSidebar: loadSidebarData,
                })}
            </main>

            <CreateAlbumModal
                open={isAlbumModalOpen}
                onClose={() => setIsAlbumModalOpen(false)}
                onCreate={handleCreateAlbum}
            />
        </div>
    );
}
