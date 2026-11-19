
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
    Images,
    Heart,
    Folder,
    Gamepad2,
    Settings,
    Plus,
    ChevronDown,
    MoreHorizontal,
    Trash2,
    X,
    AlertTriangle,
} from "lucide-react";

import type { AlbumRecord } from "../lib/database";

type SidebarProps = {
    active: string;
    onChange: (value: string) => void;
    onCreateAlbum: () => void;
    albums: AlbumRecord[];
    games?: string[];
    onDeleteAlbum: (id: string) => Promise<void>;
    onDeleteGame: (game: string) => Promise<void>;
};

type DeleteTarget =
    | { type: "album"; id: string; name: string }
    | { type: "game"; name: string };

export default function Sidebar({
    active,
    onChange,
    onCreateAlbum,
    albums,
    games = [],
    onDeleteAlbum,
    onDeleteGame,
}: SidebarProps) {
    const [albumsExpanded, setAlbumsExpanded] = useState(true);
    const [gamesExpanded, setGamesExpanded] = useState(true);
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirmDelete = async () => {
        if (!deleteTarget || isDeleting) return;

        try {
            setIsDeleting(true);

            if (deleteTarget.type === "album") {
                await onDeleteAlbum(deleteTarget.id);
            } else {
                await onDeleteGame(deleteTarget.name);
            }

            setDeleteTarget(null);
            setOpenMenu(null);
        } catch (error) {
            console.error("Failed to delete collection:", error);
            alert("Failed to delete. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <aside className="sidebar glass-panel">
                {/* BRAND */}
                <div className="brand">
                    <div className="brand-icon">
                        <Gamepad2 size={21} />
                    </div>

                    <div>
                        <div className="brand-name">GAME ARCHIVE</div>
                        <div className="brand-caption">
                            YOUR DIGITAL MEMORIES
                        </div>
                    </div>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div className="sidebar-scroll">
                    {/* MAIN NAVIGATION */}
                    <div className="sidebar-section">
                        <span className="section-label">LIBRARY</span>

                        <nav className="navigation">
                            <button
                                className={`nav-item ${active === "all" ? "active" : ""}`}
                                onClick={() => onChange("all")}
                            >
                                {active === "all" && (
                                    <motion.div
                                        layoutId="active-nav"
                                        className="nav-highlight"
                                        transition={{
                                            type: "spring",
                                            stiffness: 380,
                                            damping: 30,
                                        }}
                                    />
                                )}

                                <Images size={18} />
                                <span>All screenshots</span>
                            </button>

                            <button
                                className={`nav-item ${active === "favorites" ? "active" : ""}`}
                                onClick={() => onChange("favorites")}
                            >
                                {active === "favorites" && (
                                    <motion.div
                                        layoutId="active-nav"
                                        className="nav-highlight"
                                        transition={{
                                            type: "spring",
                                            stiffness: 380,
                                            damping: 30,
                                        }}
                                    />
                                )}

                                <Heart size={18} />
                                <span>Favorites</span>
                            </button>
                        </nav>
                    </div>

                    {/* ALBUMS */}
                    <div className="sidebar-section sidebar-collection">
                        <button
                            className="collection-heading"
                            onClick={() => setAlbumsExpanded((current) => !current)}
                        >
                            <span className="section-label">ALBUMS</span>

                            <ChevronDown
                                size={15}
                                className={`collection-chevron ${albumsExpanded ? "expanded" : ""}`}
                            />
                        </button>

                        <AnimatePresence initial={false}>
                            {albumsExpanded && (
                                <motion.div
                                    className="collection-content"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.22 }}
                                >
                                    <div className="collection-list">
                                        {albums.length > 0 ? (
                                            albums.map((album) => {
                                                const menuId = `album:${album.id}`;

                                                return (
                                                    <div className="collection-item-row" key={album.id}>
                                                        <button
                                                            className={`collection-item ${active === menuId ? "active" : ""}`}
                                                            onClick={() => onChange(menuId)}
                                                            title={album.name}
                                                        >
                                                            <Folder size={16} />
                                                            <span>{album.name}</span>
                                                        </button>

                                                        <button
                                                            className="collection-more-button"
                                                            title="Album options"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                setOpenMenu(openMenu === menuId ? null : menuId);
                                                            }}
                                                        >
                                                            <MoreHorizontal size={17} />
                                                        </button>

                                                        {openMenu === menuId && (
                                                            <div className="collection-context-menu">
                                                                <button
                                                                    className="collection-delete-option"
                                                                    onClick={() => {
                                                                        setOpenMenu(null);
                                                                        setDeleteTarget({
                                                                            type: "album",
                                                                            id: album.id,
                                                                            name: album.name,
                                                                        });
                                                                    }}
                                                                >
                                                                    <Trash2 size={15} />
                                                                    Delete album
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="collection-empty">
                                                No albums yet
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        className="create-album-trigger"
                                        onClick={onCreateAlbum}
                                    >
                                        <Plus size={16} />
                                        <span>Create album</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* GAMES */}
                    <div className="sidebar-section sidebar-collection">
                        <button
                            className="collection-heading"
                            onClick={() => setGamesExpanded((current) => !current)}
                        >
                            <span className="section-label">GAMES</span>

                            <ChevronDown
                                size={15}
                                className={`collection-chevron ${gamesExpanded ? "expanded" : ""}`}
                            />
                        </button>

                        <AnimatePresence initial={false}>
                            {gamesExpanded && (
                                <motion.div
                                    className="collection-content"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.22 }}
                                >
                                    <div className="collection-list">
                                        {games.length > 0 ? (
                                            games.map((game) => {
                                                const menuId = `game:${game}`;

                                                return (
                                                    <div className="collection-item-row" key={game}>
                                                        <button
                                                            className={`collection-item ${active === menuId ? "active" : ""}`}
                                                            onClick={() => onChange(menuId)}
                                                            title={game}
                                                        >
                                                            <Gamepad2 size={16} />
                                                            <span>{game}</span>
                                                        </button>

                                                        <button
                                                            className="collection-more-button"
                                                            title="Game options"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                setOpenMenu(openMenu === menuId ? null : menuId);
                                                            }}
                                                        >
                                                            <MoreHorizontal size={17} />
                                                        </button>

                                                        {openMenu === menuId && (
                                                            <div className="collection-context-menu">
                                                                <button
                                                                    className="collection-delete-option"
                                                                    onClick={() => {
                                                                        setOpenMenu(null);
                                                                        setDeleteTarget({
                                                                            type: "game",
                                                                            name: game,
                                                                        });
                                                                    }}
                                                                >
                                                                    <Trash2 size={15} />
                                                                    Delete game
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="collection-empty">
                                                Games will appear here
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* FIXED BOTTOM */}
                <div className="sidebar-bottom">
                    <button
                        className={`nav-item settings-item ${active === "settings" ? "active" : ""}`}
                        onClick={() => onChange("settings")}
                    >
                        {active === "settings" && (
                            <motion.div
                                layoutId="active-nav"
                                className="nav-highlight"
                                transition={{
                                    type: "spring",
                                    stiffness: 380,
                                    damping: 30,
                                }}
                            />
                        )}

                        <Settings size={18} />
                        <span>Settings</span>
                    </button>
                </div>
            </aside>

            {/* DELETE CONFIRMATION */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        className="delete-all-overlay collection-delete-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="delete-all-modal"
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        >
                            <button
                                className="delete-all-close"
                                onClick={() => setDeleteTarget(null)}
                                disabled={isDeleting}
                                aria-label="Close"
                            >
                                <X size={19} />
                            </button>

                            <div className="delete-all-icon">
                                <AlertTriangle size={25} />
                            </div>

                            <h2>
                                Delete {deleteTarget.type}?
                            </h2>

                            <p>
                                Are you sure you want to delete{" "}
                                <strong>{deleteTarget.name}</strong>?
                            </p>

                            <div className="delete-all-warning">
                                <strong>This action cannot be undone.</strong>
                                <span>
                                    {deleteTarget.type === "album"
                                        ? "The album will be deleted, but all screenshots inside it will remain in your archive."
                                        : "The game will be removed from your library. Its screenshots will remain, but their game assignment will be cleared."}
                                </span>
                            </div>

                            <div className="delete-all-actions">
                                <button
                                    className="delete-all-cancel"
                                    onClick={() => setDeleteTarget(null)}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="delete-all-confirm"
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                >
                                    <Trash2 size={16} />
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
