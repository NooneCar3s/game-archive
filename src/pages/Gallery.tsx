
import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import AlbumPickerModal from "../components/AlbumPickerModal";
import GamePickerModal from "../components/GamePickerModal";
import DeleteScreenshotModal from "../components/DeleteScreenshotModal";
import { VirtuosoGrid } from "react-virtuoso";

import ScreenshotCard, {
    type Screenshot,
    type ScreenshotAction,
} from "../components/ScreenshotCard";

import ScreenshotViewer from "../components/ScreenshotViewer";

import {
    initializeDatabase,
    getScreenshotsPage,
    getAlbums,
    toggleScreenshotFavorite,
    setScreenshotAlbum,
    updateScreenshotGame,
    deleteScreenshot,
    type AlbumRecord,
} from "../lib/database";

type GalleryProps = {
    query: string;
    active: string;
    refreshKey: number;
    onSidebarRefresh: () => Promise<void>;
};

type GalleryAction =
    | { type: "album"; screenshot: Screenshot }
    | { type: "game"; screenshot: Screenshot }
    | { type: "delete"; screenshot: Screenshot }
    | null;

export default function Gallery({
    query,
    active,
    refreshKey,
    onSidebarRefresh,
}: GalleryProps) {
    const PAGE_SIZE = 40;

    const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
    const [albums, setAlbums] = useState<AlbumRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [, setLoadingMore] = useState(false);
    const [, setTotalScreenshots] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);
    const loadingMoreRef = useRef(false);

    const [selectedScreenshot, setSelectedScreenshot] =
        useState<Screenshot | null>(null);

    const [galleryAction, setGalleryAction] = useState<GalleryAction>(null);


    const loadScreenshots = async () => {
        try {
            await initializeDatabase();

            const filters = {
                ...(active.startsWith("album:")
                    ? { albumId: active.slice("album:".length) }
                    : {}),
                ...(active.startsWith("game:")
                    ? { game: active.slice("game:".length) }
                    : {}),
                ...(active === "favorites"
                    ? { favoritesOnly: true }
                    : {}),
                ...(query.trim()
                    ? { search: query.trim() }
                    : {}),
            };

            const pageSize = active === "recent" ? 3 : PAGE_SIZE;

            const [page, albumRecords] = await Promise.all([
                getScreenshotsPage(filters, pageSize, 0),
                getAlbums(),
            ]);

            const formatted: Screenshot[] = page.items.map((record) => {
                const date = record.imported_at
                    ? new Date(`${record.imported_at.replace(" ", "T")}Z`)
                    : new Date();

                return {
                    id: record.id,
                    title: record.file_name,
                    game: record.game || "Unknown game",
                    date: date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                    }).toUpperCase(),
                    image: record.file_path,
                    thumbnail: record.thumbnail_path || record.file_path,
                    aspect: "wide",
                    favorite: record.is_favorite === 1,
                    albumId: record.album_id,
                };
            });

            setScreenshots(formatted);
            setAlbums(albumRecords);
            setTotalScreenshots(
                active === "recent"
                    ? Math.min(page.total, 3)
                    : page.total
            );
            setHasMore(
                active !== "recent" &&
                formatted.length < page.total
            );
        } catch (error) {
            console.error("Failed to load screenshots:", error);
        } finally {
            setLoading(false);
        }
    };


    const loadMoreScreenshots = async () => {
        if (loading || loadingMoreRef.current || !hasMore) return;

        loadingMoreRef.current = true;
        setLoadingMore(true);

        try {
            const filters = {
                ...(active.startsWith("album:")
                    ? { albumId: active.slice("album:".length) }
                    : {}),
                ...(active.startsWith("game:")
                    ? { game: active.slice("game:".length) }
                    : {}),
                ...(active === "favorites"
                    ? { favoritesOnly: true }
                    : {}),
                ...(query.trim()
                    ? { search: query.trim() }
                    : {}),
            };

            const page = await getScreenshotsPage(
                filters,
                PAGE_SIZE,
                screenshots.length
            );

            const formatted: Screenshot[] = page.items.map((record) => {
                const date = record.imported_at
                    ? new Date(`${record.imported_at.replace(" ", "T")}Z`)
                    : new Date();

                return {
                    id: record.id,
                    title: record.file_name,
                    game: record.game || "Unknown game",
                    date: date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                    }).toUpperCase(),
                    image: record.file_path,
                    thumbnail: record.thumbnail_path || record.file_path,
                    aspect: "wide",
                    favorite: record.is_favorite === 1,
                    albumId: record.album_id,
                };
            });

            setScreenshots((current) => [...current, ...formatted]);
            setHasMore(screenshots.length + formatted.length < page.total);
        } catch (error) {
            console.error("Failed to load more screenshots:", error);
        } finally {
            loadingMoreRef.current = false;
            setLoadingMore(false);
        }
    };



    useEffect(() => {
        setLoading(true);
        setLoadingMore(false);
        setSelectedScreenshot(null);
        setGalleryAction(null);
        setScreenshots([]);
        setHasMore(true);

        loadScreenshots();
    }, [refreshKey, active, query]);



    const filtered = useMemo(() => {
        return screenshots.filter((item, index) => {
            const matchesSearch =
                `${item.title} ${item.game}`
                    .toLowerCase()
                    .includes(query.toLowerCase());

            const matchesFavorites =
                active !== "favorites" || item.favorite;

            const matchesRecent =
                active !== "recent" || index < 3;

            return matchesSearch && matchesFavorites && matchesRecent;
        });
    }, [screenshots, query, active]);

    const toggleFavorite = async (id: string) => {
        const screenshot = screenshots.find((item) => item.id === id);

        if (!screenshot) return;

        const newFavorite = !screenshot.favorite;

        setScreenshots((current) =>
            current.map((item) =>
                item.id === id ? { ...item, favorite: newFavorite } : item
            )
        );

        setSelectedScreenshot((current) =>
            current?.id === id
                ? { ...current, favorite: newFavorite }
                : current
        );

        try {
            await toggleScreenshotFavorite(id, newFavorite);
        } catch (error) {
            console.error("Failed to update favorite:", error);

            setScreenshots((current) =>
                current.map((item) =>
                    item.id === id ? { ...item, favorite: !newFavorite } : item
                )
            );

            setSelectedScreenshot((current) =>
                current?.id === id
                    ? { ...current, favorite: !newFavorite }
                    : current
            );
        }
    };

    const handleSetAlbum = async (
        screenshotId: string,
        albumId: string | null
    ) => {
        try {
            await setScreenshotAlbum(screenshotId, albumId);

            setScreenshots((current) =>
                current.map((item) =>
                    item.id === screenshotId ? { ...item, albumId } : item
                )
            );

            setSelectedScreenshot((current) =>
                current?.id === screenshotId
                    ? { ...current, albumId }
                    : current
            );

            if (
                active.startsWith("album:") &&
                active.slice("album:".length) !== albumId
            ) {
                setSelectedScreenshot(null);

                setScreenshots((current) =>
                    current.filter((item) => item.id !== screenshotId)
                );
            }
        } catch (error) {
            console.error("Failed to update screenshot album:", error);
            throw error;
        }
    };

    const handleUpdateGame = async (
        screenshotId: string,
        game: string | null
    ) => {
        try {
            await updateScreenshotGame(screenshotId, game);
            await onSidebarRefresh();

            const updatedGame = game || "Unknown game";

            setScreenshots((current) =>
                current.map((item) =>
                    item.id === screenshotId
                        ? { ...item, game: updatedGame }
                        : item
                )
            );

            setSelectedScreenshot((current) =>
                current?.id === screenshotId
                    ? { ...current, game: updatedGame }
                    : current
            );

            // If the screenshot no longer belongs to the selected game,
            // remove it from the visible gallery.
            if (
                active.startsWith("game:") &&
                active.slice("game:".length) !== updatedGame
            ) {
                setSelectedScreenshot(null);

                setScreenshots((current) =>
                    current.filter((item) => item.id !== screenshotId)
                );
            }

            setGalleryAction(null);
        } catch (error) {
            console.error("Failed to update screenshot game:", error);
            throw error;
        }
    };

    const handleDeleteScreenshot = async (screenshot: Screenshot) => {
        try {
            // Delete the physical image first.
            await invoke("delete_screenshot_file", {
                filePath: screenshot.image,
            });

            // Only remove the database record after file deletion succeeds.
            await deleteScreenshot(screenshot.id);

            setScreenshots((current) =>
                current.filter((item) => item.id !== screenshot.id)
            );

            setSelectedScreenshot((current) =>
                current?.id === screenshot.id ? null : current
            );

            setGalleryAction(null);
        } catch (error) {
            console.error("Failed to delete screenshot:", error);
            alert("Не удалось удалить скриншот. Подробности в консоли.");
        }
    };

    const handleRemoveFromAlbum = async (screenshot: Screenshot) => {
        if (!screenshot.albumId) return;

        await handleSetAlbum(screenshot.id, null);
        setGalleryAction(null);
    };

    const handlePrevious = () => {
        if (!selectedScreenshot || filtered.length === 0) return;

        const index = filtered.findIndex(
            (item) => item.id === selectedScreenshot.id
        );

        const previousIndex =
            (index - 1 + filtered.length) % filtered.length;

        setSelectedScreenshot(filtered[previousIndex]);
    };

    const handleNext = () => {
        if (!selectedScreenshot || filtered.length === 0) return;

        const index = filtered.findIndex(
            (item) => item.id === selectedScreenshot.id
        );

        const nextIndex = (index + 1) % filtered.length;

        setSelectedScreenshot(filtered[nextIndex]);
    };

    const heading =
        active === "favorites"
            ? "Your favorites"
            : active === "recent"
                ? "Recently added"
                : active.startsWith("album:")
                    ? albums.find(
                        (album) => album.id === active.slice("album:".length)
                    )?.name || "Album"
                    : active.startsWith("game:")
                        ? active.slice("game:".length)
                        : "All screenshots";
    const handleCardAction = (
        action: ScreenshotAction,
        screenshot: Screenshot
    ) => {
        if (action === "remove-album") {
            handleRemoveFromAlbum(screenshot);
            return;
        }

        setGalleryAction({
            type: action,
            screenshot,
        });
    };

    const handleSelectAlbum = async (albumId: string | null) => {
        if (!galleryAction || galleryAction.type !== "album") return;

        await handleSetAlbum(galleryAction.screenshot.id, albumId);
        setGalleryAction(null);
    };

    const handleSaveGame = async (game: string | null) => {
        if (!galleryAction || galleryAction.type !== "game") return;

        await handleUpdateGame(galleryAction.screenshot.id, game);
    };

    return (
        <section className="gallery-page" ref={setScrollParent}>
            <div className="gallery-heading">
                <div>
                    <div className="eyebrow">
                        <Sparkles size={13} />
                        YOUR PERSONAL GAME WORLD
                    </div>

                    <h1>{heading}</h1>
                    <p>A collection of moments worth remembering.</p>
                </div>

                <div className="gallery-count">
                    <strong>
                        {filtered.length.toString().padStart(2, "0")}
                    </strong>
                    <span>MEMORIES</span>
                </div>
            </div>

            {loading ? (
                <div className="empty-state">
                    <Sparkles size={28} />
                    <h3>Loading your memories...</h3>
                </div>
            ) : filtered.length > 0 ? (
                scrollParent ? (
                    <VirtuosoGrid
                        customScrollParent={scrollParent}
                        data={filtered}
                        increaseViewportBy={600}
                        endReached={() => {
                            if (hasMore && !loading && !loadingMoreRef.current) {
                                loadMoreScreenshots();
                            }
                        }}
                        listClassName="gallery-grid"
                        itemClassName="gallery-grid-item"
                        itemContent={(_, item) => (
                            <div onClick={() => setSelectedScreenshot(item)}>
                                <ScreenshotCard
                                    item={item}
                                    onFavorite={toggleFavorite}
                                    onAction={handleCardAction}
                                    isInAlbumView={active.startsWith("album:")}
                                />
                            </div>
                        )}
                    />
                ) : null
            ) : (
                <div className="empty-state">
                    <Sparkles size={28} />
                    <h3>No memories found</h3>
                    <p>
                        Try another search or add some screenshots to your archive.
                    </p>
                </div>
            )}

            <ScreenshotViewer
                item={selectedScreenshot}
                onClose={() => setSelectedScreenshot(null)}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onFavorite={toggleFavorite}
                currentIndex={Math.max(
                    0,
                    filtered.findIndex(
                        (item) => item.id === selectedScreenshot?.id
                    )
                )}
                total={filtered.length}
                albums={albums}
                onSetAlbum={handleSetAlbum}
            />
            {galleryAction?.type === "album" && (
                <AlbumPickerModal
                    albums={albums}
                    onSelect={handleSelectAlbum}
                    onClose={() => setGalleryAction(null)}
                />
            )}
            {galleryAction?.type === "game" && (
                <GamePickerModal
                    currentGame={galleryAction.screenshot.game}
                    onSave={handleSaveGame}
                    onClose={() => setGalleryAction(null)}
                />
            )}
            <DeleteScreenshotModal
                open={galleryAction?.type === "delete"}
                onClose={() => setGalleryAction(null)}
                onConfirm={() => {
                    if (galleryAction?.type === "delete") {
                        handleDeleteScreenshot(galleryAction.screenshot);
                    }
                }}
            />
        </section>

    );
}
